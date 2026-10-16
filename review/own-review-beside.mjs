// Own review of the beside change on review/fake-org.json (not part of the judge set).
// Usage: PW_MODULE=/opt/node-tools/node_modules/playwright/index.js node review/own-review-beside.mjs [page.html]
import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url';
const ROOT=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'..');
const PAGE=url.pathToFileURL(process.argv[2]||path.join(ROOT,'org-chart-local.html')).href;
const DOC=JSON.parse(fs.readFileSync(path.join(ROOT,'review/fake-org.json'),'utf8'));
const pw=await import(url.pathToFileURL(process.env.PW_MODULE).href);
const browser=await (pw.chromium||pw.default.chromium).launch();
const fails=[]; const fail=m=>{fails.push(m);console.log('  FAIL '+m);}; const ok=m=>console.log('  ok   '+m);
const ctx=await browser.newContext({viewport:{width:1600,height:1000}});
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push('pageerror: '+e)); page.on('console',m=>{ if(m.type()==='error') errors.push('console: '+m.text()); });

// scenario builders run in the page
const SCEN={
  judge:`d=>{ const s=d.sheets[0]; const mem=k=>[{n:'TF원'+k,f:'기획',r:'대리'}];
    const add=(id,type,ko,m)=>s.nodes.push({id,en:ko,ko,type,x:0,y:0,m:m||mem(id)});
    add('tf1','side','TF 하나'); add('tf1a','l3','TF 하나 가',mem('a').concat(mem('b'))); add('tf1b','l3','TF 하나 나'); add('tf1a1','l4','TF 하나 가가');
    add('tf2','side','TF 둘'); add('tf2a','l3','TF 둘 가'); add('tf3','side','TF 셋'); add('tf4','side','TF 넷');
    [{f:'prodhq',t:'tf1',d:1},{f:'tf1',t:'tf1a',d:0},{f:'tf1',t:'tf1b',d:0},{f:'tf1a',t:'tf1a1',d:0},{f:'tf2',t:'tf2a',d:0},{f:'t_01',t:'tf3',d:1},{f:'prodhq',t:'tf4',d:1}].forEach((c,i)=>{c.id='ctf'+i;s.conns.push(c);});
    return d; }`,
  // mixed path, left side + two columns + 3 cards on one leaf, middle leaf
  mixedL:`d=>{ const s=d.sheets[0]; const mem=k=>[{n:'TF원'+k,f:'기획',r:'대리'}];
    const add=(id,type,ko)=>s.nodes.push({id,en:ko,ko,type,x:0,y:0,m:mem(id)});
    ['s1','s2','s3','s4','s5'].forEach(i=>add(i,'side','TF '+i));
    s.nodes.find(n=>n.id==='t_02').ad='L'; s.nodes.find(n=>n.id==='t_03').ac=2; s.nodes.find(n=>n.id==='t_04').ad='B';
    [{f:'t_02',t:'s1'},{f:'t_03',t:'s2'},{f:'t_03',t:'s3'},{f:'t_03',t:'s4'},{f:'t_04',t:'s5'}].forEach((c,i)=>{c.d=1;c.id='cs'+i;s.conns.push(c);});
    return d; }`,
  // wrap path: prodhq children (5 leaves) wrapped at 3, side cards on 2 of them (one left)
  wrap:`d=>{ const s=d.sheets[0]; const mem=k=>[{n:'TF원'+k,f:'기획',r:'대리'}];
    const add=(id,type,ko)=>s.nodes.push({id,en:ko,ko,type,x:0,y:0,m:mem(id)});
    ['w1','w2','w3'].forEach(i=>add(i,'side','TF '+i));
    s.nodes.find(n=>n.id==='prodhq').kn=3; s.nodes.find(n=>n.id==='t_09').ad='L';
    [{f:'t_07',t:'w1'},{f:'t_09',t:'w2'},{f:'t_08',t:'w3'}].forEach((c,i)=>{c.d=1;c.id='cw'+i;s.conns.push(c);});
    return d; }`,
  // col path: foodhq kl='col', side cards on two column children (one left, one two-stack)
  col:`d=>{ const s=d.sheets[0]; const mem=k=>[{n:'TF원'+k,f:'기획',r:'대리'}];
    const add=(id,type,ko)=>s.nodes.push({id,en:ko,ko,type,x:0,y:0,m:mem(id)});
    ['c1','c2','c3'].forEach(i=>add(i,'side','TF '+i));
    s.nodes.find(n=>n.id==='foodhq').kl='col'; s.nodes.find(n=>n.id==='t_13').ad='L';
    [{f:'t_12',t:'c1'},{f:'t_13',t:'c2'},{f:'t_12',t:'c3'}].forEach((c,i)=>{c.d=1;c.id='cc'+i;s.conns.push(c);});
    return d; }`,
  // sheet 1: leaf side card under an l3 in an all-leaf group (place path, already worked) + under l2 with subtree
  s1:`d=>{ const s=d.sheets[1]; const mem=k=>[{n:'TF원'+k,f:'기획',r:'대리'}];
    const add=(id,type,ko)=>s.nodes.push({id,en:ko,ko,type,x:0,y:0,m:mem(id)});
    ['q1','q2'].forEach(i=>add(i,'side','TF '+i));
    [{f:'o_p1_2',t:'q1'},{f:'o_p2',t:'q2'}].forEach((c,i)=>{c.d=1;c.id='cq'+i;s.conns.push(c);});
    return d; }`,
};
async function load(scen,sheet=0,admin=false){
  await page.goto(PAGE); await page.waitForTimeout(300);
  return page.evaluate(([d,sc,sheet,admin])=>{ try{localStorage.clear();}catch(e){} const dd=sc?eval('('+sc+')')(JSON.parse(JSON.stringify(d))):JSON.parse(JSON.stringify(d));
    _adoptData(dd,false); _finishLoad(true); if(admin){ ADMIN=true; applyRO(); } switchSheet(sheet); OPT.wrapN=0; return ADMIN; },[DOC,SCEN[scen]||null,sheet,admin]);
}
const GEOM=`()=>{ const H=collHidden(); return { nodes:S.nodes.filter(n=>!H.has(n.id)).map(n=>({id:n.id,x:n.x,y:n.y,h:nh(n),t:n.type})), NW, gap:OPT.colGap,
  lint:(()=>{ runLint(); const b=document.getElementById('lint-badge'); return {ov:+b.getAttribute('data-overlap'),cr:+b.getAttribute('data-cross'),br:+b.getAttribute('data-broken')}; })(),
  zone:document.querySelectorAll('#canvas .tfzone').length, po:SHEETS[CUR_SHEET].posOrient }; }`;
const lay=async dir=>page.evaluate(([dir,g])=>{ OPT.orient=dir; autoLayout(); render(); return eval('('+g+')')(); },[dir,GEOM]);
const geom=async()=>page.evaluate(g=>eval('('+g+')')(),GEOM);
function checkOverlap(g,tag){ const N=g.nodes,NW=g.NW; let n=0;
  for(let i=0;i<N.length;i++) for(let j=i+1;j<N.length;j++){ const a=N[i],b=N[j]; if(Math.min(a.x+NW,b.x+NW)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>1){ n++; if(n<4) fail(tag+': overlap '+a.id+'/'+b.id); } }
  if(!n) ok(tag+': no card overlap'); }
function checkLint(g,tag){ if(g.lint.ov||g.lint.cr||g.lint.br) fail(tag+': lint overlap '+g.lint.ov+' cross '+g.lint.cr+' broken '+g.lint.br); else ok(tag+': lint clean'); }
function checkBeside(g,pairs,tag,dir){ const by={}; g.nodes.forEach(n=>by[n.id]=n); const NW=g.NW;
  for(const [t,p,side] of pairs){ const T=by[t],P=by[p]; if(!T||!P){ fail(tag+': missing '+t+'/'+p); continue; }
    if(dir==='down'){ const gap=side==='L'?P.x-(T.x+NW):T.x-(P.x+NW);
      if(T.y!==P.y||gap<g.gap-20||gap>2*g.gap+20) fail(tag+': '+t+' not beside '+p+' (dy '+(T.y-P.y)+', gap '+gap+')'); else ok(tag+': '+t+' beside '+p+' ('+(side||'R')+', gap '+gap+')'); }
    else { if(T.x!==P.x||T.y<P.y+P.h) fail(tag+': '+t+' not under '+p+' in its column (dx '+(T.x-P.x)+', dy '+(T.y-P.y)+')'); else ok(tag+': '+t+' under '+p+' in column'); } } }

console.log('== A. judge scenario, all orientations, read-only');
await load('judge');
const A={};
for(const dir of ['down','right','left']){ const g=await lay(dir); A[dir]=g; checkOverlap(g,'A '+dir); checkLint(g,'A '+dir);
  checkBeside(g,[['tf3','t_01'],['tf4','prodhq']],'A '+dir,dir);
  if(dir==='down'){ const by={}; g.nodes.forEach(n=>by[n.id]=n); const Z=['tf1','tf1a','tf1b','tf1a1','tf2','tf2a']; const maxO=Math.max(...g.nodes.filter(n=>!Z.includes(n.id)).map(n=>n.x+g.NW));
    if(Z.some(id=>by[id].x<maxO+40)) fail('A down: TF zone not right of every other card'); else ok('A down: TF zone right of all cards'); }
  if(g.zone!==1) fail('A '+dir+': tfzone count '+g.zone); }

console.log('== B. folding (down, judge scenario)');
await lay('down');
let f=await page.evaluate(g=>{ collToggle('t_01'); const H=collHidden(); const r={tf3:H.has('tf3'),geom:eval('('+g+')')()}; return r; },GEOM);
if(!f.tf3) fail('B: tf3 still visible after folding t_01'); else ok('B: tf3 hidden with folded t_01'); checkLint(f.geom,'B fold t_01');
f=await page.evaluate(g=>{ collToggle('t_01'); collToggle('prodhq'); const H=collHidden(); return {tf4:H.has('tf4'),tf1:H.has('tf1'),tf3:H.has('tf3'),geom:eval('('+g+')')()}; },GEOM);
if(!f.tf4||!f.tf1||f.tf3) fail('B: fold prodhq → tf4 '+f.tf4+' tf1 '+f.tf1+' tf3 '+f.tf3); else ok('B: fold prodhq hides tf1 subtree and tf4, tf3 visible'); checkLint(f.geom,'B fold prodhq');
f=await page.evaluate(g=>{ collToggle('prodhq'); return {n:collHidden().size,geom:eval('('+g+')')()}; },GEOM);
if(f.n) fail('B: '+f.n+' still hidden after expand'); else ok('B: expand all restores'); checkLint(f.geom,'B expanded');
// autoLayout while folded: beside card of a folded parent
f=await page.evaluate(g=>{ collToggle('t_01'); autoLayout(); render(); const r=eval('('+g+')')(); collToggle('t_01'); autoLayout(); render(); return {folded:r, open:eval('('+g+')')()}; },GEOM);
checkLint(f.folded,'B layout while t_01 folded'); checkLint(f.open,'B layout after unfold'); checkBeside(f.open,[['tf3','t_01']],'B after unfold','down');

console.log('== C. admin mode, undo/redo');
await load('judge',0,true);
let c=await page.evaluate(g=>{ OPT.orient='down'; autoLayout(); render(); _hCheckpoint(); const before=JSON.stringify(S.nodes.map(n=>[n.id,n.x,n.y]));
  const n=S.nodes.find(n=>n.id==='tf3'); n.x+=300; n.y+=100; render(); _hCheckpoint(); const moved=JSON.stringify(S.nodes.map(n=>[n.id,n.x,n.y]));
  undoEdit(); const undone=JSON.stringify(S.nodes.map(n=>[n.id,n.x,n.y])); redoEdit(); const redone=JSON.stringify(S.nodes.map(n=>[n.id,n.x,n.y]));
  return {admin:ADMIN,ro:document.body.classList.contains('ro'),before,moved,undone,redone,canUndo:_hUndo.length}; },GEOM);
if(!c.admin||c.ro) fail('C: admin mode not active'); else ok('C: admin mode active');
if(c.before===c.moved) fail('C: move did not change state'); if(c.undone!==c.before) fail('C: undo did not restore layout positions'); else ok('C: undo restores');
if(c.redone!==c.moved) fail('C: redo did not reapply move'); else ok('C: redo reapplies');
// undo an autoLayout in admin mode (positions before/after layout)
c=await page.evaluate(()=>{ _hCheckpoint(); const a=JSON.stringify(S.nodes.map(n=>[n.id,n.x,n.y])); OPT.orient='right'; autoLayout(); render(); _hCheckpoint(); const b=JSON.stringify(S.nodes.map(n=>[n.id,n.x,n.y])); undoEdit(); const u=JSON.stringify(S.nodes.map(n=>[n.id,n.x,n.y])); return {a,b,u,po:SHEETS[CUR_SHEET].posOrient}; });
if(c.u!==c.a) fail('C: undo after autoLayout(right) did not restore'); else ok('C: undo after sideways autoLayout restores');
// layout in admin mode same as read-only
for(const dir of ['down','right','left']){ const g=await lay(dir); const same=JSON.stringify(g.nodes)===JSON.stringify(A[dir].nodes); if(!same) fail('C: admin '+dir+' layout differs from read-only'); else ok('C: admin '+dir+' layout identical to read-only'); }

console.log('== D. save / reload round trip');
await load('judge');
for(const dir of ['down','right','left']){
  const r=await page.evaluate(([dir,g])=>{ OPT.orient=dir; autoLayout(); render(); const a=eval('('+g+')')(); const fd=JSON.parse(JSON.stringify(_fileData()));
    const leak=fd.sheets.some(s=>s.nodes.some(n=>Object.keys(n).some(k=>k[0]==='_')));
    _adoptData(fd,false); _finishLoad(_hasPositions(S.nodes)); switchSheet(0); render(); const b=eval('('+g+')')();
    autoLayout(); render(); const c=eval('('+g+')')(); return {a,b,c,leak,po:SHEETS[0].posOrient}; },[dir,GEOM]);
  if(r.leak) fail('D: underscore props leaked into file data');
  if(JSON.stringify(r.a.nodes)!==JSON.stringify(r.b.nodes)) fail('D '+dir+': positions changed by save/reload'); else ok('D '+dir+': positions survive save/reload');
  checkLint(r.b,'D '+dir+' after reload');
  if(JSON.stringify(r.b.nodes)!==JSON.stringify(r.c.nodes)) fail('D '+dir+': re-autoLayout after reload moved cards (not idempotent)'); else ok('D '+dir+': autoLayout idempotent after reload');
  if(r.po!==dir) fail('D '+dir+': posOrient after reload is '+r.po);
}

console.log('== E. PNG export and print');
await load('judge');
for(const dir of ['down','right']){
  const e=await page.evaluate(dir=>{ OPT.orient=dir; autoLayout(); render(); const got=[]; const o=CanvasRenderingContext2D.prototype.fillText; CanvasRenderingContext2D.prototype.fillText=function(s){got.push(String(s));return o.apply(this,arguments);};
    const tb=HTMLCanvasElement.prototype.toBlob; HTMLCanvasElement.prototype.toBlob=function(){}; let err=null; try{ exportPNG(); }catch(x){ err=String(x); } finally{ CanvasRenderingContext2D.prototype.fillText=o; HTMLCanvasElement.prototype.toBlob=tb; }
    return {err,hasTf3:got.some(s=>s.indexOf('TF 셋')>=0),hasTf4:got.some(s=>s.indexOf('TF 넷')>=0),n:got.length}; },dir);
  if(e.err) fail('E '+dir+': exportPNG threw '+e.err); else if(!e.hasTf3||!e.hasTf4) fail('E '+dir+': exportPNG did not draw tf3/tf4'); else ok('E '+dir+': exportPNG draws beside cards ('+e.n+' texts)');
}
await page.evaluate(()=>{ OPT.orient='down'; autoLayout(); render(); });
await page.emulateMedia({media:'print'});
const pr=await page.evaluate(()=>{ preparePrint(); const vis=id=>{ const el=document.getElementById('n'+id); return !!el&&getComputedStyle(el).display!=='none'; }; const r={tf3:vis('tf3'),tf4:vis('tf4'),printing:document.body.classList.contains('printing')}; restorePrint(); return r; });
await page.emulateMedia({media:'screen'});
if(!pr.tf3||!pr.tf4) fail('E: beside cards hidden in print'); else ok('E: beside cards visible in print');

console.log('== F. other layout paths');
await load('mixedL');
for(const dir of ['down','right','left']){ const g=await lay(dir); checkOverlap(g,'F mixedL '+dir); checkLint(g,'F mixedL '+dir);
  checkBeside(g,[['s1','t_02','L'],['s2','t_03'],['s5','t_04']],'F mixedL '+dir,dir);
  if(dir==='down'){ const by={}; g.nodes.forEach(n=>by[n.id]=n); if(by.s3.y!==by.t_03.y||by.s3.x<=by.s2.x+g.NW) fail('F mixedL: s3 not in second beside column'); else ok('F mixedL: s3 in second beside column'); if(by.s4.x!==by.s2.x||by.s4.y<by.s2.y+by.s2.h+20) fail('F mixedL: s4 not stacked under s2'); else ok('F mixedL: s4 stacked under s2'); } }
await load('wrap');
for(const dir of ['down','right','left']){ const g=await page.evaluate(([dir,g])=>{ OPT.orient=dir; autoLayout(); render(); const r=eval('('+g+')')(); r.wrap=!!S.nodes.find(n=>n.id==='prodhq')._wrap; return r; },[dir,GEOM]);
  if(dir==='down'&&!g.wrap) fail('F wrap: prodhq not wrapped'); checkOverlap(g,'F wrap '+dir); checkLint(g,'F wrap '+dir);
  checkBeside(g,[['w1','t_07'],['w2','t_09','L'],['w3','t_08']],'F wrap '+dir,dir); }
await load('col');
for(const dir of ['down','right','left']){ const g=await page.evaluate(([dir,g])=>{ OPT.orient=dir; autoLayout(); render(); const r=eval('('+g+')')(); r.col=!!S.nodes.find(n=>n.id==='foodhq')._col; return r; },[dir,GEOM]);
  if(dir==='down'&&!g.col) fail('F col: foodhq not col'); checkOverlap(g,'F col '+dir); checkLint(g,'F col '+dir);
  checkBeside(g,[['c1','t_12'],['c2','t_13','L']],'F col '+dir,dir);
  if(dir==='down'){ const by={}; g.nodes.forEach(n=>by[n.id]=n); if(by.c3.x!==by.c1.x||by.c3.y<by.c1.y+by.c1.h+20) fail('F col: c3 not stacked under c1'); else ok('F col: c3 stacked under c1'); } }
await load('s1',1);
for(const dir of ['down','right','left']){ const g=await lay(dir); checkOverlap(g,'F sheet1 '+dir); checkLint(g,'F sheet1 '+dir); checkBeside(g,[['q1','o_p1_2'],['q2','o_p2']],'F sheet1 '+dir,dir); }

// tall beside stacks: col child and wrapped row card with two 3-member side cards, next card also with a side card
SCEN.colStack=`d=>{ const s=d.sheets[0]; const mem=k=>[{n:'TF원'+k,f:'기획',r:'대리'},{n:'TF원'+k+'2',f:'기획',r:'대리'},{n:'TF원'+k+'3',f:'기획',r:'대리'}];
    const add=(id,type,ko)=>s.nodes.push({id,en:ko,ko,type,x:0,y:0,m:mem(id)});
    ['k1','k2','k3','k4'].forEach(i=>add(i,'side','TF '+i));
    s.nodes.find(n=>n.id==='foodhq').kl='col';
    [{f:'t_13',t:'k1'},{f:'t_13',t:'k2'},{f:'t_14',t:'k3'},{f:'foodhq',t:'k4'}].forEach((c,i)=>{c.d=1;c.id='ck'+i;s.conns.push(c);});
    return d; }`;
SCEN.wrapStack=`d=>{ const s=d.sheets[0]; const mem=k=>[{n:'TF원'+k,f:'기획',r:'대리'},{n:'TF원'+k+'2',f:'기획',r:'대리'},{n:'TF원'+k+'3',f:'기획',r:'대리'}];
    const add=(id,type,ko)=>s.nodes.push({id,en:ko,ko,type,x:0,y:0,m:mem(id)});
    ['k1','k2','k3'].forEach(i=>add(i,'side','TF '+i));
    s.nodes.find(n=>n.id==='prodhq').kn=3;
    [{f:'t_06',t:'k1'},{f:'t_06',t:'k2'},{f:'t_09',t:'k3'}].forEach((c,i)=>{c.d=1;c.id='ck'+i;s.conns.push(c);});
    return d; }`;
// place path (all-leaf group under a non-root parent with >=3 children): equalizeSiblingGaps must not push into the next subtree
SCEN.eq=`d=>{ const s=d.sheets[1]; const mem=k=>[{n:'TF원'+k,f:'기획',r:'대리'}];
    const add=(id,type,ko)=>s.nodes.push({id,en:ko,ko,type,x:0,y:0,m:mem(id)});
    ['e1','e2','e3'].forEach(i=>add(i,'side','TF '+i)); s.nodes.find(n=>n.id==='o_p1_0').ad='L';
    [{f:'o_p1_0',t:'e1'},{f:'o_p1_2',t:'e2'},{f:'o_step4',t:'e3'}].forEach((c,i)=>{c.d=1;c.id='ce'+i;s.conns.push(c);});
    return d; }`;
console.log('== H. tall beside stacks and sibling-gap equalisation');
await load('colStack');
for(const dir of ['down','right','left']){ const g=await lay(dir); checkOverlap(g,'H colStack '+dir); checkLint(g,'H colStack '+dir); checkBeside(g,[['k1','t_13'],['k3','t_14'],['k4','foodhq']],'H colStack '+dir,dir); }
await load('wrapStack');
for(const dir of ['down','right','left']){ const g=await lay(dir); checkOverlap(g,'H wrapStack '+dir); checkLint(g,'H wrapStack '+dir); checkBeside(g,[['k1','t_06'],['k3','t_09']],'H wrapStack '+dir,dir); }
await load('eq',1);
for(const dir of ['down','right','left']){ const g=await lay(dir); checkOverlap(g,'H eq '+dir); checkLint(g,'H eq '+dir); checkBeside(g,[['e1','o_p1_0','L'],['e2','o_p1_2'],['e3','o_step4']],'H eq '+dir,dir); }

console.log('== G. plain data: lint clean, no zone');
await load(null,0);
for(const dir of ['down','right','left']){ const g=await lay(dir); checkLint(g,'G sheet0 '+dir); if(g.zone) fail('G: tfzone on plain sheet'); }
await load(null,1);
for(const dir of ['down','right','left']){ const g=await lay(dir); checkLint(g,'G sheet1 '+dir); }

console.log('== errors: '+errors.length); errors.slice(0,10).forEach(e=>console.log('  '+e));
if(errors.length) fail('page/console errors');
await browser.close();
console.log(fails.length?('REVIEW RED ('+fails.length+' fails)'):'REVIEW GREEN');
process.exit(fails.length?1:0);
