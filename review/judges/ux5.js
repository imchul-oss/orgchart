async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  async function load(url) {
    await page.goto(url); await page.waitForTimeout(500);
    await page.evaluate(d => { try { localStorage.clear(); } catch (e) {} _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(_hasPositions(S.nodes)); switchSheet(0); OPT.wrapN = 0; render(); }, DOC);
    await page.waitForTimeout(300);
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
    if (JSON.stringify(c.pos) !== JSON.stringify(ref[s].pos)) fail('R: positions differ sheet ' + s);
    if (JSON.stringify(c.paths) !== JSON.stringify(ref[s].paths)) fail('R: paths differ sheet ' + s);
  }
  const COUNT = () => {
    const defKey = (OPT.statusItems[0] || {}).key;
    const excl = new Set(OPT.statsGroups.filter(g => g.excludeTotal).flatMap(g => g.statuses));
    const bad = []; let sum = 0;
    S.nodes.forEach(n => { const want = (n.m || []).filter(m => !excl.has(m.s || defKey)).length; sum += want;
      const el = document.querySelector('#n' + CSS.escape(n.id) + ' .ncnt'); const shown = !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;
      if (want > 0 && (!shown || el.textContent.replace(/\s/g, '').indexOf(want + '명') < 0)) bad.push(n.id + ':' + (el ? el.textContent : 'none') + '/' + want);
      if (want === 0 && shown) bad.push(n.id + ':shown-for-0'); });
    const tot = document.querySelector('#statsfl .sfl-total-num'); return { bad, sum, total: tot ? +tot.textContent.replace(/\D/g, '') : null };
  };
  for (let s = 0; s < sheets; s++) {
    await load('__PAGE__');
    const r = await page.evaluate(([s, cc]) => { switchSheet(s); render(); if (typeof updateStatsPanel === 'function') updateStatsPanel(); return eval('(' + cc + ')')(); }, [s, COUNT.toString()]);
    if (r.bad.length) fail('C: sheet ' + s + ' ' + r.bad.length + ' cards with a wrong or missing count');
    if (r.total !== null && r.sum !== r.total) fail('C: sheet ' + s + ' counts add up to ' + r.sum + ', 총원 shows ' + r.total);
    if (r.total === null) fail('C: sanity - no 총원 in the stats panel');
  }
  await load('__PAGE__');
  const ex = await page.evaluate(cc => { const g = OPT.statsGroups.find(g => !g.excludeTotal && g.statuses.length); g.excludeTotal = true; render(); if (typeof updateStatsPanel === 'function') updateStatsPanel(); return eval('(' + cc + ')')(); }, COUNT.toString());
  if (ex.bad.length) fail('C: after excludeTotal ' + ex.bad.length + ' cards with a wrong count');
  if (ex.sum !== ex.total) fail('C: after excludeTotal counts add up to ' + ex.sum + ', 총원 shows ' + ex.total);
  // O
  await load('__PAGE__');
  const o = await page.evaluate(() => { const cb = document.getElementById('opt-showcnt'); if (!cb) return { cb: false };
    const def = cb.checked; cb.checked = false; cb.dispatchEvent(new Event('change', { bubbles: true })); cb.dispatchEvent(new Event('input', { bubbles: true }));
    const vis = [...document.querySelectorAll('.ncnt')].filter(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0).length;
    const saved = _fileData().opt.showCnt;
    _applyOptObj({ showCnt: true }); render(); const vis2 = [...document.querySelectorAll('.ncnt')].filter(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0).length;
    _applyOptObj({ showCnt: false }); render(); const vis3 = [...document.querySelectorAll('.ncnt')].filter(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0).length;
    return { cb: true, def, vis, saved, vis2, vis3, cbAfter: cb.checked }; });
  if (!o.cb) fail('O: no #opt-showcnt checkbox');
  else {
    if (!o.def) fail('O: #opt-showcnt not checked by default');
    if (o.vis) fail('O: ' + o.vis + ' counts still displayed with the option off');
    if (o.saved !== false) fail('O: _fileData().opt.showCnt is ' + JSON.stringify(o.saved) + ' with the option off');
    if (!o.vis2) fail('O: _applyOptObj({showCnt:true}) did not show the counts');
    if (o.vis3) fail('O: _applyOptObj({showCnt:false}) did not hide the counts');
  }
  // T
  await load('__PAGE__');
  await page.evaluate(() => doZoomAbs(100));
  const tgt = await page.evaluate(() => { const n = S.nodes.find(n => (n.m || []).some(m => m.a && m.r && m.f && m.n)) || S.nodes.find(n => (n.m || []).length); const i = (n.m || []).findIndex(m => m.a && m.r && m.f) >= 0 ? n.m.findIndex(m => m.a && m.r && m.f) : 0; const m = n.m[i];
    const row = document.querySelector('#n' + CSS.escape(n.id) + ' .mr[data-mi="' + i + '"]'); row.scrollIntoView({ block: 'center', inline: 'center' }); const r = row.getBoundingClientRect();
    const st = (OPT.statusItems.find(s => s.key === (m.s || OPT.statusItems[0].key)) || {}).label;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, want: [m.n, m.r, m.f, m.a, st, n.ko].filter(Boolean).map(String), ro: document.body.classList.contains('ro') }; });
  await page.waitForTimeout(400); // let the scroll events of scrollIntoView pass before hovering (amended after g1)
  await page.mouse.move(tgt.x - 5, tgt.y); await page.mouse.move(tgt.x, tgt.y, { steps: 3 }); await page.waitForTimeout(800);
  const t1 = await page.evaluate(() => { const e = document.getElementById('mtip'); return { shown: !!e && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 0, text: e ? e.textContent : '' }; });
  if (!t1.shown) fail('T: #mtip not shown after hovering a member row (read-only ' + tgt.ro + ')');
  else { const miss = tgt.want.filter(w => t1.text.indexOf(w) < 0); if (miss.length) fail('T: tooltip misses ' + miss.length + ' of ' + tgt.want.length + ' expected texts'); }
  await page.mouse.move(5, 300); await page.waitForTimeout(400);
  const t2 = await page.evaluate(() => { const e = document.getElementById('mtip'); return !!e && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 0; });
  if (t2) fail('T: tooltip still shown after leaving the row');
  await page.mouse.move(tgt.x, tgt.y); await page.waitForTimeout(800);
  await page.emulateMedia({ media: 'print' });
  const t3 = await page.evaluate(() => { const e = document.getElementById('mtip'); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; });
  await page.emulateMedia({ media: 'screen' });
  if (t3) fail('T: tooltip displayed in print media');
  // G
  for (const on of [true, false]) {
    await load('__PAGE__');
    const g = await page.evaluate(on => { _applyOptObj({ showCnt: on }); render(); const got = []; const o = CanvasRenderingContext2D.prototype.fillText; CanvasRenderingContext2D.prototype.fillText = function (s) { got.push(String(s)); return o.apply(this, arguments); };
      const tb = HTMLCanvasElement.prototype.toBlob; HTMLCanvasElement.prototype.toBlob = function () {};
      try { exportPNG(); } finally { CanvasRenderingContext2D.prototype.fillText = o; HTMLCanvasElement.prototype.toBlob = tb; }
      return got.filter(s => /^\s*\d+\s*명\s*$/.test(s)).length; }, on);
    if (on && !g) fail('G: exportPNG drew no counts with the option on');
    if (!on && g) fail('G: exportPNG drew ' + g + ' counts with the option off');
  }
  if (out.errors.length) fail('E: page errors ' + out.errors.slice(0, 2).join(' | '));
  out.RESULT = out.fails.length ? 'RED' : 'GREEN';
  return JSON.stringify(out);
}