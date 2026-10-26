async page => {
  const AFTER = __OWNER20__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 40) out.fails.push(m); };
  const J = JSON.stringify;
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const q1 = await page.evaluate(A => { try{localStorage.clear();}catch(e){} window.alert = () => {}; window.confirm = () => true; window.__pc = 0; window.print = () => { window.__pc++; };
    loadObject(JSON.parse(JSON.stringify(A)), false); if (CUR_SHEET !== 0) switchSheet(0); ADMIN = true; applyRO(); render();
    const tf0 = document.getElementById('canvas').style.transform;
    printChart(); const ov = document.getElementById('prov'); const r = { tf0, open: !!ov && ov.classList.contains('show'), printed: window.__pc };
    if (!ov) return r;
    const rows = [...ov.querySelectorAll('input[type=radio]')].map(x => { const row = x.closest('label,.pr-row') || x.parentElement; return { v: x.value, on: x.checked, t: row.textContent.replace(/\s+/g, ' ').trim() }; });
    r.rows = rows;
    ov.querySelector('.bca') && ov.querySelector('.bca').click(); r.cancelClosed = !ov.classList.contains('show'); r.cancelPrinted = window.__pc;
    printChart(); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); r.escClosed = !ov.classList.contains('show'); r.escPrinted = window.__pc;
    return r; }, AFTER);
  out.info.q1 = q1;
  if (!q1.open || q1.printed) fail('Q1 chooser ' + J({ open: q1.open, printed: q1.printed }));
  const rows = q1.rows || [];
  const want = [['a4', /A4 가로 한 장/], ['a3', /A3 가로 한 장/], ['a4split', /A4 가로 여러 장/]];
  want.forEach(([v, re]) => { const x = rows.find(r => r.v === v); if (!x || !re.test(x.t) || !/[0-9.]+\s*pt/.test(x.t)) fail('Q1 choice ' + v + ' ' + J(x)); });
  const sp = rows.find(r => r.v === 'a4split'); const nPages = sp && /([0-9]+)\s*쪽/.exec(sp.t) ? +/([0-9]+)\s*쪽/.exec(sp.t)[1] : null;
  if (!nPages) fail('Q1 split page count ' + J(sp));
  if (!(rows.find(r => r.v === 'a4') || {}).on) fail('Q1 default not A4');
  if (!q1.cancelClosed || q1.cancelPrinted || !q1.escClosed || q1.escPrinted) fail('Q1 cancel/escape ' + J(q1));
  if (!q1.rows) { out.RESULT = 'RED ' + (out.fails.length + out.errors.length); return out; }
  // run one mode through the chooser and measure inside the print call
  const run = async (mode, W, H) => {
    await page.evaluate(() => restorePrint());
    await page.evaluate(m => { window.__pc = 0; printChart(); const ov = document.getElementById('prov'); const x = ov.querySelector(`input[type=radio][value="${m}"]`); if (x) { x.checked = true; x.dispatchEvent(new Event('change', { bubbles: true })); }
      const b = [...ov.querySelectorAll('button')].find(b => b.textContent.trim() === '인쇄'); b && b.click(); }, mode);
    await page.emulateMedia({ media: 'print' }); await page.setViewportSize({ width: W, height: H }); await page.waitForTimeout(300);
    const m = await page.evaluate(([W, H]) => { const r = { printed: window.__pc, paper: OPT.printPaper, css: [...document.querySelectorAll('style')].map(s => s.textContent).filter(t => /@page/.test(t)).join(' ') };
      const pages = [...document.querySelectorAll('#print-pages .ppage')]; r.pages = pages.length;
      const ids = S.nodes.filter(n => !collHidden().has(n.id)).map(n => 'n' + n.id);
      const vis = e => { for (let x = e; x; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.display === 'none' || cs.visibility === 'hidden') return false; } return true; };
      const pt = e => { const fs = parseFloat(getComputedStyle(e).fontSize); const k = e.getBoundingClientRect().height / e.offsetHeight || 1; return +(fs * k * 0.75).toFixed(2); };
      if (pages.length) {
        r.bad = []; r.pageSz = pages.map(p => [Math.round(p.getBoundingClientRect().width), Math.round(p.getBoundingClientRect().height)]);
        const seen = {};
        pages.forEach((p, pi) => { const pr = p.getBoundingClientRect();
          p.querySelectorAll('.nd').forEach(e => { if (!vis(e)) return; const id = e.getAttribute('id'); if (!ids.includes(id)) return; seen[id] = (seen[id] || 0) + 1; const b = e.getBoundingClientRect();
            const mg = Math.min(b.left - pr.left, b.top - pr.top, pr.right - b.right, pr.bottom - b.bottom); if (mg < 29.5) r.bad.push(id + '@' + pi + ' margin ' + Math.round(mg)); }); });
        r.missing = ids.filter(i => !seen[i]); r.twice = ids.filter(i => seen[i] > 1);
        const mn = pages[0].querySelector('.nd .mn'); r.pt = mn ? pt(mn) : null;
      } else {
        r.bad = []; const wrapVis = vis(document.getElementById('wrap'));
        ids.forEach(id => { const e = document.getElementById(id); if (!e || !vis(e)) return; const b = e.getBoundingClientRect(); const mg = Math.min(b.left, b.top, W - b.right, H - b.bottom); if (mg < 29.5) r.bad.push(id + ' margin ' + Math.round(mg)); });
        r.wrapVis = wrapVis; const mn = document.querySelector('#canvas .nd .mn'); r.pt = mn ? pt(mn) : null;
      }
      return r; }, [W, H]);
    await page.emulateMedia({ media: 'screen' }); await page.setViewportSize({ width: 1366, height: 768 });
    return m; };
  const a4 = await run('a4', 1123, 794), a3 = await run('a3', 1587, 1123), sp4 = await run('a4split', 1123, 794);
  out.info.modes = { a4, a3, sp4, nPages };
  [['a4', a4, /size:\s*A4 landscape/], ['a3', a3, /size:\s*A3 landscape/]].forEach(([k, m, re]) => {
    if (m.printed !== 1 || m.paper !== k) fail('Q2 ' + k + ' print/remember ' + J({ p: m.printed, paper: m.paper }));
    if (!re.test(m.css)) fail('Q2 ' + k + ' page css');
    if (m.pages) fail('Q2 ' + k + ' made split pages');
    if (m.bad.length) fail('Q2 ' + k + ' cards near edge ' + m.bad.length + ' ' + J(m.bad.slice(0, 4))); });
  if (!(a3.pt > a4.pt)) fail('Q2 A3 name pt not larger ' + J([a4.pt, a3.pt]));
  if (sp4.printed !== 1 || sp4.paper !== 'a4split') fail('Q3 print/remember ' + J({ p: sp4.printed, paper: sp4.paper }));
  if (!(sp4.pages >= 2) || sp4.pages !== nPages) fail('Q3 page count ' + J({ pages: sp4.pages, est: nPages }));
  if ((sp4.pageSz || []).some(([w, h]) => Math.abs(w - 1123) > 1 || Math.abs(h - 794) > 1)) fail('Q3 page size ' + J(sp4.pageSz));
  if ((sp4.missing || []).length || (sp4.twice || []).length || (sp4.bad || []).length) fail('Q3 cards ' + J({ miss: (sp4.missing || []).slice(0, 4), twice: (sp4.twice || []).slice(0, 4), bad: (sp4.bad || []).slice(0, 4), nb: (sp4.bad || []).length }));
  if (!(sp4.pt >= a4.pt) || !(sp4.pt >= 6)) fail('Q3 name pt ' + J([a4.pt, sp4.pt]));
  const q4 = await page.evaluate(tf0 => { window.dispatchEvent(new Event('afterprint')); return { pages: !!document.getElementById('print-pages'), tf: document.getElementById('canvas').style.transform, same: document.getElementById('canvas').style.transform === tf0 }; }, q1.tf0);
  if (q4.pages || !q4.same) fail('Q4 restore ' + J(q4));
  const q5 = await page.evaluate(() => { window.dispatchEvent(new Event('beforeprint')); const n = document.querySelectorAll('#print-pages .ppage').length; window.dispatchEvent(new Event('afterprint')); return { n, mode: OPT.printPaper }; });
  if (!(q5.n >= 2)) fail('Q5 Ctrl+P remembered split ' + J(q5));
  out.info.pt = { a4: a4.pt, a3: a3.pt, split: sp4.pt, pages: sp4.pages };
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}