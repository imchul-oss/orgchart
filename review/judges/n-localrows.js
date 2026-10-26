async page => {
  const DOC = __DOC__, OWNER = __OWNER__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 40) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  const LOAD = (d, si, own) => page.evaluate(([d, si, own]) => { try{localStorage.clear();}catch(e){} window.alert = () => {}; window.confirm = () => true; _adoptData(JSON.parse(JSON.stringify(d)),false); _finishLoad(true);
    if (own) { _applyOptObj(d.opt); OPT.colGap = d.opt.colGap; } else { OPT.colGap = 44; OPT.rowGap = 80; OPT.padX = 80; OPT.padY = 60; NW = 228; document.documentElement.style.setProperty('--nw', '228px'); }  // padX/padY reset too: file:// pages share localStorage, so a saved owner option set can leak into the next boot
    if (CUR_SHEET !== si) switchSheet(si); collState().clear(); collSave(); ADMIN = true; applyRO(); OPT.wrapN = 0; OPT.rowMode = 'depth'; autoLayout(); render(); return S.nodes.length; }, [d, si, own]);
  const POS = () => page.evaluate(() => { const o = {}; S.nodes.forEach(n => o[n.id] = [Math.round(n.x * 10) / 10, Math.round(n.y * 10) / 10]); return o; });
  const SETLOCAL = () => page.evaluate(() => { const s = document.getElementById('opt-rowmode'); if (!s) return false; s.value = 'local'; s.dispatchEvent(new Event('change', { bubbles: true })); render(); return OPT.rowMode === 'local'; });
  const CHECK = key => page.evaluate(key => {
    const by = id => S.nodes.find(n => n.id === id); const H = collHidden();
    const kidsAll = id => S.conns.filter(c => c.f === id).map(c => by(c.t)).filter(Boolean);
    const isSideOf = (n, p) => n.type === 'side' && typeof sideBesideParent === 'function' && sideBesideParent(n.id) === p;
    const beside = id => kidsAll(id).filter(n => n.aside === true).concat(S.nodes.filter(n => isSideOf(n, id)));
    const besideIds = new Set(); S.nodes.forEach(n => beside(n.id).forEach(b => besideIds.add(b.id)));
    const tkids = id => kidsAll(id).filter(n => !besideIds.has(n.id) && n.type !== 'side' && !H.has(n.id));
    const f = [];
    S.nodes.forEach(p => { if (H.has(p.id)) return; const ks = tkids(p.id); if (!ks.length) return;
      const step = Math.ceil((nh(p) + OPT.rowGap) / 20) * 20; const hasB = beside(p.id).length > 0;
      const first = ks.filter(k => (k._d ?? 0) === (p._d ?? 0) + 1);
      first.forEach(k => { if (hasB) { if (k.y < p.y + nh(p) + OPT.rowGap - 0.5) f.push(p.id + '>' + k.id + ' y ' + k.y + ' above parent bottom + gap'); } else if (Math.abs(k.y - (p.y + step)) > 0.5) f.push(p.id + '>' + k.id + ' y ' + k.y + ' want ' + (p.y + step)); });
      const byType = {}; ks.forEach(k => (byType[k.type] = byType[k.type] || new Set()).add(k.y)); Object.entries(byType).forEach(([t, ys]) => { if (ys.size > 1 && !(p._wrap && p._wrap.rows)) f.push(p.id + ' children of type ' + t + ' on ' + ys.size + ' rows'); });
    });
    const vis = S.nodes.filter(n => !H.has(n.id)); const ov = [];
    for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) { const a = vis[i], b = vis[j]; if (a.x < b.x + cardW(b) - 0.5 && b.x < a.x + cardW(a) - 0.5 && a.y < b.y + nh(b) - 0.5 && b.y < a.y + nh(a) - 0.5) ov.push(a.id + '|' + b.id); }
    const bd = document.getElementById('lint-badge');
    return { f, ov, badge: bd ? bd.textContent.trim() : null }; }, key);
  // R1
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const r1 = await page.evaluate(() => { const s = document.getElementById('opt-rowmode'); return { has: !!s, vals: s ? [...s.options].map(o => o.value) : [], val: s ? s.value : null, sec: s && s.closest('.opt-sec[data-sec]') ? s.closest('.opt-sec[data-sec]').getAttribute('data-sec') : null, opt: OPT.rowMode }; });
  out.info.r1 = r1;
  if (!r1.has) fail('R1: no #opt-rowmode'); else { if (JSON.stringify(r1.vals) !== '["depth","local"]') fail('R1: values ' + r1.vals.join(',')); if (r1.val !== 'depth') fail('R1: default select ' + r1.val); if (r1.sec !== 'layout') fail('R1: not in the 배치 section (' + r1.sec + ')'); }
  if (r1.opt !== undefined && r1.opt !== 'depth') fail('R1: OPT.rowMode default ' + r1.opt);
  // R2 reference positions
  const cases = [['final/0', DOC, 0, false], ['final/1', DOC, 1, false], ['owner/1', OWNER, 1, true]];
  const ref = {};
  await page.goto('__REF__'); await page.waitForTimeout(400);
  for (const [k, d, si, own] of cases) { await LOAD(d, si, own); ref[k] = await POS(); }
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  for (const [k, d, si, own] of cases) {
    await LOAD(d, si, own); const cur = await POS();
    Object.keys(ref[k]).forEach(id => { const a = ref[k][id], b = cur[id]; if (!b || Math.abs(a[0] - b[0]) > 0.5 || Math.abs(a[1] - b[1]) > 0.5) fail('R2 ' + k + ': ' + id + ' ' + b + ' vs ref ' + a); });
    // R3 local
    if (r1.has) {
      const ok = await SETLOCAL(); if (!ok) { fail('R3 ' + k + ': could not switch to local'); continue; }
      const c = await CHECK(k); out.info[k] = { fails: c.f.length, ov: c.ov.length, badge: c.badge };
      c.f.slice(0, 6).forEach(m => fail('R3 ' + k + ': ' + m)); if (c.ov.length) fail('R3 ' + k + ': overlaps ' + c.ov.slice(0, 3).join(' ')); if (!/이상 없음/.test(c.badge || '')) fail('R3 ' + k + ': badge ' + c.badge);
      const p1 = await POS(); await page.evaluate(() => { autoLayout(); render(); }); const p2 = await POS();
      const moved = Object.keys(p1).filter(id => Math.abs(p1[id][0] - p2[id][0]) > 0.5 || Math.abs(p1[id][1] - p2[id][1]) > 0.5); if (moved.length) fail('R5 ' + k + ': second autoLayout moved ' + moved.slice(0, 4).join(','));
      if (k === 'owner/1') { const r4 = await page.evaluate(() => { const by = id => S.nodes.find(n => n.id === id); const g = by('nd201'), l = by('o_p1_2'); const ks = S.conns.filter(c => c.f === 'nd201').map(c => by(c.t)).filter(Boolean); return { kidsY: ks.map(k => k.y), gBottom: g.y + nh(g), lBottom: l.y + nh(l) }; });
        out.info.r4 = r4; if (!r4.kidsY.length || Math.max(...r4.kidsY) >= r4.lBottom) fail('R4: 효트듀 children at ' + r4.kidsY + ' not above 쵀똬퇴 bottom ' + r4.lBottom); }
    }
  }
  // R6 persistence + R7 wrap
  if (r1.has) {
    const r6 = await page.evaluate(() => { const o = JSON.parse(JSON.stringify(OPT)); _applyOptObj(Object.assign({}, o, { rowMode: 'local' })); const a = [OPT.rowMode, document.getElementById('opt-rowmode').value, 'rowMode' in JSON.parse(JSON.stringify(OPT))];
      _applyOptObj(Object.assign({}, o, { rowMode: 'depth' })); const b = [OPT.rowMode, document.getElementById('opt-rowmode').value]; _applyOptObj(Object.assign({}, o, { rowMode: 'zzz' })); const c = OPT.rowMode; return { a, b, c }; });
    out.info.r6 = r6;
    if (JSON.stringify(r6.a) !== '["local","local",true]') fail('R6: local ' + JSON.stringify(r6.a)); if (JSON.stringify(r6.b) !== '["depth","depth"]') fail('R6: depth ' + JSON.stringify(r6.b)); if (r6.c !== 'depth') fail('R6: unknown value kept ' + r6.c);
    await LOAD(DOC, 0, false);
    const r7 = await page.evaluate(() => { OPT.rowMode = 'local'; OPT.wrapN = 4; autoLayout(); render(); OPT.wrapN = 0; const by = id => S.nodes.find(n => n.id === id); const ks = S.conns.filter(c => c.f === 'prodhq').map(c => by(c.t)).filter(n => n && !n.aside); const ys = [...new Set(ks.map(k => k.y))].sort((a, b) => a - b); const p = by('prodhq'); const bd = document.getElementById('lint-badge'); OPT.rowMode = 'depth'; return { ys, pBottom: p.y + nh(p), badge: bd ? bd.textContent.trim() : null }; });
    out.info.r7 = r7;
    if (!(r7.ys.length === 2 && r7.ys[0] > r7.pBottom && r7.ys[1] > r7.ys[0])) fail('R7: wrap rows ' + JSON.stringify(r7.ys) + ' parent bottom ' + r7.pBottom); if (!/이상 없음/.test(r7.badge || '')) fail('R7: badge ' + r7.badge);
  }
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}