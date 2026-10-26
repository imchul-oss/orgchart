async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  await page.setViewportSize({ width: 1600, height: 950 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const r = await page.evaluate(d => { try{localStorage.clear();}catch(e){} window.alert=()=>{}; window.confirm=()=>true; _adoptData(JSON.parse(JSON.stringify(d)),false); _finishLoad(true); if (CUR_SHEET !== 0) switchSheet(0); ADMIN = true; applyRO();
    const add = pid => { const before = new Set(S.nodes.map(n => n.id)); addChild(pid); if (typeof closeModal === 'function') closeModal(); const n = S.nodes.find(n => !before.has(n.id)); return n ? (n.color || null) : 'NONE'; };
    const by = id => S.nodes.find(n => n.id === id);
    const i1 = add('prodhq'), i2 = add('t_09');
    S.nodes.push({ id: 'zz_top', en: 'ZZ', ko: '', type: 'top', x: 0, y: 0, m: [], color: '#123456' }); const i3 = add('zz_top');
    const i4 = add('fp');
    S.nodes.push({ id: 'zz_plain', en: 'ZZP', ko: '', type: 'l2', x: 0, y: 0, m: [] }); S.conns.push({ id: 'zz_pe', f: 'prodhq', t: 'zz_plain', d: 0 }); delete by('zz_plain').color; const i5 = add('zz_plain');
    return { i1, i2, i3, i4, i4want: (S.conns.filter(c => c.f === 'fp').map(c => by(c.t)).find(n => n && n.type !== 'side' && n.color) || {}).color || null, i5 }; }, DOC);
  out.info = r; const f = m => out.fails.push(m);
  if (r.i1 !== '#1d4ed8') f('I1 ' + r.i1); if (r.i2 !== '#1d4ed8') f('I2 ' + r.i2); if (r.i3 !== null) f('I3 ' + r.i3); if (r.i4 !== r.i4want || !r.i4) f('I4 ' + r.i4 + ' want ' + r.i4want); if (r.i5 !== null) f('I5 ' + r.i5);
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}