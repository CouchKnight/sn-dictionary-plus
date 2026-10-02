#!/usr/bin/env bash
# Builds the spoiler-layered DCC glossary from the committed data in
# glossary/ and packages it as build/outputs/DCC-series.zip.
#
# Needs only committed files (data .py files + reveal_pct.json); the book
# text in glossary/txt/ is never required, so this runs in CI.
#
# Gates (any failure exits non-zero):
#   1. glossary/build_v2.py builds all layers (it also checks they are
#      cumulative).
#   2. The generated manifest matches the committed
#      glossary/manifests/dcc.series.json (no drift between data and the
#      manifest users install).
#   3. scripts/verifyLayers.mjs loads every layer through the plugin's
#      own StarDict reader and checks the spoiler probes.
#
# Zip layout (unzip into the Supernote's MyStyle/ folder):
#   SnDictPlus/dcc.series.json
#   SnDictPlus/DCC-Book-N[-Q]/dcc-bookN[-Q].{ifo,idx,dict.dz,syn} + meta.json
#   SnDictPlus/DCC-Book-N[-Q]/.refresh   (forces re-import on upgrade)
set -euo pipefail
cd "$(dirname "$0")/.."

python3 glossary/build_v2.py

if ! cmp -s glossary/out/dcc.series.json glossary/manifests/dcc.series.json; then
  echo "::error::glossary/out/dcc.series.json differs from glossary/manifests/dcc.series.json." \
       "Run python3 glossary/build_v2.py locally and commit the manifest."
  exit 1
fi

node --import ./scripts/registerTsLoader.mjs scripts/verifyLayers.mjs

stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT
mkdir -p "$stage/SnDictPlus"
for d in glossary/out/DCC-Book-*/; do
  name=$(basename "$d")
  cp -r "$d" "$stage/SnDictPlus/$name"
  touch "$stage/SnDictPlus/$name/.refresh"
done
cp glossary/out/dcc.series.json "$stage/SnDictPlus/"

mkdir -p build/outputs
rm -f build/outputs/DCC-series.zip
(cd "$stage" && zip -qr - SnDictPlus) > build/outputs/DCC-series.zip
layers=$(find "$stage/SnDictPlus" -mindepth 1 -maxdepth 1 -type d | wc -l)
echo "Wrote build/outputs/DCC-series.zip ($layers layers)"
