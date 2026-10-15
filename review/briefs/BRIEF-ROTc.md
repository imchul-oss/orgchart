# BRIEF-ROTc: sideways chart, third round

Same rules as `BRIEF-ROT.md` (read it first; edit ONLY `orgchart-rot/org-chart-local.html`, same allowed functions, same
safety rules). Your second version is in that file now; fix it rather than starting over.

## What the real-browser judge found

`OPT.posOrient` is one value for the whole file, but positions belong to each sheet. Sequence that breaks: lay out sheet
0 sideways, switch to sheet 1 and lay it out sideways, set `'down'`, lay out sheet 1 (this sets `posOrient` to
`'down'`), switch to sheet 0 and lay it out: sheet 0's positions are still sideways but are read by x, so its sibling
order is lost and it does not return to its original down positions.

## What to change

- Keep the orientation that produced the positions per sheet: store it on the current sheet object
  (`SHEETS[CUR_SHEET].posOrient`), which `_cleanSheets()` already saves with the sheet, and read it from there in
  `autoLayout()`. A sheet without the field counts as `'down'`. Remove `OPT.posOrient` (and its handling in
  `_applyOptObj`), so an old value in saved options has no effect.
- Then every sheet keeps its own sibling order through any sequence of orientation changes and sheet switches.

Then run `python VERIFY_rot.py` and write `DONE.md` with your write tool (replace its content): what you changed, one line
with the VERIFY result.
