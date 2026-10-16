# Change request: four small card fixes

All four are on the card itself; the layout (`autoLayout`) must not change. Positions and connector paths stay exactly
as today in every orientation.

1. **Collapse toggle follows the orientation.**
   - Today the toggle `.ctog` (built in `collDecorate()`) sits at the bottom centre of the card in every orientation.
   - In the sideways layouts (`OPT.orient` right/left, or better the sheet's `posOrient`, the orientation that made the
     current positions), the children are to the right or left. There, put the toggle at the card's right edge
     (right) or left edge (left), vertically centred on the card.
   - In down keep it centred at the bottom edge.
2. **The toggle never covers a member row.**
   - Today it overlaps the bottom of the last member row (`.mr`), and the member tooltip (`#mtip`) does not show where
     the toggle sits.
   - Move it so it straddles the card's edge outside the member rows: centred on the bottom border line in down, on the
     side border line sideways. It must stay clickable and still stop drag, connect and select handling as now.
   - It is about 6x5 px on screen at 33% zoom. Keep it at least 9x9 px on screen at any zoom, for example by scaling it
     inversely to the zoom with a cap.
3. **Readable head count.**
   - The count pill `.ncnt` ("N명") has white text on `rgba(255,255,255,.22)` over the header colour. On light or green
     headers the contrast is as low as 3.37.
   - Make the contrast at least 4.5 on every header colour, the default type colours and any custom card colour. One
     way is a dark translucent pill (for example `rgba(0,0,0,.35)` or darker) with white text. Another is choosing the
     pill colours from the header's luminance.
   - Keep the same place and size.
4. **Print ignores folded cards.**
   - `_chartBounds()` (used by `preparePrint()`) measures all cards, including those hidden in a folded subtree, so the
     printed page keeps their empty space.
   - Measure only visible cards, as `exportPNG()` already does with `collHidden()`, plus the TF zone frame.

## Judges

- New: `review/judges/VERIFY_polish.js`.
- Regression: `VERIFY_tb.js`, `VERIFY_tf.js`, `VERIFY_rot.js`, `VERIFY_tree.js`.
