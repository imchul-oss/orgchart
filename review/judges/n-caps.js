async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 40) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const LOAD = () => page.evaluate(d => { try{localStorage.clear();}catch(e){} window.alert = () => {}; window.confirm = () => true; _adoptData(JSON.parse(JSON.stringify(d)),false); _finishLoad(true); if (CUR_SHEET !== 0) switchSheet(0); collState().clear(); collSave(); ADMIN = true; applyRO(); autoLayout(); render(); return S.nodes.length; }, DOC);
  const badge = () => page.evaluate(() => (document.getElementById('lint-badge') || {}).textContent || '');
  // A1
  await LOAD();
  const a1 = await page.evaluate(() => {
    for (let i = 1; i <= 8; i++) { S.nodes.push({ id: 'zz_a' + i, en: 'ZZ직속' + i, ko: '', type: 'l2', x: 0, y: 0, m: [{ n: 'ZZ' + i, f: '', r: '뗘쪄', s: 'active' }], aside: true }); S.conns.push({ id: 'zz_e' + i, f: 'fp', t: 'zz_a' + i, d: 0 }); }
    openEdit('fp'); const sel = document.getElementById('ei-ac'); const opts = sel ? [...sel.options].map(o => o.value) : [];
    if (!opts.includes('6')) { closeModal(); return { opts }; }
    sel.value = '6'; saveModal(); autoLayout(); render();
    const fp = S.nodes.find(n => n.id === 'fp'); const H = collHidden();
    const bes = S.conns.filter(c => c.f === 'fp').map(c => S.nodes.find(n => n.id === c.t)).filter(n => n && n.aside && !H.has(n.id));
    const rows = {}; bes.forEach(n => (rows[n.y] = rows[n.y] || []).push(n.x));
    const sizes = Object.values(rows).map(r => new Set(r).size).sort((a, b) => b - a);
    return { opts, ac: fp.ac, cols: besideCols(fp), n: bes.length, sizes, badge: (document.getElementById('lint-badge') || {}).textContent };
  });
  out.info.a1 = a1;
  if (!a1.opts.includes('8')) fail('A1: #ei-ac has no option 8: ' + a1.opts.join(','));
  if (a1.ac !== 6) fail('A1: saved ac ' + a1.ac); if (a1.cols !== 6) fail('A1: besideCols ' + a1.cols);
  if (JSON.stringify(a1.sizes) !== '[6,2]') fail('A1: beside rows ' + JSON.stringify(a1.sizes) + ' want [6,2] (n ' + a1.n + ')');
  if (!/이상 없음/.test(a1.badge || '')) fail('A1: badge ' + a1.badge);
  // M1 (same page state)
  const m1 = await page.evaluate(() => {
    const t = S.nodes.find(n => n.id === 't_15'); openEdit('t_15'); const sel = document.getElementById('ei-mc'); const opts = sel ? [...sel.options].map(o => o.value) : [];
    if (!opts.includes('6')) { closeModal(); return { opts }; }
    sel.value = '6'; saveModal(); autoLayout(); render();
    const el = document.getElementById('nt_15'), nb = el && el.querySelector('.nb');
    return { opts, mc: t.mc, mcOf: _mcOf(t), w: cardW(t), want: OPT.bandW + 6 * (NW - OPT.bandW), grid: nb ? nb.style.gridTemplateColumns : null, rows: el ? el.querySelectorAll('.mr').length : 0, badge: (document.getElementById('lint-badge') || {}).textContent };
  });
  out.info.m1 = m1;
  if (!m1.opts.includes('8')) fail('M1: #ei-mc has no option 8: ' + m1.opts.join(','));
  if (m1.mc !== 6 || m1.mcOf !== 6) fail('M1: mc ' + m1.mc + ' / ' + m1.mcOf);
  if (Math.abs(m1.w - m1.want) > 0.5) fail('M1: cardW ' + m1.w + ' want ' + m1.want);
  if (!/repeat\(6,/.test(m1.grid || '')) fail('M1: grid ' + m1.grid); if (m1.rows !== 11) fail('M1: rows ' + m1.rows);
  if (!/이상 없음/.test(m1.badge || '')) fail('M1: badge ' + m1.badge);
  // A2 CSV round trip
  const a2 = await page.evaluate(async () => {
    let csv = null; const dl0 = window.dl; window.dl = (data) => { csv = data; }; exportCSV(); window.dl = dl0;
    if (!csv) return { csv: false };
    const hasAc = /(^|\n)fp,[^\n]*/.test(csv) && /,6,/.test(csv.split('\n').find(l => l.startsWith('fp,')) || '');
    const t15 = csv.split('\n').find(l => l.startsWith('t_15,')) || '';
    S.nodes.find(n => n.id === 'fp').ac = 2; S.nodes.find(n => n.id === 't_15').mc = 2;
    importCSV({ files: [new File([csv], 'x.csv', { type: 'text/csv' })], value: '' }); await new Promise(s => setTimeout(s, 500));
    return { csv: true, hasAc, t15has6: /,6,/.test(t15), ac: S.nodes.find(n => n.id === 'fp').ac, mc: S.nodes.find(n => n.id === 't_15').mc };
  });
  out.info.a2 = a2;
  if (!a2.csv) fail('A2: exportCSV produced nothing'); else { if (!a2.hasAc) fail('A2: fp row lacks ac 6'); if (!a2.t15has6) fail('A2: t_15 row lacks mc 6'); if (a2.ac !== 6) fail('A2: ac after import ' + a2.ac); if (a2.mc !== 6) fail('A2: mc after import ' + a2.mc); }
  // S1 slider ranges
  const WANT = { rg: [20, 400], wrap: [0, 20], cg: [10, 300], px: [0, 300], py: [0, 400], hdrh: [0, 240], rowh: [0, 160], nw: [100, 600], bw: [0, 40], cr: [0, 40], sha: [0, 1], cntsz: [6, 24], cntdx: [-100, 200], cntdy: [-100, 100], fsen: [6, 48], fsko: [6, 40], fsmn: [6, 40], fsmf: [6, 36], fsmr: [6, 36], fsma: [6, 36], lhh: [0.6, 3], lhc: [0.6, 3], sw: [0.5, 10], dw: [0.5, 10] };
  const s1 = await page.evaluate(W => { const r = {}; Object.keys(W).forEach(k => { const e = document.getElementById('opt-' + k); r[k] = e ? [+e.min, +e.max] : null; }); return r; }, WANT);
  Object.entries(WANT).forEach(([k, [lo, hi]]) => { const g = s1[k]; if (!g) fail('S1: slider opt-' + k + ' missing'); else if (g[0] > lo + 1e-9 || g[1] < hi - 1e-9) fail('S1: opt-' + k + ' range ' + g + ' want <=' + lo + ' .. >=' + hi); });
  // S2 clamps
  const s2 = await page.evaluate(() => { const o = JSON.parse(JSON.stringify(OPT)); _applyOptObj(Object.assign({}, o, { cntSize: 20, cntDx: 150, cntDy: -80 })); const a = [OPT.cntSize, OPT.cntDx, OPT.cntDy, _cntStyleVals().fs];
    _applyOptObj(Object.assign({}, o, { cntSize: 99, cntDx: -999, cntDy: 999 })); const b = [OPT.cntSize, OPT.cntDx, OPT.cntDy]; _applyOptObj(o); return { a, b }; });
  out.info.s2 = s2;
  if (JSON.stringify(s2.a) !== '[20,150,-80,20]') fail('S2: kept ' + JSON.stringify(s2.a) + ' want [20,150,-80,20]');
  if (JSON.stringify(s2.b) !== '[24,-100,100]') fail('S2: clamp ' + JSON.stringify(s2.b) + ' want [24,-100,100]');
  // W1 wrapN 12
  await LOAD();
  const w1 = await page.evaluate(() => {
    for (let i = 1; i <= 9; i++) { S.nodes.push({ id: 'zz_w' + i, en: 'ZZ팀' + i, ko: '', type: 'l2', x: 0, y: 0, m: [{ n: 'W' + i, f: '', r: '뗘쪄', s: 'active' }] }); S.conns.push({ id: 'zz_we' + i, f: 'prodhq', t: 'zz_w' + i, d: 0 }); }
    OPT.wrapN = 12; autoLayout(); render(); const H = collHidden();
    const ks = S.conns.filter(c => c.f === 'prodhq').map(c => S.nodes.find(n => n.id === c.t)).filter(n => n && !n.aside && !H.has(n.id));
    const rows = {}; ks.forEach(n => (rows[n.y] = rows[n.y] || []).push(n.x)); OPT.wrapN = 0;
    return { n: ks.length, sizes: Object.values(rows).map(r => r.length).sort((a, b) => b - a), badge: (document.getElementById('lint-badge') || {}).textContent };
  });
  out.info.w1 = w1;
  // 한 줄 최대 조직 수 = 줄 수를 ceil(n/WN)으로 정한 뒤 고르게 나눈다 (기존 동작): 14개, 12 제한 -> 2줄, 각 줄 12개 이하
  if (!(w1.sizes.length === 2 && w1.sizes.every(x => x <= 12) && w1.n === 14)) fail('W1: rows ' + JSON.stringify(w1.sizes) + ' want 2 rows of <= 12 (n ' + w1.n + ')');
  if (!/이상 없음/.test(w1.badge || '')) fail('W1: badge ' + w1.badge);
  // K1
  const k1 = await page.evaluate(() => { openEdit('t_14'); const e = document.getElementById('ei-kn'); const v = e ? +e.max : null; closeModal(); return v; });
  if (!(k1 >= 50)) fail('K1: #ei-kn max ' + k1);
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}