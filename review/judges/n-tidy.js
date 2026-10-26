async page => {
  const DOC = __DOC__, OWNER = __OWNER__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const WIDTH_TODAY = { 'final-def/0': 3968, 'final-def/1': 2748, 'final-own/0': 2760, 'final-own/1': 1960, 'owner-own/0': 1960, 'owner-own/1': 2840, 'owner-def/0': 2768, 'owner-def/1': 4088 };
  const cases = [['final-def', DOC, null], ['final-own', DOC, OWNER.opt], ['owner-own', OWNER, OWNER.opt], ['owner-def', OWNER, null]];
  for (const [tag, data, om] of cases) {
    for (let si = 0; si < data.sheets.length; si++) {
      const key = tag + '/' + si;
      const r = await page.evaluate(([d, si, om]) => {
        try{localStorage.clear();}catch(e){} window.alert = () => {}; window.confirm = () => true;
        _adoptData(JSON.parse(JSON.stringify(d)),false); _finishLoad(true);
        if (om) { _applyOptObj(om); OPT.colGap = om.colGap; NW = om.nw; document.documentElement.style.setProperty('--nw', om.nw + 'px'); } else { OPT.colGap = 44; OPT.rowGap = 80; NW = 228; document.documentElement.style.setProperty('--nw', '228px'); }
        if (CUR_SHEET !== si) switchSheet(si); collState().clear(); collSave(); ADMIN = true; applyRO(); OPT.wrapN = 0;
        const by = id => S.nodes.find(n => n.id === id);
        const kidsAll = id => S.conns.filter(c => c.f === id).map(c => by(c.t)).filter(Boolean);
        const isSideOf = (n, p) => n.type === 'side' && typeof sideBesideParent === 'function' && sideBesideParent(n.id) === p;
        const beside = id => kidsAll(id).filter(n => n.aside === true).concat(S.nodes.filter(n => isSideOf(n, id)));
        const besideIds = new Set(); S.nodes.forEach(n => beside(n.id).forEach(b => besideIds.add(b.id)));
        const tkids = id => kidsAll(id).filter(n => !besideIds.has(n.id) && n.type !== 'side');
        const ordBefore = {}; S.nodes.forEach(p => { const ks = tkids(p.id); if (ks.length >= 2) ordBefore[p.id] = ks.slice().sort((a, b) => (a.y - b.y) || (a.x - b.x)).map(n => n.id); });
        autoLayout(); render();
        const p1 = {}; S.nodes.forEach(n => p1[n.id] = [n.x, n.y]);
        const H = collHidden(); const vis = S.nodes.filter(n => !H.has(n.id));
        const rect = n => ({ x0: n.x, x1: n.x + cardW(n), y0: n.y, y1: n.y + nh(n) });
        // T1 overlaps
        const ov = []; for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) { const a = rect(vis[i]), b = rect(vis[j]); if (a.x0 < b.x1 - 0.5 && b.x0 < a.x1 - 0.5 && a.y0 < b.y1 - 0.5 && b.y0 < a.y1 - 0.5) ov.push(vis[i].id + '|' + vis[j].id); }
        // subtree boxes
        const box = id => { const n = by(id); const r = rect(n); let x0 = r.x0, x1 = r.x1; beside(id).forEach(b => { const q = rect(b); x0 = Math.min(x0, q.x0); x1 = Math.max(x1, q.x1); }); tkids(id).forEach(k => { const c = box(k.id); x0 = Math.min(x0, c.x0); x1 = Math.max(x1, c.x1); }); return { x0, x1 }; };
        const gaps = [], centres = [], orders = [], rows = [], wrapGaps = [];
        S.nodes.forEach(p => { if (H.has(p.id)) return; const ks = tkids(p.id); if (!ks.length) return;
          const isWrap = !!(p._wrap && p._wrap.rows), isCol = !!p._col;
          if (isWrap) { const rowsOf = {}; ks.forEach(k => (rowsOf[k.y] = rowsOf[k.y] || []).push(k)); Object.values(rowsOf).forEach(row => { row.sort((a, b) => a.x - b.x); for (let i = 1; i < row.length; i++) wrapGaps.push({ p: p.id, a: row[i - 1].id, b: row[i].id, g: row[i].x - (row[i - 1].x + cardW(row[i - 1])) }); }); return; }
          if (isCol) return;
          const sorted = ks.slice().sort((a, b) => a.x - b.x);
          for (let i = 1; i < sorted.length; i++) { const A = box(sorted[i - 1].id), B = box(sorted[i].id); gaps.push({ p: p.id, a: sorted[i - 1].id, b: sorted[i].id, g: B.x0 - A.x1 }); }
          const cen = n => n.x + cardW(n) / 2, nK = sorted.length; const mid = nK % 2 ? cen(sorted[(nK - 1) / 2]) : (cen(sorted[nK / 2 - 1]) + cen(sorted[nK / 2])) / 2;  // median rule (10-20): above the middle child
          centres.push({ p: p.id, d: (p.x + cardW(p) / 2) - mid });
          if (ordBefore[p.id]) orders.push({ p: p.id, before: ordBefore[p.id], after: sorted.map(n => n.id) });
          const byType = {}; ks.forEach(k => (byType[k.type] = byType[k.type] || new Set()).add(k.y)); rows.push({ p: p.id, ys: Math.max(...Object.values(byType).map(s => s.size)), below: ks.every(k => k.y > p.y) });  // one row per card type (depth = type level, as today)
        });
        autoLayout(); render(); const moved = S.nodes.filter(n => Math.abs(p1[n.id][0] - n.x) > 0.5 || Math.abs(p1[n.id][1] - n.y) > 0.5).map(n => n.id);
        let wx0 = Infinity, wx1 = -Infinity; vis.forEach(n => { wx0 = Math.min(wx0, n.x); wx1 = Math.max(wx1, n.x + cardW(n)); });
        const bd = document.getElementById('lint-badge');
        return { cg: OPT.colGap, ov, gaps, wrapGaps, centres, orders, rows, moved, width: wx1 - wx0, badge: bd ? bd.textContent.trim() : null, n: vis.length };
      }, [data, si, om]);
      out.info[key] = { cg: r.cg, n: r.n, width: Math.round(r.width), today: WIDTH_TODAY[key], gapSet: [...new Set(r.gaps.map(g => Math.round(g.g * 10) / 10))].slice(0, 8), wrapPairs: r.wrapGaps.length };
      if (r.ov.length) fail('T1 ' + key + ': overlaps ' + r.ov.slice(0, 4).join(' '));
      if (!r.badge || !/이상 없음/.test(r.badge)) fail('T1 ' + key + ': badge ' + JSON.stringify(r.badge));
      r.gaps.forEach(g => { if (Math.abs(g.g - r.cg) > 0.5) fail('T2 ' + key + ': ' + g.a + '|' + g.b + ' gap ' + g.g.toFixed(1) + ' want ' + r.cg); });
      r.wrapGaps.forEach(g => { if (Math.abs(g.g - r.cg) > 0.5) fail('T2 ' + key + ' wrap: ' + g.a + '|' + g.b + ' gap ' + g.g.toFixed(1) + ' want ' + r.cg); });
      r.centres.forEach(c => { if (Math.abs(c.d) > 0.5) fail('T3 ' + key + ': ' + c.p + ' off centre by ' + c.d.toFixed(1)); });
      r.orders.forEach(o => { if (JSON.stringify(o.before) !== JSON.stringify(o.after)) fail('T4 ' + key + ': ' + o.p + ' order ' + o.after.join(',') + ' want ' + o.before.join(',')); });
      r.rows.forEach(x => { if (x.ys !== 1 || !x.below) fail('T5 ' + key + ': ' + x.p + ' children of one type on ' + x.ys + ' rows, below ' + x.below); });
      if (r.moved.length) fail('T6 ' + key + ': second autoLayout moved ' + r.moved.slice(0, 4).join(','));
      if (WIDTH_TODAY[key] != null && r.width > WIDTH_TODAY[key] + 0.5) fail('T8 ' + key + ': width ' + Math.round(r.width) + ' > today ' + WIDTH_TODAY[key]);
    }
  }
  // wrap case: final sheet 0 with wrapN 4 -> grid pitch exact, no overlap
  const w = await page.evaluate(d => { try{localStorage.clear();}catch(e){} _adoptData(JSON.parse(JSON.stringify(d)),false); _finishLoad(true); OPT.colGap = 44; NW = 228; document.documentElement.style.setProperty('--nw', '228px'); if (CUR_SHEET !== 0) switchSheet(0); ADMIN = true; applyRO(); OPT.wrapN = 4; autoLayout(); render(); OPT.wrapN = 0;
    const by = id => S.nodes.find(n => n.id === id); const ks = S.conns.filter(c => c.f === 'prodhq').map(c => by(c.t)).filter(n => n && !n.aside); const rows = {}; ks.forEach(k => (rows[k.y] = rows[k.y] || []).push(k));
    const gs = []; Object.values(rows).forEach(r => { r.sort((a, b) => a.x - b.x); for (let i = 1; i < r.length; i++) gs.push(r[i].x - (r[i - 1].x + cardW(r[i - 1]))); });
    return { sizes: Object.values(rows).map(r => r.length), gs: [...new Set(gs.map(g => Math.round(g * 10) / 10))], badge: (document.getElementById('lint-badge') || {}).textContent }; }, DOC);
  out.info.wrap = w;
  if (!(w.sizes.length >= 2)) fail('T2 wrap: expected 2+ rows, got ' + JSON.stringify(w.sizes));
  w.gs.forEach(g => { if (Math.abs(g - 44) > 0.5) fail('T2 wrap: grid gap ' + g + ' want 44'); });
  if (!/이상 없음/.test(w.badge || '')) fail('T1 wrap: badge ' + w.badge);
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}