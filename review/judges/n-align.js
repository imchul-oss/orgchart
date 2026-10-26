async page => {
  const AFTER = __OWNER20__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 40) out.fails.push(m); };
  const J = JSON.stringify;
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const r = await page.evaluate(async A => { const w = ms => new Promise(res => setTimeout(res, ms));
    try{localStorage.clear();}catch(e){} window.alert = () => {}; window.confirm = () => true;
    loadObject(JSON.parse(JSON.stringify(A)), false); if (CUR_SHEET !== 0) switchSheet(0); ADMIN = true; applyRO(); render();
    const fl = document.getElementById('statsfl'); fl.classList.remove('collapsed');
    const tabs = [...fl.querySelectorAll('.sfl-tab')]; const st = tabs.find(t => (t.getAttribute('onclick') || '').indexOf("'summary'") >= 0);
    switchStatTab(st, 'summary'); await w(30);
    const R = { scopes: {} };
    for (const sc of ['cur', 'all']) { _sflSetScope(sc); await w(30);
      const rows = [...fl.querySelectorAll('.sfl-row')].filter(e => e.querySelector('.sfl-num') && !e.closest('.sfl-foot'));
      const tots = [...fl.querySelectorAll('.sfl-foot .sfl-total-num')].map(e => e.getBoundingClientRect().right);
      const nums = rows.map(e => e.querySelector('.sfl-num').getBoundingClientRect().right);
      const names = []; const boxes = [];
      rows.forEach(e => { const bx = [...e.querySelectorAll('input[type=checkbox][data-inc]')]; boxes.push(bx.length);
        bx.forEach(b => { const l = b.getAttribute('aria-label') || ''; names.push(l); }); });
      R.scopes[sc] = { n: rows.length, nums: nums.map(Math.round), tots: tots.map(Math.round), boxes, names,
        rowLbls: rows.map(e => (e.querySelector('.sfl-lbl') || {}).textContent) };
    }
    // toggle a box: totals move
    _sflSetScope('cur'); await w(30);
    const t0 = [...fl.querySelectorAll('.sfl-foot .sfl-total-num')].map(e => e.textContent).join('|');
    const b = fl.querySelector('input[type=checkbox][data-inc=cur]:checked'); if (b) { b.click(); await w(30); }
    R.tog = [t0, [...fl.querySelectorAll('.sfl-foot .sfl-total-num')].map(e => e.textContent).join('|')];
    // data window
    openData(); await w(30);
    R.sg = [...document.querySelectorAll('#sg-list .sg-row')].map(e => [(e.querySelector('.sg-name') || {}).getAttribute ? e.querySelector('.sg-name').getAttribute('aria-label') : null,
      e.querySelector('.sg-del') ? e.querySelector('.sg-del').getAttribute('aria-label') : null, e.querySelector('.sg-name').value]);
    closeData();
    // options window contrast
    openOptions(); await w(30);
    const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
    const rgb = x => (String(x).match(/[0-9.]+/g) || []).map(Number);
    const cr = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2); };
    const om = document.getElementById('optmodal'); const bg = rgb(getComputedStyle(om).backgroundColor);
    const sec = om.querySelector('[data-sec=logo]');
    const hint = [...sec.querySelectorAll('p')].find(e => /데이터/.test(e.textContent)); const sub = sec.querySelector('.opt-sub');
    const ink = e => { if (!e) return null; const c = rgb(getComputedStyle(e).color); let o = 1; for (let x = e; x && x !== om; x = x.parentElement) o *= +getComputedStyle(x).opacity; const a = (c[3] == null ? 1 : c[3]) * o;
      const fg = [0, 1, 2].map(i => c[i] * a + bg[i] * (1 - a)); return cr(fg, bg); };
    R.hint = ink(hint); R.sub = ink(sub); closeOptions();
    return R; }, AFTER);
  out.info = r;
  for (const sc of ['cur', 'all']) { const x = r.scopes[sc];
    if (!x.n) fail('A8 setup: no rows in 현황 ' + sc);
    if (x.tots.length !== 2) fail('A8 setup: totals ' + sc + ' ' + J(x.tots));
    const ref = Math.max(...x.tots), off = x.nums.map((v, i) => [x.rowLbls[i], v - ref]).filter(([, d]) => Math.abs(d) > 1);
    if (Math.abs(x.tots[0] - x.tots[1]) > 1) fail('A8 totals not aligned ' + sc + ' ' + J(x.tots));
    if (off.length) fail('A8 row number ends vs totals ' + sc + ' ' + J(off.slice(0, 5)));
    if (x.boxes.filter(n => n === 2).length < 2 || x.boxes.some(n => n !== 0 && n !== 2)) fail('A8 include boxes ' + sc + ' ' + J(x.boxes));
    const nm = x.names; if (nm.some(l => !l || !/현원|정원/.test(l)) || new Set(nm).size !== nm.length) fail('M5 include box names ' + sc + ' ' + J(nm.slice(0, 6)));
  }
  if (r.tog[0] === r.tog[1]) fail('A8 toggling an include box did not change totals ' + J(r.tog));
  if (!r.sg.length) fail('M5 setup: no stats groups');
  { const a = r.sg.map(x => x[0]), d = r.sg.map(x => x[1]);
    if (a.some(l => !l) || new Set(a).size !== a.length) fail('M5 group name inputs ' + J(a));
    if (d.some(l => !l) || new Set(d).size !== d.length) fail('M5 group delete buttons ' + J(d)); }
  if (r.hint !== null && !(r.hint >= 4.5)) fail('T1 options hint ' + r.hint);  // 2026-10-26 colors unit removes the hint (absence judged by VERIFY_colors)
  if (!(r.sub >= 4.5)) fail('T1 options 글자 sub-heading ' + r.sub);
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}