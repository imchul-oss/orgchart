# Final review and fix pass: org chart, four features of 2026-10-15

You are the final reviewer of four features added to `org-chart-local.html` (a single-file HTML org chart editor,
plain JavaScript, no build). You did not build them. Find what is wrong, fix it, and report. Write your report in
Korean; code and commit messages in English.

## The four features (the change requests are in `review/briefs/`)

1. **Topbar fit** (`BRIEF-TB*.md`): at window widths 1024px and up, every topbar control is usable without scrolling.
   Buttons become icon-only when needed, and what still does not fit moves into a `⋯` overflow menu (`#tb-more`).
2. **TF zone** (`BRIEF-TF*.md`): a side card (type `side`, a temporary task force) that has a subtree or no parent is
   laid out with its subtree in a framed zone right of the main tree. The zone is titled `TF · 임시 조직` and shows an
   owner label `주관: ...` instead of a long dashed line. A leaf side card keeps its old place.
3. **Sideways chart** (`BRIEF-ROT*.md`): option `차트 방향` (`OPT.orient` down/right/left). With right or left, the head
   card sits at the left or right edge and the tree grows sideways with elbow connectors. The orientation that
   produced the current positions is stored per sheet (`posOrient`), so sibling order survives switching back.
4. **List view** (`BRIEF-TREE*.md`): `☰ 목록` opens a folder-style indented list of the sheet. You can fold orgs,
   show members from the `N명` count, and click a title to jump to the card on the chart.

Each was built in order on top of the previous one (`review/refs/v0-final.html` -> `v1-tb` -> `v2-tf` -> `v3-rot` ->
the candidate `org-chart-local.html`), and each passed its own browser judge (`review/judges/`). Nobody has yet looked
at the four together.

## Data

Use only `review/fake-org.json` (same structure and size as the real data; all names and titles are invented). There
is no real data in this repository and none may be added. The HTML's built-in defaults (logo text, categories, sample
nodes) are deliberately emptied; keep them empty.

## Steps

1. Set up the judges: `npm i playwright@1.55.0 && npx playwright install chromium` (if the browser download is blocked
   by the network, say so in the report and fall back to reading code and running what you can). Then:
   - `node review/run.mjs` must print `RESULT GREEN 4/4` on the candidate.
   - `node review/run.mjs --base` must show each judge RED on its base.
   Run both before you change anything.
2. Review the candidate yourself, with your own scripts on the fake data (load it with
   `_adoptData(JSON.parse(text), false); _finishLoad(_hasPositions(S.nodes)); switchSheet(0);`; admin mode is
   `ADMIN = true; applyRO();`). Look hardest at how the features interact, which no judge covers:
   - TF zone in sideways layouts.
   - Collapse (`▾` toggle) in sideways layouts.
   - List view order after a sideways layout.
   - The list button inside the topbar overflow at 1024px.
   - Search (Ctrl+F) and undo/redo (Ctrl+Z/Ctrl+Y, admin) across an orientation change.
   - PNG export (`exportPNG`) and print in each orientation.
   - The layout check badge in each orientation.
   - Save and reload (`_fileData()` round trip) of `posOrient` and the TF frame.
   - Read-only versus admin mode.
   - Presentation view.
   - Narrow windows.

   Add side cards to the fake data yourself to exercise the TF zone (the fake data has none), the way
   `review/judges/VERIFY_tf.js` does. Count as a defect only what a user would hit. Name the steps to reproduce it.
3. Fix each defect in `org-chart-local.html`, one commit per defect, smallest change that fixes it. After every fix:
   - `node review/run.mjs` must stay GREEN.
   - The page must load with no console errors.

   Do not edit `review/judges/*` or `review/run.mjs`. If you believe a judge is wrong, say why in the report and leave
   it. Do not reformat or reorganise code you are not fixing.
4. Work on branch `cloud/orgchart-review` (create it from this branch) and push it. Write
   `review/REVIEW-REPORT.md` (Korean) with:
   - The judge results before and after your fixes.
   - Every defect: steps to reproduce, cause, fix, commit.
   - Findings you did not fix and why.
   - What you checked that turned out fine.

   Commit the report and push.

Keep turns quiet: do not post progress messages while long commands run; wait for them and continue.
