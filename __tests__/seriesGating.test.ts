import {parseSeriesManifest, type SeriesManifest} from '../src/core/series/manifest';
import {
  bookFraction,
  buildSeriesGate,
  DEFAULT_SERIES_PREFS,
  matchBook,
  nextFurthest,
  normalizeTitle,
  positionParts,
  readingPosition,
  selectLayer,
  type SeriesMode,
  type SeriesPrefs,
} from '../src/core/series/selectLayer';

// The DCC manifest from the handoff (§3.1): books 1–8, three layers.
const DCC_RAW = {
  series: 'Dungeon Crawler Carl',
  books: [
    {n: 1, title: 'Dungeon Crawler Carl', match: ['dungeon crawler carl', 'dungeon_crawler_carl']},
    {n: 2, title: "Carl's Doomsday Scenario", match: ['doomsday scenario']},
    {n: 3, title: "The Dungeon Anarchist's Cookbook", match: ['anarchist']},
    {n: 4, title: 'The Gate of the Feral Gods', match: ['feral gods']},
    {n: 5, title: "The Butcher's Masquerade", match: ['butcher']},
    {n: 6, title: 'The Eye of the Bedlam Bride', match: ['bedlam bride']},
    {n: 7, title: 'This Inevitable Ruin', match: ['inevitable ruin']},
    {n: 8, title: 'A Parade of Horribles', match: ['parade of horribles']},
  ],
  layers: [
    {dict: 'DCC thru Book 8', covers: 8.0},
    {dict: 'DCC thru Book 5', covers: 5.0},
    {dict: 'DCC Book 6 · 25%', covers: 5.25},
  ],
};

const parsed = (raw: unknown = DCC_RAW) => {
  const r = parseSeriesManifest(raw);
  if (!r.ok) {
    throw new Error(r.errors.join('; '));
  }
  return r.manifest;
};

// One layer per whole book: the step-2 device-test manifest.
const perBook = (): SeriesManifest =>
  parsed({
    ...DCC_RAW,
    layers: [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({dict: `DCC thru Book ${n}`, covers: n})),
  });

describe('parseSeriesManifest', () => {
  test('accepts the DCC manifest and sorts layers by covers', () => {
    const m = parsed();
    expect(m.series).toBe('Dungeon Crawler Carl');
    expect(m.books.map(b => b.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(m.layers.map(l => l.covers)).toEqual([5, 5.25, 8]);
  });

  test('a missing title defaults to "Book n"', () => {
    const m = parsed({...DCC_RAW, books: [{n: 3, match: ['anarchist']}]});
    expect(m.books[0].title).toBe('Book 3');
  });

  test.each([
    ['not an object', [], 'not a JSON object'],
    ['null', null, 'not a JSON object'],
    ['no series', {...DCC_RAW, series: ' '}, '"series"'],
    ['empty books', {...DCC_RAW, books: []}, '"books"'],
    ['book not an object', {...DCC_RAW, books: ['x']}, 'books[0] is not an object'],
    ['book n not an integer', {...DCC_RAW, books: [{n: 1.5, match: ['a']}]}, 'books[0].n'],
    ['book n zero', {...DCC_RAW, books: [{n: 0, match: ['a']}]}, 'books[0].n'],
    ['duplicate book', {...DCC_RAW, books: [{n: 1, match: ['a']}, {n: 1, match: ['b']}]}, 'duplicates book 1'],
    ['empty match', {...DCC_RAW, books: [{n: 1, match: ['', ' ']}]}, 'books[0].match'],
    ['match not an array', {...DCC_RAW, books: [{n: 1, match: 'a'}]}, 'books[0].match'],
    ['empty layers', {...DCC_RAW, layers: []}, '"layers"'],
    ['layer not an object', {...DCC_RAW, layers: [5]}, 'layers[0] is not an object'],
    ['layer without dict', {...DCC_RAW, layers: [{covers: 1}]}, 'layers[0].dict'],
    ['negative covers', {...DCC_RAW, layers: [{dict: 'A', covers: -1}]}, 'layers[0].covers'],
    ['string covers', {...DCC_RAW, layers: [{dict: 'A', covers: '5'}]}, 'layers[0].covers'],
    ['NaN covers', {...DCC_RAW, layers: [{dict: 'A', covers: NaN}]}, 'layers[0].covers'],
    ['duplicate dict', {...DCC_RAW, layers: [{dict: 'A', covers: 1}, {dict: 'A', covers: 2}]}, 'duplicates "A"'],
    ['duplicate covers', {...DCC_RAW, layers: [{dict: 'A', covers: 1}, {dict: 'B', covers: 1}]}, 'duplicates 1'],
  ])('rejects %s', (_label, raw, message) => {
    const r = parseSeriesManifest(raw);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.join('; ')).toContain(message);
    }
  });

  test('an invalid manifest still reports every layer dict it names', () => {
    const r = parseSeriesManifest({
      ...DCC_RAW,
      layers: [{dict: 'DCC thru Book 5', covers: 5}, {dict: 'DCC thru Book 8', covers: 'later'}],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.series).toBe('Dungeon Crawler Carl');
      expect(r.layerDicts).toEqual(['DCC thru Book 5', 'DCC thru Book 8']);
    }
  });

  test('an invalid manifest without a series name is labelled "?"', () => {
    const r = parseSeriesManifest({layers: [{dict: 'X', covers: 1}]});
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.series).toBe('?');
      expect(r.layerDicts).toEqual(['X']);
    }
  });
});

describe('normalizeTitle', () => {
  test.each([
    ['The_Eye_of_the_Bedlam_Bride', 'the eye of the bedlam bride'],
    ["Carl's Doomsday Scenario", 'carls doomsday scenario'],
    ['Carl’s  Doomsday—Scenario!', 'carls doomsday scenario'],
    ['Dungeon Crawler Carl 6 - The Eye of the Bedlam Bride', 'dungeon crawler carl 6 the eye of the bedlam bride'],
    ['Café', 'cafe'],
    ['___', ''],
  ])('%s -> %s', (input, expected) => {
    expect(normalizeTitle(input)).toBe(expected);
  });
});

describe('matchBook', () => {
  const m = parsed();

  test.each([
    // The owner's actual epub names (spaces) and the handoff's (underscores).
    ['/sdcard/Document/Dungeon Crawler Carl.epub', 1],
    ['/sdcard/Document/Dungeon_Crawler_Carl.epub', 1],
    ['/sdcard/Document/Carls Doomsday Scenario.epub', 2],
    ["/sdcard/Document/Carl's Doomsday Scenario.epub", 2],
    ['/sdcard/Document/The Dungeon Anarchists Cookbook.epub', 3],
    ['/sdcard/Document/The Gate of the Feral Gods.epub', 4],
    ['/sdcard/Document/The Butchers Masquerade.epub', 5],
    ['/sdcard/Document/The_Eye_of_the_Bedlam_Bride.epub', 6],
    ['/sdcard/Document/This Inevitable Ruin.epub', 7],
    ['/sdcard/Document/A_Parade_of_Horribles.epub', 8],
    ['/sdcard/Document/THE EYE OF THE BEDLAM BRIDE.EPUB', 6],
    ['C:\\Books\\The Eye of the Bedlam Bride.epub', 6],
    ['The Eye of the Bedlam Bride.epub', 6],
  ])('%s -> Book %i', (path, book) => {
    expect(matchBook(m, path)).toEqual({book, ambiguous: []});
  });

  test('a series-name pattern counts only on an exact basename match', () => {
    // Calibre-style "Series N - Title": Book 6, not Book 1.
    expect(
      matchBook(m, '/x/Dungeon Crawler Carl 6 - The Eye of the Bedlam Bride.epub'),
    ).toEqual({book: 6, ambiguous: []});
    expect(matchBook(m, '/x/Dungeon Crawler Carl Omnibus.epub')).toEqual({
      book: null,
      ambiguous: [],
    });
  });

  test('patterns must start at a word boundary but may run on', () => {
    expect(matchBook(m, '/x/Thebutcher.epub').book).toBeNull();
    expect(matchBook(m, '/x/The Butchers Masquerade.epub').book).toBe(5);
  });

  test('ambiguous names fail closed to the lowest book', () => {
    expect(matchBook(m, '/x/Butcher vs the Bedlam Bride.epub')).toEqual({
      book: 5,
      ambiguous: [5, 6],
    });
  });

  test('a match string with no letters or digits never matches', () => {
    const odd = parsed({...DCC_RAW, books: [{n: 1, match: ['!!!']}]});
    expect(matchBook(odd, '/x/Moby Dick.epub').book).toBeNull();
  });

  test.each([[null], [undefined], [''], ['/x/.epub'], ['/x/___.epub'], ['/x/Moby Dick.epub']])(
    'no book for %p',
    path => {
      expect(matchBook(m, path).book).toBeNull();
    },
  );
});

describe('bookFraction / readingPosition', () => {
  test.each([
    [120, 400, 0.3],
    [0, 400, 0],
    [400, 400, 1],
    [500, 400, 1], // past the end clamps
    [-3, 400, 0],
    [10, 0, 0], // nonsensical totals count as the start (fail closed)
    [10, -5, 0],
    [null, 400, 0],
    [10, null, 0],
    [NaN, 400, 0],
    [10, Infinity, 0],
  ])('page %p of %p -> %p', (page, total, expected) => {
    expect(bookFraction(page, total)).toBeCloseTo(expected);
  });

  test('Book 6 at 30% is position 5.30', () => {
    expect(readingPosition(6, 120, 400)).toBeCloseTo(5.3);
  });
});

describe('selectLayer', () => {
  const m = parsed();

  test.each([
    [5.3, 'DCC Book 6 · 25%'],
    [5.25, 'DCC Book 6 · 25%'], // boundary is inclusive
    [5.2499, 'DCC thru Book 5'],
    [5.0, 'DCC thru Book 5'],
    [7.99, 'DCC Book 6 · 25%'],
    [8.0, 'DCC thru Book 8'],
    [4.99, null], // before the lowest layer: nothing is safe
    [0, null],
  ])('position %p -> %p', (position, expected) => {
    expect(selectLayer(m, position)).toBe(expected);
  });

  test('unknown position -> the lowest layer', () => {
    expect(selectLayer(m, null)).toBe('DCC thru Book 5');
  });
});

describe('buildSeriesGate', () => {
  const ok = (manifest: SeriesManifest) => ({ok: true as const, manifest});
  const bedlam = '/sdcard/Document/The_Eye_of_the_Bedlam_Bride.epub';

  test('handoff example: Book 6 at ~30% shows only the 25% layer', () => {
    const gate = buildSeriesGate([ok(parsed())], {filePath: bedlam, page: 120, totalPages: 400});
    expect(gate.include('DCC Book 6 · 25%')).toBe(true);
    expect(gate.include('DCC thru Book 5')).toBe(false);
    expect(gate.include('DCC thru Book 8')).toBe(false);
    expect(gate.decisions).toEqual([
      expect.objectContaining({
        series: 'Dungeon Crawler Carl',
        book: 6,
        layer: 'DCC Book 6 · 25%',
      }),
    ]);
    expect(gate.decisions[0].position).toBeCloseTo(5.3);
    expect(gate.decisions[0].reason).toContain('Book 6 at 30%');
  });

  test('per-book layers: partway through Book 6 shows "thru Book 5"', () => {
    const gate = buildSeriesGate([ok(perBook())], {filePath: bedlam, page: 120, totalPages: 400});
    const shown = [1, 2, 3, 4, 5, 6, 7, 8]
      .map(n => `DCC thru Book ${n}`)
      .filter(gate.include);
    expect(shown).toEqual(['DCC thru Book 5']);
  });

  test('the logged percentage rounds down', () => {
    const gate = buildSeriesGate([ok(perBook())], {filePath: bedlam, page: 299, totalPages: 300});
    expect(gate.decisions[0].layer).toBe('DCC thru Book 5');
    expect(gate.decisions[0].reason).toContain('Book 6 at 99% (position 5.997)');
  });

  test('per-book layers: the last page of Book 6 unlocks "thru Book 6"', () => {
    const gate = buildSeriesGate([ok(perBook())], {filePath: bedlam, page: 400, totalPages: 400});
    expect(gate.decisions[0].layer).toBe('DCC thru Book 6');
  });

  test('before any layer is safe, the series is hidden entirely', () => {
    const gate = buildSeriesGate([ok(perBook())], {
      filePath: '/x/Dungeon Crawler Carl.epub',
      page: 10,
      totalPages: 300,
    });
    expect([1, 2, 3, 4, 5, 6, 7, 8].some(n => gate.include(`DCC thru Book ${n}`))).toBe(false);
    expect(gate.decisions[0].layer).toBeNull();
    expect(gate.decisions[0].reason).toContain('series hidden');
  });

  test('no book open (NOTE lasso) -> lowest layer', () => {
    const gate = buildSeriesGate([ok(perBook())], null);
    expect(gate.decisions[0]).toEqual(
      expect.objectContaining({book: null, position: null, layer: 'DCC thru Book 1'}),
    );
    expect(gate.decisions[0].reason).toContain('no book open');
  });

  test('a book from another series -> lowest layer', () => {
    const gate = buildSeriesGate([ok(perBook())], {filePath: '/x/Moby Dick.epub', page: 9, totalPages: 10});
    expect(gate.decisions[0].layer).toBe('DCC thru Book 1');
    expect(gate.decisions[0].reason).toContain('not in this series');
  });

  test('unknown page/total counts as the start of the matched book', () => {
    const gate = buildSeriesGate([ok(perBook())], {filePath: bedlam});
    expect(gate.decisions[0].layer).toBe('DCC thru Book 5');
    expect(gate.decisions[0].position).toBe(5);
  });

  test('an ambiguous file name is noted in the decision', () => {
    const gate = buildSeriesGate([ok(perBook())], {
      filePath: '/x/Butcher vs the Bedlam Bride.epub',
      page: 1,
      totalPages: 1,
    });
    expect(gate.decisions[0].layer).toBe('DCC thru Book 5');
    expect(gate.decisions[0].reason).toContain('matched books 5, 6');
  });

  test('sources outside every manifest are untouched', () => {
    const gate = buildSeriesGate([ok(perBook())], null);
    expect(gate.include('WordNet')).toBe(true);
    expect(gate.include('My words')).toBe(true);
  });

  test('an invalid manifest hides every dict it names', () => {
    const gate = buildSeriesGate(
      [{ok: false, series: 'Broken', errors: ['bad covers'], layerDicts: ['B1', 'B2']}],
      {filePath: bedlam, page: 1, totalPages: 1},
    );
    expect(gate.include('B1')).toBe(false);
    expect(gate.include('B2')).toBe(false);
    expect(gate.include('WordNet')).toBe(true);
    expect(gate.decisions[0]).toEqual(
      expect.objectContaining({series: 'Broken', layer: null}),
    );
    expect(gate.decisions[0].reason).toContain('bad covers');
  });

  test('a dict hidden by one manifest stays hidden even if another shows it', () => {
    const other = parsed({
      series: 'Other',
      books: [{n: 1, match: ['other']}],
      layers: [{dict: 'DCC thru Book 8', covers: 0}],
    });
    const gate = buildSeriesGate([ok(perBook()), ok(other)], null);
    expect(gate.include('DCC thru Book 8')).toBe(false);
  });

  test('no manifests: everything is included', () => {
    const gate = buildSeriesGate([], null);
    expect(gate.include('DCC thru Book 8')).toBe(true);
    expect(gate.decisions).toEqual([]);
  });
});

describe('buildSeriesGate — modes and furthest read', () => {
  const ok = (manifest: SeriesManifest) => ({ok: true as const, manifest});
  const bedlam = '/sdcard/Document/The_Eye_of_the_Bedlam_Bride.epub';
  const S = 'Dungeon Crawler Carl';
  const prefs = (p: Partial<SeriesPrefs>) => ({[S]: {...DEFAULT_SERIES_PREFS, ...p}});
  const shown = (gate: ReturnType<typeof buildSeriesGate>) =>
    [1, 2, 3, 4, 5, 6, 7, 8].map(n => `DCC thru Book ${n}`).filter(gate.include);

  test('NOTE lasso (no book) uses the furthest-read mark', () => {
    const gate = buildSeriesGate([ok(perBook())], null, prefs({furthest: 5.3}));
    expect(shown(gate)).toEqual(['DCC thru Book 5']);
    expect(gate.decisions[0].reason).toContain('no book open; using furthest read, Book 6 at 30%');
  });

  test('another book open also falls back to the furthest-read mark', () => {
    const gate = buildSeriesGate([ok(perBook())], {filePath: '/x/Moby Dick.epub'}, prefs({furthest: 7}));
    expect(gate.decisions[0].layer).toBe('DCC thru Book 7');
    expect(gate.decisions[0].reason).toContain('Book 7 at 100%');
  });

  test("'current' with a series book open ignores the furthest mark", () => {
    const gate = buildSeriesGate(
      [ok(perBook())],
      {filePath: '/x/Carls Doomsday Scenario.epub', page: 1, totalPages: 100},
      prefs({furthest: 7}),
    );
    expect(gate.decisions[0].layer).toBe('DCC thru Book 1');
    expect(gate.decisions[0].currentPosition).toBeCloseTo(1.01);
  });

  test("'furthest' shows the furthest mark even while rereading an early book", () => {
    const gate = buildSeriesGate(
      [ok(perBook())],
      {filePath: '/x/Carls Doomsday Scenario.epub', page: 1, totalPages: 100},
      prefs({mode: 'furthest', furthest: 5.3}),
    );
    expect(gate.decisions[0]).toEqual(
      expect.objectContaining({mode: 'furthest', layer: 'DCC thru Book 5', book: 2}),
    );
    expect(gate.decisions[0].reason).toBe('furthest read: Book 6 at 30%');
  });

  test("'furthest' with nothing recorded shows the lowest layer", () => {
    const gate = buildSeriesGate([ok(perBook())], {filePath: bedlam}, prefs({mode: 'furthest'}));
    expect(gate.decisions[0].layer).toBe('DCC thru Book 1');
    expect(gate.decisions[0].reason).toContain('nothing recorded yet');
  });

  test("'manual' shows the picked layer only", () => {
    const gate = buildSeriesGate(
      [ok(perBook())],
      {filePath: bedlam, page: 1, totalPages: 400},
      prefs({mode: 'manual', manualLayer: 'DCC thru Book 3'}),
    );
    expect(shown(gate)).toEqual(['DCC thru Book 3']);
    expect(gate.decisions[0].reason).toBe('manual layer');
  });

  test("'manual' with an unknown pick falls back to the lowest layer", () => {
    const gate = buildSeriesGate([ok(perBook())], null, prefs({mode: 'manual', manualLayer: 'gone'}));
    expect(shown(gate)).toEqual(['DCC thru Book 1']);
    expect(gate.decisions[0].reason).toContain('not found');
  });

  test("'off' shows every layer", () => {
    const gate = buildSeriesGate([ok(perBook())], null, prefs({mode: 'off'}));
    expect(shown(gate)).toHaveLength(8);
    expect(gate.decisions[0]).toEqual(expect.objectContaining({showAll: true, layer: null}));
  });

  test('an unknown stored mode and a bad furthest value are ignored', () => {
    const gate = buildSeriesGate([ok(perBook())], null, {
      [S]: {mode: 'weird' as SeriesMode, furthest: NaN, manualLayer: null},
    });
    expect(gate.decisions[0]).toEqual(
      expect.objectContaining({mode: 'current', layer: 'DCC thru Book 1', position: null}),
    );
  });

  test('a furthest mark before the first layer hides the series', () => {
    const gate = buildSeriesGate([ok(perBook())], null, prefs({furthest: 0.5}));
    expect(gate.decisions[0].layer).toBeNull();
    expect(gate.decisions[0].reason).toContain('series hidden');
  });
});

describe('nextFurthest', () => {
  const decision = (currentPosition: number | null) =>
    ({currentPosition} as Parameters<typeof nextFurthest>[1]);
  test.each([
    [null, null, null],
    [5.3, null, 5.3],
    [null, 2.1, 2.1],
    [5.3, 2.1, 5.3],
    [5.3, 5.4, 5.4],
  ])('previous %p, current %p -> %p', (prev, cur, expected) => {
    expect(nextFurthest(prev, decision(cur))).toBe(expected);
  });
});

describe('positionParts', () => {
  test.each([
    [0, 1, 0],
    [1, 1, 100],
    [1.0000001, 2, 0],
    [5.3, 6, 30],
    [5.999, 6, 99],
    [6, 6, 100],
  ])('%p -> Book %p, %p%', (position, book, percent) => {
    expect(positionParts(position)).toEqual({book, percent});
  });
});
