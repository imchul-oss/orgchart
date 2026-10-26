// Clean PNG check on the 987-card sheet after 982cdb8: canvas size, blob size, message, blank or not.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url';
const [pagePath, dataPath, outPath] = process.argv.slice(2); const DATA = fs.readFileSync(dataPath, 'utf8');
const b = await chromium.launch(); const page = await (await b.newContext({ viewport: { width: 1920, height: 1080 } })).newPage(); page.on('dialog', d => d.accept().catch(() => {}));
await page.goto(url.pathToFileURL(path.resolve(pagePath)).href); await page.waitForTimeout(400);
const R = await page.evaluate(async RAW => {
  const w = ms => new Promise(r => setTimeout(r, ms)); const now = () => performance.now(); const alerts = []; window.alert = m => alerts.push(String(m)); HTMLAnchorElement.prototype.click = function () {};
  const blobs = []; const tb = HTMLCanvasElement.prototype.toBlob; HTMLCanvasElement.prototype.toBlob = function (cb, type) { const W = this.width, H = this.height, t = now(); return tb.call(this, bl => { blobs.push({ W, H, bytes: bl ? bl.size : null, encodeMs: Math.round(now() - t) }); cb(bl); }, type); };
  loadObject(JSON.parse(RAW), false); ADMIN = true; applyRO(); await w(50); const R = {};
  const tabBtn = tab => [...document.querySelectorAll('#statsfl .sfl-tab')].find(x => (x.getAttribute('onclick') || '').indexOf("'" + tab + "'") >= 0); statsflSetCollapsed(false);
  for (const [i, tab] of [[0, 'summary'], [0, 'team'], [2, 'summary'], [1, 'summary']]) { switchSheet(i); autoLayout(); render(); _sflSetScope('cur'); switchStatTab(tabBtn(tab), tab); alerts.length = 0; const c0 = blobs.length; const t = now(); exportPNG(); const drawMs = Math.round(now() - t); let wt = 0; while (blobs.length === c0 && wt < 60000) { await w(100); wt += 100; } const bl = blobs[c0]; R['sheet' + i + ' ' + tab] = { drawMs, waitMs: wt, canvas: bl && [bl.W, bl.H], blobBytes: bl && bl.bytes, encodeMs: bl && bl.encodeMs, blank: bl ? bl.bytes === null : 'no blob', scaleK: +Math.min(2, 32000 / ((bl.W) / Math.min(2, 1))).toFixed(2), messages: alerts.slice() }; }
  return R; }, DATA);
fs.writeFileSync(outPath, JSON.stringify(R, null, 1)); console.log(JSON.stringify(R, null, 1)); await b.close();
