async page => {
  const OWNER = __OWNER__, DOC = __DOC__;
  const out = { errors: [], fails: [], info: { cases: 0, worst: null } };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const RUN = async (doc, sheet, opt, tag) => page.evaluate(async ([d, si, o]) => {
    try { localStorage.clear(); } catch (e) {}
    _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(true);
    if (d.opt && typeof _applyOptObj === 'function') _applyOptObj(d.opt);
    Object.assign(OPT, o); if (o.nw) NW = o.nw;
    if (CUR_SHEET !== si) switchSheet(si);
    autoLayout(); render(); await new Promise(r => setTimeout(r, 60));
    const R = [...document.querySelectorAll('#nl .nd')].filter(e => e.offsetParent).map(e => { const x = parseFloat(e.style.left), y = parseFloat(e.style.top); return { id: e.id.slice(1), x, y, r: x + e.offsetWidth, b: y + e.offsetHeight }; });
    const bad = []; let worst = 1e9;
    for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) { const a = R[i], c = R[j];
      if (Math.min(a.b, c.b) - Math.max(a.y, c.y) <= 0) continue;
      const gx = Math.max(a.x, c.x) - Math.min(a.r, c.r); worst = Math.min(worst, gx - OPT.colGap / 2);
      if (gx < OPT.colGap / 2) bad.push([a.id, c.id, Math.round(gx)]); }
    return { bad, worst, cg: OPT.colGap, n: R.length };
  }, [doc, sheet, opt]).then(r => { out.info.cases++; if (out.info.worst === null || r.worst < out.info.worst) out.info.worst = r.worst;
    r.bad.forEach(b => fail(tag + ': ' + b[0] + ' / ' + b[1] + ' gap ' + b[2] + ' (colGap ' + r.cg + ')')); });
  for (const cg of [30, 20, 10, 60]) await RUN(OWNER, 1, { colGap: cg }, 'G1 cg' + cg);
  for (const si of [0, 1]) for (const cg of [10, 30, 60]) for (const nw of [160, 228]) for (const wr of [0, 5]) await RUN(DOC, si, { colGap: cg, nw, wrapN: wr }, 'G2 s' + si + ' cg' + cg + ' nw' + nw + ' wrap' + wr);
  const Z = JSON.parse(JSON.stringify(OWNER)); Z.sheets.forEach(s => s.nodes.forEach(n => { n.x = 0; n.y = 0; }));
  for (const si of [0, 1]) await RUN(Z, si, {}, 'G3 s' + si);
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}