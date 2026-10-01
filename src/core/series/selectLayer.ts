// Spoiler gating: decide which layer of each book series a lookup may see.
//
// PURE + HOST-TESTED. Given the parsed manifests and where the reader is,
// returns an `include(sourceName)` predicate for the lookup registry plus
// one human-readable decision per series (for logs; Settings later).
//
// Rules (fail closed: when unsure, show less):
//   - The open file is matched to a book by its basename (case, underscore
//     and punctuation-insensitive); a match string must start at a word
//     boundary but may run on ("butcher" matches "Butchers"). A match string equal to the series
//     name only counts on an EXACT basename match, so "Dungeon Crawler
//     Carl 6 - The Eye of the Bedlam Bride" is Book 6, not Book 1.
//     Still ambiguous -> the LOWEST matching book.
//   - position = (n − 1) + page/total, the fraction clamped to [0, 1].
//     A missing or nonsensical page/total counts as the start of the book.
//   - The series shows the layer with the greatest covers <= position, or
//     NOTHING when no layer qualifies. Every other layer is hidden.
//   - No position (no book of this series open, or a NOTE lasso) -> the
//     lowest layer.
//   - An invalid manifest hides every dict it names.
//   - Sources that belong to no manifest are never touched.

import type {ManifestParseResult, SeriesManifest} from './manifest';

export type ReadingContext = {
  filePath?: string | null;
  page?: number | null;
  totalPages?: number | null;
};

export type SeriesDecision = {
  series: string;
  // Matched book number, or null when the open file isn't in this series.
  book: number | null;
  position: number | null;
  // Layer shown, or null when the whole series is hidden.
  layer: string | null;
  reason: string;
};

export type SeriesGate = {
  include: (sourceName: string) => boolean;
  decisions: SeriesDecision[];
};

// Lower-case, strip diacritics and apostrophes ("Carl's" == "Carls"),
// turn every other non-alphanumeric run (underscores, dashes, dots) into a
// single space.
export const normalizeTitle = (s: string): string =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['‘’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const basenameNoExt = (path: string): string => {
  const slash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  const base = slash >= 0 ? path.slice(slash + 1) : path;
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(0, dot) : base;
};

export type BookMatch = {book: number | null; ambiguous: number[]};

export const matchBook = (
  manifest: SeriesManifest,
  filePath: string | null | undefined,
): BookMatch => {
  if (!filePath) {
    return {book: null, ambiguous: []};
  }
  const name = normalizeTitle(basenameNoExt(filePath));
  if (name === '') {
    return {book: null, ambiguous: []};
  }
  const seriesName = normalizeTitle(manifest.series);
  const padded = ` ${name}`;
  const hits = manifest.books
    .filter(b =>
      b.match.some(m => {
        const pat = normalizeTitle(m);
        if (pat === '') {
          return false;
        }
        // Word-START match, so stems like "butcher" / "anarchist" hit
        // "Butchers" / "Anarchists" but never the middle of a word.
        return pat === seriesName ? name === pat : padded.includes(` ${pat}`);
      }),
    )
    .map(b => b.n);
  if (hits.length === 0) {
    return {book: null, ambiguous: []};
  }
  return {book: Math.min(...hits), ambiguous: hits.length > 1 ? hits : []};
};

const validNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

export const bookFraction = (
  page: number | null | undefined,
  total: number | null | undefined,
): number => {
  if (!validNumber(page) || !validNumber(total) || total <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, page / total));
};

export const readingPosition = (
  book: number,
  page: number | null | undefined,
  total: number | null | undefined,
): number => book - 1 + bookFraction(page, total);

export const selectLayer = (
  manifest: SeriesManifest,
  position: number | null,
): string | null => {
  const layers = manifest.layers; // sorted ascending by parseSeriesManifest
  if (position === null) {
    return layers[0].dict;
  }
  let chosen: string | null = null;
  for (const layer of layers) {
    if (layer.covers <= position) {
      chosen = layer.dict;
    }
  }
  return chosen;
};

// Rounded DOWN, so 299/300 reads "99%" rather than a misleading "100%".
// Taken from the page fraction, not the position, and nudged by an
// epsilon so 120/400 reads "30%", not "29%" (5.3 − 5 = 0.2999…).
const pct = (fraction: number): string => `${Math.floor(fraction * 100 + 1e-9)}%`;

export const buildSeriesGate = (
  manifests: ManifestParseResult[],
  ctx: ReadingContext | null,
): SeriesGate => {
  const hidden = new Set<string>();
  const decisions: SeriesDecision[] = [];

  for (const parsed of manifests) {
    if (!parsed.ok) {
      parsed.layerDicts.forEach(d => hidden.add(d));
      decisions.push({
        series: parsed.series,
        book: null,
        position: null,
        layer: null,
        reason: `invalid manifest, all layers hidden: ${parsed.errors.join('; ')}`,
      });
      continue;
    }
    const m = parsed.manifest;
    const {book, ambiguous} = matchBook(m, ctx?.filePath);
    const position =
      book === null ? null : readingPosition(book, ctx?.page, ctx?.totalPages);
    const layer = selectLayer(m, position);
    m.layers.forEach(l => {
      if (l.dict !== layer) {
        hidden.add(l.dict);
      }
    });
    let reason: string;
    if (book === null) {
      reason = ctx?.filePath
        ? 'open file is not in this series; showing the lowest layer'
        : 'no book open; showing the lowest layer';
    } else {
      reason =
        `Book ${book} at ${pct(bookFraction(ctx?.page, ctx?.totalPages))} ` +
        `(position ${(position as number).toFixed(3)})`;
      if (ambiguous.length > 0) {
        reason += `; file matched books ${ambiguous.join(', ')}, using the lowest`;
      }
      if (layer === null) {
        reason += '; no layer is safe yet, series hidden';
      }
    }
    decisions.push({series: m.series, book, position, layer, reason});
  }

  return {include: name => !hidden.has(name), decisions};
};
