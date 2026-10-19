async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  const COLS = ['#000000', '#17365d', '#2c2c2c', '#475569', '#808080', '#1a7f37', '#40d2a7', '#ffd166', '#ffffff'];
  async function load(url, extra) {
    await page.goto(url); await page.waitForTimeout(500);
    await page.evaluate(([d, extra, COLS]) => { try { localStorage.clear(); } catch (e) {} const doc = JSON.parse(JSON.stringify(d));
      if (extra) { const s = doc.sheets[0]; const mem = i => [{ n: '가나' + i, f: '기획', r: '대리', s: 'active' }];
        ['top', 'l1', 'l2', 'l3', 'l4', 'l5', 'tf', 'side'].forEach((t, i) => s.nodes.push({ id: 'x_' + t, en: 'X ' + t, ko: '', type: t, x: 0, y: 0, m: mem(i) }));
        COLS.forEach((c, i) => s.nodes.push({ id: 'c_' + i, en: 'C ' + i, ko: '', type: 'l2', x: 0, y: 0, color: c, m: mem(i) })); }
      _adoptData(doc, false); _finishLoad(true); switchSheet(0); OPT.wrapN = 0; OPT.orient = 'down'; autoLayout(); render(); }, [DOC, !!extra, COLS]);
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
  // F
  await load('__PAGE__');
  const f = await page.evaluate(() => {
    const box = () => { const H = collHidden(); let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; S.nodes.filter(n => !H.has(n.id)).forEach(n => { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x + NW); y1 = Math.max(y1, n.y + nh(n)); });
      const z = typeof tfZoneInfo === 'function' ? tfZoneInfo() : null; if (z) { x0 = Math.min(x0, z.x); y0 = Math.min(y0, z.y); x1 = Math.max(x1, z.x + z.w); y1 = Math.max(y1, z.y + z.h); } return { x0, y0, x1, y1 }; };
    const w = document.getElementById('wrap'); const want = b => Math.min(w.clientWidth / (b.x1 - b.x0 + 160), w.clientHeight / (b.y1 - b.y0 + 160), 1.4) * .88;
    fitScreen(); const s0 = S.scale, b0 = box();
    const kid = {}; S.conns.forEach(c => (kid[c.f] = kid[c.f] || []).push(c.t));
    const size = id => { let n = 0; const seen = new Set(); (function wk(i) { (kid[i] || []).forEach(k => { if (!seen.has(k)) { seen.add(k); n++; wk(k); } }); })(id); return n; };
    const cands = S.nodes.filter(n => n.type !== 'top' && kid[n.id]).sort((a, b) => size(b.id) - size(a.id));
    let t = null; for (const c of cands) { collToggle(c.id); const v = box(); collToggle(c.id); if ((v.x1 - v.x0) < (b0.x1 - b0.x0) - 2 || (v.y1 - v.y0) < (b0.y1 - b0.y0) - 2) { t = c; break; } }
    if (!t) return { none: true };
    collToggle(t.id); fitScreen(); const s1 = S.scale, b1 = box(); collToggle(t.id);
    return { open: Math.abs(s0 - want(b0)) < 1e-6, folded: Math.abs(s1 - want(b1)) < 1e-6, s0, s1, w0: want(b0), w1: want(b1) };
  });
  if (f.none) fail('F: sanity - no subtree whose folding shrinks the chart');
  else { if (!f.open) fail('F: fitScreen with nothing folded does not match the formula'); if (!f.folded) fail('F: fitScreen still measures folded cards (' + f.s1 + ' vs ' + f.w1 + ')'); }
  // V
  await load('__PAGE__', true);
  const v = await page.evaluate(COLS => {
    const cv = document.createElement('canvas').getContext('2d');
    const rgba = s => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (m) { const p = m[1].split(',').map(x => parseFloat(x)); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
      const d = document.createElement('div'); d.style.color = s; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return rgba(c); };
    const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
    const comp = (t, b) => [0, 1, 2].map(i => t[i] * t[3] + b[i] * (1 - t[3]));
    const ratio = (a, b) => { const A = lum(a), B = lum(b); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); };
    const judge = (hb, bg, fg) => { const pb = comp(rgba(bg), hb); const tf = comp(rgba(fg), pb); return { text: ratio(tf, pb), pill: ratio(pb, hb) }; };
    if (typeof cntPillColors !== 'function') return { fn: false };
    const fnr = COLS.map(c => { const r = cntPillColors(c); const j = judge(rgba(c).slice(0, 3), r.bg, r.fg); return { c, ...j }; });
    const dom = [];
    document.querySelectorAll('.nd').forEach(c => { const k = c.querySelector('.ncnt'); if (!k || getComputedStyle(k).display === 'none' || !k.getBoundingClientRect().width) return;
      const hb = rgba(getComputedStyle(c.querySelector('.nh')).backgroundColor).slice(0, 3); const j = judge(hb, getComputedStyle(k).backgroundColor, getComputedStyle(k).color); dom.push({ id: c.id, ...j }); });
    return { fn: true, fnr, dom };
  }, COLS);
  if (!v.fn) fail('V: no function cntPillColors');
  else {
    v.fnr.forEach(r => { if (r.text < 4.5) fail('V: cntPillColors(' + r.c + ') text contrast ' + r.text.toFixed(2)); if (r.pill < 1.5) fail('V: cntPillColors(' + r.c + ') pill contrast ' + r.pill.toFixed(2)); });
    const lowT = v.dom.filter(r => r.text < 4.5).length, lowP = v.dom.filter(r => r.pill < 1.5).length;
    if (!v.dom.length) fail('V: no visible counts');
    if (lowT) fail('V: ' + lowT + ' of ' + v.dom.length + ' on-screen counts below 4.5 text contrast');
    if (lowP) fail('V: ' + lowP + ' of ' + v.dom.length + ' on-screen pills below 1.5 against their header');
    out.info.V = { cards: v.dom.length, minText: Math.min(...v.dom.map(r => r.text)).toFixed(2), minPill: Math.min(...v.dom.map(r => r.pill)).toFixed(2) };
  }
  // X
  const x = await page.evaluate(COLS => {
    if (typeof cntPillColors !== 'function') return null;
    const cv = document.createElement('canvas').getContext('2d'); const norm = s => { cv.fillStyle = '#000'; cv.fillStyle = s; return cv.fillStyle; };
    const pairs = new Set(); S.nodes.forEach(n => { const el = document.querySelector('#n' + CSS.escape(n.id) + ' .nh'); if (!el) return; const r = cntPillColors(getComputedStyle(el).backgroundColor); pairs.add(norm(r.bg) + '|' + norm(r.fg)); });
    const ops = []; const P = CanvasRenderingContext2D.prototype; const oR = P.fillRect, oT = P.fillText, oRR = P.roundRect, oF = P.fill;
    P.fillRect = function () { ops.push(['r', this.fillStyle]); return oR.apply(this, arguments); };
    P.fill = function () { ops.push(['r', this.fillStyle]); return oF.apply(this, arguments); };
    P.fillText = function (s) { ops.push(['t', this.fillStyle, String(s)]); return oT.apply(this, arguments); };
    const tb = HTMLCanvasElement.prototype.toBlob; HTMLCanvasElement.prototype.toBlob = function () {};
    try { exportPNG(); } finally { P.fillRect = oR; P.fillText = oT; P.fill = oF; HTMLCanvasElement.prototype.toBlob = tb; }
    let n = 0, bad = 0; ops.forEach((o, i) => { if (o[0] !== 't' || !/^\s*\d+\s*명\s*$/.test(o[2])) return; n++; let j = i - 1; while (j >= 0 && ops[j][0] !== 'r') j--;
      const key = (j >= 0 ? norm(ops[j][1]) : '') + '|' + norm(o[1]); if (!pairs.has(key)) bad++; });
    return { n, bad };
  }, COLS);
  if (x) { if (!x.n) fail('X: exportPNG drew no counts'); else if (x.bad) fail('X: ' + x.bad + ' of ' + x.n + ' exported counts do not use cntPillColors for their header'); }
  if (out.errors.length) fail('E: page errors ' + out.errors.slice(0, 2).join(' | '));
  out.RESULT = out.fails.length ? 'RED' : 'GREEN';
  return JSON.stringify(out);
}