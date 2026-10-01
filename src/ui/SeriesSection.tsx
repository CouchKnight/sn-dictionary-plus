import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {getPopupActions} from './popupController';
import type {SeriesInfo} from '../core/series/seriesRuntime';
import {positionParts, type SeriesMode} from '../core/series/selectLayer';
import {popupStyles as styles} from './popupStyles';
import {t, type StringId} from '../i18n/i18n';

// Settings card for series spoiler gating: one block per series with the
// layer currently shown, the mode (radio rows), a layer picker in manual
// mode, and the furthest-read mark with a Reset button. Changes apply
// immediately (like the keep-sources toggle), not via Save. Renders
// nothing until the engine wires listSeries, or when there is no series.

const MODE_LABEL: Record<SeriesMode, StringId> = {
  current: 'settings.seriesModeCurrent',
  furthest: 'settings.seriesModeFurthest',
  manual: 'settings.seriesModeManual',
  off: 'settings.seriesModeOff',
};
const MODES: SeriesMode[] = ['current', 'furthest', 'manual', 'off'];

const where = (position: number): string => {
  const {book, percent} = positionParts(position);
  return `${t('settings.seriesBook')} ${book}, ${percent}%`;
};

export const describeShowing = (info: SeriesInfo): string => {
  const d = info.decision;
  if (d.showAll) {
    return t('settings.seriesShowAll');
  }
  if (d.layer === null) {
    return t('settings.seriesNothingYet');
  }
  return d.position === null ? d.layer : `${d.layer} (${where(d.position)})`;
};

export default function SeriesSection(): React.JSX.Element | null {
  const actions = getPopupActions();
  const listFn = actions?.listSeries;
  const [series, setSeries] = React.useState<SeriesInfo[]>([]);
  const cancelledRef = React.useRef(false);

  const refresh = React.useCallback((): void => {
    listFn?.()
      .then(list => {
        if (!cancelledRef.current) {
          setSeries(list);
        }
      })
      .catch(() => {
        // Keep the last list; the engine logs its own error.
      });
  }, [listFn]);

  React.useEffect(() => {
    cancelledRef.current = false;
    refresh();
    return () => {
      cancelledRef.current = true;
    };
  }, [refresh]);

  if (!listFn || series.length === 0) {
    return null;
  }

  const setMode = (info: SeriesInfo, mode: SeriesMode, layer?: string): void => {
    const manual = mode === 'manual' ? layer ?? info.prefs.manualLayer ?? info.layers[0] : undefined;
    actions?.setSeriesMode?.(info.series, mode, manual)
      .then(refresh)
      .catch(() => {});
  };

  const reset = (info: SeriesInfo): void => {
    actions?.resetSeriesFurthest?.(info.series)
      .then(refresh)
      .catch(() => {});
  };

  return (
    <>
      <Text style={styles.settingsSectionTitle}>{t('settings.series')}</Text>
      {series.map(info => (
        <View key={info.series}>
          <Text style={styles.settingsToggleLabel}>{info.series}</Text>
          {!info.valid ? (
            <Text accessibilityRole="alert" style={styles.settingsWarning}>
              {t('settings.seriesInvalid')}
            </Text>
          ) : (
            <>
              {info.fromStore ? (
                <Text style={styles.settingsToggleHint}>{t('settings.seriesStored')}</Text>
              ) : null}
              <Text style={styles.settingsToggleHint}>
                {`${t('settings.seriesShowing')}: ${describeShowing(info)}`}
              </Text>
              {MODES.map(mode => {
                const selected = info.prefs.mode === mode;
                return (
                  <Pressable
                    key={mode}
                    accessibilityRole="radio"
                    accessibilityState={{checked: selected}}
                    accessibilityLabel={`${info.series}: ${t(MODE_LABEL[mode])}`}
                    onPress={() => setMode(info, mode)}
                    style={styles.dictToggleTap}>
                    <Text style={styles.dictCheckbox}>{selected ? '◉' : '○'}</Text>
                    <Text style={styles.dictName}>{t(MODE_LABEL[mode])}</Text>
                  </Pressable>
                );
              })}
              {info.prefs.mode === 'manual'
                ? info.layers.map(layer => {
                    const selected = info.decision.layer === layer;
                    return (
                      <Pressable
                        key={layer}
                        accessibilityRole="radio"
                        accessibilityState={{checked: selected}}
                        accessibilityLabel={`${info.series}: ${layer}`}
                        onPress={() => setMode(info, 'manual', layer)}
                        style={[styles.dictToggleTap, styles.seriesLayerRow]}>
                        <Text style={styles.dictCheckbox}>{selected ? '◉' : '○'}</Text>
                        <Text style={styles.dictName} numberOfLines={1}>
                          {layer}
                        </Text>
                      </Pressable>
                    );
                  })
                : null}
              <View style={styles.dictRow}>
                <Text style={styles.settingsToggleHint}>
                  {`${t('settings.seriesFurthest')}: ${
                    info.prefs.furthest === null
                      ? t('settings.seriesNotRecorded')
                      : where(info.prefs.furthest)
                  }`}
                </Text>
                {info.prefs.furthest !== null ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${info.series}: ${t('settings.seriesReset')}`}
                    onPress={() => reset(info)}
                    style={styles.removeButton}>
                    <Text style={styles.removeButtonLabel}>{t('settings.seriesReset')}</Text>
                  </Pressable>
                ) : null}
              </View>
            </>
          )}
        </View>
      ))}
    </>
  );
}
