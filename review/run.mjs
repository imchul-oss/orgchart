// Runs the acceptance judges of the 2026-10-15 org chart units against a page, on the fake data in fake-org.json.
// Usage: node review/run.mjs [--page <html path>] [--only tb,tf,rot,tree] [--base]
//   default page: org-chart-local.html (the candidate); --base runs each judge against its own base version, where it
//   must come out RED (sanity check that the judge still detects the missing feature).
// Needs the `playwright` package and a Chromium (npx playwright install chromium). PW_MODULE overrides the module path,
// PW_CHANNEL picks an installed browser (chrome, msedge) instead.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const only = (opt('--only') || 'tb,tf,rot,tree').split(',');
const useBase = args.includes('--base');
const fileUrl = p => url.pathToFileURL(path.resolve(p)).href;

// judge -> [reference page, base page]. Each unit was built on the previous one.
const UNITS = {
  tb: [null, 'refs/v0-final.html'],
  tf: ['refs/v1-tb.html', 'refs/v1-tb.html'],
  rot: ['refs/v2-tf.html', 'refs/v2-tf.html'],
  tree: ['refs/v3-rot.html', 'refs/v3-rot.html'],
};

const pw = await import(process.env.PW_MODULE ? url.pathToFileURL(process.env.PW_MODULE).href : 'playwright');
const chromium = pw.chromium || (pw.default && pw.default.chromium);
const doc = fs.readFileSync(path.join(HERE, 'fake-org.json'), 'utf8');
const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
let red = 0;
for (const u of only) {
  const [ref, base] = UNITS[u];
  const pagePath = useBase ? path.join(HERE, base) : (opt('--page') || path.join(ROOT, 'org-chart-local.html'));
  let src = fs.readFileSync(path.join(HERE, 'judges', 'VERIFY_' + u + '.js'), 'utf8');
  src = src.split('\n').filter(l => !l.startsWith('//')).join('\n'); // comments first: the header names the placeholders
  src = src.split('__DOC__').join(doc).split('__PAGE__').join(fileUrl(pagePath));
  if (ref) src = src.split('__REF__').join(fileUrl(path.join(HERE, ref)));
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await ctx.newPage();
  let res;
  try {
    const fn = (0, eval)('(' + src.trim() + ')');
    const r = await fn(page);
    res = JSON.parse(r);
  } catch (e) {
    res = { RESULT: 'ERROR', fails: [String(e && e.stack || e).slice(0, 800)], errors: [], info: {} };
  }
  await ctx.close();
  if (res.RESULT !== 'GREEN') red++;
  console.log('== ' + u + ' on ' + path.relative(ROOT, pagePath) + ': ' + res.RESULT + ' (' + res.fails.length + ' fails)');
  res.fails.slice(0, 40).forEach(f => console.log('   ' + f));
  if (Object.keys(res.info || {}).length) console.log('   info ' + JSON.stringify(res.info).slice(0, 300));
}
await browser.close();
console.log(useBase ? 'BASE RUN (each judge should be RED): ' + red + ' of ' + only.length + ' RED' : 'RESULT ' + (red ? 'RED' : 'GREEN') + ' ' + (only.length - red) + '/' + only.length);
process.exit(useBase ? 0 : (red ? 1 : 0));
