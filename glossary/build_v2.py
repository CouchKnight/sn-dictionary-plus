"""Build cumulative spoiler-gated DCC glossaries for sn-dictionary.

A layer is safe through a series position `covers` = (book - 1) + fraction:
four per book, at 25%, 50%, 75% and 100% ("DCC thru Book 6 · 25%", ...,
"DCC thru Book 6"). An item is in a layer once reveal.effective(book, pct)
<= covers; items without a mid-book reveal point (reveal_pct.json) unlock at
the end of their book, exactly as in the old whole-book layers.

Outputs (out/, gitignored):
  DCC-Book-N[-Q]/      StarDict (.ifo .idx .dict.dz .syn) + meta.json
  dcc.series.json      the series manifest (also copied to manifests/)
  audit-<layer>.txt    plain-text dumps for audit.py
"""
import gzip, html, json, os, re, struct, sys, unicodedata
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from model import BOOKS
import reveal
from gods import GODS
from races import RACES
from orgs import ORGS
from chars import CHARS
from skills import SPELLS, CLASSES
from items import ITEMS
from bestiary import BEASTS
from floors import FLOORS
from mechanics import MECHANICS
from timeline import TIMELINE, FAMILIES

TITLES = {1: "Dungeon Crawler Carl", 2: "Carl's Doomsday Scenario", 3: "The Dungeon Anarchist's Cookbook",
          4: "The Gate of the Feral Gods", 5: "The Butcher's Masquerade", 6: "The Eye of the Bedlam Bride",
          7: "This Inevitable Ruin", 8: "A Parade of Horribles"}
BLOCK = {"ai", "rust", "fang", "null", "sac", "guide", "manager", "bk", "the ai", "dong", "paz",
         "nothing", "the nothing", "crest", "prism", "the prism", "dream", "sacs", "grays", "the grays",
         "formidable", "victory", "samantha"}  # see ALLOW below
ALLOW = {"samantha", "the nothing", "the prism", "the grays", "paz", "dong"}  # distinctive enough to keep
OUT = os.path.join(HERE, "out")
QUARTERS = (25, 50, 75, 100)
MATCH = {1: ["dungeon crawler carl"], 2: ["doomsday scenario"], 3: ["anarchist"], 4: ["feral gods"],
         5: ["butcher"], 6: ["bedlam bride"], 7: ["inevitable ruin"], 8: ["parade of horribles"]}


class Layer:
    """One cumulative layer: Book n, q% through it."""

    def __init__(self, n, q, pcts):
        self.n, self.q, self.pcts = n, q, pcts
        self.covers = n - 1 + q / 100

    @property
    def name(self):
        return f"DCC thru Book {self.n}" if self.q == 100 else f"DCC thru Book {self.n} \u00b7 {self.q}%"

    @property
    def slug(self):
        return f"book{self.n}" if self.q == 100 else f"book{self.n}-{self.q}"

    @property
    def folder(self):
        return f"DCC-Book-{self.n}" if self.q == 100 else f"DCC-Book-{self.n}-{self.q}"

    @property
    def where(self):
        return f"Book {self.n}" if self.q == 100 else f"{self.q}% of Book {self.n}"

    def ok(self, e, kind, b, t):
        return reveal.effective(b, self.pcts.get(reveal.key(e.head, kind, t))) <= self.covers + 1e-9

    def facts(self, e):
        return [(b, t) for b, t in e.facts if self.ok(e, "fact", b, t)]

    def rel(self, e):
        return [(b, t) for b, t in e.rel if self.ok(e, "rel", b, t)]

    def aliases(self, e):
        return [a for b, al in sorted(e.aliases.items()) for a in al if self.ok(e, "alias", b, a)]

    def cat(self, e):
        if isinstance(e.cat, str):
            return e.cat
        ok = [c for b, c in sorted(e.cat, key=lambda x: x[0]) if self.ok(e, "cat", b, c)]
        return ok[-1] if ok else "Entry"  # never fall back to a later label


def norm(w):
    w = unicodedata.normalize("NFC", w)
    for a, b in {"‘": "'", "’": "'", "“": '"', "”": '"', "–": "-", "—": "-", " ": " "}.items():
        w = w.replace(a, b)
    return w.strip().lower()


def esc(t):
    t = html.escape(t, quote=False)
    t = t.replace("&lt;br&gt;", "<br>")
    for ent in ("rarr", "larr"):
        t = t.replace(f"&amp;{ent};", f"&{ent};")
    return t


def all_entries():
    seen, out = {}, []
    for grp in (GODS, RACES, ORGS, CHARS, SPELLS, ITEMS, BEASTS, FLOORS, MECHANICS, CLASSES, TIMELINE, FAMILIES):
        for e in grp:
            k = norm(e.head)
            if k in seen:
                raise SystemExit(f"duplicate headword {e.head!r}")
            seen[k] = e
            out.append(e)
    return out


def render(e, L):
    tag = lambda b: f"<font color=\"#888888\">[{b}]</font>"
    parts = [f"<b>{esc(e.head)}</b> &mdash; <i>{esc(L.cat(e))}</i>"]
    facts = L.facts(e)
    for b, t in sorted(facts, key=lambda x: x[0]):
        parts.append(f"{tag(b)} {esc(t)}")
    rel = L.rel(e)
    if rel:
        parts.append("<b>Relations:</b> " + " ".join(f"{tag(b)} {esc(t)}" for b, t in sorted(rel, key=lambda x: x[0])))
    al = [a for a in L.aliases(e) if norm(a) != norm(e.head)]
    if al:
        parts.append("<i>Also:</i> " + esc(", ".join(dict.fromkeys(al))))
    books = sorted({b for b, _ in facts} | {b for b, _ in rel})
    parts.append("<i>Books:</i> " + ", ".join(f"{b} {BOOKS[b]}" for b in books) +
                 f" &mdash; <i>safe through {L.where}</i>")
    return "<br>".join(parts)


def sort_key(w):
    b = w.encode("utf-8")
    return (bytes(c + 32 if 65 <= c <= 90 else c for c in b), b)


def key_entry(L):
    body = (f"<b>DCC books</b> &mdash; <i>Glossary key</i><br>"
            f"This dictionary is <b>safe through {L.where}: {esc(TITLES[L.n])}</b>. "
            "It contains nothing revealed later in the series.<br>"
            "Each line is tagged with the book that first reveals it:<br>" +
            "<br>".join(f"[{b}] {esc(TITLES[b])}" for b in range(1, 9)) +
            "<br>Dictionary+ picks the right DCC layer automatically from the book and page you are "
            "reading (dcc.series.json). In another dictionary app, enable only the layer for where you are.")
    return body


def build_layer(entries, L):
    name = L.name
    folder = os.path.join(OUT, L.folder)
    os.makedirs(folder, exist_ok=True)
    live = [e for e in entries if L.facts(e) and e.head != "DCC books"]
    rows = [(e.head, render(e, L), e) for e in live]
    rows.append(("DCC books", key_entry(L), None))
    rows.sort(key=lambda r: sort_key(r[0]))
    heads = {norm(r[0]) for r in rows}
    syn, sk, skipped = [], set(), []
    for i, (h, _, e) in enumerate(rows):
        al = L.aliases(e) if e else ["Dungeon Crawler Carl series", "DCC key"]
        for a in al:
            k = norm(a)
            if not k or (k in BLOCK and k not in ALLOW):
                skipped.append((a, h, "blocked")); continue
            if k in heads or k in sk:
                if k != norm(h):
                    skipped.append((a, h, "collision"))
                continue
            sk.add(k); syn.append((a, i))
    syn.sort(key=lambda s: sort_key(s[0]))
    d, idx, off = bytearray(), bytearray(), 0
    for h, body, _ in rows:
        b = body.encode("utf-8")
        idx += h.encode("utf-8") + b"\0" + struct.pack(">II", off, len(b))
        d += b; off += len(b)
    sb = bytearray()
    for w, i in syn:
        sb += w.encode("utf-8") + b"\0" + struct.pack(">I", i)
    base = os.path.join(folder, f"dcc-{L.slug}")
    open(base + ".idx", "wb").write(idx)
    open(base + ".syn", "wb").write(sb)
    with gzip.open(base + ".dict.dz", "wb", compresslevel=9) as f:
        f.write(bytes(d))
    ifo = ("StarDict's dict ifo file\nversion=3.0.0\n"
           f"bookname={name}\nwordcount={len(rows)}\nsynwordcount={len(syn)}\nidxfilesize={len(idx)}\n"
           "idxoffsetbits=32\nsametypesequence=h\n"
           "author=Compiled from the novels by Matt Dinniman\n"
           f"description=Dungeon Crawler Carl glossary, spoiler-safe through {L.where} ({TITLES[L.n]})\n")
    open(base + ".ifo", "w", encoding="utf-8", newline="\n").write(ifo)
    json.dump({"name": name, "language": "en"}, open(os.path.join(folder, "meta.json"), "w"), indent=2)
    # plain-text dump for auditing
    with open(os.path.join(OUT, f"audit-{L.slug}.txt"), "w", encoding="utf-8") as f:
        for h, body, _ in rows:
            f.write(h + "\t" + re.sub("<[^>]+>", " ", html.unescape(body)) + "\n")
        for w, i in syn:
            f.write(w + "\t=> " + rows[i][0] + "\n")
    return len(rows), len(syn), len(d), skipped, rows, syn


def manifest(layers):
    return {
        "series": "Dungeon Crawler Carl",
        "books": [{"n": n, "title": TITLES[n], "match": MATCH[n]} for n in range(1, 9)],
        "layers": [{"dict": L.name, "covers": round(L.covers, 4)} for L in layers],
    }


def main():
    entries = all_entries()
    pcts = reveal.load_pcts()
    layers = [Layer(n, q, pcts) for n in range(1, 9) for q in QUARTERS]
    prev = None
    for L in layers:
        r, s, b, sk, rows, syn = build_layer(entries, L)
        content = ({h for h, _, _ in rows}, {w for w, _ in syn},
                   {(e.head, x) for _, _, e in rows if e for x in L.facts(e) + L.rel(e)})
        if prev is not None:
            # Cumulative: a later layer never loses anything an earlier one had.
            for got, had, what in zip(content, prev, ("headwords", "aliases", "facts")):
                missing = had - got
                if missing:
                    raise SystemExit(f"{L.name} drops {what} present earlier: {sorted(missing)[:5]}")
        prev = content
        mid = sum(1 for e in entries for k, bk, t, key in reveal.items(e)
                  if bk == L.n and key in pcts and reveal.effective(bk, pcts[key]) <= L.covers + 1e-9
                  and pcts[key] < 100)
        print(f"{L.name}: headwords={r} aliases={s} bytes={b} mid-book items={mid}")
        if L.n == 8 and L.q == 100:
            for a, h, why in sk:
                print(f"   skipped {a!r} on {h!r} ({why})")
    m = manifest(layers)
    for path in (os.path.join(OUT, "dcc.series.json"), os.path.join(HERE, "manifests", "dcc.series.json")):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(m, f, indent=2, ensure_ascii=False)
            f.write("\n")
    print(f"wrote dcc.series.json ({len(layers)} layers)")


if __name__ == "__main__":
    main()
