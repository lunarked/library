// Builds the share images (og/<slug>.png, 1200 x 627) and writes the share tags into each story's <head>.
// Run from the repo root:  node og/src/build.js
// Data lives in og/src/cards.json: one entry per story (slug, title, description, kicker, hero, caption).
// Needs Playwright and Chrome. Fonts load from Google Fonts; where that is blocked, set OG_FONT_DIR to a folder
// of @fontsource packages (npm i @fontsource/archivo @fontsource/jetbrains-mono) and they are used instead.
const fs = require('fs');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/npm-tools/node_modules/playwright')); }

const ROOT = path.resolve(__dirname, '..', '..');
const SITE = 'https://lunarked.github.io/library/';
const cards = JSON.parse(fs.readFileSync(path.join(__dirname, 'cards.json'), 'utf8'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function localFontCss() {
  const dir = process.env.OG_FONT_DIR;
  if (!dir) return null;
  const want = [['archivo', 'Archivo', [700, 900]], ['jetbrains-mono', 'JetBrains Mono', [600]]];
  return want.map(([pkg, fam, weights]) => weights.map(w => {
    const file = path.join(dir, pkg, 'files', `${pkg}-latin-${w}-normal.woff2`);
    return `@font-face{font-family:"${fam}";font-weight:${w};font-style:normal;src:url(data:font/woff2;base64,${fs.readFileSync(file).toString('base64')}) format("woff2")}`;
  }).join('\n')).join('\n');
}

function shareBlock(c, pageTitle) {
  const url = `${SITE}stories/${c.slug}.html`, img = `${SITE}og/${c.slug}.png`;
  return ['<!-- share:start -->',
    `<title>${esc(pageTitle)}</title>`,
    `<meta name="description" content="${esc(c.description)}">`,
    '<meta property="og:type" content="article">',
    '<meta property="og:site_name" content="JR">',
    `<meta property="og:title" content="${esc(c.title)}">`,
    `<meta property="og:description" content="${esc(c.description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${img}">`,
    '<meta property="og:image:type" content="image/png">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="627">',
    `<meta property="og:image:alt" content="${esc(c.hero + ' ' + c.caption)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    '<!-- share:end -->'].join('\n');
}

function stampTags(c) {
  const file = path.join(ROOT, 'stories', c.slug + '.html');
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/\n?<!-- share:start -->[\s\S]*?<!-- share:end -->\n?/, '');
  const m = html.match(/<title>([\s\S]*?)<\/title>/);
  if (!m) throw new Error('no <title> in ' + file);
  const pageTitle = m[1].replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').trim();
  const at = html.indexOf('</head>');
  if (at < 0) throw new Error('no </head> in ' + file);
  fs.writeFileSync(file, html.slice(0, at) + '\n' + shareBlock(c, pageTitle) + '\n' + html.slice(at));
}

(async () => {
  const exe = process.env.CHROME || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined);
  const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 627 }, deviceScaleFactor: 1 });
  const css = localFontCss();
  for (const c of cards) {
    const page = await ctx.newPage();
    if (css) await page.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: css }));
    await page.goto('file://' + path.join(__dirname, 'card.html'), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const size = await page.evaluate(card => window.fill(card), c);
    await page.evaluate(() => document.fonts.ready);
    const loaded = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').length);
    if (!loaded) throw new Error('fonts did not load; set OG_FONT_DIR');
    const out = path.join(ROOT, 'og', c.slug + '.png');
    await page.locator('.card').screenshot({ path: out });
    await page.close();
    stampTags(c);
    console.log(`${c.slug}: number at ${size}px, ${Math.round(fs.statSync(out).size / 1024)} KB, tags written`);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
