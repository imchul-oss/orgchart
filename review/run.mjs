// Runs the browser judges listed in review/units.json against a page, on the fake data in review/fake-org.json.
// Usage: node review/run.mjs [--page <html path>] [--only a,b] [--base]
//   default page: org-chart-local.html (the candidate). Units with "new": true are the judges of the change being
//   built; the others are regression judges of earlier changes. --base runs only the new judges against the base page
//   (review/refs/base.html), where they must come out RED.
// Needs the `playwright` package and a Chromium. PW_MODULE overrides the module path, PW_CHANNEL picks an installed
// browser (chrome, msedge).
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const UNITS = JSON.parse(fs.readFileSync(path.join(HERE, 'units.json'), 'utf8'));
const useBase = args.includes('--base');
const only = opt('--only') ? opt('--only').split(',') : Object.keys(UNITS).filter(u => !useBase || UNITS[u].new);
const fileUrl = p => url.pathToFileURL(path.resolve(p)).href;

const pw = await import(process.env.PW_MODULE ? url.pathToFileURL(process.env.PW_MODULE).href : 'playwright');
const chromium = pw.chromium || (pw.default && pw.default.chromium);
const doc = fs.readFileSync(path.join(HERE, 'fake-org.json'), 'utf8');
const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
let red = 0;
for (const u of only) {
  const U = UNITS[u];
  const pagePath = useBase ? path.join(HERE, 'refs/base.html') : (opt('--page') || path.join(ROOT, 'org-chart-local.html'));
  let src = fs.readFileSync(path.join(HERE, 'judges', U.judge), 'utf8');
  src = src.split('\n').filter(l => !l.startsWith('//')).join('\n'); // comments first: the header names the placeholders
  src = src.split('__DOC__').join(doc).split('__PAGE__').join(fileUrl(pagePath));
  if (U.ref) src = src.split('__REF__').join(fileUrl(path.join(HERE, U.ref)));
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await ctx.newPage();
  let res;
  try {
    const fn = (0, eval)('(' + src.trim() + ')');
    res = JSON.parse(await fn(page));
  } catch (e) {
    res = { RESULT: 'ERROR', fails: [String(e && e.stack || e).slice(0, 800)], errors: [], info: {} };
  }
  await ctx.close();
  if (res.RESULT !== 'GREEN') red++;
  console.log('== ' + u + (U.new ? ' (new)' : '') + ' on ' + path.relative(ROOT, pagePath) + ': ' + res.RESULT + ' (' + res.fails.length + ' fails)');
  res.fails.slice(0, 40).forEach(f => console.log('   ' + f));
  if (Object.keys(res.info || {}).length) console.log('   info ' + JSON.stringify(res.info).slice(0, 300));
}
await browser.close();
console.log(useBase ? 'BASE RUN (each new judge should be RED): ' + red + ' of ' + only.length + ' RED' : 'RESULT ' + (red ? 'RED' : 'GREEN') + ' ' + (only.length - red) + '/' + only.length);
process.exit(useBase ? 0 : (red ? 1 : 0));
