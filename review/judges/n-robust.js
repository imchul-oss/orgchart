async page => {
  const AFTER = __OWNER20__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e).slice(0, 200)));
  const fail = m => { if (out.fails.length < 40) out.fails.push(m); };
  const J = JSON.stringify;
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const r = await page.evaluate(async A => { const w = ms => new Promise(res => setTimeout(res, ms));
    try { localStorage.clear(); } catch (e) {} const al = []; window.alert = m => al.push(String(m)); window.confirm = () => true;
    const cv = []; const tb = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (cb, t) { cv.push([this.width, this.height]); return tb.call(this, b => { window.__blob = b ? b.size : null; cb(b); }, t); };
    const hrefs = []; HTMLAnchorElement.prototype.click = function () { hrefs.push(this.href); };
    const R = {};
    const mk = (id, type, n) => ({ id, en: 'T' + id, ko: '', type, x: 0, y: 0, m: [...Array(n)].map((_, i) => ({ n: 'P' + id + i, r: '', f: '', s: 'active' })) });
    // R1
    const nodes = [mk('a', 'top', 1), mk('b', 'l1', 2), mk('c', 'l1', 2), mk('d', 'l2', 1), mk('e', 'l2', 1), mk('f', 'l2', 0)];
    const conns = [['a', 'b'], ['a', 'c'], ['b', 'd'], ['c', 'e'], ['ghost', 'f'], ['c', 'ghost2'], ['d', 'd'], ['d', 'e'], ['e', 'd']].map((x, i) => ({ id: 'k' + i, f: x[0], t: x[1], d: 0 }));
    try { loadObject({ v: 3, sheets: [{ name: 'R1', nodes, conns }] }, false); autoLayout(); render(); await w(50);
      R.r1 = { ok: true, n: S.nodes.length, dom: document.querySelectorAll('#canvas .nd').length, lint: layoutLint().overlap };
    } catch (e) { R.r1 = { ok: false, err: String(e).slice(0, 200) }; }
    // R2
    const big = [mk('r', 'top', 2)], bc = [];
    for (let i = 0; i < 40; i++) { big.push(mk('p' + i, 'l1', 2)); bc.push({ id: 'q' + i, f: 'r', t: 'p' + i, d: 0 });
      for (let j = 0; j < 24; j++) { big.push(mk('p' + i + '_' + j, 'l2', 3)); bc.push({ id: 'q' + i + '_' + j, f: 'p' + i, t: 'p' + i + '_' + j, d: 0 }); } }
    try { loadObject({ v: 3, sheets: [{ name: 'R2', nodes: big, conns: bc }] }, false); autoLayout(); render(); await w(50);
      const a0 = al.length, h0 = hrefs.length, c0 = cv.length; window.__blob = undefined; exportPNG(); for (let k = 0; k < 100 && window.__blob === undefined; k++) await w(100);
      R.r2 = { n: S.nodes.length, canvas: cv.slice(c0).pop() || null, blob: window.__blob, href: hrefs.slice(h0).pop() || null, msg: al.slice(a0) };
    } catch (e) { R.r2 = { err: String(e).slice(0, 200) }; }
    // R3
    loadObject(JSON.parse(JSON.stringify(A)), false); if (CUR_SHEET !== 0) switchSheet(0); render(); await w(50);
    { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; const H = collHidden(); S.nodes.filter(n => !H.has(n.id)).forEach(n => { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x + cardW(n)); y1 = Math.max(y1, n.y + nh(n)); });
      const a0 = al.length, c0 = cv.length; window.__blob = undefined; exportPNG(); for (let k = 0; k < 50 && window.__blob === undefined; k++) await w(100);
      R.r3 = { canvas: cv.slice(c0).pop() || null, chartW: x1 - x0, msg: al.slice(a0), blob: window.__blob }; }
    return R; }, AFTER);
  out.info = r;
  if (!r.r1.ok) fail('R1 layout stopped: ' + r.r1.err);
  else { if (r.r1.dom !== r.r1.n) fail('R1 cards ' + r.r1.n + ' DOM ' + r.r1.dom); if (r.r1.lint) fail('R1 overlap ' + r.r1.lint); }
  const c = r.r2.canvas;
  if (r.r2.err) fail('R2 error ' + r.r2.err);
  else { if (!c || c[0] > 32000 || c[1] > 32000 || c[0] * c[1] > 1.2e8) fail('R2 canvas ' + J(c));
    if (!r.r2.blob || !/^blob:/.test(r.r2.href || '')) fail('R2 no PNG file ' + J({ blob: r.r2.blob, href: r.r2.href }));
    if (!r.r2.msg.some(m => /해상도/.test(m))) fail('R2 no message about the lowered resolution ' + J(r.r2.msg)); }
  if (!r.r3.canvas || Math.abs(r.r3.canvas[0] / 2 - r.r3.chartW) > 400 || !(r.r3.canvas[0] / 2 >= r.r3.chartW) || r.r3.msg.length || !r.r3.blob) fail('R3 owner sheet PNG ' + J(r.r3));
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}