// Renders PNG exports of every screen, desktop + mobile, and reports console errors.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const only = process.argv.slice(2);
const dist = path.join(__dirname, 'dist');
const files = fs.readdirSync(dist).filter(f => f.endsWith('.html') && f !== 'index.html' && (!only.length || only.some(o => f.includes(o))));
const VIEWS = ['welcome', 'home', 'identity', 'image', 'video', 'voice', 'studio', 'library'];
const prep = {
  identity: async p => { await p.evaluate(() => document.querySelector('[data-demo-upload="identity"]')?.click()); await p.waitForTimeout(1400); await p.evaluate(() => { const g = document.querySelector('[data-gen="identity"]'); if (g) g.dataset.state = 'done'; document.querySelectorAll('[data-gen="identity"] [data-reveal]').forEach(e => e.classList.add('revealed')); document.dispatchEvent(new CustomEvent('vidora:done', { detail: { key: 'identity' } })); }); },
  image: async p => { await p.evaluate(() => { const g = document.querySelector('[data-gen="image"]'); if (g) g.dataset.state = 'done'; }); },
  video: async p => { await p.evaluate(() => { const g = document.querySelector('[data-gen="video"]'); if (g) g.dataset.state = 'done'; }); },
  voice: async p => { await p.evaluate(() => { const g = document.querySelector('[data-gen="voice"]'); if (g) g.dataset.state = 'done'; }); },
  studio: async p => { await p.evaluate(() => { window.Vidora.setTime(1.6); const c = document.querySelectorAll('[data-track="video"] [data-clip]')[0]; c && c.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: c.getBoundingClientRect().left + 40 })); }); }
};
(async () => {
  const browser = await chromium.launch();
  const out = path.join(__dirname, 'exports');
  for (const f of files) {
    const name = f.replace('.html', '');
    fs.mkdirSync(path.join(out, name), { recursive: true });
    for (const [label, vp] of [['desktop', { width: 1440, height: 900, deviceScaleFactor: 1 }], ['mobile', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]]) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, reducedMotion: 'no-preference' });
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', e => errs.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
      await page.goto('file://' + path.join(dist, f));
      await page.waitForTimeout(900);
      for (const v of VIEWS) {
        await page.evaluate(v => window.Vidora && window.Vidora.go(v), v);
        await page.waitForTimeout(700);
        if (prep[v]) await prep[v](page);
        await page.waitForTimeout(500);
        await page.evaluate(() => document.querySelectorAll('[data-reveal]').forEach(e => { e.style.animation = 'none'; e.style.opacity = 1; }));
        await page.screenshot({ path: path.join(out, name, `${label}-${v}.png`) });
      }
      if (name.includes('prism')) {
        for (const [v, tab, file] of [['image', 'img:3', 'guided-image-step3'], ['voice', 'voc:2', 'guided-voice-step2'], ['video', 'vid:3', 'guided-video-step3'], ['identity', 'idt:1', 'guided-identity-step1']]) {
          await page.evaluate(([v, tab]) => { document.querySelectorAll('[data-gen]').forEach(g => g.dataset.state = 'empty'); Vidora.go(v); document.querySelector(`[data-tab="${tab}"]`)?.click(); }, [v, tab]);
          await page.waitForTimeout(800);
          await page.screenshot({ path: path.join(out, name, `${label}-${file}.png`) });
        }
      }
      // dock editor (mobile) and command palette (desktop)
      if (label === 'mobile') { await page.evaluate(() => { Vidora.go('home'); Vidora.openModal('v-dock'); }); await page.waitForTimeout(700); await page.screenshot({ path: path.join(out, name, `mobile-dock-editor.png`) }); }
      else { await page.evaluate(() => { Vidora.go('home'); Vidora.openModal('v-cmdk'); }); await page.waitForTimeout(600); await page.screenshot({ path: path.join(out, name, `desktop-command-menu.png`) }); }
      if (errs.length) console.log(name, label, 'ERRORS:', [...new Set(errs)].join(' | ').slice(0, 800));
      await ctx.close();
    }
    console.log('shot', name);
  }
  await browser.close();
})();
