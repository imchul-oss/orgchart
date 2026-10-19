async page => {
  const DOC = __DOC__;
  const out = { errors: [], sheets: [], fails: [] };
  page.on('pageerror', e => out.errors.push(String(e)));
  page.on('dialog', d => d.dismiss().catch(() => {}));
  const fail = m => out.fails.push(m);
  const clone = o => JSON.parse(JSON.stringify(o));
  // build BEFORE and the expectation per sheet
  const before = clone(DOC); const plan = [];
  before.sheets.forEach((sh, si) => {
    const kids = {}; sh.conns.forEach(c => (kids[c.f] = kids[c.f] || []).push(c.t));
    const withM = sh.nodes.filter(n => (n.m || []).length >= 2);
    const leaves = withM.filter(n => !kids[n.id]);
    const e = leaves[leaves.length - 1];
    const pool = withM.filter(n => n.id !== e.id);
    const [a, b, c, d] = pool;
    const A = sh.nodes.find(n => n.id === a.id), B = sh.nodes.find(n => n.id === b.id), C = sh.nodes.find(n => n.id === c.id), D = sh.nodes.find(n => n.id === d.id);
    const joinA = A.m[0].n; A.m.splice(0, 1);
    A.m.push({ n: '가상퇴사자' + si, f: '', r: '사원', s: 'active' });
    const mover = B.m.splice(1, 1)[0]; C.m.push(mover);
    const oldR = '변경전직위'; const changed = D.m[0].n; const newR = D.m[0].r; D.m[0].r = oldR;
    const eNode = sh.nodes.find(n => n.id === e.id);
    const eJoins = eNode.m.map(m => m.n);
    sh.nodes = sh.nodes.filter(n => n.id !== e.id); sh.conns = sh.conns.filter(x => x.t !== e.id && x.f !== e.id);
    sh.nodes.push({ id: 'zz_gone' + si, en: '폐지팀' + si, ko: '', type: 'l3', x: 0, y: 0, m: [{ n: '폐지인원' + si, f: '', r: '사원', s: 'active' }] });
    const all = sh.nodes.flatMap(n => n.m.map(m => m.n)).concat(DOC.sheets[si].nodes.flatMap(n => n.m.map(m => m.n)));
    plan.push({
      name: sh.name, join: 1 + eJoins.length, leave: 2, move: 1, change: 1, orgnew: 1, orggone: 1,
      rows: { [joinA]: 'new', [mover.n]: 'moved', [changed]: 'changed', ...Object.fromEntries(eJoins.map(n => [n, 'new'])) },
      newCard: e.id, mover: mover.n, moverFrom: c.en, moverTo: b.en, changed, oldR, newR,
      leaves: ['가상퇴사자' + si, '폐지인원' + si], gone: '폐지팀' + si
    });
  });
  async function load(admin) {
    await page.goto('__PAGE__'); await page.waitForTimeout(600);
    await page.evaluate(([d, admin]) => { _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(_hasPositions(S.nodes)); if (admin) { ADMIN = true; } }, [DOC, admin]);
    await page.waitForTimeout(300);
  }
  async function toSheet(i) { await page.evaluate(i => { switchSheet(i); }, i); await page.waitForTimeout(400); }
  async function pick(text, name) {
    if (!(await page.locator('#cmp-file').count())) { fail('no input#cmp-file'); return false; }
    await page.evaluate(([text, name]) => {
      const inp = document.getElementById('cmp-file'); const dt = new DataTransfer();
      dt.items.add(new File([text], name, { type: 'application/json' }));
      inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true }));
    }, [text, name]);
    await page.waitForTimeout(700); return true;
  }
  async function geo() { return await page.evaluate(() => S.nodes.map(n => { const e = document.getElementById('n' + n.id); return [n.id, n.x, n.y, e ? e.offsetWidth : -1, e ? e.offsetHeight : -1]; })); }
  async function state() {
    return await page.evaluate(() => {
      const p = document.getElementById('cmp-panel');
      const g = k => p ? p.getAttribute('data-' + k) : null;
      const rows = Array.prototype.filter.call(document.querySelectorAll('.nd .mr'), r => r.hasAttribute('data-cmp')).map(r => [(r.querySelector('.mn') || {}).textContent, r.getAttribute('data-cmp')]);
      const cards = Array.prototype.filter.call(document.querySelectorAll('.nd'), c => c.hasAttribute('data-cmp')).map(c => [c.id.slice(1), c.getAttribute('data-cmp')]);
      return {
        panel: !!(p && getComputedStyle(p).display !== 'none' && getComputedStyle(p).visibility !== 'hidden' && p.getBoundingClientRect().height > 0),
        k: p ? { join: +g('join'), leave: +g('leave'), move: +g('move'), change: +g('change'), orgnew: +g('orgnew'), orggone: +g('orggone') } : null,
        items: Array.prototype.map.call(document.querySelectorAll('#cmp-panel .cmp-item'), e => ({ kind: e.getAttribute('data-kind'), t: e.textContent })),
        rows, cards
      };
    });
  }
  function judge(tag, st, P) {
    if (!st.panel) fail(tag + ' K: #cmp-panel not visible');
    const want = { join: P.join, leave: P.leave, move: P.move, change: P.change, orgnew: P.orgnew, orggone: P.orggone };
    if (JSON.stringify(st.k) !== JSON.stringify(want)) fail(tag + ' K: counts ' + JSON.stringify(st.k) + ' != ' + JSON.stringify(want));
    const got = Object.fromEntries(st.rows); const exp = P.rows;
    Object.keys(exp).forEach(n => { if (got[n] !== exp[n]) fail(tag + ' M: row ' + n + ' expected ' + exp[n] + ' got ' + (got[n] || 'none')); });
    Object.keys(got).forEach(n => { if (!(n in exp)) fail(tag + ' M: unexpected mark on ' + n + '=' + got[n]); });
    if (JSON.stringify(st.cards) !== JSON.stringify([[P.newCard, 'new']])) fail(tag + ' M: card marks ' + JSON.stringify(st.cards));
    const kinds = {}; st.items.forEach(i => (kinds[i.kind] = kinds[i.kind] || []).push(i.t));
    ['join', 'leave', 'move', 'change', 'orgnew', 'orggone'].forEach(k => { if ((kinds[k] || []).length !== want[k]) fail(tag + ' T: ' + (kinds[k] || []).length + ' items of kind ' + k + ', want ' + want[k]); });
    const has = (k, ...ws) => (kinds[k] || []).some(t => ws.every(w => t.includes(w)));
    P.leaves.forEach(n => { if (!has('leave', n)) fail(tag + ' T: no leave item naming ' + n); });
    if (!has('move', P.mover, P.moverFrom, P.moverTo)) fail(tag + ' T: move item lacks person or both teams');
    if (!has('change', P.changed, P.oldR, P.newR)) fail(tag + ' T: change item lacks person or old/new rank');
    if (!has('orggone', P.gone)) fail(tag + ' T: no orggone item naming ' + P.gone);
  }
  const beforeText = JSON.stringify(before);
  // (V) read-only path, sheet 0, plus (G) (S) (W) (X)
  await load(false);
  const g0 = await geo();
  const saved0 = await page.evaluate(() => { const d = _fileData(); delete d.savedAt; return JSON.stringify(d); });
  if (await pick(beforeText, 'before.json')) {
    let st = await state(); judge(plan[0].name + ' ro', st, plan[0]); out.sheets.push({ name: plan[0].name, st });
    const g1 = await geo();
    if (JSON.stringify(g0) !== JSON.stringify(g1)) fail('G: card geometry changed while comparing');
    const saved1 = await page.evaluate(() => { const d = _fileData(); delete d.savedAt; return JSON.stringify(d); });
    if (saved0 !== saved1) fail('S: _fileData() changed by compare');
    await page.screenshot({ path: 'D:/claude/tmp/prep/orgchart-aside/reg-cmp0.png' });
    // (W) switch sheet while comparing
    for (let i = 1; i < plan.length; i++) {
      await toSheet(i);
      st = await state(); judge(plan[i].name + ' switched', st, plan[i]); out.sheets.push({ name: plan[i].name, st });
      const gi = await geo();
      await page.screenshot({ path: 'D:/claude/tmp/prep/orgchart-aside/reg-cmp' + i + '.png' });
      if (!(await page.locator('#cmp-exit').count())) fail('X: no #cmp-exit while comparing');
      await page.evaluate(() => { const b = document.getElementById('cmp-exit'); if (b) b.click(); });
      await page.waitForTimeout(400);
      const gx = await geo();
      if (JSON.stringify(gi) !== JSON.stringify(gx)) fail(plan[i].name + ' G: geometry differs between compare and exit');
    }
    const sx = await state();
    if (sx.panel || sx.rows.length || sx.cards.length) fail('X: marks or panel remain after #cmp-exit: ' + JSON.stringify([sx.panel, sx.rows.length, sx.cards.length]));
  }
  // admin path on sheet 1 first, then sheet 0
  await load(true); await toSheet(1);
  if (await pick(beforeText, 'before.json')) {
    const st = await state(); judge(plan[1].name + ' admin', st, plan[1]);
    await toSheet(0); const st0 = await state(); judge(plan[0].name + ' admin-switched', st0, plan[0]);
  }
  // (F) not JSON
  await load(false);
  if (await pick('this is not json', 'bad.json')) {
    const msg = await page.evaluate(() => document.body.innerText);
    const st = await state();
    if (st.rows.length || st.cards.length) fail('F: marks after a bad file');
    if (!/비교/.test(msg) || !/(읽지 못|올바른|형식)/.test(msg)) fail('F: no Korean error message after a bad file');
  }
  if (out.errors.length) fail('E: page errors ' + out.errors.slice(0, 3).join(' | '));
  out.RESULT = out.fails.length ? 'RED' : 'GREEN';
  return out;
}