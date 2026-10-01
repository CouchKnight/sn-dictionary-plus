// Verifies the series glossary layers built by glossary/build_v2.py, through
// the plugin's OWN StarDict reader and HTML renderer (not a reimplementation):
//   - every layer in the manifest loads and every entry renders;
//   - layers are cumulative (a probe, once present, stays present);
//   - each probe first appears in a layer of its expected book.
// Run from the repo root after `python3 glossary/build_v2.py`:
//   node --import ./scripts/registerTsLoader.mjs scripts/verifyLayers.mjs
import {readFile} from 'node:fs/promises';
import {buildDict, lookupDict} from '../src/core/dict/stardict/stardictDict.ts';
import {htmlToPlainText} from '../src/ui/htmlToPlainText.ts';
import {containsRenderableHtml} from '../src/ui/htmlParser.ts';

const OUT = process.env.DCC_OUT || new URL('../glossary/out', import.meta.url).pathname;
// Probe -> the book where it is first revealed (handoff §5, plus fixes).
const PROBES = {
  samantha: 4, 'Night Wyrm': 3, Hamed: 6, Theia: 7, Khepri: 7, 'Scavenger’s Daughter': 6,
  'War Mage Rebellion': 7, 'Sir Ferdinand': 7, Grull: 1, 'Oak Mother': 2, Beatrice: 1,
  Residual: 6, 'Nebular Balance': 6, Penny: 8, Nullian: 5, Null: 2, 'Lemig Sortition': 5,
};

const manifest = JSON.parse(await readFile(`${OUT}/dcc.series.json`, 'utf8'));
const folderOf = covers => {
  const n = Math.ceil(covers - 1e-9);
  const q = Math.round((covers - (n - 1)) * 100);
  return q === 100 ? [`DCC-Book-${n}`, `dcc-book${n}`] : [`DCC-Book-${n}-${q}`, `dcc-book${n}-${q}`];
};

let failures = 0;
const firstSeen = {};
for (const layer of manifest.layers) {
  const [folder, base] = folderOf(layer.covers);
  const D = `${OUT}/${folder}/${base}`;
  const [ifo, idx, dz, syn] = await Promise.all(['.ifo', '.idx', '.dict.dz', '.syn'].map(e => readFile(D + e)));
  const dict = await buildDict(ifo, idx, dz, syn);
  if (dict.meta.bookname !== layer.dict) {
    failures++;
    console.log(`!! ${folder}: bookname "${dict.meta.bookname}" != manifest "${layer.dict}"`);
  }
  let bad = 0;
  for (const [k] of dict.index) {
    const h = lookupDict(dict, k);
    const t = htmlToPlainText(h.definition);
    if (!containsRenderableHtml(h.definition) || !t || t.includes('<') || t.includes('&amp;')) {
      bad++;
    }
  }
  const book = Math.ceil(layer.covers - 1e-9);
  const marks = [];
  for (const [probe, expected] of Object.entries(PROBES)) {
    const hit = !!lookupDict(dict, probe);
    if (hit && firstSeen[probe] === undefined) {
      firstSeen[probe] = book;
    }
    if (!hit && firstSeen[probe] !== undefined) {
      failures++;
      marks.push(`!!${probe} vanished`);
    }
    if (hit && book < expected) {
      failures++;
      marks.push(`!!${probe} early`);
    }
  }
  failures += bad;
  console.log(`${layer.dict.padEnd(24)} keys=${String(dict.index.size).padStart(3)} renderProblems=${bad} ${marks.join(' ')}`);
}
for (const [probe, expected] of Object.entries(PROBES)) {
  if (firstSeen[probe] !== expected) {
    failures++;
    console.log(`!! ${probe}: first seen in Book ${firstSeen[probe] ?? 'never'}, expected Book ${expected}`);
  }
}
console.log(failures === 0 ? `OK: ${manifest.layers.length} layers verified` : `${failures} problem(s)`);
process.exit(failures === 0 ? 0 : 1);
