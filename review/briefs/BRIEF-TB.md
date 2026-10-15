# BRIEF-TB: every topbar control usable at common window widths

Edit ONLY `orgchart-tb/org-chart-local.html`. Make only the change below. If it is not enough to reach
`VERIFY GREEN`, stop, write the reason in `DONE.md`, and end.

Write only inside this directory (the clone); never cd out of it. Never run `find /`, `find ~`, `ls -R /`, `grep -r` or
any other recursive search outside this directory. Never run rm -rf or any delete command. Do not run git commands.
Edit files with your edit/write tool. Do not touch `VERIFY_tb.py`, `BRIEF*.md`, or `orgchart-tb/org-chart-local.base.html`.

Run `python VERIFY_tb.py` (or `python3`) in the FOREGROUND as one shell call and wait for its output. It is a static check
only; the session re-runs a real-browser judge with the real mouse at several window widths.

## Problem

The topbar (`#topbar`, fixed, 50px high) is one flex row whose scrollbar is hidden. In admin mode it is 1884px wide, so
at 1280px the buttons from `◈ 데이터` onward (Local, 저장, ↶, ↷, 파일, 관리자, ▲) sit outside the window and cannot be
reached; at 1600px ↷, 파일, 관리자, ▲ are outside; in read-only mode at 1024px 관리자 and ▲ are outside.

## What to build

At every window width from 1024px up, in read-only and admin mode, every topbar control shown in that mode must be
usable without scrolling: either fully inside the window in the bar, or inside an overflow menu.

1. Compact labels first: when the bar does not fit, buttons may drop their text and keep only the icon, with a `title`
   that names the button using its original label words (for example `title="자동 배치"`). Keep the existing titles
   of buttons that already have one, and make sure they contain the label words (`되돌리기`, `다시 하기`, `저장`).
   The subtitle `.tsub` may shrink to nothing.
2. Overflow menu: if compact labels are still not enough, add one button `<button id="tb-more" class="tb tb-g">⋯</button>`
   (title `더 보기`) as the last item before `▲`, which opens a panel below the bar listing the controls that do not fit,
   with their full labels. Moving the existing control elements into the panel (and back when the window grows) is fine
   as long as their ids, onclick handlers and classes stay the same, so all existing code keeps working. The Local
   dropdown (`#ddloc`) must still open and stay inside the window when its button is in the panel. A click outside,
   Escape, or choosing an item closes the panel.
3. Recompute the layout on load, on window resize, when admin mode turns on or off (`applyRO()`), when the lint badge
   or the search box changes width, and when the logo text changes (`applyLogo()`).
4. Keep: the bar's 50px height and `#wrap`'s 50px top, the ▲ hide and ▼ reveal behaviour, no overlap between controls,
   the search box (`#srch-box`) fully inside the window when open, the topbar and `#tb-more` hidden in presentation
   view and in print media.

## Where you may edit

New CSS, new markup (the `#tb-more` button and its panel), new top-level functions and listeners. Of the existing
functions you may change only `applyRO`, `toggleTopbar`, `toggleDD`, `closeDD`, `applyLogo`. Nothing else.

Then run `python VERIFY_tb.py` and write `DONE.md` with your write tool (replace its content): what you added, one line
with the VERIFY result.
