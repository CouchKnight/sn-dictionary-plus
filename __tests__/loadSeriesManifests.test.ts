import {
  isSeriesManifestName,
  loadSeriesManifests,
  parseManifestText,
} from '../src/core/series/loadManifests';

const ROOT = '/storage/emulated/0/MyStyle/SnDictPlus';

const VALID = JSON.stringify({
  series: 'Dungeon Crawler Carl',
  books: [{n: 1, title: 'Dungeon Crawler Carl', match: ['dungeon crawler carl']}],
  layers: [{dict: 'DCC thru Book 1', covers: 1}],
});

const fetchFrom =
  (files: Record<string, string | number>): typeof fetch =>
  (async (url: string) => {
    const body = files[url.replace('file://', '')];
    if (typeof body === 'number') {
      return {ok: false, status: body} as Response;
    }
    if (body === undefined) {
      throw new Error(`no such file ${url}`);
    }
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => new TextEncoder().encode(body).buffer,
    } as unknown as Response;
  }) as unknown as typeof fetch;

const logger = () => ({log: jest.fn(), warn: jest.fn()});

describe('isSeriesManifestName', () => {
  test.each([
    ['dcc.series.json', true],
    ['DCC.SERIES.JSON', true],
    ['meta.json', false],
    ['dcc.series.json.bak', false],
    ['Dune.csv', false],
  ])('%s -> %p', (name, expected) => {
    expect(isSeriesManifestName(name)).toBe(expected);
  });
});

describe('parseManifestText', () => {
  test('parses a valid manifest, tolerating a UTF-8 BOM', () => {
    const r = parseManifestText('﻿' + VALID);
    expect(r.ok).toBe(true);
  });

  test('broken JSON is invalid but still yields the dict names it mentions', () => {
    const r = parseManifestText(
      '{"series": "DCC", "layers": [{"dict": "DCC thru Book 5", "covers": 5}, {"dict": "DCC \\"8\\"", covers: 8}',
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors[0]).toContain('not valid JSON');
      expect(r.layerDicts).toEqual(['DCC thru Book 5', 'DCC \\"8\\"']);
    }
  });

  test('blank scraped dict names are dropped', () => {
    const r = parseManifestText('{"layers": [{"dict": "  "}, {"dict": "A"}');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.layerDicts).toEqual(['A']);
    }
  });
});

describe('loadSeriesManifests', () => {
  test('reads only *.series.json files at the root', async () => {
    const log = logger();
    const results = await loadSeriesManifests({
      rootPath: ROOT,
      fileUtils: {
        exists: async () => true,
        listFiles: async () => [
          {path: `${ROOT}/dcc.series.json`, type: 1},
          {path: `${ROOT}/DCC-Book-5`, type: 0},
          {path: `${ROOT}/Dune.csv`, type: 1},
          {path: `${ROOT}/folder.series.json`, type: 0},
        ],
      },
      fetchFn: fetchFrom({[`${ROOT}/dcc.series.json`]: VALID}),
      logger: log,
    });
    expect(results).toHaveLength(1);
    expect(results[0].ok).toBe(true);
    expect(log.log).toHaveBeenCalledWith(
      expect.stringContaining('loaded "Dungeon Crawler Carl"'),
    );
  });

  test('bare file names are resolved against the root', async () => {
    const results = await loadSeriesManifests({
      rootPath: ROOT,
      fileUtils: {
        exists: async () => true,
        listFiles: async () => [{path: 'dcc.series.json', type: 1}],
      },
      fetchFn: fetchFrom({[`${ROOT}/dcc.series.json`]: VALID}),
    });
    expect(results[0].ok).toBe(true);
  });

  test('invalid and unreadable manifests are returned as invalid and warned about', async () => {
    const log = logger();
    const results = await loadSeriesManifests({
      rootPath: ROOT,
      fileUtils: {
        exists: async () => true,
        listFiles: async () => [
          {path: `${ROOT}/bad.series.json`, type: 1},
          {path: `${ROOT}/gone.series.json`, type: 1},
          {path: `${ROOT}/denied.series.json`, type: 1},
        ],
      },
      fetchFn: fetchFrom({
        [`${ROOT}/bad.series.json`]: '{"series": "X", "layers": [{"dict": "X1", "covers": -1}]}',
        [`${ROOT}/denied.series.json`]: 403,
      }),
      logger: log,
    });
    expect(results.map(r => r.ok)).toEqual([false, false, false]);
    expect(results[0]).toEqual(expect.objectContaining({series: 'X', layerDicts: ['X1']}));
    expect(log.warn).toHaveBeenCalledTimes(3);
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('status 403'));
  });

  test('an unlistable or empty root yields []', async () => {
    const log = logger();
    expect(
      await loadSeriesManifests({
        rootPath: ROOT,
        fileUtils: {
          exists: async () => false,
          listFiles: async () => {
            throw new Error('ENOENT');
          },
        },
        logger: log,
      }),
    ).toEqual([]);
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('not listable: ENOENT'));
    expect(
      await loadSeriesManifests({
        rootPath: ROOT,
        fileUtils: {exists: async () => true, listFiles: async () => null},
      }),
    ).toEqual([]);
  });
});
