# Cloud regression and stress run: org chart, 2026-10-26

You run the org chart's full browser regression and a stress run on dummy data, then report. You do not change
`org-chart-local.html`, the judges, the data or the runner. Write the report in Korean.

## What is here

- `org-chart-local.html`: the candidate (five changes since the delivered build: stats tab number alignment and names,
  card colours moved into the options window, the list panel stays open, file picker folder memory, list editing and
  a text view).
- `review/delivered.html`: the last delivered build (2026-10-23). It passed the same regression on the owner's real data.
- `review/judges/*.js` (71) and `review/judges/units.json`: each judge is `async page => {...}` and returns
  `{RESULT, fails, errors, info}`; `kind` is `verdict` (must be GREEN), `same` (report must equal the baseline taken on
  the delivered build) or `stress` (findings).
- `review/data/*.json`: dummy data. The six regression files keep the real files' shape exactly (sheets, cards,
  members, ids, statuses, layout fields, text lengths); only Hangul text is replaced. `extreme.json` is an invented
  extreme data set (`review/gen-extreme.py`): 18 sheets, about 1,200 cards and 7,000 members, long and odd strings,
  HTML and script text, a 120-member card, beside cards, TF and side cards, a 12-level chain, orphans and broken links.
- `review/run.mjs`: the runner. One fresh browser context per judge.

## Steps

1. `npm i playwright@1.55.0 && npx playwright install --with-deps chromium`. If the browser download is blocked, stop
   and report that.
2. Baseline on the delivered build: `node review/run.mjs --page review/delivered.html --write-baseline --jobs 2`, then
   `node review/run.mjs --page review/delivered.html --jobs 2`. Every judge should be GREEN or `same` here, because the
   delivered build passed them on the real data. A judge that is not GREEN on the delivered build is a KIT problem
   (dummy data or sanitized page), not a product defect: list it with its fails and do not count it against the
   candidate.
3. Candidate: `node review/run.mjs --jobs 2`. For every judge that is GREEN on the delivered build and not GREEN on the
   candidate, rerun it alone with `--only <name> --jobs 1` to rule out load timing, then read the judge and say whether
   the change it reports is a regression or an intended change of the five listed above.
4. Stress: `node review/run.mjs --stress --page review/delivered.html --jobs 1` and
   `node review/run.mjs --stress --jobs 1`. Raw results land in `review/out/`. For each finding give the steps to
   reproduce and whether the delivered build has it too. Known already: the 대형 sheet's PNG canvas is past the browser
   limit, and a link to a missing card stops auto layout on the 구성 sheet. Then go further than the judge on
   `extreme.json` with your own scripts: everything a user can do with very many people, very many organisations, very
   long or odd text, every status and category, folded cards, the sideways layouts, the stats panel tabs and query tab,
   print chooser, compare mode, CSV and JSON import and export, undo and redo, search, admin and read-only. Count only
   what a user would hit, with steps to reproduce and the measured value.
5. Write `review/REPORT-1026.md` (Korean): the two run summaries (counts and the RESULT lines), the kit problems, the
   candidate regressions with your reading, the stress findings ranked by how badly a user would be hurt, and how long
   each run took. Commit it with `review/out/` and `review/baseline/` on this branch and push.
