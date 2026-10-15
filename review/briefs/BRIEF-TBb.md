# BRIEF-TBb: make the topbar layout settle (second round)

Same rules as `BRIEF-TB.md` (read it first; edit ONLY `orgchart-tb/org-chart-local.html`, same allowed functions, same
safety rules). Your first version is in that file now; fix it rather than starting over.

## What the real-browser judge found

The layout never settles. Sampled every 150-250ms after load at 1024-1600px, the bar flips between compact and full,
`#tb-more` appears and disappears, and controls move between the bar and the panel (4-6 different states in 1.5s).
While it flips, buttons overlap each other (`#srch-btn` over `#btn-cmp`, `#btn-undo` over `#btn-redo`).

Two causes, both measured:
1. `.tb{transition:.15s}` animates every property, so after `tb-compact` is added the buttons still have their old
   padding and font size when `tbLayout()` measures `scrollWidth` in the same task; the measurement sees the old widths,
   moves controls to the panel that would have fit, and the widths keep changing for 150ms afterwards.
2. The `ResizeObserver` on `#topbar` (and on the badge and logo) fires because `tbLayout()` itself changed the bar's
   content, which schedules another `tbLayout()`, which restores everything and starts over: a loop.

## What to change

- Measure with transitions off: during `tbLayout()` put a class on the bar that sets `transition:none` on the bar and
  everything in it (and remove it after measuring, or keep transitions off for width, padding and font-size inside the
  bar permanently). Overlap must never appear, even for a frame the judge might sample.
- Break the loop: re-run the layout only when an input really changed (window width, admin mode, logo text, lint badge
  text, search box open or closed, the expand-all button shown or hidden), not when the bar's own size changes because of
  the layout. Compare against the last inputs and return early when nothing changed.
- After the fix, at each width the layout reaches one state and keeps it: the same controls in the bar, the same in the
  panel, the same left edges, sampled for 1.5s.
- Prefer keeping the frequently used controls in the bar and moving the rare ones to the panel first: `◈ 데이터`,
  `⚙ 옵션`, `📁 Local`, `📄 파일`, `🔗 연결선 추가`, `＋ 조직 추가`, `▶ 발표 보기`, `⇄ 비교` before the zoom control,
  `🔍 검색`, `💾 저장`, `↶`, `↷`, `⊡ 화면 맞춤`, `⟳ 자동 배치`. `🔒 관리자` and `▲` always stay in the bar.

Then run `python VERIFY_tb.py` and write `DONE.md` with your write tool (replace its content): what you changed, one line
with the VERIFY result.
