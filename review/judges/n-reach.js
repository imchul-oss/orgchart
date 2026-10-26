async page => {
  const AFTER = __OWNER20__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 40) out.fails.push(m); };
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const s0 = await page.evaluate(A => { try{localStorage.clear();}catch(e){} window.alert = () => {}; window.confirm = () => true;
    const d = JSON.parse(JSON.stringify(A)); const base = d.sheets[0];
    for (let i = 1; i <= 11; i++) d.sheets.push(Object.assign(JSON.parse(JSON.stringify(base)), { name: '긴 시트 이름 ' + i }));
    loadObject(d, false); if (CUR_SHEET !== 0) switchSheet(0); ADMIN = true; applyRO(); render(); if (typeof renderSheetBar === 'function') renderSheetBar();
    const sb = document.getElementById('sheetbar'), r = sb.getBoundingClientRect();
    return { n: sb.querySelectorAll('.sht').length, over: sb.scrollWidth - sb.clientWidth, x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, AFTER);
  await page.mouse.move(s0.x, s0.y);
  const wh = [];
  for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 240); await page.waitForTimeout(60); wh.push(await page.evaluate(() => document.getElementById('sheetbar').scrollLeft)); }
  const h1 = await page.evaluate(() => { const sb = document.getElementById('sheetbar'), t = [...sb.querySelectorAll('.sht')].pop(); return { sl: sb.scrollLeft, last: Math.round(t.getBoundingClientRect().right), right: Math.round(sb.getBoundingClientRect().right) }; });
  const m = await page.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const named = e => !!(e.getAttribute('aria-label') || (e.labels && e.labels.length) || e.getAttribute('aria-labelledby') || e.title);
    const vis = e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
    const scan = async (ovId, open, close) => { open(); await wait(150); const ov = document.getElementById(ovId);
      const focusIn = !!(document.activeElement && ov.contains(document.activeElement) && document.activeElement !== ov);
      const ctl = [...ov.querySelectorAll('input,select,textarea')].filter(e => e.type !== 'hidden' && vis(e));
      const bad = ctl.filter(e => !named(e)).slice(0, 8).map(e => e.tagName + '#' + (e.id || '') + '.' + e.className + ' ' + (e.parentElement.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30));
      const lblBad = [];
      [...ov.querySelectorAll('.opt-lbl,.fl')].filter(vis).forEach(l => { const row = l.closest('.opt-row,.fg'); if (!row) return;
        const c = [...row.querySelectorAll('input,select,textarea')].find(e => e.type !== 'hidden' && vis(e)); if (!c || c.closest('.mer')) return;  // 소속 멤버 is a list heading, not a field label
        document.activeElement && document.activeElement.blur && document.activeElement.blur();
        if (c.type === 'checkbox') { const was = c.checked; l.click(); const ok = c.checked !== was; if (ok) l.click(); if (!ok) lblBad.push(l.textContent.trim().slice(0, 20)); }
        else { l.click(); if (document.activeElement !== c) lblBad.push(l.textContent.trim().slice(0, 20)); } });
      close(); await wait(80);
      return { focusIn, n: ctl.length, bad, nbad: ctl.filter(e => !named(e)).length, lblBad }; };
    const o = await scan('optov', openOptions, closeOptions);
    const d = await scan('dataov', openData, closeData);
    const e = await scan('ov', () => openEdit(S.nodes.find(n => (n.m||[]).length > 1).id), closeModal);
    return { o, d, e }; });
  out.info = { s0, wh, h1, m };
  const J = JSON.stringify;
  if (!(s0.over > 0) || !(wh[0] > 0) || h1.last > h1.right + 1) fail('H1 sheet tabs by wheel ' + J({ s0, wh: wh.slice(0, 3), h1 }));
  ['o', 'd', 'e'].forEach(k => { const x = m[k]; if (!x.focusIn) fail('M6 ' + k + ' focus not inside'); if (x.nbad) fail('M5 ' + k + ' unnamed ' + x.nbad + ' ' + J(x.bad)); if (x.lblBad.length) fail('M5 ' + k + ' label click ' + J(x.lblBad)); });
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}