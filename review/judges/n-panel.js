async page => {
  const AFTER = __OWNER20__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 40) out.fails.push(m); };
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const r = await page.evaluate(A => { try{localStorage.clear();}catch(e){} window.alert = () => {}; window.confirm = () => true;
    const d = JSON.parse(JSON.stringify(A));
    d.sheets[0].nodes.forEach(n => (n.m||[]).forEach(m => { if (String(m.n||'').trim()) m.a = ['t_06','t_07','t_08','t_09','t_10'].includes(n.id) ? '1톄취' : '서울'; }));
    loadObject(d, false); if (CUR_SHEET !== 0) switchSheet(0); ADMIN = true; applyRO(); render();
    const fl = document.getElementById('statsfl'); fl.classList.remove('collapsed'); fl.style.display = '';
    const tabs = [...document.querySelectorAll('#statsfl-tabs .sfl-tab')]; const tabBtn = nm => tabs.find(b => b.textContent.trim() === nm);
    const body = document.getElementById('statsfl-body');
    const tot = () => [...body.querySelectorAll('.sfl-foot .sfl-total')].map(t => [t.querySelector('.sfl-total-lbl').textContent.trim(), t.querySelector('.sfl-total-num').textContent.trim()]);
    const res = {};
    // N2
    const widths = [], pads = [];
    tabs.forEach(b => { switchStatTab(b, b.getAttribute('onclick').match(/'(\w+)'\)/)[1]); widths.push(Math.round(fl.getBoundingClientRect().width * 10) / 10);
      const rg = document.createRange(); rg.selectNodeContents(b); const tw = rg.getBoundingClientRect().width, cs = getComputedStyle(b);
      pads.push(+(((b.getBoundingClientRect().width - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth)) - tw) / 2).toFixed(2)); });
    res.n2 = { gap: getComputedStyle(document.getElementById('statsfl-tabs')).columnGap, widths, pads };
    // N1
    switchStatTab(tabBtn('직무'), 'job'); res.job = tot();
    const sel = document.getElementById('statsfl-grp'), gi = OPT.statsGroups.findIndex(g => g.name === '재직'); sel.value = String(gi); updateStatsPanel(); res.grp = tot(); sel.value = ''; updateStatsPanel();
    switchStatTab(tabBtn('조회'), 'query'); res.q0 = tot();
    const hintEl = body.querySelector('.sfl-qhint');
    const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
    const rgb = s => (s.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
    const bg = rgb(getComputedStyle(fl).backgroundColor);
    const ctr = el => { if (!el) return null; let op = 1, e = el; while (e && e !== fl.parentElement) { op *= parseFloat(getComputedStyle(e).opacity); e = e.parentElement; }
      const fg = rgb(getComputedStyle(el).color).map((v, i) => v * op + bg[i] * (1 - op)); const a = lum(fg), b = lum(bg); return +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2); };
    res.hintC = ctr(hintEl);
    const ch = (id, v) => { const e = document.getElementById(id); if (!e) return false; e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); return true; };
    const add = (k, v) => ch('sfl-q-k', k) && ch('sfl-q-v', v);
    res.aria = ['sfl-q-k', 'sfl-q-v', 'sfl-q-by'].map(id => { if (id === 'sfl-q-v') ch('sfl-q-k', 'r'); const e = document.getElementById(id); return e ? (e.getAttribute('aria-label') || '') : null; });
    add('r', '킈쮀'); res.clr1 = !!body.querySelector('.sfl-qclr'); res.q1 = tot();
    add('r', '저줴'); add('a', '1톄취');
    const sum = body.querySelector('.sfl-qsum'); res.sum = sum ? { t: sum.textContent.trim(), vis: getComputedStyle(sum).display !== 'none' && sum.getBoundingClientRect().height > 0 } : null;
    res.listC = ctr(body.querySelector('.sfl-qlist .sfl-sec-lbl'));
    const clr = body.querySelector('.sfl-qclr'); res.clr3 = !!clr; if (clr) clr.click(); res.afterClr = body.querySelectorAll('.sfl-qchip').length;
    // N6: 분야 1톄취 and a 서울 team -> nothing
    const seoulTeam = _sflLabel(S.nodes.find(n => n.id === 't_01')); _qConds = [{ k: 'a', v: '1톄취' }, { k: 'team', v: seoulTeam }]; updateStatsPanel();
    const em = body.querySelector('.sfl-qempty'); res.empty = { t: em ? em.textContent.trim() : null, tot: tot() };
    // N8 setup: long list
    _qConds = [{ k: 'st', v: 'active' }]; updateStatsPanel();
    fl.style.left = '20px'; fl.style.top = '60px'; fl.style.right = 'auto'; fl.style.bottom = 'auto'; updateStatsPanel();
    const hd = document.getElementById('statsfl-title').getBoundingClientRect(); res.grab = { x: hd.left + 4, y: hd.top + hd.height / 2 };
    return res; }, AFTER);
  const chk = () => page.evaluate(() => { const fl = document.getElementById('statsfl'), sb = document.getElementById('sheetbar'), st = document.getElementById('stbar');
    const lim = Math.min(...[sb, st].filter(e => e && getComputedStyle(e).display !== 'none').map(e => e.getBoundingClientRect().top));
    const f = fl.querySelector('.sfl-foot .sfl-total-num'), q = f && f.getBoundingClientRect(); const ep = q && document.elementFromPoint(q.left + 3, q.top + q.height / 2);
    return { bottom: Math.round(fl.getBoundingClientRect().bottom), lim: Math.round(lim), hit: !!(ep && ep.closest && ep.closest('.sfl-foot')) }; });
  await page.mouse.move(r.grab.x, r.grab.y); await page.mouse.down(); await page.mouse.move(r.grab.x, r.grab.y + 150); await page.mouse.move(r.grab.x, r.grab.y + 300); await page.mouse.up(); await page.waitForTimeout(200);
  const drag = await chk();
  await page.evaluate(() => { const fl = document.getElementById('statsfl'); fl.style.top = '60px'; updateStatsPanel(); });
  await page.setViewportSize({ width: 1366, height: 600 }); await page.waitForTimeout(400);
  const rsz = await chk();
  out.info = { n2: r.n2, job: r.job, grp: r.grp, q0: r.q0, q1: r.q1, sum: r.sum, aria: r.aria, c: [r.hintC, r.listC], empty: r.empty, drag, rsz };
  const J = JSON.stringify;
  if (J(r.job) !== J([['합계 (현원/정원)', '58/65']])) fail('N1 job total ' + J(r.job));
  if (J(r.grp) !== J([['재직', '54']])) fail('N1 group total ' + J(r.grp));
  if (!r.q0.length || r.q0[0][0] !== '전체 (현원/정원)') fail('N1 query no-condition total ' + J(r.q0));
  if (!r.q1.length || r.q1[0][0] !== '해당 (현원/정원)') fail('N1 query total ' + J(r.q1));
  const N = r.n2; if (N.gap !== '2px' || N.widths.some(w => w < 224 || Math.abs(w - N.widths[0]) > 0.5) || N.pads.some(p => p < 1.5)) fail('N2 tabs ' + J(N));
  if (!r.sum || !r.sum.vis || !/또는/.test(r.sum.t) || !/그리고/.test(r.sum.t)) fail('N3 condition line ' + J(r.sum));
  if (r.aria.some(a => !a)) fail('N4 select names ' + J(r.aria));
  if (!(r.hintC >= 4.5) || !(r.listC >= 4.5)) fail('N5 contrast hint ' + r.hintC + ' list ' + r.listC);
  if (!r.empty.t || !/없습니다/.test(r.empty.t)) fail('N6 empty message ' + J(r.empty));
  if (r.clr1 || !r.clr3 || r.afterClr !== 0) fail('N7 clear all ' + J({ one: r.clr1, three: r.clr3, after: r.afterClr }));
  if (drag.bottom > drag.lim || !drag.hit) fail('N8 after drag ' + J(drag));
  if (rsz.bottom > rsz.lim || !rsz.hit) fail('N8 after resize ' + J(rsz));
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}