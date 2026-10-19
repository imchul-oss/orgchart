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
  const ST = () => page.evaluate(() => JSON.stringify({ s: _fileData().sheets, c: CUR_SHEET }));
  const btn = () => page.evaluate(() => { const u = document.getElementById('btn-undo'), r = document.getElementById('btn-redo'); const vis = e => !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0;
    return { u: !!u, r: !!r, uv: vis(u), rv: vis(r), ud: !!u && u.disabled, rd: !!r && r.disabled, inTop: !!(u && u.closest('#topbar')) && !!(r && r.closest('#topbar')) }; });
  const key = async k => { await page.mouse.click(5, 300); await page.keyboard.press(k); await page.waitForTimeout(250); };
  // read-only first
  await load('__PAGE__');
  let b = await btn();
  if (!b.u || !b.r || !b.inTop) fail('B: #btn-undo / #btn-redo missing in #topbar');
  if (b.uv || b.rv) fail('B: undo/redo buttons visible in read-only mode');
  await page.evaluate(() => { const n = S.nodes[0]; n.x += 40; render(); });
  const roBefore = await ST(); await key('Control+z'); if (await ST() !== roBefore) fail('I: Ctrl+Z changed the chart in read-only mode');
  // admin flow
  await load('__PAGE__');
  await page.evaluate(() => { ADMIN = true; applyRO(); switchSheet(0); OPT.wrapN = 0; render(); });
  await page.waitForTimeout(300);
  b = await btn();
  if (!b.uv || !b.rv) fail('B: undo/redo buttons not visible in admin mode');
  if (!b.ud || !b.rd) fail('B: buttons not disabled with empty history ' + JSON.stringify(b));
  const s0 = await ST();
  await key('Control+z'); if (await ST() !== s0) fail('U: Ctrl+Z with empty history changed the chart');
  // action 1: real mouse drag of a card header
  const box = await page.evaluate(() => { const n = S.nodes.find(x => x.type !== 'top') || S.nodes[1]; const h = document.querySelector('#n' + CSS.escape(n.id) + ' .nh') || document.getElementById('n' + n.id); h.scrollIntoView({ block: 'center', inline: 'center' }); const r = h.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + Math.min(10, r.height / 2), id: n.id }; });
  await page.mouse.move(box.x, box.y); await page.mouse.down();
  for (let i = 1; i <= 8; i++) { await page.mouse.move(box.x + i * 15, box.y + i * 10); await page.waitForTimeout(20); }
  await page.mouse.up(); await page.waitForTimeout(300);
  const s1 = await ST();
  if (s1 === s0) fail('U: sanity - the real mouse drag did not move the card');
  // action 2: 자동 배치 button
  await page.evaluate(() => { const bt = [...document.querySelectorAll('#topbar button')].find(e => e.textContent.includes('자동 배치')); bt.click(); });
  await page.waitForTimeout(400);
  const s2 = await ST();
  // action 3: edit dialog
  const eid = await page.evaluate(() => { const n = S.nodes.find(x => x.type !== 'top'); openEdit(n.id); return n.id; });
  await page.waitForTimeout(200);
  await page.evaluate(() => { document.getElementById('ei-ko').value = 'UNDO-TEST-KO'; saveModal(); });
  await page.waitForTimeout(300);
  const s3 = await ST();
  if (!s3.includes('UNDO-TEST-KO')) fail('U: sanity - edit not applied');
  // action 4: delete a leaf card
  await page.evaluate(() => { const leaf = S.nodes.find(n => n.type !== 'top' && !S.conns.some(c => c.f === n.id)); delNodeById(leaf.id); });
  await page.waitForTimeout(300);
  const s4 = await ST();
  b = await btn(); if (b.ud) fail('B: undo button disabled with history');
  const chain = [s4, s3, s2, s1, s0];
  for (let i = 1; i < chain.length; i++) {
    await key('Control+z'); const now = await ST();
    if (now !== chain[i]) { fail('U: Ctrl+Z #' + i + ' did not restore the state before action ' + (5 - i)); break; }
    const drawn = await page.evaluate(() => S.nodes.every(n => !!document.getElementById('n' + n.id)) && document.querySelectorAll('.node, [id^="n"]').length > 0);
    if (!drawn) fail('S: card elements missing after undo #' + i);
  }
  await key('Control+z'); if (await ST() !== s0) fail('U: extra Ctrl+Z at the start changed the chart');
  b = await btn(); if (!b.ud) fail('B: undo button not disabled at the start of history'); if (b.rd) fail('B: redo button disabled with redo history');
  const saved = await page.evaluate(() => JSON.stringify(_fileData().sheets));
  if (JSON.stringify(JSON.parse(saved)) !== JSON.stringify(JSON.parse(s0).s)) fail('S: saved data differs from the restored state');
  await key('Control+y'); if (await ST() !== s1) fail('U: Ctrl+Y did not redo action 1');
  await key('Control+Shift+z'); if (await ST() !== s2) fail('U: Ctrl+Shift+Z did not redo action 2');
  await page.click('#btn-redo').catch(() => fail('B: redo button not clickable')); await page.waitForTimeout(250); if (await ST() !== s3) fail('B: redo button did not redo action 3');
  await page.click('#btn-undo').catch(() => fail('B: undo button not clickable')); await page.waitForTimeout(250); if (await ST() !== s2) fail('B: undo button did not undo action 3');
  // C: new action clears redo
  await page.evaluate(() => { const n = S.nodes.find(x => x.type !== 'top'); n.x += 20; render(); });
  await page.waitForTimeout(300);
  const s5 = await ST();
  await key('Control+y'); if (await ST() !== s5) fail('C: redo still possible after a new action');
  b = await btn(); if (!b.rd) fail('C: redo button not disabled after a new action');
  await key('Control+z'); if (await ST() !== s2) fail('U: undo of a programmatic move+render did not return to the previous state');
  // I: Ctrl+Z inside the edit dialog input
  await page.evaluate(() => { const n = S.nodes.find(x => x.type !== 'top'); openEdit(n.id); }); await page.waitForTimeout(200);
  const beforeI = await ST();
  await page.click('#ei-ko'); await page.keyboard.type('ab'); await page.keyboard.press('Control+z'); await page.waitForTimeout(200);
  if (await ST() !== beforeI) fail('I: Ctrl+Z inside the dialog input undid the chart');
  await page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); else { const m = document.querySelector('.modal.open, .modal.show'); if (m) m.classList.remove('open', 'show'); } });
  // W: change on sheet 1, switch to sheet 0, undo
  if (sheets > 1) {
    await page.evaluate(() => { switchSheet(1); }); await page.waitForTimeout(200);
    const w0 = await ST();
    await page.evaluate(() => { const n = S.nodes.find(x => x.type !== 'top'); n.x += 60; render(); }); await page.waitForTimeout(300);
    await page.evaluate(() => { switchSheet(0); }); await page.waitForTimeout(200);
    await key('Control+z');
    const now = JSON.parse(await ST());
    if (now.c !== 1) fail('W: undo did not return to the sheet where the change was made');
    if (JSON.stringify(now.s) !== JSON.stringify(JSON.parse(w0).s)) fail('W: undo across a sheet switch did not restore the change');
  }
  // M and V (added after the g3 acceptance REJECT D1): a real member-row drag to another card is one undo step right
  // away (no extra click), and Ctrl+Z while the edit dialog is open (focus on the page body) does not undo the chart
  await load('__PAGE__');
  await page.evaluate(() => { ADMIN = true; applyRO(); switchSheet(0); OPT.wrapN = 0; render(); doZoomAbs(100); });
  await page.waitForTimeout(300);
  const mm = await page.evaluate(() => { const ns = S.nodes.filter(n => (n.m || []).length >= 2); const a = ns[0], b = ns.find(n => n.id !== a.id && Math.abs(n.y - a.y) < 400) || ns[1];
    document.getElementById('n' + a.id).scrollIntoView({ block: 'center', inline: 'center' }); return { a: a.id, b: b.id }; });
  await page.waitForTimeout(400);
  const m0 = await ST();
  try { await page.dragAndDrop('#n' + mm.a + ' .mr[data-mi="0"]', '#n' + mm.b + ' .mr[data-mi="0"]'); } catch (e) { fail('M: drag failed ' + String(e).slice(0, 80)); }
  await page.waitForTimeout(400);
  const m1 = await ST();
  if (m1 === m0) fail('M: sanity - the member drag did not move the member');
  else {
    const ub = await page.evaluate(() => { const u = document.getElementById('btn-undo'); return !!u && !u.disabled; });
    if (!ub) fail('M: undo button still disabled right after a member drag');
    await page.keyboard.press('Control+z'); await page.waitForTimeout(250);
    if (await ST() !== m0) fail('M: Ctrl+Z right after a member drag did not undo it');
  }
  await page.evaluate(() => { const n = S.nodes.find(x => x.type !== 'top'); n.x += 40; render(); }); await page.waitForTimeout(300);
  const v0 = await ST();
  await page.evaluate(() => { const n = S.nodes.find(x => x.type !== 'top'); openEdit(n.id); }); await page.waitForTimeout(200);
  const tb2 = await page.evaluate(() => { const r = document.getElementById('mtitle').getBoundingClientRect(); return { x: r.left + 5, y: r.top + r.height / 2 }; });
  await page.mouse.click(tb2.x, tb2.y); await page.keyboard.press('Control+z'); await page.waitForTimeout(250);
  if (await ST() !== v0) fail('V: Ctrl+Z with the edit dialog open undid the chart');
  await page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });
  if (out.errors.length) fail('E: page errors ' + out.errors.slice(0, 2).join(' | '));
  out.RESULT = out.fails.length ? 'RED' : 'GREEN';
  return JSON.stringify(out);
}