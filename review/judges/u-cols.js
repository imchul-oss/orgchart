// Judge for ORGCHART-COLS (2026-10-16), written before the code. Substitute __DOC__, __PAGE__, __REF__.
// A card may show its members in 1-4 columns (node field `mc`, 2..4; absent = 1). Column width = a normal card's
// member area, so cardW(n) = OPT.bandW + mc*(NW - OPT.bandW) (= NW for mc 1); height nh(n) = header + ceil(m/mc) rows.
// (A) top-level functions cardW(n) and nh(n) follow that formula for mc 1-4 (nh: CUR_HH + ceil(m/mc)*CUR_MH, 34 body
//     when there are no members);
// (D) on screen each test card's element is cardW x nh (within 1 px at scale 1); its .mr rows sit in min(mc, m) distinct
//     columns and ceil(m/mc) distinct rows, each row box (NW - bandW)/... : width within 2 px of (cardW - bandW)/mc;
// (L) with mc 2, 3 and 4 on the three cards with the most members of every sheet, after autoLayout in down, right and
//     left: no two visible cards overlap (model rects x, y, cardW, nh), no connector segment passes through the inside
//     of a visible card (rect shrunk by 3 px), layoutLint() reports overlap 0, cross 0, broken 0, and every DOM card
//     rect equals its model rect within 1 px (scale 1);
// (T) the collapse toggle of a wide card sits at its bottom centre in down (centre x within 2 px of x + cardW/2);
// (U) admin openEdit(id) shows select #ei-mc with values 1,2,3,4 and the card's value selected; choosing 3 and
//     saveModal() sets mc 3 and the card is drawn 3 columns wide; choosing 1 removes mc; undoEdit() brings back the
//     previous value; read-only openEdit opens nothing;
// (P) _fileData() carries mc; _sanitizeSheet keeps 2, 3, 4 and drops any other value (0, 1, 5, '3x', -1);
// (X) exportPNG: for a 3-column card with 6+ distinct member names, the member names are drawn at 3 distinct x positions
//     and the exported area covers every card's right edge (_chartBounds().right or the canvas width);
// (F) _chartBounds() and fitScreen() measure cardW: bounds right >= max(x + cardW) over visible cards;
// (R) with no mc anywhere, positions and connector paths after autoLayout on every sheet in all three orientations equal
//     the reference;
// (E) no page errors.
async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  async function load(url) {
    await page.goto(url); await page.waitForTimeout(500);
    await page.evaluate(d => { try { localStorage.clear(); } catch (e) {} const doc = JSON.parse(JSON.stringify(d));
      _adoptData(doc, false); _finishLoad(true); switchSheet(0); OPT.wrapN = 0; OPT.orient = 'down'; autoLayout(); render(); }, DOC);
    await page.waitForTimeout(300);
  }
  const SNAP = () => ({ pos: S.nodes.map(n => n.id + ':' + n.x + ',' + n.y).sort(),
    paths: Array.prototype.map.call(document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash'), p => p.getAttribute('class') + '|' + p.getAttribute('d').replace(/\s+/g, ' ').trim()).sort() });
  // R
  await load('__REF__');
  const sheets = await page.evaluate(() => SHEETS.length);
  const ref = {};
  for (let s = 0; s < sheets; s++) for (const o of ['down', 'right', 'left']) ref[s + o] = await page.evaluate(([s, o, sn]) => { switchSheet(s); OPT.wrapN = 0; OPT.orient = o; autoLayout(); render(); return eval('(' + sn + ')')(); }, [s, o, SNAP.toString()]);
  await load('__PAGE__');
  for (let s = 0; s < sheets; s++) for (const o of ['down', 'right', 'left']) {
    const c = await page.evaluate(([s, o, sn]) => { switchSheet(s); OPT.wrapN = 0; OPT.orient = o; autoLayout(); render(); return eval('(' + sn + ')')(); }, [s, o, SNAP.toString()]);
    if (JSON.stringify(c.pos) !== JSON.stringify(ref[s + o].pos)) fail('R: positions differ sheet ' + s + ' ' + o);
    if (JSON.stringify(c.paths) !== JSON.stringify(ref[s + o].paths)) fail('R: paths differ sheet ' + s + ' ' + o);
  }
  // A
  const a = await page.evaluate(() => { if (typeof cardW !== 'function') return { none: true }; const bad = [];
    const n = { id: 'zz', type: 'l2', m: [1, 2, 3, 4, 5, 6, 7].map(i => ({ n: 'a' + i })) };
    for (const k of [undefined, 2, 3, 4]) { const t = Object.assign({}, n); if (k) t.mc = k; const kk = k || 1;
      const w = OPT.bandW + kk * (NW - OPT.bandW); if (Math.abs(cardW(t) - w) > .01) bad.push('cardW mc' + kk + ' ' + cardW(t) + ' want ' + w);
      const h = CUR_HH + Math.ceil(7 / kk) * CUR_MH; if (Math.abs(nh(t) - h) > .01) bad.push('nh mc' + kk + ' ' + nh(t) + ' want ' + h); }
    const e = { id: 'ze', type: 'l2', m: [], mc: 3 }; if (Math.abs(nh(e) - (CUR_HH + 34)) > .01) bad.push('nh empty mc3 ' + nh(e));
    return { bad }; });
  if (a.none) fail('A: no function cardW'); else a.bad.forEach(b => fail('A: ' + b));
  // helpers on page
  const HELP = () => {
    window.__cw = n => (typeof cardW === 'function' ? cardW(n) : NW);
    window.__pick = () => { const H = collHidden(); return S.nodes.filter(n => !H.has(n.id) && (n.m || []).length >= 2).sort((a, b) => (b.m || []).length - (a.m || []).length).slice(0, 3).map(n => n.id); };
    window.__geo = () => { const H = collHidden(); const vis = S.nodes.filter(n => !H.has(n.id)); const R = n => ({ x: n.x, y: n.y, w: __cw(n), h: nh(n) });
      const ov = []; for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) { const A = R(vis[i]), B = R(vis[j]); if (A.x < B.x + B.w - .5 && B.x < A.x + A.w - .5 && A.y < B.y + B.h - .5 && B.y < A.y + A.h - .5) ov.push(vis[i].id + '/' + vis[j].id); }
      const segs = []; document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash').forEach(p => { const nums = (p.getAttribute('d') || '').match(/-?\d+(\.\d+)?/g) || []; const pts = []; for (let i = 0; i + 1 < nums.length; i += 2) pts.push([+nums[i], +nums[i + 1]]); for (let i = 0; i + 1 < pts.length; i++) segs.push([pts[i], pts[i + 1]]); });
      const cr = []; vis.forEach(n => { const r = R(n); const x0 = r.x + 3, x1 = r.x + r.w - 3, y0 = r.y + 3, y1 = r.y + r.h - 3;
        segs.forEach(([p, q]) => { if (p[0] === q[0]) { const x = p[0], a = Math.min(p[1], q[1]), b = Math.max(p[1], q[1]); if (x > x0 && x < x1 && a < y1 && b > y0) cr.push(n.id); } else if (p[1] === q[1]) { const y = p[1], a = Math.min(p[0], q[0]), b = Math.max(p[0], q[0]); if (y > y0 && y < y1 && a < x1 && b > x0) cr.push(n.id); } }); });
      const L = layoutLint(); const k = S.scale, cv = document.getElementById('canvas').getBoundingClientRect(); const dom = [];
      vis.forEach(n => { const e = document.getElementById('n' + n.id); if (!e) return; const b = e.getBoundingClientRect(); const r = R(n); const x = (b.left - cv.left) / k, y = (b.top - cv.top) / k;
        if (Math.abs(x - r.x) > 1 || Math.abs(y - r.y) > 1 || Math.abs(b.width / k - r.w) > 1 || Math.abs(b.height / k - r.h) > 1) dom.push(n.id + ' dom ' + [x, y, b.width / k, b.height / k].map(Math.round) + ' model ' + [r.x, r.y, r.w, r.h].map(Math.round)); });
      return { ov, cr: [...new Set(cr)], lint: [L.overlap, L.cross, L.brokenN], dom }; };
  };
  // D + L + T
  for (let s = 0; s < sheets; s++) {
    for (const o of ['down', 'right', 'left']) {
      await load('__PAGE__'); await page.evaluate(HELP);
      const g = await page.evaluate(([s, o]) => { switchSheet(s); const ids = __pick(); ids.forEach((id, i) => { S.nodes.find(n => n.id === id).mc = [2, 3, 4][i]; });
        OPT.wrapN = 0; OPT.orient = o; autoLayout(); render(); doZoomAbs(100); return { ids, geo: __geo() }; }, [s, o]);
      out.info['L' + s + o] = g.ids.length;
      if (!g.ids.length) { fail('L: sanity - no cards with members on sheet ' + s); continue; }
      if (g.geo.ov.length) fail('L: sheet ' + s + ' ' + o + ' overlaps ' + g.geo.ov.slice(0, 3).join(' '));
      if (g.geo.cr.length) fail('L: sheet ' + s + ' ' + o + ' connector through ' + g.geo.cr.slice(0, 3).join(' '));
      if (g.geo.lint.some(x => x)) fail('L: sheet ' + s + ' ' + o + ' layoutLint ' + g.geo.lint);
      if (g.geo.dom.length) fail('L: sheet ' + s + ' ' + o + ' DOM differs from model: ' + g.geo.dom.slice(0, 2).join(' | '));
      if (s === 0 && o === 'down') {
        const d = await page.evaluate(ids => { const k = S.scale; return ids.map(id => { const n = S.nodes.find(x => x.id === id), e = document.getElementById('n' + id); const rows = [...e.querySelectorAll('.mr')].map(r => r.getBoundingClientRect());
          const xs = new Set(rows.map(r => Math.round(r.left / k))), ys = new Set(rows.map(r => Math.round(r.top / k))); const m = (n.m || []).length, mc = n.mc;
          const wOk = rows.every(r => Math.abs(r.width / k - (__cw(n) - OPT.bandW) / mc) <= 2 || Math.abs(r.width / k - (__cw(n) - OPT.bandW) / mc - OPT.bandW) <= 2);
          const t = e.querySelector('.ctog'); let tx = null; if (t) { const b = t.getBoundingClientRect(), c = e.getBoundingClientRect(); tx = ((b.left + b.width / 2) - (c.left + c.width / 2)) / k; }
          return { id, mc, m, cols: xs.size, rows: ys.size, wOk, tx }; }); }, g.ids);
        d.forEach(r => { if (r.cols !== Math.min(r.mc, r.m)) fail('D: ' + r.id + ' mc ' + r.mc + ' shows ' + r.cols + ' columns');
          if (r.rows !== Math.ceil(r.m / r.mc)) fail('D: ' + r.id + ' mc ' + r.mc + ' shows ' + r.rows + ' rows for ' + r.m + ' members');
          if (!r.wOk) fail('D: ' + r.id + ' member boxes not one column wide');
          if (r.tx !== null && Math.abs(r.tx) > 2) fail('T: toggle of ' + r.id + ' off centre by ' + r.tx.toFixed(1)); });
        // F
        const f = await page.evaluate(() => { const H = collHidden(); const mx = Math.max(...S.nodes.filter(n => !H.has(n.id)).map(n => n.x + __cw(n))); const b = _chartBounds(); const r = b.right != null ? b.right : (b.x != null ? b.x + b.w : (b.x1 != null ? b.x1 : null)); return { mx, r, b: JSON.stringify(b).slice(0, 120) }; });
        if (f.r == null || f.r < f.mx - .5) fail('F: _chartBounds right ' + f.r + ' < widest card edge ' + f.mx + ' ' + f.b);
        // X
        const x = await page.evaluate(() => { const H = collHidden(); const n = S.nodes.find(n => !H.has(n.id) && n.mc === 3 && new Set((n.m || []).map(m => m.n)).size >= 6 && (n.m || []).length === new Set((n.m || []).map(m => m.n)).size);
          if (!n) return { none: true }; const names = new Set(n.m.map(m => m.n)); const P = CanvasRenderingContext2D.prototype; const oT = P.fillText, xs = []; let cw = 0;
          P.fillText = function (s, x) { if (names.has(String(s).split('  ')[0])) { const t = this.getTransform(); xs.push(Math.round((t.a * x + t.e) / t.a)); } return oT.apply(this, arguments); };
          const oc = HTMLCanvasElement.prototype.toBlob; HTMLCanvasElement.prototype.toBlob = function () { cw = Math.max(cw, this.width); };
          try { exportPNG(); } finally { P.fillText = oT; HTMLCanvasElement.prototype.toBlob = oc; }
          return { cols: new Set(xs).size, drawn: xs.length, m: n.m.length }; });
        if (x.none) out.info.X = 'no 3-column test card with 6 distinct names'; else { out.info.X = x; if (x.drawn < x.m) fail('X: export drew ' + x.drawn + ' of ' + x.m + ' names'); if (x.cols !== 3) fail('X: export draws the 3-column card in ' + x.cols + ' columns'); }
      }
    }
  }
  // U
  await load('__PAGE__');
  const u = await page.evaluate(() => { const r = {}; const n = S.nodes.find(n => (n.m || []).length >= 4); r.id = n.id;
    ADMIN = false; applyRO(); try { openEdit(n.id); } catch (e) {} r.roOpen = !!document.getElementById('ei-mc');
    try { closeModal(); } catch (e) {}
    ADMIN = true; applyRO(); render(); openEdit(n.id); const sel = document.getElementById('ei-mc'); if (!sel) { r.none = true; return r; }
    r.vals = Array.prototype.map.call(sel.options, o => o.value).join(','); r.cur = sel.value;
    sel.value = '3'; saveModal(); r.mc3 = n.mc; const e = document.getElementById('n' + n.id); r.w3 = e ? e.offsetWidth : 0; r.want3 = typeof cardW === 'function' ? cardW(n) : -1;
    _hCheckpoint(); undoEdit(); const n2 = S.nodes.find(x => x.id === n.id); r.undo = n2.mc;
    redoEdit(); openEdit(n.id); r.cur2 = document.getElementById('ei-mc').value; document.getElementById('ei-mc').value = '1'; saveModal(); r.mc1 = 'mc' in S.nodes.find(x => x.id === n.id);
    return r; });
  if (u.roOpen) fail('U: read-only openEdit shows the column select');
  if (u.none) fail('U: no #ei-mc in the edit modal');
  else {
    if (u.vals !== '1,2,3,4') fail('U: #ei-mc values ' + u.vals);
    if (u.cur !== '1') fail('U: #ei-mc shows ' + u.cur + ' for a card without mc');
    if (u.mc3 !== 3) fail('U: saveModal with 3 gave mc ' + u.mc3);
    if (Math.abs(u.w3 - u.want3) > 1) fail('U: card drawn ' + u.w3 + ' wide, want ' + u.want3);
    if (u.undo !== undefined && u.undo !== 1) fail('U: undo left mc ' + u.undo);
    if (u.cur2 !== '3') fail('U: #ei-mc shows ' + u.cur2 + ' for mc 3');
    if (u.mc1) fail('U: choosing 1 kept an mc field');
  }
  // P
  const p = await page.evaluate(() => { const n = S.nodes[0]; n.mc = 4; const f = JSON.parse(JSON.stringify(_fileData())); const keep = f.sheets.some(s => s.nodes.some(x => x.id === n.id && x.mc === 4));
    const res = {}; [2, 3, 4, 0, 1, 5, '3x', -1].forEach(v => { const sh = _sanitizeSheet({ name: 't', nodes: [{ id: 'q1', type: 'l2', m: [], mc: v }], conns: [] }); res[String(v)] = sh.nodes[0].mc; });
    delete n.mc; return { keep, res }; });
  if (!p.keep) fail('P: _fileData drops mc');
  ['2', '3', '4'].forEach(k => { if (p.res[k] !== +k) fail('P: sanitize changed mc ' + k + ' to ' + p.res[k]); });
  ['0', '1', '5', '3x', '-1'].forEach(k => { if (p.res[k] !== undefined) fail('P: sanitize kept mc ' + k + ' as ' + p.res[k]); });
  if (out.errors.length) fail('E: page errors ' + out.errors.slice(0, 2).join(' | '));
  out.RESULT = out.fails.length ? 'RED' : 'GREEN';
  return JSON.stringify(out);
}
