async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  async function load(url, keep) {
    await page.goto(url); await page.waitForTimeout(500);
    await page.evaluate(([d, keep]) => { if (!keep) { try { localStorage.clear(); } catch (e) {} } _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(_hasPositions(S.nodes)); switchSheet(0); OPT.wrapN = 0; render(); }, [DOC, !!keep]);
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
  const HELP = () => {
    window.__desc = id => { const seen = new Set(); const q = [id]; while (q.length) { const x = q.shift(); S.conns.filter(c => c.f === x).forEach(c => { if (!seen.has(c.t) && c.t !== id) { seen.add(c.t); q.push(c.t); } }); } return [...seen]; };
    window.__shown = id => { const e = document.getElementById('n' + id); return !!e && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 0; };
    window.__paths = () => Array.prototype.map.call(document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash'), p => p.getAttribute('d').replace(/\s+/g, ' ').trim()).sort();
    window.__segIn = ids => { const boxes = ids.map(id => S.nodes.find(n => n.id === id)).filter(Boolean).map(n => [n.x + 1, n.y + 1, n.x + NW - 1, n.y + nh(n) - 1]); let bad = 0;
      document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash').forEach(p => { const v = (p.getAttribute('d').match(/-?\d+(\.\d+)?/g) || []).map(Number);
        for (let k = 0; k + 1 < v.length; k += 2) if (boxes.some(b => v[k] >= b[0] - 2 && v[k] <= b[2] + 2 && v[k + 1] >= b[1] - 2 && v[k + 1] <= b[3] + 2)) bad++; }); return bad; };
    window.__tog = id => document.querySelector('#n' + CSS.escape(id) + ' .ctog');
  };
  await load('__PAGE__'); await page.evaluate(HELP);
  await page.evaluate(() => doZoomAbs(100));
  const b = await page.evaluate(() => { const bad = []; S.nodes.forEach(n => { const has = S.conns.some(c => c.f === n.id); if (has !== !!__tog(n.id)) bad.push(n.id + (has ? ':missing' : ':extra')); }); return { bad, ro: document.body.classList.contains('ro') }; });
  if (b.bad.length) fail('B: toggles wrong on ' + b.bad.length + ' cards');
  // pick a parent with a sizeable subtree that is not the root
  const P = await page.evaluate(() => { const c = S.nodes.filter(n => n.type !== 'top' && S.conns.some(k => k.f === n.id)).map(n => ({ id: n.id, d: __desc(n.id).length })).sort((a, b) => b.d - a.d); return c[0] && c[0].id; });
  const hasTog = P && await page.evaluate(id => !!__tog(id), P);
  if (!P) fail('H: sanity - no parent card to collapse');
  else if (!hasTog) fail('H: no toggle on the parent card, nothing else could be checked');
  else {
    const before = await page.evaluate(() => ({ data: JSON.stringify(_fileData().sheets), paths: __paths(), shown: S.nodes.filter(n => __shown(n.id)).map(n => n.id).sort(), undo: (document.getElementById('btn-undo') || {}).disabled }));
    await page.evaluate(() => { window.__saves = 0; const o = scheduleSave; window.scheduleSave = function () { window.__saves++; return o.apply(this, arguments); }; });
    // scroll #wrap (not scrollIntoView on the toggle, which scrolls inside the card and hid a clipped toggle: amended after g2)
    await page.evaluate(id => { const n = S.nodes.find(x => x.id === id); const w = document.getElementById('wrap'); w.scrollLeft = Math.max(0, (n.x + NW / 2) * S.scale - w.clientWidth / 2); w.scrollTop = Math.max(0, (n.y + nh(n)) * S.scale - w.clientHeight / 2); }, P);
    await page.waitForTimeout(150);
    // amended 2026-10-16 (TOGPILL, owner chose hover-only toggle): hover the card before hit-testing its toggle
    { const __c = await page.evaluate(id => { const b = document.getElementById('n' + id).getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.bottom - 6 }; }, P); await page.mouse.move(__c.x, __c.y); await page.waitForTimeout(300); }
    const vis = await page.evaluate(id => { const t = __tog(id); const r = t.getBoundingClientRect(); const pts = [[0.5, 0.5], [0.5, 0.8], [0.5, 0.2], [0.2, 0.5], [0.8, 0.5]];
      return { w: r.width, h: r.height, hits: pts.map(([a, b]) => { const e = document.elementFromPoint(r.left + r.width * a, r.top + r.height * b); return !!e && (e === t || t.contains(e)); }), x: r.left + r.width / 2, y: r.top + r.height * 0.75 }; }, P);
    if (vis.hits.some(h => !h)) fail('H: toggle not fully visible and clickable (hits ' + vis.hits.join(',') + ')');
    if (vis.w < 14 || vis.h < 14) fail('H: toggle smaller than 14px at 100% zoom (' + Math.round(vis.w) + 'x' + Math.round(vis.h) + ')');
    await page.mouse.click(vis.x, vis.y); await page.waitForTimeout(250);
    const h = await page.evaluate(id => { const d = __desc(id); const L = layoutLint();
      return { d, hiddenOk: d.every(x => !__shown(x)), others: S.nodes.filter(n => !d.includes(n.id)).every(n => __shown(n.id)), seg: __segIn(d), txt: (__tog(id) || {}).textContent || '',
        lint: [L.overlap, L.cross, L.brokenN], data: JSON.stringify(_fileData().sheets), saves: window.__saves, undo: (document.getElementById('btn-undo') || {}).disabled }; }, P);
    out.info.collapsed = h.d.length;
    if (!h.hiddenOk) fail('H: some descendants still displayed');
    if (!h.others) fail('H: a card outside the subtree was hidden');
    if (h.seg) fail('H: ' + h.seg + ' connector points inside hidden cards');
    if (h.txt.indexOf(String(h.d.length)) < 0) fail('H: toggle text ' + JSON.stringify(h.txt) + ' does not show ' + h.d.length);
    if (h.lint.some(x => x)) fail('H: lint ' + h.lint + ' while collapsed');
    if (h.data !== before.data) fail('D: collapsing changed the data');
    if (h.saves) fail('D: collapsing called scheduleSave ' + h.saves + ' times');
    if (h.undo !== before.undo) fail('D: collapsing changed the undo state');
    const a1 = await page.evaluate(() => { const e = document.querySelector('#topbar #btn-expand-all'); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; });
    if (!a1) fail('A: #btn-expand-all not displayed while collapsed');
    // P: reload keeps it
    await load('__PAGE__', true); await page.evaluate(HELP);
    const p1 = await page.evaluate(id => __desc(id).every(x => !__shown(x)), P);
    if (!p1) fail('P: collapsed state lost after reload');
    // S: search for a hidden card's own title
    const sq = await page.evaluate(id => { const d = __desc(id); const cnt = t => S.nodes.filter(n => [n.en, n.ko].concat((n.m || []).flatMap(m => [m.n, m.f, m.r])).some(v => String(v || '').toLowerCase().includes(t.toLowerCase()))).length;
      for (const x of S.nodes.filter(x => d.includes(x.id))) for (const v of [x.ko, x.en].concat((x.m || []).map(m => m.n))) { const s = String(v || '').trim(); if (s.length >= 2 && cnt(s) === 1) return { id: x.id, q: s }; }
      return null; }, P);
    if (!sq) fail('S: sanity - no unique hidden title');
    else {
      await page.mouse.click(5, 400); await page.keyboard.press('Control+f'); await page.fill('#srch-input', sq.q); await page.waitForTimeout(250);
      const s1 = await page.evaluate(id => ({ shown: __shown(id), cur: !!document.querySelector('#n' + CSS.escape(id) + '.srch-cur') }), sq.id);
      if (!s1.shown || !s1.cur) fail('S: searched hidden card not shown as current ' + JSON.stringify(s1));
      await page.keyboard.press('Escape');
    }
    // G: collapse again (fresh), export
    await load('__PAGE__'); await page.evaluate(HELP);
    await page.evaluate(id => { __tog(id).click(); }, P); await page.waitForTimeout(200);
    const g = await page.evaluate(id => { const d = __desc(id); const own = new Set(S.nodes.filter(n => !d.includes(n.id)).flatMap(n => [n.en, n.ko].concat((n.m || []).flatMap(m => [m.n, m.f, m.r]))).filter(Boolean).map(String));
      const hid = S.nodes.filter(n => d.includes(n.id)).flatMap(n => [n.ko].concat((n.m || []).map(m => m.n))).filter(v => v && String(v).length >= 2 && !own.has(String(v)));
      const got = []; const o = CanvasRenderingContext2D.prototype.fillText; CanvasRenderingContext2D.prototype.fillText = function (s) { got.push(String(s)); return o.apply(this, arguments); };
      const tb = HTMLCanvasElement.prototype.toBlob; HTMLCanvasElement.prototype.toBlob = function () {};
      try { exportPNG(); } finally { CanvasRenderingContext2D.prototype.fillText = o; HTMLCanvasElement.prototype.toBlob = tb; }
      return { n: hid.length, leak: hid.filter(v => got.some(s => s === v || s.startsWith(v))).length, drawn: got.length }; }, P);
    if (!g.n) fail('G: sanity - no hidden text to look for');
    if (g.leak) fail('G: exportPNG drew ' + g.leak + ' texts of hidden cards');
    if (!g.drawn) fail('G: exportPNG drew nothing');
    // X: expand restores drawing
    await page.evaluate(id => { __tog(id).click(); }, P); await page.waitForTimeout(200);
    const x = await page.evaluate(() => ({ paths: __paths(), shown: S.nodes.filter(n => __shown(n.id)).map(n => n.id).sort() }));
    if (JSON.stringify(x.paths) !== JSON.stringify(before.paths)) fail('X: connector paths differ after expanding');
    if (JSON.stringify(x.shown) !== JSON.stringify(before.shown)) fail('X: displayed cards differ after expanding');
    // A: expand all
    await page.evaluate(() => { const c = S.nodes.filter(n => S.conns.some(k => k.f === n.id) && n.type !== 'top').slice(0, 3); c.forEach(n => __tog(n.id).click()); });
    await page.waitForTimeout(200);
    await page.click('#btn-expand-all').catch(() => fail('A: expand-all not clickable')); await page.waitForTimeout(200);
    const a2 = await page.evaluate(() => ({ all: S.nodes.every(n => __shown(n.id)), btn: (() => { const e = document.getElementById('btn-expand-all'); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; })() }));
    if (!a2.all) fail('A: expand-all left cards hidden');
    if (a2.btn) fail('A: #btn-expand-all still displayed with nothing collapsed');
    // P2: storage blocked on a separate page
    const p2 = await page.context().newPage(); const e2 = []; p2.on('pageerror', e => e2.push(String(e)));
    await p2.addInitScript(() => { try { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); }, configurable: true }); } catch (e) {} });
    await p2.goto('__PAGE__'); await p2.waitForTimeout(500);
    const r2 = await p2.evaluate(([d, id]) => { _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(_hasPositions(S.nodes)); switchSheet(0); render();
      const t = document.querySelector('#n' + CSS.escape(id) + ' .ctog'); if (!t) return 'no toggle'; t.click(); const e = S.conns.find(c => c.f === id); const el = document.getElementById('n' + e.t); return el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0 ? 'still shown' : 'ok'; }, [DOC, P]);
    if (r2 !== 'ok') fail('P: with storage blocked: ' + r2);
    const bad2 = e2.filter(x => !/blocked/.test(x)); if (bad2.length) fail('E: page errors with storage blocked ' + bad2[0]);
    await p2.close();
  }
  // K (added after g2 REJECT D2): in admin connect mode a toggle click collapses and does not pick the card
  await load('__PAGE__'); await page.evaluate(HELP);
  if (P && hasTog) {
    const k = await page.evaluate(id => { ADMIN = true; applyRO(); render(); if (typeof toggleConnect === 'function' && !S.cmode) toggleConnect(); doZoomAbs(100);
      const n = S.nodes.find(x => x.id === id); const w = document.getElementById('wrap'); w.scrollLeft = Math.max(0, (n.x + NW / 2) * S.scale - w.clientWidth / 2); w.scrollTop = Math.max(0, (n.y + nh(n)) * S.scale - w.clientHeight / 2);
      return true; }, P);
    await page.waitForTimeout(150);
    { const __c = await page.evaluate(id => { const b = document.getElementById('n' + id).getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.bottom - 6 }; }, P); await page.mouse.move(__c.x, __c.y); await page.waitForTimeout(300); }
    const kb = await page.evaluate(id => { const r = __tog(id).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, P);
    await page.mouse.click(kb.x, kb.y); await page.waitForTimeout(200);
    const kr = await page.evaluate(id => ({ col: __desc(id).every(x => !__shown(x)), from: S.cfrom || null, conns: S.conns.length }), P);
    if (!kr.col) fail('K: toggle click in connect mode did not collapse');
    if (kr.from) fail('K: toggle click in connect mode picked the card as connection start');
    await page.evaluate(() => { if (S.cmode && typeof toggleConnect === 'function') toggleConnect(); });
  }
  if (out.errors.length) fail('E: page errors ' + out.errors.slice(0, 2).join(' | '));
  out.RESULT = out.fails.length ? 'RED' : 'GREEN';
  return JSON.stringify(out);
}