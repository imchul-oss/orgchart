# BRIEF-TF: a TF zone for side cards that have a subtree or no parent

Edit ONLY `orgchart-tf/org-chart-local.html`. Make only the change below. If it is not enough to reach `VERIFY GREEN`,
stop, write the reason in `DONE.md`, and end.

Write only inside this directory (the clone); never cd out of it. Never run `find /`, `find ~`, `ls -R /`, `grep -r` or
any other recursive search outside this directory. Never run rm -rf or any delete command. Do not run git commands.
Edit files with your edit/write tool. Do not touch `VERIFY_tf.py`, `BRIEF*.md`, or `orgchart-tf/org-chart-local.base.html`.

Run `python VERIFY_tf.py` (or `python3`) in the FOREGROUND as one shell call and wait for its output. It is a static check
only; the session re-runs a real-browser judge on real data with added side cards.

## Background

A card of type `side` stands for a TF, a temporary organisation outside the regular hierarchy. Today `autoLayout()`
places a side card that is not a "beside" card (`sideBesideParent()` returns null: it has non-side children, or no
non-side parent) in a row to the right of the tree, and its children become orphans placed further right one by one,
so a TF with a subtree falls apart, and the dashed line from its parent runs across the whole chart. The owner wants TFs
shown as temporary organisations, kept apart from the regular hierarchy, not attached to the tree.

## What to build

1. **TF groups.** A TF group = one side card S for which `sideBesideParent(S)` is null, plus every card reachable from S
   through connections going down from S (S to child, child to grandchild, ...) that is not otherwise part of the main
   tree. Leaf side cards with a parent (beside cards) are NOT TF groups and keep today's place beside their parent.
2. **Layout in `autoLayout()`.** Lay each TF group out as a small tree: S on top, its children in a row below it, their
   children below them, rows separated like the main tree, each parent centred over its children. Place the groups
   side by side, left to right, to the right of the main tree with a gap of at least `COL_GAP*2`, all group tops on the
   y of the l1 row (the row today's code already uses for side cards). Every card that is not in a TF group (the main
   tree, beside cards, sheets without TF groups) must get exactly the position it gets today, and connector paths on
   sheets without TF groups must be identical. Orphans that are not in a TF group go to the right of the zone.
3. **Zone frame.** In `render()`, when the current sheet has TF groups, draw one element `<div class="tfzone">` inside
   `#canvas`, behind the cards, around all TF group cards (computed from the cards' current positions every render, so
   it follows manual drags and survives save and load), with at least 24px padding on every side plus room at the top
   for its title. Title text `TF · 임시 조직`, small, at the frame's top-left. Light tinted background, dashed rounded
   border, pointer-events none. No frame on a sheet without TF groups. Visible in print.
4. **Owner label instead of the long line.** For a TF group whose side card S has a non-side parent P (a connection
   P to S), do not draw that connection's line; instead draw `<div class="tfowner">주관: {P's ko title, or en when ko is
   empty}</div>` directly above S inside the zone (its bottom between 2 and 24px above S's top, left aligned with S,
   pointer-events none). The connection stays in the data. Connections inside a TF group are drawn as usual. No line
   may cross the zone's left edge.
5. **Picture export.** `exportPNG()` draws the frame, the title `TF · 임시 조직` and each owner label text
   `주관: ...` (each as its own `fillText` call) in the same places.

## Where you may edit

New CSS, new top-level functions. Of the existing functions you may change only `autoLayout`, `render`, `drawConns`, `updateCanvas`
(so the canvas size includes the frame),
`exportPNG`. Nothing else.

Then run `python VERIFY_tf.py` and write `DONE.md` with your write tool (replace its content): what you added, one line
with the VERIFY result.
