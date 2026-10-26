async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const r = await page.evaluate(d => { try { localStorage.clear(); } catch (e) {} _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(true); if (CUR_SHEET !== 0) switchSheet(0); ADMIN = true; applyRO();
    S.nodes.push({ id: 'zz_ko', en: '', ko: '효트듀Z', type: 'l2', x: 0, y: 0, m: [{ n: 'ZZ', r: '뗘쪄', s: 'active' }] }, { id: 'zz_both', en: 'ZZEN', ko: 'ZZKO', type: 'l2', x: 0, y: 0, m: [] });
    S.conns.push({ id: 'zc1', f: 'fp', t: 'zz_ko', d: 0 }, { id: 'zc2', f: 'fp', t: 'zz_both', d: 0 }); autoLayout(); render();
    const hd = id => { const el = document.getElementById('n' + id); const en = el && el.querySelector('.nen'), ko = el && el.querySelector('.nko'); return { en: en ? en.textContent.trim() : null, ko: ko ? ko.textContent.trim() : null, hasKo: !!ko }; };
    const R = { ko: hd('zz_ko'), both: hd('zz_both'), others: [] };
    S.nodes.forEach(n => { if (n.id === 'zz_ko' || n.id === 'zz_both') return; const h = hd(n.id); if (h.en !== (n.en || '').trim() || (h.ko || '') !== (n.ko || '').trim()) R.others.push([n.id, h, n.en, n.ko]); });
    const cs = id => { const e = document.querySelector('#n' + id + ' .nen'); const c = getComputedStyle(e); return [c.color, c.fontSize, c.fontWeight]; };
    R.style = { ko: cs('zz_ko'), ref: cs('t_02') };
    tvOpen(); R.tree = {}; ['zz_ko', 'zz_both', 't_02'].forEach(id => { const t = document.querySelector('#treeview .tv-row[data-id="' + id + '"] .tv-title'); R.tree[id] = t ? t.textContent.trim() : null; }); tvClose();
    R.src = { tf: String(tfZoneInfo).includes('ko||'), tv: String(tvGo).includes('ko||') };
    return R; }, DOC);
  out.info = r;
  if (r.ko.en !== '효트듀Z') fail('T1: ko-only card .nen = ' + JSON.stringify(r.ko.en)); if (r.ko.hasKo && r.ko.ko) fail('T1: ko-only card still shows a subtitle ' + JSON.stringify(r.ko.ko));
  if (r.both.en !== 'ZZEN' || r.both.ko !== 'ZZKO') fail('T2: both-field card ' + JSON.stringify(r.both));
  if (r.others.length) fail('T3: ' + r.others.length + ' real cards changed, e.g. ' + JSON.stringify(r.others[0]));
  if (r.tree.zz_ko !== '효트듀Z') fail('T4: tree title for ko-only card ' + JSON.stringify(r.tree.zz_ko)); if (r.tree.zz_both !== 'ZZEN') fail('T4: tree title for both-field card ' + JSON.stringify(r.tree.zz_both)); if (r.tree.t_02 !== '쭤듀꿔뭬캐') fail('T4: tree title t_02 ' + JSON.stringify(r.tree.t_02));
  if (JSON.stringify(r.style.ko) !== JSON.stringify(r.style.ref)) fail('T5: title style ' + JSON.stringify(r.style));
  if (r.src.tf) fail('T6: tfZoneInfo still prefers ko'); if (r.src.tv) fail('T6: tvGo tooltip still prefers ko');
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}