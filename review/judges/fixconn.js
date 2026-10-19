async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: { cases: 0 } };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 80) out.fails.push(m); };
  async function load(url) {
    await page.goto(url); await page.waitForTimeout(500);
    await page.evaluate(d => { _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(_hasPositions(S.nodes)); }, DOC);
    await page.waitForTimeout(200);
  }
  const CONNCHECK = () => {
    const segs = [];
    document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash').forEach(p => {
      const v = ((p.getAttribute('d') || '').match(/-?\d+(\.\d+)?/g) || []).map(Number);
      for (let k = 0; k + 3 < v.length; k += 2) segs.push([v[k], v[k + 1], v[k + 2], v[k + 3]]);
    });
    const E = 1.5;
    const on = (s, x, y) => x >= Math.min(s[0], s[2]) - E && x <= Math.max(s[0], s[2]) + E && y >= Math.min(s[1], s[3]) - E && y <= Math.max(s[1], s[3]) + E;
    const touch = (a, b) => on(a, b[0], b[1]) || on(a, b[2], b[3]) || on(b, a[0], a[1]) || on(b, a[2], a[3]) ||
      (a[0] === a[2] && b[1] === b[3] && on(a, a[0], b[1]) && on(b, a[0], b[1])) || (a[1] === a[3] && b[0] === b[2] && on(a, b[0], a[1]) && on(b, b[0], a[1]));
    const par = segs.map((_, i) => i); const find = i => par[i] === i ? i : (par[i] = find(par[i]));
    for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) if (touch(segs[i], segs[j])) par[find(i)] = find(j);
    const comps = (x, y) => new Set(segs.map((s, i) => on(s, x, y) ? find(i) : -1).filter(c => c >= 0));
    const bad = [];
    S.conns.forEach(c => {
      const f = S.nodes.find(n => n.id === c.f), t = S.nodes.find(n => n.id === c.t); if (!f || !t) return;
      const fp = [[f.x + NW / 2, f.y + nh(f)], [f.x + NW, f.y + CUR_HH / 2], [f.x, f.y + CUR_HH / 2], [f.x + NW / 2, f.y], [f.x + NW, f.y + nh(f) / 2], [f.x, f.y + nh(f) / 2], [f.x + 20, f.y + nh(f)]];
      const tp = [[t.x + NW / 2, t.y], [t.x, t.y + CUR_HH / 2], [t.x + NW, t.y + CUR_HH / 2], [t.x, t.y + nh(t) / 2], [t.x + NW, t.y + nh(t) / 2], [t.x + NW / 2, t.y + nh(t)]];
      const A = new Set(); fp.forEach(p => comps(p[0], p[1]).forEach(x => A.add(x)));
      if (!tp.some(p => [...comps(p[0], p[1])].some(x => A.has(x)))) bad.push(c.f + '>' + c.t);
    });
    return bad;
  };
  const HELP = () => {
    window.__setup = (cs) => {
      switchSheet(0); OPT.wrapN = 0;
      const P = { prodhq: ['t_06', 't_07', 't_08'], fp: ['t_01', 't_02'] };
      Object.entries(P).forEach(([pid, ids]) => ids.forEach(id => { S.nodes.find(n => n.id === id).aside = true; }));
      const p = S.nodes.find(n => n.id === cs.p);
      if (cs.ad) p.ad = cs.ad; else delete p.ad;
      if (cs.ac > 1) p.ac = cs.ac; else delete p.ac;
      (cs.dash || []).forEach(id => { S.conns.find(c => c.t === id).d = true; });
      autoLayout(); render();
    };
    window.__snap = () => ({ pos: S.nodes.map(n => n.id + ':' + n.x + ',' + n.y).sort(),
      paths: Array.prototype.map.call(document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash'), p => p.getAttribute('class') + '|' + p.getAttribute('d').replace(/\s+/g, ' ').trim()).sort() });
    window.__hit = (x, y) => { const svg = document.getElementById('svgl'); const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const q = pt.matrixTransform(svg.getScreenCTM());
      const el = document.elementsFromPoint(q.x, q.y).find(e => e.classList && e.classList.contains('chit')); const m = el && (el.getAttribute('onclick') || '').match(/selectConn\('([^']+)'\)/); return m ? m[1] : null; };
    window.__lint = () => { const r = layoutLint(); return [r.overlap, r.cross, r.brokenN]; };
    window.__scrollTo = (x, y) => { const w = document.getElementById('wrap'); w.scrollLeft = Math.max(0, x * S.scale - w.clientWidth / 2); w.scrollTop = Math.max(0, y * S.scale - w.clientHeight / 2); };
  };
  const cases = [];
  for (const p of ['prodhq', 'fp']) for (const ad of [null, 'L', 'B']) for (const ac of [1, 2, 3]) cases.push({ p, ad, ac });
  const ref = {};
  for (const cs of cases) { await load('__REF__'); await page.evaluate(HELP); ref[JSON.stringify(cs)] = await page.evaluate(cs => { __setup(cs); return __snap(); }, cs); }
  for (const cs of cases) {
    await load('__PAGE__'); await page.evaluate(HELP);
    const tag = JSON.stringify(cs); out.info.cases++;
    const r = await page.evaluate(([cs, cc]) => {
      __setup(cs); const s1 = __snap(); autoLayout(); render(); const s2 = __snap();
      const P = S.nodes.find(n => n.id === cs.p); const ids = cs.p === 'prodhq' ? ['t_06', 't_07', 't_08'] : ['t_01', 't_02'];
      const cards = ids.map(id => S.nodes.find(n => n.id === id)); const cid = id => S.conns.find(c => c.f === cs.p && c.t === id).id;
      const ay = P.y + CUR_HH / 2; const C = (P.ac === 2 || P.ac === 3) ? P.ac : 1; const k = [];
      __scrollTo(P.x + NW / 2, P.y + 150);
      [1, -1].forEach(dir => {
        const mine = cards.filter(t => dir > 0 ? t.x > P.x : t.x < P.x).sort((a, b) => (a.y - b.y) || (Math.abs(a.x - P.x) - Math.abs(b.x - P.x)));
        if (!mine.length) return;
        const E = dir > 0 ? P.x + NW : P.x, xs = dir > 0 ? P.x + NW + Math.round(OPT.colGap / 2) : P.x - Math.round(OPT.colGap / 2);
        for (let x = Math.min(E, xs) + 3; x <= Math.max(E, xs) - 3; x += 3) { const h = __hit(x, ay); if (h !== cid(mine[0].id)) k.push('stub side ' + dir + ' at +' + (x - Math.min(E, xs)) + ' selects ' + h + ', want ' + cid(mine[0].id)); }
        mine.forEach(t => {
          const pt = C === 1 ? [dir > 0 ? t.x - 6 : t.x + NW + 6, t.y + CUR_HH / 2] : [t.x + NW / 2, t.y - 2];
          const h = __hit(pt[0], pt[1]); if (h !== cid(t.id)) k.push('own segment of ' + t.id + ' selects ' + h + ', want ' + cid(t.id));
        });
      });
      const nosib = Array.prototype.filter.call(document.querySelectorAll('#svgl path.chit'), c => { const n = c.nextElementSibling; return !(n && (n.classList.contains('cpath') || n.classList.contains('cpath-dash'))); }).length;
      return { s1, s2, k, nosib, lint: __lint(), bad: eval('(' + cc + ')')() };
    }, [cs, CONNCHECK.toString()]);
    if (r.nosib) fail('H: ' + r.nosib + ' chit paths without their own visible path right after them (hover dim) ' + tag);
    const f = ref[tag];
    /* ASIDE3 (owner 2026-10-19): ac 2/3 beside geometry changed on purpose; its rules are judged by orgchart-aside3/VERIFY_aside3.js, so the reference identity covers ac 1 only */
    if (!(cs.ac > 1)) {
    if (JSON.stringify(r.s1.pos) !== JSON.stringify(f.pos)) fail('R: positions differ ' + tag);
    if (JSON.stringify(r.s1.paths) !== JSON.stringify(f.paths)) fail('R: visible paths differ ' + tag);
    }
    if (JSON.stringify(r.s1.pos) !== JSON.stringify(r.s2.pos)) fail('S: second autoLayout moved cards ' + tag);
    r.k.forEach(m => fail('K: ' + tag + ' ' + m));
    if (r.lint.some(x => x)) fail('R: lint ' + r.lint + ' ' + tag);
    if (r.bad.length) fail('R: disconnected ' + r.bad + ' ' + tag);
  }
  const mixed = [];
  for (const ac of [1, 2, 3]) for (const ad of [null, 'B']) for (const d of ['t_06', 't_07', 't_08']) mixed.push({ p: 'prodhq', ad, ac, dash: [d] });
  mixed.push({ p: 'fp', ad: null, ac: 1, dash: ['t_02'] }); mixed.push({ p: 'fp', ad: 'L', ac: 2, dash: ['t_01'] });
  for (const cs of mixed) {
    await load('__PAGE__'); await page.evaluate(HELP);
    const tag = JSON.stringify(cs); out.info.cases++;
    const r = await page.evaluate(([cs, cc]) => {
      __setup(cs);
      const segs = []; document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash').forEach(p => { const n = (p.getAttribute('d').match(/-?\d+(\.\d+)?/g) || []).map(Number);
        for (let k = 0; k + 3 < n.length; k += 2) segs.push([p.getAttribute('class'), n[k], n[k + 1], n[k + 2], n[k + 3]]); });
      let ov = 0;
      for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) { const a = segs[i], b = segs[j]; if (a[0] === b[0]) continue;
        if (a[2] === a[4] && b[2] === b[4] && a[2] === b[2]) { if (Math.min(Math.max(a[1], a[3]), Math.max(b[1], b[3])) - Math.max(Math.min(a[1], a[3]), Math.min(b[1], b[3])) > 2) ov++; }
        if (a[1] === a[3] && b[1] === b[3] && a[1] === b[1]) { if (Math.min(Math.max(a[2], a[4]), Math.max(b[2], b[4])) - Math.max(Math.min(a[2], a[4]), Math.min(b[2], b[4])) > 2) ov++; } }
      const P = S.nodes.find(n => n.id === cs.p); const ids = cs.p === 'prodhq' ? ['t_06', 't_07', 't_08'] : ['t_01', 't_02']; const C = (P.ac === 2 || P.ac === 3) ? P.ac : 1;
      const style = [];
      ids.forEach(id => { const t = S.nodes.find(n => n.id === id); const c = S.conns.find(k => k.f === cs.p && k.t === id); const dir = t.x > P.x ? 1 : -1;
        const pt = C === 1 ? [dir > 0 ? t.x : t.x + NW, t.y + CUR_HH / 2] : [t.x + NW / 2, t.y];
        const own = segs.filter(s => (Math.abs(s[3] - pt[0]) < 1 && Math.abs(s[4] - pt[1]) < 1) || (Math.abs(s[1] - pt[0]) < 1 && Math.abs(s[2] - pt[1]) < 1));
        const want = c.d ? 'cpath-dash' : 'cpath'; if (!own.length || own.some(s => s[0] !== want)) style.push(id + ' own segment ' + (own.map(s => s[0]).join('/') || 'none') + ', want ' + want); });
      return { ov, style, lint: __lint(), bad: eval('(' + cc + ')')() };
    }, [cs, CONNCHECK.toString()]);
    if (r.ov) fail('M: ' + r.ov + ' solid/dashed overlaps ' + tag);
    r.style.forEach(m => fail('M: ' + tag + ' ' + m));
    if (r.lint.some(x => x)) fail('M: lint ' + r.lint + ' ' + tag);
    if (r.bad.length) fail('M: disconnected ' + r.bad + ' ' + tag);
  }
  const moves = [];
  for (const ac of [1, 2]) for (const mv of ['t_01', 't_02']) { moves.push({ p: 'fp', ad: null, ac, mv, to: 'L' }); moves.push({ p: 'fp', ad: 'L', ac, mv, to: 'R' }); }
  for (const cs of moves) {
    await load('__PAGE__'); await page.evaluate(HELP);
    const tag = JSON.stringify(cs); out.info.cases++;
    const r = await page.evaluate(([cs, cc]) => {
      __setup(cs); const P = S.nodes.find(n => n.id === cs.p); const t = S.nodes.find(n => n.id === cs.mv);
      t.x = cs.to === 'L' ? Math.round((P.x - NW - OPT.colGap) / 20) * 20 : Math.round((P.x + NW + OPT.colGap) / 20) * 20;
      render(); return { lint: __lint(), bad: eval('(' + cc + ')')() };
    }, [cs, CONNCHECK.toString()]);
    if (r.lint.some(x => x)) fail('D: lint ' + r.lint + ' ' + tag);
    if (r.bad.length) fail('D: disconnected ' + r.bad + ' ' + tag);
  }
  if (out.errors.length) fail('E: page errors ' + out.errors.slice(0, 2).join(' | '));
  out.RESULT = out.fails.length ? 'RED' : 'GREEN';
  return JSON.stringify(out);
}