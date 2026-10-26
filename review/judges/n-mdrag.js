async page => {
  const DOC = __DOC__;
  const out = { errors: [], fails: [] };
  page.on('pageerror', e => out.errors.push(String(e)));
  await page.setViewportSize({ width: 1600, height: 950 });
  await page.goto('__PAGE__'); await page.waitForTimeout(400);
  await page.evaluate(d => { try{localStorage.clear();}catch(e){} _adoptData(JSON.parse(JSON.stringify(d)),false); _finishLoad(true); ADMIN=true; applyRO();
    const n=S.nodes.find(n=>(n.m||n.members||[]).length>=3) || S.nodes.find(n=>Array.isArray(n.m)&&n.m.length>=3); openEdit(n.id); }, DOC);
  await page.waitForTimeout(300);
  const names = () => page.evaluate(() => [...document.querySelectorAll('#mlist .mer .mer-name')].map(i => i.value));
  const before = await names();
  if (before.length < 3) { out.fails.push('fixture: fewer than 3 member rows ' + before.length); }
  const inp = page.locator('#mlist .mer .mer-name').nth(1);
  await inp.scrollIntoViewIfNeeded(); const b = await inp.boundingBox();
  await page.mouse.move(b.x + 4, b.y + b.height / 2); await page.mouse.down();
  await page.mouse.move(b.x + 30, b.y + b.height / 2 + 2, { steps: 5 });
  await page.mouse.move(b.x + b.width - 4, b.y + b.height / 2 + 40, { steps: 8 });
  const mid = await page.evaluate(() => ({ dragging: !!document.querySelector('#mlist .mer.dragging'), sel: (() => { const i = document.querySelectorAll('#mlist .mer .mer-name')[1]; return i.selectionEnd - i.selectionStart; })() }));
  await page.mouse.up(); await page.waitForTimeout(150);
  const after1 = await names();
  if (mid.dragging) out.fails.push('M1: row drag started from the name input');
  if (!(mid.sel > 0)) out.fails.push('M1: no text selected in the name input (sel ' + mid.sel + ')');
  if (JSON.stringify(after1) !== JSON.stringify(before)) out.fails.push('M1: row order changed');
  const h = page.locator('#mlist .mer .mer-drag').nth(0), t = page.locator('#mlist .mer').nth(2);
  await h.dragTo(t, { targetPosition: { x: 20, y: 40 } }); await page.waitForTimeout(150);
  const after2 = await names();
  if (after2[0] === before[0]) out.fails.push('M2: handle drag did not reorder ' + JSON.stringify(after2.slice(0,3)));
  out.info = { mid, n: before.length };
  out.RESULT = (out.fails.length || out.errors.length) ? 'RED ' + (out.fails.length + out.errors.length) : 'GREEN';
  return out;
}