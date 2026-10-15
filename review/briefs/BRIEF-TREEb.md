# BRIEF-TREEb: list view, second round

Same rules as `BRIEF-TREE.md` (read it first; edit ONLY `orgchart-tree/org-chart-local.html`, same allowed functions,
same safety rules). Your first version is in that file now; fix it rather than starting over.

## What the real-browser judge found

1. The list shows in print. `#treeview.tv-open{display:flex!important}` is more specific than
   `@media print{#treeview{display:none!important}}`, so an open list is printed over the chart. Make the print rule
   win (for example `@media print{#treeview,#treeview.tv-open{display:none!important}}`).
2. Going to a card centres the card's middle. A card with many members is taller than the chart area, and centring it
   pushes its header (title) above the visible area. When the card's height at the current zoom is more than about 60%
   of the chart area's height, scroll so its top sits about 40px below the top of the chart area instead; otherwise
   keep centring it. Horizontal centring stays as it is.

Then run `python VERIFY_tree.py` and write `DONE.md` with your write tool (replace its content): what you changed, one line
with the VERIFY result.
