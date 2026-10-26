async page => {
  const DOC = __DOC__;
  const out = { errors: [], sheets: [], fails: [] };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => out.fails.push(m);
  async function load(url) {
    await page.goto(url); await page.waitForTimeout(600);
    await page.evaluate(d => { _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(_hasPositions(S.nodes)); }, DOC);
    await page.waitForTimeout(300);
  }
  async function toSheet(i) { await page.evaluate(i => { switchSheet(i); }, i); await page.waitForTimeout(300); }
  async function pos(n) { return await page.evaluate(n => { OPT.wrapN = n; autoLayout(); render(); return S.nodes.map(x => [x.id, x.x, x.y]); }, n); }
  // independent count, same definitions as the brief
  async function judgeCount() {
    return await page.evaluate(() => {
      const segs = [];
      document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash').forEach(p => {
        const v = ((p.getAttribute('d') || '').match(/-?\d+(\.\d+)?/g) || []).map(Number);
        for (let k = 0; k + 3 < v.length; k += 2) segs.push([v[k], v[k + 1], v[k + 2], v[k + 3]]);
      });
      const N = S.nodes.map(n => ({ id: n.id, x: n.x, y: n.y, w: NW, h: nh(n), side: n.type === 'side' }));
      const byId = {}; N.forEach(n => byId[n.id] = n);
      let overlap = 0;
      for (let a = 0; a < N.length; a++) for (let b = a + 1; b < N.length; b++) {
        const A = N[a], B = N[b];
        if (A.x < B.x + B.w && B.x < A.x + A.w && A.y < B.y + B.h && B.y < A.y + A.h) overlap++;
      }
      const crossSet = {};
      segs.forEach(s => {
        const x1 = Math.min(s[0], s[2]), x2 = Math.max(s[0], s[2]), y1 = Math.min(s[1], s[3]), y2 = Math.max(s[1], s[3]);
        N.forEach(n => { if (x2 > n.x + 3 && x1 < n.x + n.w - 3 && y2 > n.y + 3 && y1 < n.y + n.h - 3) crossSet[n.id] = 1; });
      });
      let broken = 0;
      S.conns.forEach(c => {
        const f = byId[c.f], t = byId[c.t];
        if (!f || !t) { broken++; return; }
        if (t.side) return;
        const tx = t.x + t.w / 2, ty = t.y;
        const ok = segs.some(s => (Math.abs(s[0] - s[2]) <= 2) && ((Math.abs(s[2] - tx) <= 2 && Math.abs(s[3] - ty) <= 2) || (Math.abs(s[0] - tx) <= 2 && Math.abs(s[1] - ty) <= 2)));
        if (!ok) broken++;
      });
      const cross = Object.keys(crossSet).length;
      return { overlap, cross, broken, count: overlap + cross + broken };
    });
  }
  async function badge() {
    return await page.evaluate(() => {
      const b = document.getElementById('lint-badge'); if (!b) return null;
      const g = k => b.getAttribute('data-' + k);
      return { overlap: +g('overlap'), cross: +g('cross'), broken: +g('broken'), count: +g('count'), text: (b.textContent || '').trim(),
        visible: !!(b.offsetParent && b.getBoundingClientRect().width > 0),
        bad: Array.prototype.map.call(document.querySelectorAll('.nd.lint-bad'), e => e.id.slice(1)) };
    });
  }
  async function clickBadge() { if (await page.locator('#lint-badge').count()) { await page.locator('#lint-badge').click({ timeout: 5000 }); return true; } return false; }
  function same(tag, b, j) {
    if (!b) { fail(tag + ': no #lint-badge'); return false; }
    const ok = b.overlap === j.overlap && b.cross === j.cross && b.broken === j.broken && b.count === j.count;
    if (!ok) fail(tag + ': badge ' + JSON.stringify([b.overlap, b.cross, b.broken, b.count]) + ' != judge ' + JSON.stringify([j.overlap, j.cross, j.broken, j.count]));
    return ok;
  }
  // reference positions
  await load('__REF__');  // fix21: position reference re-baselined to the fix21 build (was the orgchart-wrap clone file)
  const ref = [];
  for (let i = 0; i < DOC.sheets.length; i++) { await toSheet(i); ref.push({ w0: await pos(0), w4: await pos(4) }); }
  await load('__PAGE__');
  // (V) read-only visibility
  const b0 = await badge();
  if (!b0 || !b0.visible) fail('V: badge not visible in read-only mode');
  for (let i = 0; i < DOC.sheets.length; i++) {
    const r = { name: DOC.sheets[i].name };
    await load('__PAGE__'); await toSheet(i);
    // (P)
    const p0 = await pos(0), p4 = await pos(4);
    if (JSON.stringify(p0) !== JSON.stringify(ref[i].w0)) fail(r.name + ' P: wrapN 0 positions differ from reference');
    if (JSON.stringify(p4) !== JSON.stringify(ref[i].w4)) fail(r.name + ' P: wrapN 4 positions differ from reference');
    // (Z)
    await page.evaluate(() => { OPT.wrapN = 0; autoLayout(); render(); });
    await page.waitForTimeout(200);
    let j = await judgeCount(), b = await badge();
    r.Z = { judge: j, badge: b && [b.overlap, b.cross, b.broken, b.count], text: b && b.text };
    same(r.name + ' Z', b, j);
    if (j.count !== 0) fail(r.name + ' Z: real data has judge count ' + j.count);
    if (b && !/이상 없음/.test(b.text)) fail(r.name + ' Z: badge text lacks 이상 없음: ' + b.text);
    if (b && b.bad.length) fail(r.name + ' Z: lint-bad on ' + b.bad.join(','));
    // pick two leaf siblings A, B
    const pair = await page.evaluate(() => {
      const kids = {}; S.conns.forEach(c => (kids[c.f] = kids[c.f] || []).push(c.t));
      for (const p in kids) { const l = kids[p].filter(k => !kids[k] && S.nodes.find(n => n.id === k && n.type !== 'side')); if (l.length >= 2) return [l[0], l[1]]; }
      return null;
    });
    if (!pair) { fail(r.name + ': no leaf pair'); out.sheets.push(r); continue; }
    const [A, B] = pair; r.pair = pair;
    // (D) real mouse drag of B onto A
    await page.evaluate(() => { ADMIN = true; fitScreen(); });
    await page.waitForTimeout(300);
    const ra = await page.locator('#n' + A).boundingBox(), rb = await page.locator('#n' + B).boundingBox();
    await page.mouse.move(rb.x + rb.width / 2, rb.y + 6); await page.mouse.down();
    await page.mouse.move((rb.x + ra.x) / 2 + rb.width / 2, (rb.y + ra.y) / 2 + 6, { steps: 5 });
    await page.mouse.move(ra.x + ra.width / 2, ra.y + 6, { steps: 5 }); await page.mouse.up();
    await page.waitForTimeout(400);
    j = await judgeCount(); b = await badge();
    r.D = { judge: j, badge: b && [b.overlap, b.cross, b.broken, b.count], bad: b && b.bad, text: b && b.text };
    if (j.overlap < 1) fail(r.name + ' D: drag did not produce an overlap (judge)');
    same(r.name + ' D', b, j);
    if (b && !(b.bad.includes(A) && b.bad.includes(B))) fail(r.name + ' D: lint-bad missing on ' + A + '/' + B + ' got ' + b.bad.join(','));
    if (b && /이상 없음/.test(b.text)) fail(r.name + ' D: badge still says 이상 없음');
    if (b && b.text.indexOf(String(b.count)) < 0) fail(r.name + ' D: badge text lacks the count');
    // (L) panel and focus
    const names = await page.evaluate(ids => ids.map(id => S.nodes.find(n => n.id === id).en), [A, B]);
    await page.evaluate(() => { doZoomAbs(300); const w = document.getElementById('wrap'); w.scrollLeft = w.scrollWidth; w.scrollTop = w.scrollHeight; });
    await page.waitForTimeout(300);
    await clickBadge();
    await page.waitForTimeout(300);
    const items = await page.evaluate(() => {
      const p = document.getElementById('lint-panel');
      const cs = p && getComputedStyle(p); const vis = !!(p && cs.display !== 'none' && cs.visibility !== 'hidden' && p.getBoundingClientRect().height > 0);
      return { vis, items: Array.prototype.map.call(document.querySelectorAll('#lint-panel .lint-item'), e => ({ t: e.textContent, n: e.getAttribute('data-nodes') || '' })) };
    });
    r.L = items;
    if (!items.vis) fail(r.name + ' L: #lint-panel not visible after clicking the badge');
    const idx = items.items.findIndex(it => it.n.split(',').includes(A) && it.n.split(',').includes(B));
    if (idx < 0) fail(r.name + ' L: no .lint-item with data-nodes containing ' + A + ',' + B);
    else {
      if (!(items.items[idx].t.includes(names[0]) && items.items[idx].t.includes(names[1]))) fail(r.name + ' L: item text lacks card names');
      const before = await page.evaluate(() => { const w = document.getElementById('wrap'); return [w.scrollLeft, w.scrollTop]; });
      await page.locator('#lint-panel .lint-item').nth(idx).click({ timeout: 5000 });
      await page.waitForTimeout(500);
      const inView = await page.evaluate(id => {
        const w = document.getElementById('wrap').getBoundingClientRect(), c = document.getElementById('n' + id).getBoundingClientRect();
        const cx = c.left + c.width / 2, cy = c.top + c.height / 2;
        return cx > w.left && cx < w.right && cy > w.top && cy < w.bottom;
      }, A);
      r.L.before = before; r.L.inView = inView;
      if (!inView) fail(r.name + ' L: clicking the item did not bring ' + A + ' into view');
    }
    // (X) a card on a parent's stub
    await load('__PAGE__'); await toSheet(i);
    await page.evaluate(() => { OPT.wrapN = 0; autoLayout(); render(); });
    await page.evaluate(([A]) => {
      const kids = {}; S.conns.forEach(c => (kids[c.f] = kids[c.f] || []).push(c.t));
      const P = S.nodes.find(n => kids[n.id] && kids[n.id].length >= 2 && !kids[n.id].includes(A));
      const L = S.nodes.find(n => n.id === A);
      L.x = P.x; L.y = P.y + nh(P) + 4; render();
    }, [A]);
    await page.waitForTimeout(300);
    j = await judgeCount(); b = await badge();
    r.X = { judge: j, badge: b && [b.overlap, b.cross, b.broken, b.count] };
    if (j.cross < 1) fail(r.name + ' X: setup produced no crossing (judge)');
    same(r.name + ' X', b, j);
    // (B) connection to a missing card
    await load('__PAGE__'); await toSheet(i);
    await page.evaluate(() => { OPT.wrapN = 0; autoLayout(); S.conns.push({ id: 'zz_x9', f: S.nodes[0].id, t: 'no_such_card', d: 0 }); render(); });
    await page.waitForTimeout(300);
    j = await judgeCount(); b = await badge();
    r.B = { judge: j, badge: b && [b.overlap, b.cross, b.broken, b.count] };
    if (j.broken < 1) fail(r.name + ' B: setup produced no broken connection (judge)');
    same(r.name + ' B', b, j);
    await clickBadge(); await page.waitForTimeout(300);
    const bt = await page.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#lint-panel .lint-item'), e => e.textContent).join('|'));
    if (!/연결/.test(bt)) fail(r.name + ' B: no panel item mentions 연결');
    // (S) saved data carries no lint state
    const saved = await page.evaluate(() => JSON.stringify(_fileData()));
    if (/lint/i.test(saved)) fail(r.name + ' S: _fileData() contains lint state');
    // (R) reload returns to clean
    await load('__PAGE__'); await toSheet(i);
    await page.evaluate(() => { OPT.wrapN = 4; autoLayout(); render(); });
    await page.waitForTimeout(200);
    j = await judgeCount(); b = await badge();
    r.R = { judge: j, badge: b && [b.overlap, b.cross, b.broken, b.count] };
    same(r.name + ' R', b, j);
    if (j.count !== 0 || (b && b.bad.length)) fail(r.name + ' R: not clean after reload (wrapN 4)');
    await page.screenshot({ path: 'D:/claude/tmp/prep/orgchart-aside/reg-lint' + i + '.png' });
    out.sheets.push(r);
  }
  if (out.errors.length) fail('E: page errors ' + out.errors.slice(0, 3).join(' | '));
  out.RESULT = out.fails.length ? 'RED' : 'GREEN';
  return out;
}