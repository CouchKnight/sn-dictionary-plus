"""Mid-book reveal points for the spoiler-layered glossary (handoff §3.4).

Every tagged item (fact, relation, alias, category label) belongs to the book
that first reveals it. This module adds WHERE in that book: a percentage
(0-100) of the way through the book's text.

  reveal_pct.json     COMMITTED. {item key: pct}. Numbers only, no book text.
  quotes.local.json   LOCAL ONLY (gitignored; the repo is public). {item key:
                      {"book": n, "quote": "..."}}: a short distinctive
                      substring of the passage that reveals the item, used to
                      re-derive its pct from txt/.

How a pct is found:
  - aliases: automatically, the first case-sensitive, whole-word occurrence of
    the name in its book (a name is revealed where it is first printed);
  - facts, relations, categories: from a hand-checked quote. The quote must
    occur exactly once in its book.
  - anything else: 100 (end of the book). Missing data errs safe.

Keys hash the item text, so editing a fact invalidates its pct (back to 100).

Usage (from glossary/, needs txt/ from extract_text.sh):
  python3 reveal.py compute              rebuild reveal_pct.json, report gaps
  python3 reveal.py todo <book>          items in <book> with no pct yet
  python3 reveal.py show <book> <regex>  passages (with %) matching a regex
"""
import glob, hashlib, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
PCT_FILE = os.path.join(HERE, "reveal_pct.json")
QUOTES_FILE = os.path.join(HERE, "quotes.local.json")
# Position slack added to every mid-book reveal point. The device measures
# page/total; the build measures characters. Images, front matter and reflow
# make them differ a little, so an item unlocks 3% of a book later than its
# text position. Never pushes an item past the end of its book.
MARGIN = 0.03


def key(head, kind, text):
    if kind == "alias":
        return f"{head}|alias|{text}"
    return f"{head}|{kind}|{hashlib.sha1(text.encode('utf-8')).hexdigest()[:10]}"


def norm_text(t):
    for a, b in {"‘": "'", "’": "'", "“": '"', "”": '"', "–": "-",
                 "—": "-", " ": " "}.items():
        t = t.replace(a, b)
    return re.sub(r"\s+", " ", t)


_BOOKS = None


def books():
    """{n: normalised text} for txt/N-*.txt."""
    global _BOOKS
    if _BOOKS is None:
        _BOOKS = {}
        for f in sorted(glob.glob(os.path.join(HERE, "txt", "*.txt"))):
            n = int(os.path.basename(f).split("-")[0])
            _BOOKS[n] = norm_text(open(f, encoding="utf-8").read())
    return _BOOKS


def load_pcts():
    if not os.path.exists(PCT_FILE):
        return {}
    return json.load(open(PCT_FILE, encoding="utf-8"))


def effective(book, pct):
    """Series position at which an item becomes safe: (book-1) + pct + margin,
    capped at the end of its book. pct None -> end of book."""
    if pct is None or pct >= 100:
        return float(book)
    return min(float(book), (book - 1) + pct / 100 + MARGIN)


def items(e):
    """Every tagged item of an entry as (kind, book, text, key)."""
    out = [("fact", b, t, key(e.head, "fact", t)) for b, t in e.facts]
    out += [("rel", b, t, key(e.head, "rel", t)) for b, t in e.rel]
    out += [("alias", b, a, key(e.head, "alias", a)) for b, al in e.aliases.items() for a in al]
    if not isinstance(e.cat, str):
        out += [("cat", b, c, key(e.head, "cat", c)) for b, c in e.cat]
    return out


def alias_pct(text, name):
    m = re.search(r"(?<![A-Za-z0-9])" + re.escape(norm_text(name)) + r"(?![A-Za-z0-9])", text)
    return None if m is None else 100 * m.start() / len(text)


def quote_pct(text, quote):
    q = norm_text(quote)
    first = text.find(q)
    if first < 0:
        raise ValueError("quote not found")
    if text.find(q, first + 1) >= 0:
        raise ValueError("quote is not unique in its book")
    return 100 * first / len(text)


def compute(entries):
    bk = books()
    quotes = json.load(open(QUOTES_FILE, encoding="utf-8")) if os.path.exists(QUOTES_FILE) else {}
    pcts, problems, live = {}, [], set()
    for e in entries:
        for kind, b, t, k in items(e):
            live.add(k)
            if b not in bk:
                continue
            if kind == "alias":
                p = alias_pct(bk[b], t)
                if p is None:
                    problems.append(f"INFO alias not printed verbatim in Book {b}, unlocks at end of book: {t!r} ({e.head})")
                else:
                    pcts[k] = round(p, 2)
            elif k in quotes:
                q = quotes[k]
                if q.get("book") != b:
                    problems.append(f"quote for {k} is for Book {q.get('book')}, item is Book {b}")
                    continue
                try:
                    pcts[k] = round(quote_pct(bk[b], q["quote"]), 2)
                except ValueError as err:
                    problems.append(f"{err}: {k} {q['quote']!r}")
    stale = sorted(set(quotes) - live)
    return pcts, problems, stale


def main(argv):
    sys.path.insert(0, HERE)
    from build_v2 import all_entries
    entries = all_entries()
    if len(argv) >= 1 and argv[0] == "compute":
        pcts, problems, stale = compute(entries)
        json.dump(dict(sorted(pcts.items())), open(PCT_FILE, "w", encoding="utf-8"),
                  indent=1, ensure_ascii=False)
        open(PCT_FILE, "a").write("\n")
        print(f"wrote {len(pcts)} reveal points to reveal_pct.json")
        for p in problems:
            print("  " + (p if p.startswith("INFO") else "PROBLEM " + p))
        for s in stale:
            print("  STALE quote (item text changed or removed):", s)
    elif len(argv) >= 2 and argv[0] == "todo":
        n, pcts = int(argv[1]), load_pcts()
        for e in entries:
            for kind, b, t, k in items(e):
                if b == n and k not in pcts:
                    print(f"{k}\t{kind}\t{t}")
    elif len(argv) >= 3 and argv[0] == "show":
        n, pat = int(argv[1]), re.compile(argv[2])
        text = books()[n]
        for m in pat.finditer(text):
            s = max(0, m.start() - 160)
            print(f"[{100 * m.start() / len(text):5.1f}%] ...{text[s:m.end() + 160]}...")
    else:
        print(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
