// Series manifest (`<name>.series.json`, dropped next to the layered dicts
// in MyStyle/SnDictPlus/). It tells the gate which imported dicts are
// cumulative spoiler layers of one book series, how far into the series
// each layer is safe ("covers"), and how to recognise each book from the
// open file's name.
//
//   {
//     "series": "Dungeon Crawler Carl",
//     "books":  [{"n": 1, "title": "...", "match": ["dungeon crawler carl"]}, ...],
//     "layers": [{"dict": "DCC thru Book 5", "covers": 5.0}, ...]
//   }
//
// covers is a series position: (book − 1) + fraction-through-that-book, so
// "thru Book 5" = 5.0 and "Book 6, 25%" = 5.25.
//
// PURE + HOST-TESTED. A manifest that fails validation is NOT discarded:
// whatever dict names it lists are still reported (layerDicts) so the gate
// can hide them all. A broken manifest must never let spoilers through.

export type SeriesBook = {n: number; title: string; match: string[]};
export type SeriesLayer = {dict: string; covers: number};

export type SeriesManifest = {
  series: string;
  books: SeriesBook[];
  layers: SeriesLayer[];
};

export type ManifestParseResult =
  | {ok: true; manifest: SeriesManifest}
  | {
      ok: false;
      // Best-effort series label for logs ('?' when absent).
      series: string;
      errors: string[];
      // Every dict name found under layers[], valid or not.
      layerDicts: string[];
    };

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const nonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

export const parseSeriesManifest = (raw: unknown): ManifestParseResult => {
  const errors: string[] = [];
  const obj = isObject(raw) ? raw : {};
  if (!isObject(raw)) {
    errors.push('manifest is not a JSON object');
  }

  const series = nonEmptyString(obj.series) ? obj.series.trim() : '';
  if (series === '') {
    errors.push('"series" must be a non-empty string');
  }

  const books: SeriesBook[] = [];
  if (!Array.isArray(obj.books) || obj.books.length === 0) {
    errors.push('"books" must be a non-empty array');
  } else {
    const seen = new Set<number>();
    obj.books.forEach((b, i) => {
      if (!isObject(b)) {
        errors.push(`books[${i}] is not an object`);
        return;
      }
      const n = b.n;
      if (typeof n !== 'number' || !Number.isInteger(n) || n < 1) {
        errors.push(`books[${i}].n must be a positive integer`);
        return;
      }
      if (seen.has(n)) {
        errors.push(`books[${i}].n duplicates book ${n}`);
        return;
      }
      seen.add(n);
      const match = Array.isArray(b.match)
        ? b.match.filter(nonEmptyString).map(m => m.trim())
        : [];
      if (match.length === 0) {
        errors.push(`books[${i}].match must list at least one string`);
        return;
      }
      const title = nonEmptyString(b.title) ? b.title.trim() : `Book ${n}`;
      books.push({n, title, match});
    });
  }

  const layers: SeriesLayer[] = [];
  const layerDicts: string[] = [];
  if (!Array.isArray(obj.layers) || obj.layers.length === 0) {
    errors.push('"layers" must be a non-empty array');
  } else {
    const seenDict = new Set<string>();
    const seenCovers = new Set<number>();
    obj.layers.forEach((l, i) => {
      if (!isObject(l)) {
        errors.push(`layers[${i}] is not an object`);
        return;
      }
      if (!nonEmptyString(l.dict)) {
        errors.push(`layers[${i}].dict must be a non-empty string`);
        return;
      }
      const dict = l.dict.trim();
      layerDicts.push(dict);
      if (seenDict.has(dict)) {
        errors.push(`layers[${i}].dict duplicates "${dict}"`);
        return;
      }
      seenDict.add(dict);
      const covers = l.covers;
      if (typeof covers !== 'number' || !Number.isFinite(covers) || covers < 0) {
        errors.push(`layers[${i}].covers must be a number >= 0`);
        return;
      }
      if (seenCovers.has(covers)) {
        errors.push(`layers[${i}].covers duplicates ${covers}`);
        return;
      }
      seenCovers.add(covers);
      layers.push({dict, covers});
    });
  }

  if (errors.length > 0) {
    return {ok: false, series: series || '?', errors, layerDicts};
  }
  layers.sort((a, b) => a.covers - b.covers);
  books.sort((a, b) => a.n - b.n);
  return {ok: true, manifest: {series, books, layers}};
};
