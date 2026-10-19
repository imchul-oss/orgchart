// Judge for ORGCHART-CC2 (2026-10-19), written before the code. Substitute __DOC__, __PAGE__, __REF__.
// (J1) cc member with f '팀장': its .mf starts with '팀장(겸)'; no .mcc element anywhere on the page;
// (J2) cc member with empty f: .mf starts with '겸직';
// (J3) cc member whose f is already '팀장(겸)': .mf shows '팀장(겸)' exactly once;
// (J4) _sanitizeSheet: f '팀장(겸)' -> f '팀장' + cc true; f '팀장' without cc untouched;
// (J5) admin saveModal with a row whose job select is '팀장(겸)' stores f '팀장' and cc true;
// (J6) a fresh page's default OPT.jobCats has no '팀장(겸)' and keeps the other defaults in order;
// (J7) exportPNG: the cc member's first line has no '(겸)'; a second-line text '팀장(겸)' is drawn;
// (J8) list view sub text of the cc member is '<r> · 팀장(겸)'; tooltip shows '팀장(겸)' and no separate '겸직' line;
// (J9) with no cc anywhere: every card's member row text, list view, and exportPNG fillText list equal the reference;
// (E) no page errors.
async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  async function load(url) {
    await page.goto(url); await page.waitForTimeout(500);
    await page.evaluate(d => { try { localStorage.clear(); } catch (e) {} _adoptData(JSON.parse(JSON.stringify(d)), false); _finishLoad(true); switchSheet(0); OPT.wrapN = 0; OPT.orient = 'down'; autoLayout(); render(); }, DOC);
    await page.waitForTimeout(300);
  }
  const HELP = () => {
    window.__png = () => { const P = CanvasRenderingContext2D.prototype, oT = P.fillText, oc = HTMLCanvasElement.prototype.toBlob, T = [];
      P.fillText = function (s, x, y) { const m = this.getTransform(); T.push([String(s), (m.a * x + m.e).toFixed(1), (m.d * y + m.f).toFixed(1), this.font].join('|')); return oT.apply(this, arguments); };
      HTMLCanvasElement.prototype.toBlob = function () {}; try { exportPNG(); } finally { P.fillText = oT; HTMLCanvasElement.prototype.toBlob = oc; } return T; };
    window.__rows = () => Array.prototype.map.call(document.querySelectorAll('.nd .mr'), r => r.closest('.nd').id + ':' + r.textContent.replace(/\s+/g, ' ').trim()).sort();
    window.__tvm = () => { try { tvOpen(); } catch (e) {} tvBuild(); return Array.prototype.map.call(document.querySelectorAll('#treeview .tv-mem'), r => r.getAttribute('data-for') + ':' + r.textContent.replace(/\s+/g, ' ').trim()).sort(); };
  };
  const snap = async () => { const r = {}; const n = await page.evaluate(() => SHEETS.length);
    for (let s = 0; s < n; s++) r['s' + s] = await page.evaluate(s => { switchSheet(s); OPT.orient = 'down'; autoLayout(); render(); return { rows: __rows(), tv: __tvm(), png: __png() }; }, s); return r; };
  await load('__REF__'); await page.evaluate(HELP); const ref = await snap();
  await load('__PAGE__'); await page.evaluate(HELP); const cur = await snap();
  for (const s of Object.keys(ref)) for (const k of ['rows', 'tv', 'png']) { const A = ref[s][k], B = cur[s][k];
    if (JSON.stringify(A) !== JSON.stringify(B)) { let d = ''; for (let i = 0; i < Math.max(A.length, B.length); i++) if (A[i] !== B[i]) { d = ' #' + i + ' ref=' + String(A[i]).slice(0, 60) + ' cur=' + String(B[i]).slice(0, 60); break; } fail('J9: ' + s + ' ' + k + d); } }
  const r = await page.evaluate(() => { const o = {}; switchSheet(0); OPT.orient = 'down'; autoLayout(); render(); const H = collHidden();
    const t = S.nodes.filter(n => !H.has(n.id) && (n.m || []).length >= 4)[0]; o.id = t.id;
    t.m[1].cc = true; t.m[1].f = '팀장'; t.m[2].cc = true; t.m[2].f = ''; t.m[3].cc = true; t.m[3].f = '팀장(겸)'; t.m[1].r = t.m[1].r || '과장'; render();
    const rows = document.querySelectorAll('#n' + t.id + ' .mr'); const mf = i => { const e = rows[i].querySelector('.mf'); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; };
    o.mf1 = mf(1); o.mf2 = mf(2); o.mf3 = mf(3); o.mcc = document.querySelectorAll('.mcc').length;
    const png = __png(); o.l1 = png.filter(x => x.startsWith(t.m[1].n)).map(x => x.split('|')[0]); o.l2 = png.some(x => x.split('|')[0] === '팀장(겸)');
    const tv = __tvm(); o.tv1 = (tv.find(x => x.startsWith(t.id + ':' + t.m[1].n)) || ''); o.want = t.m[1].n + ' ' + t.m[1].r + ' · 팀장(겸)';
    const tvp = document.getElementById('treeview'); if (tvp) tvp.style.display = 'none'; const row = rows[1]; row.scrollIntoView({ block: 'center', inline: 'center' }); const bb = row.getBoundingClientRect(); o.pt = [bb.left + 30, bb.top + 12];
    return o; });
  await page.mouse.move(r.pt[0] + 5, r.pt[1] + 3); await page.mouse.move(r.pt[0], r.pt[1]); await page.waitForTimeout(700);
  const tip = await page.evaluate(() => { const t = document.getElementById('mtip'); return t ? { show: t.style.display, txt: t.textContent } : null; });
  out.info.r = r; out.info.tip = tip;
  if (!r.mf1.startsWith('팀장(겸)')) fail('J1: job line ' + r.mf1);
  if (r.mcc) fail('J1: ' + r.mcc + ' .mcc tags rendered');
  if (!r.mf2.startsWith('겸직')) fail('J2: empty-job concurrent line ' + r.mf2);
  if (!r.mf3.startsWith('팀장(겸)') || r.mf3.indexOf('(겸)(겸)') >= 0) fail('J3: ' + r.mf3);
  if (r.l1.some(x => x.indexOf('(겸)') >= 0)) fail('J7: PNG first line ' + r.l1);
  if (!r.l2) fail('J7: PNG second line 팀장(겸) not drawn');
  if (r.tv1.replace(/\s+/g, ' ') !== r.tv1 || r.tv1.indexOf('팀장(겸)') < 0 || r.tv1.indexOf('· 겸직') >= 0) fail('J8: list view ' + r.tv1);
  if (!tip || tip.show !== 'block') fail('J8: tooltip did not show'); else { if (tip.txt.indexOf('팀장(겸)') < 0) fail('J8: tooltip ' + tip.txt); if (/겸직/.test(tip.txt)) fail('J8: tooltip still has a 겸직 line'); }
  const s4 = await page.evaluate(() => { const s = _sanitizeSheet({ name: 'x', nodes: [{ id: 'n901', type: 'l2', en: 'A', ko: 'a', m: [{ n: 'a', f: '팀장(겸)' }, { n: 'b', f: '팀장' }] }], conns: [] }); return s.nodes[0].m; });
  if (s4[0].f !== '팀장' || s4[0].cc !== true) fail('J4: legacy value -> ' + JSON.stringify(s4[0])); if ('cc' in s4[1] || s4[1].f !== '팀장') fail('J4: plain 팀장 changed ' + JSON.stringify(s4[1]));
  await load('__PAGE__'); await page.evaluate(HELP);
  const j5 = await page.evaluate(() => { const o = {}; o.cats = OPT.jobCats.slice(); ADMIN = true; applyRO(); render(); const H = collHidden(); const t = S.nodes.filter(n => !H.has(n.id) && (n.m || []).length >= 2)[0];
    if (!OPT.jobCats.includes('팀장(겸)')) OPT.jobCats.push('팀장(겸)'); openEdit(t.id); const sel = document.querySelectorAll('#mlist .mer select[data-f="f"]')[0]; sel.value = '팀장(겸)'; saveModal();
    o.m0 = S.nodes.find(n => n.id === t.id).m[0]; ADMIN = false; applyRO(); return o; });
  if (j5.m0.f !== '팀장' || j5.m0.cc !== true) fail('J5: saved ' + JSON.stringify({ f: j5.m0.f, cc: j5.m0.cc }));
  const want = ['본부장', '실장', '팀장', '팀장(대행)', '인사총무', '총무지원', '회계관리', '생산관리', '시설관리', '자재관리', '물류사무', '직배관리', '품질관리', '연구개발', '상품기획', '마케팅', '영업', '디자인', '웹서비스', 'CS', '기타'];
  if (j5.cats.length ? JSON.stringify(j5.cats) !== JSON.stringify(want) : false) fail('J6: default jobCats ' + JSON.stringify(j5.cats)); /* kit: sanitized build has an empty list */
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}
