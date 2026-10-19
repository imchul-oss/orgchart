// Judge for ORGCHART-TOGPILL (2026-10-16), written before the code. v3 (same day): the owner meant the VERTICAL centre, so tc/bc are replaced by 'mr' (right, vertically centred); P2c checks mr, tc/bc must fall back to 'tr'. Substitute __DOC__, __PAGE__, __REF__.
// (T1) the collapse toggle .ctog of an unfolded card with children is hidden (opacity <= .05, or visibility hidden, or
//      display none) while the mouse is away from the card, and is not what elementFromPoint returns at its centre;
// (T2) with the mouse over the card it is visible (opacity >= .9, visibility visible) and its text is "−" (U+2212);
// (T3) a folded card's toggle is visible with the mouse away, text "+N" with N = collDesc(id).size;
// (T4) hovering the card and clicking the toggle's centre with the real mouse folds it, a second click unfolds it;
// (T5) T1-T4 also hold on the sideways layout (OPT.orient right, autoLayout);
// (P1) default options (cntPos 'tr', cntColor ''): every pill keeps today's place: its offset from the card's top-right
//      corner equals the reference within 0.5 px (chart units), and its colours equal cntPillColors of its header;
// (P2) cntPos 'br': pill right edge as in 'tr', pill bottom 2-6 px above the header (.nh) bottom (chart units);
// (P2c) cntPos 'mr': pill right edge as in 'tr', pill centre within 1 px of the header (.nh) vertical centre (chart
//      units); saved values 'tc' and 'bc' are no longer offered and restore as 'tr';
// (P3) cntPos 'badge': pill centre within 3 px of the card's top-right corner (chart units);
// (P4) cntColor '#rrggbb': pill background is that colour, opaque; text colour is whichever of #ffffff and #1b1b1b has
//      the higher contrast on it (checked with #c0392b and #ffd166); cntColor '' gives cntPillColors again;
// (P5) options UI: select #opt-cntpos (values tr, mr, br, badge), input[type=color] #opt-cntcol, button #opt-cntcol-auto;
//      a change on the select / input on the colour / click on the button sets OPT.cntPos / OPT.cntColor / '' and
//      updates the pills; the controls show the current values after _applyOptObj;
// (P6) _applyOptObj restores cntPos and cntColor from a saved object and sanitises: an unknown cntPos gives 'tr', a
//      cntColor that is not #rrggbb gives '';
// (P7) exportPNG draws each pill at the place the screen shows: for each "N명" pill, its rectangle moves between tr, br
//      and badge by the same delta (chart units, within 2 px) as the on-screen pill of the same card; with cntColor
//      '#c0392b' each exported pill rectangle uses that colour and its text the P4 colour;
// (P8) showCnt false: no visible .ncnt and no "N명" text in exportPNG;
// (R) positions and connector paths after autoLayout on every sheet equal the reference;
// (E) no page errors.
async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  async function load(url, orient) {
    await page.goto(url); await page.waitForTimeout(500);
    await page.evaluate(([d, o]) => { try { localStorage.clear(); } catch (e) {} const doc = JSON.parse(JSON.stringify(d));
      _adoptData(doc, false); _finishLoad(true); switchSheet(0); OPT.wrapN = 0; OPT.orient = o || 'down'; autoLayout(); render(); }, [DOC, orient || 'down']);
    await page.waitForTimeout(300);
  }
  const SNAP = () => ({ pos: S.nodes.map(n => n.id + ':' + n.x + ',' + n.y).sort(),
    paths: Array.prototype.map.call(document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash'), p => p.getAttribute('class') + '|' + p.getAttribute('d').replace(/\s+/g, ' ').trim()).sort() });
  // pill geometry in chart units relative to the card, per card id
  const PILLS = () => { const k = S.scale; const r = {}; document.querySelectorAll('.nd').forEach(c => { const p = c.querySelector('.ncnt'); if (!p || c.style.display === 'none') return;
    const cs = getComputedStyle(p); if (cs.display === 'none' || !p.getBoundingClientRect().width) return;
    const a = c.getBoundingClientRect(), b = p.getBoundingClientRect(), h = c.querySelector('.nh').getBoundingClientRect();
    r[c.id] = { vc: (b.top + b.height / 2 - (h.top + h.height / 2)) / k, dr: (b.right - a.right) / k, dt: (b.top - a.top) / k, db: (h.bottom - b.bottom) / k, cx: (b.left + b.width / 2 - a.right) / k, cy: (b.top + b.height / 2 - a.top) / k,
      bg: cs.backgroundColor, fg: cs.color, hb: getComputedStyle(c.querySelector('.nh')).backgroundColor }; }); return r; };
  await load('__REF__');
  const sheets = await page.evaluate(() => SHEETS.length);
  const ref = {};
  for (let s = 0; s < sheets; s++) ref[s] = await page.evaluate(([s, sn]) => { switchSheet(s); OPT.wrapN = 0; OPT.orient = 'down'; autoLayout(); render(); return eval('(' + sn + ')')(); }, [s, SNAP.toString()]);
  await page.evaluate(() => { switchSheet(0); OPT.wrapN = 0; OPT.orient = 'down'; autoLayout(); render(); });
  const refPills = await page.evaluate(PILLS);
  await load('__PAGE__');
  for (let s = 0; s < sheets; s++) {
    const c = await page.evaluate(([s, sn]) => { switchSheet(s); OPT.wrapN = 0; OPT.orient = 'down'; autoLayout(); render(); return eval('(' + sn + ')')(); }, [s, SNAP.toString()]);
    if (JSON.stringify(c.pos) !== JSON.stringify(ref[s].pos)) fail('R: positions differ sheet ' + s);
    if (JSON.stringify(c.paths) !== JSON.stringify(ref[s].paths)) fail('R: paths differ sheet ' + s);
  }

  // ---- T
  async function togCheck(tag, orient) {
    await load('__PAGE__', orient);
    const ids = await page.evaluate(() => { const kid = new Set(S.conns.map(c => c.f)); return S.nodes.filter(n => kid.has(n.id) && document.getElementById('n' + n.id)).slice(0, 3).map(n => n.id); });
    if (!ids.length) { fail(tag + ': sanity - no card with children'); return; }
    let n = 0;
    for (const id of ids) {
      await page.evaluate(id => { S.scale = 1; document.getElementById('canvas').style.transform = 'scale(1)'; try { updateZoomVars && updateZoomVars(); } catch (e) {}
        const el = document.getElementById('n' + id); el.scrollIntoView({ block: 'center', inline: 'center' }); }, id);
      await page.waitForTimeout(150);
      const away = async () => { const w = await page.evaluate(() => { const r = document.getElementById('wrap').getBoundingClientRect(); return { x: r.right - 30, y: r.bottom - 30 }; }); await page.mouse.move(w.x, w.y); await page.waitForTimeout(400); };
      const st = () => page.evaluate(id => { const c = document.getElementById('n' + id), t = c && c.querySelector('.ctog'); if (!t) return null; const cs = getComputedStyle(t), b = t.getBoundingClientRect();
        const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        return { op: +cs.opacity, vis: cs.visibility, disp: cs.display, txt: t.textContent.trim(), hit: !!(hit && t.contains(hit)), x: b.left + b.width / 2, y: b.top + b.height / 2, n: collDesc(id).size, folded: collState().has(id) }; }, id);
      const hidden = s => s.disp === 'none' || s.vis === 'hidden' || s.op <= .05;
      const shown = s => s.disp !== 'none' && s.vis === 'visible' && s.op >= .9;
      await away();
      let s = await st(); if (!s) { fail(tag + ': no toggle on ' + id); continue; }
      if (!hidden(s)) fail(tag + ' T1: toggle of ' + id + ' visible with mouse away (op ' + s.op + ')');
      if (s.hit) fail(tag + ' T1: hidden toggle of ' + id + ' still takes clicks');
      const cr = await page.evaluate(id => { const b = document.getElementById('n' + id).querySelector('.nb, .nh').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, id);
      await page.mouse.move(cr.x, cr.y); await page.waitForTimeout(400);
      s = await st();
      if (!shown(s)) fail(tag + ' T2: toggle of ' + id + ' not visible on hover (op ' + s.op + ', ' + s.vis + ')');
      if (s.txt !== '−') fail(tag + ' T2: toggle text "' + s.txt + '"');
      await page.mouse.move(s.x, s.y, { steps: 4 }); await page.waitForTimeout(250);
      await page.mouse.click(s.x, s.y); await page.waitForTimeout(300);
      s = await st();
      if (!s.folded) fail(tag + ' T4: click did not fold ' + id);
      await away(); s = await st();
      if (!shown(s)) fail(tag + ' T3: folded toggle of ' + id + ' hidden with mouse away');
      if (s.txt !== '+' + s.n) fail(tag + ' T3: folded text "' + s.txt + '" want +' + s.n);
      await page.mouse.move(cr.x, cr.y); await page.waitForTimeout(250);
      s = await st(); await page.mouse.move(s.x, s.y, { steps: 4 }); await page.waitForTimeout(200);
      await page.mouse.click(s.x, s.y); await page.waitForTimeout(300);
      s = await st(); if (s.folded) fail(tag + ' T4: second click did not unfold ' + id);
      n++;
    }
    out.info[tag] = n;
  }
  await togCheck('T', 'down');
  await togCheck('T5', 'right');

  // ---- P
  await load('__PAGE__');
  const p1 = await page.evaluate(PILLS);
  const ids = Object.keys(refPills);
  if (!ids.length) fail('P1: sanity - no pills in the reference');
  let bad1 = 0, badc = 0;
  const cpc = await page.evaluate(() => typeof cntPillColors === 'function');
  for (const id of ids) { const a = p1[id], b = refPills[id]; if (!a) { bad1++; continue; } if (Math.abs(a.dr - b.dr) > .5 || Math.abs(a.dt - b.dt) > .5) bad1++; }
  if (bad1) fail('P1: ' + bad1 + ' of ' + ids.length + ' pills moved with default options');
  if (cpc) { badc = await page.evaluate(() => { let n = 0; const cv = document.createElement('canvas').getContext('2d'); const norm = s => { cv.fillStyle = '#000'; cv.fillStyle = s; return cv.fillStyle; };
    document.querySelectorAll('.nd').forEach(c => { const p = c.querySelector('.ncnt'); if (!p || !p.getBoundingClientRect().width) return; const k = cntPillColors(getComputedStyle(c.querySelector('.nh')).backgroundColor); const cs = getComputedStyle(p); if (norm(cs.backgroundColor) !== norm(k.bg) || norm(cs.color) !== norm(k.fg)) n++; }); return n; });
    if (badc) fail('P1: ' + badc + ' pills not using cntPillColors with default options'); }
  out.info.P1 = { pills: ids.length };
  const setOpt = (pos, col) => page.evaluate(([pos, col]) => { OPT.cntPos = pos; OPT.cntColor = col; render(); }, [pos, col]);
  await setOpt('br', ''); const pb = await page.evaluate(PILLS);
  let bad2 = 0; for (const id of Object.keys(p1)) { const a = pb[id], t = p1[id]; if (!a || Math.abs(a.dr - t.dr) > .5 || a.db < 2 || a.db > 6) bad2++; }
  if (bad2) fail('P2: ' + bad2 + ' pills not at header bottom-right with cntPos br');
  await setOpt('mr', ''); const pmr = await page.evaluate(PILLS);
  let bad2c = 0; for (const id of Object.keys(p1)) { const a = pmr[id], t = p1[id]; if (!a || Math.abs(a.vc) > 1 || Math.abs(a.dr - t.dr) > .5) bad2c++; }
  if (bad2c) fail('P2c: ' + bad2c + ' pills not right and vertically centred with cntPos mr');
  await setOpt('badge', ''); const pg = await page.evaluate(PILLS);
  let bad3 = 0; for (const id of Object.keys(p1)) { const a = pg[id]; if (!a || Math.hypot(a.cx, a.cy) > 3) bad3++; }
  if (bad3) fail('P3: ' + bad3 + ' pills not centred on the top-right corner with cntPos badge');
  // P4
  for (const col of ['#c0392b', '#ffd166']) {
    await setOpt('tr', col);
    const r = await page.evaluate(col => { const cv = document.createElement('canvas').getContext('2d'); const norm = s => { cv.fillStyle = '#000'; cv.fillStyle = s; return cv.fillStyle; };
      const L = h => { const v = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4)); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
      const R = (a, b) => { const A = L(a), B = L(b); return (Math.max(A, B) + .05) / (Math.min(A, B) + .05); };
      const want = R('#ffffff', col) >= R('#1b1b1b', col) ? '#ffffff' : '#1b1b1b';
      let n = 0, bad = 0; document.querySelectorAll('.nd .ncnt').forEach(p => { if (!p.getBoundingClientRect().width) return; n++; const cs = getComputedStyle(p); if (norm(cs.backgroundColor) !== norm(col) || norm(cs.color) !== norm(want)) bad++; });
      return { n, bad, want }; }, col);
    if (!r.n || r.bad) fail('P4: cntColor ' + col + ': ' + r.bad + ' of ' + r.n + ' pills wrong (want text ' + r.want + ')');
  }
  // P5
  const ui = await page.evaluate(() => { const s = document.getElementById('opt-cntpos'), c = document.getElementById('opt-cntcol'), a = document.getElementById('opt-cntcol-auto'); const r = { has: !!(s && c && a) };
    if (!r.has) return r; r.opts = Array.prototype.map.call(s.options, o => o.value).sort().join(',');
    s.value = 'badge'; s.dispatchEvent(new Event('change', { bubbles: true })); r.pos = OPT.cntPos;
    c.value = '#c0392b'; c.dispatchEvent(new Event('input', { bubbles: true })); c.dispatchEvent(new Event('change', { bubbles: true })); r.col = OPT.cntColor;
    const p = document.querySelector('.nd .ncnt'); r.bg = p ? getComputedStyle(p).backgroundColor : '';
    a.click(); r.auto = OPT.cntColor;
    _applyOptObj(Object.assign(JSON.parse(JSON.stringify(OPT)), { cntPos: 'br', cntColor: '#123456' }));
    r.ctlPos = s.value; r.ctlCol = c.value.toLowerCase(); return r; });
  if (!ui.has) fail('P5: missing #opt-cntpos / #opt-cntcol / #opt-cntcol-auto');
  else {
    if (ui.opts !== 'badge,br,mr,tr') fail('P5: select values ' + ui.opts);
    if (ui.pos !== 'badge') fail('P5: select change did not set OPT.cntPos');
    if (ui.col !== '#c0392b') fail('P5: colour input did not set OPT.cntColor (' + ui.col + ')');
    if (!/192,\s*57,\s*43/.test(ui.bg)) fail('P5: pill colour not updated after colour input (' + ui.bg + ')');
    if (ui.auto !== '') fail('P5: auto button did not reset OPT.cntColor');
    if (ui.ctlPos !== 'br' || ui.ctlCol !== '#123456') fail('P5: controls do not show restored values (' + ui.ctlPos + ', ' + ui.ctlCol + ')');
  }
  // P6
  const p6 = await page.evaluate(() => { const b = JSON.parse(JSON.stringify(OPT)); const r = {};
    _applyOptObj(Object.assign({}, b, { cntPos: 'badge', cntColor: '#abcdef' })); r.a = [OPT.cntPos, OPT.cntColor];
    _applyOptObj(Object.assign({}, b, { cntPos: 'evil', cntColor: 'red;x' })); r.b = [OPT.cntPos, OPT.cntColor];
    _applyOptObj(Object.assign({}, b, { cntPos: 'tc' })); r.tc = OPT.cntPos; _applyOptObj(Object.assign({}, b, { cntPos: 'bc' })); r.bc = OPT.cntPos; _applyOptObj(Object.assign({}, b, { cntPos: 'evil', cntColor: 'red;x' }));
    const f = JSON.parse(JSON.stringify(_fileData())); r.f = [f.opt.cntPos, f.opt.cntColor];
    _applyOptObj(Object.assign({}, b, { cntPos: 'tr', cntColor: '' })); render(); return r; });
  if (p6.a.join() !== 'badge,#abcdef') fail('P6: not restored ' + p6.a.join());
  if (p6.b.join() !== 'tr,') fail('P6: not sanitised ' + p6.b.join());
  if (p6.tc !== 'tr' || p6.bc !== 'tr') fail('P6: retired tc/bc not restored as tr (' + p6.tc + ', ' + p6.bc + ')');
  if (p6.f.join() !== 'tr,') fail('P6: _fileData does not carry the options ' + p6.f.join());
  // P7
  const exp = async () => page.evaluate(() => { const ops = []; const P = CanvasRenderingContext2D.prototype; const oR = P.fillRect, oT = P.fillText, oF = P.fill, oRR = P.roundRect;
    let last = null;
    P.fillRect = function (x, y, w, h) { const m = this.getTransform(); last = { x: m.a * x + m.e, y: m.d * y + m.f, w: m.a * w, h: m.d * h, s: m.a, c: this.fillStyle }; ops.push(['r', last]); return oR.apply(this, arguments); };
    if (oRR) P.roundRect = function (x, y, w, h) { const m = this.getTransform(); this._rr = { x: m.a * x + m.e, y: m.d * y + m.f, w: m.a * w, h: m.d * h, s: m.a }; return oRR.apply(this, arguments); };
    P.fill = function () { if (this._rr) { ops.push(['r', Object.assign({ c: this.fillStyle }, this._rr)]); this._rr = null; } return oF.apply(this, arguments); };
    P.fillText = function (s) { ops.push(['t', this.fillStyle, String(s)]); return oT.apply(this, arguments); };
    const tb = HTMLCanvasElement.prototype.toBlob; HTMLCanvasElement.prototype.toBlob = function () {};
    try { exportPNG(); } finally { P.fillRect = oR; P.fillText = oT; P.fill = oF; if (oRR) P.roundRect = oRR; HTMLCanvasElement.prototype.toBlob = tb; }
    const cv = document.createElement('canvas').getContext('2d'); const norm = s => { cv.fillStyle = '#000'; cv.fillStyle = s; return cv.fillStyle; };
    const res = []; ops.forEach((o, i) => { if (o[0] !== 't' || !/^\s*\d+\s*명\s*$/.test(o[2])) return; let j = i - 1; while (j >= 0 && ops[j][0] !== 'r') j--; const r = j >= 0 ? ops[j][1] : null;
      res.push({ x: r ? r.x / r.s : NaN, y: r ? r.y / r.s : NaN, bg: r ? norm(r.c) : '', fg: norm(o[1]) }); }); return res; });
  await setOpt('tr', ''); const etr = await exp(); const str = await page.evaluate(PILLS);
  await setOpt('br', ''); const ebr = await exp(); const sbr = await page.evaluate(PILLS);
  await setOpt('badge', ''); const ebg = await exp(); const sbg = await page.evaluate(PILLS);
  await setOpt('mr', ''); const emr = await exp(); const smr = await page.evaluate(PILLS);
  if (!etr.length) fail('P7: exportPNG drew no pills');
  else if ([ebr, ebg, emr].some(e => e.length !== etr.length)) fail('P7: pill count differs between positions ' + [etr.length, ebr.length, ebg.length]);
  else {
    // screen deltas are the same for every card of one type; compare as multisets of rounded deltas
    const sd = (A, B) => Object.keys(A).filter(k => B[k]).map(k => Math.round((B[k].dt - A[k].dt)) + '|' + Math.round(((B[k].dr + 0) - A[k].dr))).sort();
    const ed = (A, B) => A.map((a, i) => [Math.round(B[i].y - a.y), Math.round(B[i].x - a.x)]);
    const chk = (tag, A, B, sa, sb) => { const want = Object.keys(sa).filter(k => sb[k]).map(k => [sb[k].dt - sa[k].dt, sb[k].dr - sa[k].dr]);
      const got = ed(A, B); let bad = 0; got.forEach(g => { if (!want.some(w => Math.abs(w[0] - g[0]) <= 2 && Math.abs(w[1] - g[1]) <= 2)) bad++; }); if (bad) fail('P7: ' + bad + ' of ' + got.length + ' exported pills do not follow ' + tag + ' (e.g. ' + JSON.stringify(got[0]) + ' vs ' + JSON.stringify(want[0]) + ')'); };
    chk('tr->br', etr, ebr, str, sbr); chk('tr->badge', etr, ebg, str, sbg); chk('tr->mr', etr, emr, str, smr);
  }
  await setOpt('tr', '#c0392b'); const ec = await exp();
  const badE = ec.filter(e => e.bg !== '#c0392b' || e.fg !== '#ffffff').length;
  if (!ec.length || badE) fail('P7: ' + badE + ' of ' + ec.length + ' exported pills ignore cntColor');
  // P8
  await page.evaluate(() => { OPT.cntPos = 'tr'; OPT.cntColor = ''; OPT.showCnt = false; render(); });
  const vis8 = await page.evaluate(() => Array.prototype.filter.call(document.querySelectorAll('.nd .ncnt'), p => getComputedStyle(p).display !== 'none' && p.getBoundingClientRect().width > 0).length);
  const e8 = await exp();
  if (vis8 || e8.length) fail('P8: showCnt false still shows ' + vis8 + ' pills / exports ' + e8.length);
  if (out.errors.length) fail('E: page errors ' + out.errors.slice(0, 2).join(' | '));
  out.RESULT = out.fails.length ? 'RED' : 'GREEN';
  return JSON.stringify(out);
}
