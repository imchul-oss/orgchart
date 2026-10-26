async page => {
  const AFTER = __OWNER20__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 40) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const r = await page.evaluate(async A => { try{localStorage.clear();}catch(e){} window.alert = () => {}; window.confirm = () => true;
    loadObject(JSON.parse(JSON.stringify(A)), false); switchSheet(1); render(); fitScreen(); await new Promise(r => setTimeout(r, 300));
    const cvs = document.getElementById('canvas'); const sc = () => { const m = /scale\(([\d.]+)\)/.exec(cvs.style.transform || ''); return m ? +m[1] : 1; };
    const emp = [...document.querySelectorAll('.nb')].find(b => !b.children.length && !b.textContent.trim()); const full = document.querySelector('.nd .nb .mr') ? document.querySelector('.nd .mr').closest('.nd') : null;
    const L1 = { before: emp ? getComputedStyle(emp, '::before').boxShadow : null, card: full ? getComputedStyle(full).boxShadow : null, opt: OPT.shadowA };
    const sw = sel => { const p = document.querySelector('#svgl ' + sel); return p ? parseFloat(getComputedStyle(p).strokeWidth) : null; };
    const L2 = { sc: sc(), solid: sw('path.cpath'), dash: sw('path.cpath-dash') };
    cvs.style.transform = 'scale(1)'; await new Promise(r => setTimeout(r, 100)); L2.one = sw('path.cpath'); L2.sc1 = sc();
    fitScreen(); await new Promise(r => setTimeout(r, 200));
    const lws = []; const P = CanvasRenderingContext2D.prototype, st = P.stroke, tb = HTMLCanvasElement.prototype.toBlob;
    P.stroke = function () { lws.push(this.lineWidth); return st.apply(this, arguments); }; HTMLCanvasElement.prototype.toBlob = function () {};
    try { exportPNG(); } finally { P.stroke = st; HTMLCanvasElement.prototype.toBlob = tb; }
    preparePrint(); const L4 = sw('path.cpath'); restorePrint();
    return { L1, L2, L3: { lws: [...new Set(lws.map(x => Math.round(x * 100) / 100))], opt: OPT.strokeW }, L4 }; }, AFTER);
  out.info = r; const J = JSON.stringify;
  if (!r.L1.before || !/0\.36\)/.test(r.L1.before)) fail('L1 overlay shadow ' + J(r.L1));
  if (!(r.L2.sc < 1)) fail('L2 no zoom-out on sheet 2 ' + r.L2.sc);
  if (!(r.L2.solid * r.L2.sc >= 1.29)) fail('L2 solid on screen ' + J(r.L2));
  if (r.L2.dash != null && !(r.L2.dash * r.L2.sc >= 1.29)) fail('L2 dash on screen ' + J(r.L2));
  if (Math.abs(r.L2.one - 1.8) > 0.01) fail('L2 at scale 1 ' + J(r.L2));
  if (!r.L3.lws.includes(1.8)) fail('L3 PNG line widths ' + J(r.L3));
  if (r.L3.lws.some(w => w > 1.8 && w < 3)) fail('L3 PNG thickened ' + J(r.L3));
  if (Math.abs(r.L4 - 1.8) > 0.01) fail('L4 print stroke ' + r.L4);
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}