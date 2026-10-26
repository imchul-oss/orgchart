async page => {
  const DOC = __DOC__, OWNER = __OWNER__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  const LOAD = (d, si) => page.evaluate(([d, si]) => { try { localStorage.clear(); } catch (e) {} _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(true); if (CUR_SHEET !== si) switchSheet(si); collState().clear(); collSave(); ADMIN = true; applyRO(); autoLayout(); render(); return S.nodes.length; }, [d, si]);
  const POS = () => page.evaluate(() => { const o = {}; S.nodes.forEach(n => o[n.id] = [Math.round(n.x * 10) / 10, Math.round(n.y * 10) / 10]); return o; });
  // reference = autoLayout on a copy with the hidden cards removed; restores the live data afterwards
  const REF = ids => page.evaluate(ids => { const cs = collState(); ids.forEach(id => cs.add(id)); collSave(); const H = collHidden();
    const full = { n: S.nodes, c: S.conns }; const snap = JSON.parse(JSON.stringify(S.nodes.map(n => ({ id: n.id, x: n.x, y: n.y }))));
    S.nodes = full.n.filter(n => !H.has(n.id)).map(n => JSON.parse(JSON.stringify(n))); S.conns = full.c.filter(c => !H.has(c.f) && !H.has(c.t)).map(c => ({ ...c }));
    cs.clear(); collSave(); autoLayout(); const ref = {}; S.nodes.forEach(n => ref[n.id] = [Math.round(n.x * 10) / 10, Math.round(n.y * 10) / 10]);
    S.nodes = full.n; S.conns = full.c; snap.forEach(s => { const n = S.nodes.find(x => x.id === s.id); if (n) { n.x = s.x; n.y = s.y; } });
    ids.forEach(id => cs.add(id)); collSave(); return { ref, hidden: [...H], before: snap }; }, ids);
  const RUN = () => page.evaluate(() => { autoLayout(); render(); const o = {}; S.nodes.forEach(n => o[n.id] = [Math.round(n.x * 10) / 10, Math.round(n.y * 10) / 10]);
    const hid = {}; S.nodes.forEach(n => { const el = document.getElementById('n' + n.id); hid[n.id] = !el || getComputedStyle(el).display === 'none' || !el.offsetParent; });
    const b = document.getElementById('lint-badge'); return { pos: o, hid, badge: b ? b.textContent.trim() : null }; });
  const WIDTH = () => page.evaluate(() => { const H = collHidden(); let x0 = Infinity, x1 = -Infinity; S.nodes.forEach(n => { if (H.has(n.id)) return; x0 = Math.min(x0, n.x); x1 = Math.max(x1, n.x + cardW(n)); }); return x1 - x0; });
  const cmp = (tag, r, got) => { const H = new Set(r.hidden);
    Object.keys(r.ref).forEach(id => { const a = r.ref[id], b = got.pos[id]; if (!b) { fail(tag + ': ' + id + ' missing'); return; } if (Math.abs(a[0] - b[0]) > 0.5 || Math.abs(a[1] - b[1]) > 0.5) fail(tag + ': ' + id + ' at ' + b + ', want ' + a); });
    r.before.forEach(s => { if (!H.has(s.id)) return; const b = got.pos[s.id]; if (Math.abs(b[0] - s.x) > 0.5 || Math.abs(b[1] - s.y) > 0.5) fail(tag + ': hidden ' + s.id + ' moved ' + [s.x, s.y] + ' -> ' + b); });
    r.hidden.forEach(id => { if (!got.hid[id]) fail(tag + ': hidden card ' + id + ' is visible'); });
    if (!got.badge || !/이상 없음/.test(got.badge)) fail(tag + ': badge ' + JSON.stringify(got.badge)); };
  // K5 reference positions from the base page
  await page.goto('__REF__'); await page.waitForTimeout(400);
  await LOAD(DOC, 0); const refD0 = await POS(); await LOAD(OWNER, 1); const refO1 = await POS();
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  await LOAD(DOC, 0); const curD0 = await POS(); const fullW = await WIDTH();
  Object.keys(refD0).forEach(id => { const a = refD0[id], b = curD0[id]; if (!b || Math.abs(a[0] - b[0]) > 0.5 || Math.abs(a[1] - b[1]) > 0.5) fail('K5: final sheet 0 ' + id + ' ' + b + ' vs ' + a); });
  // K1
  let r = await REF(['prodhq']); let g = await RUN(); cmp('K1', r, g); out.info.k1 = { hidden: r.hidden.length, prodhq: g.pos.prodhq, t_12: g.pos.t_12 };
  // K2
  await LOAD(DOC, 0); r = await REF(['prodhq', 'foodhq']); g = await RUN(); cmp('K2', r, g); const w2 = await WIDTH(); out.info.k2 = { fullW, w2 };
  if (!(w2 < fullW - 100)) fail('K2: visible width ' + w2 + ' not smaller than the full layout ' + fullW);
  // K4
  const k4 = await page.evaluate(() => { collExpandAll(); autoLayout(); render(); const a = {}; S.nodes.forEach(n => a[n.id] = [n.x, n.y]); autoLayout(); const b = {}; S.nodes.forEach(n => b[n.id] = [n.x, n.y]); return Object.keys(a).filter(id => Math.abs(a[id][0] - b[id][0]) > 0.5 || Math.abs(a[id][1] - b[id][1]) > 0.5); });
  if (k4.length) fail('K4: expand-all layout unstable for ' + k4.slice(0, 5));
  const k4b = await POS(); Object.keys(refD0).forEach(id => { const a = refD0[id], b = k4b[id]; if (!b || Math.abs(a[0] - b[0]) > 0.5 || Math.abs(a[1] - b[1]) > 0.5) fail('K4: after expand ' + id + ' ' + b + ' vs full layout ' + a); });
  // K3 + K5 owner
  await LOAD(OWNER, 1); const curO1 = await POS();
  Object.keys(refO1).forEach(id => { const a = refO1[id], b = curO1[id]; if (!b || Math.abs(a[0] - b[0]) > 0.5 || Math.abs(a[1] - b[1]) > 0.5) fail('K5: owner sheet 1 ' + id + ' ' + b + ' vs ' + a); });
  r = await REF(['o_p1']); g = await RUN(); cmp('K3a', r, g);
  await LOAD(OWNER, 1); r = await REF(['nd201']); g = await RUN(); cmp('K3b', r, g); out.info.k3b = { nd201: g.pos.nd201, o_p1_2: g.pos.o_p1_2, hidden: r.hidden };
  await page.evaluate(() => { collExpandAll(); });
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}