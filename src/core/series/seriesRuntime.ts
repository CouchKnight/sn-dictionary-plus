// Runtime glue for series spoiler gating: owns the loaded manifests, the
// per-series prefs and the context of the latest popup, and turns a
// reading context into lookup options. index.js wires it; everything here
// is host-tested against a real (better-sqlite3) user.db.

import type {SqliteDb} from '../dict/sqlite/db';
import type {LookupOptions} from '../lookup';
import type {ManifestParseResult} from './manifest';
import {
  buildSeriesGate,
  DEFAULT_SERIES_PREFS,
  nextFurthest,
  type ReadingContext,
  type SeriesDecision,
  type SeriesMode,
  type SeriesPrefs,
} from './selectLayer';
import {
  mergeManifests,
  readPersistedManifests,
  readSeriesPrefs,
  writePersistedManifests,
  writeSeriesPrefs,
} from './seriesStore';

type Logger = {log: (msg: string) => void; warn: (msg: string) => void};

// What the Settings card shows for one series.
export type SeriesInfo = {
  series: string;
  valid: boolean;
  errors: string[];
  // True when no valid manifest is on disk and the stored copy is used.
  fromStore: boolean;
  layers: string[];
  prefs: SeriesPrefs;
  // The decision for the latest popup's context (furthest unchanged).
  decision: SeriesDecision;
};

export type SeriesRuntime = {
  // Load: merge disk manifests with the stored copies, read prefs.
  init(disk: ManifestParseResult[]): Promise<void>;
  // Lookup options for a context; records it as the latest and raises the
  // furthest-read mark. undefined when there is no series at all.
  optionsFor(ctx: ReadingContext | null): LookupOptions | undefined;
  // Same gate as the latest popup (for its re-lookup).
  latestOptions(): LookupOptions | undefined;
  list(): SeriesInfo[];
  setMode(series: string, mode: SeriesMode, manualLayer?: string | null): Promise<void>;
  resetFurthest(series: string): Promise<void>;
  // Every dict name that is a layer of some series (always labelled).
  isSeriesLayer(sourceName: string): boolean;
};

export const createSeriesRuntime = (deps: {
  getDb: () => SqliteDb | null;
  logger: Logger;
}): SeriesRuntime => {
  let manifests: ManifestParseResult[] = [];
  let fromStore = new Set<string>();
  let prefs: Record<string, SeriesPrefs> = {};
  let latest: ReadingContext | null = null;
  let layerNames = new Set<string>();

  // Writes are chained so they land in order; each one stores the prefs as
  // they are when it runs, so the last write always holds the newest state.
  let writeChain: Promise<void> = Promise.resolve();
  const persistPrefs = (): Promise<void> => {
    writeChain = writeChain.then(() =>
      writeSeriesPrefs(deps.getDb(), prefs, deps.logger).catch(e =>
        deps.logger.warn(`[series] saving prefs failed: ${(e as Error).message}`),
      ),
    );
    return writeChain;
  };

  const prefsOf = (series: string): SeriesPrefs => prefs[series] ?? DEFAULT_SERIES_PREFS;

  const gateFor = (ctx: ReadingContext | null, record: boolean) => {
    const gate = buildSeriesGate(manifests, ctx, prefs);
    if (record) {
      let raised = false;
      for (const d of gate.decisions) {
        deps.logger.log(
          `[series] "${d.series}": ` +
            `${d.showAll ? 'showing all layers' : d.layer === null ? 'hidden' : `showing "${d.layer}"`}` +
            ` (${d.reason})`,
        );
        if (!d.valid) {
          continue;
        }
        const before = prefsOf(d.series).furthest;
        const after = nextFurthest(before, d);
        if (after !== before) {
          prefs = {...prefs, [d.series]: {...prefsOf(d.series), furthest: after}};
          raised = true;
        }
      }
      if (raised) {
        persistPrefs();
      }
    }
    return gate;
  };

  const optionsFor = (ctx: ReadingContext | null): LookupOptions | undefined => {
    latest = ctx;
    if (manifests.length === 0) {
      return undefined;
    }
    return {include: gateFor(ctx, true).include};
  };

  return {
    async init(disk) {
      const db = deps.getDb();
      const [stored, storedPrefs] = await Promise.all([
        readPersistedManifests(db),
        readSeriesPrefs(db),
      ]);
      const merged = mergeManifests(disk, stored);
      manifests = merged.manifests;
      fromStore = new Set(merged.fromStore);
      prefs = storedPrefs;
      layerNames = new Set(
        manifests.flatMap(m => (m.ok ? m.manifest.layers.map(l => l.dict) : m.layerDicts)),
      );
      for (const name of merged.fromStore) {
        deps.logger.warn(
          `[series] no valid manifest on disk for "${name}"; gating with the stored copy`,
        );
      }
      if (merged.changed) {
        await writePersistedManifests(db, merged.toPersist, deps.logger).catch(e =>
          deps.logger.warn(`[series] saving manifests failed: ${(e as Error).message}`),
        );
      }
    },

    optionsFor,

    latestOptions: () => optionsFor(latest),

    list() {
      const gate = gateFor(latest, false);
      return manifests.map((m, i) => {
        const decision = gate.decisions[i];
        return m.ok
          ? {
              series: m.manifest.series,
              valid: true,
              errors: [],
              fromStore: fromStore.has(m.manifest.series),
              layers: m.manifest.layers.map(l => l.dict),
              prefs: prefsOf(m.manifest.series),
              decision,
            }
          : {
              series: m.series,
              valid: false,
              errors: m.errors,
              fromStore: false,
              layers: m.layerDicts,
              prefs: DEFAULT_SERIES_PREFS,
              decision,
            };
      });
    },

    async setMode(series, mode, manualLayer) {
      const current = prefsOf(series);
      prefs = {
        ...prefs,
        [series]: {
          ...current,
          mode,
          manualLayer: manualLayer === undefined ? current.manualLayer : manualLayer,
        },
      };
      await persistPrefs();
    },

    async resetFurthest(series) {
      prefs = {...prefs, [series]: {...prefsOf(series), furthest: null}};
      await persistPrefs();
    },

    isSeriesLayer: name => layerNames.has(name),
  };
};
