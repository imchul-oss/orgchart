// Judge for ORGCHART-TOPBAR (2026-10-15), written before the code. Substitute __DOC__, __PAGE__.
// Goal: every topbar control is visible and usable at common window widths, in read-only and admin mode.
// (F) at widths 1024, 1280, 1366, 1600, 1920 (height 900), read-only and admin: every topbar control of the reference list
//     that is shown in that mode is either (a) fully inside the window and the topbar band (top>=0, bottom<=50,
//     left>=0, right<=innerWidth), not covered (elementFromPoint at its centre is it or inside it), and not overlapping
//     another listed control; or (b) inside an overflow menu: one visible button #tb-more in the bar (meeting (a)) opens
//     a panel where the control meets the same inside-window and not-covered tests; the topbar's scrollWidth <=
//     clientWidth + 1 (nothing hidden by scrolling);
// (N) every control placed in the bar with no visible text of 2+ letters has a title naming it (the original label words);
// (A) clicking each control through its visible place runs its action: 화면 맞춤 changes zoom after a manual zoom,
//     검색 shows #srch-input, 옵션 opens the options overlay, 데이터 opens the data overlay, 저장 runs manualSave,
//     관리자 button stays reachable; after opening search at 1280 admin, #srch-input is fully inside the window;
// (H) the topbar height stays 50 and #wrap top stays 50px; hiding (▲) and revealing (▼) still work;
// (P) presentation and print keep the topbar hidden;
// (S) amended after g1: the layout settles - after load, the bar's class, every listed control's parent and left edge, and
//     #tb-more's display are identical in 6 samples taken 250ms apart, starting 1s after load (no oscillation);
// (E) no page errors.
async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 80) out.fails.push(m); };
  // reference list: selector, label words, admin-only?
  const CTRLS = [
    ['button[onclick="autoLayout()"]', '자동 배치', 1], ['#zctrl', '', 0], ['button[onclick="fitScreen()"]', '화면 맞춤', 0],
    ['#lint-badge', '', 0], ['#srch-btn', '검색', 0], ['#btn-cmp', '비교', 0], ['#btn-present', '발표', 0],
    ['button[onclick="openAddModal()"]', '조직 추가', 1], ['#btnconn', '연결선', 1], ['button[onclick="openOptions()"]', '옵션', 1],
    ['#btn-data', '데이터', 1], ['button[onclick="toggleDD(\'ddloc\')"]', 'Local', 0], ['#btn-save', '저장', 1],
    ['#btn-undo', '되돌리기', 1], ['#btn-redo', '다시', 1], ['#btn-file', '파일', 0], ['#btn-admin', '관리자', 0], ['#tb-hide', '숨기기', 0]];
  async function load(w, admin) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto('__PAGE__'); await page.waitForTimeout(500);
    await page.evaluate(([d, admin]) => { try { localStorage.clear(); } catch (e) {} _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(_hasPositions(S.nodes)); switchSheet(0); render();
      if (admin) { ADMIN = true; applyRO(); }
      window.dispatchEvent(new Event('resize')); }, [DOC, admin]);
    await page.waitForTimeout(400);
  }
  const PROBE = (sel) => {
    const W = innerWidth;
    const vis = e => { if (!e) return false; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const el = document.querySelector(sel); if (!el) return { missing: true };
    const shownMode = !(document.body.classList.contains('ro') && el.classList.contains('adm-only'));
    const r = el.getBoundingClientRect();
    const inside = r.left >= -0.5 && r.right <= W + 0.5 && r.top >= -0.5 && r.bottom <= innerHeight + 0.5;
    const hit = document.elementFromPoint(Math.min(W - 1, Math.max(0, r.left + r.width / 2)), Math.max(0, r.top + r.height / 2));
    const tb = document.getElementById('topbar');
    return { shownMode, vis: vis(el), inBar: tb.contains(el), r: [r.left, r.top, r.right, r.bottom], inside, covered: !(hit && (hit === el || el.contains(hit))),
      txt: (el.innerText || '').replace(/\s+/g, ' ').trim(), title: el.getAttribute('title') || '' };
  };
  const overlap = (a, b) => Math.min(a[2], b[2]) - Math.max(a[0], b[0]) > 1 && Math.min(a[3], b[3]) - Math.max(a[1], b[1]) > 1;
  for (const w of [1024, 1280, 1366, 1600, 1920]) for (const admin of [false, true]) {
    await load(w, admin);
    const tag = w + (admin ? ' admin' : ' ro');
    await page.waitForTimeout(600);
    const SIG = () => { const t = document.getElementById('topbar'); const m = document.getElementById('tb-more'); return t.className + '|' + (m ? getComputedStyle(m).display : '-') + '|' + [...document.querySelectorAll('#topbar .tb, #zctrl, #tb-more-panel .tb')].map(e => (e.parentElement && e.parentElement.id) + ':' + Math.round(e.getBoundingClientRect().left)).join(','); };
    const sigs = []; for (let i = 0; i < 6; i++) { sigs.push(await page.evaluate(SIG)); await page.waitForTimeout(250); }
    if (new Set(sigs).size > 1) fail('S: ' + tag + ' layout keeps changing (' + new Set(sigs).size + ' different states in 1.5s)');
    const bar = await page.evaluate(() => { const t = document.getElementById('topbar'); return { sw: t.scrollWidth, cw: t.clientWidth, h: t.getBoundingClientRect().height, wt: getComputedStyle(document.getElementById('wrap')).top }; });
    if (bar.sw > bar.cw + 1) fail('F: ' + tag + ' topbar scrolls (' + bar.sw + ' > ' + bar.cw + ')');
    if (Math.abs(bar.h - 50) > 0.5) fail('H: ' + tag + ' topbar height ' + bar.h);
    if (bar.wt !== '50px') fail('H: ' + tag + ' #wrap top ' + bar.wt);
    const placed = [];
    const needMenu = [];
    for (const [sel, words, adm] of CTRLS) {
      const p = await page.evaluate(PROBE, sel);
      if (p.missing) { fail('F: ' + tag + ' control missing ' + sel); continue; }
      if (!p.shownMode) continue;
      if (p.vis && p.inBar && p.inside && !p.covered && p.r[3] <= 50.5 && p.r[1] >= -0.5) {
        placed.push([sel, p.r]);
        const letters = (p.txt.match(/[가-힣A-Za-z]/g) || []).length;
        if (letters < 2 && sel !== '#zctrl' && words && !words.split(' ').every(x => p.title.indexOf(x) >= 0)) fail('N: ' + tag + ' ' + sel + ' shows no label and its title "' + p.title + '" does not name ' + words);
      } else needMenu.push(sel);
    }
    for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) if (overlap(placed[i][1], placed[j][1])) fail('F: ' + tag + ' ' + placed[i][0] + ' overlaps ' + placed[j][0]);
    if (needMenu.length) {
      const m = await page.evaluate(PROBE, '#tb-more');
      if (m.missing || !(m.vis && m.inside && !m.covered && m.r[3] <= 50.5)) { fail('F: ' + tag + ' not reachable and no usable #tb-more: ' + needMenu.join(' ')); continue; }
      await page.mouse.click((m.r[0] + m.r[2]) / 2, (m.r[1] + m.r[3]) / 2); await page.waitForTimeout(250);
      for (const sel of needMenu) {
        const p = await page.evaluate(PROBE, sel);
        if (!(p.vis && p.inside && !p.covered)) fail('F: ' + tag + ' ' + sel + ' not usable in the overflow menu');
      }
      out.info[tag] = needMenu.length + ' in menu';
    } else out.info[tag] = 'all in bar';
  }
  // A: actions through the visible place
  async function clickCtl(sel) {
    const p = await page.evaluate(PROBE, sel);
    if (!(p.vis && p.inside && !p.covered)) { const m = await page.evaluate(PROBE, '#tb-more'); if (!m.missing && m.vis && m.inside) { await page.mouse.click((m.r[0] + m.r[2]) / 2, (m.r[1] + m.r[3]) / 2); await page.waitForTimeout(200); } }
    const q = await page.evaluate(PROBE, sel);
    if (!(q.vis && q.inside && !q.covered)) return false;
    await page.mouse.click((q.r[0] + q.r[2]) / 2, (q.r[1] + q.r[3]) / 2); await page.waitForTimeout(300); return true;
  }
  const shown = id => page.evaluate(id => { const e = document.getElementById(id); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; }, id);
  for (const w of [1024, 1280]) {
    await load(w, true);
    await page.evaluate(() => doZoomAbs(250)); const z0 = await page.evaluate(() => S.scale);
    if (!await clickCtl('button[onclick="fitScreen()"]')) fail('A: ' + w + ' 화면 맞춤 not clickable');
    else if (await page.evaluate(() => S.scale) === z0) fail('A: ' + w + ' 화면 맞춤 did not change zoom');
    await page.keyboard.press('Escape');
    if (!await clickCtl('#srch-btn')) fail('A: ' + w + ' 검색 not clickable');
    else { const s = await page.evaluate(() => { const e = document.getElementById('srch-input'); const r = e.getBoundingClientRect(); return { vis: getComputedStyle(e).display !== 'none' && r.width > 0, inside: r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, focus: document.activeElement === e }; });
      if (!s.vis || !s.inside) fail('A: ' + w + ' search input not fully in the window after opening'); }
    await page.keyboard.press('Escape'); await page.waitForTimeout(150);
    if (!await clickCtl('button[onclick="openOptions()"]')) fail('A: ' + w + ' 옵션 not clickable');
    else { const ov = await page.evaluate(() => [...document.querySelectorAll('[id$="ov"]')].some(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0)); if (!ov) fail('A: ' + w + ' 옵션 opened no overlay'); }
    await load(w, true);
    if (!await clickCtl('#btn-data')) fail('A: ' + w + ' 데이터 not clickable');
    else { const ov = await page.evaluate(() => [...document.querySelectorAll('[id$="ov"]')].some(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0)); if (!ov) fail('A: ' + w + ' 데이터 opened no overlay'); }
    await load(w, true);
    await page.evaluate(() => { window.__ms = 0; const o = window.manualSave; window.manualSave = function () { window.__ms++; return o.apply(this, arguments); }; });
    if (!await clickCtl('#btn-save')) fail('A: ' + w + ' 저장 not clickable');
    else if (!await page.evaluate(() => window.__ms)) fail('A: ' + w + ' 저장 click did not run manualSave');
  }
  // H: hide and reveal
  await load(1280, true);
  if (!await clickCtl('#tb-hide')) fail('H: ▲ not clickable');
  else {
    if (await shown('topbar')) fail('H: topbar still shown after ▲');
    if (!await shown('tb-reveal')) fail('H: ▼ not shown after hiding');
    else { await page.click('#tb-reveal'); await page.waitForTimeout(200); if (!await shown('topbar')) fail('H: topbar not back after ▼'); }
  }
  // P
  await load(1280, true);
  await page.evaluate(() => enterPresent()); await page.waitForTimeout(300);
  if (await shown('topbar') || await shown('tb-more')) fail('P: topbar or overflow button shown in presentation');
  await page.evaluate(() => exitPresent()); await page.waitForTimeout(200);
  await page.emulateMedia({ media: 'print' });
  if (await shown('topbar') || await shown('tb-more')) fail('P: topbar or overflow button shown in print');
  await page.emulateMedia({ media: 'screen' });
  await page.setViewportSize({ width: 1600, height: 1000 });
  if (out.errors.length) fail('E: page errors ' + out.errors.slice(0, 2).join(' | '));
  out.RESULT = out.fails.length ? 'RED' : 'GREEN';
  return JSON.stringify(out);
}
