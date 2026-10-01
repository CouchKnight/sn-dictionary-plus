import {buildDictRows, moveDictRow, toggleDictRow} from '../src/ui/dictRows';
import type {DictPref} from '../src/core/dict/sqlite/settings';

const pref = (name: string, over: Partial<DictPref> = {}): DictPref => ({
  prefKey: `k:${name}`,
  name,
  enabled: true,
  sortOrder: 0,
  removable: true,
  ...over,
});

const seriesOf = (name: string) => (name.startsWith('DCC') ? 'DCC' : null);
const names = (prefs: DictPref[]) => prefs.map(p => p.name);

describe('buildDictRows', () => {
  test('collapses every layer of a series into one row at its first position', () => {
    const prefs = [pref('Mine'), pref('DCC 1'), pref('WordNet', {removable: false}), pref('DCC 2')];
    const rows = buildDictRows(prefs, seriesOf);
    expect(rows.map(r => (r.kind === 'dict' ? r.pref.name : `[${r.series}]`))).toEqual([
      'Mine',
      '[DCC]',
      'WordNet',
    ]);
    expect(rows[1]).toEqual(
      expect.objectContaining({kind: 'series', indices: [1, 3], enabled: 'all', removable: true}),
    );
  });

  test('series enablement is all / some / none, and removable only if every layer is', () => {
    const some = buildDictRows([pref('DCC 1'), pref('DCC 2', {enabled: false})], seriesOf)[0];
    const none = buildDictRows([pref('DCC 1', {enabled: false})], seriesOf)[0];
    const fixed = buildDictRows([pref('DCC 1'), pref('DCC 2', {removable: false})], seriesOf)[0];
    expect(some).toEqual(expect.objectContaining({enabled: 'some'}));
    expect(none).toEqual(expect.objectContaining({enabled: 'none'}));
    expect(fixed).toEqual(expect.objectContaining({removable: false}));
  });

  test('no series: one row per dict', () => {
    const prefs = [pref('A'), pref('B')];
    expect(buildDictRows(prefs, () => null).map(r => r.kind)).toEqual(['dict', 'dict']);
  });
});

describe('moveDictRow', () => {
  const prefs = [pref('Mine'), pref('DCC 1'), pref('WordNet'), pref('DCC 2')];
  const rows = buildDictRows(prefs, seriesOf);

  test('moves a series as a block, making its layers contiguous', () => {
    expect(names(moveDictRow(prefs, rows, 1, -1))).toEqual(['DCC 1', 'DCC 2', 'Mine', 'WordNet']);
    expect(names(moveDictRow(prefs, rows, 1, 1))).toEqual(['Mine', 'WordNet', 'DCC 1', 'DCC 2']);
  });

  test('moves a plain dict past a series block', () => {
    expect(names(moveDictRow(prefs, rows, 2, -1))).toEqual(['Mine', 'WordNet', 'DCC 1', 'DCC 2']);
  });

  test('out-of-range moves change nothing', () => {
    expect(moveDictRow(prefs, rows, 0, -1)).toBe(prefs);
    expect(moveDictRow(prefs, rows, 2, 1)).toBe(prefs);
    expect(moveDictRow(prefs, rows, 9, -1)).toBe(prefs);
  });
});

describe('toggleDictRow', () => {
  test('a dict row flips itself only', () => {
    const prefs = [pref('Mine'), pref('DCC 1')];
    const rows = buildDictRows(prefs, seriesOf);
    expect(toggleDictRow(prefs, rows[0]).map(p => p.enabled)).toEqual([false, true]);
  });

  test('a series row turns every layer off when all are on, otherwise on', () => {
    const all = [pref('DCC 1'), pref('DCC 2')];
    expect(toggleDictRow(all, buildDictRows(all, seriesOf)[0]).map(p => p.enabled)).toEqual([
      false,
      false,
    ]);
    const some = [pref('DCC 1'), pref('DCC 2', {enabled: false})];
    expect(toggleDictRow(some, buildDictRows(some, seriesOf)[0]).map(p => p.enabled)).toEqual([
      true,
      true,
    ]);
  });
});
