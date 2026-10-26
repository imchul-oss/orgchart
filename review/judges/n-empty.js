async page => {
  const OWNER = __OWNER__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 30) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const r = await page.evaluate(d => { try{localStorage.clear();}catch(e){} window.alert = () => {}; window.confirm = () => true; _adoptData(JSON.parse(JSON.stringify(d)),false); _finishLoad(true); _applyOptObj(d.opt); OPT.colGap = d.opt.colGap; if (CUR_SHEET !== 1) switchSheet(1); collState().clear(); collSave(); ADMIN = true; applyRO(); OPT.rowMode = 'depth'; autoLayout(); render();
    const by = id => S.nodes.find(n => n.id === id); const o = by('o_p1'), l = by('o_p1_2');
    const el = document.getElementById('no_p1'), nb = el && el.querySelector('.nb'); const k = S.scale || 1;
    const e1 = { members: (o.m || []).length, h: el ? el.getBoundingClientRect().height / k : null, nbVisible: !!(nb && nb.getClientRects().length && getComputedStyle(nb).display !== 'none'), nh: nh(o), HH: CUR_HH, MH: CUR_MH, lH: nh(l), lRows: Math.ceil(l.m.length / _mcOf(l)), edit: !!(el && el.querySelector('.nact .nab')), plus: nb ? { h: parseFloat(getComputedStyle(nb, '::before').height), content: getComputedStyle(nb, '::before').content } : null };
    const rects = []; const P = CanvasRenderingContext2D.prototype, r0 = P.fillRect, tb = HTMLCanvasElement.prototype.toBlob;
    P.fillRect = function (x, y, w, h) { rects.push({ x, y, w, h, c: String(this.fillStyle) }); return r0.apply(this, arguments); }; HTMLCanvasElement.prototype.toBlob = function () {};
    try { exportPNG(); } finally { P.fillRect = r0; HTMLCanvasElement.prototype.toBlob = tb; }
    const card = rects.find(q => Math.abs(q.x - o.x) < 0.5 && Math.abs(q.y - o.y) < 0.5 && Math.abs(q.w - cardW(o)) < 0.5 && q.c === '#ffffff');
    const body = rects.find(q => Math.abs(q.x - o.x) < 0.5 && Math.abs(q.y - (o.y + CUR_HH)) < 0.5 && Math.abs(q.w - cardW(o)) < 0.5);
    OPT.rowMode = 'local'; autoLayout(); render(); const ks = S.conns.filter(c => c.f === 'o_p1').map(c => by(c.t)).filter(n => n && !n.aside && n.type !== 'side'); const want = o.y + Math.ceil((CUR_HH + 10 + OPT.rowGap) / 20) * 20; OPT.rowMode = 'depth'; autoLayout(); render();
    preparePrint(); const el2 = document.getElementById('no_p1'), nb2 = el2 && el2.querySelector('.nb'); const e5 = { nbDisp: nb2 ? getComputedStyle(nb2).display : null, h: el2 ? el2.offsetHeight : null, nh: nh(o), printing: document.body.classList.contains('printing'), plusDisp: nb2 ? getComputedStyle(nb2, '::before').display : null }; restorePrint(); e5.after = nh(o); e5.printingAfter = document.body.classList.contains('printing');
    return { e1, png: { cardH: card ? card.h : null, body: !!body }, e3: { ys: [...new Set(ks.map(n => n.y))], want }, e5 }; }, OWNER);
  out.info = r;
  if (r.e1.members !== 0) fail('fixture: o_p1 has members');
  if (r.e1.h == null || Math.abs(r.e1.h - (r.e1.HH + 10)) > 1) fail('E1: empty card box ' + r.e1.h + ' want ' + (r.e1.HH + 10));
  if (!r.e1.nbVisible) fail('E1: cap hidden on screen'); if (r.e1.nh !== r.e1.HH + 10) fail('E1: nh ' + r.e1.nh + ' want ' + (r.e1.HH + 10)); if (!r.e1.plus || Math.abs(r.e1.plus.h - 34) > 1 || r.e1.plus.content.indexOf('＋') < 0) fail('E1: (+) body overlay on screen ' + JSON.stringify(r.e1.plus));
  if (r.e1.lH !== r.e1.HH + r.e1.lRows * r.e1.MH) fail('E1: member card height ' + r.e1.lH);
  if (!r.e1.edit) fail('E4: no ✏ on the empty card');
  if (r.png.cardH == null || Math.abs(r.png.cardH - (r.e1.HH + 10)) > 0.5) fail('E2: PNG card height ' + r.png.cardH);
  if (!(r.e3.ys.length === 1 && Math.abs(r.e3.ys[0] - r.e3.want) < 0.5)) fail('E3: children y ' + r.e3.ys + ' want ' + r.e3.want);
  if (!r.e5 || !r.e5.printing) fail('E5: preparePrint did not set body.printing'); else { if (r.e5.nbDisp === 'none') fail('E5: cap hidden in print'); if (r.e5.plusDisp !== 'none') fail('E5: (+) body overlay still shown in print (' + r.e5.plusDisp + ')'); if (r.e5.h == null || Math.abs(r.e5.h - (r.e1.HH + 10)) > 1) fail('E5: print card height ' + r.e5.h + ' want ' + (r.e1.HH + 10)); if (r.e5.nh !== r.e1.HH + 10) fail('E5: nh during print ' + r.e5.nh); if (r.e5.after !== r.e1.HH + 10) fail('E5: nh after restore ' + r.e5.after); if (r.e5.printingAfter) fail('E5: body.printing left on'); }
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}