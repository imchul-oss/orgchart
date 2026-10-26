async page => {
  const AFTER = __OWNER20__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 40) out.fails.push(m); };
  const J = JSON.stringify;
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  await page.evaluate(A => { try{localStorage.clear();}catch(e){} window.alert = () => {}; window.confirm = () => true;
    loadObject(JSON.parse(JSON.stringify(A)), false); if (CUR_SHEET !== 0) switchSheet(0); ADMIN = true; applyRO(); render(); }, AFTER);
  await page.click('#btn-tree'); await page.waitForTimeout(150);
  // fold the first foldable row that is not the root, then scroll the list body to its end
  const prep = await page.evaluate(() => { const tv = document.getElementById('treeview'); const body = tv.querySelector('.tv-body');
    const tg = [...tv.querySelectorAll('.tv-row')].filter(r => r.querySelector('.tv-tog') && r.getAttribute('data-depth') !== '0');
    const fid = tg.length > 1 ? tg[tg.length - 1].getAttribute('data-id') : null; if (fid) tg[tg.length - 1].querySelector('.tv-tog').click();
    [...tv.querySelectorAll('.tv-row')].slice(0, 6).forEach(r => { const c = r.getAttribute('data-id'); if (r.querySelector('.tv-cnt')) TV.mem.add(c); }); tvBuild();  // open a few member lists so the list scrolls
    const b2 = tv.querySelector('.tv-body'); b2.scrollTop = b2.scrollHeight;
    const rows = [...tv.querySelectorAll('.tv-row')].filter(r => r.style.display !== 'none');
    const vis = rows.filter(r => { const rb = r.getBoundingClientRect(), bb = b2.getBoundingClientRect(); return rb.top >= bb.top && rb.bottom <= bb.bottom; });
    const pick = vis[vis.length - 1], pick2 = vis[Math.max(0, vis.length - 3)];
    return { fid, st: b2.scrollTop, a: pick && pick.getAttribute('data-id'), b: pick2 && pick2.getAttribute('data-id'), n: rows.length, sh: b2.scrollHeight, ch: b2.clientHeight }; });
  out.info.prep = prep;
  if (!prep.a || !(prep.st > 0)) fail('setup: list did not scroll or no row ' + J(prep));
  const clickRow = async id => { await page.click(`#treeview .tv-row[data-id="${id}"] .tv-title`, { timeout: 2000 }).catch(e => fail('click row ' + id + ' failed: ' + String(e).slice(0, 60))); await page.waitForTimeout(250); };
  await clickRow(prep.a);
  const s1 = await page.evaluate(([id, fid]) => { const tv = document.getElementById('treeview'); const b = tv.querySelector('.tv-body');
    const sel = [...tv.querySelectorAll('.tv-row.tv-sel')].map(r => r.getAttribute('data-id'));
    const cur = [...tv.querySelectorAll('.tv-row[aria-current="true"]')].map(r => r.getAttribute('data-id'));
    const el = document.getElementById('n' + id), w = document.getElementById('wrap');
    const cb = el ? el.getBoundingClientRect() : null, wb = w.getBoundingClientRect(), tb = tv.getBoundingClientRect();
    return { open: tv.classList.contains('tv-open') && getComputedStyle(tv).display !== 'none', sel, cur, st: b.scrollTop,
      folded: fid ? TV.fold.has(fid) : null, flash: !!(el && el.classList.contains('lint-flash')),
      cx: cb ? cb.left + cb.width / 2 : null, cy: cb ? cb.top + cb.height / 2 : null, L: tb.right, R: wb.left + w.clientWidth, T: wb.top, B: wb.top + w.clientHeight }; }, [prep.a, prep.fid]);
  out.info.s1 = s1;
  if (!s1.open) fail('T1 list closed after clicking a row');
  if (J(s1.sel) !== J([prep.a]) || J(s1.cur) !== J([prep.a])) fail('T1 selection ' + J({ sel: s1.sel, cur: s1.cur, want: prep.a }));
  if (s1.cx == null || !(s1.cx > s1.L && s1.cx < s1.R && s1.cy > s1.T && s1.cy < s1.B)) fail('T1 card centre not in the uncovered canvas ' + J(s1));
  if (!s1.flash) fail('T1 card does not flash');
  if (Math.abs(s1.st - prep.st) > 2) fail('T2 list scroll moved ' + prep.st + ' -> ' + s1.st);
  if (prep.fid && s1.folded !== true) fail('T2 folded row reopened');
  if (prep.b && prep.b !== prep.a) { await clickRow(prep.b);
    const s2 = await page.evaluate(() => [...document.querySelectorAll('#treeview .tv-row.tv-sel')].map(r => r.getAttribute('data-id')));
    out.info.s2 = s2; if (J(s2) !== J([prep.b])) fail('T3 selection did not move ' + J(s2)); }
  const closed = async () => page.evaluate(() => !document.getElementById('treeview').classList.contains('tv-open'));
  await page.evaluate(() => { if (!TV.open) tvOpen(); }); await page.click('#treeview .tv-close'); await page.waitForTimeout(100); const c1 = await closed();
  await page.click('#btn-tree'); await page.waitForTimeout(100); await page.keyboard.press('Escape'); await page.waitForTimeout(100); const c2 = await closed();
  await page.click('#btn-tree'); await page.waitForTimeout(100); await page.click('#btn-tree'); await page.waitForTimeout(100); const c3 = await closed();
  out.info.close = [c1, c2, c3]; if (!(c1 && c2 && c3)) fail('T4 close paths ' + J([c1, c2, c3]));
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}