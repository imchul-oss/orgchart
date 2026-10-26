async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  async function load(url) {
    await page.goto(url); await page.waitForTimeout(500);
    await page.evaluate(d => { try { localStorage.clear(); } catch (e) {} _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(_hasPositions(S.nodes)); }, DOC);
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
  // helpers in page
  const HELP = () => {
    window.__exp = q => { q = q.trim().toLowerCase(); const has = v => String(v || '').toLowerCase().includes(q);
      return S.nodes.filter(n => has(n.en) || has(n.ko) || (n.m || []).some(m => has(m.n) || has(m.f) || has(m.r))).sort((a, b) => (a.y - b.y) || (a.x - b.x)).map(n => n.id); };
    window.__state = () => ({ hit: [...document.querySelectorAll('.srch-hit')].map(e => e.id.slice(1)).sort(), cur: [...document.querySelectorAll('.srch-cur')].map(e => e.id.slice(1)),
      rows: document.querySelectorAll('.srch-row').length, any: document.querySelectorAll('[class*="srch-"]').length - document.querySelectorAll('#srch-btn,#srch-input,#srch-count,#srch-box,[id^="srch"]').length,
      count: (document.getElementById('srch-count') || {}).textContent || '', open: (() => { const i = document.getElementById('srch-input'); return !!i && getComputedStyle(i).display !== 'none' && i.getBoundingClientRect().width > 0; })(),
      focused: document.activeElement && document.activeElement.id === 'srch-input' });
    window.__centred = id => { const n = S.nodes.find(x => x.id === id); const w = document.getElementById('wrap');
      const wantL = (n.x + NW / 2) * S.scale - w.clientWidth / 2, wantT = (n.y + nh(n) / 2) * S.scale - w.clientHeight / 2;
      const okL = Math.abs(w.scrollLeft - wantL) <= 3 || (wantL < 0 && w.scrollLeft === 0) || (wantL > w.scrollWidth - w.clientWidth && Math.abs(w.scrollLeft - (w.scrollWidth - w.clientWidth)) <= 3);
      const okT = Math.abs(w.scrollTop - wantT) <= 3 || (wantT < 0 && w.scrollTop === 0) || (wantT > w.scrollHeight - w.clientHeight && Math.abs(w.scrollTop - (w.scrollHeight - w.clientHeight)) <= 3);
      return okL && okT; };
    window.__rowsExp = q => { q = q.trim().toLowerCase(); let k = 0; S.nodes.forEach(n => (n.m || []).forEach(m => { if ([m.n, m.f, m.r].some(v => String(v || '').toLowerCase().includes(q))) k++; })); return k; };
  };
  await load('__PAGE__'); await page.evaluate(HELP);
  await page.evaluate(() => { switchSheet(0); doZoomAbs(150); });
  const ex = await page.evaluate(() => !!document.querySelector('#topbar #srch-btn'));
  if (!ex) { fail('O: no #srch-btn in #topbar'); }
  else {
    await page.click('#srch-btn'); await page.waitForTimeout(100);
    let st = await page.evaluate(() => __state());
    if (!st.open || !st.focused) fail('O: button did not open and focus the search box ' + JSON.stringify(st));
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);
    st = await page.evaluate(() => __state());
    if (st.open) fail('K: Escape did not close the box');
    await page.mouse.click(800, 600); await page.keyboard.press('Control+f'); await page.waitForTimeout(100);
    st = await page.evaluate(() => __state());
    if (!st.open || !st.focused) fail('O: Ctrl+F did not open and focus the search box');
    // queries chosen from the data at run time: a member name (one card), a frequent word (several cards), a card title
    const qs = await page.evaluate(() => { const cnt = {}; S.nodes.forEach(n => (n.m || []).forEach(m => { const v = String(m.r || '').trim(); if (v) cnt[v] = (cnt[v] || 0) + 1; }));
      const multi = Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(e => e[0]).find(v => __exp(v).length >= 3);
      const nm = S.nodes.flatMap(n => (n.m || []).map(m => String(m.n || '').trim())).find(v => v.length >= 2 && __exp(v).length === 1);
      const title = (S.nodes.find(n => n.ko && __exp(n.ko).length >= 1) || {}).ko; return { multi, nm, title }; });
    out.info.q = { multi: !!qs.multi, nm: !!qs.nm, title: !!qs.title };
    for (const [label, q] of [['member', qs.nm], ['frequent', qs.multi], ['title', qs.title], ['upper', qs.title && ('  ' + qs.title.toUpperCase() + ' ')]]) {
      if (!q) { fail('M: sanity - no ' + label + ' query in the data'); continue; }
      const before = await page.evaluate(() => JSON.stringify(_fileData().sheets));
      await page.fill('#srch-input', q); await page.waitForTimeout(200);
      const r = await page.evaluate(q => { const e = __exp(q); const st = __state(); return { e, st, rows: __rowsExp(q), cen: st.cur.length === 1 ? __centred(st.cur[0]) : false }; }, q);
      const tag = label;
      if (JSON.stringify(r.st.hit) !== JSON.stringify(r.e.slice().sort())) fail('M: ' + tag + ' marked ' + r.st.hit.length + ' cards, expected ' + r.e.length);
      if (r.st.cur.length !== 1 || r.st.cur[0] !== r.e[0]) fail('M: ' + tag + ' current card is not the first match in reading order');
      if (r.st.count.replace(/\s/g, '').indexOf('1/' + r.e.length) < 0) fail('M: ' + tag + ' count reads ' + JSON.stringify(r.st.count) + ', expected 1/' + r.e.length);
      if (label !== 'title' && label !== 'upper' && r.st.rows !== r.rows) fail('M: ' + tag + ' marked ' + r.st.rows + ' member rows, expected ' + r.rows);
      if (!r.cen) fail('M: ' + tag + ' current card not centred');
      if (label === 'frequent') {
        const seq = [];
        for (let i = 0; i < r.e.length + 1; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(80); seq.push(await page.evaluate(() => { const c = __state().cur[0]; return { c, cen: __centred(c), count: __state().count }; })); }
        const want = r.e.slice(1).concat(r.e.slice(0, 2));
        seq.forEach((s, i) => { if (s.c !== want[i]) fail('N: Enter step ' + (i + 1) + ' went to the wrong card'); if (!s.cen) fail('N: Enter step ' + (i + 1) + ' not centred'); });
        if (seq.length && seq[0].count.replace(/\s/g, '').indexOf('2/' + r.e.length) < 0) fail('N: count after one Enter reads ' + JSON.stringify(seq[0].count));
        await page.keyboard.press('Shift+Enter'); await page.waitForTimeout(80);
        const back = await page.evaluate(() => __state().cur[0]);
        if (back !== r.e[0]) fail('N: Shift+Enter did not go back');
        await page.keyboard.press('Shift+Enter'); await page.waitForTimeout(80);
        const wrapBack = await page.evaluate(() => __state().cur[0]);
        if (wrapBack !== r.e[r.e.length - 1]) fail('N: Shift+Enter from the first did not wrap to the last');
        const kept = await page.evaluate(() => { const a = JSON.stringify(__state()); render(); const b = __state(); return { same: a === JSON.stringify(b), b }; });
        if (!kept.same) fail('K: render() changed the marks ' + JSON.stringify(kept.b).slice(0, 120));
      }
      const after = await page.evaluate(() => JSON.stringify(_fileData().sheets));
      if (before !== after) fail('D: searching changed the data (' + tag + ')');
    }
    await page.fill('#srch-input', 'zzqq-no-such-text-zzqq'); await page.waitForTimeout(150);
    let st2 = await page.evaluate(() => __state());
    if (st2.hit.length || st2.cur.length || st2.rows) fail('M: no-match query still marks cards');
    if (!/0/.test(st2.count)) fail('M: no-match count reads ' + JSON.stringify(st2.count));
    await page.fill('#srch-input', qs.multi || 'x'); await page.waitForTimeout(150);
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);
    st2 = await page.evaluate(() => __state());
    if (st2.open || st2.hit.length || st2.cur.length || st2.rows) fail('K: Escape left the box open or marks behind ' + JSON.stringify(st2));
    // read-only viewer: works without admin
    const ro = await page.evaluate(() => document.body.classList.contains('ro'));
    out.info.readOnly = ro;
  }
  // G (added after the g2 acceptance REJECT D1): Ctrl+F while a dialog is open must not open the search box, even when
  // the focus has fallen to the page body after a click on the dialog's title; and Ctrl+F elsewhere is preventDefault-ed
  await load('__PAGE__'); await page.evaluate(HELP);
  const pd = await page.evaluate(() => { document.body.focus(); const ev = new KeyboardEvent('keydown', { key: 'f', code: 'KeyF', ctrlKey: true, bubbles: true, cancelable: true }); document.body.dispatchEvent(ev); const r = ev.defaultPrevented; if (typeof srchClose === 'function') srchClose(); else { const i = document.getElementById('srch-input'); if (i) i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); } return r; });
  if (!pd) fail('G: Ctrl+F on the page is not preventDefault-ed');
  await page.evaluate(() => { ADMIN = true; applyRO(); const n = S.nodes.find(x => x.type !== 'top'); openEdit(n.id); });
  await page.waitForTimeout(200);
  const tb = await page.evaluate(() => { const r = document.getElementById('mtitle').getBoundingClientRect(); return { x: r.left + 5, y: r.top + r.height / 2 }; });
  await page.mouse.click(tb.x, tb.y); await page.keyboard.press('Control+f'); await page.waitForTimeout(150);
  const g = await page.evaluate(() => __state());
  if (g.open || g.focused) fail('G: Ctrl+F with the edit dialog open opened the search box ' + JSON.stringify({ open: g.open, focused: g.focused }));
  await page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });
  if (out.errors.length) fail('E: page errors ' + out.errors.slice(0, 2).join(' | '));
  out.RESULT = out.fails.length ? 'RED' : 'GREEN';
  return JSON.stringify(out);
}