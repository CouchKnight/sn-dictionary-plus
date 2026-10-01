// Finds and parses every `*.series.json` loose in the user-dict root.
//
// HOST-TESTABLE: file listing + reading are injected (the same
// FileUtilsLike + fetch(file://) seams discovery uses). Never throws: an
// unreadable root yields []. An unreadable or malformed manifest still
// yields an invalid result; for broken JSON the dict names are scraped
// from the raw text, so the gate can hide those layers (fail closed).

import {decodeUtf8} from '../../sdk/utf8';
import type {FileUtilsLike, Logger} from '../dict/userDictDiscovery';
import {parseSeriesManifest, type ManifestParseResult} from './manifest';

export const SERIES_MANIFEST_SUFFIX = '.series.json';

export type LoadManifestDeps = {
  fileUtils: FileUtilsLike;
  rootPath: string;
  fetchFn?: typeof fetch;
  logger?: Logger;
};

const TAG = '[series]';

export const isSeriesManifestName = (path: string): boolean =>
  path.toLowerCase().endsWith(SERIES_MANIFEST_SUFFIX);

const scrapeDictNames = (text: string): string[] => {
  const out: string[] = [];
  const re = /"dict"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const name = m[1].trim();
    if (name !== '') {
      out.push(name);
    }
  }
  return out;
};

const readText = async (path: string, fetchFn: typeof fetch): Promise<string> => {
  const res = await fetchFn(`file://${path}`);
  if (!res.ok) {
    throw new Error(`fetch ${path} returned status ${res.status}`);
  }
  return decodeUtf8(new Uint8Array(await res.arrayBuffer()));
};

export const parseManifestText = (text: string): ManifestParseResult => {
  let raw: unknown;
  try {
    raw = JSON.parse(text.replace(/^﻿/, ''));
  } catch (e) {
    return {
      ok: false,
      series: '?',
      errors: [`not valid JSON: ${(e as Error).message}`],
      layerDicts: scrapeDictNames(text),
    };
  }
  return parseSeriesManifest(raw);
};

export const loadSeriesManifests = async (
  deps: LoadManifestDeps,
): Promise<ManifestParseResult[]> => {
  const fetchFn = deps.fetchFn ?? globalThis.fetch;
  let entries;
  try {
    entries = await deps.fileUtils.listFiles(deps.rootPath);
  } catch (e) {
    deps.logger?.warn(`${TAG} root "${deps.rootPath}" not listable: ${(e as Error).message}`);
    return [];
  }
  const files = (entries ?? []).filter(
    e => e.type === 1 && isSeriesManifestName(e.path),
  );
  const results: ManifestParseResult[] = [];
  for (const f of files) {
    const path = f.path.includes('/') ? f.path : `${deps.rootPath}/${f.path}`;
    let parsed: ManifestParseResult;
    try {
      parsed = parseManifestText(await readText(path, fetchFn));
    } catch (e) {
      parsed = {
        ok: false,
        series: '?',
        errors: [`unreadable: ${(e as Error).message}`],
        layerDicts: [],
      };
    }
    if (parsed.ok) {
      deps.logger?.log(
        `${TAG} loaded "${parsed.manifest.series}" from ${path}: ` +
          `${parsed.manifest.books.length} books, ${parsed.manifest.layers.length} layers`,
      );
    } else {
      deps.logger?.warn(
        `${TAG} INVALID manifest ${path} (${parsed.series}); ` +
          `hiding ${parsed.layerDicts.length} layer dict(s): ${parsed.errors.join('; ')}`,
      );
    }
    results.push(parsed);
  }
  return results;
};
