async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [], info: {} };
  page.on('pageerror', e => out.errors.push(String(e)));
  const fail = m => { if (out.fails.length < 60) out.fails.push(m); };
  await page.setViewportSize({ width: 1600, height: 950 });
  const FIX = `(function(d){ try{localStorage.clear();}catch(e){} _adoptData(JSON.parse(JSON.stringify(d)),false); _finishLoad(true); if(CUR_SHEET!==0) switchSheet(0); ADMIN=true; applyRO(); autoLayout(); render();
    const before=JSON.parse(JSON.stringify(SHEETS.map((s,i)=>({name:s.name,nodes:(i===CUR_SHEET?S.nodes:s.nodes),conns:(i===CUR_SHEET?S.conns:s.conns)}))));
    const s0=before[0]; const by=id=>s0.nodes.find(n=>n.id===id);
    s0.nodes.forEach(n=>{ n.m=(n.m||[]).filter(m=>m.cc!==true||n.id==='t_07'||n.id==='t_16'); });
    by('t_01').m=by('t_01').m.filter(m=>m.n!=='볘뙤');
    by('t_03').m.push({n:'ZZ퇴사',f:'',r:'뗘쪄',s:'active'});
    { const i=by('t_04').m.findIndex(m=>m.n==='뻬킈궈'); const [mm]=by('t_04').m.splice(i,1); by('t_02').m.push(mm); }
    { const mm=by('t_04').m.find(m=>m.n==='려뎌얘'); mm.r='세쥬'; }
    by('t_15').m.push({n:'되세쏴',f:'뤼투',r:'치쁴',s:'active',cc:true});
    s0.nodes.push({id:'zz_gone',en:'ZZ없어진팀',ko:'',type:'l2',x:0,y:0,m:[{n:'ZZ1',r:'뗘쪄',s:'active'},{n:'ZZ2',r:'뗘쪄',s:'active'},{n:'추띠뜌',f:'뤼투',r:'치쁴',s:'active',cc:true}]});
    s0.conns.push({id:'zz_c',f:'fp',t:'zz_gone',d:0});
    s0.nodes=s0.nodes.filter(n=>n.id!=='t_12'); s0.conns=s0.conns.filter(c=>c.t!=='t_12');
    return before; })`;
  const READ = () => page.evaluate(() => { const p = document.getElementById('cmp-panel'); if (!p) return null;
    const items = [...p.querySelectorAll('.cmp-item')].map(e => ({ kind: e.getAttribute('data-kind'), text: e.textContent.trim() }));
    const c = {}; ['join', 'leave', 'move', 'change', 'orgnew', 'orggone'].forEach(k => c[k] = p.getAttribute('data-' + k));
    const t09 = [...document.querySelectorAll('#nt_09 .mr[data-cmp="new"]')].map(e => e.textContent.trim().slice(0, 12));
    return { items, c, cnt: (p.querySelector('.cmp-cnt') || {}).textContent, t09 }; });
  // main page
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  await page.evaluate(([d, fix]) => { const before = (0, eval)(fix)(d); CMP = { file: 'prev.json', data: { sheets: before }, single: false }; cmpRun(); }, [DOC, FIX]);
  await page.waitForTimeout(200);
  const g = await READ(); if (!g) { fail('no compare panel'); } else {
    out.info.cnt = g.cnt; out.info.items = g.items.map(i => i.kind + '|' + i.text).slice(0, 30);
    const T = g.items.map(i => i.text);
    const joins = g.items.filter(i => i.kind === 'join').map(i => i.text);  // cmptbl (10-21): rows are table cells, the kind is data-kind
    if (joins.length !== 5 || !joins.some(t => /볘뙤/.test(t)) || joins.filter(t => /캐뗴틔햬즈/.test(t)).length !== 4) fail('M1: 입사 items ' + JSON.stringify(joins));
    ['추띠뜌', '튜어뫼', '가츼계', '되세쏴'].forEach(n => { if (joins.some(t => t.includes(n))) fail('M1: cc person reported as hire: ' + n); });
    const add = T.filter(t => /겸직 추가/.test(t)), rel = T.filter(t => /겸직 해제/.test(t));
    const want = [['가츼계', '자비세에뺘'], ['튜어뫼', '료컈느'], ['추띠뜌', '쵀똬퇴'], ['추띠뜌', '효트듀'], ['추띠뜌', '꿰주붜']];
    if (add.length !== 5) fail('M2: 겸직 추가 items ' + add.length + ' ' + JSON.stringify(add));
    want.forEach(([n, t]) => { if (!add.some(x => x.includes(n) && x.includes(t))) fail('M2: missing 겸직 추가 ' + n + ' ' + t); });
    if (rel.length !== 2 || !rel.some(t => /되세쏴/.test(t) && /햐쿄릐뀌뎌/.test(t)) || !rel.some(t => /추띠뜌/.test(t) && /ZZ없어진팀/.test(t))) fail('M2: 겸직 해제 items ' + JSON.stringify(rel));
    if (T.some(t => /겸직/.test(t) && (/뾔해니/.test(t) || /끠뷰싸씨/.test(t)))) fail('M2: unchanged cc row reported');
    if (g.c.join !== '5' || g.c.leave !== '3' || g.c.move !== '1' || g.c.orgnew !== '1' || g.c.orggone !== '1') fail('M3: counters ' + JSON.stringify(g.c));
    if (g.c.change !== '8') fail('M3: data-change ' + g.c.change + ', want 8');
    g.items.filter(i => /겸직/.test(i.text)).forEach(i => { if (i.kind !== 'change') fail('M3: cc item kind ' + i.kind); });
    const gone = g.items.filter(i => i.kind === 'orggone').map(i => i.text).find(t => /ZZ없어진팀/.test(t)); if (!gone) fail('M4: no 조직 폐지 item'); else if (!/\(2명\)/.test(gone)) fail('M4: ' + gone);
    const leave = g.items.filter(i => i.kind === 'leave').map(i => i.text); if (leave.length !== 3 || !leave.some(t => /ZZ퇴사/.test(t)) || leave.filter(t => /ZZ없어진팀/.test(t)).length !== 2) fail('M3: 퇴사 items ' + JSON.stringify(leave));
    const move = g.items.filter(i => i.kind === 'move').map(i => i.text); if (move.length !== 1 || !/뻬킈궈/.test(move[0])) fail('M3: 이동 items ' + JSON.stringify(move));
    const chg = g.items.filter(i => i.kind === 'change').map(i => i.text); if (!chg.some(t => /려뎌얘/.test(t))) fail('M3: 변경 item for 려뎌얘 missing ' + JSON.stringify(chg));
    if (!g.t09.some(t => /추띠뜌/.test(t))) fail('M5: new cc row on 쵀똬퇴 not marked data-cmp=new (' + JSON.stringify(g.t09) + ')');
  }
  // M6 parity with the reference when neither side has cc rows
  const STRIP = `(function(d){ const before=(0,eval)(FIXSRC)(d); before[0].nodes.forEach(n=>{ n.m=(n.m||[]).filter(m=>m.cc!==true); });
    S.nodes.forEach(n=>{ n.m=(n.m||[]).filter(m=>m.cc!==true); }); render(); CMP={file:'prev.json',data:{sheets:before},single:false}; cmpRun(); })`;
  const run6 = async url => { await page.goto(url); await page.waitForTimeout(400);
    await page.evaluate(([d, fix, strip]) => { window.FIXSRC = fix; (0, eval)(strip)(d); }, [DOC, FIX, STRIP]); await page.waitForTimeout(200);
    const r = await READ(); return r ? r.items.map(i => i.kind + '|' + i.text).sort() : null; };
  const a6 = await run6('__PAGE__'), b6 = await run6('__REF__');
  if (!a6 || !b6) fail('M6: panel missing'); else if (JSON.stringify(a6) !== JSON.stringify(b6)) fail('M6: cc-free comparison differs from reference: ' + JSON.stringify(a6.filter(x => !b6.includes(x)).concat(b6.filter(x => !a6.includes(x))).slice(0, 6)));
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}