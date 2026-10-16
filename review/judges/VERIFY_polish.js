// Judge for ORGCHART-POLISH (2026-10-16), written before the code. Substitute __DOC__, __PAGE__, __REF__.
// Four small fixes on the cards.
// (G) collapse toggle follows the orientation: in 'right' every visible .ctog has its centre within 24px inside / 14px
//     outside the card's right edge and vertically within the card; in 'left' the same at the left edge; in 'down' its
//     centre is within 10px of the card's horizontal middle and within 14px of the card's bottom edge; clicking it in
//     'right' still folds the subtree (descendants hidden) and clicking again unfolds;
// (T) the toggle never covers a member row: in all three orientations at 100% zoom, no visible .ctog rectangle overlaps
//     a visible .mr rectangle of its own card; hovering the centre of the last member row of a card with a toggle shows
//     #mtip; at 33% zoom the toggle's on-screen box is at least 9x9px and elementFromPoint at its centre is the toggle;
// (C) the head count is readable: on every card with a visible .ncnt (the data's cards plus one card of each type
//     top, l1-l5, tf, side added without a colour), the contrast ratio between .ncnt's text colour and its effective
//     background (its own background composited over the header's background) is at least 4.5;
// (P) printing ignores folded cards: after folding the subtree with the most cards, _chartBounds() equals the bounding
//     box of the visible cards (and the TF zone frame if present) within 2px (the subtree chosen is the largest whose
//     folding shrinks the visible box); with nothing folded it equals the box of
//     all cards;
// (R) positions and connector paths after autoLayout in 'down' on every sheet equal the reference;
// (E) no page errors.
async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  async function load(url, extra) {
    await page.goto(url); await page.waitForTimeout(500);
    await page.evaluate(([d, extra]) => { try { localStorage.clear(); } catch (e) {} const doc = JSON.parse(JSON.stringify(d));
      if (extra) { const s = doc.sheets[0]; ['top', 'l1', 'l2', 'l3', 'l4', 'l5', 'tf', 'side'].forEach((t, i) => s.nodes.push({ id: 'x_' + t, en: 'X ' + t, ko: '', type: t, x: 0, y: 0, m: [{ n: '가나다' + i, f: '기획', r: '대리', s: 'active' }] })); }
      _adoptData(doc, false); _finishLoad(true); switchSheet(0); OPT.wrapN = 0; OPT.orient = 'down'; autoLayout(); render(); }, [DOC, !!extra]);
    await page.waitForTimeout(300);
  }
  const SNAP = () => ({ pos: S.nodes.map(n => n.id + ':' + n.x + ',' + n.y).sort(),
    paths: Array.prototype.map.call(document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash'), p => p.getAttribute('class') + '|' + p.getAttribute('d').replace(/\s+/g, ' ').trim()).sort() });
  await load('__REF__');
  const sheets = await page.evaluate(() => SHEETS.length);
  const ref = {};
  for (let s = 0; s < sheets; s++) ref[s] = await page.evaluate(([s, sn]) => { switchSheet(s); OPT.wrapN = 0; OPT.orient = 'down'; autoLayout(); render(); return eval('(' + sn + ')')(); }, [s, SNAP.toString()]);
  await load('__PAGE__');
  for (let s = 0; s < sheets; s++) {
    const c = await page.evaluate(([s, sn]) => { switchSheet(s); OPT.wrapN = 0; OPT.orient = 'down'; autoLayout(); render(); return eval('(' + sn + ')')(); }, [s, SNAP.toString()]);
    if (JSON.stringify(c.pos) !== JSON.stringify(ref[s].pos)) fail('R: positions differ sheet ' + s);
    if (JSON.stringify(c.paths) !== JSON.stringify(ref[s].paths)) fail('R: paths differ sheet ' + s);
  }
  // G + T
  const TOG = () => [...document.querySelectorAll('.nd')].filter(c => getComputedStyle(c).display !== 'none').map(c => { const t = c.querySelector('.ctog'); if (!t) return null;
    const r = c.getBoundingClientRect(), q = t.getBoundingClientRect(); const rows = [...c.querySelectorAll('.mr')].map(m => m.getBoundingClientRect()).filter(m => m.height > 0);
    const ov = rows.some(m => Math.min(m.right, q.right) - Math.max(m.left, q.left) > 0.5 && Math.min(m.bottom, q.bottom) - Math.max(m.top, q.top) > 0.5);
    return { id: c.id, c: [r.left, r.top, r.right, r.bottom], t: [q.left, q.top, q.right, q.bottom], ov }; }).filter(Boolean);
  for (const dir of ['down', 'right', 'left']) {
    await load('__PAGE__');
    const ts = await page.evaluate(([dir, tg]) => { OPT.orient = dir; autoLayout(); render(); doZoomAbs(100); return eval('(' + tg + ')')(); }, [dir, TOG.toString()]);
    if (!ts.length) { fail('G: ' + dir + ' no toggles found'); continue; }
    let bad = 0, ovl = 0;
    ts.forEach(o => { const cx = (o.t[0] + o.t[2]) / 2, cy = (o.t[1] + o.t[3]) / 2; const [l, t, r, b] = o.c;
      if (dir === 'right' && !(cx <= r + 14 && cx >= r - 24 && cy >= t && cy <= b)) bad++;
      if (dir === 'left' && !(cx >= l - 14 && cx <= l + 24 && cy >= t && cy <= b)) bad++;
      if (dir === 'down' && !(Math.abs(cx - (l + r) / 2) <= 10 && Math.abs(cy - b) <= 14)) bad++;
      if (o.ov) ovl++; });
    if (bad) fail('G: ' + dir + ' ' + bad + ' of ' + ts.length + ' toggles not at the side the children are on');
    if (ovl) fail('T: ' + dir + ' ' + ovl + ' toggles cover a member row');
    if (dir === 'right') {
      const f = await page.evaluate(() => { const kid = {}; S.conns.forEach(c => (kid[c.f] = kid[c.f] || []).push(c.t)); const p = S.nodes.find(n => (kid[n.id] || []).some(k => kid[k]) && document.querySelector('#n' + CSS.escape(n.id) + ' .ctog')); if (!p) return null;
        const t = document.querySelector('#n' + CSS.escape(p.id) + ' .ctog'); t.scrollIntoView({ block: 'center', inline: 'center' }); const q = t.getBoundingClientRect(); return { id: p.id, kids: kid[p.id], x: (q.left + q.right) / 2, y: (q.top + q.bottom) / 2 }; });
      if (!f) fail('G: right no parent with a toggle');
      else {
        await page.waitForTimeout(300); await page.mouse.click(f.x, f.y); await page.waitForTimeout(300);
        const h1 = await page.evaluate(ks => ks.every(k => { const e = document.getElementById('n' + k); return !e || getComputedStyle(e).display === 'none'; }), f.kids);
        if (!h1) fail('G: right clicking the toggle did not fold the subtree');
        const q2 = await page.evaluate(id => { const t = document.querySelector('#n' + CSS.escape(id) + ' .ctog'); const q = t.getBoundingClientRect(); return { x: (q.left + q.right) / 2, y: (q.top + q.bottom) / 2 }; }, f.id);
        await page.mouse.click(q2.x, q2.y); await page.waitForTimeout(300);
        const h2 = await page.evaluate(ks => ks.every(k => { const e = document.getElementById('n' + k); return e && getComputedStyle(e).display !== 'none'; }), f.kids);
        if (!h2) fail('G: right clicking again did not unfold');
      }
    }
  }
  await load('__PAGE__');
  const hv = await page.evaluate(() => { const c = [...document.querySelectorAll('.nd')].find(c => c.querySelector('.ctog') && c.querySelectorAll('.mr').length >= 2); if (!c) return null; const rows = c.querySelectorAll('.mr'); const m = rows[rows.length - 1];
    m.scrollIntoView({ block: 'center', inline: 'center' }); const r = m.getBoundingClientRect(); return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 }; });
  if (hv) { await page.waitForTimeout(400); await page.mouse.move(hv.x - 4, hv.y); await page.mouse.move(hv.x, hv.y, { steps: 3 }); await page.waitForTimeout(800);
    const shown = await page.evaluate(() => { const e = document.getElementById('mtip'); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; });
    if (!shown) fail('T: no tooltip when hovering the middle of the last member row of a card with a toggle'); }
  const z = await page.evaluate(() => { doZoomAbs(33); const t = [...document.querySelectorAll('.ctog')].find(t => t.getBoundingClientRect().width > 0); if (!t) return null; t.scrollIntoView({ block: 'center', inline: 'center' }); const q = t.getBoundingClientRect();
    const hit = document.elementFromPoint((q.left + q.right) / 2, (q.top + q.bottom) / 2); return { w: q.width, h: q.height, hit: !!hit && (hit === t || t.contains(hit)) }; });
  if (!z) fail('T: no toggle at 33%'); else { if (z.w < 9 || z.h < 9) fail('T: toggle at 33% zoom is ' + z.w.toFixed(1) + 'x' + z.h.toFixed(1) + 'px'); if (!z.hit) fail('T: toggle at 33% not hit at its centre'); }
  // C
  await load('__PAGE__', true);
  const cr = await page.evaluate(() => {
    const parse = s => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(x => parseFloat(x)); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
    const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
    const comp = (top, bot) => [0, 1, 2].map(i => top[i] * top[3] + bot[i] * (1 - top[3]));
    const res = []; document.querySelectorAll('.nd').forEach(c => { const k = c.querySelector('.ncnt'); if (!k || getComputedStyle(k).display === 'none' || !k.getBoundingClientRect().width) return;
      const hb = parse(getComputedStyle(c.querySelector('.nh')).backgroundColor); const kb = parse(getComputedStyle(k).backgroundColor); const fg = parse(getComputedStyle(k).color);
      if (!hb || !fg) { res.push({ id: c.id, ratio: 0 }); return; }
      const bg = kb ? comp(kb, hb) : hb.slice(0, 3); const f2 = comp(fg, bg); const L1 = lum(f2), L2 = lum(bg); res.push({ id: c.id, ratio: (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05) }); });
    return res; });
  const low = cr.filter(r => r.ratio < 4.5);
  out.info.contrast = { cards: cr.length, min: cr.length ? Math.min(...cr.map(r => r.ratio)).toFixed(2) : null };
  if (!cr.length) fail('C: no visible head counts');
  if (low.length) fail('C: ' + low.length + ' of ' + cr.length + ' head counts below 4.5 contrast (min ' + out.info.contrast.min + ')');
  // P
  await load('__PAGE__');
  const pb = await page.evaluate(() => {
    const vis = () => { const H = collHidden(); let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; S.nodes.filter(n => !H.has(n.id)).forEach(n => { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x + NW); y1 = Math.max(y1, n.y + nh(n)); });
      const z = typeof tfZoneInfo === 'function' ? tfZoneInfo() : null; if (z) { x0 = Math.min(x0, z.x); y0 = Math.min(y0, z.y); x1 = Math.max(x1, z.x + z.w); y1 = Math.max(y1, z.y + z.h); } return { x0, y0, x1, y1 }; };
    const eq = (a, b) => ['x0', 'y0', 'x1', 'y1'].every(k => Math.abs(a[k] - b[k]) <= 2);
    const b0 = _chartBounds(), v0 = vis();
    const kid = {}; S.conns.forEach(c => (kid[c.f] = kid[c.f] || []).push(c.t));
    const size = id => { let n = 0; const seen = new Set(); (function w(i) { (kid[i] || []).forEach(k => { if (!seen.has(k)) { seen.add(k); n++; w(k); } }); })(id); return n; };
    // fold the largest subtree whose folding shrinks the visible box (a fold in the middle changes nothing to detect)
    const cands = S.nodes.filter(n => n.type !== 'top' && kid[n.id]).sort((a, b) => size(b.id) - size(a.id));
    let top = null; for (const c of cands) { collToggle(c.id); const v = vis(); collToggle(c.id); if ((v.x1 - v.x0) < (v0.x1 - v0.x0) - 2 || (v.y1 - v.y0) < (v0.y1 - v0.y0) - 2) { top = c; break; } }
    if (!top) return { open: eq(b0, v0), folded: true, shrank: false };
    collToggle(top.id); const b1 = _chartBounds(), v1 = vis(); collToggle(top.id);
    return { open: eq(b0, v0), folded: eq(b1, v1), shrank: (v1.x1 - v1.x0) < (v0.x1 - v0.x0) || (v1.y1 - v1.y0) < (v0.y1 - v0.y0) };
  });
  if (!pb.open) fail('P: _chartBounds differs from the cards box with nothing folded');
  if (!pb.folded) fail('P: _chartBounds still includes folded cards');
  if (!pb.shrank) fail('P: sanity - no subtree whose folding shrinks the chart');
  if (out.errors.length) fail('E: page errors ' + out.errors.slice(0, 2).join(' | '));
  out.RESULT = out.fails.length ? 'RED' : 'GREEN';
  return JSON.stringify(out);
}
