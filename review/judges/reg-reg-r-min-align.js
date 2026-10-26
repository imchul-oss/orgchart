async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => out.fails.push(m);
  await page.goto('__PAGE__'); await page.waitForTimeout(600);
  await page.evaluate(d => { _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(_hasPositions(S.nodes)); }, DOC);
  await page.waitForTimeout(400);

  // (C) status labels in the compare list
  const plan = await page.evaluate(() => {
    for (const nd of S.nodes) for (const m of (nd.m || [])) if (m.s === 'active' && m.n && m.n.trim()) return { id: nd.id, n: m.n.trim() };
    return null;
  });
  if (!plan) fail('C: no active member to plant');
  else {
    const before = await page.evaluate(p => {
      const d = JSON.parse(JSON.stringify(_fileData()));
      const sh = d.sheets ? d.sheets[CUR_SHEET] : d;
      for (const nd of sh.nodes) if (nd.id === p.id) for (const m of nd.m) if ((m.n || '').trim() === p.n) { m.s = 'onleave'; return JSON.stringify(d); }
      return JSON.stringify(d);
    }, plan);
    await page.evaluate(([text]) => {
      const inp = document.getElementById('cmp-file'); const dt = new DataTransfer();
      dt.items.add(new File([text], 'before.json', { type: 'application/json' }));
      inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true }));
    }, [before]);
    await page.waitForTimeout(700);
    const r = await page.evaluate(p => {
      const items = Array.prototype.map.call(document.querySelectorAll('.cmp-item[data-kind="change"]'), e => e.textContent);
      let title = null;
      document.querySelectorAll('#n' + p.id + ' .mr').forEach(row => { const mn = row.querySelector('.mn'); if (mn && mn.textContent.trim() === p.n && row.getAttribute('data-cmp') === 'changed') title = row.getAttribute('title'); });
      return { items, title };
    }, plan);
    const it = r.items.find(t => t.indexOf(plan.n) >= 0);
    if (!it) fail('C: no change item for the planted member');
    else {
      if (!(it.indexOf('휴직') >= 0 && it.indexOf('재직') >= 0)) fail('C: change item lacks the labels 휴직/재직');
      if (/onleave|active/.test(it)) fail('C: change item shows a raw status key');
    }
    if (!r.title) fail('C: changed row has no title');
    else {
      if (!(r.title.indexOf('휴직') >= 0 && r.title.indexOf('재직') >= 0)) fail('C: row title lacks the labels');
      if (/onleave|active/.test(r.title)) fail('C: row title shows a raw status key');
    }
    await page.evaluate(() => { const b = document.getElementById('cmp-exit'); if (b) b.click(); });
    await page.waitForTimeout(300);
  }

  // (P) PNG text fits its card
  const LONGN = 'Nguyen Thi Thanh Huong Phuong Anh Long';
  const LONGE = 'Extraordinarily Long Organization Name For Testing';
  const setup = await page.evaluate(([ln, le]) => {
    const cards = S.nodes.filter(n => (n.m || []).length >= 2);
    const a = cards[0], b = cards[1] || cards[0];
    a.m[0].n = ln; a.m[0].r = '뗘쪄';
    b.en = le;
    const shortM = (cards[2] || b).m.find(m => (m.n || '').length <= 4 && m.n !== ln);
    render();
    return { aid: a.id, bid: b.id, shortN: shortM ? shortM.n : null };
  }, [LONGN, LONGE]);
  const rec = await page.evaluate(async () => {
    const calls = [];
    const P = CanvasRenderingContext2D.prototype; const orig = P.fillText;
    P.fillText = function (t, x, y, mw) { const _w = this.measureText(String(t)).width; const _al = this.textAlign; const _m = this.getTransform(); calls.push({ t: String(t), x: (_al === 'right' || _al === 'end') ? x - _w : (_al === 'center' ? x - _w / 2 : x), y, w: _w, f: this.font, te: _m.e, tf: _m.f }); return orig.apply(this, arguments); };
    const oc = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () {};
    try { exportPNG(); } catch (e) { calls.push({ err: String(e) }); }
    await new Promise(r => setTimeout(r, 1500));
    P.fillText = orig; HTMLAnchorElement.prototype.click = oc;
    const boxes = S.nodes.map(n => ({ id: n.id, x: n.x, y: n.y, h: nh(n) }));
    let sb = null; if (typeof _statsBoxPlan === 'function') { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; S.nodes.forEach(n => { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x + cardW(n)); y1 = Math.max(y1, n.y + nh(n)); }); const pl = _statsBoxPlan({ x0, y0, x1, y1 }); if (pl) sb = { x: pl.x, y: pl.y, w: pl.w, h: pl.h }; }
    return { calls, boxes, NW, sb };
  });
  const errc = rec.calls.find(c => c.err); if (errc) fail('P: exportPNG threw ' + errc.err);
  const calls0 = rec.calls.filter(c => !c.err); const baseT = calls0.length ? calls0[0] : null;
  const calls = calls0.filter(c => !baseT || (c.te === baseT.te && c.tf === baseT.tf));  // statsbox: the 인원 현황 table is drawn in a translated context (its own box); card texts share the base transform
  if (calls.length < 20) fail('P: only ' + calls.length + ' fillText calls');
  const px = f => { const m = /(\d+(\.\d+)?)px/.exec(f || ''); return m ? parseFloat(m[1]) : 0; };
  let over = [];
  calls.forEach(c => {
    const b = rec.boxes.find(b => c.x >= b.x && c.x < b.x + rec.NW && c.y >= b.y && c.y < b.y + b.h);
    if (!b) { if (rec.sb && c.x >= rec.sb.x - 1 && c.x <= rec.sb.x + rec.sb.w + 1 && c.y >= rec.sb.y - 1 && c.y <= rec.sb.y + rec.sb.h + 1) return; over.push('nocard:len' + c.t.length); return; }  // statsbox: texts inside the planned 인원 현황 box
    if (c.x + c.w > b.x + rec.NW - 2 + 0.5) over.push(b.id + ':len' + c.t.length + ':' + Math.round(c.x + c.w - b.x - rec.NW));
  });
  out.info.overCount = over.length;
  if (over.length) fail('P: ' + over.length + ' texts reach past their card, e.g. ' + over.slice(0, 3).join(' | '));
  const nameCall = calls.find(c => c.t.indexOf(LONGN.slice(0, 8)) === 0);
  if (!nameCall) fail('P: long member name not drawn from its start');
  else {
    if (!(nameCall.t.indexOf(LONGN) === 0 || /…/.test(nameCall.t))) fail('P: long name cut without an ellipsis');
    if (px(nameCall.f) < 11 * 0.7 - 0.01) fail('P: long name font below 70% (' + nameCall.f + ')');  // fidelity (10-20): base 11px
  }
  const enCall = calls.find(c => c.t.toUpperCase().indexOf(LONGE.slice(0, 8).toUpperCase()) === 0);
  if (!enCall) fail('P: long team name not drawn from its start');
  else if (!(enCall.t.toUpperCase().indexOf(LONGE.toUpperCase()) === 0 || /…/.test(enCall.t))) fail('P: long team name cut without an ellipsis');
  if (setup.shortN) {
    const sc = calls.find(c => c.t.indexOf(setup.shortN) === 0);
    if (!sc) fail('P: short name not drawn');
    else if (px(sc.f) !== 11 && px(sc.f) !== 12) fail('P: short name font changed (' + sc.f + ')');  // fidelity (10-20): the name is drawn at the screen size (fsMn 11 in the fixtures)
  } else fail('P: no short name found to check');

  if (out.errors.length) fail('E: page errors ' + out.errors.slice(0, 2).join(' | '));
  out.verdict = out.fails.length ? 'RED' : 'GREEN';
  return JSON.stringify(out);
}