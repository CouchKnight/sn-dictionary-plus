"""Name-leak audit over every layer (needs txt/ and out/ from build_v2.py).

For each layer, every capitalised token in its dump must already appear in
the text the reader has seen: Books 1..n-1 in full, plus the first
(q% - reveal.MARGIN) of Book n. Tokens are compared as stems (any case, a
trailing possessive or plural "s" ignored).

Two kinds of token:
  - NAME tokens (words of any glossary headword or alias) must stem-match the
    seen text. Printing the name later in lowercase ("nullian") can't hide a
    leak.
  - Any other capitalised word is ordinary English (skipped) if it appears in
    lowercase anywhere in the series ("Wears", "Galactic").

Flagged tokens marked * do appear later in the series: likely spoilers.
Unmarked ones appear nowhere in the books (editorial words, typos).
"""
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import reveal
from build_v2 import QUARTERS, all_entries

WORD = re.compile(r"[A-Za-z][A-Za-z'\-]*")
CAP = re.compile(r"\b[A-Z][A-Za-z'\-]{2,}\b")


def tokens(t):
    return set(WORD.findall(t))


def stem(w):
    w = w.lower()
    if w.endswith("'s"):
        w = w[:-2]
    if len(w) > 3 and w.endswith("s"):
        w = w[:-1]
    return w


def main():
    bk = {n: t.replace("’", "'") for n, t in reveal.books().items()}
    full = {n: tokens(t) for n, t in bk.items()}
    names = set()
    for e in all_entries():
        for part in [e.head] + [a for al in e.aliases.values() for a in al]:
            names |= {stem(w) for w in WORD.findall(part) if w[0].isupper()}
    ordinary = {stem(w) for t in bk.values() for w in WORD.findall(t) if w.islower()} - names
    total = 0
    for n in range(1, 9):
        for q in QUARTERS:
            cut = 1.0 if q == 100 else max(0.0, q / 100 - reveal.MARGIN)
            prefix = bk[n][: int(len(bk[n]) * cut)]
            seen = set().union(*(full[b] for b in range(1, n)), tokens(prefix)) if n > 1 else tokens(prefix)
            later = set().union(tokens(bk[n][len(prefix):]), *(full[b] for b in range(n + 1, 9)))
            seen_stems = {stem(w) for w in seen}
            later_stems = {stem(w) for w in later}
            slug = f"book{n}" if q == 100 else f"book{n}-{q}"
            txt = open(os.path.join(HERE, "out", f"audit-{slug}.txt"), encoding="utf-8").read().replace("’", "'")
            txt = "\n".join(l for l in txt.splitlines() if not l.startswith("DCC books"))
            bad = set()
            for w in CAP.findall(txt):
                for p in re.sub(r"'s$", "", w).split("-"):
                    if len(p) < 3 or stem(p) in seen_stems or stem(p) in ordinary:
                        continue
                    bad.add(p + ("*" if stem(p) in later_stems else ""))
            total += sum(1 for b in bad if b.endswith("*"))
            label = f"Book {n}" + ("" if q == 100 else f" {q}%")
            print(f"{label:12} {' '.join(sorted(bad))}")
    print(f"\n{total} flagged token(s) that appear later in the series (*)")


if __name__ == "__main__":
    main()
