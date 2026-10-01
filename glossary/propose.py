"""Propose mid-book reveal points for review (LOCAL helper; needs txt/).

For each item of a book that has no reveal point yet, split it into claims
(sentences / semicolon clauses). For each claim, find the first passage
(a ~3-paragraph window) where the entry's name and the claim's key terms
occur together. The proposal is the LATEST claim's position. Nothing is
accepted automatically: the output lists every claim's evidence snippet for
a human to check, and `accept` writes reviewed choices into quotes.local.json.

  python3 propose.py list <book> [regex-on-head]   review listing
  python3 propose.py accept <book> <decisions.json>
      decisions: {item key: "auto"            -> use the proposal
                            | "<regex>"       -> first match of regex (in book)
                            | null}           -> leave at end of book
"""
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import reveal
from build_v2 import all_entries

STOP = set("""a an the and or of to in on at by for with from as is are was were be been his her
its their he she it they them this that these those who whom which what when where how not no
but also into out up down over after before than then so one two three four five six seven
eight nine ten first second third fourth fifth sixth seventh eighth ninth tenth floor book
crawler crawlers carl donut dungeon earlier later still now e.g""".split())


def windows(text):
    """(start_offset, window_text): each paragraph with the two before it."""
    paras, pos = [], 0
    for m in re.finditer(r"[^\n]+", text):
        paras.append((m.start(), m.group()))
    for i in range(len(paras)):
        lo = max(0, i - 2)
        yield paras[i][0], " ".join(p for _, p in paras[lo:i + 1]), paras[i][1]


def names_of(e):
    ns = {e.head} | {a for al in e.aliases.values() for a in al}
    parts = e.head.split()
    if len(parts) > 1 and parts[0][0].isupper() and len(parts[0]) > 3 and parts[0].lower() not in STOP:
        ns.add(parts[0])
    return {n for n in ns if len(n) > 2}


def claims(t):
    t = re.sub(r"\([^)]*\)", "", t)
    return [c.strip() for c in re.split(r"(?<=[.!?])\s+|;\s+", t) if len(c.strip()) > 3]


def terms_of(c, names):
    low_names = {w.lower() for n in names for w in n.split()}
    words = re.findall(r"[A-Za-z][A-Za-z'\-]+|\d+", c)
    caps = [w for i, w in enumerate(words) if w[0].isupper() and w.lower() not in STOP
            and w.lower() not in low_names and not (i == 0 and w.lower() in STOP)]
    caps = [re.sub(r"'s$", "", w) for w in caps]
    if caps:
        return list(dict.fromkeys(caps))[:4]
    content = sorted({w.lower() for w in words if len(w) >= 6 and w.lower() not in STOP}, key=len, reverse=True)
    return content[:2]


def first_hit(raw, names, terms):
    name_re = re.compile("|".join(r"(?<![A-Za-z])" + re.escape(n) + r"(?![A-Za-z])" for n in sorted(names, key=len, reverse=True)))
    for need in (len(terms), max(1, (len(terms) + 1) // 2)):
        for off, win, last in windows(raw):
            if not name_re.search(win):
                continue
            hit = [t for t in terms if re.search(r"(?<![A-Za-z])" + re.escape(t), win, re.I)]
            if len(hit) >= need:
                return off, win, need < len(terms)
    return None


def raw_book(n):
    import glob
    f = glob.glob(os.path.join(HERE, "txt", f"{n}-*.txt"))[0]
    return open(f, encoding="utf-8").read()


def propose(n, head_re=None):
    raw = raw_book(n)
    pcts = reveal.load_pcts()
    out = []
    for e in all_entries():
        if head_re and not re.search(head_re, e.head):
            continue
        names = names_of(e)
        for kind, b, t, k in reveal.items(e):
            if b != n or k in pcts or kind == "alias":
                continue
            per = []
            for c in claims(t) or [t]:
                terms = terms_of(c, names)
                h = first_hit(raw, names, terms) if terms else None
                per.append((c, terms, h))
            ok = all(h for _, _, h in per)
            pct = max(100 * h[0] / len(raw) for _, _, h in per) if ok else None
            out.append((e, kind, t, k, per, pct))
    return raw, out


def snippet(win, terms, width=110):
    m = None
    for t in terms:
        m = re.search(re.escape(t), win, re.I)
        if m:
            break
    i = m.start() if m else len(win) // 2
    return re.sub(r"\s+", " ", win[max(0, i - width):i + width])


def main(argv):
    if argv[:1] == ["list"]:
        raw, out = propose(int(argv[1]), argv[2] if len(argv) > 2 else None)
        for e, kind, t, k, per, pct in out:
            print(f"\n## {k}  [{kind}] -> {'%.1f%%' % pct if pct is not None else 'NO PROPOSAL'}")
            print(f"   {t}")
            for c, terms, h in per:
                if h:
                    print(f"   - {100 * h[0] / len(raw):5.1f}% {'(partial) ' if h[2] else ''}{terms}: ...{snippet(h[1], terms)}...")
                else:
                    print(f"   - none   {terms}: {c[:80]}")
    elif argv[:1] == ["accept"]:
        n, decisions = int(argv[1]), json.load(open(argv[2], encoding="utf-8"))
        raw, out = propose(n)
        bk = reveal.books()[n]
        quotes = json.load(open(reveal.QUOTES_FILE, encoding="utf-8")) if os.path.exists(reveal.QUOTES_FILE) else {}
        by_key = {k: (per, pct) for _, _, _, k, per, pct in out}
        done = 0
        for k, d in decisions.items():
            if d is None:
                continue
            if d == "auto":
                per, pct = by_key[k]
                if pct is None:
                    print("no proposal for", k); continue
                off = max(h[0] for _, _, h in per)
            else:
                m = re.search(d, raw)
                if not m:
                    print("regex not found for", k, d); continue
                off = m.start()
            # Shortest unique quote starting at the evidence paragraph.
            start = reveal.norm_text(raw[off:off + 400])
            q = None
            for ln in range(30, len(start), 10):
                cand = start[:ln]
                if bk.count(cand) == 1:
                    q = cand; break
            if q is None:
                print("could not make a unique quote for", k); continue
            quotes[k] = {"book": n, "quote": q}
            done += 1
        json.dump(quotes, open(reveal.QUOTES_FILE, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
        print(f"recorded {done} quotes in quotes.local.json")
    else:
        print(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
