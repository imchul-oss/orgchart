# BRIEF-ROTb: sideways chart, second round

Same rules as `BRIEF-ROT.md` (read it first; edit ONLY `orgchart-rot/org-chart-local.html`, same allowed functions, same
safety rules). Your first version is in that file now; fix it rather than starting over.

## What the real-browser judge found

Everything passes in all three orientations except one thing: switching back. Lay out with `'right'` (or `'left'`), then
set `'down'` and run `autoLayout()` again: the cards do not come back to the reference positions. Cause: `autoLayout()`
orders each parent's children by their current x (to keep the user's manual left-to-right order), but after a sideways
layout the siblings share one x and differ only in y, so the order is lost.

## What to change

- Whenever a layout reads the current sibling order from positions, read it along the axis the positions were made
  in: in a chart whose current positions come from a sideways layout, the order is top to bottom (y); in a down chart it
  stays today's rule. Keep track of which orientation produced the current positions (for example a field saved with
  the sheet or in OPT, restored on load) rather than guessing from geometry, and keep today's rule exactly for charts
  that were never laid out sideways.
- So `'down'` -> `'right'` -> `'down'` gives exactly the first `'down'` positions, and `'right'` -> `'left'` -> `'right'`
  keeps the sibling order too.
- Also widen the gap between columns in the sideways layout to at least 60px (it is about 52px now).

Then run `python VERIFY_rot.py` and write `DONE.md` with your write tool (replace its content): what you changed, one line
with the VERIFY result.
