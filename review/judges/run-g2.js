async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: { cases: 0 } };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 600) out.fails.push(m); };
  async function load(url) {
    await page.goto(url); await page.waitForTimeout(600);
    await page.evaluate(d => { _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(_hasPositions(S.nodes)); }, DOC);
    await page.waitForTimeout(300);
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
  const CC = CONNCHECK.toString();
  const sheetCount = await (async () => { await load('__REF__'); return await page.evaluate(() => SHEETS.length); })();
  const snapFn = async (setup) => await page.evaluate(([setup, cc]) => {
    eval('(' + setup + ')')(); autoLayout(); render();
    return { pos: S.nodes.map(n => n.id + ':' + n.x + ',' + n.y).sort(), paths: Array.prototype.map.call(document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash'), p => p.getAttribute('class') + '|' + p.getAttribute('d').replace(/\s+/g, ' ').trim()).sort(), bad: eval('(' + cc + ')')() };
  }, [setup.toString(), CC]);
  const ref = {};
  const regCases = [];
  for (let s = 0; s < sheetCount; s++) for (const w of [0, 4]) regCases.push({ key: 'S' + s + '/' + w, setup: `() => { switchSheet(${s}); OPT.wrapN = ${w}; }` });
  for (const w of [0, 4]) {
    regCases.push({ key: 'Afp/' + w, setup: `() => { switchSheet(0); OPT.wrapN = ${w}; ['t_01','t_02','t_03','t_04'].forEach(id => S.nodes.find(n => n.id === id).aside = true); }` });
    regCases.push({ key: 'Apr/' + w, setup: `() => { switchSheet(0); OPT.wrapN = ${w}; ['t_06','t_07','t_08'].forEach(id => S.nodes.find(n => n.id === id).aside = true); }` });
  }
  for (const rc of regCases) { await load('__REF__'); ref[rc.key] = await snapFn(rc.setup); }
  for (const rc of regCases) {
    await load('__PAGE__');
    const c = await snapFn(rc.setup), r = ref[rc.key];
    if (JSON.stringify(c.pos) !== JSON.stringify(r.pos)) fail('R: positions differ from reference, ' + rc.key);
    if (JSON.stringify(c.paths) !== JSON.stringify(r.paths)) fail('R: paths differ from reference, ' + rc.key);
  }

  // geometry check for one parent's beside group (run in page)
  const GEOM = (pid, ids, ad, ac, cc) => {
    const r = { f: [] };
    const P = S.nodes.find(n => n.id === pid);
    const cards = ids.map(id => S.nodes.find(n => n.id === id));
    const R = cards.filter(c => c.x > P.x), L = cards.filter(c => c.x < P.x);
    const nR = ad === 'L' ? 0 : ad === 'B' ? Math.ceil(ids.length / 2) : ids.length;
    if (R.length !== nR || L.length !== ids.length - nR) r.f.push('split right ' + R.length + ' left ' + L.length + ' expected right ' + nR);
    const C = ac === 2 || ac === 3 ? ac : 1;
    const r20 = v => Math.round(v / 20) * 20, c20 = v => Math.ceil(v / 20) * 20;
    [[R, 1], [L, -1]].forEach(([side, sg]) => {
      side.sort((a, b) => (a.y - b.y) || (Math.abs(a.x - P.x) - Math.abs(b.x - P.x)));
      let rowY = C > 1 ? c20(P.y + CUR_HH / 2 + 10) : P.y, rowH = 0, row = -1; /* ASIDE3 (owner 2026-10-19): multi-column beside rows hang below the line from the parent's header centre */
      side.forEach((c, k) => {
        const j = k % C, rr = Math.floor(k / C);
        if (rr !== row) { if (row >= 0) rowY = c20(rowY + rowH + 20); row = rr; rowH = 0; }
        const step = c20(NW + OPT.colGap);
        const gap = sg > 0 ? c.x - j * step - (P.x + NW) : P.x - (c.x + j * step + NW);
        if (gap < OPT.colGap - 10 || gap > OPT.colGap + 10) r.f.push((sg > 0 ? 'right' : 'left') + ' #' + k + ' col ' + j + ' x ' + c.x + ' (gap to parent ' + gap + ')');
        if (c.y !== rowY) r.f.push((sg > 0 ? 'right' : 'left') + ' #' + k + ' y ' + c.y + ' expected ' + rowY);
        rowH = Math.max(rowH, nh(c));
      });
    });
    const has = id => Array.prototype.some.call(document.querySelectorAll('#svgl path.chit'), p => (p.getAttribute('onclick') || '').indexOf(id) >= 0);
    S.conns.filter(c => c.f === pid && ids.indexOf(c.t) >= 0).forEach(c => { if (!has(c.id)) r.f.push('no clickable path for ' + c.t); });
    return r;
  };
  const GC = GEOM.toString();
  const runCase = async (tag, setup, groups) => {
    await load('__PAGE__');
    const r = await page.evaluate(([setup, groups, gc, cc]) => {
      eval('(' + setup + ')')(); autoLayout(); render();
      const p1 = S.nodes.map(n => n.id + ':' + n.x + ',' + n.y).sort().join('|');
      const L = layoutLint(); const bad = eval('(' + cc + ')')();
      const g = groups.map(x => eval('(' + gc + ')')(x[0], x[1], x[2], x[3]).f.map(m => x[0] + ': ' + m)).flat();
      autoLayout(); render();
      const p2 = S.nodes.map(n => n.id + ':' + n.x + ',' + n.y).sort().join('|');
      return { o: L.overlap, c: L.cross, b: L.brokenN, bad, g, stable: p1 === p2 };
    }, [setup, groups, GC, CC]);
    out.info.cases++;
    if (r.o || r.c || r.b) fail('lint ' + JSON.stringify({ o: r.o, c: r.c, b: r.b }) + ' for ' + tag);
    if (r.bad.length) fail('disconnected ' + r.bad.join(',') + ' for ' + tag);
    r.g.forEach(m => fail('geometry ' + m + ' for ' + tag));
    if (!r.stable) fail('second autoLayout moved cards for ' + tag);
  };
  const PAR = [['fp', ['t_01', 't_02', 't_03', 't_04']], ['prodhq', ['t_06', 't_07', 't_08']]];
  for (const [pid, ids] of PAR) for (const ad of [null, 'L', 'B']) for (const ac of [1, 2, 3]) for (const w of [0, 4]) {
    const setup = `() => { switchSheet(0); OPT.wrapN = ${w}; ${JSON.stringify(ids)}.forEach(id => S.nodes.find(n => n.id === id).aside = true); const P = S.nodes.find(n => n.id === '${pid}'); ${ad ? `P.ad = '${ad}';` : ''} ${ac > 1 ? `P.ac = ${ac};` : ''} }`;
    await runCase('GA ' + pid + ' ad ' + ad + ' ac ' + ac + ' wrapN ' + w, setup, [[pid, ids, ad, ac]]);
  }
  for (const w of [0, 4]) await runCase('GB both parents wrapN ' + w, `() => { switchSheet(0); OPT.wrapN = ${w}; ['t_01','t_02','t_03','t_04','t_06','t_07','t_08'].forEach(id => S.nodes.find(n => n.id === id).aside = true); ['fp','prodhq'].forEach(id => { const P = S.nodes.find(n => n.id === id); P.ad = 'B'; P.ac = 2; }); }`,
    [['fp', ['t_01', 't_02', 't_03', 't_04'], 'B', 2], ['prodhq', ['t_06', 't_07', 't_08'], 'B', 2]]);

  // (SD) side-type cards beside their parent
  for (const w of [0, 4]) {
    await runCase('SD side cards wrapN ' + w, `() => { switchSheet(0); OPT.wrapN = ${w}; ['t_03','t_04','t_09'].forEach(id => S.nodes.find(n => n.id === id).type = 'side'); S.conns.find(c => c.t === 't_09').d = 1; }`,
      [['fp', ['t_03', 't_04'], null, 1], ['prodhq', ['t_09'], null, 1]]);
    const dash = await page.evaluate(() => { const c = S.conns.find(c => c.t === 't_09'); const t = S.nodes.find(n => n.id === 't_09');
      return Array.prototype.some.call(document.querySelectorAll('#svgl path.cpath-dash'), p => { const v = (p.getAttribute('d').match(/-?\d+(\.\d+)?/g) || []).map(Number); for (let k = 0; k + 1 < v.length; k += 2) if (Math.abs(v[k] - t.x) <= 2 || Math.abs(v[k] - t.x - NW / 2) <= 2) return true; return false; }); });
    if (!dash) fail('SD: the dashed side connection is not drawn dashed at the card, wrapN ' + w);
    await runCase('SD mixed fp wrapN ' + w, `() => { switchSheet(0); OPT.wrapN = ${w}; S.nodes.find(n => n.id === 't_01').aside = true; S.nodes.find(n => n.id === 't_03').type = 'side'; const P = S.nodes.find(n => n.id === 'fp'); P.ad = 'B'; P.ac = 2; }`,
      [['fp', ['t_01', 't_03'], 'B', 2]]);
  }

  // (SG) drag moves beside side cards
  await load('__PAGE__');
  {
    await page.evaluate(() => { ADMIN = true; switchSheet(0); OPT.wrapN = 0; ['t_03', 't_04'].forEach(id => S.nodes.find(n => n.id === id).type = 'side'); autoLayout(); render(); });
    await page.waitForTimeout(200);
    await page.evaluate(() => { const n = S.nodes.find(n => n.id === 'fp'); const w = document.getElementById('wrap'); w.scrollLeft = Math.max(0, (n.x + NW / 2) * S.scale - w.clientWidth / 2); w.scrollTop = Math.max(0, n.y * S.scale - 120); });
    await page.waitForTimeout(200);
    const before = await page.evaluate(() => Object.fromEntries(S.nodes.map(n => [n.id, [n.x, n.y]])));
    const sc = await page.evaluate(() => S.scale);
    const rb = await page.locator('#nfp').boundingBox();
    await page.mouse.move(rb.x + rb.width / 2, rb.y + 6); await page.mouse.down();
    await page.mouse.move(rb.x + rb.width / 2 + 100 * sc, rb.y + 6 + 60 * sc, { steps: 5 });
    await page.mouse.move(rb.x + rb.width / 2 + 200 * sc, rb.y + 6 + 120 * sc, { steps: 5 }); await page.mouse.up();
    await page.waitForTimeout(200);
    const after = await page.evaluate(() => Object.fromEntries(S.nodes.map(n => [n.id, [n.x, n.y]])));
    const dx = after.fp[0] - before.fp[0], dy = after.fp[1] - before.fp[1];
    if (!dx || !dy) fail('SG: drag did not move fp');
    ['t_03', 't_04'].forEach(id => { if (after[id][0] - before[id][0] !== dx || after[id][1] - before[id][1] !== dy) fail('SG: side card ' + id + ' did not move with fp'); });
  }

  // (U) dialog
  await load('__PAGE__');
  {
    const r = await page.evaluate(() => {
      ADMIN = true; switchSheet(0);
      const res = {};
      openEdit('prodhq');
      const a = document.getElementById('ei-ad'), c = document.getElementById('ei-ac');
      res.fields = !!a && !!c; if (!res.fields) return res;
      a.value = 'B'; c.value = '2'; saveModal();
      const P = S.nodes.find(n => n.id === 'prodhq'); res.set = [P.ad, P.ac];
      const d = JSON.parse(JSON.stringify(_fileData())); _adoptData(d, false); _finishLoad(true);
      switchSheet(0); const P2 = S.nodes.find(n => n.id === 'prodhq'); res.kept = [P2.ad, P2.ac];
      openEdit('prodhq'); res.shown = [document.getElementById('ei-ad').value, document.getElementById('ei-ac').value];
      document.getElementById('ei-ad').value = 'R'; document.getElementById('ei-ac').value = '1'; saveModal();
      const P3 = S.nodes.find(n => n.id === 'prodhq'); res.cleared = ['ad' in P3, 'ac' in P3];
      return res;
    });
    if (!r.fields) fail('U: ei-ad / ei-ac not in the edit dialog');
    else {
      if (JSON.stringify(r.set) !== JSON.stringify(['B', 2])) fail('U: dialog set ' + JSON.stringify(r.set));
      if (JSON.stringify(r.kept) !== JSON.stringify(['B', 2])) fail('U: not kept through save/load ' + JSON.stringify(r.kept));
      if (JSON.stringify(r.shown) !== JSON.stringify(['B', '2'])) fail('U: dialog does not show stored values ' + JSON.stringify(r.shown));
      if (r.cleared[0] || r.cleared[1]) fail('U: resetting did not delete ad/ac');
    }
  }
  if (out.errors.length) fail('E: page errors ' + out.errors.slice(0, 2).join(' | '));
  out.RESULT = out.fails.length ? 'RED' : 'GREEN';
  return JSON.stringify(out);
}