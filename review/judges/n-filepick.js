async page => {
  const AFTER = __OWNER20__;
  const out = { errors: [], fails: [], info: {} };
  const fail = m => { if (out.fails.length < 40) out.fails.push(m); };
  const J = JSON.stringify;
  const STUB = `window.__calls=[]; window.__mkH=function(name,txt){ return { kind:'file', name:name, __tag:name,
      getFile: async()=>new File([txt],name,{type:'application/json',lastModified:1700000000000}),
      queryPermission: async()=>'granted', requestPermission: async()=>'granted', isSameEntry: async(o)=>o===this,
      createWritable: async()=>({ write: async()=>{}, close: async()=>{} }) }; };
    window.showOpenFilePicker=async function(o){ window.__calls.push({k:'open',id:o&&o.id,si:o&&o.startIn?(o.startIn.__tag||String(o.startIn)):null});
      if(window.__rejectStartIn&&o&&o.startIn) throw new TypeError('bad startIn'); return [window.__mkH(window.__nextName||'a.json',window.__txt)]; };
    window.showSaveFilePicker=async function(o){ window.__calls.push({k:'save',id:o&&o.id,si:o&&o.startIn?(o.startIn.__tag||String(o.startIn)):null}); return window.__mkH('new.json',''); };`;
  page.on('pageerror', e => out.errors.push(String(e)));
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  const r = await page.evaluate(async ([A, STUB]) => { const w = ms => new Promise(res => setTimeout(res, ms));
    try{localStorage.clear();}catch(e){} window.alert = m => { (window.__al = window.__al || []).push(String(m)); }; window.confirm = () => true;
    (0, eval)(STUB); window.__txt = JSON.stringify(A);
    loadObject(JSON.parse(JSON.stringify(A)), false); ADMIN = true; applyRO(); render();
    const R = {};
    window.__nextName = 'first.json'; await pickFile(); await w(50);
    window.__nextName = 'second.json'; await pickFile(); await w(50);
    window.__rejectStartIn = true; window.__nextName = 'third.json'; await pickFile(); await w(50); window.__rejectStartIn = false;
    R.name = FILE_NAME; R.conn = FILE_CONNECTED;
    ADMIN = true; applyRO(); await createNewFile(); await w(50);  // the owner file carries its own admin hash and drops admin on load
    R.calls = window.__calls; R.al = window.__al || [];
    R.ls = Object.keys(localStorage).filter(k => { try { return /third\.json|new\.json/.test(localStorage.getItem(k)); } catch (e) { return false; } }).map(k => [k, localStorage.getItem(k)]);
    return R; }, [AFTER, STUB]);
  out.info.r = r;
  const opens = r.calls.filter(c => c.k === 'open'), saves = r.calls.filter(c => c.k === 'save');
  if (opens.length < 3 || opens.some(c => c.id !== 'orgchart-data')) fail('F1 open picker id ' + J(opens));
  if (!saves.length || saves.some(c => c.id !== 'orgchart-data')) fail('F1 save picker id ' + J(saves));
  if (opens[0] && opens[0].si) fail('F1 first picker should have no remembered file ' + J(opens[0]));
  if (!opens[1] || opens[1].si !== 'first.json') fail('F1 second picker startIn ' + J(opens[1]));
  const retry = opens.filter(c => c.si === 'second.json'), plain = opens.slice(2).filter(c => !c.si);
  if (!retry.length || !plain.length || r.name !== 'third.json' || !r.conn) fail('F2 retry without startIn ' + J({ opens, name: r.name, conn: r.conn, al: r.al }));
  if (!r.ls.length) fail('F3 last file name not kept');
  // F4: fresh page, IndexedDB never opens
  const ctx = page.context();
  const p2 = await ctx.newPage(); const e2 = []; p2.on('pageerror', e => e2.push(String(e)));
  await p2.addInitScript(STUB + `;(function(){ const req = () => { const r = {}; return r; }; try { Object.defineProperty(window, 'indexedDB', { value: { open: () => req() }, configurable: true }); } catch (e) {} })();`);
  await p2.setViewportSize({ width: 1366, height: 768 });
  await p2.goto('__PAGE__'); await p2.waitForTimeout(2200);
  const f4 = await p2.evaluate(async () => { const w = ms => new Promise(res => setTimeout(res, ms));
    const b = document.getElementById('file-banner'); const R = { show: b.classList.contains('show') && getComputedStyle(b).display !== 'none', txt: b.textContent.trim() };
    window.__txt = '{"sheets":[{"name":"x","nodes":[],"conns":[]}]}'; window.__nextName = 'third.json';
    const btn = b.querySelector('button'); if (btn) { btn.click(); await w(2500); }  // saving the handle waits out the 1.5 s IndexedDB timeout first
    R.calls = window.__calls; R.conn = FILE_CONNECTED; R.bannerAfter = b.classList.contains('show');
    FILE_CONNECTED = false; FILE_HANDLE = null; openFileModal(); R.status = (document.getElementById('cm-status') || {}).textContent || ''; closeFileModal();
    return R; });
  out.info.f4 = f4;
  await p2.close();
  if (!f4.show || f4.txt.indexOf('new.json') < 0) fail('F4 banner with last file name ' + J({ show: f4.show, txt: f4.txt }));
  if (!f4.calls.some(c => c.k === 'open' && c.id === 'orgchart-data')) fail('F4 banner button did not open the picker ' + J(f4.calls));
  if (!f4.conn || f4.bannerAfter) fail('F4 banner stays after reconnecting ' + J({ conn: f4.conn, after: f4.bannerAfter }));
  if (!/기억하지 못/.test(f4.status) || f4.status.indexOf('third.json') < 0)  // the banner reconnect just made third.json the last file
    fail('F4 file window status ' + J(f4.status));
  if (e2.length) fail('F4 page errors ' + J(e2.slice(0, 2)));
  // F5: working IndexedDB, nothing kept
  const p3 = await ctx.newPage(); await p3.addInitScript(STUB); await p3.goto('__PAGE__');
  await p3.evaluate(() => { try { localStorage.clear(); } catch (e) {} }); await p3.reload(); await p3.waitForTimeout(800);
  const f5 = await p3.evaluate(() => document.getElementById('file-banner').classList.contains('show')); await p3.close();
  out.info.f5 = f5; if (f5) fail('F5 banner shown with nothing kept');
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}