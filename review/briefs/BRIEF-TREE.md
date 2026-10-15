# BRIEF-TREE: folder-style list view

Edit ONLY `orgchart-tree/org-chart-local.html`. Make only the change below. If it is not enough to reach `VERIFY GREEN`,
stop, write the reason in `DONE.md`, and end.

Write only inside this directory (the clone); never cd out of it. Never run `find /`, `find ~`, `ls -R /`, `grep -r` or
any other recursive search outside this directory. Never run rm -rf or any delete command. Do not run git commands.
Edit files with your edit/write tool. Do not touch `VERIFY_tree.py`, `BRIEF*.md`, or `orgchart-tree/org-chart-local.base.html`.

Run `python VERIFY_tree.py` (or `python3`) in the FOREGROUND as one shell call and wait for its output. It is a static
check only; the session re-runs a real-browser judge on real data with the real mouse.

## Goal

A second way to read the current sheet: the organisation as an indented list, like folders in a file explorer. Each
organisation is a folder that can be folded, its members are the files inside it, and choosing an organisation jumps
to its card on the chart. The chart itself does not change.

## What to build

1. Topbar button `<button id="btn-tree" class="tb tb-g" type="button" title="목록 보기">☰ 목록</button>`, placed
   right after the search button, for every viewer (read-only too). The topbar's existing fit logic (`tbLayout`)
   handles it like the other buttons.
2. `<div id="treeview">`: position fixed, below the topbar (top 50px; 0 when the topbar is hidden), on the left side,
   about 360px wide (at most the window width minus 32px), down to the bottom of the window above the sheet bar, its own
   vertical scroll, white background, shadow, z-index above the chart and below dialogs. A header line with the sheet
   name and a close button (✕). The button toggles it; Escape closes it (only when no dialog is open).
3. Rows, rebuilt whenever the list opens, the sheet changes, or the chart re-renders while it is open:
   - One `<div class="tv-row" data-id="{card id}" data-depth="{depth}">` per card of the current sheet, each card once.
   - Order: the main tree depth-first from the head card (a parent right before its subtree; siblings in the order
     `autoLayout()` places them, which in the down layout is left to right); then the TF groups (side cards with their
     subtrees) under a small heading `TF · 임시 조직`; then any remaining cards under a heading `기타`. Headings are
     not `.tv-row`.
   - Depth of the head card 0, its children 1, and so on. Indent each row by depth (for example 18px per level).
   - Inside a row: `.tv-tog` (▾ unfolded / ▸ folded) only when the row has child rows; `.tv-title` with the card's
     `ko` title (or `en` when `ko` is empty), plain text, nothing else inside it; `.tv-cnt` with `N명` when N > 0, N
     counted with the same rule as the card's head count (`.ncnt`).
   - Clicking `.tv-tog` hides or shows all descendant rows (and their member rows). The list starts fully unfolded.
   - Clicking `.tv-cnt` shows or hides the member rows of that card: one `<div class="tv-mem">` per member right after
     the card's row, in card order, indented one level deeper, with the name and, when set, 직급 and 직무 in a lighter
     colour. Member rows start hidden.
   - Clicking `.tv-title` closes the list, reveals the card if it sits in a collapsed subtree on the chart (use
     `collRevealFor`), scrolls the chart so the card is centred in the chart area (the search already has a centring
     helper you can reuse), and briefly highlights the card.
4. Hidden in presentation view (button and list) and in print media (list).

## Where you may edit

New CSS, the new button and the list element in the markup, new top-level functions and listeners. Of the existing
functions you may change only `switchSheet` (to refresh an open list) and `enterPresent` (to close it). For re-renders,
prefer a listener or a small wrapper you add, not edits to other functions. Nothing else.

Then run `python VERIFY_tree.py` and write `DONE.md` with your write tool (replace its content): what you added, one line
with the VERIFY result.
