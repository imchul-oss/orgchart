// Own review of the polish change on the fake data (not a judge). Usage: PW_MODULE=... node review/own-review-polish.mjs [page.html]
// Writes screenshots next to this file under review/own-shots/ (git-ignored by not being committed).
import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url';
const ROOT='/home/user/orgchart';
const SHOTS=path.dirname(url.fileURLToPath(import.meta.url))+'/own-shots'; fs.mkdirSync(SHOTS,{recursive:true});
const pagePath=process.argv[2]||path.join(ROOT,'org-chart-local.html');
const PAGE=url.pathToFileURL(pagePath).href;
const DOC=JSON.parse(fs.readFileSync(path.join(ROOT,'review/fake-org.json'),'utf8'));
const pw=await import(url.pathToFileURL(process.env.PW_MODULE).href);
const chromium=pw.chromium||(pw.default&&pw.default.chromium); const browser=await chromium.launch();
const ctx=await browser.newContext({viewport:{width:1600,height:1000}}); await ctx.addInitScript(()=>{ try{ localStorage.clear(); }catch(e){} });
const page=await ctx.newPage();
const errors=[], warns=[];
page.on('pageerror',e=>errors.push('pageerror: '+e));
page.on('console',m=>{ if(m.type()==='error') errors.push('console.error: '+m.text()); else if(m.type()==='warning') warns.push(m.text()); });
const findings=[]; const note=(k,v)=>console.log(k+': '+(typeof v==='string'?v:JSON.stringify(v)));
const bad=m=>{ findings.push(m); console.log('!! '+m); };
async function load(admin){
  await page.goto(PAGE); await page.waitForTimeout(400);
  await page.evaluate(([d,admin])=>{ try{localStorage.clear();}catch(e){} const doc=JSON.parse(JSON.stringify(d));
    _adoptData(doc,false); _finishLoad(true); switchSheet(0); OPT.wrapN=0; OPT.orient='down'; autoLayout(); render();
    if(admin){ ADMIN=true; applyRO(); } }, [DOC,admin]);
  await page.waitForTimeout(300);
}
const MEASURE=`(()=>{ const cards=[...document.querySelectorAll('.nd')].filter(c=>getComputedStyle(c).display!=='none');
  const rects=cards.map(c=>({id:c.id,r:c.getBoundingClientRect()}));
  return cards.map(c=>{ const t=c.querySelector('.ctog'); if(!t) return null; const r=c.getBoundingClientRect(), q=t.getBoundingClientRect();
    const rows=[...c.querySelectorAll('.mr')].map(m=>m.getBoundingClientRect());
    const ovRow=rows.some(m=>Math.min(m.right,q.right)-Math.max(m.left,q.left)>0.5&&Math.min(m.bottom,q.bottom)-Math.max(m.top,q.top)>0.5);
    const ovCard=rects.filter(o=>o.id!==c.id).filter(o=>Math.min(o.r.right,q.right)-Math.max(o.r.left,q.left)>0.5&&Math.min(o.r.bottom,q.bottom)-Math.max(o.r.top,q.top)>0.5).map(o=>o.id);
    return {id:c.id,cls:t.className,txt:t.textContent,card:[r.left,r.top,r.right,r.bottom].map(v=>+v.toFixed(1)),tog:[q.left,q.top,q.right,q.bottom].map(v=>+v.toFixed(1)),w:+q.width.toFixed(1),h:+q.height.toFixed(1),ovRow,ovCard}; }).filter(Boolean); })()`;
async function measure(){ return page.evaluate(MEASURE); }
async function hitAll(){ return page.evaluate(()=>[...document.querySelectorAll('.ctog')].map(t=>{ t.scrollIntoView({block:'center',inline:'center'}); const q=t.getBoundingClientRect(); const h=document.elementFromPoint((q.left+q.right)/2,(q.top+q.bottom)/2); return {ok:!!h&&(h===t||t.contains(h)),hit:h?(h.className||h.tagName):null}; })); }

for(const admin of [false,true]){
  const mode=admin?'admin':'ro';
  for(let sheet=0;sheet<2;sheet++){
    for(const dir of ['down','right','left']){
      await load(admin);
      await page.evaluate(([s,dir])=>{ switchSheet(s); OPT.orient=dir; autoLayout(); render(); doZoomAbs(100); },[sheet,dir]);
      await page.waitForTimeout(200);
      const ts=await measure();
      const po=await page.evaluate(()=>SHEETS[CUR_SHEET].posOrient);
      const expCls=dir==='right'?'ctog ctog-r':dir==='left'?'ctog ctog-l':'ctog';
      const wrongCls=ts.filter(t=>t.cls!==expCls).length;
      let off=0; ts.forEach(o=>{ const cx=(o.tog[0]+o.tog[2])/2, cy=(o.tog[1]+o.tog[3])/2; const [l,t,r,b]=o.card;
        if(dir==='down'&&!(Math.abs(cx-(l+r)/2)<=1&&Math.abs(o.tog[1]-b)<=1)) off++;
        if(dir==='right'&&!(Math.abs(o.tog[0]-r)<=1&&Math.abs(cy-(t+b)/2)<=1)) off++;
        if(dir==='left'&&!(Math.abs(o.tog[2]-l)<=1&&Math.abs(cy-(t+b)/2)<=1)) off++; });
      const ovRow=ts.filter(t=>t.ovRow).length, ovCard=ts.filter(t=>t.ovCard.length);
      const hits=await hitAll(); const miss=hits.filter(h=>!h.ok);
      note(`[${mode} s${sheet} ${dir}] toggles=${ts.length} posOrient=${po} wrongClass=${wrongCls} offEdge=${off} overlapRow=${ovRow} overlapOtherCard=${ovCard.length} hitMiss=${miss.length}`, '');
      if(wrongCls||off||ovRow||miss.length) bad(`${mode} s${sheet} ${dir}: wrongCls=${wrongCls} off=${off} ovRow=${ovRow} miss=${JSON.stringify(miss)}`);
      if(ovCard.length) bad(`${mode} s${sheet} ${dir}: toggle overlaps another card: ${JSON.stringify(ovCard.map(o=>o.id+'>'+o.ovCard))}`);
      // min gap between a parent's edge and its nearest child in this orientation (room for the toggle)
      const gap=await page.evaluate(dir=>{ let g=Infinity; S.conns.forEach(c=>{ const a=S.nodes.find(n=>n.id===c.f), b=S.nodes.find(n=>n.id===c.t); if(!a||!b) return;
        const d=dir==='down'?b.y-(a.y+nh(a)):dir==='right'?b.x-(a.x+NW):a.x-(b.x+NW); g=Math.min(g,d); }); return g; },dir);
      note(`[${mode} s${sheet} ${dir}] min parent-child gap (canvas px)`, gap);
      // screenshot around the first toggle
      if(ts.length){ await page.evaluate(id=>document.getElementById(id).scrollIntoView({block:'center',inline:'center'}),ts[0].id); await page.waitForTimeout(100);
        const r=await page.evaluate(id=>{ const q=document.getElementById(id).getBoundingClientRect(); return {x:q.left,y:q.top,w:q.width,h:q.height}; },ts[0].id);
        await page.screenshot({path:`${SHOTS}/${mode}-s${sheet}-${dir}.png`,clip:{x:Math.max(0,r.x-120),y:Math.max(0,r.y-60),width:r.w+240,height:r.h+140}}); }
      // tooltip on the last member row of a card with a toggle
      const hv=await page.evaluate(()=>{ const c=[...document.querySelectorAll('.nd')].find(c=>c.querySelector('.ctog')&&c.querySelectorAll('.mr').length>=1&&getComputedStyle(c).display!=='none'); if(!c) return null; const rows=c.querySelectorAll('.mr'); const m=rows[rows.length-1]; m.scrollIntoView({block:'center',inline:'center'}); const r=m.getBoundingClientRect(); return {x:(r.left+r.right)/2,y:r.bottom-2}; });
      if(hv){ await page.mouse.move(hv.x-5,hv.y-30); await page.mouse.move(hv.x,hv.y,{steps:4}); await page.waitForTimeout(700);
        const shown=await page.evaluate(()=>{ const e=document.getElementById('mtip'); return !!e&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>0; });
        if(!shown) bad(`${mode} s${sheet} ${dir}: no tooltip 2px above the bottom of the last member row`); await page.mouse.move(5,5); }
      // fold via real click, check, unfold
      const f=await page.evaluate(()=>{ const kid={}; S.conns.forEach(c=>(kid[c.f]=kid[c.f]||[]).push(c.t)); const p=S.nodes.find(n=>(kid[n.id]||[]).length&&document.querySelector('#n'+CSS.escape(n.id)+' .ctog')); if(!p) return null; const t=document.querySelector('#n'+CSS.escape(p.id)+' .ctog'); t.scrollIntoView({block:'center',inline:'center'}); const q=t.getBoundingClientRect(); return {id:p.id,desc:[...collDesc(p.id)],x:(q.left+q.right)/2,y:(q.top+q.bottom)/2,x0:S.nodes.find(n=>n.id===p.id).x}; });
      if(f){ await page.mouse.click(f.x,f.y); await page.waitForTimeout(200);
        const st=await page.evaluate(([id,desc])=>({hidden:desc.every(k=>{const e=document.getElementById('n'+k); return !e||getComputedStyle(e).display==='none';}), txt:document.querySelector('#n'+CSS.escape(id)+' .ctog').textContent, cls:document.querySelector('#n'+CSS.escape(id)+' .ctog').className, sel:document.getElementById('n'+id).classList.contains('sel'), x:S.nodes.find(n=>n.id===id).x, cfrom:S.cfrom}),[f.id,f.desc]);
        if(!st.hidden) bad(`${mode} s${sheet} ${dir}: click did not fold ${f.id}`);
        if(st.txt!=='+'+f.desc.length) bad(`${mode} s${sheet} ${dir}: folded toggle text ${st.txt} != +${f.desc.length}`);
        if(st.cls!==expCls) bad(`${mode} s${sheet} ${dir}: folded toggle class ${st.cls}`);
        if(st.sel) bad(`${mode} s${sheet} ${dir}: clicking the toggle selected the card`);
        if(st.x!==f.x0) bad(`${mode} s${sheet} ${dir}: card moved on toggle click`);
        const ts2=await measure(); const o2=ts2.find(t=>t.id==='n'+f.id); if(o2&&(o2.ovRow||o2.ovCard.length)) bad(`${mode} s${sheet} ${dir}: folded toggle overlaps row/card ${JSON.stringify(o2)}`);
        await page.screenshot({path:`${SHOTS}/${mode}-s${sheet}-${dir}-folded.png`,clip:{x:Math.max(0,f.x-200),y:Math.max(0,f.y-120),width:400,height:240}});
        // print with the fold
        const pr=await page.evaluate(()=>{ const b=_chartBounds(); const H=collHidden(); const inside=S.nodes.filter(n=>!H.has(n.id)).every(n=>n.x>=b.x0-0.01&&n.y>=b.y0-0.01&&n.x+NW<=b.x1+0.01&&n.y+nh(n)<=b.y1+0.01); const hiddenOut=S.nodes.filter(n=>H.has(n.id)).some(n=>n.x<b.x0-2||n.y<b.y0-2||n.x+NW>b.x1+2||n.y+nh(n)>b.y1+2); const sc=S.scale; preparePrint(); const tf=document.getElementById('canvas').style.transform; const printing=document.body.classList.contains('printing'); restorePrint(); return {inside,hiddenOut,tf,printing,scaleSame:S.scale===sc,tfBack:document.getElementById('canvas').style.transform,printingOff:!document.body.classList.contains('printing')}; });
        note(`[${mode} s${sheet} ${dir}] print folded`, pr);
        if(!pr.inside||!pr.printing||!pr.scaleSame||!pr.printingOff) bad(`${mode} s${sheet} ${dir}: print round trip ${JSON.stringify(pr)}`);
        // print screenshot (print media) once per dir in ro sheet 0
        if(!admin&&sheet===0){ await page.evaluate(()=>preparePrint()); await page.emulateMedia({media:'print'}); await page.waitForTimeout(100);
          await page.screenshot({path:`${SHOTS}/print-${dir}-folded.png`,clip:{x:0,y:0,width:1123,height:794}}); await page.emulateMedia({media:'screen'}); await page.evaluate(()=>restorePrint()); }
        // unfold with a click again
        const q2=await page.evaluate(id=>{ const t=document.querySelector('#n'+CSS.escape(id)+' .ctog'); t.scrollIntoView({block:'center',inline:'center'}); const q=t.getBoundingClientRect(); return {x:(q.left+q.right)/2,y:(q.top+q.bottom)/2}; },f.id);
        await page.mouse.click(q2.x,q2.y); await page.waitForTimeout(200);
        const un=await page.evaluate(desc=>desc.every(k=>{const e=document.getElementById('n'+k); return e&&getComputedStyle(e).display!=='none';}),f.desc);
        if(!un) bad(`${mode} s${sheet} ${dir}: second click did not unfold`);
      }
    }
  }
}
// zoom levels: on-screen size and hit test (ro, sheet 0, each orientation)
for(const dir of ['down','right','left']){
  await load(false); await page.evaluate(dir=>{ OPT.orient=dir; autoLayout(); render(); },dir);
  for(const z of [15,25,33,50,75,100,150,200,300]){
    const r=await page.evaluate(z=>{ doZoomAbs(z); const k=getComputedStyle(document.documentElement).getPropertyValue('--ctog-k').trim(); const ts=[...document.querySelectorAll('.ctog')]; const sizes=ts.map(t=>{ t.scrollIntoView({block:'center',inline:'center'}); const q=t.getBoundingClientRect(); const h=document.elementFromPoint((q.left+q.right)/2,(q.top+q.bottom)/2); return {w:+q.width.toFixed(1),h:+q.height.toFixed(1),hit:!!h&&(h===t||t.contains(h))}; }); return {k,min:Math.min(...sizes.map(s=>Math.min(s.w,s.h))),max:Math.max(...sizes.map(s=>Math.max(s.w,s.h))),miss:sizes.filter(s=>!s.hit).length}; },z);
    note(`[zoom ${dir} ${z}%]`, r);
    if(r.min<9) bad(`zoom ${dir} ${z}%: toggle ${r.min}px on screen`);
    if(r.miss) bad(`zoom ${dir} ${z}%: ${r.miss} toggles not hit at centre`);
    if(z===15||z===33||z===300){ await page.screenshot({path:`${SHOTS}/zoom-${dir}-${z}.png`}); }
  }
}
// admin: toggle stops drag / connect; undo-redo keeps toggles right; save-reload round trip
await load(true); await page.evaluate(()=>{ OPT.orient='right'; autoLayout(); render(); doZoomAbs(100); });
{
  const f=await page.evaluate(()=>{ const t=document.querySelector('.ctog'); const c=t.closest('.nd'); t.scrollIntoView({block:'center',inline:'center'}); const q=t.getBoundingClientRect(); const nd=S.nodes.find(n=>'n'+n.id===c.id); return {id:nd.id,x:nd.x,y:nd.y,cx:(q.left+q.right)/2,cy:(q.top+q.bottom)/2}; });
  await page.mouse.move(f.cx,f.cy); await page.mouse.down(); await page.mouse.move(f.cx+120,f.cy+80,{steps:5}); await page.mouse.up(); await page.waitForTimeout(100);
  const after=await page.evaluate(id=>{ const n=S.nodes.find(n=>n.id===id); return {x:n.x,y:n.y,drag:S.drag,folded:collState().has(id)}; },f.id);
  note('[admin] drag from toggle', after); if(after.x!==f.x||after.y!==f.y) bad('dragging from the toggle moved the card'); if(after.folded) bad('mousedown+move on toggle folded the card');
  // connect mode
  await page.evaluate(()=>toggleConnect()); await page.mouse.click(f.cx,f.cy); await page.waitForTimeout(150);
  const cm=await page.evaluate(id=>({cfrom:S.cfrom,cmode:S.cmode,folded:collState().has(id)}),f.id); note('[admin] connect-mode click on toggle', cm);
  if(cm.cfrom) bad('toggle click in connect mode started a connection'); if(!cm.folded) bad('toggle click in connect mode did not fold');
  await page.mouse.click(f.cx,f.cy); await page.waitForTimeout(150); await page.evaluate(()=>{ if(S.cmode) toggleConnect(); });
  // undo/redo: drag the card by its header, then undo, redo; toggles must stay on the right edge
  const hd=await page.evaluate(id=>{ const el=document.getElementById('n'+id); el.scrollIntoView({block:'center',inline:'center'}); const q=el.querySelector('.nh').getBoundingClientRect(); return {x:(q.left+q.right)/2,y:(q.top+q.bottom)/2}; },f.id);
  await page.mouse.move(hd.x,hd.y); await page.mouse.down(); await page.mouse.move(hd.x+60,hd.y+40,{steps:5}); await page.mouse.up(); await page.waitForTimeout(200);
  const moved=await page.evaluate(id=>{ const n=S.nodes.find(n=>n.id===id); return {x:n.x,y:n.y}; },f.id); note('[admin] dragged card', moved);
  if(moved.x===f.x&&moved.y===f.y) bad('dragging the card header did not move it (test harness issue?)');
  await page.evaluate(()=>undoEdit()); await page.waitForTimeout(150);
  const u=await page.evaluate(id=>{ const n=S.nodes.find(n=>n.id===id); const t=document.querySelector('#n'+CSS.escape(id)+' .ctog'); return {x:n.x,y:n.y,cls:t&&t.className,n:document.querySelectorAll('.ctog').length}; },f.id); note('[admin] after undo', u);
  if(u.x!==f.x||u.y!==f.y) bad('undo did not restore the position'); if(u.cls!=='ctog ctog-r') bad('toggle class after undo: '+u.cls);
  await page.evaluate(()=>redoEdit()); await page.waitForTimeout(150);
  const rd=await page.evaluate(id=>{ const n=S.nodes.find(n=>n.id===id); const t=document.querySelector('#n'+CSS.escape(id)+' .ctog'); return {x:n.x,y:n.y,cls:t&&t.className}; },f.id); note('[admin] after redo', rd);
  if(rd.x!==moved.x||rd.y!==moved.y) bad('redo did not re-apply the move'); if(rd.cls!=='ctog ctog-r') bad('toggle class after redo: '+rd.cls);
  // save & reload round trip with a fold on sheet 0 (right) and sheet 1 in 'left'
  const rt=await page.evaluate(()=>{ collToggle(S.nodes.find(n=>document.querySelector('#n'+CSS.escape(n.id)+' .ctog')).id); switchSheet(1); OPT.orient='left'; autoLayout(); render(); switchSheet(0);
    const before={pos:SHEETS.map(s=>s.nodes.map(n=>n.id+':'+n.x+','+n.y).join(';')),po:SHEETS.map(s=>s.posOrient),coll:[...collState()]};
    const data=JSON.parse(JSON.stringify(_fileData())); _adoptData(data,false); _finishLoad(true); switchSheet(0); render();
    const after={pos:SHEETS.map(s=>s.nodes.map(n=>n.id+':'+n.x+','+n.y).join(';')),po:SHEETS.map(s=>s.posOrient),coll:[...collState()]};
    const cls0=[...document.querySelectorAll('.ctog')].map(t=>t.className); switchSheet(1); render(); const cls1=[...document.querySelectorAll('.ctog')].map(t=>t.className);
    return {same:JSON.stringify(before)===JSON.stringify(after),before,after,cls0:[...new Set(cls0)],cls1:[...new Set(cls1)]}; });
  note('[admin] save/reload', {same:rt.same,po:rt.after.po,coll:rt.after.coll,cls0:rt.cls0,cls1:rt.cls1});
  if(!rt.same) bad('save/reload changed positions/posOrient/fold: '+JSON.stringify(rt));
  if(rt.cls0.join()!=='ctog ctog-r'||rt.cls1.join()!=='ctog ctog-l') bad('toggle classes after reload: '+rt.cls0+' / '+rt.cls1);
}
// PNG export (ro, down, one fold) — capture the blob
await load(false); await page.evaluate(()=>{ OPT.orient='down'; autoLayout(); render(); });
{
  const png=await page.evaluate(async()=>{ return await new Promise(res=>{ const orig=HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click=function(){ const h=this.href; HTMLAnchorElement.prototype.click=orig; fetch(h).then(r=>r.blob()).then(b=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.readAsDataURL(b); }); }; exportPNG(); setTimeout(()=>res(null),8000); }); });
  if(!png) bad('PNG export produced nothing'); else fs.writeFileSync(`${SHOTS}/export.png`,Buffer.from(png.split(',')[1],'base64'));
  note('[png] bytes', png?png.length:0);
}
// contrast of the pill on light custom colours and on the PNG counterpart
await load(false);
{
  const cr=await page.evaluate(()=>{ const n=S.nodes.find(n=>(n.m||[]).length); n.color='#FFFFFF'; render(); doZoomAbs(200); const c=document.getElementById('n'+n.id); const k=c.querySelector('.ncnt'); const hb=getComputedStyle(c.querySelector('.nh')).backgroundColor, kb=getComputedStyle(k).backgroundColor; return {hb,kb,ring:getComputedStyle(k).boxShadow}; });
  note('[pill on white header]', cr);
  const r=await page.evaluate(()=>{ const n=S.nodes.find(n=>n.color==='#FFFFFF'); const c=document.getElementById('n'+n.id); c.scrollIntoView({block:'center',inline:'center'}); const q=c.getBoundingClientRect(); return {x:q.left-10,y:q.top-10,w:q.width+20,h:q.height+20}; });
  await page.screenshot({path:`${SHOTS}/pill-white-header.png`,clip:{x:r.x,y:r.y,width:r.w,height:r.h}});
}
console.log('warnings:',warns.length,warns.slice(0,5)); console.log('errors:',errors.length,errors.slice(0,10));
console.log('FINDINGS', findings.length); findings.forEach(f=>console.log(' - '+f));
await browser.close();
