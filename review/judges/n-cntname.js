async page => {
  const OWNER = __OWNER__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 40) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  await page.evaluate(d => { try{localStorage.clear();}catch(e){} _adoptData(JSON.parse(JSON.stringify(d)),false); _finishLoad(true); _applyOptObj(d.opt);
    for (let i=0;i<SHEETS.length;i++){ if(i!==CUR_SHEET) switchSheet(i); if(S.nodes.some(n=>(n.m||[]).some(m=>/NGUYEN VAN KY/.test(m.n)))) break; }
    ADMIN=true; applyRO(); render(); fitScreen(); }, OWNER);
  await page.waitForTimeout(200);
  const pills = () => page.evaluate(() => [...document.querySelectorAll('.nd .ncnt')].map(p => { const c = p.closest('.nd').getBoundingClientRect(), r = p.getBoundingClientRect(), s = S.scale || 1;
    return { id: p.closest('.nd').id, dr: (c.right - r.right) / s, in: r.right <= c.right + 0.5 && r.left >= c.left - 0.5 }; }));
  const ed = await pills();
  await page.evaluate(() => { ADMIN = false; applyRO(); render(); }); await page.waitForTimeout(150);
  const ro = await pills();
  await page.emulateMedia({ media: 'print' }); await page.waitForTimeout(150);
  const pr = await pills();
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => { ADMIN = true; applyRO(); render(); }); await page.waitForTimeout(150);
  if (!ed.length) fail('P1: no count pills');
  ed.forEach((e, i) => { if (!e.in) fail('P1: edit pill outside ' + e.id);
    [['ro', ro[i]], ['print', pr[i]]].forEach(([k, o]) => { if (!o) { fail('P1: ' + k + ' pill missing ' + e.id); return; } if (!o.in) fail('P1: ' + k + ' pill outside card ' + o.id + ' dr ' + o.dr.toFixed(1)); if (Math.abs(o.dr - e.dr) > 1) fail('P1: ' + k + ' pill moved ' + e.id + ' ' + e.dr.toFixed(1) + ' -> ' + o.dr.toFixed(1)); }); });
  out.info.p1 = { n: ed.length, edit: ed[0] && ed[0].dr, ro: ro[0] && ro[0].dr, print: pr[0] && pr[0].dr };
  // PNG: record fillText calls
  const png = await page.evaluate(() => { const calls = []; const P = CanvasRenderingContext2D.prototype, f0 = P.fillText, tb = HTMLCanvasElement.prototype.toBlob;
    P.fillText = function (t, x, y) { const m = this.getTransform(); calls.push({ t: String(t), x: (x * m.a + m.e - (m.e)) , ux: x, uy: y, al: this.textAlign, w: this.measureText(String(t)).width }); return f0.apply(this, arguments); };
    HTMLCanvasElement.prototype.toBlob = function () {};
    try { exportPNG(); } finally { P.fillText = f0; HTMLCanvasElement.prototype.toBlob = tb; }
    const cards = S.nodes.filter(n => !collHidden().has(n.id)).map(n => ({ id: n.id, x: n.x, y: n.y, w: cardW(n), lbl: (OPT.showCnt !== false && cntLabel(n)) || '' }));
    return { calls, cards }; });
  let pn = 0;
  png.cards.forEach(c => { if (!c.lbl) return; const k = png.calls.find(q => q.t === c.lbl && q.uy >= c.y - 20 && q.uy <= c.y + 70 && q.ux > c.x && q.ux < c.x + c.w + 60);
    if (!k) { fail('P2: no PNG label for ' + c.id); return; } pn++;
    const right = k.al === 'right' ? k.ux : k.ux + k.w; if (right > c.x + c.w + 0.5) fail('P2: PNG label outside card ' + c.id + ' right ' + right.toFixed(1) + ' > ' + (c.x + c.w));
    const e = ed.find(q => q.id === 'n' + c.id); if (e) { const dr = c.x + c.w - right; if (Math.abs(dr - e.dr) > 8) fail('P2: PNG label spot ' + c.id + ' ' + dr.toFixed(1) + ' vs edit ' + e.dr.toFixed(1)); } });
  out.info.p2 = pn;
  // names
  const nm = await page.evaluate(() => { const rows = [...document.querySelectorAll('.mr')]; const get = re => rows.find(r => re.test(r.textContent));
    const a = get(/NGUYEN VAN KY/), k = rows.find(r => /\([^)]*\)/.test(r.querySelector('.mn').textContent) && !/[A-Za-z]/.test(r.querySelector('.mn').textContent));
    const clip = []; document.querySelectorAll('.nd .mn,.nd .mf').forEach(e => { if (!e.clientWidth) return; const fs = parseFloat(getComputedStyle(e).fontSize), base = parseFloat(getComputedStyle(e.parentElement).fontSize) ; if (e.scrollWidth > e.clientWidth + 1 && !e.style.fontSize) clip.push(e.textContent.slice(0, 30)); });
    return { a: a ? [a.querySelector('.mn').textContent, a.querySelector('.mf').textContent] : null, k: k ? k.querySelector('.mn').textContent : null, clip }; });
  if (!nm.a) fail('N1: row not found'); else { if (nm.a[0].trim() !== 'NGUYEN VAN KY') fail('N1: line 1 ' + JSON.stringify(nm.a[0])); if (!/^\(응우옌 반 키\)/.test(nm.a[1].trim())) fail('N1: line 2 ' + JSON.stringify(nm.a[1])); }
  if (!png.calls.some(q => q.t.trim() === 'NGUYEN VAN KY' || (/^NGUYEN VAN KY\s+\S+/.test(q.t) && !/\(/.test(q.t)))) fail('N1: PNG line 1 not split');  // fidelity (10-20): the name and the 직급 are separate fillText calls
  if (!png.calls.some(q => /^\(응우옌 반 키\)/.test(q.t))) fail('N1: PNG line 2 missing');
  const k2 = await page.evaluate(() => { switchSheet(0); render(); const r = [...document.querySelectorAll('.mr')].find(r => /\(예구\)/.test(r.textContent)); return r ? [r.querySelector('.mn').textContent, r.querySelector('.mf').textContent] : null; });
  if (!k2) fail('N2: no (예구) row on sheet 0'); else if (!/^\S+\(예구\)$/.test(k2[0].trim()) || /예구/.test(k2[1])) fail('N2: Korean name split ' + JSON.stringify(k2));
  out.info.k2 = k2;
  if (nm.clip.length) fail('N3: clipped without shrinking: ' + nm.clip.slice(0, 5).join(' | '));
  out.info.nm = nm;
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}