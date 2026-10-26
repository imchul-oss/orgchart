async page => {
  const OWNER = __OWNER__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 40) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  await page.evaluate(d => { try{localStorage.clear();}catch(e){} _adoptData(JSON.parse(JSON.stringify(d)),false); _finishLoad(true); _applyOptObj(d.opt); ADMIN=true; applyRO(); render(); }, OWNER);
  for (const si of [0, 1]) {
    const r = await page.evaluate(si => { if (CUR_SHEET !== si) switchSheet(si); render(); _statTab = 'summary'; updateStatsPanel();
      const tot = document.querySelector('#statsfl-body .sfl-total-num').textContent.trim();
      const lbls = [...document.querySelectorAll('#statsfl-body > .sfl-row .sfl-lbl')].map(e => e.textContent.trim());
      const calls = [], rects = []; const P = CanvasRenderingContext2D.prototype, f0 = P.fillText, r0 = P.fillRect, tb = HTMLCanvasElement.prototype.toBlob;
      P.fillText = function (t, x, y) { calls.push({ t: String(t), x, y }); return f0.apply(this, arguments); };
      P.fillRect = function (x, y, w, h) { rects.push({ x, y, w, h, c: String(this.fillStyle) }); return r0.apply(this, arguments); };
      HTMLCanvasElement.prototype.toBlob = function () {};
      try { exportPNG(); } finally { P.fillText = f0; P.fillRect = r0; HTMLCanvasElement.prototype.toBlob = tb; }
      const H = collHidden(), cards = S.nodes.filter(n => !H.has(n.id)).map(n => ({ id: n.id, x: n.x, y: n.y, w: cardW(n), h: nh(n) }));
      let plan = null; if (typeof _statsBoxPlan === 'function') { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; cards.forEach(c => { x0 = Math.min(x0, c.x); y0 = Math.min(y0, c.y); x1 = Math.max(x1, c.x + c.w); y1 = Math.max(y1, c.y + c.h); }); const pl = _statsBoxPlan({ x0, y0, x1, y1 }); if (pl) plan = { x: pl.x, y: pl.y, w: pl.w, h: pl.h }; }
      return { tot, lbls, calls, rects, cards, plan }; }, si);
    const ti = r.calls.findIndex(c => c.t === '현원');  // grpinc (10-20): the table shows 현원 and 정원
    if (ti < 0) { fail('S1 sheet ' + si + ': no 현원 in PNG'); continue; }
    const totC = r.calls.find(c => c.t === r.tot && Math.abs(c.y - r.calls[ti].y) < 1);
    if (!totC) fail('S1 sheet ' + si + ': PNG total != panel ' + r.tot);
    r.lbls.forEach(l => { if (!r.calls.some(c => c.t === l)) fail('S1 sheet ' + si + ': PNG row missing ' + l); });
    const head = r.calls.find(c => /^인원 현황/.test(c.t));
    if (!head) fail('S1 sheet ' + si + ': no table title');
    else { const bx = r.plan;  // statsbox: the box rect comes from the plan (the fill is drawn in a translated, scaled context)
      if (!bx) fail('S2 sheet ' + si + ': table box not found');
      else r.cards.forEach(c => { if (c.x < bx.x + bx.w && c.x + c.w > bx.x && c.y < bx.y + bx.h && c.y + c.h > bx.y) fail('S2 sheet ' + si + ': table overlaps card ' + c.id); }); }
    // print
    await page.emulateMedia({ media: 'print' });
    const pr = await page.evaluate(() => { preparePrint(); const b = document.getElementById('print-stats'); if (!b) return null; const br = b.getBoundingClientRect();
      const hit = [...document.querySelectorAll('.nd')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect()).filter(c => c.width && c.left < br.right && c.right > br.left && c.top < br.bottom && c.bottom > br.top).length;
      return { vis: getComputedStyle(b).display !== 'none' && br.width > 0, tot: (b.querySelector('.ps-tot b') || {}).textContent, hit, br: [br.left, br.top, br.width, br.height] }; });
    await page.evaluate(() => { window.dispatchEvent(new Event('afterprint')); });
    await page.emulateMedia({ media: 'screen' });
    const gone = await page.evaluate(() => !document.getElementById('print-stats'));
    if (!pr) fail('S3 sheet ' + si + ': no print table'); else { if (!pr.vis) fail('S3 sheet ' + si + ': print table hidden'); if (pr.tot !== r.tot) fail('S3 sheet ' + si + ': print total ' + pr.tot + ' != ' + r.tot); if (pr.hit) fail('S3 sheet ' + si + ': print table overlaps ' + pr.hit + ' cards'); }
    if (!gone) fail('S3 sheet ' + si + ': print table left after afterprint');
    out.info['s' + si] = { tot: r.tot, lbls: r.lbls, pr };
  }
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}