import {
  onDocSelectDefine,
  type DocDefineDeps,
} from '../src/handlers/onDocSelectDefine';
import {release, tryAcquire} from '../src/core/reentrancyGuard';
import type {LookupResult} from '../src/core/lookup';

const ok = <T>(result: T) => ({success: true, result});
const fail = (message: string) => ({
  success: false,
  error: {code: 1, message},
});

const buildDeps = (
  overrides: Partial<DocDefineDeps> = {},
): DocDefineDeps => {
  const lookupResult: LookupResult = {
    queriedFor: 'hello',
    hits: [{source: 'WordNet', entry: {word: 'hello', definition: 'a greeting'}}],
    loading: [],
  };
  return {
    doc: {
      getLastSelectedText: jest.fn(async () => ok('hello')),
    },
    view: {
      closePluginView: jest.fn(async () => true),
    },
    lookup: {
      lookup: jest.fn(async () => lookupResult),
    },
    showResult: jest.fn(),
    logger: {log: jest.fn(), warn: jest.fn(), error: jest.fn()},
    ...overrides,
  };
};

beforeEach(() => {
  release();
  jest.clearAllMocks();
});

describe('onDocSelectDefine', () => {
  test('happy path: getLastSelectedText → lookup → showResult (no closePluginView — popup owns close)', async () => {
    const deps = buildDeps();
    const outcome = await onDocSelectDefine(deps);
    expect(outcome).toBe('ok');
    expect(deps.doc.getLastSelectedText).toHaveBeenCalledTimes(1);
    expect(deps.lookup.lookup).toHaveBeenCalledWith('hello', expect.any(Function), undefined);
    expect(deps.showResult).toHaveBeenCalledTimes(1);
    expect(deps.showResult).toHaveBeenCalledWith(
      expect.objectContaining({hits: expect.arrayContaining([expect.anything()])}),
    );
    expect(deps.view.closePluginView).not.toHaveBeenCalled();
  });

  test('trims whitespace before passing to lookup', async () => {
    const deps = buildDeps({
      doc: {
        getLastSelectedText: jest.fn(async () => ok('  hello   ')),
      },
    });
    await onDocSelectDefine(deps);
    expect(deps.lookup.lookup).toHaveBeenCalledWith('hello', expect.any(Function), undefined);
  });

  test('empty selection: returns no-selection and still closes plugin view', async () => {
    const deps = buildDeps({
      doc: {
        getLastSelectedText: jest.fn(async () => ok('   ')),
      },
    });
    const outcome = await onDocSelectDefine(deps);
    expect(outcome).toBe('no-selection');
    expect(deps.lookup.lookup).not.toHaveBeenCalled();
    expect(deps.view.closePluginView).toHaveBeenCalled();
  });

  test('reentrancy: when guard is busy, returns busy and closes view without calling SDK', async () => {
    expect(tryAcquire()).toBe(true);
    const deps = buildDeps();
    const outcome = await onDocSelectDefine(deps);
    expect(outcome).toBe('busy');
    expect(deps.doc.getLastSelectedText).not.toHaveBeenCalled();
    expect(deps.lookup.lookup).not.toHaveBeenCalled();
    expect(deps.view.closePluginView).toHaveBeenCalled();
  });

  test('SDK failure: returns failed, releases guard, closes view', async () => {
    const deps = buildDeps({
      doc: {
        getLastSelectedText: jest.fn(async () => fail('boom')),
      },
    });
    const outcome = await onDocSelectDefine(deps);
    expect(outcome).toBe('failed');
    expect(deps.view.closePluginView).toHaveBeenCalled();

    // Subsequent call must succeed (guard was released).
    const next = buildDeps();
    expect(await onDocSelectDefine(next)).toBe('ok');
  });

  test('streaming progress: showResult fires per snapshot emission and once for the final result', async () => {
    // The streaming variant of lookup() invokes the onUpdate callback
    // for the initial empty snapshot and after each source resolves.
    // The handler must forward every snapshot to showResult so the
    // popup renders incrementally instead of waiting for the slowest
    // source.
    const initialSnapshot: LookupResult = {
      queriedFor: 'hello',
      hits: [],
      loading: ['UserA', 'WordNet'],
    };
    const finalSnapshot: LookupResult = {
      queriedFor: 'hello',
      hits: [{source: 'WordNet', entry: {word: 'hello', definition: 'a greeting'}}],
      loading: [],
    };
    const lookup = jest.fn(
      async (
        _t: string,
        onUpdate?: (snap: LookupResult) => void,
      ): Promise<LookupResult> => {
        onUpdate?.(initialSnapshot);
        onUpdate?.(finalSnapshot);
        return finalSnapshot;
      },
    );
    const deps = buildDeps({lookup: {lookup}});
    const outcome = await onDocSelectDefine(deps);
    expect(outcome).toBe('ok');
    expect(deps.showResult).toHaveBeenCalledTimes(3);
    expect((deps.showResult as jest.Mock).mock.calls[0][0]).toEqual(initialSnapshot);
    expect((deps.showResult as jest.Mock).mock.calls[1][0]).toEqual(finalSnapshot);
    expect((deps.showResult as jest.Mock).mock.calls[2][0]).toEqual(finalSnapshot);
    expect(deps.view.closePluginView).not.toHaveBeenCalled();
  });

  test('lookup throws WITHOUT emitting any snapshot: outcome is failed and view is closed', async () => {
    // Defensive path: a custom DictLookup impl that throws before
    // calling onUpdate must not leave popupShown=true (which would
    // skip closePluginView in the finally and leak the host overlay).
    const lookup = jest.fn(async (): Promise<LookupResult> => {
      throw new Error('lookup boom');
    });
    const deps = buildDeps({lookup: {lookup}});
    const outcome = await onDocSelectDefine(deps);
    expect(outcome).toBe('failed');
    expect(deps.showResult).not.toHaveBeenCalled();
    expect(deps.view.closePluginView).toHaveBeenCalled();
  });
});

describe('onDocSelectDefine — series gating', () => {
  const reader = (
    overrides: Partial<NonNullable<DocDefineDeps['reader']>> = {},
  ): NonNullable<DocDefineDeps['reader']> => ({
    getCurrentFilePath: jest.fn(async () =>
      ok('/storage/emulated/0/Document/The_Eye_of_the_Bedlam_Bride.epub'),
    ),
    getCurrentPageNum: jest.fn(async () => ok(120)),
    getCurrentTotalPages: jest.fn(async () => ok(400)),
    ...overrides,
  });

  test('reads the reading context and passes the gate into the lookup', async () => {
    const include = () => true;
    const gateFor = jest.fn(() => ({include}));
    const deps = buildDeps({reader: reader(), gateFor});
    expect(await onDocSelectDefine(deps)).toBe('ok');
    expect(gateFor).toHaveBeenCalledWith({
      filePath: '/storage/emulated/0/Document/The_Eye_of_the_Bedlam_Bride.epub',
      page: 120,
      totalPages: 400,
    });
    expect(deps.lookup.lookup).toHaveBeenCalledWith('hello', expect.any(Function), {
      include,
    });
    // Raw values are logged for on-device verification of the page base.
    expect(deps.logger.log).toHaveBeenCalledWith(
      expect.stringContaining('page=120 total=400'),
    );
  });

  test('the context is read before the lookup runs', async () => {
    const order: string[] = [];
    const deps = buildDeps({
      reader: reader({
        getCurrentPageNum: jest.fn(async () => {
          order.push('page');
          return ok(1);
        }),
      }),
      gateFor: () => {
        order.push('gate');
        return {};
      },
      lookup: {
        lookup: jest.fn(async () => {
          order.push('lookup');
          return {queriedFor: 'hello', hits: [], loading: []};
        }),
      },
    });
    await onDocSelectDefine(deps);
    expect(order).toEqual(['page', 'gate', 'lookup']);
  });

  test('a failing or throwing reader call yields null for that field, lookup still runs', async () => {
    const gateFor = jest.fn(() => ({}));
    const deps = buildDeps({
      reader: reader({
        getCurrentFilePath: jest.fn(async () => fail('no file')),
        getCurrentPageNum: jest.fn(async () => {
          throw new Error('boom');
        }),
        getCurrentTotalPages: jest.fn(async () => null),
      }),
      gateFor,
    });
    expect(await onDocSelectDefine(deps)).toBe('ok');
    expect(gateFor).toHaveBeenCalledWith({filePath: null, page: null, totalPages: null});
    expect(deps.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('getCurrentFilePath failed: no file'),
    );
    expect(deps.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('getCurrentPageNum threw: boom'),
    );
    expect(deps.lookup.lookup).toHaveBeenCalledTimes(1);
  });

  test('wrong-typed results are treated as unknown', async () => {
    const gateFor = jest.fn(() => ({}));
    const deps = buildDeps({
      reader: reader({
        getCurrentFilePath: jest.fn(async () => ok(42 as unknown as string)),
        getCurrentPageNum: jest.fn(async () => ok('7' as unknown as number)),
      }),
      gateFor,
    });
    await onDocSelectDefine(deps);
    expect(gateFor).toHaveBeenCalledWith({filePath: null, page: null, totalPages: 400});
  });

  test('gateFor without a reader gates on an empty context (fail closed)', async () => {
    const gateFor = jest.fn(() => ({}));
    const deps = buildDeps({gateFor});
    await onDocSelectDefine(deps);
    expect(gateFor).toHaveBeenCalledWith({});
  });

  test('no gateFor: the reader is never touched', async () => {
    const r = reader();
    const deps = buildDeps({reader: r});
    await onDocSelectDefine(deps);
    expect(r.getCurrentFilePath).not.toHaveBeenCalled();
    expect(deps.lookup.lookup).toHaveBeenCalledWith('hello', expect.any(Function), undefined);
  });

  test('no selection: the reader is never touched', async () => {
    const r = reader();
    const deps = buildDeps({
      reader: r,
      gateFor: jest.fn(() => ({})),
      doc: {getLastSelectedText: jest.fn(async () => ok('   '))},
    });
    expect(await onDocSelectDefine(deps)).toBe('no-selection');
    expect(r.getCurrentFilePath).not.toHaveBeenCalled();
  });
});
