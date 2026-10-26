async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  async function load(url) {
    await page.goto(url); await page.waitForTimeout(500);
    await page.evaluate(d => { try { localStorage.clear(); } catch (e) {} _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(_hasPositions(S.nodes)); }, DOC);
    await page.waitForTimeout(200);
  }
  const SNAP = () => ({ pos: S.nodes.map(n => n.id + ':' + n.x + ',' + n.y).sort(),
    paths: Array.prototype.map.call(document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash'), p => p.getAttribute('class') + '|' + p.getAttribute('d').replace(/\s+/g, ' ').trim()).sort() });
  // R
  const sheets = await (async () => { await load('__REF__'); return await page.evaluate(() => SHEETS.length); })();
  const ref = {};
  for (let s = 0; s < sheets; s++) for (const w of [0, 4]) ref[s + '/' + w] = await page.evaluate(([s, w, sn]) => { switchSheet(s); OPT.wrapN = w; autoLayout(); render(); return eval('(' + sn + ')')(); }, [s, w, SNAP.toString()]);
  await load('__PAGE__');
  for (let s = 0; s < sheets; s++) for (const w of [0, 4]) {
    const c = await page.evaluate(([s, w, sn]) => { switchSheet(s); OPT.wrapN = w; autoLayout(); render(); return eval('(' + sn + ')')(); }, [s, w, SNAP.toString()]);
    if (JSON.stringify(c.pos) !== JSON.stringify(ref[s + '/' + w].pos)) fail('R: positions differ sheet ' + s + ' wrapN ' + w);
    if (JSON.stringify(c.paths) !== JSON.stringify(ref[s + '/' + w].paths)) fail('R: paths differ sheet ' + s + ' wrapN ' + w);
  }
  // P
  await load('__PAGE__');
  const p = await page.evaluate(sn => {
    switchSheet(0); OPT.wrapN = 0;
    ['t_06', 't_07'].forEach(id => { S.nodes.find(n => n.id === id).aside = true; });
    const pp = S.nodes.find(n => n.id === 'prodhq'); pp.ac = 2;
    autoLayout(); render();
    const snap = eval('(' + sn + ')');
    const before = snap();
    const hadWork = S.nodes.some(n => Object.keys(n).some(k => k[0] === '_'));
    const txt = JSON.stringify(_fileData());
    _saveLocalFallback();
    let ls = ''; try { ls = localStorage.getItem(SB_LS_KEY) || ''; } catch (e) {}
    const keysIn = d => { const bad = new Set(); (d.sheets || []).forEach(sh => (sh.nodes || []).forEach(n => Object.keys(n).forEach(k => { if (k[0] === '_') bad.add(k); }))); return [...bad]; };
    const fd = JSON.parse(txt), lsd = ls ? JSON.parse(ls) : { sheets: [] };
    render(); const after = snap();
    return { hadWork, fileKeys: keysIn(fd), lsKeys: keysIn(lsd), lsEmpty: !ls, same: JSON.stringify(before) === JSON.stringify(after), saved: fd, before };
  }, SNAP.toString());
  if (!p.hadWork) fail('P: sanity - no working fields in memory after autoLayout (judge cannot see the case)');
  if (p.fileKeys.length) fail('P: saved file carries node keys ' + p.fileKeys.join(','));
  if (p.lsEmpty) fail('P: localStorage fallback not written');
  if (p.lsKeys.length) fail('P: localStorage fallback carries node keys ' + p.lsKeys.join(','));
  if (!p.same) fail('P: drawing changed after saving');
  await page.goto('__PAGE__'); await page.waitForTimeout(500);
  const rt = await page.evaluate(([d, sn]) => { try { localStorage.clear(); } catch (e) {} _adoptData(d, false); _finishLoad(_hasPositions(S.nodes)); switchSheet(0); OPT.wrapN = 0; autoLayout(); render(); return eval('(' + sn + ')')(); }, [p.saved, SNAP.toString()]);
  if (JSON.stringify(rt.pos) !== JSON.stringify(p.before.pos)) fail('P: reloading the saved data and autoLayout gives other positions');
  if (JSON.stringify(rt.paths) !== JSON.stringify(p.before.paths)) fail('P: reloading the saved data and autoLayout gives other paths');
  // L
  const lbl = await page.evaluate(() => { const s = openEdit.toString(); const i = s.indexOf('색상띠'); return i < 0 ? null : s.slice(i, i + 10); });
  if (!lbl || !lbl.startsWith('색상띠 <small')) fail('L: colour band label is ' + JSON.stringify(lbl));
  // T
  for (const mode of ['emoji', 'narrow']) {
    await load('__PAGE__');
    const t = await page.evaluate(mode => {
      switchSheet(0); OPT.wrapN = 0;
      const E = '\u{1F600}';
      let k = 0;
      S.nodes.forEach(n => { (n.m || []).forEach(m => { const pre = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, k % 26); m.n = pre + E.repeat(30); m.f = E.repeat(40) + pre; k++; }); n.en = 'X'.repeat(k % 7) + E.repeat(40); n.ko = E.repeat(40); });
      if (mode === 'narrow') document.documentElement.style.setProperty('--band-w', (NW - 8) + 'px');
      autoLayout(); render();
      const got = []; const orig = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (s, x, y) { got.push(String(s)); return orig.apply(this, arguments); };
      const tb = HTMLCanvasElement.prototype.toBlob; HTMLCanvasElement.prototype.toBlob = function () {};
      try { exportPNG(); } finally { CanvasRenderingContext2D.prototype.fillText = orig; HTMLCanvasElement.prototype.toBlob = tb; }
      const lone = got.filter(s => /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(s));
      const empty = got.filter(s => s === '' || s === '…');
      const cut = got.filter(s => s.endsWith('…') && s.length > 1);
      return { n: got.length, lone: lone.length, empty: empty.length, cut: cut.length };
    }, mode);
    out.info['T_' + mode] = t;
    if (mode === 'emoji' && !t.n) fail('T: no text drawn in mode ' + mode); // narrow: nothing fits, so drawing nothing is the required result (amended after g1, see VERDICT)
    if (mode === 'emoji' && !t.cut) fail('T: sanity - nothing was cut in mode emoji');
    if (t.lone) fail('T: ' + t.lone + ' strings with a lone surrogate in mode ' + mode);
    if (t.empty) fail('T: ' + t.empty + ' empty or ellipsis-only strings in mode ' + mode);
  }
  // C
  for (const how of ['badfile', 'readerror']) {
    await load('__PAGE__');
    const c = await page.evaluate(async how => {
      const orig = FileReader.prototype.readAsText;
      if (how === 'readerror') FileReader.prototype.readAsText = function () { setTimeout(() => { if (this.onerror) this.onerror(new ProgressEvent('error')); }, 0); };
      try { cmpLoad(new File(['this is not chart data'], 'x.json')); await new Promise(r => setTimeout(r, 300)); } finally { FileReader.prototype.readAsText = orig; }
      const st = () => { const pnl = document.getElementById('cmp-panel'); return { shown: !!(pnl && pnl.isConnected && getComputedStyle(pnl).display !== 'none' && pnl.getBoundingClientRect().height > 0 && pnl.textContent.trim()), exit: !!(pnl && pnl.querySelector('#cmp-exit')), text: pnl ? pnl.textContent.length : 0 }; };
      const a = st(); render(); await new Promise(r => setTimeout(r, 50)); const b = st();
      const btn = document.querySelector('#cmp-panel #cmp-exit'); if (btn) btn.click(); await new Promise(r => setTimeout(r, 50));
      const c1 = st(); render(); const d = st();
      return { a, b, c1, d };
    }, how);
    if (!c.a.shown || !c.a.exit) fail('C: ' + how + ' - message panel with exit button not shown ' + JSON.stringify(c.a));
    if (!c.b.shown || !c.b.exit) fail('C: ' + how + ' - message panel gone after render() ' + JSON.stringify(c.b));
    if (c.c1.shown || c.d.shown) fail('C: ' + how + ' - panel still shown after the exit button ' + JSON.stringify([c.c1, c.d]));
  }
  // F
  await load('__PAGE__');
  const f = await page.evaluate(() => {
    switchSheet(0); OPT.wrapN = 0; autoLayout(); render(); doZoomAbs(250);
    const w = document.getElementById('wrap');
    const cands = S.nodes.filter(n => Math.abs(nh(n) - NW) > 10);
    const res = [];
    cands.forEach(nd => { cmpFocus(nd.id); const want = (nd.y + nh(nd) / 2) * S.scale - w.clientHeight / 2;
      if (want > 0 && want < w.scrollHeight - w.clientHeight) res.push(Math.abs(w.scrollTop - want)); });
    return { n: cands.length, res };
  });
  if (f.res.length < 3) fail('F: sanity - fewer than 3 cards to test (' + f.n + ' candidates, ' + f.res.length + ' unclamped)');
  f.res.forEach(d => { if (d > 2) fail('F: cmpFocus off the card centre by ' + Math.round(d) + 'px'); });
  if (out.errors.length) fail('E: page errors ' + out.errors.slice(0, 2).join(' | '));
  out.RESULT = out.fails.length ? 'RED' : 'GREEN';
  return JSON.stringify(out);
}