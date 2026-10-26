async page => {
  const out = { errors: [], fails: [], info: {} };
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  const URL = '__PAGE__';
  async function open(init) { const p = await page.context().newPage(); p.on('pageerror', e => out.errors.push(String(e))); if (init) await p.addInitScript(init);
    await p.addInitScript(() => { try { localStorage.clear(); } catch (e) {} }); await p.setViewportSize({ width: 1600, height: 950 }); await p.goto(URL); await p.waitForTimeout(500); return p; }
  const p1 = await open(null);
  const f1 = await p1.evaluate(() => { const b = document.getElementById('btn-file'); const c = getComputedStyle(b).color; const m = c.match(/\d+/g) || []; return { t: b.textContent.trim(), rgb: m.slice(0, 3).map(Number), conn: b.classList.contains('conn') }; });
  out.info.f1 = f1;
  if (!/파일 연결/.test(f1.t)) fail('F1: button text ' + JSON.stringify(f1.t)); if (f1.rgb.length < 3 || Math.min(...f1.rgb) < 160) fail('F1: text colour rgb(' + f1.rgb + ') reads disabled');
  const f2 = await p1.evaluate(() => { FILE_CONNECTED = true; FILE_NAME = 'sunsubon-org-2026-10-final-very-long-name.json'; _updateFileBtn(); const b = document.getElementById('btn-file');
    const r = { t: b.textContent.trim(), conn: b.classList.contains('conn'), w: b.getBoundingClientRect().width }; FILE_CONNECTED = false; FILE_NAME = ''; _updateFileBtn(); r.back = b.textContent.trim(); return r; });
  out.info.f2 = f2;
  if (!f2.conn) fail('F2: no conn class'); if (!f2.t.includes('sunsubon-or')) fail('F2: connected text ' + JSON.stringify(f2.t)); if (f2.w > 260) fail('F2: button ' + Math.round(f2.w) + ' px wide');
  if (!/파일 연결/.test(f2.back)) fail('F2: text after disconnect ' + JSON.stringify(f2.back));
  const f4 = await p1.evaluate(() => { openFileModal(); const m = document.getElementById('cloudmodal'); const vis = e => !!(e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden');
    const bt = t => [...m.querySelectorAll('button')].find(b => b.textContent.trim() === t); return { fsa: FSA_OK, imp: vis(bt('JSON 불러오기')), exp: vis(bt('JSON 내려받기')), pick: vis(bt('파일 선택')) }; });
  out.info.f4 = f4;
  if (!f4.fsa) fail('F4: FSA_OK false on a normal page'); if (f4.imp || f4.exp) fail('F4: JSON fallback buttons shown while the API exists'); if (!f4.pick) fail('F4: 파일 선택 hidden');
  await p1.close();
  const p3 = await open(() => { try { delete window.showOpenFilePicker; delete window.showSaveFilePicker; } catch (e) {} });
  const f3 = await p3.evaluate(() => { const R = { fsa: FSA_OK }; if (FSA_OK) return R; let exp = 0; const e0 = window.exportJSON; window.exportJSON = () => { exp++; };
    const inp = document.querySelector('input[type=file][accept=".json"]'); let clk = 0; if (inp) inp.addEventListener('click', ev => { clk++; ev.preventDefault(); });
    openFileModal(); const m = document.getElementById('cloudmodal'); const vis = e => !!(e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden');
    const bt = t => [...m.querySelectorAll('button')].find(b => b.textContent.trim() === t); const bi = bt('JSON 불러오기'), be = bt('JSON 내려받기');
    R.imp = vis(bi); R.exp = vis(be); if (be) be.click(); if (bi) bi.click(); R.expCalled = exp; R.inpClicked = clk;
    const pk = bt('파일 선택'), nw = bt('새 파일 만들기'); R.pickOff = !pk || !vis(pk) || pk.disabled; R.newOff = !nw || !vis(nw) || nw.disabled; window.exportJSON = e0; return R; });
  out.info.f3 = f3;
  if (f3.fsa) fail('F3: could not remove the File System Access API (no verdict on the fallback)');
  else { if (!f3.imp || !f3.exp) fail('F3: fallback buttons missing ' + JSON.stringify(f3)); if (f3.expCalled !== 1) fail('F3: JSON 내려받기 did not call exportJSON'); if (f3.inpClicked !== 1) fail('F3: JSON 불러오기 did not open the JSON file input'); if (!f3.pickOff || !f3.newOff) fail('F3: picker buttons still offered without the API'); }
  await p3.close();
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}