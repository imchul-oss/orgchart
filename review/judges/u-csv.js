async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const r = await page.evaluate(async d => {
    const R = { alerts: [] };
    try { localStorage.clear(); } catch (e) {}
    window.alert = m => R.alerts.push(String(m)); window.confirm = () => true;
    _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(true); switchSheet(1); ADMIN = true; applyRO(); autoLayout(); render();
    const by = id => S.nodes.find(n => n.id === id);
    by('o_p1_2').sum = 't_09'; by('o_p1_0').mc = 2; by('o_p1_1').mc = 4; by('o_p1').kl = 'col'; by('o_p2').kn = 3; by('o_prodhq').ad = 'B'; by('o_prodhq').ac = 3; by('o_p1_3').aside = true; by('o_p1_4').ad = 'L'; by('o_step1').ac = 2;
    const F = ['id', 'en', 'ko', 'type', 'x', 'y', 'color', 'mc', 'kl', 'kn', 'ad', 'ac', 'aside', 'sum'];
    const snap = () => ({ nodes: S.nodes.map(n => { const o = {}; F.forEach(k => { if (n[k] !== undefined && n[k] !== '') o[k] = n[k]; }); o.m = (n.m || []).map(m => ({ n: m.n, f: m.f || '', r: m.r || '', a: m.a || '', s: m.s || 'active', cc: m.cc === true })); return o; }),
      conns: S.conns.map(c => ({ id: c.id, f: c.f, t: c.t, d: c.d | 0, fs: c.fromSide || '', ts: c.toSide || '' })) });
    const S0 = snap();
    let csv = null; const dl0 = window.dl; window.dl = (data) => { csv = data; }; exportCSV(); window.dl = dl0;
    R.header = csv ? csv.split('\n')[1] : null;
    const imp = async txt => { importCSV({ files: [new File([txt], 'x.csv', { type: 'text/csv' })], value: '' }); await new Promise(s => setTimeout(s, 400)); return snap(); };
    const J = JSON.stringify;
    // C2
    R.after = await imp(csv); R.c2 = J(R.after) === J(S0); if (!R.c2) { R.c2diff = S0.nodes.map((n, i) => J(n) !== J(R.after.nodes[i]) ? [n.id, n, R.after.nodes[i]] : null).filter(Boolean).slice(0, 3); R.c2conn = J(R.after.conns) === J(S0.conns); }
    // C3 old format
    const q = s => { s = String(s == null ? '' : s); return s.includes(',') ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const lines = csv.split('\n'); const iN = lines.indexOf('NODES'), iM = lines.indexOf('MEMBERS');
    const old = ['NODES', 'id,en,ko,type,x,y,color'].concat(S0.nodes.map(n => [n.id, q(n.en), q(n.ko), n.type, n.x, n.y, n.color || ''].join(','))).concat(['']).concat(lines.slice(iM)).join('\n');
    const A3 = await imp(old); const S3 = JSON.parse(J(S0)); S3.nodes.forEach(n => ['mc', 'kl', 'kn', 'ad', 'ac', 'aside', 'sum'].forEach(k => delete n[k]));
    R.c3 = J(A3) === J(S3); if (!R.c3) R.c3diff = S3.nodes.map((n, i) => J(n) !== J(A3.nodes[i]) ? [n.id, n, A3.nodes[i]] : null).filter(Boolean).slice(0, 3);
    // C4 shuffled columns: parse the exported NODES rows by header, re-emit in another order
    const hdr = lines[iN + 1].split(','); const rowsN = lines.slice(iN + 2, iM - 1).filter(Boolean);
    const parse = l => { const c = []; let cur = '', inQ = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (ch === '"') { if (inQ && l[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; } else if (ch === ',' && !inQ) { c.push(cur); cur = ''; } else cur += ch; } c.push(cur); return c; };
    const order = ['mc', 'sum', 'id', 'aside', 'en', 'ac', 'ko', 'ad', 'type', 'kn', 'x', 'kl', 'y', 'color'];
    const shuf = ['NODES', order.join(',')].concat(rowsN.map(l => { const c = parse(l); const o = {}; hdr.forEach((h, i) => o[h] = c[i]); return order.map(k => q(o[k])).join(','); })).concat(['']).concat(lines.slice(iM)).join('\n');
    const A4 = await imp(shuf); R.c4 = J(A4) === J(S0); if (!R.c4) R.c4diff = S0.nodes.map((n, i) => J(n) !== J(A4.nodes[i]) ? [n.id, n, A4.nodes[i]] : null).filter(Boolean).slice(0, 3);
    // C5 bad values
    const bad = ['NODES', 'id,en,ko,type,x,y,color,mc,kl,kn,ad,ac,aside,sum', 'b1,B1,,l2,0,0,,9,row,-1,X,9,yes,no such id', 'b2,B2,,l2,0,0,,2,col,3,B,3,1,../x', 'b3,B3,,l2,0,0,,1,,0,R,1,0,', '', 'MEMBERS', 'node_id,name,func,role,area,status,concurrent', 'b1,ZZ,,,,active,', '', 'CONNECTIONS', 'id,from,to,dashed,from_side,to_side', 'c1,b1,b2,0,,'].join('\n');
    const nAl = R.alerts.length; const A5 = await imp(bad); R.c5alerts = R.alerts.slice(nAl);
    const b1 = A5.nodes.find(n => n.id === 'b1'), b2 = A5.nodes.find(n => n.id === 'b2'), b3 = A5.nodes.find(n => n.id === 'b3');
    R.c5 = { b1: b1 && Object.keys(b1).filter(k => ['mc', 'kl', 'kn', 'ad', 'ac', 'aside', 'sum'].includes(k)), b2: b2 && { mc: b2.mc, kl: b2.kl, kn: b2.kn, ad: b2.ad, ac: b2.ac, aside: b2.aside, sum: b2.sum }, b3: b3 && Object.keys(b3).filter(k => ['mc', 'kl', 'kn', 'ad', 'ac', 'aside', 'sum'].includes(k)), n: A5.nodes.length };
    return R; }, DOC);
  out.info = { header: r.header, c5: r.c5, alerts: r.alerts.slice(0, 4) };
  const H = (r.header || '').split(',');
  ['mc', 'kl', 'kn', 'ad', 'ac', 'aside', 'sum'].forEach(k => { if (!H.includes(k)) fail('C1: NODES header lacks ' + k); });
  if (H.indexOf('color') >= 0 && H.indexOf('mc') >= 0 && H.indexOf('mc') < H.indexOf('color')) fail('C1: layout columns come before color');
  if (!r.c2) fail('C2: round trip changed data ' + JSON.stringify(r.c2diff || r.c2conn).slice(0, 300));
  if (!r.c3) fail('C3: old-format CSV import ' + JSON.stringify(r.c3diff).slice(0, 300));
  if (!r.c4) fail('C4: shuffled-column CSV import ' + JSON.stringify(r.c4diff).slice(0, 300));
  if (!r.c5 || r.c5.n !== 3) fail('C5: bad-value CSV did not import 3 cards'); else {
    if (r.c5.b1.length) fail('C5: out-of-range values stored on b1: ' + r.c5.b1.join(','));
    if (r.c5.b3.length) fail('C5: default-equivalent values stored on b3: ' + r.c5.b3.join(','));
    const b = r.c5.b2; if (!b || b.mc !== 2 || b.kl !== 'col' || b.kn !== 3 || b.ad !== 'B' || b.ac !== 3 || b.aside !== true || b.sum !== undefined) fail('C5: b2 fields ' + JSON.stringify(b) + ' (sum must be dropped: id not in the id grammar)');
  }
  if (r.c5alerts.some(a => /오류/.test(a))) fail('C5: error alert ' + r.c5alerts[0]);
  if (r.alerts.some(a => /오류/.test(a))) fail('E: error alert ' + r.alerts.find(a => /오류/.test(a)));
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}