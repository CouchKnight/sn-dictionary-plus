// Display rows for the Settings dictionary list. Every layer dict of one
// book series (32 for DCC: four per book) collapses into ONE row, so the
// list stays one row per series. PURE — the panel renders the rows and
// turns row edits back into a DictPref[] with these helpers.

import type {DictPref} from '../core/dict/sqlite/settings';

export type DictRow =
  | {kind: 'dict'; key: string; index: number; pref: DictPref}
  | {
      kind: 'series';
      key: string;
      series: string;
      // Indices into prefs, in prefs order.
      indices: number[];
      enabled: 'all' | 'some' | 'none';
      removable: boolean;
    };

export const buildDictRows = (
  prefs: DictPref[],
  seriesOf: (dictName: string) => string | null,
): DictRow[] => {
  const rows: DictRow[] = [];
  const groups = new Map<string, Extract<DictRow, {kind: 'series'}>>();
  prefs.forEach((pref, index) => {
    const series = seriesOf(pref.name);
    if (series === null) {
      rows.push({kind: 'dict', key: pref.prefKey, index, pref});
      return;
    }
    let group = groups.get(series);
    if (!group) {
      group = {
        kind: 'series',
        key: `series:${series}`,
        series,
        indices: [],
        enabled: 'none',
        removable: true,
      };
      groups.set(series, group);
      rows.push(group);
    }
    group.indices.push(index);
  });
  for (const group of groups.values()) {
    const on = group.indices.filter(i => prefs[i].enabled).length;
    group.enabled = on === group.indices.length ? 'all' : on === 0 ? 'none' : 'some';
    group.removable = group.indices.every(i => prefs[i].removable);
  }
  return rows;
};

const indicesOf = (row: DictRow): number[] =>
  row.kind === 'dict' ? [row.index] : row.indices;

// Swap a row with its neighbour (delta -1 / +1). A series moves as a block;
// its layers end up contiguous. Out-of-range moves return prefs unchanged.
export const moveDictRow = (
  prefs: DictPref[],
  rows: DictRow[],
  rowIndex: number,
  delta: number,
): DictPref[] => {
  const target = rowIndex + delta;
  if (target < 0 || target >= rows.length || rowIndex < 0 || rowIndex >= rows.length) {
    return prefs;
  }
  const blocks = rows.map(indicesOf);
  [blocks[rowIndex], blocks[target]] = [blocks[target], blocks[rowIndex]];
  return blocks.flat().map(i => prefs[i]);
};

// Flip a row's enablement. A partly-enabled series turns fully on.
export const toggleDictRow = (prefs: DictPref[], row: DictRow): DictPref[] => {
  const turnOn = row.kind === 'dict' ? !row.pref.enabled : row.enabled !== 'all';
  const members = new Set(indicesOf(row));
  return prefs.map((pref, i) => (members.has(i) ? {...pref, enabled: turnOn} : pref));
};
