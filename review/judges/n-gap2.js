async page => {
  const DOC = __DOC__, OWNER = __OWNER__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 50) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const cases = [['final', DOC, null], ['owner', OWNER, OWNER.opt], ['final-own', DOC, OWNER.opt], ['owner-def', OWNER, null]];
  for (const [tag, data, optMode] of cases) {
    const nSheets = (data.sheets || [1]).length;
    for (let si = 0; si < nSheets; si++) {
      const r = await page.evaluate(([d, si, om]) => { try{localStorage.clear();}catch(e){} _adoptData(JSON.parse(JSON.stringify(d)),false); _finishLoad(true);
        if (om) { _applyOptObj(om); OPT.colGap = om.colGap; NW = om.nw; document.documentElement.style.setProperty('--nw', om.nw + 'px'); } else { OPT.colGap = 44; NW = 228; document.documentElement.style.setProperty('--nw', '228px'); }
        if (CUR_SHEET !== si) switchSheet(si); collState().clear(); collSave(); ADMIN = true; applyRO();
        // G1 fixture: every card with two or more aside cards gets ad 'B'
        autoLayout(); render(); const split = S.nodes.filter(n => (n._asides || []).filter(id => { const a = S.nodes.find(x => x.id === id); return a && a.type !== 'side'; }).length >= 2);
        split.forEach(n => n.ad = 'B'); autoLayout(); render();
        const by = id => S.nodes.find(n => n.id === id), H = collHidden();
        const kidsOf = id => S.conns.filter(c => c.f === id).map(c => by(c.t)).filter(n => n && !H.has(n.id));
        const g1 = split.map(n => { const as = (n._asides || []).map(by).filter(Boolean);
          const R = as.filter(a => a.x > n.x), L = as.filter(a => a.x < n.x); if (!R.length || !L.length) return null;
          const gr = Math.min(...R.map(a => a.x - (n.x + cardW(n)))), gl = Math.min(...L.map(a => n.x - (a.x + cardW(a)))); return { id: n.id, gl, gr }; }).filter(Boolean);
        const asideSet = new Set(S.nodes.flatMap(n => n._asides || []));
        const leaf = n => n && !kidsOf(n.id).some(k => !asideSet.has(k.id)) && !(n._asides || []).length && !asideSet.has(n.id) && n.type !== 'side';
        const g2 = [];
        S.nodes.forEach(p => { const ks = kidsOf(p.id).filter(k => !asideSet.has(k.id) && k.type !== 'side'); if (ks.length < 2) return;
          const rows = {}; ks.forEach(k => (rows[k.y] = rows[k.y] || []).push(k));
          Object.values(rows).forEach(row => { row.sort((a, b) => a.x - b.x); for (let i = 1; i < row.length; i++) { const a = row[i - 1], b = row[i]; if (leaf(a) && leaf(b)) g2.push({ p: p.id, a: a.id, b: b.id, gap: b.x - (a.x + cardW(a)) }); } }); });
        const bd = document.getElementById('lint-badge');
        return { cg: OPT.colGap, nw: NW, g1, g2, badge: bd ? bd.textContent.trim() : null, split: split.length }; }, [data, si, optMode]);
      const key = tag + '/' + si;
      r.g1.forEach(x => { if (Math.abs(x.gl - x.gr) > 0.5) fail('G1 ' + key + ': ' + x.id + ' left ' + x.gl + ' right ' + x.gr); });
      r.g2.forEach(x => { if (x.gap < r.cg - 0.5) fail('G2 ' + key + ': ' + x.a + '|' + x.b + ' gap ' + x.gap + ' < colGap ' + r.cg); });
      const byP = {}; r.g2.forEach(x => (byP[x.p] = byP[x.p] || []).push(x.gap));
      Object.entries(byP).forEach(([p, gs]) => { if (Math.max(...gs) - Math.min(...gs) > 10.5) fail('G2 ' + key + ': uneven leaf gaps under ' + p + ' ' + gs.join('/')); });
      if (!r.badge || !/이상 없음/.test(r.badge)) fail('G3 ' + key + ': badge ' + JSON.stringify(r.badge));
      out.info[key] = { cg: r.cg, nw: r.nw, split: r.split, g1: r.g1.length, g2: r.g2.length, g2gaps: [...new Set(r.g2.map(x => x.gap))].slice(0, 8) };
    }
  }
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}