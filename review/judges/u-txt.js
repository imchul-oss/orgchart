async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const r = await page.evaluate(async d => {
    const R = { alerts: [] }; window.alert = m => R.alerts.push(String(m)); window.confirm = () => true;
    try { localStorage.clear(); } catch (e) {} _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(true); if (CUR_SHEET !== 0) switchSheet(0); ADMIN = true; applyRO();
    S.nodes.push({ id: 'zz_both', en: 'ZZEN', ko: 'ZZKO', type: 'l2', x: 0, y: 0, m: [{ n: 'ZZ', f: 'ZF', r: 'ZR', a: 'ZA', s: 'active' }] }, { id: 'zz_ko', en: '', ko: 'KOONLY', type: 'l2', x: 0, y: 0, m: [] });
    S.conns.push({ id: 'zc1', f: 'fp', t: 'zz_both', d: 0 }, { id: 'zc2', f: 'fp', t: 'zz_ko', d: 0 }); autoLayout(); render();
    const col = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).color : null; };
    const H2 = h => { const m = h.replace('#', '').match(/../g).map(x => parseInt(x, 16)); return 'rgb(' + m.join(', ') + ')'; };
    // X1
    openOptions(); const sec = document.querySelector('#optov .opt-sec[data-sec="logo"]');
    const box = sec && sec.querySelector('#opt-txt-colors'); const rows = box ? [...box.querySelectorAll('.opt-color-row')] : [];
    R.x1 = { rows: rows.map(x => (x.querySelector('.opt-color-lbl') || {}).textContent), note: !!(document.querySelector('#optov') && /텍스트 색상은/.test(document.querySelector('#optov').textContent)) };
    const mfRow = rows.find(x => /직무/.test((x.querySelector('.opt-color-lbl') || {}).textContent || '')); const mfInp = mfRow && mfRow.querySelector('input[type=color]');
    if (mfInp) { mfInp.value = '#123456'; mfInp.dispatchEvent(new Event('input', { bubbles: true })); mfInp.dispatchEvent(new Event('change', { bubbles: true })); }
    await new Promise(s => setTimeout(s, 50));
    R.x1.opt = OPT.txtMf; R.x1.css = getComputedStyle(document.documentElement).getPropertyValue('--txt-mf').trim(); R.x1.mf = col('#nzz_both .mf');
    applyColor('txtMf', '--txt-mf', '#666666'); closeOptions();
    // X2
    openData(); R.x2 = document.querySelectorAll('#dat-txt-colors .opt-color-row').length; if (typeof closeData === 'function') closeData(); else document.querySelectorAll('.show').forEach(e => e.classList.remove('show'));
    // X3
    const setHex = (id, v) => { const e = document.getElementById(id); if (!e) return false; e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); const nx = e.nextElementSibling && e.nextElementSibling.nextElementSibling; if (nx && nx.tagName === 'INPUT') nx.value = v.slice(1).toUpperCase(); return true; };
    openEdit('zz_both'); R.x3 = { tc: !!document.getElementById('ei-tc'), tcd: !!document.getElementById('ei-tc-def'), tk: !!document.getElementById('ei-tk'), tkd: !!document.getElementById('ei-tk-def') };
    if (R.x3.tc && R.x3.tcd) { R.x3.defInit = document.getElementById('ei-tc-def').checked; setHex('ei-tc', '#ff0000'); document.getElementById('ei-tc-def').checked = false; document.getElementById('ei-tc-def').dispatchEvent(new Event('change', { bubbles: true })); }
    if (R.x3.tk && R.x3.tkd) { setHex('ei-tk', '#00ff00'); document.getElementById('ei-tk-def').checked = false; document.getElementById('ei-tk-def').dispatchEvent(new Event('change', { bubbles: true })); }
    saveModal(); await new Promise(s => setTimeout(s, 50));
    const nb = S.nodes.find(n => n.id === 'zz_both'); R.x3.saved = { tc: nb.tc, tk: nb.tk }; R.x3.nen = col('#nzz_both .nen'); R.x3.nko = col('#nzz_both .nko');
    openEdit('zz_both'); R.x3.reopen = { tc: (document.getElementById('ei-tc') || {}).value, tcd: (document.getElementById('ei-tc-def') || {}).checked, tk: (document.getElementById('ei-tk') || {}).value, tkd: (document.getElementById('ei-tk-def') || {}).checked };
    if (document.getElementById('ei-tc-def')) { document.getElementById('ei-tc-def').checked = true; document.getElementById('ei-tc-def').dispatchEvent(new Event('change', { bubbles: true })); }
    saveModal(); await new Promise(s => setTimeout(s, 50)); R.x3.after = { tc: S.nodes.find(n => n.id === 'zz_both').tc, nen: col('#nzz_both .nen'), ref: col('#nt_02 .nen'), tk: S.nodes.find(n => n.id === 'zz_both').tk, nko: col('#nzz_both .nko') };
    // X4
    nb.tc = '#FF0000'; render();
    const fd = _fileData(); const fn = (fd.sheets[CUR_SHEET].nodes || []).find(n => n.id === 'zz_both'); R.x4 = { json: fn ? { tc: fn.tc, tk: fn.tk } : null };
    let csv = null; const dl0 = window.dl; window.dl = data => { csv = data; }; exportCSV(); window.dl = dl0; const hdr = csv.split('\n')[1]; R.x4.hdr = hdr;
    const lines = csv.split('\n'); const iN = lines.indexOf('NODES'); const H = lines[iN + 1].split(','); const it = H.indexOf('tc'), ik = H.indexOf('tk');
    for (let i = iN + 2; i < lines.length && lines[i]; i++) { if (lines[i].startsWith('zz_ko,')) { const c = lines[i].split(','); if (it >= 0) c[it] = 'red'; if (ik >= 0) c[ik] = '#0000FF'; lines[i] = c.join(','); } }
    importCSV({ files: [new File([lines.join('\n')], 'x.csv', { type: 'text/csv' })], value: '' }); await new Promise(s => setTimeout(s, 400));
    const b2 = S.nodes.find(n => n.id === 'zz_both'), k2 = S.nodes.find(n => n.id === 'zz_ko'); R.x4.back = { tc: b2 && b2.tc, tk: b2 && b2.tk, kotc: k2 && k2.tc, kotk: k2 && k2.tk };
    // X5
    if (k2) { k2.tc = '#AA00AA'; render(); R.x5 = { nen: col('#nzz_ko .nen'), txt: (document.querySelector('#nzz_ko .nen') || {}).textContent }; }
    R.H2 = { red: H2('#ff0000'), green: H2('#00ff00'), mf: H2('#123456'), purple: H2('#AA00AA') };
    return R; }, DOC);
  out.info = { x1: r.x1, x2: r.x2, x3: r.x3, x4: r.x4, x5: r.x5, alerts: r.alerts.slice(0, 3) };
  const want = ['머리글 제목', '머리글 부제', '멤버 이름', '직무', '직책', '분야'];
  if (r.x1.rows.length !== 6) fail('X1: ' + r.x1.rows.length + ' text colour rows in the options panel'); want.forEach(w => { if (!r.x1.rows.some(l => (l || '').includes(w))) fail('X1: no row for ' + w); });
  if (r.x1.note) fail('X1: the "텍스트 색상은 데이터 패널" note is still shown');
  if ((r.x1.opt || '').toLowerCase() !== '#123456') fail('X1: OPT.txtMf after editing = ' + r.x1.opt); if (r.x1.css.toLowerCase() !== '#123456') fail('X1: --txt-mf = ' + r.x1.css); if (r.x1.mf !== r.H2.mf) fail('X1: rendered .mf colour ' + r.x1.mf);
  if (r.x2 !== 0) fail('X2: data panel still repeats text colours ' + r.x2);
  if (!r.x3.tc || !r.x3.tcd || !r.x3.tk || !r.x3.tkd) fail('X3: modal controls ' + JSON.stringify(r.x3)); else {
    if (r.x3.defInit !== true) fail('X3: 자동 not checked by default for an unset card');
    if ((r.x3.saved.tc || '').toLowerCase() !== '#ff0000' || (r.x3.saved.tk || '').toLowerCase() !== '#00ff00') fail('X3: saved ' + JSON.stringify(r.x3.saved));
    if (r.x3.nen !== r.H2.red) fail('X3: .nen colour ' + r.x3.nen); if (r.x3.nko !== r.H2.green) fail('X3: .nko colour ' + r.x3.nko);
    if ((r.x3.reopen.tc || '').toLowerCase() !== '#ff0000' || r.x3.reopen.tcd !== false || (r.x3.reopen.tk || '').toLowerCase() !== '#00ff00' || r.x3.reopen.tkd !== false) fail('X3: reopen shows ' + JSON.stringify(r.x3.reopen));
    if (r.x3.after.tc !== undefined) fail('X3: 자동 did not remove tc'); if (r.x3.after.nen !== r.x3.after.ref) fail('X3: title colour after 자동 ' + r.x3.after.nen + ' vs global ' + r.x3.after.ref); if ((r.x3.after.tk || '').toLowerCase() !== '#00ff00' || r.x3.after.nko !== r.H2.green) fail('X3: tk lost when only tc went back to 자동');
  }
  if (!r.x4.json || (r.x4.json.tc || '').toLowerCase() !== '#ff0000' || (r.x4.json.tk || '').toLowerCase() !== '#00ff00') fail('X4: _fileData node ' + JSON.stringify(r.x4.json));
  if (!/(^|,)tc(,|$)/.test(r.x4.hdr) || !/(^|,)tk(,|$)/.test(r.x4.hdr)) fail('X4: CSV header ' + r.x4.hdr);
  if (!r.x4.back || (r.x4.back.tc || '').toLowerCase() !== '#ff0000' || (r.x4.back.tk || '').toLowerCase() !== '#00ff00') fail('X4: CSV round trip ' + JSON.stringify(r.x4.back)); else { if (r.x4.back.kotc !== undefined) fail('X4: invalid colour "red" stored'); if ((r.x4.back.kotk || '').toLowerCase() !== '#0000ff') fail('X4: tk from CSV ' + r.x4.back.kotk); }
  if (!r.x5 || r.x5.txt !== 'KOONLY') fail('X5: ko-only title ' + JSON.stringify(r.x5)); else if (r.x5.nen !== r.H2.purple) fail('X5: ko-only title colour ' + r.x5.nen);
  if (r.alerts.some(a => /오류/.test(a))) fail('E: alert ' + r.alerts.find(a => /오류/.test(a)));
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}