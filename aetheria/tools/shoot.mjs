import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.SHOT_DIR || '/tmp/shots';

const steps = JSON.parse(process.env.STEPS || '[]');
const b = await chromium.launch();
const p = await b.newPage({ viewport:{ width:420, height:760 }, deviceScaleFactor:1 });
const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + '\n' + (e.stack||'').split('\n').slice(0,4).join('\n')));
await p.goto('file://' + root + '/index.html');
await p.evaluate(() => localStorage.clear());
await p.reload();
await p.waitForTimeout(250);
await p.click('#bstart');
await p.waitForTimeout(500);

const rect = await p.evaluate(() => { const r = document.getElementById('screen').getBoundingClientRect();
  return { x:r.left, y:r.top, w:r.width, h:r.height }; });
const MX = vx => rect.x + vx*rect.w/360, MY = vy => rect.y + vy*rect.h/640;

for (const s of steps) {
  if (s.eval) await p.evaluate(s.eval);
  if (s.click) await p.mouse.click(MX(s.click[0]), MY(s.click[1]));
  if (s.drag) { await p.mouse.move(MX(s.drag[0]), MY(s.drag[1])); await p.mouse.down();
                const n = s.steps || 10;
                for (let i=1;i<=n;i++) { await p.mouse.move(MX(s.drag[0]+(s.drag[2]-s.drag[0])*i/n), MY(s.drag[1]+(s.drag[3]-s.drag[1])*i/n)); await p.waitForTimeout(16); }
                await p.mouse.up(); }
  if (s.hover) await p.mouse.move(MX(s.hover[0]), MY(s.hover[1]));
  await p.waitForTimeout(s.wait == null ? 450 : s.wait);
  if (s.shot) await p.screenshot({ path: OUT + '/' + s.shot + '.png' });
}
const scene = await p.evaluate(() => Game.sceneName);
console.log('final scene:', scene);
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no console errors');
await b.close();
