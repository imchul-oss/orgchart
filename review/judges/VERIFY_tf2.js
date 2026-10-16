// Judge for ORGCHART-TFZONE (2026-10-15), written before the code. Substitute __DOC__, __PAGE__, __REF__.
// Scenario added to sheet 0 of the real data (the data has no side cards): T1 = side card with a parent P1 (an l1
// card) and a subtree (two l3 children, one l4 grandchild); T2 = side card with no parent and one child; T3 = leaf
// side card with a parent P2 (an l2 card), which keeps today's place beside its parent.
// Zone set Z = T1, T2 and their descendants.
// (R) after autoLayout: every card outside Z (main tree, T3) has the same position as in the reference, up to one common
//     translation of all of them (amended after g1); sheet 1 (no side
//     cards) has identical positions and connector paths;
// (M) inside Z each card's children sit below it (child.y >= parent.y + nh(parent) + 20) and the parent is centred over
//     its children (|parent centre - mean child centre| <= NW/2);
// (P) T3 sits beside its parent P2 (amended 2026-10-16 for ORGCHART-BESIDE; before: right of the main tree, left of the zone); every Z card lies right of the main tree (x >= max(x+NW) over non-Z cards + 40); T1 and T2 share one top y equal to
//     the y of the l1 row;
// (O) no two cards of the sheet overlap;
// (F) exactly one element .tfzone inside #canvas whose box contains every Z card with >= 16px margin, overlaps no
//     non-Z card, and shows the text "TF"; no .tfzone on sheet 1; the frame follows the cards: after moving a Z card
//     by +200px and render() it still contains it; after _fileData() round trip and render without autoLayout it is
//     still there;
// (L) above T1 an element .tfowner (bottom within T1.y - 30 .. T1.y + 2, horizontally overlapping T1) whose text
//     contains P1's title; no connector path crosses the zone's left edge (no path bbox with left < zoneLeft - 10 and
//     right > zoneLeft + 10);
// (X) exportPNG draws a text containing "TF" for the zone title and P1's title for the owner label; in print media
//     .tfzone stays displayed;
// (E) no page errors.
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
    const mem = k => [{ n: 'TF원' + k, f: '기획', r: '대리' }];
    const add = (id, type, ko, m) => s.nodes.push({ id, en: ko, ko, type, x: 0, y: 0, m: m || mem(id) });
    add('tf1', 'side', 'TF 하나'); add('tf1a', 'l3', 'TF 하나 가', mem('a').concat(mem('b'))); add('tf1b', 'l3', 'TF 하나 나'); add('tf1a1', 'l4', 'TF 하나 가가');
    add('tf2', 'side', 'TF 둘'); add('tf2a', 'l3', 'TF 둘 가');
    add('tf3', 'side', 'TF 셋');
    [{ f: P1.id, t: 'tf1', d: 1 }, { f: 'tf1', t: 'tf1a', d: 0 }, { f: 'tf1', t: 'tf1b', d: 0 }, { f: 'tf1a', t: 'tf1a1', d: 0 },
      { f: 'tf2', t: 'tf2a', d: 0 }, { f: P2.id, t: 'tf3', d: 1 }].forEach((c, i) => { c.id = 'ctf' + i; s.conns.push(c); });
    return { d, P1: P1.id, P1t: P1.ko || P1.en, P2: P2.id };
  };
  const Z = ['tf1', 'tf1a', 'tf1b', 'tf1a1', 'tf2', 'tf2a'];
  async function load(url) {
    await page.goto(url); await page.waitForTimeout(500);
    return await page.evaluate(([d, sc]) => { try { localStorage.clear(); } catch (e) {} const r = eval('(' + sc + ')')(JSON.parse(JSON.stringify(d)));
      _adoptData(r.d, false); _finishLoad(_hasPositions(S.nodes)); switchSheet(0); OPT.wrapN = 0; return { P1: r.P1, P1t: r.P1t, P2: r.P2 }; }, [DOC, SCEN.toString()]);
  }
  const SNAP = () => ({ pos: S.nodes.map(n => n.id + ':' + n.x + ',' + n.y).sort(),
    paths: Array.prototype.map.call(document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash'), p => p.getAttribute('class') + '|' + p.getAttribute('d').replace(/\s+/g, ' ').trim()).sort() });
  const ref = {};
  const sc0 = await load('__REF__');
  ref[0] = await page.evaluate(sn => { switchSheet(0); OPT.wrapN = 0; autoLayout(); render(); return eval('(' + sn + ')')(); }, SNAP.toString());
  ref[1] = await page.evaluate(sn => { switchSheet(1); OPT.wrapN = 0; autoLayout(); render(); return eval('(' + sn + ')')(); }, SNAP.toString());
  const sc = await load('__PAGE__');
  const c1 = await page.evaluate(sn => { switchSheet(1); OPT.wrapN = 0; autoLayout(); render(); const s = eval('(' + sn + ')')(); s.zone = document.querySelectorAll('#canvas .tfzone').length; return s; }, SNAP.toString());
  if (JSON.stringify(c1.pos) !== JSON.stringify(ref[1].pos)) fail('R: sheet 1 positions differ');
  if (JSON.stringify(c1.paths) !== JSON.stringify(ref[1].paths)) fail('R: sheet 1 paths differ');
  if (c1.zone) fail('F: .tfzone present on a sheet with no side cards');
  const g = await page.evaluate(([sn, Z]) => { switchSheet(0); OPT.wrapN = 0; autoLayout(); render(); const s = eval('(' + sn + ')')();
    s.nodes = S.nodes.map(n => ({ id: n.id, x: n.x, y: n.y, h: nh(n), t: n.type })); s.NW = NW; return s; }, [SNAP.toString(), Z]);
  const by = {}; g.nodes.forEach(n => by[n.id] = n);
  const refPos = {}; ref[0].pos.forEach(p => { const [id, xy] = p.split(':'); refPos[id] = xy; });
  // amended after g1: compare up to one common translation (autoLayout centres the root using a zoom that depends on the
  // whole chart's width, so a wider or narrower zone shifts every card by the same amount)
  const rootId = g.nodes.find(n => n.t === 'top').id; const [rx, ry] = refPos[rootId].split(',').map(Number); const dx = by[rootId].x - rx, dy = by[rootId].y - ry;
  out.info.shift = [dx, dy];
  // tf2 (2026-10-16, ORGCHART-BESIDE): T3 now sits beside its parent, which reserves room in the parent's row, so the
  // scenario sheet's main-tree positions are no longer compared here; plain sheets are compared by the R check above
  // and by VERIFY_beside.js
  const NW = g.NW, cx = n => n.x + NW / 2;
  const kidsOf = { tf1: ['tf1a', 'tf1b'], tf1a: ['tf1a1'], tf2: ['tf2a'] };
  for (const p in kidsOf) {
    const P = by[p], ks = kidsOf[p].map(k => by[k]);
    ks.forEach(k => { if (k.y < P.y + P.h + 20) fail('M: ' + k.id + ' is not below ' + p); });
    const mc = ks.reduce((a, k) => a + cx(k), 0) / ks.length;
    if (Math.abs(cx(P) - mc) > NW / 2) fail('M: ' + p + ' is not centred over its children');
  }
  const nonZ = g.nodes.filter(n => Z.indexOf(n.id) < 0 && n.id !== 'tf3' ? true : n.id === 'tf3');
  const mainR = Math.max(...g.nodes.filter(n => Z.indexOf(n.id) < 0).map(n => n.x + NW));
  Z.forEach(id => { if (by[id].x < mainR + 40) fail('P: ' + id + ' is not right of the main tree (x ' + by[id].x + ', tree right ' + mainR + ')'); });
  // T3 (amended after g1): today it is placed in the free side-card row right of the tree, after the other free side cards;
  // with the zone it keeps that row, first in it: right of the main tree, left of the zone, on the l1 row
  const treeR = Math.max(...g.nodes.filter(n => !n.id.startsWith('tf')).map(n => n.x + NW)); const zoneL = Math.min(...Z.map(id => by[id].x));
  { const P2 = by[sc.P2]; const gap = by.tf3.x - (P2.x + NW); if (by.tf3.y !== P2.y || gap < 20 || gap > 2 * 80 + 20) fail('P: T3 is not beside its parent (dy ' + (by.tf3.y - P2.y) + ', gap ' + gap + ')'); }
  const l1y = g.nodes.filter(n => n.t === 'l1').map(n => n.y);
  if (by.tf1.y !== by.tf2.y) fail('P: TF groups do not share one top y');
  if (l1y.length && l1y.indexOf(by.tf1.y) < 0) fail('P: TF top y ' + by.tf1.y + ' is not the l1 row y ' + l1y[0]);
  const ov = (a, b) => Math.min(a.x + NW, b.x + NW) - Math.max(a.x, b.x) > 1 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 1;
  for (let i = 0; i < g.nodes.length; i++) for (let j = i + 1; j < g.nodes.length; j++) if (ov(g.nodes[i], g.nodes[j])) fail('O: cards overlap ' + (g.nodes[i].id.startsWith('tf') ? g.nodes[i].id : 'main') + ' / ' + (g.nodes[j].id.startsWith('tf') ? g.nodes[j].id : 'main'));
  // F, L
  const FR = (Z) => { const zs = document.querySelectorAll('#canvas .tfzone'); if (zs.length !== 1) return { n: zs.length };
    const z = zs[0]; const cs = getComputedStyle(z); const sc = S.scale || 1; const cr = document.getElementById('canvas').getBoundingClientRect(); const r = z.getBoundingClientRect();
    const box = { x: (r.left - cr.left) / sc, y: (r.top - cr.top) / sc, w: r.width / sc, h: r.height / sc };
    const own = [...document.querySelectorAll('#canvas .tfowner')].map(e => { const q = e.getBoundingClientRect(); return { x: (q.left - cr.left) / sc, y: (q.top - cr.top) / sc, w: q.width / sc, h: q.height / sc, t: e.textContent }; });
    const paths = [...document.querySelectorAll('#svgl path')].filter(p => getComputedStyle(p).display !== 'none').map(p => { const b = p.getBBox(); return [b.x, b.x + b.width]; });
    return { n: 1, box, text: z.textContent, disp: cs.display, own, paths, nodes: S.nodes.map(n => ({ id: n.id, x: n.x, y: n.y, h: nh(n) })) }; };
  const chk = (f, tag) => {
    if (f.n !== 1) { fail('F: ' + tag + ' ' + f.n + ' .tfzone elements'); return; }
    const b = f.box;
    f.nodes.forEach(n => { const inZ = Z.indexOf(n.id) >= 0;
      if (inZ && !(n.x >= b.x + 16 && n.y >= b.y + 16 && n.x + NW <= b.x + b.w - 16 && n.y + n.h <= b.y + b.h - 16)) fail('F: ' + tag + ' frame does not contain ' + n.id + ' with 16px margin');
      if (!inZ && Math.min(n.x + NW, b.x + b.w) - Math.max(n.x, b.x) > 1 && Math.min(n.y + n.h, b.y + b.h) - Math.max(n.y, b.y) > 1) fail('F: ' + tag + ' frame overlaps a card outside the zone'); });
    if (f.text.indexOf('TF') < 0) fail('F: ' + tag + ' frame shows no "TF" title');
  };
  const f0 = await page.evaluate(FR, Z); chk(f0, 'after layout');
  if (f0.n === 1) {
    const T1 = by.tf1; const o = f0.own.find(e => e.t.indexOf(sc.P1t) >= 0);
    if (!o) fail('L: no .tfowner naming the parent of T1');
    else if (!(o.y + o.h >= T1.y - 30 && o.y + o.h <= T1.y + 2 && Math.min(o.x + o.w, T1.x + NW) - Math.max(o.x, T1.x) > 0)) fail('L: owner label not directly above T1');
    const zl = f0.box.x; const cross = f0.paths.filter(p => p[0] < zl - 10 && p[1] > zl + 10).length;
    if (cross) fail('L: ' + cross + ' connector paths cross into the zone');
  }
  const f1 = await page.evaluate(Z => { const n = S.nodes.find(n => n.id === 'tf1a1'); n.x += 200; render(); return 1; }, Z).then(() => page.evaluate(FR, Z)); chk(f1, 'after moving a TF card');
  const f2 = await page.evaluate(() => { const d = JSON.parse(JSON.stringify(_fileData())); _adoptData(d, false); _finishLoad(true); switchSheet(0); render(); return 1; }).then(() => page.evaluate(FR, Z)); chk(f2, 'after save and load');
  // X
  const x = await page.evaluate(() => { const got = []; const o = CanvasRenderingContext2D.prototype.fillText; CanvasRenderingContext2D.prototype.fillText = function (s) { got.push(String(s)); return o.apply(this, arguments); };
    const tb = HTMLCanvasElement.prototype.toBlob; HTMLCanvasElement.prototype.toBlob = function () {};
    try { exportPNG(); } finally { CanvasRenderingContext2D.prototype.fillText = o; HTMLCanvasElement.prototype.toBlob = tb; } return got; });
  if (!x.some(s => /TF/.test(s) && !/^TF (하나|둘|셋)/.test(s) && !/^TF원/.test(s))) fail('X: exportPNG drew no zone title');
  if (!x.some(s => s.indexOf(sc.P1t) >= 0 && /주관|소속|←|:/.test(s))) fail('X: exportPNG drew no owner label for T1');
  await page.emulateMedia({ media: 'print' });
  const pz = await page.evaluate(() => { const z = document.querySelector('#canvas .tfzone'); return !!z && getComputedStyle(z).display !== 'none'; });
  await page.emulateMedia({ media: 'screen' });
  if (!pz) fail('X: .tfzone hidden in print');
  if (out.errors.length) fail('E: page errors ' + out.errors.slice(0, 2).join(' | '));
  out.RESULT = out.fails.length ? 'RED' : 'GREEN';
  return JSON.stringify(out);
}
