async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 40) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const rgb = s => { const t = String(s || '').trim(); if (/^#[0-9a-fA-F]{6}$/.test(t)) return [1, 3, 5].map(i => parseInt(t.slice(i, i + 2), 16)); const m = t.match(/\d+(\.\d+)?/g); return m ? m.slice(0, 3).map(Number) : null; };
  const hex2 = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (c, t) => c.map(v => Math.round(v + (255 - v) * t));
  const near = (a, b, tol = 2) => a && b && a.every((v, i) => Math.abs(v - b[i]) <= tol);
  const STATE = () => page.evaluate(() => { const q = id => { const el = document.getElementById('n' + id), h = el && el.querySelector('.nh'), pill = el && el.querySelector('.ncnt'); const cs = h ? getComputedStyle(h) : null; return { hdr: cs ? cs.backgroundColor : null, band: el ? getComputedStyle(el).getPropertyValue('--band-color').trim() : null, pill: pill ? getComputedStyle(pill).backgroundColor : null }; };
    const cb = document.getElementById('opt-gradcolor'); const sec = cb && cb.closest('.opt-sec[data-sec]');
    return { cb: !!cb, checked: cb ? cb.checked : null, sec: sec ? sec.getAttribute('data-sec') : null, opt: OPT.gradColor, fp: q('fp'), prodhq: q('prodhq'), t06: q('t_06'), t01: q('t_01'), data: Object.fromEntries(S.nodes.map(n => [n.id, n.color || ''])) }; });
  const PNGHDR = () => page.evaluate(() => { const t = S.nodes.find(n => n.id === 't_06'); const rects = []; const P = CanvasRenderingContext2D.prototype, r0 = P.fillRect, tb = HTMLCanvasElement.prototype.toBlob;
    P.fillRect = function (x, y, w, h) { rects.push({ x, y, w, h, c: String(this.fillStyle) }); return r0.apply(this, arguments); }; HTMLCanvasElement.prototype.toBlob = function () {};
    try { exportPNG(); } finally { P.fillRect = r0; HTMLCanvasElement.prototype.toBlob = tb; }
    const r = rects.find(q => Math.abs(q.x - t.x) < 0.5 && Math.abs(q.y - t.y) < 0.5 && Math.abs(q.w - cardW(t)) < 0.5 && Math.abs(q.h - CUR_HH) < 0.5); return r ? r.c : null; });
  await page.evaluate(d => { try{localStorage.clear();}catch(e){} window.alert = () => {}; window.confirm = () => true; _adoptData(JSON.parse(JSON.stringify(d)),false); _finishLoad(true); if (CUR_SHEET !== 0) switchSheet(0); ADMIN = true; applyRO(); OPT.wrapN = 0; autoLayout(); render(); }, DOC);
  const s0 = await STATE(); out.info.s0 = { cb: s0.cb, checked: s0.checked, sec: s0.sec, opt: s0.opt, t06: s0.t06 };
  if (!s0.cb) fail('G1: no #opt-gradcolor'); else { if (s0.checked !== false) fail('G1: checked by default'); if (s0.sec !== 'logo') fail('G1: not in 로고·색상 (' + s0.sec + ')'); }
  if (s0.opt === true) fail('G1: OPT.gradColor on by default');
  const base = hex2('#143797'), want06 = mix(base, 0.12);
  const png0 = await PNGHDR(); if (!near(rgb(png0), rgb(s0.t06.hdr))) fail('G4 off: PNG header ' + png0 + ' vs screen ' + s0.t06.hdr);
  if (s0.cb) {
    await page.evaluate(() => { const c = document.getElementById('opt-gradcolor'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); }); await page.waitForTimeout(200);
    const s1 = await STATE(); out.info.s1 = { opt: s1.opt, fp: s1.fp.hdr, prodhq: s1.prodhq.hdr, t06: s1.t06, t01: s1.t01.hdr };
    if (s1.opt !== true) fail('G2: option not on');
    if (s1.fp.hdr !== s0.fp.hdr) fail('G2: top card header changed ' + s1.fp.hdr);
    if (!near(rgb(s1.prodhq.hdr), base)) fail('G2: base prodhq header ' + s1.prodhq.hdr + ' want #143797');
    if (!near(rgb(s1.t06.hdr), want06)) fail('G2: t_06 header ' + s1.t06.hdr + ' want rgb(' + want06 + ')');
    if (!near(rgb(s1.t06.band), want06)) fail('G2: t_06 band ' + s1.t06.band + ' want rgb(' + want06 + ')');
    if (!near(rgb(s1.t01.hdr), hex2('#475569'))) fail('G2: t_01 (a base) header ' + s1.t01.hdr + ' want #475569');
    if (JSON.stringify(s1.data) !== JSON.stringify(s0.data)) fail('G3: nd.color data changed while on');
    const png1 = await PNGHDR(); if (!near(rgb(png1), want06)) fail('G4 on: PNG header ' + png1 + ' want rgb(' + want06 + ')');
    await page.evaluate(() => { const c = document.getElementById('opt-gradcolor'); c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); }); await page.waitForTimeout(200);
    const s2 = await STATE();
    if (s2.t06.hdr !== s0.t06.hdr || s2.t06.band !== s0.t06.band || s2.prodhq.hdr !== s0.prodhq.hdr) fail('G3: colours not restored after off: ' + s2.t06.hdr + ' / ' + s0.t06.hdr);
    if (JSON.stringify(s2.data) !== JSON.stringify(s0.data)) fail('G3: nd.color data changed');
    const g5 = await page.evaluate(() => { const o = JSON.parse(JSON.stringify(OPT)); _applyOptObj(Object.assign({}, o, { gradColor: true })); const a = [OPT.gradColor, document.getElementById('opt-gradcolor').checked, getComputedStyle(document.getElementById('nt_06').querySelector('.nh')).backgroundColor]; _applyOptObj(Object.assign({}, o, { gradColor: false })); const b = [OPT.gradColor, document.getElementById('opt-gradcolor').checked]; return { a, b }; });
    out.info.g5 = g5; if (g5.a[0] !== true || g5.a[1] !== true || !near(rgb(g5.a[2]), want06)) fail('G5: on via _applyOptObj ' + JSON.stringify(g5.a)); if (g5.b[0] !== false || g5.b[1] !== false) fail('G5: off via _applyOptObj ' + JSON.stringify(g5.b));
  }
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}