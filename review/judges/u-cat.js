async page => {
  const DOC = __DOC__;
  /* C4/C5 compare members with a missing field equal to an empty one: saveModal has always written a:'' for a member
     without 'a' (measured on real data 10-19, the only difference); that is not data loss */
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  await page.goto('__PAGE__'); await page.waitForTimeout(500);
  await page.evaluate(d => { try { localStorage.clear(); } catch (e) {} _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(true); switchSheet(0); autoLayout(); ADMIN = true; applyRO(); render(); }, DOC);
  const r = await page.evaluate(() => { const o = {}; const H = collHidden();
    const t = S.nodes.filter(n => !H.has(n.id) && (n.m || []).length >= 3)[0]; o.id = t.id;
    if (!OPT.jobCats.length) OPT.jobCats = ['뤼투', '기타']; if (!OPT.roleCats.length) OPT.roleCats = ['킈쮀']; if (!OPT.areaCats.length) OPT.areaCats = ['후화'];
    t.m[0].f = 'ZZ직무'; t.m[0].r = 'ZZ직책'; t.m[0].a = 'ZZ분야'; t.m[0].s = 'zzstatus';
    t.m[1].f = OPT.jobCats[0]; t.m[1].r = ''; t.m[1].a = ''; t.m[1].s = OPT.statusItems[0].key;
    const N = ms => JSON.stringify((ms || []).map(m => { const o = {}; Object.keys(m).sort().forEach(k => { if (m[k] !== '' && m[k] !== undefined) o[k] = m[k]; }); return o; }));
    const before = N(t.m);
    openEdit(t.id); const row0 = document.querySelectorAll('#mlist .mer')[0];
    const sv = f => { const e = row0.querySelector('[data-f="' + f + '"]'); return e ? { v: e.value, txt: e.options[e.selectedIndex] ? e.options[e.selectedIndex].text : '' } : null; };
    o.sel = { f: sv('f'), r: sv('r'), a: sv('a'), s: sv('s') };
    saveModal(); const t2 = S.nodes.find(n => n.id === t.id); o.after0 = t2.m[0]; o.sameAll = N(t2.m) === before;
    openEdit(t.id); const r0 = document.querySelectorAll('#mlist .mer')[0]; const fs = r0.querySelector('[data-f="f"]'); fs.value = '__other__';
    const rs = r0.querySelector('[data-f="r"]'); rs.value = OPT.roleCats[0]; saveModal(); const t3 = S.nodes.find(n => n.id === t.id); o.cleared = t3.m[0].f; o.listed = t3.m[0].r;
    openEdit(t.id); const r1 = document.querySelectorAll('#mlist .mer')[1]; const f1 = r1.querySelector('[data-f="f"]');
    if (![...f1.options].some(x => x.value === '뤼투(겸)')) { const op = document.createElement('option'); op.value = '뤼투(겸)'; op.text = '뤼투(겸)'; f1.appendChild(op); }
    f1.value = '뤼투(겸)'; saveModal(); const t4 = S.nodes.find(n => n.id === t.id); o.cc = { f: t4.m[1].f, cc: t4.m[1].cc };
    return o; });
  out.info.r = { sel: r.sel, cleared: r.cleared, listed: r.listed, cc: r.cc };
  for (const [k, v] of [['f', 'ZZ직무'], ['r', 'ZZ직책'], ['a', 'ZZ분야'], ['s', 'zzstatus']]) {
    if (!r.sel[k] || r.sel[k].v !== v || r.sel[k].txt.indexOf(v) < 0) fail('C2: ' + k + ' select shows ' + JSON.stringify(r.sel[k]));
    if (r.after0[k] !== v) fail('C1: ' + k + ' saved as ' + JSON.stringify(r.after0[k]));
  }
  if (!r.sameAll) fail('C4: open+save changed the card members');
  if (r.cleared !== '') fail('C3: 미입력 stored ' + JSON.stringify(r.cleared));
  if (!r.listed) fail('C3: listed value not stored');
  if (r.cc.f !== '뤼투' || r.cc.cc !== true) fail('C6: legacy 뤼투(겸) -> ' + JSON.stringify(r.cc));
  const c5 = await page.evaluate(d => { _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(true); switchSheet(0); autoLayout(); render();
    OPT.jobCats = []; OPT.roleCats = []; OPT.areaCats = []; const bad = [];
    const N = ms => JSON.stringify((ms || []).map(m => { const o = {}; Object.keys(m).sort().forEach(k => { if (m[k] !== '' && m[k] !== undefined) o[k] = m[k]; }); return o; }));
    S.nodes.forEach(n => { const b = N(n.m); openEdit(n.id); saveModal(); const a = N(S.nodes.find(x => x.id === n.id).m); if (a !== b) bad.push(n.id); });
    return bad; }, DOC);
  if (c5.length) fail('C5: emptied lists changed members of ' + c5.length + ' cards, e.g. ' + c5[0]);
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}