async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => out.fails.push(m);
  async function load(url) {
    await page.goto(url); await page.waitForTimeout(600);
    await page.evaluate(d => { _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(_hasPositions(S.nodes)); }, DOC);
    await page.waitForTimeout(300);
  }
  const sheetCount = await (async () => { await load('__REF__'); return await page.evaluate(() => SHEETS.length); })();
  async function snap(sheet, wrapN) {
    return await page.evaluate(([s, w]) => {
      switchSheet(s); OPT.wrapN = w; autoLayout(); render();
      const pos = S.nodes.map(n => n.id + ':' + n.x + ',' + n.y).sort();
      const paths = Array.prototype.map.call(document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash'), p => p.getAttribute('class') + '|' + p.getAttribute('d').replace(/\s+/g, ' ').trim()).sort();
      return { pos, paths };
    }, [sheet, wrapN]);
  }
  const ref = {};
  for (let s = 0; s < sheetCount; s++) for (const w of [0, 4]) ref[s + '/' + w] = await snap(s, w);
  await load('__PAGE__');
  for (let s = 0; s < sheetCount; s++) for (const w of [0, 4]) {
    const c = await snap(s, w), r = ref[s + '/' + w];
    if (JSON.stringify(c.pos) !== JSON.stringify(r.pos)) fail('R: positions differ from reference, sheet ' + s + ' wrapN ' + w);
    if (JSON.stringify(c.paths) !== JSON.stringify(r.paths)) fail('R: connector paths differ from reference, sheet ' + s + ' wrapN ' + w);
  }
  const lint = async () => await page.evaluate(() => { render(); const r = layoutLint(); return { o: r.overlap, c: r.cross, b: r.brokenN, n: r.count }; });
  const reset = async () => { await page.evaluate(() => { ADMIN = true; switchSheet(0); S.nodes.forEach(n => { delete n.kl; delete n.kn; delete n.aside; }); OPT.wrapN = 0; autoLayout(); render(); }); await page.waitForTimeout(200); };
  const segs = async () => await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash').forEach(p => {
      const v = ((p.getAttribute('d') || '').match(/-?\d+(\.\d+)?/g) || []).map(Number);
      for (let k = 0; k + 3 < v.length; k += 2) out.push([v[k], v[k + 1], v[k + 2], v[k + 3]]);
    });
    return out;
  });
  const near = (a, b) => Math.abs(a - b) <= 2;
  const hasH = (S_, x1, x2, y) => S_.some(s => near(s[1], y) && near(s[3], y) && ((near(s[0], x1) && near(s[2], x2)) || (near(s[0], x2) && near(s[2], x1))));

  // (G) subtree drag
  await reset();
  const drag = async (id, dxc, dyc, shift) => {
    await page.evaluate(id => { const n = S.nodes.find(n => n.id === id); const w = document.getElementById('wrap'); w.scrollLeft = Math.max(0, (n.x + NW / 2) * S.scale - w.clientWidth / 2); w.scrollTop = Math.max(0, n.y * S.scale - 120); }, id);
    await page.waitForTimeout(200);
    const before = await page.evaluate(() => S.nodes.map(n => [n.id, n.x, n.y]));
    const sc = await page.evaluate(() => S.scale);
    const rb = await page.locator('#n' + id).boundingBox();
    if (shift) await page.keyboard.down('Shift');
    await page.mouse.move(rb.x + rb.width / 2, rb.y + 6); await page.mouse.down();
    await page.mouse.move(rb.x + rb.width / 2 + dxc * sc / 2, rb.y + 6 + dyc * sc / 2, { steps: 5 });
    await page.mouse.move(rb.x + rb.width / 2 + dxc * sc, rb.y + 6 + dyc * sc, { steps: 5 }); await page.mouse.up();
    if (shift) await page.keyboard.up('Shift');
    await page.waitForTimeout(200);
    const after = await page.evaluate(() => S.nodes.map(n => [n.id, n.x, n.y]));
    const desc = await page.evaluate(id => {
      const side = new Set(S.nodes.filter(n => n.type === 'side').map(n => n.id)); const seen = new Set(); const q = [id];
      while (q.length) { const f = q.shift(); S.conns.forEach(c => { if (c.f === f && !side.has(c.t) && !seen.has(c.t) && c.t !== id) { seen.add(c.t); q.push(c.t); } }); }
      return [...seen];
    }, id);
    return { before, after, desc };
  };
  {
    const r = await drag('prodhq', 200, 100, false);
    const b = Object.fromEntries(r.before.map(x => [x[0], x])), a = Object.fromEntries(r.after.map(x => [x[0], x]));
    const dx = a.prodhq[1] - b.prodhq[1], dy = a.prodhq[2] - b.prodhq[2];
    out.info.dragDelta = [dx, dy, r.desc.length];
    if (!dx || !dy) fail('G: drag did not move the card');
    if (r.desc.length < 3) fail('G: prodhq has too few descendants for the test');
    r.desc.forEach(id => { if (a[id][1] - b[id][1] !== dx || a[id][2] - b[id][2] !== dy) fail('G: descendant ' + id + ' did not move with its parent'); });
    Object.keys(b).forEach(id => { if (id !== 'prodhq' && r.desc.indexOf(id) < 0 && (a[id][1] !== b[id][1] || a[id][2] !== b[id][2])) fail('G: unrelated card ' + id + ' moved'); });
    const l = await lint(); if (l.b) fail('G: lint after subtree drag ' + JSON.stringify(l));
  }
  await reset();
  {
    const r = await drag('prodhq', 200, 100, true);
    const b = Object.fromEntries(r.before.map(x => [x[0], x])), a = Object.fromEntries(r.after.map(x => [x[0], x]));
    if (a.prodhq[1] === b.prodhq[1] && a.prodhq[2] === b.prodhq[2]) fail('G: Shift-drag did not move the card');
    Object.keys(b).forEach(id => { if (id !== 'prodhq' && (a[id][1] !== b[id][1] || a[id][2] !== b[id][2])) fail('G: Shift-drag moved ' + id); });
  }

  // (K) column
  await reset();
  {
    const r = await page.evaluate(() => {
      const p = S.nodes.find(n => n.id === 'foodhq');
      const kids = S.conns.filter(c => c.f === 'foodhq').map(c => S.nodes.find(n => n.id === c.t)).filter(Boolean).sort((a, b) => a.x - b.x).map(n => n.id);
      p.kl = 'col'; autoLayout(); render();
      return { p: [p.x, p.y, nh(p)], kids: kids.map(id => { const n = S.nodes.find(n => n.id === id); return [id, n.x, n.y, nh(n)]; }), HH: CUR_HH };
    });
    out.info.col = r.kids.length;
    if (r.kids.length < 3) fail('K: foodhq has too few children');
    r.kids.forEach((k, i) => {
      if (k[1] !== r.p[0] + 40) fail('K: child ' + k[0] + ' x ' + k[1] + ' not parent.x+40');
      if (i === 0 && k[2] < r.p[1] + r.p[2]) fail('K: first child not below the parent');
      if (i > 0) { const pr = r.kids[i - 1]; if (k[2] < pr[2] + pr[3] || k[2] > pr[2] + pr[3] + 40) fail('K: child ' + k[0] + ' not stacked right below the previous one'); }
    });
    const S_ = await segs();
    const tx = r.p[0] + 20, last = r.kids[r.kids.length - 1];
    const trunk = S_.some(s => near(s[0], tx) && near(s[2], tx) && Math.min(s[1], s[3]) <= r.p[1] + r.p[2] + 2 && Math.max(s[1], s[3]) >= last[2] + r.HH / 2 - 2);
    if (!trunk) fail('K: no trunk at parent.x+20 from the parent bottom to the last child');
    r.kids.forEach(k => { if (!hasH(S_, tx, k[1], k[2] + r.HH / 2)) fail('K: no branch into ' + k[0]); });
    const l = await lint(); if (l.n) fail('K: lint ' + JSON.stringify(l));
  }

  // (N) per-card count
  await reset();
  {
    const r = await page.evaluate(() => {
      const ys = id => [...new Set(S.conns.filter(c => c.f === id).map(c => S.nodes.find(n => n.id === c.t)).filter(Boolean).map(n => n.y))].length;
      S.nodes.find(n => n.id === 'foodhq').kn = 2; OPT.wrapN = 0; autoLayout(); render();
      const a = { food: ys('foodhq'), prod: ys('prodhq') };
      S.nodes.find(n => n.id === 'foodhq').kn = 0; OPT.wrapN = 4; autoLayout(); render();
      a.pos4 = S.nodes.map(n => n.id + ':' + n.x + ',' + n.y).sort();
      return a;
    });
    if (r.food !== 3) fail('N: kn=2 gave ' + r.food + ' rows, expected 3');
    if (r.prod !== 1) fail('N: kn on foodhq changed prodhq rows (' + r.prod + ')');
    if (JSON.stringify(r.pos4) !== JSON.stringify(ref['0/4'].pos)) fail('N: kn=0 with wrapN 4 differs from the reference');
    const l = await page.evaluate(() => { OPT.wrapN = 0; S.nodes.find(n => n.id === 'foodhq').kn = 2; autoLayout(); render(); const r = layoutLint(); return r.count; });
    if (l) fail('N: lint ' + l);
  }

  // (A) aside
  for (const [cid, pid] of [['t_10', 'prodhq'], ['t_02', 'fp']]) {
    await reset();
    const r = await page.evaluate(([cid, pid]) => {
      S.nodes.find(n => n.id === cid).aside = true; autoLayout(); render();
      const c = S.nodes.find(n => n.id === cid), p = S.nodes.find(n => n.id === pid);
      return { c: [c.x, c.y], p: [p.x, p.y], NW, HH: CUR_HH, G: OPT.colGap };
    }, [cid, pid]);
    if (r.c[1] !== r.p[1]) fail('A: ' + cid + ' not on its parent row');
    const gap = r.c[0] - (r.p[0] + r.NW);
    if (gap < 20 || gap > r.G + 20) fail('A: ' + cid + ' not right beside its parent (gap ' + gap + ')');
    const S_ = await segs();
    if (!hasH(S_, r.p[0] + r.NW, r.c[0], r.p[1] + r.HH / 2)) fail('A: no horizontal line from ' + pid + ' to ' + cid);
    const l = await lint(); if (cid === 't_02' ? (l.o || l.b) : l.n) fail('A: lint for ' + cid + ' ' + JSON.stringify(l));
  }

  // (M) mixed
  await reset();
  {
    const l = await page.evaluate(() => {
      S.nodes.find(n => n.id === 'prodhq').kl = 'col'; S.nodes.find(n => n.id === 't_10').aside = true;
      S.nodes.find(n => n.id === 'foodhq').kn = 2; S.nodes.find(n => n.id === 't_02').aside = true;
      autoLayout(); render(); const r = layoutLint(); return { o: r.overlap, c: r.cross, b: r.brokenN };
    });
    if (l.o || l.c || l.b) fail('M: lint for the mixed case ' + JSON.stringify(l));
  }

  // (K2) side card on a col parent
  await reset();
  {
    const r = await page.evaluate(() => {
      S.nodes.push({ id: 'zz_sd', en: 'SD', ko: '', type: 'side', x: 0, y: 0, m: [] });
      S.conns.push({ id: 'zz_c1', f: 'foodhq', t: 'zz_sd', d: 1 });
      S.nodes.push({ id: 'zz_sd2', en: 'SD2', ko: '', type: 'side', x: 0, y: 0, m: [] });
      S.conns.push({ id: 'zz_c3', f: 'foodhq', t: 'zz_sd2', d: 0 });
      S.nodes.find(n => n.id === 'foodhq').kl = 'col'; autoLayout(); render();
      const has = id => Array.prototype.some.call(document.querySelectorAll('#svgl path.chit'), p => (p.getAttribute('onclick') || '').indexOf(id) >= 0);
      const hit = has('zz_c1') && has('zz_c3');
      const vis = document.querySelectorAll('#svgl path.cpath-dash').length;
      S.conns = S.conns.filter(c => c.id !== 'zz_c1' && c.id !== 'zz_c3'); S.nodes = S.nodes.filter(n => n.id !== 'zz_sd' && n.id !== 'zz_sd2');
      return { hit, vis };
    });
    if (!r.hit) fail('K2: side card connector on a col parent is missing or not clickable');
    if (!r.vis) fail('K2: no dashed path drawn for the side card');
  }
  // (K3) col fallback draws the row bus
  await reset();
  {
    const r = await page.evaluate(() => {
      S.nodes.push({ id: 'zz_l3', en: 'L3', ko: '', type: 'l3', x: 0, y: 0, m: [] });
      S.conns.push({ id: 'zz_c2', f: 't_07', t: 'zz_l3', d: 0 });
      const p = S.nodes.find(n => n.id === 'prodhq'); p.kl = 'col'; autoLayout(); render();
      const L = layoutLint();
      const tx = p.x + 20, by = p.y + nh(p);
      const trunk = Array.prototype.some.call(document.querySelectorAll('#svgl path.cpath'), q => { const v = (q.getAttribute('d').match(/-?\d+(\.\d+)?/g) || []).map(Number); return v.length >= 4 && Math.abs(v[0] - tx) <= 2 && Math.abs(v[1] - by) <= 2 && Math.abs(v[2] - tx) <= 2; });
      S.conns = S.conns.filter(c => c.id !== 'zz_c2'); S.nodes = S.nodes.filter(n => n.id !== 'zz_l3');
      return { o: L.overlap, c: L.cross, b: L.brokenN, trunk };
    });
    if (r.o || r.c || r.b) fail('K3: lint for a col fallback ' + JSON.stringify(r));
    if (r.trunk) fail('K3: a col fallback still draws the column trunk');
  }
  // (A2) two aside cards
  await reset();
  {
    const r = await page.evaluate(() => {
      ['t_06', 't_07'].forEach(id => S.nodes.find(n => n.id === id).aside = true); autoLayout(); render();
      const p = S.nodes.find(n => n.id === 'prodhq'), a = S.nodes.find(n => n.id === 't_06'), b = S.nodes.find(n => n.id === 't_07');
      const L = layoutLint();
      return { p: [p.x, p.y], a: [a.x, a.y, nh(a)], b: [b.x, b.y], o: L.overlap, c: L.cross, br: L.brokenN, HH: CUR_HH };
    });
    const first = r.a[1] <= r.b[1] ? 'a' : 'b';
    const A = first === 'a' ? r.a : r.b, B = first === 'a' ? r.b : r.a;
    if (r.a[0] !== r.b[0]) fail('A2: the two aside cards are not in one column');
    if (A[1] !== r.p[1]) fail('A2: the first aside card is not on the parent row');
    if (B[1] < A[1] + (first === 'a' ? r.a[2] : 0)) fail('A2: the second aside card is not below the first');
    if (r.o || r.c || r.br) fail('A2: lint ' + JSON.stringify({ o: r.o, c: r.c, b: r.br }));
    const S_ = await segs();
    if (!S_.some(s => near(s[1], B[1] + r.HH / 2) && near(s[3], B[1] + r.HH / 2) && (near(s[0], B[0]) || near(s[2], B[0])))) fail('A2: no branch into the second aside card');
  }

  // (U) dialog
  await load('__PAGE__'); await snap(0, 0); await reset();
  {
    const r = await page.evaluate(() => {
      ADMIN = true; document.body.classList.remove('ro');
      openEdit('foodhq');
      const kl = document.getElementById('ei-kl'), kn = document.getElementById('ei-kn'), as = document.getElementById('ei-aside');
      if (!kl || !kn || !as) return { missing: [!!kl, !!kn, !!as] };
      const hasCol = Array.prototype.some.call(kl.options, o => o.value === 'col');
      kl.value = 'col'; kn.value = '3'; as.checked = true; saveModal();
      const n = S.nodes.find(n => n.id === 'foodhq');
      const set = [n.kl, n.kn, n.aside];
      const fd = JSON.parse(JSON.stringify(_fileData()));
      openEdit('foodhq');
      const shown = [document.getElementById('ei-kl').value, document.getElementById('ei-kn').value, document.getElementById('ei-aside').checked];
      closeModal();
      _adoptData(fd, false); _finishLoad(true);
      const n2 = S.nodes.find(n => n.id === 'foodhq'); const kept = [n2.kl, n2.kn, n2.aside];
      openEdit('foodhq');
      document.getElementById('ei-kl').value = 'row'; document.getElementById('ei-kn').value = '0'; document.getElementById('ei-aside').checked = false; saveModal();
      const n3 = S.nodes.find(n => n.id === 'foodhq'); const cleared = [n3.kl || 'row', n3.kn || 0, !!n3.aside];
      OPT.wrapN = 0; autoLayout(); render();
      return { hasCol, set, shown, kept, cleared, pos: S.nodes.map(n => n.id + ':' + n.x + ',' + n.y).sort() };
    });
    if (r.missing) fail('U: dialog fields missing ' + JSON.stringify(r.missing));
    else {
      if (!r.hasCol) fail('U: #ei-kl has no col option');
      if (JSON.stringify(r.set) !== JSON.stringify(['col', 3, true])) fail('U: saved values ' + JSON.stringify(r.set));
      if (JSON.stringify(r.shown) !== JSON.stringify(['col', '3', true])) fail('U: reopened dialog shows ' + JSON.stringify(r.shown));
      if (JSON.stringify(r.kept) !== JSON.stringify(['col', 3, true])) fail('U: values lost through save/load ' + JSON.stringify(r.kept));
      if (JSON.stringify(r.cleared) !== JSON.stringify(['row', 0, false])) fail('U: clearing left ' + JSON.stringify(r.cleared));
      if (JSON.stringify(r.pos) !== JSON.stringify(ref['0/0'].pos)) fail('U: after clearing, layout differs from the reference');
    }
  }

  if (out.errors.length) fail('E: page errors ' + out.errors.slice(0, 2).join(' | '));
  out.RESULT = out.fails.length ? 'RED' : 'GREEN';
  return JSON.stringify(out);
}