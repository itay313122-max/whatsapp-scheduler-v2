// Render an app HTML doc to an iPhone screenshot with ALL network blocked
// (proves the app is fully self-contained / offline-capable).
//   node experiments/render.mjs <in.html> <out.png>
// Uses the project's local playwright; falls back to the Playwright-managed
// Chromium if PW_CHROME isn't set.
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const [, , htmlFile, outPng] = process.argv;
if (!htmlFile || !outPng) {
  console.error('usage: node experiments/render.mjs <in.html> <out.png>');
  process.exit(1);
}

let chromium;
try { ({ chromium } = require('playwright-core')); }
catch { ({ chromium } = require('playwright')); }

const launchOpts = { args: ['--no-sandbox', '--disable-setuid-sandbox'] };
if (process.env.PW_CHROME) launchOpts.executablePath = process.env.PW_CHROME;

const errs = [];
const browser = await chromium.launch(launchOpts);
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await page.route('**', r => {
  const u = r.request().url();
  if (u.startsWith('file:') || u.startsWith('data:')) return r.continue();
  return r.abort();
});
await page.goto('file://' + path.resolve(htmlFile), { waitUntil: 'load' });
await page.waitForSelector('#root .app-shell', { timeout: 8000 });
await page.waitForTimeout(700);
await page.screenshot({ path: path.resolve(outPng) });
console.log('shot', outPng, errs.length ? ('ERRORS: ' + errs.slice(0, 5).join(' | ')) : 'clean');
await browser.close();
