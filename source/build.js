// Builds each design into one self-contained HTML file (images, icons, engine inlined).
const fs = require('fs'), path = require('path');
const root = __dirname, src = path.join(root, 'src'), out = path.join(root, 'dist');
const core = fs.readFileSync(path.join(src, 'core.js'), 'utf8');
const coreCss = fs.readFileSync(path.join(src, 'core.css'), 'utf8');
const images = fs.readFileSync(path.join(src, 'images.js'), 'utf8');
// favicon + home-screen icon, embedded so they work on any host and in shared links
const favSvg = fs.readFileSync(path.join(root, 'assets/favicon.svg'), 'utf8').trim();
const favPng = fs.readFileSync(path.join(root, 'assets/apple-touch-icon.png')).toString('base64');
const ICONS = `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(favSvg)}">\n<link rel="apple-touch-icon" href="data:image/png;base64,${favPng}">\n<meta name="theme-color" content="#07060a">`;
const iconDir = path.join(root, 'node_modules/lucide-static/icons');
const only = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const files = fs.readdirSync(path.join(src, 'designs')).filter(f => f.endsWith('.html') && (!only.length || only.some(o => f.includes(o))));
const BASE = ['play', 'pause', 'x', 'check', 'plus', 'minus', 'search', 'info', 'grip-vertical', 'sparkles', 'arrow-right', 'scissors', 'trash-2', 'copy', 'undo-2', 'redo-2', 'mic', 'music', 'layout-grid', 'wand-sparkles', 'film', 'download'];
for (const f of files) {
  let html = fs.readFileSync(path.join(src, 'designs', f), 'utf8');
  const names = new Set(BASE);
  for (const m of (html + core).matchAll(/(?:data-i="|icon:\s*'|ic\(')([a-z0-9-]+)/g)) names.add(m[1]);
  const missing = [];
  const symbols = [...names].sort().map(n => {
    const p = path.join(iconDir, n + '.svg');
    if (!fs.existsSync(p)) { missing.push(n); return ''; }
    const svg = fs.readFileSync(p, 'utf8');
    const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s+/g, ' ').trim();
    return `<symbol id="i-${n}" viewBox="0 0 24 24">${inner}</symbol>`;
  }).join('');
  if (missing.length) console.warn(`[${f}] missing icons: ${missing.join(', ')}`);
  html = html.replace('<!--@ENGINE_CSS-->', () => `${ICONS}\n<style>${coreCss}</style>`)
    .replace('<!--@ENGINE-->', () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${symbols}</svg>\n<script>${images}</script>\n<script>${core}</script>`);
  fs.writeFileSync(path.join(out, f), html);
  console.log(`built ${f} ${(html.length / 1024).toFixed(0)}KB, ${names.size} icons`);
}
