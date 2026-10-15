# BRIEF-ROT: sideways chart (head card at the left or the right)

Edit ONLY `orgchart-rot/org-chart-local.html`. Make only the change below. If it is not enough to reach `VERIFY GREEN`,
stop, write the reason in `DONE.md`, and end.

Write only inside this directory (the clone); never cd out of it. Never run `find /`, `find ~`, `ls -R /`, `grep -r` or
any other recursive search outside this directory. Never run rm -rf or any delete command. Do not run git commands.
Edit files with your edit/write tool. Do not touch `VERIFY_rot.py`, `BRIEF*.md`, or `orgchart-rot/org-chart-local.base.html`.

Run `python VERIFY_rot.py` (or `python3`) in the FOREGROUND as one shell call and wait for its output. It is a static check
only; the session re-runs a real-browser judge on real data.

## Goal

Today the chart grows downward: the head card (type `top`) on top, each level one row lower. Add an orientation option
so the same tree can grow sideways: head card at the left and levels as columns to the right, or head card at the
right and levels to the left. Like the current chart turned 90 degrees, with cards kept upright.

## What to build

1. `OPT.orient`: `'down'` (default, today's layout, unchanged in every detail), `'right'` (head at the left, tree grows
   to the right), `'left'` (head at the right, tree grows to the left). `_applyOptObj()` restores it from saved options
   (`'right'`/`'left'` as given, anything else becomes `'down'`). `_fileData().opt` carries it (OPT is saved whole).
2. Options panel: next to the other display options, a row with label `차트 방향` and
   `<select id="opt-orient">` with options `down` = `위에서 아래로`, `right` = `왼쪽에서 오른쪽으로`, `left` =
   `오른쪽에서 왼쪽으로`. On change: set `OPT.orient`, run `autoLayout()`, `saveOptLS()`. `openOptions()` shows the
   current value.
3. `autoLayout()` with `'right'`: the main tree's levels become columns. A card's column comes from the same depth rule
   the down layout uses for rows (`_d`), and column x = left edge + depth * (NW + gap), gap at least 60. Within its
   column, a parent's subtree takes a vertical band; children are stacked top to bottom in the same order they have left
   to right in the down layout, separated by a gap of at least 20, and each parent is centred vertically on its
   children's centres. Card heights differ (they grow with members), so stack by real height (`nh(n)`). With `'left'`
   mirror the x positions so the head card is the rightmost. Cards that are not plain tree children (aside cards,
   beside side cards, TF zone groups, orphans) must not overlap anything: put aside and beside cards in the parent's
   column right below the parent's own band, and the TF zone and orphans below the whole tree. Keep the existing
   scale/centring and scroll logic working (centre on the head card).
4. `drawConns()` with `'right'`/`'left'`: solid tree connections as elbow buses turned sideways: from the parent's
   facing edge middle (right edge for `'right'`, left edge for `'left'`) horizontally to a bus x halfway to the child
   column, a vertical bus spanning the children, and horizontally into each child's facing edge middle. Dashed
   connections and the other cases may use direct elbow lines, but no line may run through a card. With `'down'`,
   `drawConns()` must produce exactly today's paths.
5. Collapse, search, the layout check (lint badge), PNG export and print already read card positions and the SVG
   paths; they must keep working in all three orientations. The layout check must report no overlap and no crossing
   for a normal chart in `'right'` and `'left'`.

## Where you may edit

New CSS, one new row in the options panel markup, new top-level functions. Of the existing functions you may change only
`autoLayout`, `drawConns`, `_applyOptObj`, `openOptions`, `connAnchor`, `autoSide`, and the `OPT` defaults (add
`orient:'down'`). Nothing else. The cleanest shape is probably to keep today's code path untouched for `'down'` and
branch early into new functions for the sideways layout and its connectors.

Then run `python VERIFY_rot.py` and write `DONE.md` with your write tool (replace its content): what you added, one line
with the VERIFY result.
