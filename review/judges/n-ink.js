async page => {
  const AFTER = __OWNER20__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 40) out.fails.push(m); };
  const J = JSON.stringify;
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const LIB = `
    window.__lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
    window.__rgb = x => { x = String(x).trim(); if (x[0] === '#') { if (x.length === 4) x = '#' + x[1] + x[1] + x[2] + x[2] + x[3] + x[3]; return [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16)).concat([1]); }
      const n = (x.match(/[0-9.]+/g) || []).map(Number); return [n[0], n[1], n[2], n.length > 3 ? n[3] : 1]; };
    window.__over = (fg, bg) => [0, 1, 2].map(i => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
    window.__cr = (a, b) => { const x = __lum(a), y = __lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2); };
    window.__op = (el, stop) => { let o = 1; for (let e = el; e && e !== stop; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o; };`;
  await page.addScriptTag({ content: LIB });
  // defaults (no file)
  const d0 = await page.evaluate(() => { try{localStorage.clear();}catch(e){}
    const v = k => getComputedStyle(document.documentElement).getPropertyValue(k).trim();
    const conn = __rgb(v('--conn-solid')), hko = __rgb(v('--txt-hdr-ko')), mr2 = __rgb(v('--txt-mr2')), ma = __rgb(v('--txt-ma'));
    const lv = ['--hdr-top','--hdr-l1','--hdr-l2','--hdr-l3','--hdr-l4','--hdr-l5','--hdr-tf','--hdr-side'];
    return { conn: [__cr(conn, __rgb(v('--bg'))), __cr(conn, [255, 255, 255])], hko: lv.map(k => [k, __cr(hko, __rgb(v(k)))]),
      mr2: [__cr(mr2, [255, 255, 255]), __cr(mr2, __rgb(v('--row-even')))], ma: [__cr(ma, [255, 255, 255]), __cr(ma, __rgb(v('--row-even')))] }; });
  out.info.d0 = d0;
  if (!(Math.min(...d0.conn) >= 3)) fail('K1 connector default ' + J(d0.conn));
  d0.hko.forEach(([k, c]) => { if (!(c >= 4.5)) fail('T1 header subtitle on ' + k + ' ' + c); });
  if (!(Math.min(...d0.mr2) >= 4.5)) fail('T1 직책 ' + J(d0.mr2));
  if (!(Math.min(...d0.ma) >= 4.5)) fail('T1 분야 ' + J(d0.ma));
  // migration
  const mig = await page.evaluate(A => { window.alert = () => {}; window.confirm = () => true;
    const d = JSON.parse(JSON.stringify(A)); d.opt = Object.assign({}, d.opt, { connSolid: '#A0AABB', txtHdrKo: '#888888', txtMr2: '#999999', txtMa: '#7788aa', optVer: 3 });
    loadObject(d, false); const a = { c: OPT.connSolid, k: OPT.txtHdrKo, r: OPT.txtMr2, m: OPT.txtMa };
    const d2 = JSON.parse(JSON.stringify(A)); d2.opt = Object.assign({}, d2.opt, { connSolid: '#123456', txtMr2: '#654321', optVer: 3 });
    loadObject(d2, false); a.c2 = OPT.connSolid; a.r2 = OPT.txtMr2; return a; }, AFTER);
  out.info.mig = mig;
  if (/^#a0aabb$/i.test(mig.c) || /^#888888$/i.test(mig.k) || /^#999999$/i.test(mig.r) || /^#7788aa$/i.test(mig.m)) fail('K1/T1 old defaults kept on load ' + J(mig));
  if (mig.c2 !== '#123456' || mig.r2 !== '#654321') fail('custom colours changed on load ' + J(mig));
  // owner file, sheet 0
  const r6 = await page.evaluate(A => { loadObject(JSON.parse(JSON.stringify(A)), false); if (CUR_SHEET !== 0) switchSheet(0); ADMIN = true; applyRO(); render();
    const def = OPT.statusItems[0].key, lab = k => (OPT.statusItems.find(s => s.key === k) || {}).label;
    const r = { want: 0, bad: [], low: [], labels: {} };
    S.nodes.forEach(nd => (nd.m || []).forEach((m, i) => { const k = m.s || def, row = document.querySelector(`.mr[data-nid="${nd.id}"][data-mi="${i}"]`); if (!row) return;
      const t = row.querySelector('.mst'); const L = lab(k);
      if (k === def || !L) { if (t) r.bad.push('extra ' + nd.id + ':' + i); return; }
      r.want++; r.labels[L] = (r.labels[L] || 0) + 1;
      if (!t || t.textContent.trim() !== L) { r.bad.push('missing ' + nd.id + ':' + i + ' ' + L + ' got ' + (t ? t.textContent : '-')); return; }
      if (t.getClientRects().length === 0 || t.getBoundingClientRect().width < 4) r.bad.push('hidden ' + nd.id + ':' + i);
      let bg = __rgb(getComputedStyle(t).backgroundColor); const rb = __rgb(getComputedStyle(row).backgroundColor); const base = rb[3] > 0 ? __over(rb, [255, 255, 255]) : [255, 255, 255];
      const b2 = bg[3] > 0 ? __over(bg, base) : base; const fg = __rgb(getComputedStyle(t).color); fg[3] *= __op(t, row);
      const c = __cr(__over(fg, b2), b2); if (c < 4.5) r.low.push(L + ' ' + c); }));
    const P = CanvasRenderingContext2D.prototype, of = P.fillText, drawn = {}; window.alert = () => {}; HTMLAnchorElement.prototype.click = function(){};
    P.fillText = function(t){ t = String(t).trim(); drawn[t] = (drawn[t] || 0) + 1; return of.apply(this, arguments); }; try { exportPNG(); } finally { P.fillText = of; }
    r.png = Object.keys(r.labels).map(L => [L, r.labels[L], drawn[L] || 0]);
    return r; }, AFTER);
  out.info.r6 = r6;
  if (!r6.want) fail('R6 judge setup: no non-default status on sheet 0');
  if (r6.bad.length) fail('R6 marks ' + r6.bad.length + ' ' + J(r6.bad.slice(0, 5)));
  if (r6.low.length) fail('R6 mark contrast ' + J(r6.low.slice(0, 5)));
  r6.png.forEach(([L, n, d]) => { if (d < n) fail('R6 PNG label ' + L + ' drawn ' + d + ' of ' + n); });
  // r2 (UIUX ORGV r1 T1): the default header subtitle reaches 4.5:1 on every real header of the owner sheet, department colours included
  const hk = await page.evaluate(() => { const low = []; let n = 0;
    document.querySelectorAll('#canvas .nd .nko').forEach(e => { if (!e.textContent.trim() || e.getAttribute('style')) return; let b = e, bg = null;
      while (b) { const c = __rgb(getComputedStyle(b).backgroundColor); if (c[3] > 0) { bg = c; break; } b = b.parentElement; } if (!bg) return; n++;
      const c = __cr(__rgb(getComputedStyle(e).color), bg); if (c < 4.5) low.push(e.closest('.nd').id + ' ' + c + ' on ' + bg.slice(0, 3).join(',')); });
    return { n, low }; });
  out.info.hk = hk;
  if (!hk.n || hk.low.length) fail('T1 header subtitle on real headers ' + J({ n: hk.n, low: hk.low.slice(0, 4) }));
  await page.emulateMedia({ media: 'print' });
  const pr = await page.evaluate(() => { const t = [...document.querySelectorAll('.mst')]; return { n: t.length, vis: t.filter(e => getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden').length }; });
  await page.emulateMedia({ media: 'screen' });
  if (!pr.n || pr.vis !== pr.n) fail('R6 print marks ' + J(pr));
  // UI text
  const ui = await page.evaluate(() => { openOptions(); const r = {};
    const ink = (el, bgEl, bgFallback) => { if (!el) return null; let bg = bgFallback; if (bgEl) { const b = __rgb(getComputedStyle(bgEl).backgroundColor); bg = b[3] > 0 ? __over(b, bgFallback) : bgFallback; }
      const fg = __rgb(getComputedStyle(el).color); fg[3] *= __op(el, bgEl); return __cr(__over(fg, bg), bg); };
    const om = document.getElementById('optmodal');
    r.secTitle = ink(om.querySelector('.opt-sec-title'), om, [255, 255, 255]); r.val = ink(om.querySelector('.opt-val'), om, [255, 255, 255]); closeOptions();
    const tb = document.getElementById('topbar'); r.tsub = ink(tb.querySelector('.tsub'), tb, [0, 0, 0]);
    const z = document.createElement('div'); z.className = 'tfzone'; z.innerHTML = '<div class="tfzone-t">TF 구역</div>'; document.getElementById('canvas').appendChild(z);
    const cbg = __rgb(getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()); r.tf = ink(z.querySelector('.tfzone-t'), z, cbg); z.remove();
    // panel: job tab with an empty-job member and an off-category value
    const nd = S.nodes.find(n => (n.m || []).length > 2); nd.m[0].f = ''; nd.m[1].f = '임시직무값'; render();
    const fl = document.getElementById('statsfl'); fl.classList.remove('collapsed'); const jt = [...fl.querySelectorAll('.sfl-tab')].find(b => b.textContent.trim() === '직무'); switchStatTab(jt, 'job');
    const pbg = __rgb(getComputedStyle(fl).backgroundColor), pbase = pbg[3] > 0 ? __over(pbg, [0, 0, 0]) : [28, 28, 32];
    const lbls = [...fl.querySelectorAll('.sfl-row .sfl-lbl')]; const none = lbls.find(e => e.textContent.trim() === '미입력'), off = lbls.find(e => /임시직무값/.test(e.textContent));
    r.none = ink(none, fl, pbase); r.off = ink(off, fl, pbase);
    const tab = [...fl.querySelectorAll('.sfl-tab')].find(b => !b.classList.contains('active')); r.tab = ink(tab, tab, pbase);
    return r; });
  out.info.ui = ui;
  Object.entries(ui).forEach(([k, v]) => { if (!(v >= 4.5)) fail('T1/A7 ' + k + ' ' + v); });
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}