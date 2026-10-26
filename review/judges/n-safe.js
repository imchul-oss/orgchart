async page => {
  const AFTER = __OWNER20__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 40) out.fails.push(m); };
  const J = JSON.stringify;
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  await page.evaluate(A => { try{localStorage.clear();}catch(e){} window.alert = () => {};
    window.__cq = []; window.__cv = true; window.confirm = m => { window.__cq.push(String(m)); return window.__cv; };
    loadObject(JSON.parse(JSON.stringify(A)), false); if (CUR_SHEET !== 0) switchSheet(0); ADMIN = true; applyRO(); render(); _hReset(); }, AFTER);
  // ---- M3
  const nid = await page.evaluate(() => { const n = S.nodes.find(n => (n.m||[]).length > 1); return n.id; });
  const open = async () => { await page.evaluate(id => { window.__cq = []; openEdit(id); }, nid); await page.waitForTimeout(120); };
  const st = () => page.evaluate(id => ({ open: document.getElementById('ov').classList.contains('show'), asked: window.__cq.length, q: window.__cq[0] || '',
    en: S.nodes.find(n => n.id === id).en, inp: (document.getElementById('ei-en') || {}).value }), nid);
  const how = { esc: async () => { await page.keyboard.press('Escape'); }, x: async () => { await page.evaluate(() => document.querySelector('#ov .mcl').click()); }, cancel: async () => { await page.evaluate(() => document.querySelector('#ov .bca').click()); } };
  const m3 = {};
  for (const k of Object.keys(how)) {
    await open(); await how[k](); await page.waitForTimeout(100); const clean = await st();
    await open(); await page.click('#ei-en'); await page.keyboard.press('End'); await page.keyboard.type('X'); await page.keyboard.press('Backspace'); await how[k](); await page.waitForTimeout(100); const back = await st();
    await open(); const en0 = (await st()).en; await page.click('#ei-en'); await page.keyboard.press('End'); await page.keyboard.type(' 고침');
    await page.evaluate(() => { window.__cv = false; }); await how[k](); await page.waitForTimeout(100); const no = await st();
    await page.evaluate(() => { window.__cv = true; window.__cq = []; }); await how[k](); await page.waitForTimeout(100); const yes = await st();
    m3[k] = { clean, back, no, yes, en0 };
    if (clean.open || clean.asked) fail('M3 ' + k + ' clean ' + J(clean));
    if (back.open || back.asked) fail('M3 ' + k + ' typed back ' + J(back));
    if (!no.open || no.asked !== 1 || !/고침$/.test(no.inp || '')) fail('M3 ' + k + ' changed, answer no ' + J(no));
    if (yes.open || yes.asked !== 1 || yes.en !== en0) fail('M3 ' + k + ' changed, answer yes ' + J(yes));
  }
  await open(); await page.evaluate(() => { const s = document.querySelector('#mlist .mer select'); const o = [...s.options].find(o => o.value !== s.value); s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); window.__cv = false; });
  await page.keyboard.press('Escape'); await page.waitForTimeout(100); const mst = await st();
  if (!mst.open || mst.asked !== 1) fail('M3 member status change not asked ' + J(mst));
  await page.evaluate(() => { window.__cv = true; window.__cq = []; closeModal(); });
  await open(); await page.click('#ei-en'); await page.keyboard.type('Z'); await page.click('#ov .bsv'); await page.waitForTimeout(150); const sv = await st();
  if (sv.open || sv.asked) fail('M3 save asked or stayed open ' + J(sv));
  // ---- U1
  await page.evaluate(() => { _hReset(); });
  const cb = await page.evaluate(() => { const r = document.getElementById('wrap').getBoundingClientRect(); return { x: r.left + 6, y: r.bottom - 6 }; });
  await page.mouse.click(cb.x, cb.y); await page.waitForTimeout(150);
  const phantom = await page.evaluate(() => document.getElementById('btn-undo').disabled);
  if (!phantom) fail('U1 undo enabled after a plain click (phantom step)');
  const pos = () => page.evaluate(() => S.nodes.map(n => n.x + ',' + n.y).join(' '));
  const u1 = {};
  const steps = [
    { k: 'colGap', set: () => { const e = document.getElementById('opt-cg'); e.value = 120; e.dispatchEvent(new Event('input', { bubbles: true })); }, ui: 'opt-cg' },
    { k: 'fsMn', set: () => { const e = document.getElementById('opt-fsmn'); e.value = 16; e.dispatchEvent(new Event('input', { bubbles: true })); }, ui: 'opt-fsmn' },
    { k: 'connSolid', set: () => { applyColor('connSolid', '--conn-solid', '#123456'); } } ];
  for (const s of steps) {
    await page.evaluate(() => { openOptions(); _hReset(); });
    const p0 = await pos(), v0 = await page.evaluate(k => OPT[k], s.k);
    await page.evaluate(s.set); await page.waitForTimeout(700);
    await page.evaluate(() => { document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); }); await page.waitForTimeout(100);
    const p1 = await pos(), v1 = await page.evaluate(k => OPT[k], s.k), en = await page.evaluate(() => !document.getElementById('btn-undo').disabled);
    await page.evaluate(() => undoEdit()); await page.waitForTimeout(500);
    const p2 = await pos(), v2 = await page.evaluate(k => OPT[k], s.k), ui2 = s.ui ? await page.evaluate(id => +document.getElementById(id).value, s.ui) : null;
    await page.evaluate(() => redoEdit()); await page.waitForTimeout(500);
    const p3 = await pos(), v3 = await page.evaluate(k => OPT[k], s.k);
    await page.evaluate(() => closeOptions());
    u1[s.k] = { v0, v1, v2, v3, ui2, en, moved: p1 !== p0, back: p2 === p0, fwd: p3 === p1 };
    if (!en || v2 !== v0 || v3 !== v1 || p2 !== p0 || p3 !== p1 || (s.ui && ui2 !== +v0)) fail('U1 ' + s.k + ' ' + J(u1[s.k]));
  }
  if (!u1.colGap.moved) fail('U1 colGap change did not move cards (judge setup)');
  // ---- U1b (UIUX ORGV r1 B1, round 2): at 1920 after the edit window was opened and closed, options spacing 120 / undo / redo /
  // undo, then 이름 글자 15 (input + change, 450ms, click at 5,300): ONE undo brings the font back to 11 with the layout that
  // autoLayout gives for it; a real mouse drag of the slider (11 -> 14 -> 17 -> 20 with pauses) is also one undo step.
  await page.setViewportSize({ width: 1920, height: 1080 }); await page.waitForTimeout(200);
  await page.evaluate(() => { closeOptions(); _hReset(); window.__cv = true; });
  await open(); await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  await open(); await page.click('#ei-en'); await page.keyboard.type('Q'); await page.evaluate(() => { window.__cv = true; }); await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  const snapB = () => page.evaluate(() => ({ cg: OPT.colGap, fs: OPT.fsMn, xy: S.nodes.map(n => Math.round(n.x) + ',' + Math.round(n.y)).join('|') }));
  const setRange = async (sel, v) => { await page.evaluate(([sel, v]) => { const e = document.querySelector(sel); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [sel, v]); await page.waitForTimeout(450); await page.mouse.click(5, 300); await page.waitForTimeout(150); };
  await page.evaluate(() => openOptions()); await page.waitForTimeout(300);
  await setRange('#opt-cg', '120');
  await page.evaluate(() => undoEdit()); await page.waitForTimeout(450);
  await page.evaluate(() => redoEdit()); await page.waitForTimeout(450);
  await page.evaluate(() => undoEdit()); await page.waitForTimeout(450);
  if (!(await page.evaluate(() => document.getElementById('optov').classList.contains('show')))) { await page.evaluate(() => openOptions()); await page.waitForTimeout(300); }
  const bf0 = await snapB();
  await setRange('#opt-fsmn', String(bf0.fs + 6));
  const bf1 = await snapB();
  await page.evaluate(() => undoEdit()); await page.waitForTimeout(450);
  const bf2 = await snapB();
  const bcons = await page.evaluate(() => { const xy = () => S.nodes.map(n => Math.round(n.x) + ',' + Math.round(n.y)).join('|'); const keep = S.nodes.map(n => [n.x, n.y]); const a = xy(); autoLayout(); const same = a === xy(); S.nodes.forEach((n, i) => { n.x = keep[i][0]; n.y = keep[i][1]; }); render(); _hReset(); return same; });
  const u1b = { f0: bf0.fs, f1: bf1.fs, f2: bf2.fs, back: bf2.xy === bf0.xy, cons: bcons };
  if (bf1.fs !== bf0.fs + 6 || bf2.fs !== bf0.fs || !u1b.back || !bcons) fail('U1b font after edit window: one undo ' + J(u1b));
  // U1c (the B1 mechanism): one 이름 글자 input (input + change), 450ms later: no undo step may hold the new size (a step with
  // the new size and the old layout is what made the first undo split option and layout)
  const u1c = await page.evaluate(async A => { closeOptions(); loadObject(JSON.parse(JSON.stringify(A)), false); if (CUR_SHEET !== 0) switchSheet(0); ADMIN = true; applyRO(); render(); openOptions(); _hReset();  // fresh load: the owner file's own font size
    const e = document.getElementById('opt-fsmn'), v0 = +e.value, v1 = v0 + 6;  // big enough to change the row height (the owner file starts at 16; 16 -> 15 keeps the layout)
    e.value = v1; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 450)); document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); await new Promise(r => setTimeout(r, 500));
    const st = _hUndo.map(h => JSON.parse(h.o).fsMn); undoEdit(); await new Promise(r => setTimeout(r, 300)); return { v0, v1, stack: st, after: OPT.fsMn }; }, AFTER);
  if (u1c.stack.includes(u1c.v1) || u1c.stack.length !== 1 || u1c.after !== u1c.v0) fail('U1c font input leaves a half step ' + J(u1c));
  out.info.u1c = u1c;
  // U1n (UIUX ORGV r2 N1): empty history, a colour change in the options window, within 0.1s the toolbar undo button is enabled
  // and pressing it brings the colour back
  const u1n = await page.evaluate(async A => { closeOptions(); loadObject(JSON.parse(JSON.stringify(A)), false); if (CUR_SHEET !== 0) switchSheet(0); ADMIN = true; applyRO(); render(); openOptions(); _hReset();
    const ins = [...document.querySelectorAll('#opt-line-colors input')], c = ins.find(i => i.type === 'color') || ins[0], v0 = OPT.connSolid;
    c.value = '#aa2200'; c.dispatchEvent(new Event('input', { bubbles: true })); c.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 100)); const b = document.getElementById('btn-undo'), dis = b.disabled, changed = OPT.connSolid; b.click();
    await new Promise(r => setTimeout(r, 300)); return { v0, changed, dis, after: OPT.connSolid }; }, AFTER);
  out.info.u1n = u1n;
  if (u1n.dis || !/aa2200/i.test(u1n.changed) || u1n.after !== u1n.v0) fail('U1n undo button right after an option change ' + J(u1n));
  // real mouse drag of the 이름 글자 slider
  await page.evaluate(() => { if (!document.getElementById('optov').classList.contains('show')) openOptions(); document.querySelector('#optov .opt-sec[data-sec="font"]').classList.remove('collapsed'); _hReset(); });
  await page.waitForTimeout(200);
  const sl = await page.evaluate(() => { const e = document.getElementById('opt-fsmn'); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top + r.height / 2, w: r.width, min: +e.min, max: +e.max, v: +e.value }; });
  const xOf = v => sl.x + 8 + (sl.w - 16) * (v - sl.min) / (sl.max - sl.min);
  const d0 = await snapB();
  await page.mouse.move(xOf(sl.v), sl.y); await page.mouse.down();
  for (const v of [14, 17, 20]) { await page.mouse.move(xOf(v), sl.y, { steps: 4 }); await page.waitForTimeout(500); }
  await page.mouse.up(); await page.waitForTimeout(700);
  const d1 = await snapB(); await page.evaluate(() => undoEdit()); await page.waitForTimeout(450); const d2 = await snapB();
  const u1d = { f0: d0.fs, f1: d1.fs, f2: d2.fs, back: d2.xy === d0.xy };
  if (!(d1.fs > d0.fs) || d2.fs !== d0.fs || !u1d.back) fail('U1b slider drag: one undo ' + J(u1d));
  out.info.u1b = { u1b, u1d };
  await page.evaluate(() => closeOptions()); await page.setViewportSize({ width: 1366, height: 768 }); await page.waitForTimeout(200);
  // ---- M7
  const m7 = await page.evaluate(() => {
    const r = {}; _hReset(); openData();
    const ri = OPT.roleCats.indexOf('킈쮀') >= 0 ? OPT.roleCats.indexOf('킈쮀') : 0, rn = OPT.roleCats[ri];
    window.__cq = []; window.__cv = false; removeCat('role', ri); r.roleNo = { asked: window.__cq.length, q: window.__cq[0] || '', kept: OPT.roleCats[ri] === rn };
    window.__cq = []; window.__cv = true; removeCat('role', ri); document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    r.roleYes = { asked: window.__cq.length, gone: !OPT.roleCats.includes(rn) };
    return new Promise(res => setTimeout(() => { undoEdit(); r.roleUndo = OPT.roleCats.includes(rn);
      const si = OPT.statusItems.findIndex(x => x.key === 'onleave'), sl = OPT.statusItems[si].label, gi = OPT.statsGroups.findIndex(g => g.statuses.includes('onleave'));
      window.__cq = []; window.__cv = false; removeStatusCat(si); r.stNo = { asked: window.__cq.length, q: window.__cq[0] || '', sl, kept: OPT.statusItems.some(x => x.key === 'onleave') };
      window.__cq = []; window.__cv = true; removeStatusCat(si); document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      r.stYes = { gone: !OPT.statusItems.some(x => x.key === 'onleave') };
      setTimeout(() => { undoEdit(); r.stUndo = { item: OPT.statusItems.some(x => x.key === 'onleave'), grp: gi < 0 || OPT.statsGroups[gi].statuses.includes('onleave') };
        const gn = OPT.statsGroups.length;
        window.__cq = []; window.__cv = false; removeSg(0); r.sgNo = { asked: window.__cq.length, kept: OPT.statsGroups.length === gn, q: window.__cq[0] || '' };
        window.__cq = []; window.__cv = true; removeSg(0); document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        setTimeout(() => { r.sgYes = OPT.statsGroups.length === gn - 1; undoEdit(); r.sgUndo = OPT.statsGroups.length === gn; closeData(); res(r); }, 50); }, 50); }, 50)); });
  if (m7.roleNo.asked !== 1 || !m7.roleNo.kept) fail('M7 role delete not asked/kept ' + J(m7.roleNo));
  if (!m7.roleYes.gone || !m7.roleUndo) fail('M7 role delete/undo ' + J({ y: m7.roleYes, u: m7.roleUndo }));
  if (m7.stNo.asked !== 1 || !m7.stNo.kept || m7.stNo.q.indexOf(m7.stNo.sl) < 0 || !/\d+명/.test(m7.stNo.q) || !/현황/.test(m7.stNo.q)) fail('M7 status question ' + J(m7.stNo));
  if (!m7.stYes.gone || !m7.stUndo.item || !m7.stUndo.grp) fail('M7 status delete/undo ' + J({ y: m7.stYes, u: m7.stUndo }));
  if (m7.sgNo.asked !== 1 || !m7.sgNo.kept || !/\d+명/.test(m7.sgNo.q) || !m7.sgYes || !m7.sgUndo) fail('M7 group delete ' + J(m7));
  out.info = Object.assign(out.info, { m3, u1, m7, phantom });
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}