async page => {
  const AFTER = __OWNER20__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 40) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const r = await page.evaluate(A => { try{localStorage.clear();}catch(e){} window.alert = () => {}; window.confirm = () => true;
    const d = JSON.parse(JSON.stringify(A));
    d.sheets[0].nodes.forEach(n => (n.m||[]).forEach(m => { if (String(m.n||'').trim()) m.a = ['t_06','t_07','t_08','t_09','t_10'].includes(n.id) ? '1톄취' : '서울'; }));
    loadObject(d, false); if (CUR_SHEET !== 0) switchSheet(0); ADMIN = true; applyRO(); render(); if (typeof _qListOpen !== "undefined") _qListOpen = true;  // 10-23 G10: the list is folded by default (panel2 judge checks that); this judge reads it open
    const fl = document.getElementById('statsfl'); fl.classList.remove('collapsed'); fl.style.display = '';
    const tabs = [...document.querySelectorAll('#statsfl-tabs .sfl-tab')]; const tabBtn = nm => tabs.find(b => b.textContent.trim() === nm);
    const q1 = { n: tabs.length, has: !!tabBtn('조회'), clip: tabs.filter(b => b.scrollWidth > b.clientWidth + 1).map(b => b.textContent.trim()), fit: (() => { const t = document.getElementById('statsfl-tabs').getBoundingClientRect(), p = fl.getBoundingClientRect(); return t.right <= p.right + 0.5; })() };
    if (!tabBtn('조회')) return { q1 };
    switchStatTab(tabBtn('조회'), 'query');
    const body = document.getElementById('statsfl-body');
    const ch = (id, v) => { const e = document.getElementById(id); if (!e) return false; e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); return true; };
    const add = (k, v) => ch('sfl-q-k', k) && ch('sfl-q-v', v);
    const state = () => { const tot = body.querySelector('.sfl-foot .sfl-total'); const list = body.querySelector('.sfl-qlist');
      return { chips: [...body.querySelectorAll('.sfl-qchip')].map(c => c.textContent.replace('×', '').replace(/\s+/g, ' ').trim()),
        tot: tot ? [tot.querySelector('.sfl-total-lbl').textContent.trim(), tot.querySelector('.sfl-total-num').textContent.trim()] : null,
        split: [...body.querySelectorAll('.sfl-row')].filter(e => !e.closest('.sfl-qlist')).map(e => [(e.querySelector('.sfl-lbl') || {}).textContent.trim(), ((e.querySelector('.sfl-num') || {}).textContent || '').trim()]),
        list: list ? [...list.querySelectorAll('.sfl-row')].map(e => (e.querySelector('.sfl-lbl') || {}).textContent.trim()) : null }; };
    const clear = () => { let g = 0; while (body.querySelector('.sfl-qx') && g++ < 20) body.querySelector('.sfl-qx').click(); };
    // expected
    const recs = sheets => { const o = []; sheets.forEach(i => _sflSheetNodes(i).forEach(n => (n.m||[]).forEach(m => { if (m.cc === true) return; const k = memberKind(m); if (k !== 'p' && k !== 'ponly' && k !== 'tot') return; o.push({ m, team: _sflLabel(n), cur: k !== 'tot', tot: k !== 'ponly' }); }))); return o; };
    const fr = l => l.filter(x => x.cur).length + '/' + l.filter(x => x.tot).length;
    const by = (l, f) => { const o = {}; l.forEach(x => { const v = f(x); (o[v] = o[v] || []).push(x); }); const r = {}; Object.entries(o).forEach(([k, v]) => r[k] = fr(v)); return r; };
    const R0 = recs([CUR_SHEET]);
    const exp = {};
    const kwa = R0.filter(x => x.m.r === '킈쮀'); exp.q2 = { tot: fr(kwa), team: by(kwa, x => x.team), names: kwa.map(x => String(x.m.n || '').trim() || '(채용 자리)').sort() };
    exp.q3a = fr(R0.filter(x => x.m.r === '킈쮀' && x.m.a === '1톄취')); exp.q3b = fr(R0.filter(x => (x.m.r === '킈쮀' || x.m.r === '저줴') && x.m.a === '1톄취'));
    exp.q5 = by(kwa, x => x.m.a || '미입력');
    exp.q7 = fr(R0.filter(x => x.m.s === 'hiring'));
    exp.q8 = fr(recs(SHEETS.map((_, i) => i)).filter(x => (x.m.s || 'active') === 'active')); exp.q8cur = fr(R0.filter(x => (x.m.s || 'active') === 'active'));
    const res = { q1, exp };
    res.q9 = state();
    add('r', '킈쮀'); res.q2 = state();
    _statTab = 'query'; const td = _statTableData(); res.q6 = { title: td.title, items: td.items.map(x => [x.t, x.name, String(x.cnt)]) };
    add('a', '1톄취'); res.q3a = state(); add('r', '저줴'); res.q3b = state();
    const ix = [...body.querySelectorAll('.sfl-qchip')].findIndex(c => /저줴/.test(c.textContent)); if (ix >= 0) body.querySelectorAll('.sfl-qchip')[ix].querySelector('.sfl-qx').click(); res.q4 = state();
    switchStatTab(tabBtn('직무'), 'job'); switchStatTab(tabBtn('조회'), 'query'); res.q10 = state();
    clear(); add('r', '킈쮀'); ch('sfl-q-by', 'a'); res.q5 = state(); ch('sfl-q-by', 'team');
    clear(); add('st', 'hiring'); res.q7 = state();
    clear(); add('st', 'active'); const sb = body.querySelector('.sfl-scope[data-scope="all"]'); if (sb) sb.click(); res.q8 = state(); const sc = body.querySelector('.sfl-scope[data-scope="cur"]'); if (sc) sc.click();
    return res; }, AFTER);
  out.info = { q1: r.q1, q2: r.q2, exp: r.exp, q6: r.q6 };
  const J = JSON.stringify;
  if (r.q1.n !== 7 || !r.q1.has || r.q1.clip.length || !r.q1.fit) fail('Q1 tabs ' + J(r.q1));
  if (!r.q1.has) { out.RESULT = 'RED ' + (out.fails.length + out.errors.length); return out; }
  const E = r.exp, tv = s => s && s.tot ? s.tot[1] : null;
  if (!r.q9.tot || r.q9.tot[0] !== '전체 (현원/정원)' || r.q9.tot[1] !== '58/65' || r.q9.list) fail('Q9 no condition ' + J(r.q9));
  if (r.q2.chips.length !== 1 || !/킈쮀/.test(r.q2.chips[0])) fail('Q2 chips ' + J(r.q2.chips));
  if (!r.q2.tot || r.q2.tot[0] !== '해당 (현원/정원)' || r.q2.tot[1] !== E.q2.tot) fail('Q2 total ' + J(r.q2.tot) + ' want ' + E.q2.tot);
  const sp = {}; r.q2.split.forEach(([k, v]) => sp[k] = v); if (J(Object.keys(sp).sort()) !== J(Object.keys(E.q2.team).sort()) || Object.keys(sp).some(k => sp[k] !== E.q2.team[k])) fail('Q2 split by team ' + J(sp) + ' want ' + J(E.q2.team));
  if (!r.q2.list || J([...r.q2.list].sort()) !== J(E.q2.names)) fail('Q2 list ' + J(r.q2.list) + ' want ' + J(E.q2.names));
  if (tv(r.q3a) !== E.q3a) fail('Q3 킈쮀 and 1톄취 ' + tv(r.q3a) + ' want ' + E.q3a);
  if (tv(r.q3b) !== E.q3b) fail('Q3 (킈쮀|저줴) and 1톄취 ' + tv(r.q3b) + ' want ' + E.q3b);
  if (tv(r.q4) !== E.q3a || r.q4.chips.length !== 2) fail('Q4 remove chip ' + J(r.q4));
  const s5 = {}; r.q5.split.forEach(([k, v]) => s5[k] = v); if (J(s5) !== J(Object.fromEntries(Object.keys(s5).map(k => [k, E.q5[k]]))) || Object.keys(s5).length !== Object.keys(E.q5).length) fail('Q5 split by 분야 ' + J(s5) + ' want ' + J(E.q5));
  const it = r.q6.items, names = new Set((r.q2.list || []).filter(n => n !== '(채용 자리)'));
  if (!/^조회/.test(r.q6.title)) fail('Q6 title ' + r.q6.title);
  if (!it.some(x => /조건/.test(x[1]) && /킈쮀/.test(x[1]))) fail('Q6 no 조건 note ' + J(it.slice(0, 3)));
  if (!it.some(x => x[0] === 'total' && x[1] === '해당 (현원/정원)' && x[2] === E.q2.tot)) fail('Q6 total ' + J(it.filter(x => x[0] === 'total')));
  if (it.some(x => names.has(x[1]))) fail('Q6 names leaked to print ' + J(it.filter(x => names.has(x[1]))));
  if (tv(r.q7) !== '0/7' || E.q7 !== '0/7' || !r.q7.list || r.q7.list.length !== 7 || r.q7.list.some(n => n !== '(채용 자리)')) fail('Q7 seats ' + J(r.q7) + ' exp ' + E.q7);
  if (tv(r.q8) !== E.q8 || E.q8 === E.q8cur) fail('Q8 all sheets ' + tv(r.q8) + ' want ' + E.q8);
  if (J(r.q10.chips) !== J(r.q4.chips)) fail('Q10 conditions lost on tab switch ' + J(r.q10.chips));
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}