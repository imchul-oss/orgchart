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
    t.m[1].cc = true; t.m[1].f = '뤼투'; t.m[2].cc = true; t.m[2].f = ''; t.m[3].cc = true; t.m[3].f = '뤼투(겸)'; t.m[1].r = t.m[1].r || '킈쮀'; render();
    const rows = document.querySelectorAll('#n' + t.id + ' .mr'); const mf = i => { const e = rows[i].querySelector('.mf'); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; };
    o.mf1 = mf(1); o.mf2 = mf(2); o.mf3 = mf(3); o.mcc = document.querySelectorAll('.mcc').length;
    const png = __png(); o.l1 = png.filter(x => x.startsWith(t.m[1].n)).map(x => x.split('|')[0]); o.l2 = png.some(x => x.split('|')[0] === '뤼투(겸)');
    const tv = __tvm(); o.tv1 = (tv.find(x => x.startsWith(t.id + ':' + t.m[1].n)) || ''); o.want = t.m[1].n + ' ' + t.m[1].r + ' · 뤼투(겸)';
    const tvp = document.getElementById('treeview'); try { tvClose(); } catch (e) {} if (tvp) { tvp.classList.remove('tv-open'); tvp.style.display = 'none'; } const flp = document.getElementById('statsfl'); if (flp) flp.style.display = 'none'; const row = rows[1]; row.scrollIntoView({ block: 'center', inline: 'center' }); const bb = row.getBoundingClientRect(); o.pt = [bb.left + 30, bb.top + 12];  // cntmode (10-20): the floating panel may sit over the hovered row; the list view keeps display:flex!important while .tv-open is set, so close it through tvClose
    return o; });
  await page.mouse.move(r.pt[0] + 5, r.pt[1] + 3); await page.mouse.move(r.pt[0], r.pt[1]); await page.waitForTimeout(700);
  const tip = await page.evaluate(() => { const t = document.getElementById('mtip'); return t ? { show: t.style.display, txt: t.textContent } : null; });
  out.info.r = r; out.info.tip = tip;
  if (!r.mf1.startsWith('뤼투(겸)')) fail('J1: job line ' + r.mf1);
  if (r.mcc) fail('J1: ' + r.mcc + ' .mcc tags rendered');
  if (!r.mf2.startsWith('겸직')) fail('J2: empty-job concurrent line ' + r.mf2);
  if (!r.mf3.startsWith('뤼투(겸)') || r.mf3.indexOf('(겸)(겸)') >= 0) fail('J3: ' + r.mf3);
  if (r.l1.some(x => x.indexOf('(겸)') >= 0)) fail('J7: PNG first line ' + r.l1);
  if (!r.l2) fail('J7: PNG second line 뤼투(겸) not drawn');
  if (r.tv1.replace(/\s+/g, ' ') !== r.tv1 || r.tv1.indexOf('뤼투(겸)') < 0 || r.tv1.indexOf('· 겸직') >= 0) fail('J8: list view ' + r.tv1);
  if (!tip || tip.show !== 'block') fail('J8: tooltip did not show'); else { if (tip.txt.indexOf('뤼투(겸)') < 0) fail('J8: tooltip ' + tip.txt); if (/겸직/.test(tip.txt)) fail('J8: tooltip still has a 겸직 line'); }
  const s4 = await page.evaluate(() => { const s = _sanitizeSheet({ name: 'x', nodes: [{ id: 'n901', type: 'l2', en: 'A', ko: 'a', m: [{ n: 'a', f: '뤼투(겸)' }, { n: 'b', f: '뤼투' }] }], conns: [] }); return s.nodes[0].m; });
  if (s4[0].f !== '뤼투' || s4[0].cc !== true) fail('J4: legacy value -> ' + JSON.stringify(s4[0])); if ('cc' in s4[1] || s4[1].f !== '뤼투') fail('J4: plain 뤼투 changed ' + JSON.stringify(s4[1]));
  await load('__PAGE__'); await page.evaluate(HELP);
  const j5 = await page.evaluate(() => { const o = {}; o.cats = OPT.jobCats.slice(); ADMIN = true; applyRO(); render(); const H = collHidden(); const t = S.nodes.filter(n => !H.has(n.id) && (n.m || []).length >= 2)[0];
    if (!OPT.jobCats.includes('뤼투(겸)')) OPT.jobCats.push('뤼투(겸)'); openEdit(t.id); const sel = document.querySelectorAll('#mlist .mer select[data-f="f"]')[0]; sel.value = '뤼투(겸)'; saveModal();
    o.m0 = S.nodes.find(n => n.id === t.id).m[0]; ADMIN = false; applyRO(); return o; });
  if (j5.m0.f !== '뤼투' || j5.m0.cc !== true) fail('J5: saved ' + JSON.stringify({ f: j5.m0.f, cc: j5.m0.cc }));
  const want = ['비쟈씌', '붸노', '뤼투', '뤼투(괘우)', '뫄랴띠프', '노쌔쩌턔', '뀨르볘도', '짜뗴푸교', '톄뚀뺴퐈', '버먜먀혜', '놔꾜늬혜', '뗘벼꺄쨰', '이쑈쭤헤', '호싀페쮜', '라워소아', '쏘츼네', '뎌뮈', '져체궤', '회퉤뾔쿠', 'CS', '기타'];
  if (j5.cats.length ? JSON.stringify(j5.cats) !== JSON.stringify(want) : false) fail('J6: default jobCats ' + JSON.stringify(j5.cats)); /* kit: sanitized build has an empty list */
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}