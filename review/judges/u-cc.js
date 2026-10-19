// Judge for ORGCHART-CC (2026-10-19), written before the code. Substitute __DOC__, __PAGE__, __REF__.
// (K1) OPT.cntCc sep/inc/exc pill texts on a test card with one concurrent member; a card whose only member is
//      concurrent shows "0명 +1겸" in sep and no pill in exc; a concurrent member in an excludeTotal status never counts;
// (K2) the list view .tv-cnt of the test card equals its pill text in each mode;
// (K3) the concurrent row carries .mcc "겸" inside .mn-row, no other row does, and .mr2 stays inside its row;
// (K4) stats panel: adding a concurrent copy of an existing person leaves the summary total and the collapsed title unchanged;
// (K5) admin openEdit: each row has input[data-f=cc] reflecting m.cc; toggling and saveModal writes cc:true / no key;
//      addMRow rows start unchecked;
// (K6) _sanitizeSheet keeps cc only when it is exactly true;
// (K7) exportCSV header ends ",status,concurrent", the concurrent row ends ",1"; importCSV of that text restores cc:true;
// (K8) #opt-cntcc has sep,inc,exc; change event sets OPT.cntCc; _applyOptObj maps an unknown value to 'sep';
// (K9) sliders #opt-cntsz/#opt-cntdx/#opt-cntdy at 12/10/5: pill font 12px, height 15, padding 8, placement per the
//      brief for tr/mr/br/badge in read-only and admin (1 px); _applyOptObj clamps 99->14, -99->-30, 'x'->0, 9.5->9;
// (K10) exportPNG at 12/10/5 tr read-only: pill text drawn in a 12px font at the brief's place relative to the first
//      member's name (2 px), right-aligned; the concurrent member's line starts with "name (겸)";
// (K11) defaults, no cc: every pill rect and text (read-only and admin), list view counts, stats total, every exportPNG
//      fillText/fillRect, card positions and connector paths equal the reference, on both sheets;
// (E) no page errors.
async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 80) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  async function load(url) {
    await page.goto(url); await page.waitForTimeout(500);
    await page.evaluate(d => { try { localStorage.clear(); } catch (e) {} const doc = JSON.parse(JSON.stringify(d));
      _adoptData(doc, false); _finishLoad(true); switchSheet(0); OPT.wrapN = 0; OPT.orient = 'down'; autoLayout(); render(); }, DOC);
    await page.waitForTimeout(300);
  }
  const HELP = () => {
    window.__k = el => el.getBoundingClientRect().width / el.offsetWidth;
    window.__pill = id => { const el = document.getElementById('n' + id); if (!el) return null; const p = el.querySelector(':scope > .ncnt'); if (!p) return { none: true };
      const a = el.getBoundingClientRect(), b = p.getBoundingClientRect(), k = __k(el), cs = getComputedStyle(p);
      return { t: p.textContent.trim(), top: (b.top - a.top) / k, right: (a.right - b.right) / k, w: b.width / k, h: b.height / k,
        cx: (b.left + b.width / 2 - a.left) / k, cy: (b.top + b.height / 2 - a.top) / k, cw: a.width / k, fs: cs.fontSize, pl: cs.paddingLeft }; };
    window.__allPills = () => S.nodes.map(n => { const r = __pill(n.id); return r ? n.id + '|' + (r.none ? '-' : [r.t, r.top, r.right, r.w, r.h].map(v => typeof v === 'number' ? v.toFixed(1) : v).join(',')) : n.id + '|hidden'; }).sort();
    window.__tv = () => { try { tvOpen(); } catch (e) {} tvBuild(); const r = {}; document.querySelectorAll('#treeview .tv-row').forEach(x => { const c = x.querySelector('.tv-cnt'); r[x.getAttribute('data-id')] = c ? c.textContent.trim() : ''; }); return r; };
    window.__stat = () => { try { _statTab = 'summary'; } catch (e) {} updateStatsPanel(); const t = document.querySelector('#statsfl-body .sfl-total-num'); const fl = document.getElementById('statsfl');
      let title = ''; if (fl) { const had = fl.classList.contains('collapsed'); fl.classList.add('collapsed'); updateStatsPanel(); title = (document.getElementById('statsfl-title') || {}).textContent || ''; if (!had) fl.classList.remove('collapsed'); updateStatsPanel(); }
      return { total: t ? t.textContent.trim() : null, title }; };
    window.__png = () => { const P = CanvasRenderingContext2D.prototype, oT = P.fillText, oR = P.fillRect, oc = HTMLCanvasElement.prototype.toBlob, T = [], R = [];
      P.fillText = function (s, x, y) { const m = this.getTransform(); T.push({ s: String(s), x: (m.a * x + m.e), y: (m.d * y + m.f), a: m.a, font: this.font, al: this.textAlign, bl: this.textBaseline }); return oT.apply(this, arguments); };
      P.fillRect = function (x, y, w, h) { const m = this.getTransform(); R.push([String(this.fillStyle), (m.a * x + m.e).toFixed(1), (m.d * y + m.f).toFixed(1), (m.a * w).toFixed(1), (m.d * h).toFixed(1)].join(',')); return oR.apply(this, arguments); };
      HTMLCanvasElement.prototype.toBlob = function () {};
      try { exportPNG(); } finally { P.fillText = oT; P.fillRect = oR; HTMLCanvasElement.prototype.toBlob = oc; }
      return { T, R }; };
    window.__setCtl = (id, v, ev) => { const e = document.getElementById(id); if (!e) return false; e.value = String(v); e.dispatchEvent(new Event(ev || 'input', { bubbles: true })); return true; };
  };
  const SNAP = () => ({ pos: S.nodes.map(n => n.id + ':' + n.x + ',' + n.y).sort(),
    paths: Array.prototype.map.call(document.querySelectorAll('#svgl path.cpath, #svgl path.cpath-dash'), p => p.getAttribute('class') + '|' + p.getAttribute('d').replace(/\s+/g, ' ').trim()).sort() });
  const DEFSNAP = async () => { const r = {}; const n = await page.evaluate(() => SHEETS.length);
    for (let s = 0; s < n; s++) { r['s' + s] = await page.evaluate(([s, sn]) => { switchSheet(s); OPT.wrapN = 0; OPT.orient = 'down'; autoLayout();
        ADMIN = false; applyRO(); render(); const ro = __allPills(); ADMIN = true; applyRO(); render(); const ad = __allPills(); ADMIN = false; applyRO(); render();
        const png = __png(); return { lay: eval('(' + sn + ')')(), ro, ad, tv: __tv(), st: __stat(), T: png.T.map(t => [t.s, t.x.toFixed(1), t.y.toFixed(1), t.font, t.al].join('|')), R: png.R }; }, [s, SNAP.toString()]); }
    return r; };
  // K11 reference
  await load('__REF__'); await page.evaluate(HELP);
  const ref = await DEFSNAP();
  await load('__PAGE__'); await page.evaluate(HELP);
  const cur = await DEFSNAP();
  for (const s of Object.keys(ref)) for (const k of ['lay', 'ro', 'ad', 'tv', 'st', 'T', 'R']) {
    const a = JSON.stringify(ref[s][k]), b = JSON.stringify(cur[s][k]);
    if (a !== b) { let d = ''; if (Array.isArray(ref[s][k])) { const A = ref[s][k], B = cur[s][k] || []; for (let i = 0; i < Math.max(A.length, B.length); i++) if (JSON.stringify(A[i]) !== JSON.stringify(B[i])) { d = ' first diff #' + i + ' ref=' + JSON.stringify(A[i]).slice(0, 90) + ' cur=' + JSON.stringify(B[i]).slice(0, 90); break; } }
      fail('K11: default output differs ' + s + ' ' + k + d); }
  }
  // test card
  const T = await page.evaluate(() => { switchSheet(0); OPT.orient = 'down'; autoLayout(); ADMIN = false; applyRO(); render(); const H = collHidden();
    const c = S.nodes.filter(n => !H.has(n.id) && (n.m || []).length >= 4 && new Set(n.m.map(m => m.n)).size === n.m.length && (n.m || []).every(m => m.s === 'active'));
    const t = c[0], o = c.find(n => n.id !== t.id && !(n.m || []).some(m => t.m.some(x => x.n === m.n)));
    return { id: t.id, len: t.m.length, other: o.id }; });
  out.info.T = { len: T.len };
  // K1 + K2 + K3
  const k1 = await page.evaluate(T => { const r = {}; const t = S.nodes.find(n => n.id === T.id); t.m[1].cc = true;
    for (const md of ['sep', 'inc', 'exc']) { OPT.cntCc = md; render(); const p = __pill(T.id); r[md] = p && !p.none ? p.t : '(none)'; r['tv_' + md] = __tv()[T.id]; }
    OPT.cntCc = 'sep'; render(); const el = document.getElementById('n' + T.id); const rows = el.querySelectorAll('.mr');
    r.tags = Array.prototype.map.call(rows, x => { const g = x.querySelector('.mcc'); return g ? (g.closest('.mn-row') ? g.textContent.trim() : 'outside') : ''; });
    const rr = rows[1].getBoundingClientRect(), r2 = rows[1].querySelector('.mr2'); r.mr2in = r2 ? r2.getBoundingClientRect().right <= rr.right + 1 : true;
    const o = S.nodes.find(n => n.id === T.other); const keep = o.m; o.m = [Object.assign({}, keep[0], { cc: true })];
    OPT.cntCc = 'sep'; render(); { const p = __pill(T.other); r.only_sep = p && !p.none ? p.t : '(none)'; }
    OPT.cntCc = 'exc'; render(); { const p = __pill(T.other); r.only_exc = p && !p.none ? p.t : '(none)'; }
    const sg = JSON.parse(JSON.stringify(OPT.statsGroups)); OPT.statsGroups.forEach(g => { if (g.statuses.includes('onleave')) g.excludeTotal = true; });
    o.m = [Object.assign({}, keep[0], { cc: true, s: 'onleave' })]; OPT.cntCc = 'sep'; render(); { const p = __pill(T.other); r.ex_sep = p && !p.none ? p.t : '(none)'; }
    OPT.statsGroups = sg; o.m = keep; delete t.m[1].cc; OPT.cntCc = 'sep'; render(); return r; }, T);
  out.info.K1 = k1;
  const L = T.len;
  if (k1.sep !== (L - 1) + '명 +1겸') fail('K1: sep pill ' + k1.sep + ' want ' + (L - 1) + '명 +1겸');
  if (k1.inc !== L + '명') fail('K1: inc pill ' + k1.inc);
  if (k1.exc !== (L - 1) + '명') fail('K1: exc pill ' + k1.exc);
  if (k1.only_sep !== '0명 +1겸') fail('K1: only-concurrent card sep ' + k1.only_sep);
  if (k1.only_exc !== '(none)') fail('K1: only-concurrent card exc shows ' + k1.only_exc);
  if (k1.ex_sep !== '(none)') fail('K1: excluded-status concurrent member counted: ' + k1.ex_sep);
  for (const md of ['sep', 'inc', 'exc']) if (k1['tv_' + md] !== k1[md]) fail('K2: list view ' + md + ' ' + k1['tv_' + md] + ' vs pill ' + k1[md]);
  /* CC2 (owner 2026-10-19): the name-side tag was replaced by the job line '팀장(겸)', judged in orgchart-cc2/VERIFY_cc2.js; K3 now only requires no tag on non-concurrent rows */
  if (k1.tags.some((g, i) => i !== 1 && g)) fail('K3: tag on a non-concurrent row');
  if (!k1.mr2in) fail('K3: title pushed out of the row');
  // K4
  const k4 = await page.evaluate(T => { const a = __stat(); const t = S.nodes.find(n => n.id === T.id), o = S.nodes.find(n => n.id === T.other);
    o.m.push(Object.assign({}, t.m[0], { cc: true })); render(); const b = __stat(); o.m.pop(); render(); return { a, b }; }, T);
  if (k4.a.total !== k4.b.total) fail('K4: stats total ' + k4.a.total + ' -> ' + k4.b.total);
  if (k4.a.title !== k4.b.title) fail('K4: stats title ' + k4.a.title + ' -> ' + k4.b.title);
  // K5
  const k5 = await page.evaluate(T => { const r = {}; ADMIN = true; applyRO(); render(); const t = S.nodes.find(n => n.id === T.id); t.m[1].cc = true;
    openEdit(T.id); const boxes = document.querySelectorAll('#mlist .mer input[data-f="cc"]'); r.n = boxes.length; r.st = Array.prototype.map.call(boxes, b => b.checked);
    if (boxes.length < 3) { closeModal(); delete t.m[1].cc; ADMIN = false; applyRO(); render(); return r; }
    boxes[1].checked = false; boxes[2].checked = true; saveModal(); const t2 = S.nodes.find(n => n.id === T.id); r.k1 = 'cc' in t2.m[1]; r.v2 = t2.m[2].cc;
    openEdit(T.id); addMRow(); const nb = document.querySelectorAll('#mlist .mer input[data-f="cc"]'); r.newChecked = nb.length ? nb[nb.length - 1].checked : 'none'; closeModal();
    delete t2.m[2].cc; ADMIN = false; applyRO(); render(); return r; }, T);
  out.info.K5 = k5;
  if (k5.n !== L) fail('K5: ' + k5.n + ' cc checkboxes for ' + L + ' rows');
  else if (k5.st.some((c, i) => c !== (i === 1))) fail('K5: checkbox states ' + k5.st);
  if (k5.k1) fail('K5: unchecked row kept a cc key'); if (k5.v2 !== true) fail('K5: checked row cc=' + k5.v2);
  if (k5.newChecked !== false) fail('K5: addMRow row checked=' + k5.newChecked);
  // K6
  const k6 = await page.evaluate(() => { const s = _sanitizeSheet({ name: 'x', nodes: [{ id: 'n901', type: 'l2', en: 'A', ko: 'a', m: [{ n: 'a', cc: 'yes' }, { n: 'b', cc: true }, { n: 'c', cc: false }, { n: 'd', cc: 1 }] }], conns: [] });
    return s.nodes[0].m.map(m => ('cc' in m) ? m.cc : 'absent'); });
  if (JSON.stringify(k6) !== JSON.stringify(['absent', true, 'absent', 'absent'])) fail('K6: sanitize ' + JSON.stringify(k6));
  // K7
  const k7 = await page.evaluate(async T => { const r = {}; ADMIN = true; applyRO(); const t = S.nodes.find(n => n.id === T.id); t.m[1].cc = true; const nm = t.m[1].n;
    let cap = null; const od = window.dl; window.dl = d => { cap = d; }; try { exportCSV(); } finally { window.dl = od; }
    if (!cap) return { none: true }; const lines = cap.replace(/\r/g, '').split('\n'); r.hdr = lines.find(l => l.startsWith('node_id,')) || '';
    r.row = lines.find(l => l.startsWith(T.id + ',') && l.indexOf(nm) >= 0) || ''; r.plain = lines.find(l => l.startsWith(T.id + ',') && l.indexOf(t.m[0].n) >= 0) || '';
    delete t.m[1].cc; const inp = { files: [new File([cap], 'x.csv', { type: 'text/csv' })], value: 'x' };
    const oc = window.confirm, oa = window.alert; window.confirm = () => true; window.alert = m => { r.alert = String(m).slice(0, 60); }; try { importCSV(inp); } catch (e) { r.err = String(e); } await new Promise(s => setTimeout(s, 800)); window.confirm = oc; window.alert = oa;
    const t3 = S.nodes.find(n => n.id === T.id); r.back = t3 ? (t3.m.find(m => m.n === nm) || {}).cc : 'no node'; r.back0 = t3 ? ('cc' in (t3.m.find(m => m.n === t.m[0].n) || {})) : 'no node';
    ADMIN = false; applyRO(); return r; }, T);
  out.info.K7 = { hdr: k7.hdr, back: k7.back };
  if (k7.none) fail('K7: exportCSV produced nothing');
  else { if (!/,status,concurrent$/.test(k7.hdr)) fail('K7: header ' + k7.hdr); if (!/,1$/.test(k7.row)) fail('K7: concurrent row does not end ,1');
    if (/,1$/.test(k7.plain)) fail('K7: plain row ends ,1'); if (k7.back !== true) fail('K7: import lost cc (' + k7.back + ')'); if (k7.back0) fail('K7: import put cc on a plain member'); }
  // K8, K9, K10 on a fresh load
  await load('__PAGE__'); await page.evaluate(HELP);
  const k8 = await page.evaluate(T => { const r = {}; const sel = document.getElementById('opt-cntcc'); if (!sel) return { none: true }; r.vals = Array.prototype.map.call(sel.options, o => o.value).join(',');
    S.nodes.find(n => n.id === T.id).m[1].cc = true; __setCtl('opt-cntcc', 'inc', 'change'); r.opt = OPT.cntCc; const p = __pill(T.id); r.pill = p && !p.none ? p.t : '';
    const o = JSON.parse(JSON.stringify(OPT)); o.cntCc = 'bogus'; _applyOptObj(o); r.bad = OPT.cntCc;
    const o2 = JSON.parse(JSON.stringify(OPT)); Object.assign(o2, { cntSize: 99, cntDx: -99, cntDy: 'x' }); _applyOptObj(o2); r.cl1 = [OPT.cntSize, OPT.cntDx, OPT.cntDy];
    const o3 = JSON.parse(JSON.stringify(OPT)); Object.assign(o3, { cntSize: 9.5, cntDx: 70, cntDy: -40 }); _applyOptObj(o3); r.cl2 = [OPT.cntSize, OPT.cntDx, OPT.cntDy];
    const o4 = JSON.parse(JSON.stringify(OPT)); Object.assign(o4, { cntSize: 9, cntDx: 0, cntDy: 0, cntCc: 'sep' }); _applyOptObj(o4); delete S.nodes.find(n => n.id === T.id).m[1].cc; render(); return r; }, T);
  out.info.K8 = k8;
  if (k8.none) fail('K8: no #opt-cntcc');
  else { if (k8.vals !== 'sep,inc,exc') fail('K8: options ' + k8.vals); if (k8.opt !== 'inc') fail('K8: change did not set OPT.cntCc');
    if (k8.pill !== L + '명') fail('K8: pill after inc ' + k8.pill); if (k8.bad !== 'sep') fail('K8: unknown value -> ' + k8.bad);
    if (JSON.stringify(k8.cl1) !== '[14,-30,0]') fail('K9: clamp 99/-99/x -> ' + JSON.stringify(k8.cl1));
    if (JSON.stringify(k8.cl2) !== '[9,60,-30]') fail('K9: clamp 9.5/70/-40 -> ' + JSON.stringify(k8.cl2)); }
  const k9 = await page.evaluate(T => { const r = {}; const ok = ['opt-cntsz', 'opt-cntdx', 'opt-cntdy'].map((id, i) => __setCtl(id, [12, 10, 5][i]));
    r.ctl = ok; r.opt = [OPT.cntSize, OPT.cntDx, OPT.cntDy]; const HH = CUR_HH;
    for (const adm of [false, true]) { ADMIN = adm; applyRO();
      for (const pos of ['tr', 'mr', 'br', 'badge']) { OPT.cntPos = pos; render(); r[(adm ? 'ad_' : 'ro_') + pos] = __pill(T.id); } }
    ADMIN = false; applyRO(); OPT.cntPos = 'tr'; render(); r.HH = HH; return r; }, T);
  out.info.K9 = { ctl: k9.ctl, opt: k9.opt };
  if (k9.ctl.some(x => !x)) fail('K9: missing slider ' + k9.ctl);
  if (JSON.stringify(k9.opt) !== '[12,10,5]') fail('K9: sliders set ' + JSON.stringify(k9.opt));
  for (const adm of [false, true]) { const R = adm ? 36 : 7, tag = adm ? 'admin' : 'ro';
    for (const pos of ['tr', 'mr', 'br', 'badge']) { const p = k9[(adm ? 'ad_' : 'ro_') + pos]; if (!p || p.none) { fail('K9: no pill ' + tag + ' ' + pos); continue; }
      if (p.fs !== '12px') fail('K9: font ' + p.fs + ' ' + tag + ' ' + pos); if (Math.abs(p.h - 15) > 1) fail('K9: height ' + p.h.toFixed(1) + ' ' + tag + ' ' + pos);
      if (p.pl !== '8px') fail('K9: padding ' + p.pl + ' ' + tag + ' ' + pos);
      if (pos === 'badge') { if (Math.abs(p.cx - (p.cw - 10)) > 1 || Math.abs(p.cy - 5) > 1) fail('K9: badge centre ' + p.cx.toFixed(1) + ',' + p.cy.toFixed(1) + ' want ' + (p.cw - 10) + ',5 ' + tag); continue; }
      const top = pos === 'tr' ? 8 : pos === 'mr' ? k9.HH / 2 - 7.5 + 5 : k9.HH - 15 - 4 + 5;
      if (Math.abs(p.top - top) > 1) fail('K9: ' + tag + ' ' + pos + ' top ' + p.top.toFixed(1) + ' want ' + top);
      if (Math.abs(p.right - (R + 10)) > 1) fail('K9: ' + tag + ' ' + pos + ' right gap ' + p.right.toFixed(1) + ' want ' + (R + 10)); } }
  const k10 = await page.evaluate(T => { const t = S.nodes.find(n => n.id === T.id); t.m[1].cc = true; OPT.cntCc = 'sep'; OPT.cntPos = 'tr'; ADMIN = false; applyRO(); render();
    const lbl = (typeof cntLabel === 'function') ? cntLabel(t) : ''; const png = __png(); const pill = png.T.find(x => x.s === lbl);
    const near = (q, list) => list.sort((u, v) => Math.hypot(u.x - q.x, u.y - q.y) - Math.hypot(v.x - q.x, v.y - q.y))[0];
    const name0 = pill ? near(pill, png.T.filter(x => (x.s === t.m[0].n || x.s.startsWith(t.m[0].n + '  ')) && x.font.indexOf('bold') >= 0)) : null; const cc = png.T.find(x => x.s.startsWith(t.m[1].n));
    let bw = parseFloat(getComputedStyle(document.getElementById('n' + t.id)).getPropertyValue('--band-w')); if (!isFinite(bw)) bw = 12;
    const r = { lbl, pill, name0: name0 ? { x: name0.x, y: name0.y, a: name0.a } : null, ccs: cc ? cc.s : null, CW: cardW(t), HH: CUR_HH, MH: CUR_MH, bw };
    delete t.m[1].cc; render(); return r; }, T);
  if (!k10.pill) fail('K10: pill text "' + k10.lbl + '" not drawn in the PNG');
  else if (!k10.name0) fail('K10: first member name not found in the PNG');
  else { const a = k10.name0.a, p = k10.pill; if (!/(^|\s)12px/.test(p.font)) fail('K10: pill font ' + p.font); if (p.al !== 'right') fail('K10: pill textAlign ' + p.al);
    const wantDx = (k10.CW - 7 - 10 - 8) - (k10.bw + 8), wantDy = (8 + 7.5) - (k10.HH + k10.MH * 0.33);
    const gx = (p.x - k10.name0.x) / a, gy = (p.y - k10.name0.y) / a; out.info.K10 = { gx, gy, wantDx, wantDy };
    if (Math.abs(gx - wantDx) > 2) fail('K10: pill x offset ' + gx.toFixed(1) + ' want ' + wantDx.toFixed(1));
    if (Math.abs(gy - wantDy) > 2) fail('K10: pill y offset ' + gy.toFixed(1) + ' want ' + wantDy.toFixed(1)); }
  /* CC2: the concurrent mark moved from the PNG first line to the job line (judged in VERIFY_cc2 J7) */
  if (!k10.ccs) fail('K10: concurrent member not drawn in the PNG');
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}
