// Judge for ORGCHART-OPT (2026-10-19), written before the code. Substitute __PAGE__, __REF__.
// (P1) section titles (without ▾/▸) in order: 배치, 카드, 인원 수, 글꼴, 선·캔버스, 로고·색상, with data-sec layout..logo;
// (P2) each control id sits in its section (lists below);
// (P3) the set of id'd elements inside #optov and every one's attributes equal the reference;
// (P4) #opt-showcnt, #opt-cntpos, #opt-cntcol, #opt-cntcc sit in four different .opt-row; with every section open no
//      .opt-row overflows the panel and every .opt-lbl is a single line;
// (P5) fresh storage: layout/card/count open (controls visible), font/line/logo closed (controls hidden),
//      aria-expanded matches; clicking the 글꼴 title opens it, Enter on it closes it again, opening it once more
//      survives a reload; storage that throws still opens the panel with the defaults;
// (P6) driving opt-cg 60, opt-nw 260, opt-cntsz 12, opt-fsen 14, opt-cntcc exc gives the same OPT values as the reference;
// (E) no page errors.
async page => {
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  await page.setViewportSize({ width: 1400, height: 950 });
  const SECS = { layout: ['opt-orient', 'opt-rg', 'opt-wrap', 'opt-cg', 'opt-px', 'opt-py'], card: ['opt-hdrh', 'opt-rowh', 'opt-nw', 'opt-bw', 'opt-cr', 'opt-sha'],
    count: ['opt-showcnt', 'opt-cntpos', 'opt-cntcol', 'opt-cntcol-auto', 'opt-cntcc', 'opt-cntsz', 'opt-cntdx', 'opt-cntdy'],
    font: ['opt-fsen', 'opt-fsko', 'opt-fsmn', 'opt-fsmf', 'opt-fsmr', 'opt-fsma', 'opt-lhh', 'opt-lhc'],
    line: ['opt-sw', 'opt-dw', 'opt-line-colors', 'opt-canvas-colors'], logo: ['opt-logo-txt', 'opt-logo-sub', 'opt-logo-col', 'opt-logo-subcol', 'opt-ui-colors'] };
  const TITLES = ['배치', '카드', '인원 수', '글꼴', '선·캔버스', '로고·색상'], KEYS = ['layout', 'card', 'count', 'font', 'line', 'logo'];
  async function open(url, clear) { await page.goto(url); await page.waitForTimeout(400);
    await page.evaluate(c => { if (c) { try { localStorage.clear(); } catch (e) {} } ADMIN = true; applyRO(); openOptions(); }, clear); await page.waitForTimeout(150); }
  const ATTRS = () => { const r = {}; document.querySelectorAll('#optov [id]').forEach(e => { if (e.id.indexOf('opt-') !== 0) return; const a = {}; Array.prototype.forEach.call(e.attributes, x => { a[x.name] = x.value; }); r[e.id] = a; }); return r; };
  const DRIVE = () => { const set = (id, v, ev) => { const e = document.getElementById(id); if (!e) return; e.value = String(v); e.dispatchEvent(new Event(ev || 'input', { bubbles: true })); };
    set('opt-cg', 60); set('opt-nw', 260); set('opt-cntsz', 12); set('opt-fsen', 14); set('opt-cntcc', 'exc', 'change');
    return JSON.stringify({ cg: OPT.colGap, nw: NW, sz: OPT.cntSize, cc: OPT.cntCc, fs: OPT.fsEn !== undefined ? OPT.fsEn : getComputedStyle(document.documentElement).getPropertyValue('--fs-en').trim() }); };
  await open('__REF__', true); const refA = await page.evaluate(ATTRS); const refD = await page.evaluate(DRIVE);
  await open('__PAGE__', true); const curA = await page.evaluate(ATTRS);
  const ka = Object.keys(refA).sort(), kb = Object.keys(curA).sort();
  if (JSON.stringify(ka) !== JSON.stringify(kb)) fail('P3: id set differs: missing ' + ka.filter(k => !curA[k]).join(',') + ' new ' + kb.filter(k => !refA[k]).join(','));
  ka.forEach(k => { if (curA[k] && JSON.stringify(refA[k]) !== JSON.stringify(curA[k])) fail('P3: attributes of #' + k + ' changed'); });
  const st = await page.evaluate(([SECS, KEYS]) => { const r = {}; const secs = Array.prototype.slice.call(document.querySelectorAll('#optov .opt-sec[data-sec]'));
    r.titles = secs.map(s => { const t = s.querySelector('.opt-sec-title'); return t ? t.textContent.replace(/[▾▸]/g, '').trim() : ''; }); r.keys = secs.map(s => s.getAttribute('data-sec'));
    r.where = {}; Object.keys(SECS).forEach(k => SECS[k].forEach(id => { const e = document.getElementById(id); const s = e && e.closest('.opt-sec[data-sec]'); r.where[id] = s ? s.getAttribute('data-sec') : null; }));
    const vis = id => { const e = document.getElementById(id); return !!(e && e.getClientRects().length); };
    r.vis = {}; KEYS.forEach(k => { r.vis[k] = SECS[k].filter(id => document.getElementById(id) && !['opt-line-colors', 'opt-canvas-colors', 'opt-ui-colors'].includes(id)).map(vis); });
    r.aria = {}; secs.forEach(s => { const t = s.querySelector('.opt-sec-title'); r.aria[s.getAttribute('data-sec')] = t ? [t.getAttribute('role'), t.getAttribute('tabindex'), t.getAttribute('aria-expanded')] : null; });
    const rowOf = id => { const e = document.getElementById(id); return e ? e.closest('.opt-row') : null; }; r.rows = ['opt-showcnt', 'opt-cntpos', 'opt-cntcol', 'opt-cntcc'].map(rowOf); r.distinct = new Set(r.rows.filter(Boolean)).size; delete r.rows;
    return r; }, [SECS, KEYS]);
  out.info.titles = st.titles;
  if (JSON.stringify(st.titles) !== JSON.stringify(TITLES)) fail('P1: titles ' + JSON.stringify(st.titles));
  if (JSON.stringify(st.keys) !== JSON.stringify(KEYS)) fail('P1: data-sec ' + JSON.stringify(st.keys));
  Object.keys(SECS).forEach(k => SECS[k].forEach(id => { if (st.where[id] !== k) fail('P2: #' + id + ' in ' + st.where[id] + ', want ' + k); }));
  if (st.distinct !== 4) fail('P4: the four count controls share rows (' + st.distinct + ' distinct)');
  ['layout', 'card', 'count'].forEach(k => { if (!st.vis[k].length || st.vis[k].some(v => !v)) fail('P5: section ' + k + ' not open by default'); if (!st.aria[k] || st.aria[k][2] !== 'true') fail('P5: ' + k + ' aria ' + JSON.stringify(st.aria[k])); });
  ['font', 'line', 'logo'].forEach(k => { if (st.vis[k].some(v => v)) fail('P5: section ' + k + ' open by default'); if (!st.aria[k] || st.aria[k][0] !== 'button' || st.aria[k][1] !== '0' || st.aria[k][2] !== 'false') fail('P5: ' + k + ' title attrs ' + JSON.stringify(st.aria[k])); });
  // P4 overflow with all open
  const ov = await page.evaluate(() => { document.querySelectorAll('#optov .opt-sec[data-sec] .opt-sec-title[aria-expanded="false"]').forEach(t => t.click());
    const body = document.querySelector('#optov .opt-body') || document.getElementById('optov'); const bw = body.getBoundingClientRect(); const bad = [];
    document.querySelectorAll('#optov .opt-row').forEach(r => { const b = r.getBoundingClientRect(); if (b.width && (b.right > bw.right + 1 || r.scrollWidth > r.clientWidth + 1)) bad.push('overflow:' + (r.textContent || '').trim().slice(0, 12)); });
    document.querySelectorAll('#optov .opt-lbl').forEach(l => { const cs = getComputedStyle(l); const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3; const rects = l.getClientRects(); if (rects.length && l.getBoundingClientRect().height > lh * 1.6 && !l.querySelector('select,input')) bad.push('wrap:' + l.textContent.trim().slice(0, 12)); });
    return bad; });
  ov.forEach(b => fail('P4: ' + b));
  // P5 toggle + persistence
  await open('__PAGE__', true);
  const t1 = await page.evaluate(() => { const t = document.querySelector('#optov .opt-sec[data-sec="font"] .opt-sec-title'); if (!t) return null; t.click(); const a = !!document.getElementById('opt-fsen').getClientRects().length;
    t.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); const b = !!document.getElementById('opt-fsen').getClientRects().length; t.click(); return { a, b, aria: t.getAttribute('aria-expanded') }; });
  if (!t1) fail('P5: no font title'); else { if (!t1.a) fail('P5: click did not open 글꼴'); if (t1.b) fail('P5: Enter did not close 글꼴'); if (t1.aria !== 'true') fail('P5: aria after reopen ' + t1.aria); }
  await open('__PAGE__', false);
  const t2 = await page.evaluate(() => !!document.getElementById('opt-fsen').getClientRects().length);
  if (!t2) fail('P5: open 글꼴 state lost after reload');
  await page.goto('__PAGE__'); await page.waitForTimeout(300);
  const t3 = await page.evaluate(() => { try { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); } catch (e) {} let ok = true; try { ADMIN = true; applyRO(); openOptions(); } catch (e) { ok = String(e); }
    return { ok, card: !!document.getElementById('opt-nw').getClientRects().length }; });
  if (t3.ok !== true || !t3.card) fail('P5: blocked storage ' + JSON.stringify(t3));
  // P6
  await open('__PAGE__', true); const curD = await page.evaluate(DRIVE);
  if (curD !== refD) fail('P6: driven values ' + curD + ' vs reference ' + refD);
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}
