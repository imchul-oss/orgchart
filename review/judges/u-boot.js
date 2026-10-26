async page => {
  const out = { errors: [], fails: [], info: {} };
  const fail = m => out.fails.push(m);
  const URL = '__PAGE__';
  async function run(tag, init, fn) {
    const p = await page.context().newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    if (init) await p.addInitScript(init);
    await p.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
    const t0 = Date.now(); await p.goto(URL, { waitUntil: 'domcontentloaded' });
    let first = -1;
    for (let i = 0; i < 60; i++) { const n = await p.evaluate(() => document.querySelectorAll('.nd').length); if (n > 0) { first = Date.now() - t0; break; } await p.waitForTimeout(100); }
    out.info[tag + '_first_ms'] = first;
    try { await fn(p, first); } catch (e) { fail(tag + ': judge exception ' + e); }
    errs.forEach(e => fail(tag + ': page error ' + e));
    await p.close();
  }
  const HANG = () => { indexedDB.open = function () { return {}; }; };
  const BLOCK = () => { indexedDB.open = function () { const r = {}; setTimeout(() => { if (r.onblocked) r.onblocked(new Event('blocked')); }, 50); return r; }; };
  const LATE = () => { const o = indexedDB.open.bind(indexedDB); indexedDB.open = function (...a) { const real = o(...a); const r = {};
      real.onupgradeneeded = e => { r.result = real.result; if (r.onupgradeneeded) r.onupgradeneeded(e); };
      real.onsuccess = e => setTimeout(() => { r.result = real.result; if (r.onsuccess) r.onsuccess(e); }, 4000);
      real.onerror = e => { r.error = real.error; if (r.onerror) r.onerror(e); }; return r; }; };
  await run('I1', HANG, async (p, f) => { if (f < 0) fail('I1: no card drawn within 6 s'); else if (f > 1000) fail('I1: first card at ' + f + ' ms, want <= 1000'); });
  await run('I2', BLOCK, async (p, f) => { if (f < 0 || f > 1000) fail('I2: first card at ' + f + ' ms, want <= 1000'); });
  await run('I3', LATE, async (p, f) => { if (f < 0 || f > 1000) fail('I3: first card at ' + f + ' ms, want <= 1000');
    const n1 = await p.evaluate(() => document.querySelectorAll('.nd').length); await p.waitForTimeout(Math.max(0, 5000 - f));
    const n2 = await p.evaluate(() => document.querySelectorAll('.nd').length); if (n1 !== n2) fail('I3: card count changed ' + n1 + ' -> ' + n2); });
  await run('I4', null, async p => { const r = await p.evaluate(async () => { const T = async f => { const t = Date.now(); const v = await f(); return [v, Date.now() - t]; };
      const a = await T(() => _idb.set('zz-judge', 5)); const b = await T(() => _idb.get('zz-judge')); const c = await T(() => _idb.del('zz-judge')); const d = await T(() => _idb.get('zz-judge'));
      return { ms: [a[1], b[1], c[1], d[1]], got: b[0], after: d[0] === undefined }; });
    out.info.I4 = r; if (r.got !== 5) fail('I4: get returned ' + r.got); if (!r.after) fail('I4: del did not remove'); if (r.ms.some(x => x > 1000)) fail('I4: slow ' + r.ms); });
  await run('I5', HANG, async p => { const r = await p.evaluate(() => Promise.race([_idb.get('x').then(() => 'resolved', () => 'rejected'), new Promise(s => setTimeout(() => s('hung'), 2600))]));
    if (r !== 'rejected') fail('I5: _idb.get under a silent open -> ' + r); });
  const FAKE = () => { const data = { v: 2, app: 'ssb-orgchart', sheets: [{ name: 'ZZ', nodes: [{ id: 'zz_file', en: 'ZZFILE', ko: '', type: 'top', x: 100, y: 100, m: [{ n: 'ZZ', r: '뗘쪄', s: 'active' }] }], conns: [] }], activeSheet: 0 };
    const handle = { name: 'zz.json', kind: 'file', queryPermission: async () => 'granted', requestPermission: async () => 'granted', getFile: async () => new File([JSON.stringify(data)], 'zz.json', { type: 'application/json', lastModified: 1 }) };
    const store = { handle }; const req = (v, delay) => { const r = {}; setTimeout(() => { r.result = v; if (r.onsuccess) r.onsuccess({ target: r }); }, delay || 0); return r; };
    const os = { get: k => req(store[k]), put: (v, k) => { store[k] = v; return req(undefined); }, delete: k => { delete store[k]; return req(undefined); } };
    const db = { transaction: () => ({ objectStore: () => os }), close: () => {} };
    indexedDB.open = function () { const r = {}; setTimeout(() => { r.result = db; if (r.onsuccess) r.onsuccess({ target: r }); }, 20); return r; }; };
  await run('I6', FAKE, async p => { let ok = false; for (let i = 0; i < 25; i++) { ok = await p.evaluate(() => typeof FILE_CONNECTED !== 'undefined' && FILE_CONNECTED && S.nodes.some(n => n.id === 'zz_file')); if (ok) break; await p.waitForTimeout(100); }
    if (!ok) fail('I6: stored file handle did not win over the browser copy within 2.5 s'); });
  await run('E', null, async () => {});
  out.RESULT = out.fails.length ? 'RED ' + out.fails.length : 'GREEN';
  return out;
}