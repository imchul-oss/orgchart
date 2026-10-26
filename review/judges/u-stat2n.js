async page => {
  const OWNER = __OWNER__, DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  page.on('dialog', d => d.accept().catch(() => {}));
  const fail = m => { if (out.fails.length < 80) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  const LOAD = async (url, d) => { await page.goto(url); await page.waitForTimeout(400);
    await page.evaluate(d => { try { localStorage.clear(); } catch (e) {} _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(true);
      if (CUR_SHEET !== 0) switchSheet(0); ADMIN = true; applyRO(); render(); const fl = document.getElementById('statsfl'); if (fl) fl.classList.remove('collapsed'); updateSt(); }, d); };
  const TAB = n => page.evaluate(n => { const b = [...document.querySelectorAll('#statsfl-tabs .sfl-tab')].find(x => x.textContent.trim() === n); if (b) b.click(); return !!b; }, n);
  const BODIES = () => page.evaluate(() => { const r = {}; for (const t of ['현황', '직무', '직책', '분야', '시트']) { const b = [...document.querySelectorAll('#statsfl-tabs .sfl-tab')].find(x => x.textContent.trim() === t); b.click(); r[t] = (c => { c.querySelectorAll('.sfl-foot').forEach(f => f.replaceWith(...f.childNodes)); c.querySelectorAll('input[data-inc]').forEach(i => i.removeAttribute('aria-label')); c.querySelectorAll('.sfl-row').forEach(r => { const n = r.querySelector(':scope > .sfl-num'), b = r.querySelector(':scope > .sfl-inc'); if (n && b && (b.compareDocumentPosition(n) & 4)) { const ws = n.previousSibling; b.before(n); if (ws && ws.nodeType === 3) n.after(ws); } }); return c.innerHTML; })(document.getElementById('statsfl-body').cloneNode(true)); } return r; });
  // expected model, computed in the page from data only (tvOrder for tree order)
  const EXP = (scope) => page.evaluate(scope => {
    const defKey = OPT.statusItems[0]?.key || 'active'; const ex = new Set(OPT.statsGroups.filter(g => g.excludeTotal).flatMap(g => g.statuses));
    const ok = m => m.cc !== true && !ex.has(m.s || defKey); const okc = m => m.cc === true && !ex.has(m.s || defKey);
    const nodesOf = i => i === CUR_SHEET ? S.nodes : (SHEETS[i].nodes || []); const connsOf = i => i === CUR_SHEET ? S.conns : (SHEETS[i].conns || []);
    // tree order of a sheet: tvOrder() of that sheet, aside leaves moved first under their parent
    const orderOf = i => { const keep = CUR_SHEET; if (i !== CUR_SHEET) switchSheet(i);
      const L = tvOrder().filter(r => r.kind === 'row'); const nodes = S.nodes.slice(), conns = S.conns.slice();
      if (i !== keep) switchSheet(keep);
      const by = {}; nodes.forEach(n => by[n.id] = n);
      const kidsOf = id => conns.filter(c => c.f === id).map(c => c.t);
      // rebuild with aside-first: walk L, group by parent using depth
      const res = []; const walk = (lo, hi, out2) => { let k = lo; const items = []; while (k < hi) { const d = L[k].depth; let e = k + 1; while (e < hi && L[e].depth > d) e++; items.push([k, e]); k = e; }
          const isAs = ([k, e]) => { const n = by[L[k].id]; return !!n && n.aside === true && e === k + 1; };
          [...items.filter(isAs), ...items.filter(x => !isAs(x))].forEach(([k, e]) => { out2.push(L[k]); walk(k + 1, e, out2); }); };
      walk(0, L.length, res); return { rows: res, nodes, conns }; };
    const own = (n, si) => (n.m || []).map((m, i) => [m, i]).filter(([m]) => ok(m)).map(([m, i]) => (si == null ? CUR_SHEET : si) + ':' + n.id + ':' + i);  // tally (10-20): one token per counted entry, never merged by name
    const ccN = n => (n.m || []).filter(okc).length;
    const R = [];
    if (scope === 'cur') {
      const o = orderOf(CUR_SHEET); const by = {}; o.nodes.forEach(n => by[n.id] = n);
      o.rows.forEach((r, i) => { const names = new Set(own(by[r.id])); let k = i + 1, has = false; while (k < o.rows.length && o.rows[k].depth > r.depth) { own(by[o.rows[k].id]).forEach(x => names.add(x)); has = true; k++; }
        R.push({ id: r.id, depth: r.depth, lbl: (by[r.id].en || by[r.id].ko || '').trim(), own: new Set(own(by[r.id])).size, sub: has ? names.size : null, cc: ccN(by[r.id]) }); });
      const tot = new Set(o.nodes.flatMap(own)).size; return { rows: R, total: tot, un: [] };
    }
    const base = orderOf(0); const by0 = {}; base.nodes.forEach(n => by0[n.id] = n);
    const key = n => ((n.en || '').trim() || (n.ko || '').trim());
    /* amended 2026-10-20 (ORGCHART-UX): a name that differs only by a trailing parenthesis or spacing is the same team -
       쵀똬퇴(BM) -> 쵀똬퇴, 매뤠써(쪠즤) -> 매뤠써; exact match first, then the normalised one, each only when unique */
    const norm = s => s.replace(/\s*\([^)]*\)\s*$/, '').replace(/[\s_\u00b7]/g, '');
    const keyIdx = {}, normIdx = {}; base.nodes.forEach(n => { const k = key(n); (keyIdx[k] = keyIdx[k] || []).push(n.id); const nk = norm(k); (normIdx[nk] = normIdx[nk] || []).push(n.id); });
    const mapped = {}; base.nodes.forEach(n => mapped[n.id] = new Set(own(n, 0)));
    const ccMap = {}; base.nodes.forEach(n => ccMap[n.id] = ccN(n));
    const un = [];
    for (let si = 1; si < SHEETS.length; si++) { const ns = nodesOf(si), cs = connsOf(si); const byS = {}; ns.forEach(n => byS[n.id] = n);
      const par = {}; cs.forEach(c => { if (byS[c.f] && byS[c.t] && par[c.t] === undefined) par[c.t] = c.f; });
      const memo = {}; const mp = (id, seen) => { if (memo[id] !== undefined) return memo[id]; const n = byS[id]; if (!n || seen.has(id)) return null; seen.add(id);
        let t = null; if (n.sum && by0[n.sum]) t = n.sum; else { const c = keyIdx[key(n)], c2 = normIdx[norm(key(n))]; if (c && c.length === 1) t = c[0]; else if (c2 && c2.length === 1) t = c2[0]; else if (par[id] !== undefined) t = mp(par[id], seen); }
        memo[id] = t; return t; };
      ns.forEach(n => { const t = mp(n.id, new Set()); if (t) { own(n, si).forEach(x => mapped[t].add(x)); ccMap[t] += ccN(n); } else un.push({ si, id: n.id, own: new Set(own(n, si)).size }); }); }
    base.rows.forEach((r, i) => { const names = new Set(mapped[r.id]); let k = i + 1, has = false; while (k < base.rows.length && base.rows[k].depth > r.depth) { mapped[base.rows[k].id].forEach(x => names.add(x)); has = true; k++; }
      R.push({ id: r.id, depth: r.depth, lbl: key(by0[r.id]), own: mapped[r.id].size, sub: has ? names.size : null, cc: ccMap[r.id] }); });
    const all = new Set(); SHEETS.forEach((s, i) => nodesOf(i).forEach(n => own(n).forEach(x => all.add(x))));
    return { rows: R, total: all.size, un };
  }, scope);
  const READ = () => page.evaluate(() => { const B = document.getElementById('statsfl-body');
    const rows = [...B.querySelectorAll('.sfl-row[data-id]:not([data-sheet])')].map(r => ({ id: r.getAttribute('data-id'), depth: r.getAttribute('data-depth'), lbl: ((r.querySelector('.sfl-lbl') || {}).textContent || '').trim(),
      num: (r.querySelector('.sfl-num') || {}).textContent, own: r.querySelector('.sfl-own') ? r.querySelector('.sfl-own').textContent : null, cc: r.querySelector('.sfl-cc') ? r.querySelector('.sfl-cc').textContent : null,
      fold: !!r.querySelector('.sfl-fold'), shown: getComputedStyle(r).display !== 'none' }));
    const un = [...B.querySelectorAll('.sfl-row[data-sheet][data-id]')].map(r => ({ si: r.getAttribute('data-sheet'), id: r.getAttribute('data-id'), num: (r.querySelector('.sfl-num') || {}).textContent }));
    const secs = [...B.querySelectorAll('.sfl-sec-lbl')].map(x => x.textContent);
    const tot = (B.querySelector('.sfl-total .sfl-total-num') || {}).textContent;
    const sc = [...B.querySelectorAll('.sfl-scope')].map(b => ({ s: b.getAttribute('data-scope'), t: b.textContent.trim(), on: b.classList.contains('on') }));
    return { rows, un, secs, tot, sc }; });
  const num = s => { const m = String(s || '').replace(/,/g, '').match(/-?\d+/); return m ? +m[0] : null; };
  function cmp(tag, e, g) {
    if (g.rows.length !== e.rows.length) fail(tag + ': ' + g.rows.length + ' rows, want ' + e.rows.length);
    e.rows.forEach((x, i) => { const r = g.rows[i]; if (!r) return; if (r.id !== x.id) { fail(tag + ': row ' + i + ' is ' + r.id + ', want ' + x.id); return; }
      if (r.depth !== String(x.depth)) fail(tag + ': ' + x.id + ' depth ' + r.depth);
      if (r.lbl !== x.lbl) fail(tag + ': ' + x.id + ' label ' + JSON.stringify(r.lbl) + ' want ' + JSON.stringify(x.lbl));
      if (x.sub !== null) { if (num(r.num) !== x.sub) fail(tag + ': ' + x.id + ' main ' + r.num + ', want subtotal ' + x.sub);
        if (!r.own || !/부서소속/.test(r.own) || /직속|자체/.test(r.own) || num(r.own) !== x.own) fail(tag + ': ' + x.id + ' .sfl-own ' + JSON.stringify(r.own) + ', want 부서소속 ' + x.own);  // own (10-20): the word is 부서소속, 직속 names beside cards
        if (!r.fold) fail(tag + ': ' + x.id + ' parent row without .sfl-fold'); }
      else { if (num(r.num) !== x.own) fail(tag + ': ' + x.id + ' own ' + r.num + ', want ' + x.own); if (r.own !== null) fail(tag + ': ' + x.id + ' leaf has .sfl-own'); }
      if (x.cc === 0 && r.cc !== null) fail(tag + ': ' + x.id + ' .sfl-cc without cc'); if (x.cc > 0 && num(r.cc) !== x.cc) fail(tag + ': ' + x.id + ' cc ' + r.cc + ' want ' + x.cc); });
    if (num(g.tot) !== e.total) fail(tag + ': total ' + g.tot + ', want ' + e.total);
    if (e.un.length || g.un.length) { if (!g.secs.some(s => /짝 없음/.test(s))) fail(tag + ': no 짝 없음 section');
      const gu = g.un.map(u => u.si + '/' + u.id + '=' + num(u.num)).sort(), eu = e.un.map(u => u.si + '/' + u.id + '=' + u.own).sort();
      if (JSON.stringify(gu) !== JSON.stringify(eu)) fail(tag + ': unmatched ' + JSON.stringify(gu) + ' want ' + JSON.stringify(eu)); }
  }
  // reference bodies
  await LOAD('__REF__', OWNER); const refB = await BODIES();
  for (const [dname, D] of [['owner', OWNER], ['final', DOC]]) {
    await LOAD('__PAGE__', D);
    if (dname === 'owner') { const curB = await BODIES(); Object.keys(refB).filter(t => !/job|role|area|직무|직책|분야/.test(t)).forEach(t => { if (curB[t] !== refB[t]) fail('T7: ' + t + ' tab body differs from reference'); }); }
    if (!(await TAB('팀'))) { fail('no 팀 tab'); break; }
    let g = await READ();
    if (dname === 'owner') { out.info.scope = g.sc;
      const c = g.sc.find(s => s.s === 'cur'), a = g.sc.find(s => s.s === 'all');
      if (!c || c.t !== '현재 시트' || !a || a.t !== '전체 시트') fail('T1: scope buttons ' + JSON.stringify(g.sc)); else if (!c.on || a.on) fail('T1: cur not default'); }
    for (const si of [0, 1]) { await page.evaluate(i => switchSheet(i), si); g = await READ(); const e = await EXP('cur'); cmp('T2 ' + dname + ' s' + si, e, g); if (dname === 'owner' && si === 0) out.info.cur0 = g.rows.slice(0, 7).map(r => [r.id, r.num, r.own]); }
    await page.evaluate(() => switchSheet(0));
    // T3 fold
    if (dname === 'owner') {
      const f = await page.evaluate(() => { const B = document.getElementById('statsfl-body'); const r = B.querySelector('.sfl-row[data-id="prodhq"]'); if (!r || !r.querySelector('.sfl-fold')) return null;
        const rows = [...B.querySelectorAll('.sfl-row[data-id]:not([data-sheet])')]; const i = rows.indexOf(r); const d = +r.getAttribute('data-depth');
        const below = []; for (let k = i + 1; k < rows.length && +rows[k].getAttribute('data-depth') > d; k++) below.push(rows[k].getAttribute('data-id'));
        r.querySelector('.sfl-fold').click(); updateSt();
        const hid = id => { const x = document.querySelector('#statsfl-body .sfl-row[data-id="' + id + '"]'); return x && getComputedStyle(x).display === 'none'; };
        const a = below.every(hid), sym = document.querySelector('#statsfl-body .sfl-row[data-id="prodhq"] .sfl-fold').textContent;
        const nxt = rows[i + below.length + 1] ? rows[i + below.length + 1].getAttribute('data-id') : null; const nv = nxt ? !hid(nxt) : true;
        document.querySelector('#statsfl-body .sfl-row[data-id="prodhq"] .sfl-fold').click(); const b = below.every(id => !hid(id));
        return { n: below.length, a, sym, nv, b }; });
      if (!f) fail('T3: prodhq has no .sfl-fold'); else { if (!f.n || !f.a) fail('T3: fold did not hide (or did not survive updateSt) ' + JSON.stringify(f)); if (!/▸/.test(f.sym)) fail('T3: folded symbol ' + f.sym); if (!f.nv) fail('T3: fold hid a row outside the subtree'); if (!f.b) fail('T3: unfold did not show rows'); }
      // T4 navigate
      const nav = await page.evaluate(async () => { const w = document.getElementById('wrap'); w.scrollLeft = 0; w.scrollTop = 0;
        const B = document.getElementById('statsfl-body'); const ids = [...B.querySelectorAll('.sfl-row[data-id]:not([data-sheet])')].map(r => r.getAttribute('data-id'));
        const vis = id => { const e = document.getElementById('n' + id); if (!e) return false; const a = e.getBoundingClientRect(), b = w.getBoundingClientRect(); return a.left >= b.left - 1 && a.right <= b.right + 1 && a.top < b.bottom && a.bottom > b.top; };
        const tgt = ids.slice().reverse().find(id => !vis(id)); if (!tgt) return { skip: true };
        B.querySelector('.sfl-row[data-id="' + tgt + '"] .sfl-lbl').click(); await new Promise(r => setTimeout(r, 300)); return { tgt, ok: vis(tgt) }; });
      out.info.nav = nav; if (!nav.skip && !nav.ok) fail('T4: clicking ' + nav.tgt + ' did not bring the card into view');
    }
    // T5 all scope
    const hasAll = await page.evaluate(() => { const b = document.querySelector('#statsfl-body .sfl-scope[data-scope="all"]'); if (b) b.click(); return !!b; });
    if (!hasAll) fail('T5: no all-scope button'); else { const e = await EXP('all'); g = await READ(); cmp('T5 ' + dname, e, g); out.info['all_' + dname] = { tot: g.tot, un: g.un.length, top: g.rows.slice(0, 3).map(r => [r.id, r.num]) };
      if (dname === 'owner') { const want = { t_09: 35, t_06: 3, prodhq: 2 }; Object.keys(want).forEach(id => { const row = g.rows.find(r => r.id === id); const v = row ? (row.own !== null ? num(row.own) : num(row.num)) : null; if (v !== want[id]) fail('T8: all-scope own of ' + id + ' = ' + v + ', want ' + want[id] + ' (쵀똬퇴(BM)->쵀똬퇴, 매뤠써(쪠즤)->매뤠써)'); }); }
      const on = (await READ()).sc.find(s => s.s === 'all'); if (!on || !on.on) fail('T1: all button not marked on'); }
  }
  // T6 explicit mapping via the modal (final data, sheet 1 card o_p1_2 -> t_09)
  const t6 = await page.evaluate(() => { switchSheet(0); openEdit('t_09'); const s0 = document.getElementById('ei-sum'); const vis0 = !!(s0 && s0.offsetParent); if (typeof closeModal === 'function') closeModal();
    switchSheet(1); openEdit('o_p1_2'); const s = document.getElementById('ei-sum'); if (!s) return { vis0, none: true };
    const opts = [...s.options].map(o => o.value); s.value = 't_09'; saveModal(); const a = (S.nodes.find(n => n.id === 'o_p1_2') || {}).sum;
    openEdit('o_p1_2'); const s2 = document.getElementById('ei-sum'); const shown = s2.value; s2.value = ''; saveModal(); const b = 'sum' in (S.nodes.find(n => n.id === 'o_p1_2') || {});
    return { vis0, opts, a, shown, b, n0: SHEETS[0].nodes.length }; });
  out.info.t6 = { vis0: t6.vis0, a: t6.a, shown: t6.shown, b: t6.b };
  if (t6.none) fail('T6: no #ei-sum on a sheet-1 card'); else {
    if (t6.vis0) fail('T6: #ei-sum visible on a sheet-0 card');
    if (t6.opts[0] !== '' || t6.opts.length !== t6.n0 + 1) fail('T6: options ' + t6.opts.length + ', want 1 + ' + t6.n0);
    if (t6.a !== 't_09') fail('T6: sum stored ' + t6.a); if (t6.shown !== 't_09') fail('T6: modal shows ' + t6.shown); if (t6.b) fail('T6: clearing kept sum'); }
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}