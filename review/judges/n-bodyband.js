async page => {
  const OWNER = __OWNER__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 40) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const STATE = () => page.evaluate(() => {
    const by = id => S.nodes.find(n => n.id === id); const one = by('o_p1_3'), multi = by('o_p1_2');
    const q = n => { const el = document.getElementById('n' + n.id), nb = el && el.querySelector('.nb'), mn = el && el.querySelector('.mn'); const cs = nb ? getComputedStyle(nb) : null; const r = mn ? mn.getBoundingClientRect() : null; const er = el ? el.getBoundingClientRect() : null;
      return { bg: cs ? cs.backgroundImage : null, pl: cs ? parseFloat(cs.paddingLeft) : null, mnLeft: r && er ? (r.left - er.left) / (S.scale || 1) : null, mc: _mcOf(n) }; };
    const cb = document.getElementById('opt-bodyband'); const sec = cb && cb.closest('.opt-sec[data-sec]');
    const bw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--band-w')) || 12;
    return { cb: !!cb, checked: cb ? cb.checked : null, sec: sec ? sec.getAttribute('data-sec') : null, cls: document.body.classList.contains('bodyband'), bw, one: q(one), multi: q(multi), opt: OPT.bodyBand };
  });
  const PNG = () => page.evaluate(() => {
    const by = id => S.nodes.find(n => n.id === id); const one = by('o_p1_3'), multi = by('o_p1_2');
    const rects = [], texts = []; const P = CanvasRenderingContext2D.prototype, r0 = P.fillRect, t0 = P.fillText, tb = HTMLCanvasElement.prototype.toBlob;
    P.fillRect = function (x, y, w, h) { rects.push([x, y, w, h]); return r0.apply(this, arguments); }; P.fillText = function (t, x, y) { texts.push([String(t), x, y]); return t0.apply(this, arguments); }; HTMLCanvasElement.prototype.toBlob = function () {};
    try { exportPNG(); } finally { P.fillRect = r0; P.fillText = t0; HTMLCanvasElement.prototype.toBlob = tb; }
    const bw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--band-w')) || 12;
    const band = n => rects.some(r => Math.abs(r[0] - n.x) < 0.5 && Math.abs(r[1] - (n.y + CUR_HH)) < 0.5 && Math.abs(r[2] - bw) < 0.5 && Math.abs(r[3] - (nh(n) - CUR_HH)) < 0.5);
    const name = (one.m[0].n || ''); const t = texts.find(q => q[0] === name) || texts.find(q => q[0] === name + (one.m[0].r ? '  ' + one.m[0].r : ''));  // fidelity (10-20): the name is its own fillText, the 직급 follows separately
    return { bw, bandOne: band(one), bandMulti: band(multi), oneTextX: t ? t[1] : null, oneX: one.x };
  });
  await page.evaluate(d => { try{localStorage.clear();}catch(e){} _adoptData(JSON.parse(JSON.stringify(d)),false); _finishLoad(true); _applyOptObj(d.opt); if (CUR_SHEET !== 1) switchSheet(1); ADMIN = true; applyRO(); autoLayout(); render(); }, OWNER);
  // D1
  const s1 = await STATE(); out.info.d1 = s1;
  if (!s1.cb) fail('D1: no #opt-bodyband'); else { if (s1.checked !== false) fail('D1: checkbox checked by default'); if (s1.sec !== 'card') fail('D1: option not in the 카드 section (' + s1.sec + ')'); }
  if (s1.cls) fail('D1: body has class bodyband by default');
  [['one', s1.one], ['multi', s1.multi]].forEach(([k, q]) => { if (!q || q.bg !== 'none' || Math.abs(q.pl || 0) > 0.5) fail('D1: ' + k + ' card body band present by default: bg ' + (q && q.bg) + ' pl ' + (q && q.pl)); });
  if (s1.multi.mc < 2) fail('D1: fixture: o_p1_2 is not multi-column');
  // D3 off
  const p1 = await PNG(); out.info.d3off = p1;
  if (p1.bandOne || p1.bandMulti) fail('D3 off: PNG body band drawn (one ' + p1.bandOne + ' multi ' + p1.bandMulti + ')');
  if (p1.oneTextX == null || Math.abs(p1.oneTextX - (p1.oneX + p1.bw + 8)) > 0.5) fail('D3 off: 1-column name text x ' + p1.oneTextX + ' want ' + (p1.oneX + p1.bw + 8));
  // D2 on via the checkbox
  if (s1.cb) {
    await page.evaluate(() => { const c = document.getElementById('opt-bodyband'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); }); await page.waitForTimeout(200);  // the options panel is closed; drive the control's own change handler
    const s2 = await STATE(); out.info.d2 = s2;
    if (!s2.cls || s2.opt !== true) fail('D2: checkbox did not turn the option on (class ' + s2.cls + ', OPT ' + s2.opt + ')');
    [['one', s2.one], ['multi', s2.multi]].forEach(([k, q]) => { if (!/linear-gradient/.test(q.bg || '') || Math.abs((q.pl || 0) - s2.bw) > 0.5) fail('D2: ' + k + ' card body band missing: bg ' + q.bg + ' pl ' + q.pl); });
    if (Math.abs((s2.one.mnLeft - s1.one.mnLeft) - s2.bw) > 1) fail('D2: 1-column member name moved by ' + (s2.one.mnLeft - s1.one.mnLeft).toFixed(1) + ' want ' + s2.bw);
    const p2 = await PNG(); out.info.d3on = p2;
    if (!p2.bandOne || !p2.bandMulti) fail('D3 on: PNG body band missing (one ' + p2.bandOne + ' multi ' + p2.bandMulti + ')');
    if (p2.oneTextX == null || Math.abs(p2.oneTextX - (p2.oneX + 2 * p2.bw + 8)) > 0.5) fail('D3 on: 1-column name text x ' + p2.oneTextX + ' want ' + (p2.oneX + 2 * p2.bw + 8));
    // D4
    const d4 = await page.evaluate(() => { const o = JSON.parse(JSON.stringify(OPT)); _applyOptObj(Object.assign({}, o, { bodyBand: false })); const a = [document.body.classList.contains('bodyband'), document.getElementById('opt-bodyband').checked, OPT.bodyBand];
      _applyOptObj(Object.assign({}, o, { bodyBand: true })); const b = [document.body.classList.contains('bodyband'), document.getElementById('opt-bodyband').checked, OPT.bodyBand]; const j = JSON.parse(JSON.stringify(OPT)); _applyOptObj(Object.assign({}, o, { bodyBand: false })); return { a, b, has: 'bodyBand' in j }; });
    out.info.d4 = d4;
    if (JSON.stringify(d4.a) !== '[false,false,false]') fail('D4: off state ' + JSON.stringify(d4.a));
    if (JSON.stringify(d4.b) !== '[true,true,true]') fail('D4: on state ' + JSON.stringify(d4.b));
    if (!d4.has) fail('D4: OPT JSON lacks bodyBand');
  }
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}