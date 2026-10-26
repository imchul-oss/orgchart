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
    window.__clip = null; try { Object.defineProperty(navigator, 'clipboard', { value: { writeText: async t => { window.__clip = t; } }, configurable: true }); } catch (e) {}
    loadObject(JSON.parse(JSON.stringify(A)), false); if (CUR_SHEET !== 0) switchSheet(0); ADMIN = false; applyRO(); render();
    const R = {}; const tv = document.getElementById('treeview');
    const acts = () => [...tv.querySelectorAll('.tv-row')].map(row => ({ id: row.getAttribute('data-id'), t: (row.querySelector('.tv-title') || {}).textContent,
      b: [...row.querySelectorAll('button')].map(b => [b.getAttribute('aria-label') || '', b.disabled]) }));
    document.getElementById('btn-tree').click(); await w(100);
    R.ro = acts().reduce((n, x) => n + x.b.length, 0);
    // X1 in read-only
    const tb = [...tv.querySelectorAll('button')].find(b => b.textContent.trim() === '텍스트');
    R.hasTextBtn = !!tb;
    if (tb) { tb.click(); await w(50); const ta = tv.querySelector('textarea');
      R.txt0 = ta ? ta.value : null; R.taVis = !!(ta && ta.getClientRects().length);
      const mem = [...tv.querySelectorAll('input[type=checkbox]')].find(c => /사람/.test((c.closest('label') || {}).textContent || ''));
      if (mem) { mem.click(); await w(50); } R.txt1 = ta ? ta.value : null;
      const cp = [...tv.querySelectorAll('button')].find(b => b.textContent.trim() === '복사'); if (cp) { cp.click(); await w(50); } R.clip = window.__clip;
      if (mem && mem.checked) { mem.click(); await w(30); }
      tb.click(); await w(50); }
    const order = tvOrder().filter(x => x.kind === 'row'); R.order = order.map(x => [x.id, x.depth, nodeTitle(S.nodes.find(n => n.id === x.id))]);
    R.sheet = SHEETS[CUR_SHEET].name; R.members = []; S.nodes.forEach(n => (n.m || []).forEach(m => { if (m.n) R.members.push(m.n); }));
    // admin
    ADMIN = true; applyRO(); render(); await w(50);
    const a = acts(); R.adm = a.map(x => ({ id: x.id, t: x.t, b: x.b }));
    // E2
    const first = a.find(x => x.b.length === 4) || a[0];
    const row = id => tv.querySelector(`.tv-row[data-id="${id}"]`);
    const btn = (id, re) => [...row(id).querySelectorAll('button')].find(b => re.test(b.getAttribute('aria-label') || ''));
    const pick = a[Math.min(3, a.length - 1)];
    const eb = btn(pick.id, /고치기/); if (eb) { eb.click(); await w(80); }
    const ov = document.getElementById('ov'); const mb = document.querySelector('#ov .modal, #ov > div');
    const mr = mb ? mb.getBoundingClientRect() : null; const top = mr ? document.elementFromPoint(mr.left + mr.width / 2, mr.top + 20) : null;
    R.e2 = { show: ov.classList.contains('show'), eid: S.eid, want: pick.id, onTop: !!(top && ov.contains(top)) };
    cancelModal(); await w(50); R.e2.listOpen = TV.open && tv.classList.contains('tv-open');
    // E3
    const n0 = S.nodes.length; const ab = btn(pick.id, /하위 조직 추가/); if (ab) { ab.click(); await w(150); }
    const nid = S.eid; R.e3 = { added: S.nodes.length - n0, eid: nid, linked: S.conns.some(c => c.f === pick.id && c.t === nid), show: ov.classList.contains('show') };
    if (nid) { document.getElementById('ei-ko').value = '판정 하위 조직'; saveModal(); await w(150); }
    const ids = [...tv.querySelectorAll('.tv-row')].map(x => x.getAttribute('data-id'));
    const pi = ids.indexOf(pick.id), ni = ids.indexOf(nid); const pd = +row(pick.id).getAttribute('data-depth');
    let ok = pi >= 0 && ni > pi; for (let i = pi + 1; ok && i < ni; i++) { const d = +tv.querySelector(`.tv-row[data-id="${ids[i]}"]`).getAttribute('data-depth'); if (d <= pd) ok = false; }
    R.e3.listOpen = TV.open; R.e3.placed = ok && +row(nid).getAttribute('data-depth') === pd + 1;
    // E4
    const t = _ordTree(); const P = S.nodes.find(n => t.ordKids(n.id).length >= 2 && row(t.ordKids(n.id)[0]));
    if (P) { const k0 = t.ordKids(P.id).slice(); R.e4 = { p: P.id, k0 };
      const up = btn(k0[0], /위로/); R.e4.upDisabled = up ? up.disabled : null;
      const dn = btn(k0[0], /아래로/); await w(500); if (dn) { dn.click(); await w(600); }
      R.e4.k1 = _ordTree().ordKids(P.id).slice();
      const li = [...tv.querySelectorAll('.tv-row')].map(x => x.getAttribute('data-id')); R.e4.list = [li.indexOf(k0[0]), li.indexOf(k0[1])];
      undoEdit(); await w(600); R.e4.k2 = _ordTree().ordKids(P.id).slice(); }
    return R; }, AFTER);
  out.info = { ro: r.ro, e2: r.e2, e3: r.e3, e4: r.e4, txt0: (r.txt0 || '').slice(0, 300) };
  if (r.ro) fail('E1 read-only list shows edit buttons ' + r.ro);
  const bad = r.adm.filter(x => { const L = x.b.map(b => b[0]); return x.b.length !== 4 || !L.every(l => l.indexOf(x.t) >= 0) || !/고치기/.test(L.join()) || !/하위 조직 추가/.test(L.join()) || !/위로/.test(L.join()) || !/아래로/.test(L.join()); });
  if (!r.adm.length || bad.length) fail('E1 admin row buttons ' + J(bad.slice(0, 3)));
  if (!r.e2.show || r.e2.eid !== r.e2.want || !r.e2.onTop) fail('E2 edit window ' + J(r.e2));
  if (!r.e2.listOpen) fail('E2 list closed after cancel');
  if (r.e3.added !== 1 || !r.e3.linked || !r.e3.show) fail('E3 add child ' + J(r.e3));
  if (!r.e3.listOpen || !r.e3.placed) fail('E3 list after save ' + J(r.e3));
  if (!r.e4) fail('E4 setup: no parent with two sub-organisations');
  else { const x = r.e4;
    if (x.upDisabled !== true) fail('E4 위로 on the first is not disabled');
    if (x.k1[0] !== x.k0[1] || x.k1[1] !== x.k0[0]) fail('E4 아래로 did not swap ' + J({ k0: x.k0.slice(0, 3), k1: x.k1.slice(0, 3) }));
    if (!(x.list[1] < x.list[0])) fail('E4 list order not updated ' + J(x.list));
    if (J(x.k2) !== J(x.k0)) fail('E4 undo did not restore ' + J({ k0: x.k0.slice(0, 3), k2: x.k2.slice(0, 3) })); }
  if (!r.hasTextBtn) fail('X1 no 텍스트 button in read-only');
  else {
    const L = (r.txt0 || '').split('\n');
    if (!r.taVis) fail('X1 text not shown');
    if (L[0] !== r.sheet) fail('X1 first line ' + J(L[0]));
    const body = L.slice(1).filter(l => l.trim() && !/^\[/.test(l.trim()));
    if (body.length !== r.order.length) fail('X1 line count ' + body.length + ' vs rows ' + r.order.length);
    const mis = r.order.filter((o, i) => !body[i] || !body[i].startsWith(' '.repeat(2 * o[1]) + o[2]) || body[i][2 * o[1]] === ' ');
    if (mis.length) fail('X1 lines ' + J(mis.slice(0, 3).map(o => [o, body[r.order.indexOf(o)]])));
    const miss = r.members.filter(n => (r.txt1 || '').indexOf(n) < 0); if (!r.members.length || miss.length) fail('X1 members missing ' + miss.length);
    if (r.clip !== r.txt1) fail('X1 copy text differs');
  }
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}