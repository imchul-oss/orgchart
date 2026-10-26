// Full org chart regression on dummy data (2026-10-26 kit). Every judge runs in a fresh browser context.
// Usage: node review/run.mjs [--page <html>] [--only a,b] [--write-baseline] [--jobs N] [--stress]
//   --stress: run only the stress judges (x-*) on the extreme dummy; they report findings, not regressions.
//   default page: org-chart-local.html (the candidate). review/delivered.html is the last delivered build.
//   "same" judges (units.json kind) print a report that must equal review/baseline/<name>.out (dates ignored);
//   take the baseline once on the delivered build: node review/run.mjs --page review/delivered.html --write-baseline
//   A judge whose ref is "__CAND__" compares the page with itself (unit judges built after 10-20).
// Needs `playwright` (npm i playwright@1.55.0 && npx playwright install chromium).
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const units = JSON.parse(fs.readFileSync(path.join(HERE, 'judges', 'units.json'), 'utf8'));
const writeBase = args.includes('--write-baseline');
const stress = args.includes('--stress');
const only = opt('--only') ? opt('--only').split(',') : Object.keys(units).filter(u => (units[u].kind === 'stress') === stress).sort();
const jobs = +(opt('--jobs') || 2);
const fileUrl = p => url.pathToFileURL(path.resolve(p)).href;
const norm = t => t.split('\n').filter(l => !/[║╔╚]/.test(l)).join('\n').replace(/20\d{2}-\d{2}-\d{2}[T0-9:.Z+-]*/g, '').trim();
const pagePath = opt('--page') || path.join(ROOT, 'org-chart-local.html');
const data = {}; for (const f of fs.readdirSync(path.join(HERE, 'data'))) if (f.endsWith('.json')) data[f.slice(0, -5)] = fs.readFileSync(path.join(HERE, 'data', f), 'utf8');

const pw = await import(process.env.PW_MODULE ? url.pathToFileURL(process.env.PW_MODULE).href : 'playwright');
const chromium = pw.chromium || (pw.default && pw.default.chromium);
const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
const results = [];
async function runOne(u) {
  const meta = units[u]; if (!meta) return { u, bad: true, line: u + ': unknown judge' };
  let src = fs.readFileSync(path.join(HERE, 'judges', u + '.js'), 'utf8');
  for (const [ph, key] of Object.entries(meta.data || {})) src = src.split(ph).join(data[key]);
  const ref = meta.ref === '__CAND__' ? fileUrl(pagePath) : meta.ref ? fileUrl(path.join(HERE, 'refs', meta.ref)) : null;
  src = src.split('__PAGE__').join(fileUrl(pagePath)); if (ref) src = src.split('__REF__').join(ref);
  const ctx = await browser.newContext({ viewport: { width: (meta.vp || [1366])[0], height: (meta.vp || [0, 768])[1] } });
  const page = await ctx.newPage();
  let r, err = null; const t0 = Date.now();
  try { const fn = (0, eval)('(' + src.trim() + ')'); r = await fn(page); } catch (e) { err = String(e && e.stack || e).slice(0, 600); }
  await ctx.close();
  const sec = ((Date.now() - t0) / 1000).toFixed(0) + 's';
  if (err) return { u, bad: true, line: u + ': ERROR ' + err };
  if (meta.kind === 'same') {
    const txt = norm(typeof r === 'string' ? r : JSON.stringify(r));
    const bf = path.join(HERE, 'baseline', u + '.out');
    if (writeBase) { fs.writeFileSync(bf, txt); return { u, bad: false, line: u + ': baseline written' }; }
    const want = fs.existsSync(bf) ? fs.readFileSync(bf, 'utf8') : null;
    if (want !== txt) fs.writeFileSync(path.join(HERE, 'baseline', u + '.now'), txt);
    return { u, bad: want !== txt, line: u + ': ' + (want === null ? 'NO BASELINE' : want === txt ? 'same' : 'DIFF') + ' ' + sec };
  }
  const o = typeof r === 'string' ? JSON.parse(r) : r;
  try { fs.mkdirSync(path.join(HERE, 'out'), { recursive: true }); fs.writeFileSync(path.join(HERE, 'out', u + '-' + path.basename(pagePath) + '.json'), JSON.stringify(o, null, 1)); } catch (e) {}
  const verdict = o.RESULT || o.verdict || 'NO-VERDICT';
  const green = /^GREEN/.test(verdict) && !(o.errors && o.errors.length);
  const fails = (o.fails || []).slice(0, 4).join(' | ');
  return { u, bad: !green, line: u + ': ' + verdict + (o.errors && o.errors.length ? ' errors ' + o.errors.length + ' ' + String(o.errors[0]).slice(0, 160) : '') + (fails ? '  ' + fails.slice(0, 400) : '') + ' ' + sec };
}
const queue = only.slice();
await Promise.all(Array.from({ length: jobs }, async () => { while (queue.length) { const u = queue.shift(); const x = await runOne(u); results.push(x); console.log(x.line); } }));
await browser.close();
const bad = results.filter(x => x.bad);
console.log('RESULT ' + (bad.length ? 'FAIL ' + bad.length + ' (' + bad.map(x => x.u).join(',') + ')' : 'OK') + ' ' + (results.length - bad.length) + '/' + results.length + ' on ' + path.basename(pagePath));
process.exit(bad.length ? 1 : 0);
