jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  Pressable: 'Pressable',
  TextInput: 'TextInput',
  StyleSheet: {create: (s: unknown) => s},
}));

jest.mock('sn-plugin-lib', () => ({
  PluginManager: {closePluginView: jest.fn(() => Promise.resolve(true))},
}));

jest.mock('../src/native/clipboard', () => ({
  copyToClipboard: jest.fn(() => Promise.resolve({success: true, code: 'OK', message: ''})),
}));

jest.mock('../src/native/penToolObserver', () => ({
  getPenToolObserver: jest.fn(() => null),
}));

import React from 'react';
import {act, create, type ReactTestRenderer} from 'react-test-renderer';
import DefinitionPopup from '../src/ui/DefinitionPopup';
import SeriesSection, {describeShowing} from '../src/ui/SeriesSection';
import {
  __testing__,
  isAlwaysLabelled,
  setAlwaysLabelled,
  setPopupActions,
  showDefinition,
  showSettings,
  type PopupActions,
} from '../src/ui/popupController';
import type {SeriesInfo} from '../src/core/series/seriesRuntime';
import {DEFAULT_SERIES_PREFS, type SeriesDecision} from '../src/core/series/selectLayer';
import type {LookupResult} from '../src/core/lookup';

const collectText = (tree: ReactTestRenderer): string =>
  tree.root
    .findAll(n => (n.type as unknown) === 'Text')
    .map(n => [n.props.children].flat().filter(c => typeof c === 'string').join(''))
    .join('\n');

const findByLabel = (tree: ReactTestRenderer, label: string) =>
  tree.root.findAll(n => n.props.accessibilityLabel === label);

const flush = async (): Promise<void> => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

const baseActions = (extra: Partial<PopupActions> = {}): PopupActions => ({
  lookupThesaurus: async () => ({lang: 'en', omw: {synonyms: [], antonyms: []}}),
  addUserEntry: async () => undefined,
  relookup: async () => undefined,
  listDictPrefs: async () => [],
  setDictPrefs: async () => undefined,
  getKeepSources: async () => true,
  setKeepSources: async () => undefined,
  ...extra,
});

const S = 'Dungeon Crawler Carl';
const LAYERS = ['DCC thru Book 1', 'DCC thru Book 5', 'DCC thru Book 6'];

const decision = (over: Partial<SeriesDecision> = {}): SeriesDecision => ({
  series: S,
  valid: true,
  mode: 'current',
  book: 6,
  currentPosition: 5.3,
  position: 5.3,
  layer: 'DCC thru Book 5',
  showAll: false,
  reason: '',
  ...over,
});

const info = (over: Partial<SeriesInfo> = {}): SeriesInfo => ({
  series: S,
  valid: true,
  errors: [],
  fromStore: false,
  layers: LAYERS,
  prefs: {...DEFAULT_SERIES_PREFS, furthest: 5.3},
  decision: decision(),
  ...over,
});

beforeEach(() => {
  __testing__.reset();
});

describe('describeShowing', () => {
  test.each([
    [decision(), 'DCC thru Book 5 (Book 6, 30%)'],
    [decision({position: null, layer: 'DCC thru Book 1'}), 'DCC thru Book 1'],
    [decision({layer: null}), 'Nothing yet — too early in the series'],
    [decision({showAll: true, layer: null}), 'Every layer (gating off)'],
  ])('%#', (d, expected) => {
    expect(describeShowing(info({decision: d}))).toBe(expected);
  });
});

describe('SeriesSection', () => {
  const render = async (actions: PopupActions | null) => {
    if (actions) {
      setPopupActions(actions);
    }
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(<SeriesSection />);
    });
    await flush();
    return tree;
  };

  test('renders nothing without the listSeries port', async () => {
    expect((await render(baseActions())).toJSON()).toBeNull();
    expect((await render(null)).toJSON()).toBeNull();
  });

  test('renders nothing when there is no series', async () => {
    const tree = await render(baseActions({listSeries: async () => []}));
    expect(tree.toJSON()).toBeNull();
  });

  test('shows the layer, the mode radios and the furthest-read mark', async () => {
    const tree = await render(baseActions({listSeries: async () => [info()]}));
    const text = collectText(tree);
    expect(text).toContain('Series spoilers');
    expect(text).toContain(S);
    expect(text).toContain('Showing: DCC thru Book 5 (Book 6, 30%)');
    expect(text).toContain('Furthest read: Book 6, 30%');
    const current = findByLabel(tree, `${S}: Auto: where I'm reading`)[0];
    expect(current.props.accessibilityState).toEqual({checked: true});
    expect(findByLabel(tree, `${S}: Off: show everything (spoilers)`)[0].props.accessibilityState).toEqual({
      checked: false,
    });
    // Layer picker only in manual mode.
    expect(findByLabel(tree, `${S}: DCC thru Book 1`)).toHaveLength(0);
  });

  test('picking a mode saves it and refreshes', async () => {
    const setSeriesMode = jest.fn(async () => undefined);
    const listSeries = jest.fn(async () => [info()]);
    const tree = await render(baseActions({listSeries, setSeriesMode}));
    await act(async () => {
      findByLabel(tree, `${S}: Auto: the furthest I've read`)[0].props.onPress();
    });
    await flush();
    expect(setSeriesMode).toHaveBeenCalledWith(S, 'furthest', undefined);
    expect(listSeries).toHaveBeenCalledTimes(2);
  });

  test('manual mode defaults to the saved pick, else the lowest layer', async () => {
    const setSeriesMode = jest.fn(async () => undefined);
    const tree = await render(baseActions({listSeries: async () => [info()], setSeriesMode}));
    await act(async () => {
      findByLabel(tree, `${S}: Manual: choose a layer`)[0].props.onPress();
    });
    expect(setSeriesMode).toHaveBeenCalledWith(S, 'manual', 'DCC thru Book 1');
  });

  test('manual mode lists the layers and picks one', async () => {
    const setSeriesMode = jest.fn(async () => undefined);
    const manual = info({
      prefs: {mode: 'manual', furthest: null, manualLayer: 'DCC thru Book 5'},
      decision: decision({mode: 'manual', position: null}),
    });
    const tree = await render(baseActions({listSeries: async () => [manual], setSeriesMode}));
    expect(findByLabel(tree, `${S}: DCC thru Book 5`)[0].props.accessibilityState).toEqual({
      checked: true,
    });
    expect(collectText(tree)).toContain('Furthest read: not recorded yet');
    expect(findByLabel(tree, `${S}: Reset furthest read`)).toHaveLength(0);
    await act(async () => {
      findByLabel(tree, `${S}: DCC thru Book 6`)[0].props.onPress();
    });
    expect(setSeriesMode).toHaveBeenCalledWith(S, 'manual', 'DCC thru Book 6');
    // Re-choosing manual keeps the saved pick.
    await act(async () => {
      findByLabel(tree, `${S}: Manual: choose a layer`)[0].props.onPress();
    });
    expect(setSeriesMode).toHaveBeenLastCalledWith(S, 'manual', 'DCC thru Book 5');
  });

  test('Reset furthest read calls the port and refreshes', async () => {
    const resetSeriesFurthest = jest.fn(async () => undefined);
    const listSeries = jest.fn(async () => [info()]);
    const tree = await render(baseActions({listSeries, resetSeriesFurthest}));
    await act(async () => {
      findByLabel(tree, `${S}: Reset furthest read`)[0].props.onPress();
    });
    await flush();
    expect(resetSeriesFurthest).toHaveBeenCalledWith(S);
    expect(listSeries).toHaveBeenCalledTimes(2);
  });

  test('an invalid manifest shows only the warning', async () => {
    const tree = await render(
      baseActions({listSeries: async () => [info({valid: false, decision: decision({valid: false})})]}),
    );
    const text = collectText(tree);
    expect(text).toContain('every layer of this series is hidden');
    expect(text).not.toContain('Showing');
  });

  test('a stored copy is flagged', async () => {
    const tree = await render(baseActions({listSeries: async () => [info({fromStore: true})]}));
    expect(collectText(tree)).toContain('using the saved copy');
  });

  test('rejections from the ports are swallowed', async () => {
    const tree = await render(
      baseActions({
        listSeries: jest
          .fn()
          .mockResolvedValueOnce([info()])
          .mockRejectedValue(new Error('x')),
        setSeriesMode: async () => {
          throw new Error('nope');
        },
        resetSeriesFurthest: async () => {
          throw new Error('nope');
        },
      }),
    );
    await act(async () => {
      findByLabel(tree, `${S}: Off: show everything (spoilers)`)[0].props.onPress();
      findByLabel(tree, `${S}: Reset furthest read`)[0].props.onPress();
    });
    await flush();
    expect(collectText(tree)).toContain(S);
  });

  test('missing write ports are a no-op', async () => {
    const tree = await render(baseActions({listSeries: async () => [info()]}));
    await act(async () => {
      findByLabel(tree, `${S}: Off: show everything (spoilers)`)[0].props.onPress();
      findByLabel(tree, `${S}: Reset furthest read`)[0].props.onPress();
    });
    expect(collectText(tree)).toContain(S);
  });

  test('appears inside the Settings panel', async () => {
    setPopupActions(baseActions({listSeries: async () => [info()]}));
    let tree!: ReactTestRenderer;
    act(() => {
      tree = create(<DefinitionPopup />);
    });
    await act(async () => showSettings());
    await flush();
    expect(collectText(tree)).toContain('Series spoilers');
  });
});

describe('series layers are always labelled', () => {
  const single = (source: string): LookupResult => ({
    queriedFor: 'Carl',
    hits: [{source, entry: {word: 'Carl', definition: 'A crawler.', format: 'plain'}}],
    loading: [],
  });

  const renderResult = (result: LookupResult) => {
    setPopupActions(baseActions());
    let tree!: ReactTestRenderer;
    act(() => {
      tree = create(<DefinitionPopup />);
    });
    act(() => showDefinition(result));
    return tree;
  };

  test('a single non-series hit stays unlabelled (unchanged behaviour)', () => {
    const tree = renderResult(single('My glossary'));
    expect(collectText(tree)).not.toContain('My glossary');
  });

  test('a single series-layer hit shows its layer name', () => {
    setAlwaysLabelled(name => name.startsWith('DCC thru'));
    const tree = renderResult(single('DCC thru Book 5'));
    expect(collectText(tree)).toContain('DCC thru Book 5');
  });

  test('a still-loading series layer is labelled too', () => {
    setAlwaysLabelled(name => name.startsWith('DCC thru'));
    const tree = renderResult({queriedFor: 'Carl', hits: [], loading: ['DCC thru Book 5']});
    expect(collectText(tree)).toContain('DCC thru Book 5');
  });

  test('a throwing predicate counts as not labelled', () => {
    setAlwaysLabelled(() => {
      throw new Error('boom');
    });
    expect(isAlwaysLabelled('DCC thru Book 5')).toBe(false);
  });
});
