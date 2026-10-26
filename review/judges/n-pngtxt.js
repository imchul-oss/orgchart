async page => {
  const AFTER = __OWNER20__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 40) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const r = await page.evaluate(A => { try{localStorage.clear();}catch(e){} window.alert = () => {}; window.confirm = () => true;
    HTMLAnchorElement.prototype.click = function(){};
    const d = JSON.parse(JSON.stringify(A));
    d.sheets[0].nodes.forEach(n => (n.m||[]).forEach(m => { if (String(m.n||'').trim()) m.a = ['t_06','t_07','t_08','t_09','t_10'].includes(n.id) ? '1톄취' : '서울'; }));
    const ko1 = d.sheets[0].nodes.find(n => n.en && (n.m||[]).length > 1); const koId = ko1.id; ko1.ko = ko1.en; ko1.en = '';
    loadObject(d, false); if (CUR_SHEET !== 0) switchSheet(0); ADMIN = true; applyRO(); render();
    const hex = c => { c = String(c||'').trim(); let m = /^#([0-9a-f]{6})$/i.exec(c); if (m) return '#' + m[1].toLowerCase(); m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(c); if (m) return '#' + (m[1]+m[1]+m[2]+m[2]+m[3]+m[3]).toLowerCase();
      m = /rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/.exec(c); return m ? '#' + [m[1],m[2],m[3]].map(v => (+v).toString(16).padStart(2,'0')).join('') : c; };
    const norm = s => String(s||'').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
    const rec = []; const P = CanvasRenderingContext2D.prototype, of = P.fillText;
    P.fillText = function(t, x, y){ rec.push({ t: norm(t), col: hex(this.fillStyle), cx: x, cy: y }); return of.apply(this, arguments); };
    const run = () => { rec.length = 0; exportPNG(); return rec.slice(); };
    const pt = q => ({ x: q.cx, y: q.cy });  // card text is drawn in chart units under the export transform
    const H = collHidden(), vis = S.nodes.filter(n => !H.has(n.id) && document.getElementById('n' + n.id));
    const R1 = run();
    const inBox = (n, q) => { const p = pt(q); return p.x >= n.x - 1 && p.x <= n.x + cardW(n) + 1 && p.y >= n.y - 1 && p.y <= n.y + nh(n) + 1; };
    const res = { miss: [], area: [], ko: null, cmp: {} };
    const maCol = hex(getComputedStyle(document.documentElement).getPropertyValue('--txt-ma'));
    vis.forEach(n => { const el = document.getElementById('n' + n.id), L = R1.filter(q => inBox(n, q));
      const ok = s => L.some(q => q.t === s || (q.t.endsWith('…') && s.startsWith(q.t.slice(0, -1)) && q.t.length > 1)) || L.some((q, i) => i + 1 < L.length && norm(q.t + ' ' + L[i+1].t) === s) || L.some((q, i) => i + 1 < L.length && norm(q.t + L[i+1].t) === s);
      const want = [...el.querySelectorAll('.nen,.nko,.mn,.mr2,.mf')].map(e => norm(e.innerText)).filter(Boolean);
      want.forEach(s => { if (!ok(s) && res.miss.length < 15) res.miss.push(n.id + ' ' + s); });
      (n.m||[]).forEach(m => { if (!m.a) return; const q = L.find(q => q.t === m.a || q.t.endsWith('/ ' + m.a) || q.t === '/ ' + m.a);
        if (!q) { if (res.area.length < 10) res.area.push(n.id + ' no area text ' + m.a); } else if (q.col !== maCol) { if (res.area.length < 10) res.area.push(n.id + ' area color ' + q.col + ' want ' + maCol); } }); });
    { const n = S.nodes.find(x => x.id === koId), el = document.getElementById('n' + koId), ne = el.querySelector('.nen'), nr = el.getBoundingClientRect(), er = ne.getBoundingClientRect();
      const k = nh(n) / nr.height, wantY = n.y + ((er.top + er.height / 2) - nr.top) * k;
      const L = R1.filter(q => inBox(n, q) && q.t === norm(n.ko));
      res.ko = { n: L.length, col: L.map(q => q.col), want: hex(getComputedStyle(ne).color), y: L.map(q => +pt(q).y.toFixed(1)), wantY: +wantY.toFixed(1),
        sub: R1.filter(q => inBox(n, q) && pt(q).y > n.y + CUR_HH * 0.55 && pt(q).y < n.y + CUR_HH).map(q => q.t) }; }
    // compare mode: old copy lacks the first named member of two cards and has a different 직책 for one member
    const old = JSON.parse(JSON.stringify({ sheets: SHEETS.map(s => ({ name: s.name, nodes: s.nodes, conns: s.conns })) }));
    let drop = 0; old.sheets[0].nodes.forEach(n => { if (drop < 2 && (n.m||[]).length > 1 && String(n.m[0].n||'').trim()) { n.m.shift(); drop++; } });
    const ch = old.sheets[0].nodes.find(n => (n.m||[]).some(m => m.r)); if (ch) { const m = ch.m.find(m => m.r); m.r = m.r + 'X'; }
    CMP = { file: 'old.json', data: old, single: false }; cmpRun();
    const LB = ['신규','이동','변경','공석'];
    const marked = () => [...document.querySelectorAll('.mr[data-cmp]')].filter(e => { const nd = e.closest('.nd'); return nd && !H.has(nd.id.slice(1)); }).length;
    res.cmp.dom = marked();
    const R2 = run(); res.cmp.on = R2.filter(q => LB.includes(q.t)).length;
    const cb = document.getElementById('cmp-out'); if (cb) { cb.checked = false; cb.dispatchEvent(new Event('change', { bubbles: true })); }
    res.cmp.outFlag = CMP.out;
    const R3 = run(); res.cmp.off = R3.filter(q => LB.includes(q.t)).length;
    P.fillText = of;
    const row = document.querySelector('.mr[data-cmp]'); if (row) row.id = '__cmprow';
    return res; }, AFTER);
  await page.emulateMedia({ media: 'print' });
  const pr = await page.evaluate(() => { const e = document.getElementById('__cmprow'); if (!e) return null; const a = getComputedStyle(e, '::after'), s = getComputedStyle(e);
    return { content: a.content, disp: a.display, bg: s.backgroundColor }; });
  await page.emulateMedia({ media: 'screen' });
  out.info = { ko: r.ko, cmp: r.cmp, print: pr, miss: r.miss.slice(0, 5) };
  const J = JSON.stringify;
  if (r.miss.length) fail('P1 card text missing in PNG ' + J(r.miss));
  if (r.area.length) fail('P2 area ' + J(r.area));
  const K = r.ko; if (K.n !== 1 || K.col[0] !== K.want || Math.abs(K.y[0] - K.wantY) > 3 || K.sub.length) fail('P3 Korean-only title ' + J(K));
  const C = r.cmp; if (!(C.dom > 0) || C.on !== C.dom) fail('P4 marks with output on: png ' + C.on + ' dom ' + C.dom);
  if (C.outFlag !== false || C.off !== 0) fail('P4 marks with output off: png ' + C.off + ' flag ' + C.outFlag);
  if (!pr || !(pr.content === 'none' || pr.disp === 'none') || /0\.(18|22)\)/.test(pr.bg)) fail('P4 print with output off ' + J(pr));
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}