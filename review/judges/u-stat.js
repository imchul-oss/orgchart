async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  page.on('dialog', d => d.dismiss().catch(() => {}));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  const LOAD = d => { try { localStorage.clear(); } catch (e) {} _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(true); switchSheet(0); if (CUR_SHEET !== 0) { _loadSheet(0); } autoLayout(); ADMIN = true; applyRO(); render(); const fl = document.getElementById('statsfl'); if (fl) fl.classList.remove('collapsed'); updateSt(); };
  const BODIES = () => { const r = {}; ['summary', 'job', 'role', 'area'].forEach(t => { _statTab = t; updateStatsPanel(); r[t] = (c => { c.querySelectorAll('.sfl-foot').forEach(f => f.replaceWith(...f.childNodes)); c.querySelectorAll('input[data-inc]').forEach(i => i.removeAttribute('aria-label')); c.querySelectorAll('.sfl-row').forEach(r => { const n = r.querySelector(':scope > .sfl-num'), b = r.querySelector(':scope > .sfl-inc'); if (n && b && (b.compareDocumentPosition(n) & 4)) { const ws = n.previousSibling; b.before(n); if (ws && ws.nodeType === 3) n.after(ws); } }); return c.innerHTML; })(document.getElementById('statsfl-body').cloneNode(true)); }); return r; };
  await page.goto('__REF__'); await page.waitForTimeout(400);
  const refB = await page.evaluate(([d, LOADs, BODs]) => { (0, eval)('(' + LOADs + ')')(d); return (0, eval)('(' + BODs + ')')(); }, [DOC, LOAD.toString(), BODIES.toString()]);
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  await page.evaluate(([d, LOADs]) => { (0, eval)('(' + LOADs + ')')(d); }, [DOC, LOAD.toString()]);
  // S1
  const tabs = await page.evaluate(() => [...document.querySelectorAll('#statsfl-tabs .sfl-tab')].map(b => b.textContent.trim()));
  out.info.tabs = tabs;
  if (JSON.stringify(tabs) !== JSON.stringify(['현황', '직무', '직책', '분야', '시트', '팀', '조회'])) fail('S1: tabs ' + JSON.stringify(tabs));
  const clickTab = async name => page.evaluate(n => { const b = [...document.querySelectorAll('#statsfl-tabs .sfl-tab')].find(x => x.textContent.trim() === n); if (b) b.click(); return !!b; }, name);
  const num = s => { const m = String(s || '').replace(/,/g, '').match(/-?\d+/); return m ? +m[0] : null; };
  // expected values computed here from SHEETS
  const EXP = () => { const defKey = OPT.statusItems[0]?.key || 'active'; const ex = new Set(OPT.statsGroups.filter(g => g.excludeTotal).flatMap(g => g.statuses));
    const ok = m => m.cc !== true && !ex.has(m.s || defKey); const okc = m => m.cc === true && !ex.has(m.s || defKey);
    const nodesOf = i => i === CUR_SHEET ? S.nodes : (SHEETS[i].nodes || []);
    const sheets = SHEETS.map((s, i) => ({ name: s.name, n: nodesOf(i).flatMap(n => n.m || []).filter(ok).length }));
    const names = SHEETS.map((s, i) => nodesOf(i).flatMap(n => n.m || []).filter(ok).map(m => m.n));
    const all = names.flat(); const uniq = new Set(all).size;
    const rows = tvOrder().filter(r => r.kind === 'row').map(r => { const n = S.nodes.find(x => x.id === r.id); return { id: r.id, depth: r.depth, own: (n.m || []).filter(ok).length, cc: (n.m || []).filter(okc).length }; });
    // subtree via the flat order: only consecutive deeper rows (heads reset)
    const list = tvOrder(); const sub = {}; list.forEach((r, i) => { if (r.kind !== 'row') return; let s = 0, k = i + 1, has = false; const own = rows.find(x => x.id === r.id).own; while (k < list.length && list[k].kind === 'row' && list[k].depth > r.depth) { s += rows.find(x => x.id === list[k].id).own; has = true; k++; } sub[r.id] = has ? own + s : null; });
    const nmap = {}; S.nodes.forEach(n => { nmap[n.id] = n.en || n.ko || ''; });
    return { names: nmap, sheets, uniq, dup: all.length - uniq, rows: rows.map(r => Object.assign(r, { sub: sub[r.id] })), cur: CUR_SHEET, curN: sheets[CUR_SHEET].n }; };
  const READ_SHEET = () => ({ rows: [...document.querySelectorAll('#statsfl-body .sfl-row[data-sheet]')].map(r => ({ i: r.getAttribute('data-sheet'), lbl: (r.querySelector('.sfl-lbl') || {}).textContent, num: (r.querySelector('.sfl-num') || {}).textContent, cur: r.classList.contains('cur') })),
    total: (document.querySelector('#statsfl-body .sfl-total .sfl-total-num') || document.querySelector('#statsfl-body .sfl-total') || {}).textContent, dup: (document.querySelector('#statsfl-body .sfl-dup') || {}).textContent || null,
    filter: getComputedStyle(document.getElementById('statsfl-filter')).display });
  const READ_TEAM = () => ({ rows: [...document.querySelectorAll('#statsfl-body .sfl-row[data-id]')].map(r => ({ id: r.getAttribute('data-id'), depth: r.getAttribute('data-depth'), num: (r.querySelector('.sfl-num') || {}).textContent, sub: r.querySelector('.sfl-sub') ? r.querySelector('.sfl-sub').textContent : null, cc: r.querySelector('.sfl-cc') ? r.querySelector('.sfl-cc').textContent : null,
      pad: (() => { const l = r.querySelector('.sfl-lbl') || r; return l.getBoundingClientRect().left + (parseFloat(getComputedStyle(l).paddingLeft) || 0); })(), lbl: ((r.querySelector('.sfl-lbl') || {}).textContent || '').trim() })),
    total: (document.querySelector('#statsfl-body .sfl-total .sfl-total-num') || document.querySelector('#statsfl-body .sfl-total') || {}).textContent,
    filter: getComputedStyle(document.getElementById('statsfl-filter')).display });
  function checkSheet(tag, e, g) {
    if (g.rows.length !== e.sheets.length) { fail(tag + ': ' + g.rows.length + ' sheet rows, want ' + e.sheets.length); return; }
    e.sheets.forEach((s, i) => { const r = g.rows[i]; if (r.i !== String(i)) fail(tag + ': row ' + i + ' data-sheet ' + r.i); if ((r.lbl || '').trim() !== s.name) fail(tag + ': row ' + i + ' label ' + r.lbl); if (num(r.num) !== s.n) fail(tag + ': ' + s.name + ' shows ' + r.num + ', want ' + s.n); if (r.cur !== (i === e.cur)) fail(tag + ': cur mark on row ' + i + ' = ' + r.cur); });
    if (num(g.total) !== e.uniq + e.dup) fail(tag + ': total ' + g.total + ', want ' + (e.uniq + e.dup));  // tally (10-20): totals count entries; the name repeat is only a hint
    if (e.dup > 0 && num(g.dup) !== e.dup) fail(tag + ': .sfl-dup ' + JSON.stringify(g.dup) + ', want ' + e.dup);
    if (e.dup === 0 && g.dup) fail(tag + ': .sfl-dup shown without repeats');
    if (g.filter !== 'none') fail(tag + ': filter visible on 시트 tab'); }
  function checkTeam(tag, e, g) { const S_NAMES = e.names;
    if (g.rows.length !== e.rows.length) { fail(tag + ': ' + g.rows.length + ' team rows, want ' + e.rows.length); return; }
    e.rows.forEach((x, i) => { const r = g.rows[i];
      if (r.id !== x.id) { fail(tag + ': row ' + i + ' is ' + r.id + ', want ' + x.id); return; }
      { const nn = S_NAMES[x.id]; if (r.lbl !== nn) fail(tag + ': ' + x.id + ' label ' + JSON.stringify(r.lbl) + ', want ' + JSON.stringify(nn)); }
      if (r.depth !== String(x.depth)) fail(tag + ': ' + x.id + ' depth ' + r.depth + ', want ' + x.depth);
      if (num(r.num) !== x.own) fail(tag + ': ' + x.id + ' own ' + r.num + ', want ' + x.own);
      if (x.sub === null && r.sub !== null) fail(tag + ': ' + x.id + ' has .sfl-sub without children');
      if (x.sub !== null && num(r.sub) !== x.sub) fail(tag + ': ' + x.id + ' subtotal ' + r.sub + ', want ' + x.sub);
      if (x.cc === 0 && r.cc !== null) fail(tag + ': ' + x.id + ' .sfl-cc without cc');
      if (x.cc > 0 && num(r.cc) !== x.cc) fail(tag + ': ' + x.id + ' cc ' + r.cc + ', want ' + x.cc);
      if (i > 0 && x.depth > e.rows[i - 1].depth && !(r.pad > g.rows[i - 1].pad)) fail(tag + ': ' + x.id + ' not indented under ' + e.rows[i - 1].id); });
    if (num(g.total) !== e.curN) fail(tag + ': total ' + g.total + ', want ' + e.curN);
    if (g.filter !== 'none') fail(tag + ': filter visible on 팀 tab'); }
  // S2
  if (!(await clickTab('시트'))) fail('S2: no 시트 tab'); else {
    const e = await page.evaluate('(' + EXP.toString() + ')()'); const g = await page.evaluate('(' + READ_SHEET.toString() + ')()');
    out.info.sheet = { e: e.sheets, uniq: e.uniq, dup: e.dup, g: g.rows.map(r => r.num), total: g.total, dupTxt: g.dup };
    checkSheet('S2', e, g);
    const sw = await page.evaluate(() => { const r = document.querySelector('#statsfl-body .sfl-row[data-sheet="1"]'); if (!r) return null; r.click(); return { cur: CUR_SHEET, tab: _statTab, still: !!document.querySelector('#statsfl-body .sfl-row[data-sheet]') }; });
    if (!sw) fail('S2: no row for sheet 1'); else { if (sw.cur !== 1) fail('S2: click did not switch sheet (CUR_SHEET ' + sw.cur + ')'); if (!sw.still) fail('S2: panel left the 시트 tab after switching'); }
    const g2 = await page.evaluate('(' + READ_SHEET.toString() + ')()'); const e2 = await page.evaluate('(' + EXP.toString() + ')()'); checkSheet('S2b', e2, g2);
    await page.evaluate(() => switchSheet(0));
  }
  // S3 retired 2026-10-19 (ORGCHART-STAT2 replaced the 팀 tab layout by owner decision: subtotal first, 직속 N, aside first);
  //    the 팀 tab is judged by tmp/prep/orgchart-stat2/VERIFY_stat2.js T2-T6. Original in VERIFY_stat.js.pre-stat2.
  // S4
  await clickTab('직무'); const fj = await page.evaluate(() => getComputedStyle(document.getElementById('statsfl-filter')).display);
  if (fj === 'none') fail('S4: filter hidden on 직무 tab');
  // S5 live update
  const live = await page.evaluate(() => { const g = OPT.statsGroups.find(x => x.excludeTotal) || null; let key;
    if (g) key = g.statuses[0]; else { OPT.statsGroups.push({ name: 'ZZ제외', statuses: ['zzx'], excludeTotal: true }); OPT.statusItems.push({ key: 'zzx', label: 'zzx', color: '#000' }); key = 'zzx'; }
    const n = S.nodes.find(x => (x.m || []).filter(m => m.cc !== true).length >= 2); const m = n.m.find(m => m.cc !== true);
    const tab = name => [...document.querySelectorAll('#statsfl-tabs .sfl-tab')].find(x => x.textContent.trim() === name);
    tab('팀') && tab('팀').click(); const rowN = () => { const r = document.querySelector('#statsfl-body .sfl-row[data-id="' + n.id + '"] .sfl-num'); return r ? r.textContent : null; };
    const b = rowN(); m.s = key; updateSt(); const a = rowN();
    tab('시트') && tab('시트').click(); const sN = () => { const r = document.querySelector('#statsfl-body .sfl-row[data-sheet="0"] .sfl-num'); return r ? r.textContent : null; };
    const sa = sN(); return { id: n.id, b, a, sa }; });
  const e5 = await page.evaluate('(' + EXP.toString() + ')()');
  if (num(live.a) !== num(live.b) - 1) fail('S5: 팀 row ' + live.id + ' ' + live.b + ' -> ' + live.a + ' after excluding one member');
  if (num(live.sa) !== e5.sheets[0].n) fail('S5: 시트 row shows ' + live.sa + ', want ' + e5.sheets[0].n);
  // S6 (fresh page: S5 may have added an excluded group to OPT)
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  await page.evaluate(([d, LOADs]) => { (0, eval)('(' + LOADs + ')')(d); }, [DOC, LOAD.toString()]);
  const curB = await page.evaluate('(' + BODIES.toString() + ')()');
  ['summary'].forEach(t => { if (curB[t] !== refB[t]) fail('S6: ' + t + ' tab body differs from the reference'); });
  // S7
  const s7 = await page.evaluate(() => { const base = S.nodes.find(n => n.type === 'top') || S.nodes[0];
    for (let i = 0; i < 60; i++) { const id = 'zz' + i; S.nodes.push({ id, en: 'ZZ팀' + i, ko: '', type: 'l2', x: 0, y: 0, m: [{ n: 'zz' + i, f: '', r: '', s: 'active' }] }); S.conns.push({ id: 'zc' + i, f: base.id, t: id, d: 0 }); }
    autoLayout(); render(); updateSt(); const tab = [...document.querySelectorAll('#statsfl-tabs .sfl-tab')].find(x => x.textContent.trim() === '팀'); tab && tab.click();
    const p = document.getElementById('statsfl').getBoundingClientRect(); return { bottom: Math.round(p.bottom), h: innerHeight, rows: document.querySelectorAll('#statsfl-body .sfl-row[data-id]').length }; });
  out.info.s7 = s7;
  if (s7.bottom > s7.h) fail('S7: panel bottom ' + s7.bottom + ' past viewport ' + s7.h);
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}