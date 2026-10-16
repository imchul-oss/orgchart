# Build task: POLISH

You build one change in `org-chart-local.html` (a single-file HTML org chart editor, plain JavaScript, no build). The
change request is `review/BRIEF.md`. A second change is being built at the same time in another session on another
branch, so touch only what this change needs. Write your report in Korean; code and commit messages in English.

## Data

Use only `review/fake-org.json` (same structure and size as the real data; all names and titles are invented). There
is no real data in this repository and none may be added. The HTML's built-in defaults (logo text, categories, sample
nodes) are deliberately emptied; keep them empty.

## Steps

1. Set up the judges. Use the Playwright and Chromium already installed in the container: the previous session found
   `/opt/node-tools/node_modules/playwright/index.js` and browsers in `/opt/pw-browsers`, because downloading Chromium
   is blocked. Run with `PW_MODULE=/opt/node-tools/node_modules/playwright/index.js`.
   - `node review/run.mjs --base` must show every new judge RED on the base.
   - `node review/run.mjs` on the unchanged candidate shows the new judges RED and the regression judges GREEN.
   Record both.
2. Make the change in `org-chart-local.html` on branch `cloud/orgchart-polish` (create it from this branch).
   - `node review/run.mjs` must end `RESULT GREEN` with every judge GREEN.
   - The page must load with no console errors.
   - Do not edit `review/judges/*`, `review/run.mjs` or `review/units.json`. If you believe a judge is wrong, explain
     why in the report and leave it.
   - Do not reformat or reorganise code you are not changing.
3. Then review your own change on the fake data with your own scripts, as a user would hit it. Cover read-only and
   admin mode (`ADMIN = true; applyRO();`), all three orientations (`OPT.orient` down/right/left with `autoLayout()`),
   folding, undo/redo, save and reload (`_fileData()` round trip), PNG export and print. Fix what you find, in the same
   branch.
4. Commit in small steps and push the branch. Write `review/REPORT.md` (Korean) with:
   - The judge results before and after.
   - What you changed and why.
   - What your own review found and how you fixed it.
   - Anything left open.

   Commit and push it.

Keep turns quiet: do not post progress messages while long commands run; wait for them and continue.
