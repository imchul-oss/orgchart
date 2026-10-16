# Change request: leaf side cards always sit beside their parent

## Background

A card of type `side` stands for a TF (temporary task force). A side card with a subtree or with no parent goes into the
TF zone; that stays as it is. A **leaf** side card with a non-side parent (`sideBesideParent(id)` returns the parent) is
meant to sit right beside its parent, like the existing "beside" cards (`sideKids`, `besideSide`, `_asides`, `_bs`,
`besideSplit` in `autoLayout()`).

That works only for some parents. In `autoLayout()`, children of a parent whose children mix leaves and subtrees are
partly laid out through a path that never calls `place()` for the leaf siblings, so `(sideKids[id]||[]).forEach(...)`
never runs for them. The leaf side card is then not in `besideSide`, falls into the free side-card row right of the
tree, and its dashed line from the parent crosses the whole row of cards (the layout check badge reports 9 crossings
with the judge's scenario). The review on 2026-10-15 found this in base v0 already, so this is an old defect.

## What to change

- Every leaf side card with a non-side parent is placed beside that parent in the down layout, the same way the
  existing beside cards are: same y as the parent, to its right at the usual beside offset (`r20(p.x+NW+COL_GAP)`,
  left side when the parent's `ad` says so), with room reserved in the parent's row so nothing overlaps. The fix
  belongs where the parent's beside list is built, so that every tree node gets its `sideKids` regardless of which
  layout path places it.
- In the sideways layouts (`OPT.orient` right/left), beside cards already go in the parent's column below the parent's
  band; keep that working for these cards too.
- Nothing changes for sheets without side cards: positions and connector paths stay exactly as today.
- After the change, on the judge's scenario the layout check badge reports no overlap and no crossing in all three
  orientations, and the TF zone stays right of every other card.

## Judges

- New: `review/judges/VERIFY_beside.js`.
- Also new: `review/judges/VERIFY_tf2.js`, which is the TF zone judge with its T3 check changed from "in the free row" to
  "beside its parent".
- Regression: `VERIFY_tb.js`, `VERIFY_rot.js`, `VERIFY_tree.js`.
