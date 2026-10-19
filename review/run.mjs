// Runs every org chart judge in review/judges against a page, on the fake data in review/fake-org.json.
// Usage: node review/run.mjs [--page <html>] [--only a,b] [--base] [--write-baseline]
//   default page: org-chart-local.html (the candidate).
//   --base: run each unit judge (u-*) against the page it was built on (judges/bases.json); each must come out RED.
//   "same" judges (judges/units.json kind) print a report; it must equal review/baseline/<name>.out (dates ignored).
//   --write-baseline: store the current "same" reports as the baseline (the kit ships with baselines taken on the
//   unchanged candidate; do not rewrite them in the review).
// Needs `playwright` and a Chromium (npx playwright install chromium). PW_MODULE overrides the module path,
// PW_CHANNEL picks an installed browser.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const units = JSON.parse(fs.readFileSync(path.join(HERE, 'judges', 'units.json'), 'utf8'));
const bases = JSON.parse(fs.readFileSync(path.join(HERE, 'judges', 'bases.json'), 'utf8'));
const useBase = args.includes('--base');
const writeBase = args.includes('--write-baseline');
let only = opt('--only') ? opt('--only').split(',') : Object.keys(units).sort();
if (useBase) only = only.filter(u => bases[u]);
const fileUrl = p => url.pathToFileURL(path.resolve(p)).href;
const norm = t => t.split('\n').filter(l => !/[║╔╚]/.test(l)).join('\n').replace(/20\d{2}-\d{2}-\d{2}[T0-9:.Z+-]*/g, '').trim();

const pw = await import(process.env.PW_MODULE ? url.pathToFileURL(process.env.PW_MODULE).href : 'playwright');
const chromium = pw.chromium || (pw.default && pw.default.chromium);
const doc = fs.readFileSync(path.join(HERE, 'fake-org.json'), 'utf8');
const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
let bad = 0, n = 0;
for (const u of only) {
  const meta = units[u]; if (!meta) { console.log(u + ': unknown judge'); bad++; continue; }
  const pagePath = useBase ? path.join(HERE, 'refs', bases[u]) : (opt('--page') || path.join(ROOT, 'org-chart-local.html'));
  let src = fs.readFileSync(path.join(HERE, 'judges', u + '.js'), 'utf8');
  src = src.split('\n').filter(l => !l.startsWith('//')).join('\n'); // comments first: the header names the placeholders
  src = src.split('__DOC__').join(doc).split('__PAGE__').join(fileUrl(pagePath));
  if (meta.ref) src = src.split('__REF__').join(fileUrl(path.join(HERE, 'refs', meta.ref)));
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await ctx.newPage();
  let r, err = null;
  try { const fn = (0, eval)('(' + src.trim() + ')'); r = await fn(page); } catch (e) { err = String(e && e.stack || e).slice(0, 600); }
  await ctx.close();
  n++;
  if (err) { console.log(u + ': ERROR ' + err); bad++; continue; }
  if (meta.kind === 'same') {
    const txt = norm(typeof r === 'string' ? r : JSON.stringify(r));
    const bf = path.join(HERE, 'baseline', u + '.out');
    if (writeBase) { fs.writeFileSync(bf, txt); console.log(u + ': baseline written'); continue; }
    const want = fs.existsSync(bf) ? fs.readFileSync(bf, 'utf8') : null;
    const same = want === txt;
    console.log(u + ': ' + (same ? 'same' : 'DIFF'));
    if (!same) { bad++; fs.writeFileSync(path.join(HERE, 'baseline', u + '.now'), txt); }
    continue;
  }
  const o = typeof r === 'string' ? JSON.parse(r) : r;
  const verdict = o.RESULT || o.verdict || 'NO-VERDICT';
  const green = /^GREEN/.test(verdict) && !(o.errors && o.errors.length);
  const fails = (o.fails || []).slice(0, 4).join(' | ');
  console.log(u + ': ' + verdict + (o.errors && o.errors.length ? ' errors ' + o.errors.length : '') + (fails ? '  ' + fails.slice(0, 300) : ''));
  if (useBase ? green : !green) bad++;
}
await browser.close();
console.log((useBase ? 'BASE ' : '') + 'RESULT ' + (bad ? 'FAIL ' + bad : 'OK') + ' ' + (n - bad) + '/' + n);
process.exit(bad ? 1 : 0);
