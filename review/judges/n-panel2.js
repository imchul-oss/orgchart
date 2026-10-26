async page => {
  const AFTER = __OWNER20__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 40) out.fails.push(m); };
  const J = JSON.stringify;
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const r = await page.evaluate(async A => { const w = ms => new Promise(res => setTimeout(res, ms));
    try{localStorage.clear();}catch(e){} window.alert = () => {}; window.confirm = () => true;
    loadObject(JSON.parse(JSON.stringify(A)), false); if (CUR_SHEET !== 0) switchSheet(0); ADMIN = true; applyRO(); render();
    { const n0 = S.nodes.find(n => (n.m || []).length > 2); n0.m[1].f = '임시직무값'; n0.m[1].r = '임시직책값'; n0.m[1].a = '임시분야값'; render(); }  // r2: an off-category row brings the + button (UIUX ORGV r1 A8)
    const fl = document.getElementById('statsfl'); fl.classList.remove('collapsed'); const body = fl.querySelector('.sfl-body') || fl;
    const tabs = [...fl.querySelectorAll('.sfl-tab')]; const R = { tabs: tabs.map(t => t.textContent.trim()), a8: {}, pad: [] };
    tabs.forEach(t => { const rg = document.createRange(); rg.selectNodeContents(t); const tw = rg.getBoundingClientRect().width; R.pad.push([t.textContent.trim(), +((t.clientWidth - tw) / 2).toFixed(1)]); });
    for (const k of ['job', 'role', 'area']) {
      const tb = tabs.find(t => (t.getAttribute('onclick') || '').indexOf("'" + k + "'") >= 0); switchStatTab(tb, k); await w(30);
      const rows = [...fl.querySelectorAll('.sfl-row')].filter(e => e.querySelector('.sfl-num') && !e.closest('.sfl-foot'));
      const x = { short: 0, bad: [], rights: [], hs: [], hp: [] };
      rows.forEach(e => { const n = e.querySelector('.sfl-num'), g = e.querySelector('.sfl-gap'), m = /^(\d+)\/(\d+)/.exec(n.textContent.trim());
        x.rights.push(Math.round(n.getBoundingClientRect().right));
        if (e.classList.contains('sfl-short')) { x.short++; x.hs.push(Math.round(e.getBoundingClientRect().height));
          if (!g || !m || g.textContent.trim() !== '-' + (m[2] - m[1])) x.bad.push('gap ' + (g ? g.textContent : '-') + ' for ' + n.textContent);
          else { const gb = g.getBoundingClientRect(), nb = n.getBoundingClientRect(); if (Math.abs(gb.top + gb.height / 2 - (nb.top + nb.height / 2)) > 3 || gb.right > nb.left + 0.5) x.bad.push('gap placement ' + n.textContent); }
        } else { x.hp.push(Math.round(e.getBoundingClientRect().height)); if (g) x.bad.push('gap on plain row ' + n.textContent); } });
      { const tn = fl.querySelector('.sfl-foot .sfl-total-num'); if (tn) x.rights.push(Math.round(tn.getBoundingClientRect().right)); x.plus = fl.querySelectorAll('.sfl-ex-in').length; }
      R.a8[k] = x;
    }
    const td = _statTableData ? _statTableData() : null; R.tableMinus = td ? JSON.stringify(td.items || td).match(/"cnt":"-|"cnt":"[^"]*-\d/g) : null;
    // 조회
    const qt = tabs.find(t => (t.getAttribute('onclick') || '').indexOf("'query'") >= 0); R.qIdx = tabs.indexOf(qt);
    switchStatTab(qt, 'query'); _qConds = [{ k: 'st', v: 'active' }]; updateStatsPanel(); await w(30);
    const q = {}; let list = fl.querySelector('.sfl-qlist'), tog = list && list.querySelector('button[aria-expanded]');
    q.rowsFolded = list ? list.querySelectorAll('.sfl-row').length : -1; q.tog = tog ? { exp: tog.getAttribute('aria-expanded'), t: tog.textContent.trim() } : null;
    const tot = fl.querySelector('.sfl-foot .sfl-total-num'); q.hitTxt = tot ? tot.textContent.trim() : '';
    if (tog) { tog.click(); await w(30); list = fl.querySelector('.sfl-qlist'); tog = list.querySelector('button[aria-expanded]'); q.rowsOpen = list.querySelectorAll('.sfl-row').length; q.expOpen = tog && tog.getAttribute('aria-expanded'); }
    q.hits = (() => { const m = q.tog && /([0-9]+)\s*명/.exec(q.tog.t); return m ? +m[1] : null; })();
    // split by 직무 with an empty-job member: 미입력 label contrast
    const nd = S.nodes.find(n => (n.m || []).length > 2); nd.m[0].f = ''; render();
    const by = document.getElementById('sfl-q-by'); if (by) { by.value = 'f'; by.dispatchEvent(new Event('change', { bubbles: true })); } await w(30);
    const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
    const rgb = x => { const n = (String(x).match(/[0-9.]+/g) || []).map(Number); return [n[0], n[1], n[2], n.length > 3 ? n[3] : 1]; };
    const lbl = [...fl.querySelectorAll('.sfl-row .sfl-lbl')].find(e => !e.closest('.sfl-qlist') && e.textContent.trim() === '미입력');
    if (lbl) { let op = 1; for (let e = lbl; e && e !== fl; e = e.parentElement) op *= +getComputedStyle(e).opacity; const bg = rgb(getComputedStyle(fl).backgroundColor), fg = rgb(getComputedStyle(lbl).color); const a = fg[3] * op;
      const mix = [0, 1, 2].map(i => fg[i] * a + bg[i] * (1 - a)); const x = lum(mix), y = lum(bg.slice(0, 3)); q.noneCr = +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2); } else q.noneCr = null;
    R.q = q; return R; }, AFTER);
  out.info = r;
  if (r.qIdx !== 6) fail('A9 조회 not the 7th tab ' + J(r.tabs));
  r.pad.forEach(([t, p]) => { if (!(p >= 3)) fail('N3 tab padding ' + t + ' ' + p); });
  let shorts = 0;
  Object.entries(r.a8).forEach(([k, x]) => { shorts += x.short; if (x.bad.length) fail('A8 ' + k + ' ' + J(x.bad.slice(0, 4)));
    const rr = x.rights; if (rr.length && Math.max(...rr) - Math.min(...rr) > 1) fail('A8 ' + k + ' number right edges ' + J([Math.min(...rr), Math.max(...rr)]));
    if (x.hs.length && x.hp.length && Math.max(...x.hs) > Math.min(...x.hp) + 1) fail('A8 ' + k + ' short row taller ' + J([x.hs, x.hp])); });
  if (!shorts) fail('A8 judge setup: no short rows');
  if (r.tableMinus) fail('A8 table items carry minus ' + J(r.tableMinus));
  const q = r.q;
  if (q.rowsFolded !== 0 || !q.tog || q.tog.exp !== 'false' || !q.hits) fail('A9 folded ' + J(q));
  if (q.rowsOpen !== q.hits || q.expOpen !== 'true') fail('A9 open ' + J(q));
  if (!(q.noneCr >= 4.5)) fail('A7 query split 미입력 ' + q.noneCr);
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}