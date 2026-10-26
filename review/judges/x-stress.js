async page => {
  const XDOC = __XDOC__;
  const out = { errors: [], fails: [], info: {} };
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  page.on('pageerror', e => out.errors.push('pageerror ' + String(e).slice(0, 200)));
  page.on('console', m => { if (m.type() === 'error') out.errors.push('console ' + m.text().slice(0, 200)); });
  page.on('dialog', d => d.accept().catch(() => {}));
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('__PAGE__'); await page.waitForTimeout(500);
  const r = await page.evaluate(async X => {
    const w = ms => new Promise(res => setTimeout(res, ms)); const R = { sheets: [], t: {} };
    const now = () => performance.now();
    window.alert = () => {}; window.confirm = () => true; window.prompt = () => null;
    const dls = []; window.dl = (txt, name) => { dls.push({ txt: String(txt), name }); };
    HTMLAnchorElement.prototype.click = function () {};
    const cv = []; const tdu = HTMLCanvasElement.prototype.toDataURL, tb = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toDataURL = function () { cv.push([this.width, this.height]); return tdu.apply(this, arguments); };
    HTMLCanvasElement.prototype.toBlob = function (cb) { cv.push([this.width, this.height]); return tb.apply(this, arguments); };
    const markup = () => [...document.querySelectorAll('img[src="x"], script')].filter(e => /__xss/.test(e.outerHTML)).length;
    let t0 = now(); loadObject(JSON.parse(JSON.stringify(X)), false); ADMIN = true; applyRO(); R.t.load = Math.round(now() - t0);
    const TREE = new Set([0, 3, 4].concat([...Array(12)].map((_, i) => 6 + i)));
    for (let i = 0; i < SHEETS.length; i++) {
      const s = { i, name: SHEETS[i].name };
      try {
        t0 = now(); switchSheet(i); autoLayout(); render(); s.ms = Math.round(now() - t0);
        s.n = S.nodes.length; s.dom = document.querySelectorAll('#canvas .nd').length;
        const L = layoutLint(); s.lint = { overlap: L.overlap, broken: L.brokenN, cross: L.cross };
        if (i < 6) {
          for (const tab of ['summary', 'job', 'role', 'area', 'sheet', 'team', 'query']) { const b = [...document.querySelectorAll('#statsfl .sfl-tab')].find(x => (x.getAttribute('onclick') || '').indexOf("'" + tab + "'") >= 0); if (b) switchStatTab(b, tab); }
          s.panelBad = [...document.querySelectorAll('#statsfl .sfl-num, #statsfl .sfl-total-num, #statsfl .sfl-gap')].some(e => /NaN|undefined|\[object/.test(e.textContent));  // numbers only: the 글자 sheet uses those words as data
          t0 = now(); tvOpen(); s.rows = document.querySelectorAll('#treeview .tv-row').length; s.txtLines = tvText(true).split('\n').length; tvClose(); s.treeMs = Math.round(now() - t0);
          t0 = now(); const c0 = cv.length; try { exportPNG(); } catch (e) { s.pngErr = String(e).slice(0, 120); } s.png = cv.slice(c0).pop() || null; s.pngMs = Math.round(now() - t0);
          s.print = ['a4', 'a3', 'a4split'].map(m => { try { const e = printEstimate(m); return [m, e.pages, +(+e.s).toFixed(4), e.pt]; } catch (e) { return [m, 'ERR ' + String(e).slice(0, 80)]; } });
          if (S.nodes.length) { openEdit(S.nodes[Math.min(1, S.nodes.length - 1)].id); await w(20); cancelModal(); }
        }
        if (i === 0) {
          const P = S.nodes.find(n => S.conns.some(c => c.f === n.id) && n.type !== 'top');
          if (P) { collToggle(P.id); render(); s.lintFold = layoutLint().overlap; collToggle(P.id); render(); }
          const f0 = OPT.fsMn; OPT.fsMn = (OPT.fsMn || 11) + 6; applyAllFontHeights(); autoLayout(); render(); const L2 = layoutLint(); s.lintBig = { overlap: L2.overlap, broken: L2.brokenN }; OPT.fsMn = f0; applyAllFontHeights(); autoLayout(); render();
        }
      } catch (e) { s.err = String(e && e.stack || e).slice(0, 300); }
      s.tree = TREE.has(i); R.sheets.push(s); await w(10);
    }
    // search on the long-name sheet
    try { switchSheet(1); render(); srchOpen(); const si = document.getElementById('srch-input'); si.value = '김김김'; si.dispatchEvent(new Event('input', { bubbles: true })); await w(50); R.srch = document.getElementById('srch-box').textContent.trim().slice(0, 40); srchClose(); } catch (e) { R.srchErr = String(e).slice(0, 150); }
    R.xss = window.__xss; R.markup = markup();
    // S5 round trip
    try {
      const nz = sh => JSON.stringify(sh.map(x => { const y = Object.assign({}, x); if (y.posOrient === 'down') delete y.posOrient; return y; }));  // 'down' is the default whether written or not
      const a = nz(_fileData().sheets); loadObject(JSON.parse(JSON.stringify(_fileData())), false); const b = nz(_fileData().sheets);
      R.round = a === b ? 'same' : 'diff at ' + [...a].findIndex((c, k) => c !== b[k]) + ' of ' + a.length;
    } catch (e) { R.round = 'ERR ' + String(e).slice(0, 150); }
    try {
      switchSheet(1); render(); const n0 = S.nodes.length, m0 = S.nodes.reduce((k, n) => k + (n.m || []).length, 0);
      const d0 = dls.length; exportCSV(); const csv = (dls[d0] || {}).txt;
      if (csv) { const inp = document.createElement('input'); inp.type = 'file'; const dt = new DataTransfer(); dt.items.add(new File([csv], 'x.csv', { type: 'text/csv' })); inp.files = dt.files; importCSV(inp); await w(400);
        R.csv = { before: [n0, m0], after: [S.nodes.length, S.nodes.reduce((k, n) => k + (n.m || []).length, 0)], len: csv.length }; } else R.csv = 'no csv';
    } catch (e) { R.csv = 'ERR ' + String(e).slice(0, 150); }
    // S6 undo / redo
    try {
      switchSheet(0); render(); await w(500); _hCheckpoint(true); const start = JSON.stringify(_cleanSheets()), steps = [];
      for (let k = 0; k < 25; k++) {
        const pick = S.nodes[(k * 37) % S.nodes.length]; const op = k % 4;
        if (op === 0) { pick.x += 40; render(); }
        else if (op === 1) { addChild(pick.id); saveModal(); }
        else if (op === 2) { tvMove(pick.id, 1); }
        else { OPT.colGap = (OPT.colGap || 40) + 2; autoLayout(); }
        await w(30); _hCheckpoint(true); steps.push(op);
      }
      const end = JSON.stringify(_cleanSheets()); let u = 0; while (_hUndo.length && u < 60) { undoEdit(); await w(5); u++; }
      R.undo = { steps: steps.length, undos: u, back: JSON.stringify(_cleanSheets()) === start };
      let rd = 0; while (_hRedo.length && rd < 60) { redoEdit(); await w(5); rd++; } R.undo.redos = rd; R.undo.fwd = JSON.stringify(_cleanSheets()) === end;
    } catch (e) { R.undo = 'ERR ' + String(e && e.stack || e).slice(0, 200); }
    R.xss2 = window.__xss; R.markup2 = markup();
    return R; }, XDOC);
  out.info = r;
  r.sheets.forEach(s => {
    const tag = 'sheet ' + s.i + ' ' + String(s.name).slice(0, 20);
    if (s.err) fail('S1 ' + tag + ' error ' + s.err);
    if (s.dom !== s.n) fail('S4 ' + tag + ' cards ' + s.n + ' DOM ' + s.dom);
    if (s.tree && s.lint && (s.lint.overlap || s.lint.broken)) fail('S2 ' + tag + ' overlap ' + s.lint.overlap + ' broken ' + s.lint.broken);
    if (s.lintBig && (s.lintBig.overlap || s.lintBig.broken)) fail('S2 ' + tag + ' after +6 font ' + JSON.stringify(s.lintBig));
    if (s.lintFold) fail('S2 ' + tag + ' overlap after folding ' + s.lintFold);
    if (s.panelBad) fail('S4 ' + tag + ' NaN/undefined in the stats panel');
    if (s.rows != null && s.rows !== s.n) fail('S1 ' + tag + ' list rows ' + s.rows + ' of ' + s.n);
    if (s.pngErr) fail('S1 ' + tag + ' PNG ' + s.pngErr);
    if (s.n && s.png === null && s.i < 6) fail('S1 ' + tag + ' PNG made no canvas');
    if (s.png && (s.png[0] > 32767 || s.png[1] > 32767 || s.png[0] * s.png[1] > 268435456)) fail('S1 ' + tag + ' PNG canvas ' + s.png.join('x') + ' is past the browser canvas limit (32767 px a side, 268M px), so the file comes out blank');
    (s.print || []).forEach(p => { if (typeof p[1] !== 'number' || !isFinite(p[2]) || !isFinite(p[3])) fail('S4 ' + tag + ' print ' + JSON.stringify(p)); });
  });
  if (r.xss !== undefined || r.xss2 !== undefined || r.markup || r.markup2) fail('S3 data ran as markup ' + JSON.stringify([r.xss, r.xss2, r.markup, r.markup2]));
  if (r.srchErr) fail('S1 search ' + r.srchErr);
  if (r.round !== 'same') fail('S5 save/load round trip ' + r.round);
  if (typeof r.csv !== 'object' || r.csv.before[0] !== r.csv.after[0] || r.csv.before[1] !== r.csv.after[1]) fail('S5 CSV round trip ' + JSON.stringify(r.csv));
  if (typeof r.undo !== 'object' || !r.undo.back || !r.undo.fwd) fail('S6 undo/redo ' + JSON.stringify(r.undo));
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}