async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  async function load(url) {
    await page.goto(url); await page.waitForTimeout(500);
    await page.evaluate(d => { try { localStorage.clear(); } catch (e) {} _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(true); switchSheet(0); OPT.wrapN = 0; OPT.orient = 'down'; autoLayout(); render(); }, DOC);
    await page.waitForTimeout(300);
  }
  const HELP = () => {
    window.__kids = id => S.conns.filter(c => c.f === id).map(c => S.nodes.find(n => n.id === c.t)).filter(n => n && n.type !== 'side' && n.aside !== true);
    window.__list = sel => Array.prototype.map.call(document.querySelectorAll(sel + ' .ord-row'), r => r.getAttribute('data-id'));
    window.__pos = () => S.nodes.map(n => n.id + ':' + n.x + ',' + n.y).sort().join(';');
    window.__readOrder = (P, ids) => { const cs = ids.map(id => S.nodes.find(n => n.id === id)); const pcx = P.x + cardW(P) / 2;
      const R = cs.filter(c => c.x + cardW(c) / 2 >= pcx).sort((a, b) => (a.y - b.y) || (Math.abs(a.x - P.x) - Math.abs(b.x - P.x)));
      const L = cs.filter(c => c.x + cardW(c) / 2 < pcx).sort((a, b) => (a.y - b.y) || (Math.abs(a.x - P.x) - Math.abs(b.x - P.x)));
      return { R: R.map(c => c.id), L: L.map(c => c.id) }; };
  };
  const SNAP = () => ({ pos: S.nodes.map(n => n.id + ':' + n.x + ',' + n.y).sort(),
    paths: Array.prototype.map.call(document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash'), p => p.getAttribute('class') + '|' + p.getAttribute('d').replace(/\s+/g, ' ').trim()).sort() });
  const refRun = async () => { const r = {}; const n = await page.evaluate(() => SHEETS.length);
    for (let s = 0; s < n; s++) for (const o of ['down', 'right', 'left']) r['s' + s + o] = await page.evaluate(([s, o, sn]) => { switchSheet(s); OPT.wrapN = 0; OPT.orient = o; autoLayout(); render(); return eval('(' + sn + ')')(); }, [s, o, SNAP.toString()]); return r; };
  await load('__REF__'); await page.evaluate(HELP); const ref = await refRun();
  await load('__PAGE__'); await page.evaluate(HELP); const cur = await refRun();
  for (const k of Object.keys(ref)) { if (JSON.stringify(ref[k].pos) !== JSON.stringify(cur[k].pos)) fail('O9: positions differ ' + k); if (JSON.stringify(ref[k].paths) !== JSON.stringify(cur[k].paths)) fail('O9: paths differ ' + k); }
  // O1, O2, O5, O7, O8
  for (const o of ['down', 'right', 'left']) {
    await load('__PAGE__'); await page.evaluate(HELP);
    const r = await page.evaluate(o => { const R = {}; OPT.orient = o; autoLayout(); render();
      ADMIN = false; applyRO(); try { openEdit('fp'); } catch (e) {} R.ro = !!document.querySelector('#ei-ord-kids .ord-row'); try { closeModal(); } catch (e) {}
      ADMIN = true; applyRO(); render(); _hCheckpoint();
      const kids = __kids('fp'); const key = o === 'down' ? 'x' : 'y'; const cur = kids.slice().sort((a, b) => a[key] - b[key]).map(n => n.id);
      const p0 = __pos(); openEdit('fp'); R.list0 = __list('#ei-ord-kids'); R.want0 = cur; saveModal(); R.same = __pos() === p0;
      openEdit('fp'); const btn = document.querySelector('#ei-ord-kids .ord-row .ord-dn'); if (!btn) { closeModal(); R.nobtn = true; return R; }
      btn.click(); R.list1 = __list('#ei-ord-kids'); saveModal(); _hCheckpoint();
      R.after = __kids('fp').sort((a, b) => a[key] - b[key]).map(n => n.id);
      undoEdit(); R.undo = __pos() === p0; ADMIN = false; applyRO(); return R; }, o);
    out.info['O-' + o] = { list0: r.list0, list1: r.list1, after: r.after };
    if (r.ro) fail('O8: read-only modal shows the order list');
    if (o === 'down' && JSON.stringify(r.list0) !== JSON.stringify(r.want0)) fail('O1: list ' + JSON.stringify(r.list0) + ' want ' + JSON.stringify(r.want0));
    if (!r.same) fail('O7: save without reorder moved cards (' + o + ')');
    if (r.nobtn) { fail('O2: no ▼ button (' + o + ')'); continue; }
    const want1 = r.list0 ? [r.list0[1], r.list0[0]].concat(r.list0.slice(2)) : null;
    if (JSON.stringify(r.list1) !== JSON.stringify(want1)) fail('O2: ▼ gave ' + JSON.stringify(r.list1) + ' (' + o + ')');
    if (JSON.stringify(r.after) !== JSON.stringify(r.list1)) fail('O2: layout order ' + JSON.stringify(r.after) + ' want ' + JSON.stringify(r.list1) + ' (' + o + ')');
    if (!r.undo) fail('O5: undo did not restore positions (' + o + ')');
  }
  // O3 drag
  await load('__PAGE__'); await page.evaluate(HELP);
  const d0 = await page.evaluate(() => { ADMIN = true; applyRO(); render(); openEdit('fp'); return __list('#ei-ord-kids'); });
  if (d0 && d0.length >= 2) { try { await page.dragAndDrop('#ei-ord-kids .ord-row:last-child', '#ei-ord-kids .ord-row:first-child', { targetPosition: { x: 10, y: 3 } }); } catch (e) { fail('O3: drag failed ' + String(e).slice(0, 80)); }
    const d1 = await page.evaluate(() => __list('#ei-ord-kids'));
    if (d1[0] !== d0[d0.length - 1]) fail('O3: drag gave ' + JSON.stringify(d1) + ' from ' + JSON.stringify(d0)); }
  await page.evaluate(() => { try { closeModal(); } catch (e) {} });
  // O4 beside
  for (const ac of [1, 2, 3]) for (const ad of [null, 'L', 'B']) {
    await load('__PAGE__'); await page.evaluate(HELP);
    const r = await page.evaluate(([ac, ad]) => { const R = {}; const fp = S.nodes.find(n => n.id === 'fp'); const ids = ['t_01', 't_02', 't_03', 't_04'];
      ids.forEach(id => { S.nodes.find(n => n.id === id).aside = true; }); if (ac > 1) fp.ac = ac; if (ad) fp.ad = ad; OPT.orient = 'down'; autoLayout(); ADMIN = true; applyRO(); render();
      const ro = __readOrder(fp, ids); R.want0 = ro.R.concat(ro.L);
      openEdit('fp'); R.list0 = __list('#ei-ord-bes'); const rows = document.querySelectorAll('#ei-ord-bes .ord-row'); if (rows.length < 4) { closeModal(); return R; }
      const last = rows[rows.length - 1]; for (let i = 0; i < 3; i++) { const up = last.querySelector('.ord-up'); if (up) up.click(); }
      R.list1 = __list('#ei-ord-bes'); saveModal(); const ro2 = __readOrder(S.nodes.find(n => n.id === 'fp'), ids); R.R = ro2.R; R.L = ro2.L; ADMIN = false; applyRO(); return R; }, [ac, ad]);
    const tag = 'ac' + ac + ' ' + (ad || 'R');
    if (!r.list1) { fail('O4: ' + tag + ' beside list ' + JSON.stringify(r.list0)); continue; }
    if (JSON.stringify(r.list0) !== JSON.stringify(r.want0)) fail('O4: ' + tag + ' initial list ' + JSON.stringify(r.list0) + ' want ' + JSON.stringify(r.want0));
    const L1 = r.list1, nR = ad === 'L' ? 0 : ad === 'B' ? Math.ceil(L1.length / 2) : L1.length;
    const wantR = L1.slice(0, nR), wantL = L1.slice(nR);
    if (JSON.stringify(r.R) !== JSON.stringify(wantR) || JSON.stringify(r.L) !== JSON.stringify(wantL)) fail('O4: ' + tag + ' layout R' + JSON.stringify(r.R) + ' L' + JSON.stringify(r.L) + ' want R' + JSON.stringify(wantR) + ' L' + JSON.stringify(wantL));
  }
  // O6
  await load('__PAGE__'); await page.evaluate(HELP);
  const o6 = await page.evaluate(() => { ADMIN = true; applyRO(); render(); const leaf = S.nodes.find(n => !S.conns.some(c => c.f === n.id)); openEdit(leaf.id);
    const r = document.querySelectorAll('#ei-ord-kids .ord-row, #ei-ord-bes .ord-row').length; closeModal(); ADMIN = false; applyRO(); return r; });
  if (o6) fail('O6: a leaf card shows ' + o6 + ' order rows');
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}