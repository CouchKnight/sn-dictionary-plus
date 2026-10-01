#!/bin/bash
# Local only — NEVER commit txt/ or the epubs (public repo).
# Usage: ./extract_text.sh /path/to/epubs   -> txt/1-*.txt ... txt/8-*.txt (series order)
# Epub names may use underscores or spaces ("The_Butchers_Masquerade.epub" or
# "The Butchers Masquerade.epub"). A missing book is skipped with a warning;
# its number stays reserved so the others keep their series position.
set -euo pipefail
mkdir -p txt
i=1
missing=0
for b in Dungeon_Crawler_Carl Carls_Doomsday_Scenario The_Dungeon_Anarchists_Cookbook The_Gate_of_the_Feral_Gods The_Butchers_Masquerade The_Eye_of_the_Bedlam_Bride This_Inevitable_Ruin A_Parade_of_Horribles; do
  src="$1/$b.epub"
  [[ -f "$src" ]] || src="$1/${b//_/ }.epub"
  if [[ -f "$src" ]]; then
    pandoc "$src" -t plain --wrap=none -o "txt/$i-$b.txt"
  else
    echo "warning: book $i ($b) not found in $1 — skipped" >&2
    missing=$((missing+1))
  fi
  i=$((i+1))
done
echo "extracted $((8-missing)) of 8 books into txt/"
