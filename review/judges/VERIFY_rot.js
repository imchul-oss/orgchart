// Judge for ORGCHART-ROTATE (2026-10-15), written before the code. Substitute __DOC__, __PAGE__, __REF__.
// Orientation option OPT.orient: 'down' (default, today's chart), 'right' (head card at the left, the tree grows to the
// right), 'left' (head card at the right, the tree grows to the left).
// (D) with 'down' (and with no orient saved) positions and connector paths after autoLayout equal the reference on
//     every sheet; switching to 'right' and back to 'down' and running autoLayout again gives the reference again;
// (T) with 'right', for every main-tree edge (solid connection between non-side cards, the parent being the card's
//     tree parent): child.x >= parent.x + NW + 40; the children of one parent do not overlap vertically and are ordered
//     top to bottom in the same order as left to right in 'down'; the parent's vertical centre lies within the
//     vertical span of its children's centres; the root card has the smallest x of the main tree;
//     with 'left' the same mirrored (child.x + NW + 40 <= parent.x, the root has the largest x);
// (T2, amended after g2) laying out sheet 1 sideways after sheet 0 keeps sheet 1's sibling order, and both sheets
//     return to the reference when set back to 'down';
// (O) no two cards overlap, in both orientations, on every sheet;
// (C) every solid main-tree connection is drawn: the drawn segments (all paths together, amended after g1) connect a
//     point on the parent's facing edge (middle, or 60px down for a tall card) to the child's facing edge;
// (L) the layout check (lint badge) reports no overlap and no crossing on the real data in 'right';
// (U) the option: a select #opt-orient with values down/right/left in the options panel sets OPT.orient, runs
//     autoLayout, saves; _fileData().opt.orient carries it; _applyOptObj({orient:'right'}) restores it; an unknown
//     value falls back to 'down';
// (K) collapse in 'right': collapsing the root's first child hides its subtree and keeps no overlap;
// (X) exportPNG runs without error in 'right' and the canvas is at least as wide as the cards' extent;
// (E) no page errors.
async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  async function load(url) {
    await page.goto(url); await page.waitForTimeout(500);
    await page.evaluate(d => { try { localStorage.clear(); } catch (e) {} _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(_hasPositions(S.nodes)); switchSheet(0); OPT.wrapN = 0; render(); }, DOC);
    await page.waitForTimeout(200);
  }
  const SNAP = () => ({ pos: S.nodes.map(n => n.id + ':' + n.x + ',' + n.y).sort(),
    paths: Array.prototype.map.call(document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash'), p => p.getAttribute('class') + '|' + p.getAttribute('d').replace(/\s+/g, ' ').trim()).sort() });
  await load('__REF__');
  const sheets = await page.evaluate(() => SHEETS.length);
  const ref = {};
  for (let s = 0; s < sheets; s++) ref[s] = await page.evaluate(([s, sn]) => { switchSheet(s); OPT.wrapN = 0; autoLayout(); render(); return eval('(' + sn + ')')(); }, [s, SNAP.toString()]);
  await load('__PAGE__');
  for (let s = 0; s < sheets; s++) {
    const c = await page.evaluate(([s, sn]) => { switchSheet(s); OPT.wrapN = 0; autoLayout(); render(); return eval('(' + sn + ')')(); }, [s, SNAP.toString()]);
    if (JSON.stringify(c.pos) !== JSON.stringify(ref[s].pos)) fail('D: positions differ in down, sheet ' + s);
    if (JSON.stringify(c.paths) !== JSON.stringify(ref[s].paths)) fail('D: paths differ in down, sheet ' + s);
  }
  // tree structure from the 'down' layout: parent = the solid-connection source whose card is above; order = x order
  const TREE = () => {
    const side = new Set(S.nodes.filter(n => n.type === 'side').map(n => n.id));
    const kids = {}, par = {};
    S.conns.filter(c => !c.d && !side.has(c.f) && !side.has(c.t)).forEach(c => { if (par[c.t] === undefined) { par[c.t] = c.f; (kids[c.f] = kids[c.f] || []).push(c.t); } });
    const by = {}; S.nodes.forEach(n => by[n.id] = { id: n.id, x: n.x, y: n.y, h: nh(n) });
    for (const p in kids) kids[p].sort((a, b) => by[a].x - by[b].x);
    const root = S.nodes.find(n => n.type === 'top' && par[n.id] === undefined) || S.nodes.find(n => par[n.id] === undefined && kids[n.id]);
    return { kids, par, root: root && root.id, NW };
  };
  const GEO = () => S.nodes.map(n => ({ id: n.id, x: n.x, y: n.y, h: nh(n), hid: (() => { const e = document.getElementById('n' + n.id); return !e || getComputedStyle(e).display === 'none'; })() }));
  const overl = (ns, NW, tag) => { const v = ns.filter(n => !n.hid); for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) { const a = v[i], b = v[j];
    if (Math.min(a.x + NW, b.x + NW) - Math.max(a.x, b.x) > 1 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 1) { fail('O: ' + tag + ' cards overlap'); return; } } };
  for (const dir of ['right', 'left']) for (let s = 0; s < sheets; s++) {
    await load('__PAGE__');
    const t = await page.evaluate(([s, tr]) => { switchSheet(s); OPT.wrapN = 0; OPT.orient = 'down'; autoLayout(); render(); return eval('(' + tr + ')')(); }, [s, TREE.toString()]);
    const r = await page.evaluate(([s, dir, geo]) => { OPT.orient = dir; autoLayout(); render(); const g = eval('(' + geo + ')')();
      const paths = [...document.querySelectorAll('#svgl path.cpath')].map(p => { const nums = (p.getAttribute('d') || '').match(/-?\d+(\.\d+)?/g) || []; const pts = []; for (let i = 0; i + 1 < nums.length; i += 2) pts.push([+nums[i], +nums[i + 1]]); return pts; });
      const lb = document.getElementById('lint-badge'); return { g, paths, lint: lb ? [lb.getAttribute('data-overlap'), lb.getAttribute('data-cross')] : null }; }, [s, dir, GEO.toString()]);
    const by = {}; r.g.forEach(n => by[n.id] = n); const NW = t.NW; const tag = dir + ' sheet ' + s;
    overl(r.g, NW, tag);
    if (r.lint && (+r.lint[0] || +r.lint[1])) fail('L: ' + tag + ' layout check reports overlap ' + r.lint[0] + ' cross ' + r.lint[1]);
    const mainIds = new Set(); (function walk(id) { if (mainIds.has(id)) return; mainIds.add(id); (t.kids[id] || []).forEach(walk); })(t.root);
    const xs = [...mainIds].map(id => by[id].x);
    if (dir === 'right' && by[t.root].x !== Math.min(...xs)) fail('T: ' + tag + ' root is not the leftmost card');
    if (dir === 'left' && by[t.root].x !== Math.max(...xs)) fail('T: ' + tag + ' root is not the rightmost card');
    let bad = 0, ord = 0, cen = 0, drawn = 0;
    for (const p of mainIds) { const ks = (t.kids[p] || []).filter(k => mainIds.has(k)); if (!ks.length) continue; const P = by[p];
      ks.forEach(k => { const K = by[k]; if (dir === 'right' ? K.x < P.x + NW + 40 : K.x + NW + 40 > P.x) bad++; });
      for (let i = 1; i < ks.length; i++) if (by[ks[i]].y < by[ks[i - 1]].y + by[ks[i - 1]].h) ord++;
      const cy = n => n.y + n.h / 2; const lo = Math.min(...ks.map(k => cy(by[k]))), hi = Math.max(...ks.map(k => cy(by[k])));
      if (cy(P) < lo - 1 || cy(P) > hi + 1) cen++;
      // amended after g1: connectivity over the union of drawn segments (a connector may be drawn as several paths)
      const segs = []; r.paths.forEach(pts => { for (let i = 0; i + 1 < pts.length; i++) segs.push([pts[i], pts[i + 1]]); });
      const onSeg = (q, sg) => { const [a, b] = sg; const minx = Math.min(a[0], b[0]) - 2, maxx = Math.max(a[0], b[0]) + 2, miny = Math.min(a[1], b[1]) - 2, maxy = Math.max(a[1], b[1]) + 2; return q[0] >= minx && q[0] <= maxx && q[1] >= miny && q[1] <= maxy; };
      const touch = (s1, s2) => onSeg(s1[0], s2) || onSeg(s1[1], s2) || onSeg(s2[0], s1) || onSeg(s2[1], s1);
      const reach = (from, to) => { const start = segs.map((sg, i) => i).filter(i => onSeg(from, segs[i])); const seen = new Set(start); const q = start.slice();
        while (q.length) { const i = q.shift(); if (onSeg(to, segs[i])) return true; segs.forEach((sg, j) => { if (!seen.has(j) && touch(segs[i], sg)) { seen.add(j); q.push(j); } }); } return false; };
      const ex = dir === 'right' ? P.x + NW : P.x; const pm = [ex, P.y + P.h / 2];
      ks.forEach(k => { const K = by[k]; const km = [dir === 'right' ? K.x : K.x + NW, K.y + K.h / 2]; const km2 = [km[0], K.y + Math.min(K.h / 2, 60)];
        if (!reach(pm, km) && !reach(pm, km2) && !reach([ex, P.y + Math.min(P.h / 2, 60)], km) && !reach([ex, P.y + Math.min(P.h / 2, 60)], km2)) drawn++; }); }
    if (bad) fail('T: ' + tag + ' ' + bad + ' children not on the growing side of their parent');
    if (ord) fail('T: ' + tag + ' ' + ord + ' sibling pairs overlap or are out of order vertically');
    if (cen) fail('T: ' + tag + ' ' + cen + ' parents not centred on their children');
    if (drawn) fail('C: ' + tag + ' ' + drawn + ' children not connected to their parent by drawn segments');
  }
  // (amended after g2) a sheet whose positions are still 'down' keeps its sibling order when laid out sideways after
  // another sheet was laid out sideways first
  if (sheets > 1) {
    await load('__PAGE__');
    const m = await page.evaluate(tr => { switchSheet(1); OPT.orient = 'down'; autoLayout(); render(); const t = eval('(' + tr + ')')();
      switchSheet(0); OPT.orient = 'right'; autoLayout(); render(); switchSheet(1); autoLayout(); render();
      const by = {}; S.nodes.forEach(n => by[n.id] = n); let bad = 0; for (const p in t.kids) { const ks = t.kids[p]; for (let i = 1; i < ks.length; i++) if (by[ks[i]].y < by[ks[i - 1]].y) bad++; } return bad; }, TREE.toString());
    if (m) fail('T: sheet 1 laid out sideways after sheet 0: ' + m + ' sibling pairs out of order');
    const m2 = await page.evaluate(sn => { /* back: both sheets to down */ OPT.orient = 'down'; switchSheet(1); autoLayout(); render(); switchSheet(0); autoLayout(); render(); return eval('(' + sn + ')')(); }, SNAP.toString());
    if (JSON.stringify(m2.pos) !== JSON.stringify(ref[0].pos)) fail('D: sheet 0 not back to the reference after both sheets went sideways and back');
  }
  // back to down
  await load('__PAGE__');
  const back = await page.evaluate(sn => { OPT.orient = 'right'; autoLayout(); render(); OPT.orient = 'down'; autoLayout(); render(); return eval('(' + sn + ')')(); }, SNAP.toString());
  if (JSON.stringify(back.pos) !== JSON.stringify(ref[0].pos)) fail('D: right then down does not give the reference positions');
  // U
  await load('__PAGE__');
  const u = await page.evaluate(() => { const sel = document.getElementById('opt-orient'); if (!sel) return { sel: false };
    const vals = [...sel.options].map(o => o.value).sort().join(',');
    sel.value = 'right'; sel.dispatchEvent(new Event('change', { bubbles: true })); sel.dispatchEvent(new Event('input', { bubbles: true }));
    const o1 = OPT.orient, saved = _fileData().opt.orient;
    _applyOptObj({ orient: 'left' }); const o2 = OPT.orient; _applyOptObj({ orient: 'weird' }); const o3 = OPT.orient; _applyOptObj({}); const o4 = OPT.orient;
    return { sel: true, vals, o1, saved, o2, o3, o4 }; });
  if (!u.sel) fail('U: no #opt-orient select');
  else {
    if (u.vals !== 'down,left,right') fail('U: #opt-orient values are ' + u.vals);
    if (u.o1 !== 'right') fail('U: choosing right in the select gives OPT.orient ' + u.o1);
    if (u.saved !== 'right') fail('U: _fileData().opt.orient is ' + u.saved);
    if (u.o2 !== 'left') fail('U: _applyOptObj({orient:left}) gives ' + u.o2);
    if (u.o3 !== 'down') fail('U: an unknown orient gives ' + u.o3 + ', not down');
  }
  // K
  await load('__PAGE__');
  const k = await page.evaluate(([tr, geo]) => { OPT.orient = 'right'; autoLayout(); render(); const t = eval('(' + tr + ')')(); const first = (t.kids[t.root] || []).find(k => (t.kids[k] || []).length);
    if (!first || typeof collToggle !== 'function') return { skip: true };
    collToggle(first); render(); const g = eval('(' + geo + ')')(); const hidden = (t.kids[first] || []).every(id => g.find(n => n.id === id).hid); collToggle(first); render(); return { hidden, g, NW }; }, [TREE.toString(), GEO.toString()]);
  if (k.skip) out.info.collapse = 'skipped (no toggleCollapse or no subtree)';
  else { if (!k.hidden) fail('K: collapsing in right does not hide the subtree'); overl(k.g, k.NW, 'collapsed right'); }
  // X
  await load('__PAGE__');
  const x = await page.evaluate(() => { OPT.orient = 'right'; autoLayout(); render(); let w = 0; const tb = HTMLCanvasElement.prototype.toBlob; HTMLCanvasElement.prototype.toBlob = function () { w = this.width; };
    try { exportPNG(); } finally { HTMLCanvasElement.prototype.toBlob = tb; } const ext = Math.max(...S.nodes.map(n => n.x + NW)) - Math.min(...S.nodes.map(n => n.x)); return { w, ext }; });
  if (!(x.w >= x.ext)) fail('X: PNG width ' + x.w + ' smaller than the cards extent ' + x.ext);
  if (out.errors.length) fail('E: page errors ' + out.errors.slice(0, 2).join(' | '));
  out.RESULT = out.fails.length ? 'RED' : 'GREEN';
  return JSON.stringify(out);
}
