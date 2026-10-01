// Persistence for series gating, in user.db's app_settings table (the
// plugin's existing settings store — see sqlite/settings.ts).
//
//   series.prefs     -> JSON {seriesName: {mode, furthest, manualLayer}}
//   series.manifests -> JSON {seriesName: SeriesManifest} — the last
//                       manifest that parsed cleanly, per series
//
// Keeping the last good manifest closes a fail-OPEN gap: layer dicts stay
// imported in their own DBs, so if a *.series.json is later deleted or
// unreadable, gating would otherwise silently stop. A persisted copy keeps
// the series gated (use mode 'off' to show everything on purpose).
//
// Reads are total: a missing row, malformed JSON or a degraded (null)
// user.db yields {} — never a throw.

import type {SqliteDb} from '../dict/sqlite/db';
import {getAppSetting, setAppSetting} from '../dict/sqlite/settings';
import {parseSeriesManifest, type ManifestParseResult, type SeriesManifest} from './manifest';
import {SERIES_MODES, type SeriesMode, type SeriesPrefs} from './selectLayer';

export const SERIES_PREFS_KEY = 'series.prefs';
export const SERIES_MANIFESTS_KEY = 'series.manifests';

type Logger = {warn: (msg: string) => void};

const readJsonObject = async (
  db: SqliteDb | null,
  key: string,
): Promise<Record<string, unknown>> => {
  let raw: string | null;
  try {
    raw = await getAppSetting(db, key);
  } catch {
    return {};
  }
  if (raw === null) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

const sanitizePrefs = (v: unknown): SeriesPrefs => {
  const o = (typeof v === 'object' && v !== null ? v : {}) as Record<string, unknown>;
  const mode = SERIES_MODES.includes(o.mode as SeriesMode)
    ? (o.mode as SeriesMode)
    : 'current';
  const furthest =
    typeof o.furthest === 'number' && Number.isFinite(o.furthest) && o.furthest >= 0
      ? o.furthest
      : null;
  const manualLayer = typeof o.manualLayer === 'string' ? o.manualLayer : null;
  return {mode, furthest, manualLayer};
};

export const readSeriesPrefs = async (
  db: SqliteDb | null,
): Promise<Record<string, SeriesPrefs>> => {
  const raw = await readJsonObject(db, SERIES_PREFS_KEY);
  const out: Record<string, SeriesPrefs> = {};
  for (const [name, v] of Object.entries(raw)) {
    out[name] = sanitizePrefs(v);
  }
  return out;
};

export const writeSeriesPrefs = (
  db: SqliteDb | null,
  prefs: Record<string, SeriesPrefs>,
  logger?: Logger,
): Promise<void> => setAppSetting(db, SERIES_PREFS_KEY, JSON.stringify(prefs), logger);

// Persisted manifests, re-validated on read (a tampered row is dropped).
export const readPersistedManifests = async (
  db: SqliteDb | null,
): Promise<Record<string, SeriesManifest>> => {
  const raw = await readJsonObject(db, SERIES_MANIFESTS_KEY);
  const out: Record<string, SeriesManifest> = {};
  for (const [name, v] of Object.entries(raw)) {
    const parsed = parseSeriesManifest(v);
    if (parsed.ok && parsed.manifest.series === name) {
      out[name] = parsed.manifest;
    }
  }
  return out;
};

export const writePersistedManifests = (
  db: SqliteDb | null,
  manifests: Record<string, SeriesManifest>,
  logger?: Logger,
): Promise<void> =>
  setAppSetting(db, SERIES_MANIFESTS_KEY, JSON.stringify(manifests), logger);

// PURE. Combine the manifests read from disk with the persisted ones:
//   - a valid disk manifest wins and replaces the persisted copy;
//   - an invalid disk manifest stays in the list (it hides its dicts);
//   - a persisted series with NO valid manifest on disk is still gated by
//     its persisted copy (flagged `fromStore`).
// `toPersist` is the updated persisted set (only ever grows or refreshes).
export type MergedManifests = {
  manifests: ManifestParseResult[];
  fromStore: string[];
  toPersist: Record<string, SeriesManifest>;
  changed: boolean;
};

export const mergeManifests = (
  disk: ManifestParseResult[],
  persisted: Record<string, SeriesManifest>,
): MergedManifests => {
  const toPersist: Record<string, SeriesManifest> = {...persisted};
  let changed = false;
  const validOnDisk = new Set<string>();
  for (const r of disk) {
    if (r.ok) {
      validOnDisk.add(r.manifest.series);
      if (JSON.stringify(persisted[r.manifest.series]) !== JSON.stringify(r.manifest)) {
        toPersist[r.manifest.series] = r.manifest;
        changed = true;
      }
    }
  }
  const fromStore = Object.keys(persisted).filter(name => !validOnDisk.has(name));
  const manifests: ManifestParseResult[] = [
    ...disk,
    ...fromStore.map(name => ({ok: true as const, manifest: persisted[name]})),
  ];
  return {manifests, fromStore, toPersist, changed};
};
