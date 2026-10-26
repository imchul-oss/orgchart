async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: { cases: 0 } };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => out.fails.push(m);
  async function load(url) {
    await page.goto(url); await page.waitForTimeout(600);
    await page.evaluate(d => { _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(_hasPositions(S.nodes)); }, DOC);
    await page.waitForTimeout(300);
  }
  // connectivity of orthogonal segments; returns list of connection ids whose ends are not joined
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
      const ok = tp.some(p => [...comps(p[0], p[1])].some(x => A.has(x)));
      if (!ok) bad.push(c.f + '>' + c.t);
    });
    return bad;
  };
  const sheetCount = await (async () => { await load('__REF__'); return await page.evaluate(() => SHEETS.length); })();
  async function snap(s, w) {
    return await page.evaluate(([s, w, cc]) => {
      switchSheet(s); OPT.wrapN = w; autoLayout(); render();
      const bad = eval('(' + cc + ')')();
      return { pos: S.nodes.map(n => n.id + ':' + n.x + ',' + n.y).sort(), paths: Array.prototype.map.call(document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash'), p => p.getAttribute('class') + '|' + p.getAttribute('d').replace(/\s+/g, ' ').trim()).sort(), bad };
    }, [s, w, CONNCHECK.toString()]);
  }
  const ref = {};
  for (let s = 0; s < sheetCount; s++) for (const w of [0, 4]) ref[s + '/' + w] = await snap(s, w);
  const sane = await page.evaluate(cc => { switchSheet(0); OPT.wrapN = 0; autoLayout(); render();
    document.querySelectorAll('#svgl path.cpath').forEach(p => { const v = (p.getAttribute('d').match(/-?\d+(\.\d+)?/g) || []).map(Number); if (v.length === 4 && v[1] === v[3] && Math.abs(v[2] - v[0]) > NW) p.remove(); });
    return eval('(' + cc + ')')().length; }, CONNCHECK.toString());
  if (!sane) fail('S: the connectivity check did not notice removed buses');
  await load('__PAGE__');
  for (let s = 0; s < sheetCount; s++) for (const w of [0, 4]) {
    const c = await snap(s, w), r = ref[s + '/' + w];
    if (JSON.stringify(c.pos) !== JSON.stringify(r.pos)) fail('R: positions differ, sheet ' + s + ' wrapN ' + w);
    if (JSON.stringify(c.paths) !== JSON.stringify(r.paths)) fail('R: paths differ, sheet ' + s + ' wrapN ' + w);
    if (c.bad.length) fail('C: disconnected in R sheet ' + s + ' wrapN ' + w + ': ' + c.bad.join(','));
  }
  const leaves = await page.evaluate(() => { switchSheet(0); const root = S.nodes.find(n => n.type === 'top'); return S.conns.filter(c => c.f === root.id).map(c => c.t).filter(id => !S.conns.some(c => c.f === id)); });
  out.info.rootLeaves = leaves.length;
  if (leaves.length < 3) fail('T: root has too few leaf children for the test');
  const cases = [];
  leaves.forEach(id => cases.push({ rm: [id] }));
  leaves.forEach(id => cases.push({ aside: [id] }));
  cases.push({ aside: leaves.slice(0, 2) }); cases.push({ aside: leaves.slice(-2) }); cases.push({ aside: leaves.slice(0, 2).concat(['t_06', 't_07', 't_08']) });
  for (const cs of cases) {
    await load('__PAGE__');
    const r = await page.evaluate(([cs, cc]) => {
      switchSheet(0); OPT.wrapN = 0;
      (cs.rm || []).forEach(id => { S.conns = S.conns.filter(c => c.t !== id && c.f !== id); S.nodes = S.nodes.filter(n => n.id !== id); });
      (cs.aside || []).forEach(id => { S.nodes.find(n => n.id === id).aside = true; });
      autoLayout(); render();
      const L = layoutLint();
      return { o: L.overlap, c: L.cross, b: L.brokenN, bad: eval('(' + cc + ')')() };
    }, [cs, CONNCHECK.toString()]);
    out.info.cases++;
    const tag = JSON.stringify(cs);
    if (r.o || r.c || r.b) fail('T: lint ' + JSON.stringify({ o: r.o, c: r.c, b: r.b }) + ' for ' + tag);
    if (r.bad.length) fail('C: disconnected ' + r.bad.join(',') + ' for ' + tag);
  }
  if (out.errors.length) fail('E: page errors ' + out.errors.slice(0, 2).join(' | '));
  out.RESULT = out.fails.length ? 'RED' : 'GREEN';
  return JSON.stringify(out);
}