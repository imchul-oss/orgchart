async page => {
  const AFTER = __OWNER20__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 40) out.fails.push(m); };
  const J = JSON.stringify;
  const KEYS = ['hdrTop','hdrL1','hdrL2','hdrL3','hdrL4','hdrL5','hdrTf','hdrSide','bandTop','bandL1','bandL2','bandL3','bandL4','bandL5','bandTf','bandSide','cardBg','rowEven','rowBorder'];
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const r = await page.evaluate(async ([A, KEYS]) => { const w = ms => new Promise(res => setTimeout(res, ms));
    try{localStorage.clear();}catch(e){} window.alert = () => {}; window.confirm = () => true;
    loadObject(JSON.parse(JSON.stringify(A)), false); if (CUR_SHEET !== 0) switchSheet(0); ADMIN = true; applyRO(); render();
    const keysIn = root => { const m = {}; root.querySelectorAll('input[type=color]').forEach(i => { const k = /applyColor\('([A-Za-z0-9]+)'/.exec(i.getAttribute('oninput') || ''); if (k) m[k[1]] = (m[k[1]] || 0) + 1; }); return m; };
    const R = {};
    openData(); await w(30);
    const dm = document.getElementById('dataov');
    R.dataRows = dm.querySelectorAll('.opt-color-row').length; R.dataKeys = keysIn(dm);
    R.dataHas = { status: !!dm.querySelector('#statuscat-list'), sg: !!dm.querySelector('#sg-list'), job: dm.textContent.indexOf('직무') >= 0 };
    closeData(); await w(30);
    openOptions(); await w(30);
    const om = document.getElementById('optov'); R.optKeys = keysIn(om);
    const sec = [...om.querySelectorAll('.opt-sec')].find(s => KEYS.some(k => s.querySelector(`input[type=color][oninput*="applyColor('${k}'"]`)));
    R.secTitle = sec ? sec.querySelector('.opt-sec-title').textContent.replace(/[▾▸]/g, '').trim() : null;
    R.secKeys = sec ? Object.keys(keysIn(sec)) : [];
    R.secs = [...om.querySelectorAll('.opt-sec')].filter(s => KEYS.some(k => s.querySelector(`input[type=color][oninput*="applyColor('${k}'"]`))).length;
    if (sec) { const t = sec.querySelector('.opt-sec-title'); const before = t.getAttribute('aria-expanded'); t.click(); await w(20); R.fold = [before, t.getAttribute('aria-expanded')]; t.click(); await w(20); }
    R.hint = /데이터.{0,6}(패널|창)에 있습니다/.test(om.textContent);
    // change two colours through the options window inputs
    const hdrNode = S.nodes.find(n => n.type === 'l1' || n.lv === 1 || /l1/.test(n.type || '')) || null;
    const setCol = (k, v) => { const i = om.querySelector(`input[type=color][oninput*="applyColor('${k}'"]`); if (!i) return false; i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); return true; };
    // the owner file gives most headers a department colour, so pick a level whose header uses the default colour (judge setup, 10-26)
    { const n1 = S.nodes.find(n => n.type === 'l1'); if (n1) { delete n1.color; render(); } }  // every owner card carries its own colour; clear one L1 card so the level default shows
    const plain = [...document.querySelectorAll('#canvas .nd .nh')].find(e => !/background/.test(e.getAttribute('style') || '') && /\bt-(top|l[1-5]|tf|side)\b/.test(e.closest('[class*="t-"]').className));
    const lvl = plain ? /\bt-(top|l[1-5]|tf|side)\b/.exec(plain.closest('[class*="t-"]').className)[1] : 'l1';
    const HK = 'hdr' + (lvl === 'top' ? 'Top' : lvl === 'tf' ? 'Tf' : lvl === 'side' ? 'Side' : lvl.toUpperCase()); R.hk = HK;
    R.old = { hdrL1: OPT[HK], cardBg: OPT.cardBg };
    await w(500); _hCheckpoint && _hCheckpoint(true);
    R.set = [setCol(HK, '#123456'), setCol('cardBg', '#fefcf0')]; await w(700);
    const cs = getComputedStyle(document.documentElement); const HKV = '--hdr-' + lvl;
    R.after = { opt: [OPT[HK], OPT.cardBg], css: [cs.getPropertyValue(HKV).trim(), cs.getPropertyValue('--card-bg').trim()] };
    const hdrBgs = [...document.querySelectorAll('#canvas .nd .nh')].map(e => getComputedStyle(e).backgroundColor);
    R.hdrHit = hdrBgs.some(c => c.replace(/\s/g, '') === 'rgb(18,52,86)');
    undoEdit(); await w(600);
    R.undo = { opt: [OPT[HK], OPT.cardBg], css: [getComputedStyle(document.documentElement).getPropertyValue('--hdr-' + lvl).trim(), getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim()] };
    const iv = om.querySelector(`input[type=color][oninput*="applyColor('${HK}'"]`); R.undoInput = iv ? iv.value : null;
    closeOptions();
    return R; }, [AFTER, KEYS]);
  out.info = r;
  if (r.dataRows) fail('C1 colour rows left in the data window ' + r.dataRows);
  if (Object.keys(r.dataKeys).length) fail('C1 colour pickers left in the data window ' + J(r.dataKeys));
  if (!r.dataHas.status || !r.dataHas.sg || !r.dataHas.job) fail('C1 data window lost an editor ' + J(r.dataHas));
  const miss = KEYS.filter(k => r.optKeys[k] !== 1); if (miss.length) fail('C2 options pickers per key ' + J(miss.map(k => [k, r.optKeys[k] || 0])));
  if (r.secs !== 1 || r.secTitle !== '카드 색' || KEYS.some(k => r.secKeys.indexOf(k) < 0)) fail('C2 section ' + J({ secs: r.secs, t: r.secTitle, keys: r.secKeys.length }));
  if (!r.fold || r.fold[0] === r.fold[1]) fail('C2 section does not fold ' + J(r.fold));
  if (r.hint) fail('C2 old hint to the data window still shown');
  if (!r.set[0] || !r.set[1]) fail('C3 setup: pickers not found ' + J(r.set));
  if (!/^#123456$/i.test(r.after.opt[0]) || !/^#fefcf0$/i.test(r.after.opt[1]) || !/^#123456$/i.test(r.after.css[0]) || !/^#fefcf0$/i.test(r.after.css[1])) fail('C3 change not applied ' + J(r.after));
  if (!r.hdrHit) fail('C3 no card header shows the new L1 colour');
  if (String(r.undo.opt[0]).toLowerCase() !== String(r.old.hdrL1).toLowerCase() || String(r.undo.opt[1]).toLowerCase() !== String(r.old.cardBg).toLowerCase()) fail('C3 one undo did not restore both ' + J({ old: r.old, undo: r.undo }));
  if (String(r.undoInput).toLowerCase() !== String(r.old.hdrL1).toLowerCase()) fail('C3 options input after undo ' + r.undoInput);
  const both = Object.keys(r.optKeys).filter(k => r.dataKeys[k]); if (both.length) fail('C4 keys in both windows ' + J(both));
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}