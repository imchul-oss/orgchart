async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: { v: [] } };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  async function load(url, keepLS) {
    await page.goto(url); await page.waitForTimeout(500);
    await page.evaluate(([d, keep]) => { if (!keep) { try { localStorage.clear(); } catch (e) {} } _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(_hasPositions(S.nodes)); }, [DOC, !!keepLS]);
    await page.waitForTimeout(300);
  }
  const SNAP = () => ({ pos: S.nodes.map(n => n.id + ':' + n.x + ',' + n.y).sort(),
    paths: Array.prototype.map.call(document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash'), p => p.getAttribute('class') + '|' + p.getAttribute('d').replace(/\s+/g, ' ').trim()).sort() });
  // R
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
  // V
  for (const [W, H] of [[1600, 900], [1280, 720], [1920, 1080]]) {
    await page.setViewportSize({ width: W, height: H });
    for (let s = 0; s < sheets; s++) {
      await load('__PAGE__');
      const r = await page.evaluate(async s => {
        switchSheet(s); OPT.wrapN = 0; autoLayout(); render(); fitScreen();
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const w = document.getElementById('wrap').getBoundingClientRect();
        const pnl = document.getElementById('statsfl'); const pr = pnl.getBoundingClientRect();
        const shown = getComputedStyle(pnl).display !== 'none' && pr.height > 0;
        const out = [], hit = [];
        S.nodes.forEach(n => { const el = document.getElementById('n' + n.id); if (!el) { out.push(n.id + ':missing'); return; } const b = el.getBoundingClientRect();
          if (b.left < w.left - 1 || b.right > w.right + 1 || b.top < w.top - 1 || b.bottom > w.bottom + 1) out.push(n.id);
          if (shown && b.left < pr.right && b.right > pr.left && b.top < pr.bottom && b.bottom > pr.top) hit.push(n.id); });
        return { shown, collapsed: pnl.classList.contains('collapsed'), out, hit, n: S.nodes.length };
      }, s);
      const tag = W + 'x' + H + ' sheet ' + s;
      out.info.v.push(tag + ' collapsed=' + r.collapsed);
      if (!r.shown) fail('V: stats panel not displayed ' + tag);
      if (r.out.length) fail('V: ' + r.out.length + ' of ' + r.n + ' cards outside the visible area ' + tag);
      if (r.hit.length) fail('V: ' + r.hit.length + ' cards under the stats panel ' + tag);
    }
  }
  // V2 (added after g1, before g2): the load path and the 자동 배치 path (autoLayout() scrolls in a requestAnimationFrame)
  for (const [W, H] of [[1600, 900], [1280, 720], [1920, 1080]]) {
    await page.setViewportSize({ width: W, height: H });
    for (let s = 0; s < sheets; s++) for (const how of ['load', 'auto']) {
      await load('__PAGE__');
      const r = await page.evaluate(async ([s, how]) => {
        const fr = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        if (s) { switchSheet(s); await fr(); }
        if (how === 'auto') { autoLayout(); }
        await fr(); await new Promise(r => setTimeout(r, 100));
        const pnl = document.getElementById('statsfl'); const pr = pnl.getBoundingClientRect();
        const shown = getComputedStyle(pnl).display !== 'none' && pr.height > 0; const hit = [];
        S.nodes.forEach(n => { const el = document.getElementById('n' + n.id); if (!el) return; const b = el.getBoundingClientRect();
          if (shown && b.left < pr.right && b.right > pr.left && b.top < pr.bottom && b.bottom > pr.top) hit.push(n.id); });
        return { shown, hit };
      }, [s, how]);
      const tag = W + 'x' + H + ' sheet ' + s + ' ' + how;
      if (!r.shown) fail('V2: stats panel not displayed ' + tag);
      if (r.hit.length) fail('V2: ' + r.hit.length + ' cards under the stats panel ' + tag);
    }
  }
  await page.setViewportSize({ width: 1600, height: 1000 });
  // T
  await load('__PAGE__');
  const st = () => page.evaluate(() => { const p = document.getElementById('statsfl'); const b = document.getElementById('statsfl-body'), t = document.getElementById('statsfl-tabs');
    return { tog: !!document.getElementById('statsfl-tog'), col: p.classList.contains('collapsed'), bodyShown: !!b && getComputedStyle(b).display !== 'none' && b.getBoundingClientRect().height > 0,
      tabsShown: !!t && getComputedStyle(t).display !== 'none', h: p.getBoundingClientRect().height, shown: getComputedStyle(p).display !== 'none' }; });
  let a = await st();
  if (!a.tog) fail('T: no #statsfl-tog button');
  else {
    if (a.col || !a.bodyShown) fail('T: panel not expanded on a fresh load ' + JSON.stringify(a));
    await page.click('#statsfl-tog'); await page.waitForTimeout(100);
    let b = await st();
    if (!b.col || b.bodyShown || b.tabsShown || b.h >= 60 || !b.shown) fail('T: collapse did not work ' + JSON.stringify(b));
    await load('__PAGE__', true); b = await st();
    if (!b.col) fail('T: collapsed state lost after reload');
    await page.click('#statsfl-tog'); await page.waitForTimeout(100); b = await st();
    if (b.col || !b.bodyShown) fail('T: expand did not work ' + JSON.stringify(b));
    await load('__PAGE__', true); b = await st();
    if (b.col) fail('T: expanded state lost after reload');
    // storage throwing: on a separate page so the init script does not leak into later runs of this browser
    const p2 = await page.context().newPage();
    const errs2 = []; p2.on('pageerror', e => errs2.push(String(e)));
    await p2.addInitScript(() => { const thr = () => { throw new Error('blocked'); }; try { Object.defineProperty(window, 'localStorage', { get: thr, configurable: true }); } catch (e) {} });
    await p2.goto('__PAGE__'); await p2.waitForTimeout(500);
    await p2.evaluate(d => { _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(_hasPositions(S.nodes)); }, DOC);
    await p2.waitForTimeout(300);
    const st2 = () => p2.evaluate(() => { const p = document.getElementById('statsfl'); return { col: p.classList.contains('collapsed'), shown: getComputedStyle(p).display !== 'none' }; });
    b = await st2();
    if (!b.shown) fail('T: panel not shown when storage throws');
    try { await p2.click('#statsfl-tog'); await p2.waitForTimeout(100); const c = await st2(); if (!c.col) fail('T: toggle does nothing when storage throws'); } catch (e) { fail('T: toggle failed when storage throws ' + String(e).slice(0, 80)); }
    const bad2 = errs2.filter(e => !/blocked/.test(e)); if (bad2.length) fail('E: page errors with storage blocked ' + bad2.slice(0, 2).join(' | '));
    await p2.close();
  }
  if (out.errors.filter(e => !/blocked/.test(e)).length) fail('E: page errors ' + out.errors.filter(e => !/blocked/.test(e)).slice(0, 2).join(' | '));
  out.RESULT = out.fails.length ? 'RED' : 'GREEN';
  return JSON.stringify(out);
}