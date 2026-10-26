async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  async function load(url) {
    await page.goto(url); await page.waitForTimeout(500);
    await page.evaluate(d => { try { localStorage.clear(); } catch (e) {} _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(_hasPositions(S.nodes)); switchSheet(0); OPT.wrapN = 0; OPT.orient = 'down'; autoLayout(); render(); }, DOC);
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
  const vis = sel => page.evaluate(sel => { const e = document.querySelector(sel); if (!e) return false; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0; }, sel);
  const clickSel = async (sel) => { const r = await page.evaluate(sel => { const e = document.querySelector(sel); if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2, b.width > 0]; }, sel); if (!r || !r[2]) return false; await page.mouse.click(r[0], r[1]); await page.waitForTimeout(250); return true; };
  // expected order and depths from the down layout
  const EXP = () => {
    const side = new Set(S.nodes.filter(n => n.type === 'side').map(n => n.id));
    const kids = {}, par = {}; const by = {}; S.nodes.forEach(n => by[n.id] = n);
    S.conns.filter(c => !side.has(c.f) && !side.has(c.t)).forEach(c => { if (par[c.t] === undefined && by[c.f] && by[c.t]) { par[c.t] = c.f; (kids[c.f] = kids[c.f] || []).push(c.t); } });
    for (const p in kids) kids[p].sort((a, b) => (by[a].x - by[b].x) || (by[a].y - by[b].y));
    const root = S.nodes.find(n => n.type === 'top' && par[n.id] === undefined) || S.nodes.find(n => par[n.id] === undefined);
    const order = [], depth = {}; (function walk(id, d) { if (depth[id] !== undefined) return; depth[id] = d; order.push(id); (kids[id] || []).forEach(k => walk(k, d + 1)); })(root.id, 0);
    const defKey = (OPT.statusItems[0] || {}).key; const excl = new Set(OPT.statsGroups.filter(g => g.excludeTotal).flatMap(g => g.statuses));
    const info = {}; S.nodes.forEach(n => info[n.id] = { t: n.en || n.ko, /* amended 2026-10-20 (ORGCHART-TITLE): the tree title is the team name, en first; .pre-title keeps the old form */ cnt: (n.m || []).filter(m => !excl.has(m.s || defKey)).length, mem: (n.m || []).map(m => m.n), kids: kids[n.id] || [] });
    return { order, depth, info, all: S.nodes.map(n => n.id) };
  };
  const ROWS = () => [...document.querySelectorAll('#treeview .tv-row')].map(r => { const t = r.querySelector('.tv-title'), c = r.querySelector('.tv-cnt'); const cs = getComputedStyle(r);
    return { id: r.getAttribute('data-id'), depth: r.getAttribute('data-depth'), title: t ? t.textContent.trim() : null, tl: t ? t.getBoundingClientRect().left : null, cnt: c ? c.textContent : '', tog: !!r.querySelector('.tv-tog'), shown: cs.display !== 'none' && r.getBoundingClientRect().height > 0 }; });
  for (let s = 0; s < sheets; s++) {
    await load('__PAGE__');
    await page.evaluate(s => switchSheet(s), s);
    const e = await page.evaluate(EXP);
    if (!await clickSel('#btn-tree')) { fail('V: no clickable #btn-tree'); break; }
    if (!await vis('#treeview')) { fail('V: #treeview not shown after clicking #btn-tree'); break; }
    const geo = await page.evaluate(() => { const r = document.getElementById('treeview').getBoundingClientRect(); const tb = document.getElementById('topbar').getBoundingClientRect(); return { r: [r.left, r.top, r.right, r.bottom], tb: tb.bottom, pos: getComputedStyle(document.getElementById('treeview')).position, ro: document.body.classList.contains('ro') }; });
    if (geo.pos !== 'fixed') fail('V: #treeview is not position fixed');
    if (geo.r[1] < geo.tb - 1 || geo.r[0] < -1 || geo.r[2] > 1601 || geo.r[3] > 1001) fail('V: #treeview not inside the window below the topbar');
    const rows = await page.evaluate(ROWS);
    const ids = rows.map(r => r.id);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dup.length) fail('O: sheet ' + s + ' duplicate rows');
    const missing = e.all.filter(id => ids.indexOf(id) < 0); if (missing.length) fail('O: sheet ' + s + ' ' + missing.length + ' cards without a row');
    if (JSON.stringify(ids.slice(0, e.order.length)) !== JSON.stringify(e.order)) fail('O: sheet ' + s + ' main tree rows not in depth-first left-to-right order');
    let dbad = 0, ibad = 0; rows.forEach(r => { if (e.depth[r.id] !== undefined && String(e.depth[r.id]) !== r.depth) dbad++; });
    e.order.forEach(id => { e.info[id].kids.forEach(k => { const a = rows.find(r => r.id === id), b = rows.find(r => r.id === k); if (a && b && !(b.tl > a.tl + 4)) ibad++; }); });
    if (dbad) fail('O: sheet ' + s + ' ' + dbad + ' rows with a wrong data-depth');
    if (ibad) fail('O: sheet ' + s + ' ' + ibad + ' child rows not indented further than their parent');
    let tbad = 0, cbad = 0; rows.forEach(r => { const i = e.info[r.id]; if (!i) return; if (r.title !== String(i.t).trim()) tbad++; if (i.cnt > 0 && r.cnt.replace(/\s/g, '').indexOf(i.cnt + '명') < 0) cbad++; });
    if (tbad) fail('T: sheet ' + s + ' ' + tbad + ' rows with a wrong title');
    if (cbad) fail('T: sheet ' + s + ' ' + cbad + ' rows with a wrong or missing count');
    if (rows.some(r => !r.shown)) fail('O: sheet ' + s + ' some rows hidden at first');
    // F
    const p = e.order.find(id => e.info[id].kids.length && e.info[e.info[id].kids[0]].kids.length) || e.order.find(id => e.info[id].kids.length);
    const desc = []; (function d(id) { e.info[id].kids.forEach(k => { desc.push(k); d(k); }); })(p);
    if (!rows.find(r => r.id === p).tog) fail('F: parent row without .tv-tog');
    else {
      await clickSel('#treeview .tv-row[data-id="' + p + '"] .tv-tog');
      let r2 = await page.evaluate(ROWS); if (desc.some(id => (r2.find(r => r.id === id) || {}).shown)) fail('F: descendants still shown after folding');
      if (!(r2.find(r => r.id === p) || {}).shown) fail('F: the folded row itself disappeared');
      await clickSel('#treeview .tv-row[data-id="' + p + '"] .tv-tog');
      r2 = await page.evaluate(ROWS); if (desc.some(id => !(r2.find(r => r.id === id) || {}).shown)) fail('F: descendants not shown again after unfolding');
    }
    // M
    const mid = e.order.find(id => e.info[id].mem.length >= 2) || e.order.find(id => e.info[id].mem.length);
    if (mid) {
      const m0 = await page.evaluate(() => [...document.querySelectorAll('#treeview .tv-mem')].filter(x => getComputedStyle(x).display !== 'none' && x.getBoundingClientRect().height > 0).length);
      if (m0) fail('M: member rows shown at first');
      if (!await clickSel('#treeview .tv-row[data-id="' + mid + '"] .tv-cnt')) fail('M: no clickable .tv-cnt');
      else {
        const m1 = await page.evaluate(id => { const row = document.querySelector('#treeview .tv-row[data-id="' + id + '"]'); const got = []; let n = row.nextElementSibling;
          while (n && n.classList.contains('tv-mem')) { if (getComputedStyle(n).display !== 'none') got.push(n.textContent); n = n.nextElementSibling; } return got; }, mid);
        const want = e.info[mid].mem;
        if (m1.length !== want.length || want.some((w, i) => (m1[i] || '').indexOf(w) < 0)) fail('M: member rows after the row do not list its members in order (' + m1.length + '/' + want.length + ')');
        await clickSel('#treeview .tv-row[data-id="' + mid + '"] .tv-cnt');
        const m2 = await page.evaluate(() => [...document.querySelectorAll('#treeview .tv-mem')].filter(x => getComputedStyle(x).display !== 'none' && x.getBoundingClientRect().height > 0).length);
        if (m2) fail('M: member rows still shown after the second click');
      }
    }
    // S (sheet switch while open)
    if (sheets > 1) {
      await page.evaluate(s => switchSheet(s === 0 ? 1 : 0), s); await page.waitForTimeout(250);
      const e2 = await page.evaluate(EXP); const r3 = await page.evaluate(ROWS);
      if (!await vis('#treeview')) out.info['S' + s] = 'list closed on sheet switch';
      else if (JSON.stringify(r3.map(r => r.id).sort()) !== JSON.stringify(e2.all.slice().sort())) fail('S: rows not updated after switching sheets');
      await page.evaluate(s => switchSheet(s), s); await page.waitForTimeout(150);
      if (!await vis('#treeview')) await clickSel('#btn-tree');
    }
    // G (go to card, revealing a collapsed one)
    const deep = e.order.filter(id => e.depth[id] >= 2);
    const tgt = deep[deep.length - 1] || e.order[e.order.length - 1];
    const anc = Object.keys(e.info).find(id => e.info[id].kids.indexOf(tgt) >= 0);
    await page.keyboard.press('Escape'); await page.waitForTimeout(150);
    if (await vis('#treeview')) fail('V: Escape did not close the list');
    if (anc && typeof collToggle === 'function') await page.evaluate(a => { collToggle(a); }, anc);
    await page.evaluate(() => doZoomAbs(100));
    await clickSel('#btn-tree');
    if (!await clickSel('#treeview .tv-row[data-id="' + tgt + '"] .tv-title')) fail('G: no clickable title for the target row');
    else {
      await page.waitForTimeout(400);
      if (!await vis('#treeview')) fail('G: list closed after choosing a card');  // 2026-10-26 tree1: owner wants the list to stay open
      const g = await page.evaluate(id => { const el = document.getElementById('n' + id); const w0 = document.getElementById('wrap').getBoundingClientRect(), tv = document.getElementById('treeview'), tvr = tv && tv.classList.contains('tv-open') ? tv.getBoundingClientRect().right : w0.left; const w = { left: Math.max(w0.left, tvr), top: w0.top, right: w0.right, bottom: w0.bottom }; if (!el) return null;  // tree1: the chart area is the part the open list does not cover
       const r = el.getBoundingClientRect(); const shown = getComputedStyle(el).display !== 'none' && r.width > 0;
        const wr = document.getElementById('wrap'); return { shown, cx: (r.left + r.right) / 2, cy: (r.top + r.bottom) / 2, top: r.top, h: r.height, cl: r.left, cr: r.right, xlim: wr.scrollLeft <= 0 || wr.scrollLeft >= wr.scrollWidth - wr.clientWidth - 1, ylim: wr.scrollTop <= 0 || wr.scrollTop >= wr.scrollHeight - wr.clientHeight - 1, w: [w.left, w.top, w.right, w.bottom] }; }, tgt);
      if (!g || !g.shown) fail('G: chosen card not shown (collapsed subtree not revealed)');
      else { const [l, t, rr, b] = g.w; const mx = (rr - l) * 0.2, my = (b - t) * 0.2;
        // amended after g1: a card taller than the chart area cannot be centred without hiding its header, so the rule
        // is: header (top 70px) inside the chart area always, horizontally in the middle 60%, and vertically centred
        // only when the card fits in the middle 60%
        if (g.cl < l || g.cr > rr) fail('G: chosen card not fully inside the chart area horizontally');
        if (!g.xlim && (g.cx < l + mx || g.cx > rr - mx)) fail('G: chosen card not brought to the horizontal middle of the chart');
        if (g.top < t || g.top + 70 > b) fail('G: chosen card header not inside the chart area');
        if (!g.ylim && g.h <= (b - t) * 0.6 && (g.cy < t + my || g.cy > b - my)) fail('G: chosen card that fits not centred vertically');
        out.info['G' + s] = { h: Math.round(g.h), area: Math.round(b - t), cx: Math.round(g.cx), l: Math.round(l), r: Math.round(rr) }; }
    }
    if (s === 0) {
      await clickSel('#btn-tree');
      await page.evaluate(() => enterPresent()); await page.waitForTimeout(200);
      if (await vis('#treeview') || await vis('#btn-tree')) fail('P: list or button shown in presentation');
      await page.evaluate(() => exitPresent()); await page.waitForTimeout(200);
      if (!await vis('#treeview')) await clickSel('#btn-tree');
      await page.emulateMedia({ media: 'print' }); const pv = await vis('#treeview'); await page.emulateMedia({ media: 'screen' });
      if (pv) fail('P: list shown in print');
      out.info.readOnly = geo.ro;
    }
  }
  if (out.errors.length) fail('E: page errors ' + out.errors.slice(0, 2).join(' | '));
  out.RESULT = out.fails.length ? 'RED' : 'GREEN';
  return JSON.stringify(out);
}