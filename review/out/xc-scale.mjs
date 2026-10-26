// Scaling probe: how load, layout, render, edit checkpoint, localStorage backup and JSON export grow with the data.
// Usage: node xc-scale.mjs <page.html> <out.json> <data1.json> [data2.json ...]
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url';
const [pagePath, outPath, ...datas] = process.argv.slice(2);
const b = await chromium.launch(); const out = [];
for (const dp of datas) {
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } }); const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 200))); page.on('dialog', d => d.accept().catch(() => {}));
  await page.goto(url.pathToFileURL(path.resolve(pagePath)).href); await page.waitForTimeout(400);
  const RAW = fs.readFileSync(dp, 'utf8');
  const r = await page.evaluate(async RAW => {
    const w = ms => new Promise(r => setTimeout(r, ms)); const now = () => performance.now(); const mem = () => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null;
    window.alert = () => {}; window.confirm = () => true; const dls = []; window.dl = (t, n) => dls.push(String(t).length); HTMLAnchorElement.prototype.click = function () {};
    const X = JSON.parse(RAW); const R = { bytes: RAW.length, cards: X.sheets[0].nodes.length, members: X.sheets[0].nodes.reduce((k, n) => k + (n.m || []).length, 0), allCards: X.sheets.reduce((k, s) => k + s.nodes.length, 0) };
    let t = now(); loadObject(JSON.parse(RAW), false); ADMIN = true; applyRO(); R.loadMs = Math.round(now() - t); await w(50);
    t = now(); autoLayout(); R.autoLayoutMs = Math.round(now() - t); t = now(); render(); R.renderMs = Math.round(now() - t);
    R.canvas = [document.getElementById('canvas').scrollWidth, document.getElementById('canvas').scrollHeight]; const L = layoutLint(); R.lint = { overlap: L.overlap, broken: L.brokenN };
    t = now(); fitScreen(); R.fitScale = +S.scale.toFixed(4); R.fitMs = Math.round(now() - t);
    t = now(); S.nodes[1].x += 10; render(); scheduleSave(); _hCheckpoint(true); R.oneEditMs = Math.round(now() - t);
    t = now(); undoEdit(); R.undoMs = Math.round(now() - t);
    t = now(); _saveLocalFallback(); R.localSaveMs = Math.round(now() - t); let ok = false, len = null; try { const v = localStorage.getItem(SB_LS_KEY); len = v ? v.length : 0; ok = !!v && JSON.parse(v).sheets[0].nodes.length === S.nodes.length; } catch (e) { ok = String(e); } R.localStored = { chars: len, intact: ok };
    t = now(); exportJSON(); R.exportJsonMs = Math.round(now() - t); R.exportChars = dls[dls.length - 1];
    t = now(); tvOpen(); R.treeMs = Math.round(now() - t); R.treeRows = document.querySelectorAll('#treeview .tv-row').length; tvClose();
    const tb = [...document.querySelectorAll('#statsfl .sfl-tab')].find(x => /'team'/.test(x.getAttribute('onclick') || '')); t = now(); switchStatTab(tb, 'team'); R.teamTabMs = Math.round(now() - t);
    t = now(); srchOpen(); const si = document.getElementById('srch-input'); si.value = '김'; si.dispatchEvent(new Event('input', { bubbles: true })); R.searchMs = Math.round(now() - t); R.searchCount = document.getElementById('srch-count').textContent; srchClose();
    R.printSplitPages = printEstimate('a4split').pages; R.mem = mem();
    return R; }, RAW);
  r.data = path.basename(dp); r.errors = errors; out.push(r); console.log(JSON.stringify(r)); await ctx.close();
}
fs.mkdirSync(path.dirname(outPath), { recursive: true }); fs.writeFileSync(outPath, JSON.stringify(out, null, 1)); await b.close();
