import {tryAcquire, release} from '../core/reentrancyGuard';
import type {DictLookup, LookupOptions, LookupResult} from '../core/lookup';
import type {ReadingContext} from '../core/series/selectLayer';
import type {APIResponse, Logger} from '../sdk/types';
import {unwrap} from '../sdk/unwrap';
import {safeClosePluginView, type ClosablePluginView} from '../sdk/closeView';

// Narrow DI surface — same shape style as onNoteLassoDefine.

export type DocAPILike = {
  getLastSelectedText: () => Promise<APIResponse<string>>;
};

// Where the reader is, for series spoiler gating. getCurrentFilePath and
// getCurrentPageNum live on PluginCommAPI, getCurrentTotalPages on
// PluginDocAPI; index.js stitches them together. The page base (0 or 1)
// is undocumented — the raw values are logged so it can be checked on a
// device.
export type ReaderAPILike = {
  getCurrentFilePath: () => Promise<APIResponse<string> | null | undefined>;
  getCurrentPageNum: () => Promise<APIResponse<number> | null | undefined>;
  getCurrentTotalPages: () => Promise<APIResponse<number> | null | undefined>;
};

export type DocDefineDeps = {
  doc: DocAPILike;
  // Optional: without them the lookup runs ungated (tests, older wiring).
  reader?: ReaderAPILike;
  gateFor?: (ctx: ReadingContext) => LookupOptions;
  // PluginManager surface for closing the firmware overlay. Same
  // split as the NOTE handler: closePluginView is NOT on
  // PluginCommAPI, so wiring it through the comm dep would silently
  // resolve to undefined at runtime.
  view: ClosablePluginView;
  lookup: DictLookup;
  showResult: (result: LookupResult) => void;
  logger: Logger;
};

// Each read is independent: one failing leaves that field null, which the
// gate treats as "unknown" (fail closed), and never aborts the lookup.
const readField = async <T>(
  call: () => Promise<APIResponse<T> | null | undefined>,
  name: string,
  logger: Logger,
): Promise<T | null> => {
  try {
    const res = await call();
    if (res && res.success && res.result !== undefined && res.result !== null) {
      return res.result;
    }
    logger.warn(`[doc-define] ${name} failed: ${res?.error?.message ?? 'no result'}`);
  } catch (e) {
    logger.warn(`[doc-define] ${name} threw: ${(e as Error).message}`);
  }
  return null;
};

export const readReadingContext = async (
  reader: ReaderAPILike,
  logger: Logger,
): Promise<ReadingContext> => {
  const filePath = await readField(reader.getCurrentFilePath, 'getCurrentFilePath', logger);
  const page = await readField(reader.getCurrentPageNum, 'getCurrentPageNum', logger);
  const totalPages = await readField(
    reader.getCurrentTotalPages,
    'getCurrentTotalPages',
    logger,
  );
  logger.log(
    `[doc-define] reading context: file=${JSON.stringify(filePath)} ` +
      `page=${JSON.stringify(page)} total=${JSON.stringify(totalPages)}`,
  );
  return {
    filePath: typeof filePath === 'string' ? filePath : null,
    page: typeof page === 'number' ? page : null,
    totalPages: typeof totalPages === 'number' ? totalPages : null,
  };
};

export type DocDefineOutcome = 'ok' | 'busy' | 'no-selection' | 'failed';

export const onDocSelectDefine = async (
  deps: DocDefineDeps,
): Promise<DocDefineOutcome> => {
  // Reuse the same module-level guard as the NOTE handler so tapping
  // Define mid-pipeline (across either context) is rejected cleanly.
  if (!tryAcquire()) {
    deps.logger.warn('[doc-define] pipeline already running — ignoring re-entry');
    await safeClosePluginView(deps.view, deps.logger);
    return 'busy';
  }

  // When the popup is rendered, leave the firmware overlay open and
  // let the popup's own Close button release it. See onNoteLassoDefine
  // for the full rationale.
  let popupShown = false;

  try {
    const selected = unwrap(
      await deps.doc.getLastSelectedText(),
      'getLastSelectedText',
    );
    const text = selected.trim();
    if (text.length === 0) {
      deps.logger.warn('[doc-define] no selection — nothing to define');
      return 'no-selection';
    }
    // Streaming progress: open the popup immediately and re-render as
    // each source resolves. popupShown flips only after the first
    // emission so a synchronous throw inside lookup still closes the
    // plugin view via the finally block.
    // Series gating: work out where the reader is BEFORE the lookup so
    // the spoiler layers they haven't reached are never queried.
    let options: LookupOptions | undefined;
    if (deps.gateFor) {
      const ctx = deps.reader
        ? await readReadingContext(deps.reader, deps.logger)
        : {};
      options = deps.gateFor(ctx);
    }
    const result = await deps.lookup.lookup(
      text,
      snapshot => {
        popupShown = true;
        deps.showResult(snapshot);
      },
      options,
    );
    popupShown = true;
    deps.showResult(result);
    return 'ok';
  } catch (e) {
    deps.logger.error(`[doc-define] pipeline crashed: ${(e as Error).message}`);
    return 'failed';
  } finally {
    // Release the reentrancy flag synchronously before any await; same
    // rationale as the NOTE handler — see src/handlers/onNoteLassoDefine.ts.
    release();
    if (!popupShown) {
      await safeClosePluginView(deps.view, deps.logger);
    }
  }
};
