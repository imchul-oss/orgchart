# Final review and fix pass: org chart, features of 2026-10-16 to 2026-10-19

You are the final reviewer of the features added to `org-chart-local.html` (a single-file HTML org chart editor, plain
JavaScript, no build) since the last review. You did not build them. Find what is wrong, fix it, and report. Write your
report in Korean; code and commit messages in English.

## The features under review

1. **Collapse toggle on hover, head count pill options**: the fold toggle `.ctog` shows only while the mouse is over a
   card ("−"); a folded card always shows "+N". The pill `.ncnt` ("N명") has a position option `OPT.cntPos`
   (`tr`, `mr` = header vertical centre, `br`, `badge`) and a colour option `OPT.cntColor`.
2. **Member columns per card**: node field `mc` 2-4 lays the members out in that many columns; the card is
   `cardW(n)` wide. Every layout, connector, export and fit path uses the real width.
3. **IndexedDB timeout**: `_idb._open()` gives up after 1.5 s (or at once on `blocked`) so boot always draws.
4. **Concurrent posts (겸직)**: member flag `cc:true`. The job line reads `jobText(m)` ("팀장(겸)", or "겸직" with no
   job). `OPT.cntCc` decides how the pill counts them: `sep` "3명 +1겸" (default), `inc`, `exc`. The stats panel counts a
   person once. CSV has a `concurrent` column. Pill size and offset: `OPT.cntSize`, `cntDx`, `cntDy`.
5. **Beside cards in 2-3 columns** (parent `ac` 2/3, children `aside:true`): the cards hang below a line that leaves the
   parent at its header centre; no connector goes above the parent, and none sticks out after the cards are dragged.
6. **Order lists**: a parent's edit modal has "하위 조직 순서" with two lists (ordinary children, beside cards), drag or
   ▲▼; saving a changed order runs `autoLayout()` once (one undo step).
7. **Options panel**: six collapsible sections (배치, 카드, 인원 수, 글꼴, 선·캔버스, 로고·색상), state in localStorage
   `ssb-optsec`.

Each feature passed its own browser judge (`review/judges/u-*.js`), and the 21 older layout judges
(`review/judges/*.js` without the `u-` prefix) passed on the candidate. Nobody has yet looked at the features together.

## Data and environment

Use only the fake data: `review/fake-org.json` (same structure and ids as the real data before the concurrent rows;
the judges run on it) and `review/fake-org-concurrent.json` (the same plus the 7 concurrent `팀장(겸)` rows the owner's
real file now has; use it for your own checks of feature 4). All names and titles are invented. There is no real data in this repository and none may be added. The built-in defaults (logo text,
categories, sample nodes) are deliberately emptied; keep them empty. The owner runs the page in an embedded Chromium
viewer (Edge 154 engine) on a company PC, mostly read-only, sometimes as admin; the File System Access API may be
missing there.

## Steps

1. Set up: `npm i playwright@1.55.0 && npx playwright install chromium` (if the browser download is blocked, say so in
   the report and fall back to reading code and running what you can). Then, before you change anything:
   - `node review/run.mjs` must end with `RESULT OK 29/29`.
   - `node review/run.mjs --base` must show every unit judge RED on its base (`BASE RESULT OK 8/8`).
2. Review the candidate yourself with your own scripts on the fake data (load it with
   `_adoptData(JSON.parse(text), false); _finishLoad(_hasPositions(S.nodes)); switchSheet(0);`; admin mode is
   `ADMIN = true; applyRO();`). Look hardest at interactions no judge covers:
   - Wide cards (`mc` 3-4) as beside cards in 2-3 columns, and in the sideways orientations.
   - Order lists on a parent whose children are wide, folded, or include TF/side cards; order then undo/redo.
   - Concurrent members: list view, search (Ctrl+F), tooltip, PNG export, print, CSV export then import, stats panel
     tabs and the collapsed title, read-only versus admin.
   - Pill size/offset with every position, with the hover toggle, folded cards, presentation view and PNG.
   - Options panel: every control still works after the move; reset (초기화); reopening keeps the section state;
     storage blocked.
   - Boot with IndexedDB blocked or slow, then connecting a data file.
   - Narrow windows (1024 px and below) and zoom levels.
   Count as a defect only what a user would hit, and name the steps to reproduce it.
3. Fix each defect in `org-chart-local.html`, one commit per defect, smallest change that fixes it. After every fix
   `node review/run.mjs` must stay `RESULT OK 29/29` and the page must load with no console errors. Do not edit
   `review/judges/*`, `review/baseline/*` or `review/run.mjs`; if you believe a judge is wrong, say why in the report
   and leave it. Do not reformat or reorganise code you are not fixing.
4. Work on branch `cloud/orgchart-final` (create it from this branch) and push it. Write `review/REVIEW-REPORT.md`
   (Korean) with: the judge results before and after your fixes; every defect with steps, cause, fix and commit;
   findings you did not fix and why; what you checked that turned out fine. Commit the report and push.

Keep turns quiet: do not post progress messages while long commands run; wait for them and continue.
