"""Build the committed org-chart-local.html from a working copy by emptying its built-in content.

The working copy (kept outside git, e.g. data/org-chart-local.html) carries an organisation's own defaults: page
title, logo text, category lists and placeholder sample data. The committed file must carry none of them, so every
commit goes through this script:

    python tools/sanitize.py data/org-chart-local.html org-chart-local.html

Emptied: <title> and the logo text (generic "조직도"), OPT.logoText and its fallback, OPT.jobCats / roleCats / areaCats, and the
sample sheet in init() (no cards, no connections). Kept: status items and stats groups (app semantics), colours,
sizes, all code. The script fails if any expected block is missing, so a code change that moves one of them is
noticed instead of silently committing content.
"""
import re
import sys


def sub_once(pattern, repl, text, what):
    new, n = re.subn(pattern, repl, text, count=1, flags=re.S)
    if n != 1:
        sys.exit("sanitize: could not find " + what)
    return new


def sanitize(t):
    t = sub_once(r"<title>[^<]*</title>", "<title>조직도</title>", t, "<title>")
    t = sub_once(r'(<span class="tl">)[^<]*(</span>)', r"\g<1>조직도\g<2>", t, "logo span")
    t = sub_once(r"(logoText\s*:\s*)'[^']*'", r"\g<1>''", t, "OPT.logoText")
    for key in ("jobCats", "roleCats", "areaCats"):
        t = sub_once(r"(\n\s*" + key + r":)\[[^\]]*\]", r"\g<1>[]", t, "OPT." + key)
    t = sub_once(r"(function init\(\) \{\s*S\.nodes = )\[.*?\n  \];(\s*S\.conns = )\[.*?\n  \];",
                 r"\g<1>[];\g<2>[];", t, "init() sample data")
    t = sub_once(r"/\* ── AIM Brand Colors", "/* ── Brand Colors", t, "brand colour comment")
    t, n = re.subn(r"\|\|\s*'AIM'", "||'조직도'", t)
    if n != 2:
        sys.exit("sanitize: expected 2 logo fallbacks, found %d" % n)
    for word in ["AIM"] + FORBIDDEN:
        if word in t:
            sys.exit("sanitize: a forbidden word is still in the output (see data/forbidden.txt)")
    return t


# Words that must never reach a commit (organisation and site names). Kept in the gitignored data/ folder so this
# public script does not itself carry them; one word per line.
FORBIDDEN = []
try:
    import os
    _fp = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "forbidden.txt")
    FORBIDDEN = [w.strip() for w in open(_fp, encoding="utf-8") if w.strip()]
except OSError:
    pass


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("usage: sanitize.py <working-copy.html> <output.html>")
    src = open(sys.argv[1], encoding="utf-8").read().replace("\r\n", "\n")
    out = sanitize(src)
    with open(sys.argv[2], "w", encoding="utf-8", newline="\n") as f:
        f.write(out)
    print("sanitize: wrote " + sys.argv[2])
