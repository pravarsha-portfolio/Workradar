// Exports every WorkRadar screen as a Figma ready SVG (editable layers) plus a PNG preview.
// Usage: npm run build && npx vite preview --port 4173 &  then  npm run figma:export
// Output: docs/figma/*.svg and docs/figma/previews/*.png
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BASE = process.env.WORKRADAR_URL || 'http://localhost:4173';
const OUT = fileURLToPath(new URL('../../docs/figma/', import.meta.url));
const converter = await readFile(new URL('./dom-to-svg.js', import.meta.url), 'utf8');

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

/** Each frame: how to reach the state, and whether it is a full page or one viewport. */
const FRAMES = [
  { name: '00 Cover', url: '/styleguide.html?frame=cover' },
  { name: '01 Dashboard', run: async () => {} },
  { name: '02 Priority feed', run: async (p) => { await p.click('text=Open priority feed'); } },
  { name: '03 Item details', run: async (p) => { await p.click('button.item-title:has-text("Guest checkout")'); await p.click('text=OTP for returning guests'); await p.fill('#decision-note', 'Matches the 2025 test. Arjun, please split CHK-414 so we can start today.'); } },
  { name: '04 Decision recorded', run: async (p) => { await p.click('button.item-title:has-text("Guest checkout")'); await p.click('text=OTP for returning guests'); await p.click('text=Decide and unblock Arjun'); } },
  { name: '05 Assign dialog', viewport: true, run: async (p) => { await p.click('button.item-title:has-text("Meera shared")'); await p.click('.actionbar >> text=Assign'); } },
  { name: '06 Snooze dialog', viewport: true, run: async (p) => { await p.click('button.item-title:has-text("Zeta Retail")'); await p.click('.actionbar >> text=Snooze'); } },
  { name: '07 Nudge dialog', viewport: true, run: async (p) => { await p.click('text=Nudge Legal'); } },
  { name: '08 Search results', run: async (p) => { await p.fill('#q-top', 'launch'); await p.press('#q-top', 'Enter'); } },
  { name: '09 Search no results', run: async (p) => { await p.fill('#q-top', 'ledger rollback'); await p.press('#q-top', 'Enter'); } },
  { name: '10 Empty state', run: async (p) => { await p.click('summary'); await p.click('text=Clear all work'); } },
  { name: '11 Error state', run: async (p) => { await p.click('summary'); await p.click('text=Simulate GitHub sync failure'); } },
  { name: '12 Mobile dashboard', size: MOBILE, run: async () => {} },
  { name: '13 Mobile item details', size: MOBILE, run: async (p) => { await p.click('button.item-title:has-text("Android checkout")'); } },
  { name: '14 Design system', url: '/styleguide.html' },
];

const launchOpts = existsSync('/opt/pw-browsers/chromium') && !process.env.PLAYWRIGHT_BROWSERS_PATH ? { executablePath: '/opt/pw-browsers/chromium' } : {};
const browser = await chromium.launch(launchOpts);
await mkdir(`${OUT}previews`, { recursive: true });

for (const f of FRAMES) {
  const size = f.size ?? DESKTOP;
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
  await page.addInitScript(() => { try { localStorage.clear(); } catch { /* ignore */ } });
  await page.goto(BASE + (f.url ?? '/'));
  await page.addStyleTag({ content: '*{animation:none!important;transition:none!important;caret-color:transparent!important} .toast{display:none!important}' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  if (f.run) await f.run(page);
  await page.waitForTimeout(300);
  await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); });
  if (!f.viewport) {
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewportSize({ width: size.width, height: Math.max(size.height, h) });
    await page.waitForTimeout(150);
  }
  await page.addScriptTag({ content: converter });
  const svg = await page.evaluate((vp) => window.domToSvg(vp ? { height: innerHeight } : {}), !!f.viewport);
  const file = f.name.replace(/\s+/g, '-');
  await writeFile(`${OUT}WorkRadar-${file}.svg`, svg);
  await page.screenshot({ path: `${OUT}previews/WorkRadar-${file}.png`, fullPage: !f.viewport });
  console.log('exported', f.name);
  await page.close();
}
await browser.close();
