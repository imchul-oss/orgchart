async page => {
  const DOC = __DOC__, OWNER = __OWNER__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 40) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const LOAD = (d, si, own) => page.evaluate(([d, si, own]) => { try{localStorage.clear();}catch(e){} window.alert = () => {}; window.confirm = () => true; _adoptData(JSON.parse(JSON.stringify(d)),false); _finishLoad(true);
    if (own) { _applyOptObj(d.opt); OPT.colGap = d.opt.colGap; } if (CUR_SHEET !== si) switchSheet(si); collState().clear(); collSave(); ADMIN = true; applyRO(); OPT.wrapN = 0; OPT.rowMode = 'depth'; autoLayout(); render(); }, [d, si, own]);
  const SET = o => page.evaluate(o => { Object.assign(OPT, o); }, o);
  const PNG = () => page.evaluate(() => {
    const rects = [], texts = []; let size = null; const P = CanvasRenderingContext2D.prototype, r0 = P.fillRect, t0 = P.fillText, tb = HTMLCanvasElement.prototype.toBlob;
    P.fillRect = function (x, y, w, h) { const m = this.getTransform(); rects.push({ x: m.a * x + m.e, y: m.d * y + m.f, w: w * m.a, h: h * m.d, c: String(this.fillStyle) }); return r0.apply(this, arguments); };
    P.fillText = function (t, x, y) { const m = this.getTransform(); texts.push({ t: String(t), x: m.a * x + m.e, y: m.d * y + m.f }); return t0.apply(this, arguments); };
    HTMLCanvasElement.prototype.toBlob = function () { size = [this.width, this.height]; };
    try { exportPNG(); } finally { P.fillRect = r0; P.fillText = t0; HTMLCanvasElement.prototype.toBlob = tb; }
    const H = collHidden(); const vis = S.nodes.filter(n => !H.has(n.id)); let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    vis.forEach(n => { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x + cardW(n)); y1 = Math.max(y1, n.y + nh(n)); });
    const tz = tfZoneInfo(); if (tz) { x0 = Math.min(x0, tz.x); y0 = Math.min(y0, tz.y); x1 = Math.max(x1, tz.x + tz.w); y1 = Math.max(y1, tz.y + tz.h); }
    // the box comes from the plan; the drawing must follow it: the title text is drawn at (box.x + 10*s, box.y + 13*s)
    const title = texts.find(q => /^인원 현황/.test(q.t));
    const pl = (typeof _statsBoxPlan === 'function') ? _statsBoxPlan({ x0, y0, x1, y1 }) : null;
    const X0 = x0 - (pl ? pl.ext.left : 0), Y0 = y0 - (pl ? pl.ext.top : 0);
    const tpos = title ? { x: title.x / 2 - 40 + X0, y: title.y / 2 - 40 + Y0 } : null;
    const bx = pl ? { x: pl.x, y: pl.y, w: pl.w, h: pl.h, s: pl.s, ext: pl.ext, inside: pl.inside, titleOk: !!tpos && Math.abs(tpos.x - (pl.x + 10 * pl.s)) <= 1 && Math.abs(tpos.y - (pl.y + 13 * pl.s)) <= 1 } : null;
    const cards = vis.map(n => ({ id: n.id, x: n.x, y: n.y, w: cardW(n), h: nh(n) }));
    const ov = bx ? cards.filter(c => c.x < bx.x + bx.w && c.x + c.w > bx.x && c.y < bx.y + bx.h && c.y + c.h > bx.y).map(c => c.id) : [];
    return { size, bounds: { x0, y0, x1, y1 }, box: bx, hasTitle: !!title, ov }; });
  const o1 = await page.evaluate(() => { const g = id => document.getElementById(id); const sec = id => { const e = g(id); const s = e && e.closest('.opt-sec[data-sec]'); return s ? s.getAttribute('data-sec') : null; };
    return { show: g('opt-sbshow') ? [g('opt-sbshow').checked, sec('opt-sbshow')] : null, pos: g('opt-sbpos') ? [g('opt-sbpos').value, [...g('opt-sbpos').options].map(o => o.value).join(','), sec('opt-sbpos')] : null, mode: g('opt-sbmode') ? [g('opt-sbmode').value, [...g('opt-sbmode').options].map(o => o.value).join(','), sec('opt-sbmode')] : null, scale: g('opt-sbscale') ? [+g('opt-sbscale').value, +g('opt-sbscale').min, +g('opt-sbscale').max, sec('opt-sbscale')] : null, opt: [OPT.sbShow, OPT.sbPos, OPT.sbMode, OPT.sbScale] }; });
  out.info.o1 = o1;
  if (!o1.show || o1.show[0] !== true || o1.show[1] !== 'count') fail('O1: 표시 control ' + JSON.stringify(o1.show));
  if (!o1.pos || o1.pos[0] !== 'tl' || o1.pos[1] !== 'tl,tr,bl,br' || o1.pos[2] !== 'count') fail('O1: 위치 control ' + JSON.stringify(o1.pos));
  if (!o1.mode || o1.mode[0] !== 'auto' || o1.mode[1] !== 'auto,outside,inside' || o1.mode[2] !== 'count') fail('O1: 자리 control ' + JSON.stringify(o1.mode));
  if (!o1.scale || o1.scale[0] !== 100 || o1.scale[1] > 60 || o1.scale[2] < 160 || o1.scale[3] !== 'count') fail('O1: 크기 control ' + JSON.stringify(o1.scale));
  const W = b => Math.round((b.x1 - b.x0 + 80) * 2);
  for (const [k, d, si, own] of [['final/0', DOC, 0, false], ['owner/1', OWNER, 1, true]]) {
    await LOAD(d, si, own); await SET({ sbShow: true, sbPos: 'tl', sbMode: 'auto', sbScale: 100 });
    const p = await PNG(); out.info[k] = { size: p.size, w: W(p.bounds), box: p.box, ov: p.ov };
    if (!p.hasTitle || !p.box) { fail('P1 ' + k + ': table not drawn or not found'); continue; }
    if (!p.size || p.size[0] !== W(p.bounds)) fail('P1 ' + k + ': image width ' + (p.size && p.size[0]) + ' want ' + W(p.bounds) + ' (no extra column)');
    if (Math.abs(p.box.x - p.bounds.x0) > 1 || Math.abs(p.box.y - p.bounds.y0) > 1) fail('P1 ' + k + ': box at ' + p.box.x.toFixed(0) + ',' + p.box.y.toFixed(0) + ' want ' + p.bounds.x0 + ',' + p.bounds.y0);
    if (p.ov.length) fail('P1 ' + k + ': box overlaps ' + p.ov.join(','));
    if (!p.box.titleOk) fail('P1 ' + k + ': the drawn title does not sit at the planned box');
    if (k === 'final/0') {
      for (const pos of ['tr', 'br']) { await SET({ sbPos: pos }); const q = await PNG(); const ex = pos === 'tr' ? [q.bounds.x1 - q.box.w, q.bounds.y0] : [q.bounds.x1 - q.box.w, q.bounds.y1 - q.box.h];
        if (!q.box || Math.abs(q.box.x - ex[0]) > 1 || Math.abs(q.box.y - ex[1]) > 1 || q.ov.length || q.size[0] !== W(q.bounds)) fail('P2 ' + pos + ': box ' + JSON.stringify(q.box) + ' want ' + ex + ' ov ' + q.ov + ' width ' + q.size[0] + '/' + W(q.bounds)); }
      await SET({ sbPos: 'tl', sbMode: 'outside' }); const o = await PNG();
      if (!o.box || o.size[0] !== W(o.bounds) + Math.round((o.box.w + 30) * 2) || Math.abs(o.box.x - (o.bounds.x0 - o.box.w - 30)) > 1) fail('P3 outside tl: width ' + o.size[0] + ' want ' + (W(o.bounds) + Math.round((o.box.w + 30) * 2)) + ', box x ' + (o.box && o.box.x));
      await SET({ sbPos: 'tr' }); const o2 = await PNG(); if (!o2.box || Math.abs(o2.box.x - (o2.bounds.x1 + 30)) > 1 || o2.size[0] !== W(o2.bounds) + Math.round((o2.box.w + 30) * 2)) fail('P3 outside tr: box x ' + (o2.box && o2.box.x) + ' want ' + (o2.bounds.x1 + 30));
      await SET({ sbPos: 'tl', sbMode: 'auto', sbShow: false }); const n = await PNG(); if (n.hasTitle || n.size[0] !== W(n.bounds)) fail('P5 off: title ' + n.hasTitle + ' width ' + n.size[0] + '/' + W(n.bounds));
      await SET({ sbShow: true, sbScale: 60 }); const s = await PNG(); if (!s.box || Math.abs(s.box.w - 90) > 1) fail('P5 scale 60: box w ' + (s.box && s.box.w)); await SET({ sbScale: 100 });
    }
    if (k === 'owner/1') { await SET({ sbPos: 'bl', sbMode: 'auto' }); const q = await PNG(); out.info.p4 = { box: q.box, ov: q.ov, size: q.size };
      if (!q.box || q.ov.length || Math.abs(q.box.x - (q.bounds.x0 - q.box.w - 30)) > 1) fail('P4 bl occupied: box ' + JSON.stringify(q.box) + ' ov ' + q.ov + ' (want outside-left column)'); await SET({ sbPos: 'tl' }); }
  }
  // P6 print
  await LOAD(DOC, 0, false); await page.emulateMedia({ media: 'print' });
  const pr = await page.evaluate(() => { const cvs = document.getElementById('canvas'); const get = () => { preparePrint(); const b = document.getElementById('print-stats'); const t = cvs.style.transform; const br = b ? b.getBoundingClientRect() : null;
      const hit = b ? [...document.querySelectorAll('.nd')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect()).filter(c => c.width && c.left < br.right && c.right > br.left && c.top < br.bottom && c.bottom > br.top).length : null; restorePrint(); return { t, br: br ? [br.left, br.top, br.width, br.height] : null, hit }; };
    OPT.sbShow = false; const off = get(); OPT.sbShow = true; OPT.sbPos = 'tl'; OPT.sbMode = 'auto'; const on = get(); OPT.sbMode = 'outside'; const outs = get(); OPT.sbMode = 'auto';
    preparePrint(); window.dispatchEvent(new Event('afterprint')); const gone = !document.getElementById('print-stats'); return { off, on, outs, gone }; });
  await page.emulateMedia({ media: 'screen' }); out.info.p6 = pr;
  if (!pr.on.br) fail('P6: no print table'); else { if (pr.on.t !== pr.off.t) fail('P6: auto/free corner changed the chart transform: ' + pr.on.t + ' vs ' + pr.off.t); if (pr.on.hit) fail('P6: print table overlaps ' + pr.on.hit + ' cards'); if (pr.on.br[0] < 19 || pr.on.br[1] < 19 || pr.on.br[0] + pr.on.br[2] > 1124 || pr.on.br[1] + pr.on.br[3] > 795) fail('P6: print table outside the page ' + pr.on.br); }
  if (pr.outs.t === pr.off.t) fail('P6: outside mode did not shift the chart'); if (!pr.gone) fail('P6: table left after afterprint');
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}