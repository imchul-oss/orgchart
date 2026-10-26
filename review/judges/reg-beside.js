async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  const SCEN = d => {
    const s = d.sheets[0];
    const has = id => s.conns.some(c => c.f === id);
    const l1 = s.nodes.filter(n => n.type === 'l1' && has(n.id));
    const l2 = s.nodes.filter(n => n.type === 'l2');
    const P1 = l1[0], P2 = l2.find(n => !has(n.id)) || l2[l2.length - 1];
    const mem = k => [{ n: 'TF원' + k, f: '기획', r: '저줴' }];
    const add = (id, type, ko, m) => s.nodes.push({ id, en: ko, ko, type, x: 0, y: 0, m: m || mem(id) });
    add('tf1', 'side', 'TF 하나'); add('tf1a', 'l3', 'TF 하나 가', mem('a').concat(mem('b'))); add('tf1b', 'l3', 'TF 하나 나'); add('tf1a1', 'l4', 'TF 하나 가가');
    add('tf2', 'side', 'TF 둘'); add('tf2a', 'l3', 'TF 둘 가');
    add('tf3', 'side', 'TF 셋'); add('tf4', 'side', 'TF 넷');
    [{ f: P1.id, t: 'tf1', d: 1 }, { f: 'tf1', t: 'tf1a', d: 0 }, { f: 'tf1', t: 'tf1b', d: 0 }, { f: 'tf1a', t: 'tf1a1', d: 0 },
      { f: 'tf2', t: 'tf2a', d: 0 }, { f: P2.id, t: 'tf3', d: 1 }, { f: P1.id, t: 'tf4', d: 1 }].forEach((c, i) => { c.id = 'ctf' + i; s.conns.push(c); });
    return { d, P1: P1.id, P1t: P1.ko || P1.en, P2: P2.id };
  };

  const Z = ['tf1', 'tf1a', 'tf1b', 'tf1a1', 'tf2', 'tf2a'];
  const SNAP = () => ({ pos: S.nodes.map(n => n.id + ':' + n.x + ',' + n.y).sort(),
    paths: Array.prototype.map.call(document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash'), p => p.getAttribute('class') + '|' + p.getAttribute('d').replace(/\s+/g, ' ').trim()).sort() });
  async function plain(url) {
    await page.goto(url); await page.waitForTimeout(500);
    return await page.evaluate(([d, sn]) => { try { localStorage.clear(); } catch (e) {} _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(true); const r = {};
      for (const s of [0, 1]) { if (!SHEETS[s]) continue; switchSheet(s); OPT.wrapN = 0; OPT.orient = 'down'; autoLayout(); render(); r[s] = eval('(' + sn + ')')(); } return r; }, [DOC, SNAP.toString()]);
  }
  const rr = await plain('__REF__'), cc = await plain('__PAGE__');
  for (const s in rr) { if (JSON.stringify(rr[s].pos) !== JSON.stringify(cc[s].pos)) fail('R: positions differ on plain sheet ' + s); if (JSON.stringify(rr[s].paths) !== JSON.stringify(cc[s].paths)) fail('R: paths differ on plain sheet ' + s); }
  await page.goto('__PAGE__'); await page.waitForTimeout(500);
  const sc = await page.evaluate(([d, scn]) => { try { localStorage.clear(); } catch (e) {} const r = eval('(' + scn + ')')(JSON.parse(JSON.stringify(d))); _adoptData(r.d, false); _finishLoad(true); switchSheet(0); OPT.wrapN = 0; return { P1: r.P1, P2: r.P2 }; }, [DOC, SCEN.toString()]);
  for (const dir of ['down', 'right', 'left']) {
    const g = await page.evaluate(dir => { OPT.orient = dir; autoLayout(); render(); if (typeof runLint === 'function') runLint(); const lb = document.getElementById('lint-badge');
      return { nodes: S.nodes.map(n => ({ id: n.id, x: n.x, y: n.y, h: nh(n) })), NW, gap: OPT.colGap, lint: lb ? [lb.getAttribute('data-overlap'), lb.getAttribute('data-cross')] : null }; }, dir);
    const by = {}; g.nodes.forEach(n => by[n.id] = n); const NW = g.NW;
    for (let i = 0; i < g.nodes.length; i++) for (let j = i + 1; j < g.nodes.length; j++) { const a = g.nodes[i], b = g.nodes[j];
      if (Math.min(a.x + NW, b.x + NW) - Math.max(a.x, b.x) > 1 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 1) { fail('O: ' + dir + ' cards overlap ' + (a.id.startsWith('tf') ? a.id : 'main') + '/' + (b.id.startsWith('tf') ? b.id : 'main')); } }
    if (!g.lint) fail('L: no lint badge'); else if (+g.lint[0] || +g.lint[1]) fail('L: ' + dir + ' layout check reports overlap ' + g.lint[0] + ' cross ' + g.lint[1]);
    if (dir === 'down') {
      for (const [t, p] of [['tf3', sc.P2], ['tf4', sc.P1]]) { const T = by[t], P = by[p]; const gap = T.x - (P.x + NW);
        if (T.y !== P.y || gap < g.gap - 20 || gap > 2 * g.gap + 20) fail('B: ' + t + ' is not beside its parent (dy ' + (T.y - P.y) + ', gap ' + gap + ')'); }
      const maxOther = Math.max(...g.nodes.filter(n => Z.indexOf(n.id) < 0).map(n => n.x + NW));
      Z.forEach(id => { if (by[id].x < maxOther + 40) fail('Z: ' + id + ' not right of every other card'); });
    }
  }
  if (out.errors.length) fail('E: page errors ' + out.errors.slice(0, 2).join(' | '));
  out.RESULT = out.fails.length ? 'RED' : 'GREEN';
  return JSON.stringify(out);
}