import {createSeededDb} from './_helpers/betterSqliteDb';
import {ensureSettingsTables, getAppSetting, setAppSetting} from '../src/core/dict/sqlite/settings';
import type {SqliteDb} from '../src/core/dict/sqlite/db';
import {
  mergeManifests,
  readPersistedManifests,
  readSeriesPrefs,
  SERIES_MANIFESTS_KEY,
  SERIES_PREFS_KEY,
  writePersistedManifests,
  writeSeriesPrefs,
} from '../src/core/series/seriesStore';
import {createSeriesRuntime} from '../src/core/series/seriesRuntime';
import type {ManifestParseResult, SeriesManifest} from '../src/core/series/manifest';

const freshDb = (): Promise<SqliteDb> =>
  createSeededDb(async db => {
    await ensureSettingsTables(db);
  });

const DCC: SeriesManifest = {
  series: 'Dungeon Crawler Carl',
  books: [
    {n: 1, title: 'Dungeon Crawler Carl', match: ['dungeon crawler carl']},
    {n: 6, title: 'The Eye of the Bedlam Bride', match: ['bedlam bride']},
  ],
  layers: [1, 5, 6].map(n => ({dict: `DCC thru Book ${n}`, covers: n})),
};
const OTHER: SeriesManifest = {
  series: 'Other',
  books: [{n: 1, title: 'Other', match: ['other']}],
  layers: [{dict: 'Other 1', covers: 1}],
};
const ok = (manifest: SeriesManifest): ManifestParseResult => ({ok: true, manifest});
const bedlam = {filePath: '/x/The Eye of the Bedlam Bride.epub', page: 120, totalPages: 400};

describe('seriesStore — prefs', () => {
  test('round-trips prefs', async () => {
    const db = await freshDb();
    await writeSeriesPrefs(db, {
      [DCC.series]: {mode: 'furthest', furthest: 5.3, manualLayer: null},
    });
    expect(await readSeriesPrefs(db)).toEqual({
      [DCC.series]: {mode: 'furthest', furthest: 5.3, manualLayer: null},
    });
  });

  test('absent, malformed or non-object rows read as {}', async () => {
    const db = await freshDb();
    expect(await readSeriesPrefs(db)).toEqual({});
    await setAppSetting(db, SERIES_PREFS_KEY, '{not json');
    expect(await readSeriesPrefs(db)).toEqual({});
    await setAppSetting(db, SERIES_PREFS_KEY, '[1,2]');
    expect(await readSeriesPrefs(db)).toEqual({});
  });

  test('bad fields are sanitised to defaults', async () => {
    const db = await freshDb();
    await setAppSetting(
      db,
      SERIES_PREFS_KEY,
      JSON.stringify({A: {mode: 'weird', furthest: -1, manualLayer: 5}, B: null}),
    );
    const blank = {mode: 'current', furthest: null, manualLayer: null};
    expect(await readSeriesPrefs(db)).toEqual({A: blank, B: blank});
  });

  test('a null (degraded) user.db reads {} and writes nothing', async () => {
    const warn = jest.fn();
    expect(await readSeriesPrefs(null)).toEqual({});
    await writeSeriesPrefs(null, {}, {warn});
    expect(warn).toHaveBeenCalled();
  });

  test('a throwing read degrades to {}', async () => {
    const db = {query: jest.fn(async () => { throw new Error('locked'); })} as unknown as SqliteDb;
    expect(await readSeriesPrefs(db)).toEqual({});
  });
});

describe('seriesStore — manifests', () => {
  test('round-trips manifests and drops tampered or mislabelled rows', async () => {
    const db = await freshDb();
    await writePersistedManifests(db, {[DCC.series]: DCC});
    expect(await readPersistedManifests(db)).toEqual({[DCC.series]: DCC});
    await setAppSetting(
      db,
      SERIES_MANIFESTS_KEY,
      JSON.stringify({[DCC.series]: DCC, Bad: {series: 'Bad'}, Wrong: OTHER}),
    );
    expect(await readPersistedManifests(db)).toEqual({[DCC.series]: DCC});
  });
});

describe('mergeManifests', () => {
  test('a valid disk manifest wins and is persisted', () => {
    const changedDcc = {...DCC, layers: [{dict: 'DCC thru Book 8', covers: 8}]};
    const r = mergeManifests([ok(changedDcc)], {[DCC.series]: DCC});
    expect(r.manifests).toEqual([ok(changedDcc)]);
    expect(r.fromStore).toEqual([]);
    expect(r.toPersist).toEqual({[DCC.series]: changedDcc});
    expect(r.changed).toBe(true);
  });

  test('an unchanged disk manifest is not rewritten', () => {
    const r = mergeManifests([ok(DCC)], {[DCC.series]: DCC});
    expect(r.changed).toBe(false);
  });

  test('a series missing from disk is gated by its stored copy', () => {
    const r = mergeManifests([ok(OTHER)], {[DCC.series]: DCC});
    expect(r.fromStore).toEqual([DCC.series]);
    expect(r.manifests).toEqual([ok(OTHER), ok(DCC)]);
    expect(r.toPersist).toEqual({[DCC.series]: DCC, Other: OTHER});
  });

  test('an invalid disk manifest keeps hiding its dicts and the stored copy still gates', () => {
    const bad: ManifestParseResult = {
      ok: false,
      series: DCC.series,
      errors: ['x'],
      layerDicts: ['DCC thru Book 5'],
    };
    const r = mergeManifests([bad], {[DCC.series]: DCC});
    expect(r.manifests).toEqual([bad, ok(DCC)]);
    expect(r.changed).toBe(false);
  });
});

describe('createSeriesRuntime', () => {
  const logger = () => ({log: jest.fn(), warn: jest.fn()});

  test('no manifests anywhere: no gating', async () => {
    const db = await freshDb();
    const rt = createSeriesRuntime({getDb: () => db, logger: logger()});
    await rt.init([]);
    expect(rt.optionsFor(bedlam)).toBeUndefined();
    expect(rt.list()).toEqual([]);
    expect(rt.isSeriesLayer('DCC thru Book 5')).toBe(false);
  });

  test('init persists a disk manifest; a later launch without it still gates', async () => {
    const db = await freshDb();
    const log = logger();
    await createSeriesRuntime({getDb: () => db, logger: log}).init([ok(DCC)]);
    expect(JSON.parse((await getAppSetting(db, SERIES_MANIFESTS_KEY)) as string)).toEqual({
      [DCC.series]: DCC,
    });

    const next = createSeriesRuntime({getDb: () => db, logger: log});
    await next.init([]);
    const opts = next.optionsFor(null);
    expect(opts?.include?.('DCC thru Book 6')).toBe(false);
    expect(opts?.include?.('DCC thru Book 1')).toBe(true);
    expect(next.list()[0].fromStore).toBe(true);
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('gating with the stored copy'));
  });

  test('a DOC lookup raises the furthest mark, a NOTE lasso then uses it', async () => {
    const db = await freshDb();
    const log = logger();
    const rt = createSeriesRuntime({getDb: () => db, logger: log});
    await rt.init([ok(DCC)]);

    const doc = rt.optionsFor(bedlam);
    expect(doc?.include?.('DCC thru Book 5')).toBe(true);
    expect(doc?.include?.('DCC thru Book 6')).toBe(false);
    expect(log.log).toHaveBeenCalledWith(expect.stringContaining('showing "DCC thru Book 5"'));

    const note = rt.optionsFor(null);
    expect(note?.include?.('DCC thru Book 5')).toBe(true);
    expect(note?.include?.('DCC thru Book 1')).toBe(false);

    await rt.setMode(DCC.series, 'current'); // flushes the write chain
    expect((await readSeriesPrefs(db))[DCC.series].furthest).toBeCloseTo(5.3);
  });

  test('the furthest mark never goes down', async () => {
    const db = await freshDb();
    const rt = createSeriesRuntime({getDb: () => db, logger: logger()});
    await rt.init([ok(DCC)]);
    rt.optionsFor(bedlam);
    rt.optionsFor({filePath: '/x/Dungeon Crawler Carl.epub', page: 1, totalPages: 10});
    expect(rt.list()[0].prefs.furthest).toBeCloseTo(5.3);
  });

  test('latestOptions reuses the latest context', async () => {
    const db = await freshDb();
    const rt = createSeriesRuntime({getDb: () => db, logger: logger()});
    await rt.init([ok(DCC)]);
    rt.optionsFor({filePath: '/x/Dungeon Crawler Carl.epub', page: 10, totalPages: 10});
    expect(rt.latestOptions()?.include?.('DCC thru Book 1')).toBe(true);
    expect(rt.list()[0].decision.book).toBe(1);
  });

  test('setMode and resetFurthest apply immediately and persist', async () => {
    const db = await freshDb();
    const rt = createSeriesRuntime({getDb: () => db, logger: logger()});
    await rt.init([ok(DCC)]);
    rt.optionsFor(bedlam);

    await rt.setMode(DCC.series, 'manual', 'DCC thru Book 1');
    expect(rt.optionsFor(bedlam)?.include?.('DCC thru Book 1')).toBe(true);
    await rt.setMode(DCC.series, 'off');
    expect(rt.list()[0].prefs).toEqual(
      expect.objectContaining({mode: 'off', manualLayer: 'DCC thru Book 1'}),
    );
    expect(rt.list()[0].decision.showAll).toBe(true);

    await rt.resetFurthest(DCC.series);
    expect(rt.list()[0].prefs.furthest).toBeNull();
    expect((await readSeriesPrefs(db))[DCC.series]).toEqual({
      mode: 'off',
      furthest: null,
      manualLayer: 'DCC thru Book 1',
    });
  });

  test('list reports an invalid manifest and its layer names count as series layers', async () => {
    const db = await freshDb();
    const rt = createSeriesRuntime({getDb: () => db, logger: logger()});
    await rt.init([{ok: false, series: 'Broken', errors: ['bad'], layerDicts: ['B1']}]);
    expect(rt.list()).toEqual([
      expect.objectContaining({series: 'Broken', valid: false, errors: ['bad'], layers: ['B1']}),
    ]);
    expect(rt.isSeriesLayer('B1')).toBe(true);
    expect(rt.optionsFor(null)?.include?.('B1')).toBe(false);
  });

  test('a failing prefs write is warned about, not thrown', async () => {
    const db = await freshDb();
    const log = logger();
    const rt = createSeriesRuntime({getDb: () => db, logger: log});
    await rt.init([ok(DCC)]);
    jest.spyOn(db, 'run').mockRejectedValue(new Error('disk full'));
    await rt.setMode(DCC.series, 'furthest');
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('saving prefs failed: disk full'));
  });

  test('a failing manifest write is warned about, not thrown', async () => {
    const db = await freshDb();
    const log = logger();
    jest.spyOn(db, 'run').mockRejectedValue(new Error('read-only'));
    await createSeriesRuntime({getDb: () => db, logger: log}).init([ok(DCC)]);
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('saving manifests failed: read-only'));
  });
});
