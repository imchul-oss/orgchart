# BRIEF-TFb: TF zone, second round

Same rules as `BRIEF-TF.md` (read it first; edit ONLY `orgchart-tf/org-chart-local.html`, same allowed functions, same
safety rules). Your first version is in that file now; fix it rather than starting over.

## What the real-browser judge found

The TF groups themselves are laid out correctly (small trees, frame, owner label, export, print all pass). One thing is
wrong: a side card that HAS a non-side parent and no children (the judge's case: a leaf side card connected from an l2
card) but that today's `autoLayout()` does not put beside its parent (it is not in `besideSide`, so today it lands in
the free side-card row right of the tree) is now placed to the RIGHT of the TF zone. Its dashed line from the parent
then runs across the whole zone (2 connector paths cross the zone's left edge).

## What to change

- Such side cards (not a TF group, not placed beside a parent) keep today's row: the free side-card row on the l1 row
  directly right of the main tree, in today's order, starting at today's first slot (`treeR + COL_GAP*2`).
- The TF zone starts to the right of that row (gap at least `COL_GAP*2` after the last of them), or right of the main
  tree when there are none. Orphans not in a TF group go right of the zone, as now.
- So nothing outside a TF group crosses the zone, and every TF group card stays right of every other card.

Then run `python VERIFY_tf.py` and write `DONE.md` with your write tool (replace its content): what you changed, one line
with the VERIFY result.
