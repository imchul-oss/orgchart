async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  async function load(url) {
    await page.goto(url); await page.waitForTimeout(500);
    await page.evaluate(d => { try { localStorage.clear(); } catch (e) {} _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(true); switchSheet(0); OPT.wrapN = 0; OPT.orient = 'down'; autoLayout(); render(); }, DOC);
    await page.waitForTimeout(300);
  }
  const HELP = () => {
    window.__segs = () => { const s = []; document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash').forEach(p => { const n = (p.getAttribute('d') || '').match(/-?\d+(\.\d+)?/g) || []; const pts = [];
      for (let i = 0; i + 1 < n.length; i += 2) pts.push([+n[i], +n[i + 1]]); for (let i = 0; i + 1 < pts.length; i++) s.push([pts[i], pts[i + 1]]); if (pts.length === 1) s.push([pts[0], pts[0]]); }); return s; };
    window.__setup = (ac, ad) => { switchSheet(0); const fp = S.nodes.find(n => n.id === 'fp'); ['t_01', 't_02', 't_03', 't_04'].forEach(id => { const t = S.nodes.find(n => n.id === id); if (t) t.aside = true; });
      if (ac > 1) fp.ac = ac; else delete fp.ac; if (ad) fp.ad = ad; else delete fp.ad; OPT.wrapN = 0; autoLayout(); render(); return fp; };
    window.__check = (tag, moved) => { const r = []; const fp = S.nodes.find(n => n.id === 'fp'); const ay = fp.y + CUR_HH / 2; const S2 = __segs();
      const verts = S2.flatMap(s => s);
      const cards = ['t_01', 't_02', 't_03', 't_04'].map(id => S.nodes.find(n => n.id === id)).filter(Boolean);
      if (!moved) { const hi = verts.filter(v => v[1] < fp.y - 0.5); if (hi.length) r.push('H1 ' + tag + ': ' + hi.length + ' vertices above the root top, e.g. ' + JSON.stringify(hi[0])); }
      const pcx = fp.x + cardW(fp) / 2;
      [1, -1].forEach(dir => { const mine = cards.filter(t => ((t.x + cardW(t) / 2 < pcx) ? -1 : 1) === dir); if (!mine.length) return;
        const E = dir > 0 ? fp.x + cardW(fp) : fp.x; const topY = Math.min(...mine.map(t => t.y)); const row1 = mine.filter(t => t.y === topY);
        if (!moved) { row1.forEach(t => { if (!(t.y > ay)) r.push('H2 ' + tag + ': first-row card ' + t.id + ' top ' + t.y + ' not below ay ' + ay); });
          const far = row1.reduce((m, t) => { const cx = t.x + cardW(t) / 2; return Math.abs(cx - E) > Math.abs(m - E) ? cx : m; }, E);
          const lo = Math.min(E, far), hi = Math.max(E, far);
          const hs = S2.filter(s => Math.abs(s[0][1] - ay) < 0.6 && Math.abs(s[1][1] - ay) < 0.6).map(s => [Math.min(s[0][0], s[1][0]), Math.max(s[0][0], s[1][0])]).sort((a, b) => a[0] - b[0]);
          let reach = lo; hs.forEach(h => { if (h[0] <= reach + 1) reach = Math.max(reach, h[1]); });
          if (reach < hi - 1) r.push('H2 ' + tag + ' dir ' + dir + ': line at ay covers ' + lo + '..' + reach + ' of ' + lo + '..' + hi); }
        mine.forEach(t => { const cx = t.x + cardW(t) / 2; const ok = S2.some(s => Math.abs(s[0][0] - cx) < 1.1 && Math.abs(s[1][0] - cx) < 1.1 && Math.abs(Math.max(s[0][1], s[1][1]) - t.y) < 1.1 && Math.abs(s[0][1] - s[1][1]) > 3);
          if (!ok) r.push('H3 ' + tag + ': no drop into ' + t.id); });
        if (moved) { const xs = dir > 0 ? Math.round(fp.x + cardW(fp) + Math.round(OPT.colGap / 2)) : Math.round(fp.x - Math.round(OPT.colGap / 2));
          const bottom = Math.max(...mine.map(t => t.y + nh(t))); const tv = S2.filter(s => Math.abs(s[0][0] - xs) < 1.1 && Math.abs(s[1][0] - xs) < 1.1 && Math.min(s[0][1], s[1][1]) <= bottom + 1);  // tidy: only segments within the beside stack (a child drop can share x = xs by coincidence)
          const ys = tv.flatMap(s => [s[0][1], s[1][1]]); const above = ys.filter(y => y < ay - 0.5);
          const rowsY = [...new Set(mine.map(t => t.y))].sort((a, b) => a - b);
          if (above.length && Math.min(...above) < Math.min(...rowsY) - 10 - 0.5) r.push('H5 ' + tag + ': trunk sticks above every bus to ' + Math.min(...above));
          const lowBus = (rowsY.length === 1 && rowsY[0] > ay) ? ay : rowsY[rowsY.length - 1] - 10; /* one row hanging below ay: its bus IS the stub line, no trunk needed (judge fix 10-19 after g1) */ if (lowBus > ay + 1 && (!ys.length || Math.max(...ys) < lowBus - 1)) r.push('H5 ' + tag + ': trunk stops at ' + (ys.length ? Math.max(...ys) : 'none') + ' above the lowest bus ' + lowBus);
          if (ys.length && Math.min(...ys) > ay + 1) r.push('H5 ' + tag + ': trunk does not reach the stub at ay'); }
      });
      if (!moved) { const L = layoutLint(); if (L.overlap || L.cross || L.brokenN) r.push('H4 ' + tag + ': lint overlap ' + L.overlap + ' cross ' + L.cross + ' broken ' + L.brokenN); }
      return r; };
  };
  const SNAP = () => ({ pos: S.nodes.map(n => n.id + ':' + n.x + ',' + n.y).sort(),
    paths: Array.prototype.map.call(document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash'), p => p.getAttribute('class') + '|' + p.getAttribute('d').replace(/\s+/g, ' ').trim()).sort() });
  const refRun = async () => { const r = {}; const n = await page.evaluate(() => SHEETS.length);
    for (let s = 0; s < n; s++) for (const o of ['down', 'right', 'left']) r['s' + s + o] = await page.evaluate(([s, o, sn]) => { switchSheet(s); OPT.wrapN = 0; OPT.orient = o; autoLayout(); render(); return eval('(' + sn + ')')(); }, [s, o, SNAP.toString()]);
    await page.evaluate(() => { OPT.orient = 'down'; }); r.ac1 = await page.evaluate(sn => { __setup(1, null); return eval('(' + sn + ')')(); }, SNAP.toString());
    r.ac1L = await page.evaluate(sn => { __setup(1, 'L'); return eval('(' + sn + ')')(); }, SNAP.toString()); return r; };
  await load('__REF__'); await page.evaluate(HELP); const ref = await refRun();
  await load('__PAGE__'); await page.evaluate(HELP); const cur = await refRun();
  for (const k of Object.keys(ref)) { if (JSON.stringify(ref[k].pos) !== JSON.stringify(cur[k].pos)) fail((k.startsWith('ac1') ? 'H6' : 'H7') + ': positions differ ' + k);
    if (JSON.stringify(ref[k].paths) !== JSON.stringify(cur[k].paths)) fail((k.startsWith('ac1') ? 'H6' : 'H7') + ': paths differ ' + k); }
  for (const ac of [2, 3]) for (const ad of [null, 'L', 'B']) {
    await load('__PAGE__'); await page.evaluate(HELP);
    const r = await page.evaluate(([ac, ad]) => { OPT.orient = 'down'; __setup(ac, ad); const a = __check('ac' + ac + ' ' + (ad || 'R'), false);
      const fp = S.nodes.find(n => n.id === 'fp'); const cards = ['t_01', 't_02', 't_03', 't_04'].map(id => S.nodes.find(n => n.id === id));
      const pcx = fp.x + cardW(fp) / 2; [1, -1].forEach(dir => { const mine = cards.filter(t => ((t.x + cardW(t) / 2 < pcx) ? -1 : 1) === dir); if (!mine.length) return; const ty = Math.min(...mine.map(t => t.y)); mine.filter(t => t.y === ty).forEach(t => { t.y += 40; }); });
      render(); const b = __check('moved ac' + ac + ' ' + (ad || 'R'), true); return a.concat(b); }, [ac, ad]);
    r.forEach(fail);
  }
  for (const o of ['right', 'left']) { await load('__PAGE__'); await page.evaluate(HELP);
    const r = await page.evaluate(o => { OPT.orient = o; __setup(3, null); const L = layoutLint(); return { ov: L.overlap, br: L.brokenN }; }, o);
    if (r.ov || r.br) fail('H8: ' + o + ' ac3 overlap ' + r.ov + ' broken ' + r.br); }
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}