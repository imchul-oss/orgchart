async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 40) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const LOAD = () => page.evaluate(d => { try{localStorage.clear();}catch(e){} window.alert = () => {}; window.confirm = () => true; _adoptData(JSON.parse(JSON.stringify(d)),false); _finishLoad(true); if (CUR_SHEET !== 0) switchSheet(0); collState().clear(); collSave(); ADMIN = true; applyRO(); OPT.wrapN = 0; autoLayout(); render(); return S.nodes.length; }, DOC);
  const ROWS = pid => page.evaluate(pid => { const by = id => S.nodes.find(n => n.id === id); const H = collHidden(); const ks = S.conns.filter(c => c.f === pid).map(c => by(c.t)).filter(n => n && !n.aside && n.type !== 'side' && !H.has(n.id)); const rows = {}; ks.forEach(n => (rows[n.y] = rows[n.y] || []).push(n)); return Object.keys(rows).map(Number).sort((a, b) => a - b).map(y => rows[y].sort((a, b) => a.x - b.x).map(n => n.id)); }, pid);
  const POS = () => page.evaluate(() => { const o = {}; S.nodes.forEach(n => o[n.id] = [n.x, n.y]); return o; });
  const badge = () => page.evaluate(() => (document.getElementById('lint-badge') || {}).textContent || '');
  const ADD7 = () => page.evaluate(() => { for (let i = 1; i <= 7; i++) { S.nodes.push({ id: 'zz_r' + i, en: 'ZZ팀' + i, ko: '', type: 'l2', x: 0, y: 0, m: [{ n: 'R' + i, f: '', r: '뗘쪄', s: 'active' }] }); S.conns.push({ id: 'zz_re' + i, f: 'prodhq', t: 'zz_r' + i, d: 0 }); } });
  const rowA = ['t_08', 't_06', 'zz_r1', 't_10', 'zz_r2', 'zz_r3', 't_07'], rowB = ['zz_r4', 't_09', 'zz_r5', 'zz_r6', 'zz_r7'];
  // R1
  await LOAD(); await ADD7();
  const r1 = await page.evaluate(([A, B]) => {
    const by = id => S.nodes.find(n => n.id === id);
    A.forEach((id, i) => { const n = by(id); n.x = 100 + i * 300; n.y = 500; });
    B.forEach((id, i) => { const n = by(id); n.x = 250 + i * 300; n.y = 900; });
    openEdit('prodhq'); const sel = document.getElementById('ei-kl'); const opts = sel ? [...sel.options].map(o => o.value) : [];
    if (!opts.includes('rows')) { closeModal(); return { opts }; }
    sel.value = 'rows'; saveModal(); autoLayout(); render();
    return { opts, kl: by('prodhq').kl, badge: (document.getElementById('lint-badge') || {}).textContent };
  }, [rowA, rowB]);
  out.info.r1 = r1;
  if (!r1.opts.includes('rows')) fail('R1: #ei-kl has no option rows: ' + r1.opts.join(','));
  else {
    if (r1.kl !== 'rows') fail('R1: saved kl ' + r1.kl);
    const rows = await ROWS('prodhq');
    if (JSON.stringify(rows) !== JSON.stringify([rowA, rowB])) fail('R1: rows ' + JSON.stringify(rows) + ' want ' + JSON.stringify([rowA, rowB]));
    if (!/이상 없음/.test(r1.badge || '')) fail('R1: badge ' + r1.badge);
    // R2
    const p1 = await POS(); await page.evaluate(() => { autoLayout(); render(); }); const p2 = await POS();
    const moved = Object.keys(p1).filter(id => Math.abs(p1[id][0] - p2[id][0]) > 0.5 || Math.abs(p1[id][1] - p2[id][1]) > 0.5);
    if (moved.length) fail('R2: second autoLayout moved ' + moved.slice(0, 5).join(','));
    // R3
    await page.evaluate(() => { S.nodes.push({ id: 'zz_r8', en: 'ZZ팀8', ko: '', type: 'l2', m: [{ n: 'R8', f: '', r: '뗘쪄', s: 'active' }] }); S.conns.push({ id: 'zz_re8', f: 'prodhq', t: 'zz_r8', d: 0 }); autoLayout(); render(); });
    const rows3 = await ROWS('prodhq');
    if (JSON.stringify(rows3) !== JSON.stringify([rowA, rowB.concat(['zz_r8'])])) fail('R3: rows after a new child ' + JSON.stringify(rows3));
    const b3 = await badge(); if (!/이상 없음/.test(b3)) fail('R3: badge ' + b3);
    // R4
    const r4 = await page.evaluate(async () => { let csv = null; const dl0 = window.dl; window.dl = d => { csv = d; }; exportCSV(); window.dl = dl0; if (!csv) return { csv: false };
      const line = csv.split('\n').find(l => l.startsWith('prodhq,')) || ''; delete S.nodes.find(n => n.id === 'prodhq').kl;
      importCSV({ files: [new File([csv], 'x.csv', { type: 'text/csv' })], value: '' }); await new Promise(s => setTimeout(s, 500));
      return { csv: true, has: /,rows,/.test(line), kl: S.nodes.find(n => n.id === 'prodhq').kl }; });
    if (!r4.csv) fail('R4: exportCSV produced nothing'); else { if (!r4.has) fail('R4: prodhq row lacks kl rows'); if (r4.kl !== 'rows') fail('R4: kl after import ' + r4.kl); }
  }
  // R5 numeric mode untouched
  await LOAD(); await ADD7();
  const r5 = await page.evaluate(() => { const by = id => S.nodes.find(n => n.id === id); const H = collHidden();
    const ks = () => S.conns.filter(c => c.f === 'prodhq').map(c => by(c.t)).filter(n => n && !H.has(n.id));
    OPT.wrapN = 0; autoLayout(); render(); const a = new Set(ks().map(n => n.y)).size;
    OPT.wrapN = 5; autoLayout(); render(); const rows = {}; ks().forEach(n => (rows[n.y] = rows[n.y] || []).push(n.id)); OPT.wrapN = 0;
    return { a, sizes: Object.values(rows).map(r => r.length) }; });
  out.info.r5 = r5;
  if (r5.a !== 1) fail('R5: kl unset gave ' + r5.a + ' rows (want 1)');
  if (!(r5.sizes.length === 3 && r5.sizes.every(x => x <= 5))) fail('R5: wrapN 5 rows ' + JSON.stringify(r5.sizes) + ' want 3 rows of <= 5');
  // B1
  await LOAD();
  const b1 = await page.evaluate(() => {
    const by = id => S.nodes.find(n => n.id === id); const fp = by('fp');
    for (let i = 1; i <= 8; i++) { S.nodes.push({ id: 'zz_a' + i, en: 'ZZ직속' + i, ko: '', type: 'l2', x: fp.x + 300 + ((i - 1) % 2) * 300, y: fp.y + Math.floor((i - 1) / 2) * 120, m: [{ n: 'A' + i, f: '', r: '뗘쪄', s: 'active' }], aside: true }); S.conns.push({ id: 'zz_ae' + i, f: 'fp', t: 'zz_a' + i, d: 0 }); }
    openEdit('fp'); const sel = document.getElementById('ei-ac'); const opts = sel ? [...sel.options].map(o => o.value) : [];
    if (!opts.includes('pos')) { closeModal(); return { opts }; }
    sel.value = 'pos'; saveModal(); autoLayout(); render();
    const bes = () => S.conns.filter(c => c.f === 'fp').map(c => by(c.t)).filter(n => n && n.aside);
    const sizes = () => { const rows = {}; bes().forEach(n => (rows[n.y] = rows[n.y] || []).push(n.x)); return Object.keys(rows).map(Number).sort((a, b) => a - b).map(y => new Set(rows[y]).size); };
    const s2 = sizes(), c2 = besideCols(fp), ac = fp.ac;
    bes().forEach((n, i) => { n.x = fp.x + 300 + (i % 4) * 300; n.y = fp.y + Math.floor(i / 4) * 120; });
    autoLayout(); render(); const s4 = sizes(), c4 = besideCols(fp);
    autoLayout(); render(); const s4b = sizes();
    return { opts, ac, s2, c2, s4, c4, s4b, badge: (document.getElementById('lint-badge') || {}).textContent };
  });
  out.info.b1 = b1;
  if (!b1.opts.includes('pos')) fail('B1: #ei-ac has no option pos: ' + b1.opts.join(','));
  else {
    if (b1.ac !== 'pos') fail('B1: saved ac ' + b1.ac);
    if (JSON.stringify(b1.s2) !== '[2,2,2,2]' || b1.c2 !== 2) fail('B1: 2-column sketch -> rows ' + JSON.stringify(b1.s2) + ' cols ' + b1.c2);
    if (JSON.stringify(b1.s4) !== '[4,4]' || b1.c4 !== 4) fail('B1: 4-column sketch -> rows ' + JSON.stringify(b1.s4) + ' cols ' + b1.c4);
    if (JSON.stringify(b1.s4b) !== JSON.stringify(b1.s4)) fail('B1: not idempotent ' + JSON.stringify(b1.s4b));
    if (!/이상 없음/.test(b1.badge || '')) fail('B1: badge ' + b1.badge);
    const b2 = await page.evaluate(async () => { let csv = null; const dl0 = window.dl; window.dl = d => { csv = d; }; exportCSV(); window.dl = dl0; if (!csv) return { csv: false };
      const line = csv.split('\n').find(l => l.startsWith('fp,')) || ''; S.nodes.find(n => n.id === 'fp').ac = 2;
      importCSV({ files: [new File([csv], 'x.csv', { type: 'text/csv' })], value: '' }); await new Promise(s => setTimeout(s, 500));
      return { csv: true, has: /,pos,/.test(line), ac: S.nodes.find(n => n.id === 'fp').ac }; });
    if (!b2.csv) fail('B2: exportCSV produced nothing'); else { if (!b2.has) fail('B2: fp row lacks ac pos'); if (b2.ac !== 'pos') fail('B2: ac after import ' + b2.ac); }
  }
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}