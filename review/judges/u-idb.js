// Judge for ORGCHART-IDB (2026-10-17), written before the code. Substitute __PAGE__.
// Boot must not wait forever on IndexedDB: _idb._open() gives up after 1.5 s (and at once on 'blocked'), so boot
// falls back to the browser copy (loadFromLocal) and the chart draws.
// (I1) open never answers: cards drawn, first seen between 1.2 s and 2.6 s after load;
// (I2) open reports 'blocked' and never succeeds: cards drawn within 1.0 s;
// (I3) open answers late (4 s): cards drawn by 2.6 s, no page error up to 5 s, card count unchanged after the late answer;
// (I4) normal IndexedDB: _idb set/get/del round trip works, each call under 1 s;
// (I5) open never answers: _idb.get('x') rejects (does not hang) within 2.6 s;
// (E) no page errors on a normal load.
async page => {
  const out = { errors: [], fails: [], info: {} };
  const fail = m => out.fails.push(m);
  const URL = '__PAGE__';
  async function run(tag, init, fn) {
    const p = await page.context().newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    if (init) await p.addInitScript(init);
    await p.addInitScript(d => { try { localStorage.clear(); const ns = (location.pathname.split('/').pop() || '').replace(/[^a-zA-Z0-9._-]/g, '_') || 'default'; localStorage.setItem('ssb-org-chart__' + ns + '-v1', d); } catch (e) {} }, JSON.stringify(__DOC__)); /* kit: seed fake data */
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
  await run('I1', HANG, async (p, f) => { if (f < 0) fail('I1: no card drawn within 6 s'); else if (f < 1200 || f > 2600) fail('I1: first card at ' + f + ' ms, want 1200-2600'); });
  await run('I2', BLOCK, async (p, f) => { if (f < 0 || f > 1000) fail('I2: first card at ' + f + ' ms, want <= 1000'); });
  await run('I3', LATE, async (p, f) => { if (f < 0 || f > 2600) fail('I3: first card at ' + f + ' ms, want <= 2600');
    const n1 = await p.evaluate(() => document.querySelectorAll('.nd').length); await p.waitForTimeout(Math.max(0, 5000 - f));
    const n2 = await p.evaluate(() => document.querySelectorAll('.nd').length); if (n1 !== n2) fail('I3: card count changed ' + n1 + ' -> ' + n2); });
  await run('I4', null, async p => { const r = await p.evaluate(async () => { const T = async f => { const t = Date.now(); const v = await f(); return [v, Date.now() - t]; };
      const a = await T(() => _idb.set('zz-judge', 5)); const b = await T(() => _idb.get('zz-judge')); const c = await T(() => _idb.del('zz-judge')); const d = await T(() => _idb.get('zz-judge'));
      return { ms: [a[1], b[1], c[1], d[1]], got: b[0], after: d[0] === undefined }; });
    out.info.I4 = r; if (r.got !== 5) fail('I4: get returned ' + r.got); if (!r.after) fail('I4: del did not remove'); if (r.ms.some(x => x > 1000)) fail('I4: slow ' + r.ms); });
  await run('I5', HANG, async p => { const r = await p.evaluate(() => Promise.race([_idb.get('x').then(() => 'resolved', () => 'rejected'), new Promise(s => setTimeout(() => s('hung'), 2600))]));
    if (r !== 'rejected') fail('I5: _idb.get under a silent open -> ' + r); });
  await run('E', null, async () => {});
  out.verdict = out.fails.length ? 'RED ' + out.fails.length : 'GREEN';
  return out;
}
