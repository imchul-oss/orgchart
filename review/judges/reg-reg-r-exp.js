async page => {
  const DOC = __DOC__;
  const out = { errors: [], sheets: [], fails: [] };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => out.fails.push(m);
  async function load(admin) {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('__PAGE__'); await page.waitForTimeout(600);
    await page.evaluate(([d, admin]) => { _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(_hasPositions(S.nodes)); if (admin) ADMIN = true; }, [DOC, admin]);
    await page.waitForTimeout(300);
  }
  async function toSheet(i) { await page.evaluate(i => { switchSheet(i); }, i); await page.waitForTimeout(400); }
  const snap = () => page.evaluate(() => { const w = document.getElementById('wrap'); return JSON.stringify([S.scale, w.scrollLeft, w.scrollTop, S.nodes.map(n => [n.id, n.x, n.y])]); });
  const vis = sel => page.evaluate(sel => { const e = document.querySelector(sel); if (!e) return false; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0; }, sel);
  // (O) every card whose header centre is inside the viewport is the topmost element there (nothing covers it)
  const covered = () => page.evaluate(() => S.nodes.filter(n => {
    const el = document.getElementById('n' + n.id); const r = el.getBoundingClientRect();
    const hh = r.height * CUR_HH / nh(n); const x = r.left + r.width / 2, y = r.top + hh / 2;
    if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return false;
    const t = document.elementFromPoint(x, y); return !(t && el.contains(t));
  }).map(n => n.id));
  for (let i = 0; i < DOC.sheets.length; i++) {
    const r = { name: DOC.sheets[i].name }; const tag = r.name;
    await load(false); await toSheet(i);
    // (P) PNG
    await page.evaluate(() => { window.__blobs = []; const o = URL.createObjectURL.bind(URL); URL.createObjectURL = b => { window.__blobs.push(b); return o(b); }; });
    const expect = await page.evaluate(() => {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      S.nodes.forEach(n => { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x + NW); y1 = Math.max(y1, n.y + nh(n)); });
      { const pl = (typeof _statsBoxPlan === 'function') ? _statsBoxPlan({ x0, y0, x1, y1 }) : null; if (pl) { x0 -= pl.ext.left; x1 += pl.ext.right; y1 += pl.ext.bottom; } }  // statsbox: the PNG grows only when the table sits outside the chart
      const bw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--band-w')) || 12;
      const cards = S.nodes.map(n => {
        const el = document.getElementById('n' + n.id); const h = el.querySelector('.nh');
        const rows = Array.prototype.map.call(el.querySelectorAll('.mr'), (mr, k) => ({ y: n.y + CUR_HH + k * CUR_MH + Math.round(CUR_MH / 2), c: getComputedStyle(mr.querySelector('.mband')).backgroundColor }));
        const ne = el.querySelector('.nen');
        return { id: n.id, x: n.x, y: n.y, hdr: getComputedStyle(h).backgroundColor, txt: ne && (n.en || '').trim() ? getComputedStyle(ne).color : '', rows };
      });
      const segs = [];
      document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash').forEach(p => {
        const v = ((p.getAttribute('d') || '').match(/-?\d+(\.\d+)?/g) || []).map(Number);
        for (let k = 0; k + 3 < v.length; k += 2) if (Math.abs(v[k] - v[k + 2]) < 1 && Math.abs(v[k + 1] - v[k + 3]) >= 16 && !p.classList.contains('cpath-dash')) segs.push([v[k], (v[k + 1] + v[k + 3]) / 2]);
      });
      return { x0, y0, x1, y1, bw, cards, segs, sheet: SHEETS[CUR_SHEET].name };
    });
    const s0 = await snap();
    const has = await page.locator('#dl-png').count();
    if (!has) { fail(tag + ' P: no #dl-png'); }
    else {
      await page.evaluate(() => toggleDD('ddloc'));
      const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }).catch(() => null), page.locator('#dl-png').click({ timeout: 5000 })]);
      await page.waitForTimeout(500);
      if (!dl) fail(tag + ' P: no download event');
      else {
        const fn = dl.suggestedFilename(); r.file = fn;
        if (!/\.png$/i.test(fn) || fn.indexOf(expect.sheet) < 0) fail(tag + ' P: file name ' + fn);
      }
      const px = await page.evaluate(async E => {
        const b = window.__blobs.filter(x => x && x.type === 'image/png').pop(); if (!b) return { err: 'no png blob' };
        const bm = await createImageBitmap(b); const c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height;
        const g = c.getContext('2d'); g.drawImage(bm, 0, 0);
        const at = (x, y) => { const d = g.getImageData(Math.round((x - E.x0 + 40) * 2), Math.round((y - E.y0 + 40) * 2), 1, 1).data; return [d[0], d[1], d[2]]; };
        const rgb = s => (s.match(/\d+/g) || []).slice(0, 3).map(Number);
        const near = (a, b, t) => a.every((v, k) => Math.abs(v - b[k]) <= t);
        const bad = [];
        const corner = (() => { const d = g.getImageData(4, 4, 1, 1).data; return [d[0], d[1], d[2]]; })();
        if (!near(corner, [255, 255, 255], 3)) bad.push('margin not white ' + corner);
        E.cards.forEach(cd => {
          const h = at(cd.x + E.bw + 5, cd.y + 4); if (!near(h, rgb(cd.hdr), 12)) bad.push('hdr ' + cd.id + ' ' + h + ' vs ' + cd.hdr);
          if (cd.txt) {
            const tc = rgb(cd.txt), hb = rgb(cd.hdr);
            if (!near(tc, hb, 60)) {
              const X0 = Math.round((cd.x + E.bw + 8 - E.x0 + 40) * 2), Y0 = Math.round((cd.y + 2 - E.y0 + 40) * 2);
              const d = g.getImageData(X0, Y0, Math.round((NW - E.bw - 40) * 2), Math.round(CUR_HH * 2 / 2)).data;
              let hit = 0; for (let q = 0; q < d.length; q += 4) if (Math.abs(d[q] - tc[0]) <= 70 && Math.abs(d[q + 1] - tc[1]) <= 70 && Math.abs(d[q + 2] - tc[2]) <= 70) hit++;
              if (hit < 6) bad.push('title colour ' + cd.id + ' ' + hit + ' px near ' + cd.txt);
            }
          }
          cd.rows.forEach((rw, k) => { const p = at(cd.x + E.bw / 2, rw.y); if (!near(p, rgb(rw.c), 16)) bad.push('band ' + cd.id + '#' + k + ' ' + p + ' vs ' + rw.c); });
        });
        E.segs.forEach(s => { const p = at(s[0], s[1]); if (near(p, [255, 255, 255], 40)) bad.push('line at ' + s); });
        return { w: bm.width, h: bm.height, bad };
      }, expect);
      r.png = { w: px.w, h: px.h, bad: (px.bad || []).slice(0, 6), nbad: (px.bad || []).length, err: px.err };
      if (px.err) fail(tag + ' P: ' + px.err);
      else {
        const ew = (expect.x1 - expect.x0 + 80) * 2, eh = (expect.y1 - expect.y0 + 80) * 2;
        if (Math.abs(px.w - ew) > 6 || Math.abs(px.h - eh) > 6) fail(tag + ' P: image ' + px.w + 'x' + px.h + ' expected ' + ew + 'x' + eh);
        if (px.bad.length) fail(tag + ' P: ' + px.bad.length + ' pixel checks failed, e.g. ' + px.bad.slice(0, 3).join(' | '));
      }
      if ((await snap()) !== s0) fail(tag + ' P: page state changed by PNG export');
    }
    // (R) print
    const okPrint = await page.evaluate(() => typeof preparePrint === 'function');
    if (!okPrint) fail(tag + ' R: no preparePrint()');
    else {
      const s1 = await snap();
      await page.evaluate(() => preparePrint());
      await page.emulateMedia({ media: 'print' }); await page.setViewportSize({ width: 1123, height: 794 }); await page.waitForTimeout(400);
      const pr = await page.evaluate(() => {
        const hid = sel => { const e = document.querySelector(sel); if (!e) return true; const cs = getComputedStyle(e); return cs.display === 'none' || cs.visibility === 'hidden'; };
        const outside = S.nodes.filter(n => { const r = document.getElementById('n' + n.id).getBoundingClientRect(); return r.left < -1 || r.top < -1 || r.right > 1124 || r.bottom > 795; }).map(n => n.id);
        return { topbar: hid('#topbar'), stbar: hid('#stbar'), lint: hid('#lint-panel'), cmp: hid('#cmp-panel'), outside };
      });
      r.print = pr; pr.covered = await covered();
      if (pr.covered.length) fail(tag + ' R: ' + pr.covered.length + ' cards covered by another element in print, e.g. ' + pr.covered.slice(0, 3).join(','));
      if (!pr.topbar || !pr.stbar || !pr.lint || !pr.cmp) fail(tag + ' R: controls visible in print ' + JSON.stringify(pr));
      if (pr.outside.length) fail(tag + ' R: ' + pr.outside.length + ' cards outside the printed page');
      await page.emulateMedia({ media: 'screen' }); await page.setViewportSize({ width: 1600, height: 900 });
      await page.evaluate(() => window.dispatchEvent(new Event('afterprint'))); await page.waitForTimeout(400);
      if ((await snap()) !== s1) fail(tag + ' R: afterprint did not restore scale/scroll/positions');
    }
    // (Q) presentation, read-only then admin
    for (const admin of [false, true]) {
      await load(admin); await toSheet(i);
      const q = admin ? 'admin' : 'ro';
      if (!(await page.locator('#btn-present').count())) { fail(tag + ' Q: no #btn-present'); break; }
      await page.evaluate(() => { doZoomAbs(200); const w = document.getElementById('wrap'); w.scrollLeft = 300; w.scrollTop = 200; });
      const before = await snap();
      await page.locator('#btn-present').click({ timeout: 5000 }); await page.waitForTimeout(500);
      if (await vis('#topbar')) fail(tag + ' Q ' + q + ': top bar still visible');
      if (await vis('#stbar')) fail(tag + ' Q ' + q + ': stats bar still visible');
      if (!(await vis('#present-exit'))) fail(tag + ' Q ' + q + ': no visible #present-exit');
      const fit = await page.evaluate(() => { const w = document.getElementById('wrap').getBoundingClientRect(); const top = S.nodes.find(n => n.type === 'top') || S.nodes[0]; const r = document.getElementById('n' + top.id).getBoundingClientRect(); return r.left >= w.left && r.right <= w.right && r.top >= w.top && r.bottom <= w.bottom; });
      if (!fit) fail(tag + ' Q ' + q + ': top card not in view after entering presentation');
      const cv = await covered(); if (cv.length) fail(tag + ' Q ' + q + ': ' + cv.length + ' cards covered by another element in presentation, e.g. ' + cv.slice(0, 3).join(','));
      if (admin) {
        const id = await page.evaluate(() => S.nodes[S.nodes.length - 1].id);
        const p0 = await page.evaluate(id => { const n = S.nodes.find(x => x.id === id); return [n.x, n.y]; }, id);
        const bb = await page.locator('#n' + id).boundingBox();
        if (bb) { await page.mouse.move(bb.x + bb.width / 2, bb.y + 6); await page.mouse.down(); await page.mouse.move(bb.x + bb.width / 2 + 120, bb.y + 90, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(300); }
        const p1 = await page.evaluate(id => { const n = S.nodes.find(x => x.id === id); return [n.x, n.y]; }, id);
        if (JSON.stringify(p0) !== JSON.stringify(p1)) fail(tag + ' Q: a card moved by dragging in presentation');
        await page.locator('#present-exit').click({ timeout: 5000 });
      } else {
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(500);
      if (!(await vis('#topbar'))) fail(tag + ' Q ' + q + ': top bar not restored');
      if ((await snap()) !== before) fail(tag + ' Q ' + q + ': scale/scroll/positions not restored on exit');
    }
    await page.screenshot({ path: 'D:/claude/tmp/prep/orgchart-aside/reg-exp' + i + '.png' });
    out.sheets.push(r);
  }
  if (out.errors.length) fail('E: page errors ' + out.errors.slice(0, 3).join(' | '));
  out.RESULT = out.fails.length ? 'RED' : 'GREEN';
  return out;
}