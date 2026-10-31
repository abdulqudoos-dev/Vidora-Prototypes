// One presentation board PNG per direction: all desktop + mobile screens.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const D = JSON.parse(fs.readFileSync('build/designs.json', 'utf8'));
const V = [['welcome','Welcome'],['home','Home'],['identity','Create Your Identity'],['image','Bring To Life · Image'],['video','Bring To Life · Video'],['voice','Give It A Voice'],['studio','Editing Studio'],['library','Library']];
(async () => {
  const b = await chromium.launch(); fs.mkdirSync('exports/_boards', { recursive: true });
  for (const d of D) {
    const ex = path.resolve('exports', d.id);
    const desk = V.map(([v, t]) => `<figure><img src="file://${ex}/desktop-${v}.png"><figcaption>${t}</figcaption></figure>`).join('');
    const mob = V.filter(([v]) => v !== 'welcome').concat([['dock-editor', 'Customize dock']]).map(([v, t]) => `<figure><img src="file://${ex}/mobile-${v}.png"><figcaption>${t}</figcaption></figure>`).join('');
    const extra = fs.existsSync(`${ex}/mobile-guided-image-step3.png`) ? `<h3>Guided steps</h3><div class="mob">${['guided-identity-step1','guided-image-step3','guided-video-step3','guided-voice-step2'].map(f => `<figure><img src="file://${ex}/mobile-${f}.png"><figcaption>${f.replace('guided-','').replace('-',' · ')}</figcaption></figure>`).join('')}</div>` : '';
    const html = `<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;600&family=Instrument+Serif&display=swap" rel="stylesheet"><style>
      body{margin:0;background:#07060a;color:#f4f1fb;font-family:Geist,sans-serif;padding:80px}
      .h{display:flex;align-items:flex-end;gap:30px;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:30px;margin-bottom:50px}
      .n{font-family:'Instrument Serif';font-size:140px;line-height:.8;color:#a78bfa}
      h1{font-family:'Instrument Serif';font-weight:400;font-size:110px;margin:0;line-height:.9}
      .t{font-size:22px;color:#a39db5;margin-top:12px;max-width:900px;line-height:1.5}
      .sw{margin-left:auto;display:flex;gap:10px}.sw i{width:56px;height:56px;border-radius:14px;border:1px solid rgba(255,255,255,.15)}
      h3{font-size:20px;letter-spacing:.14em;text-transform:uppercase;color:#a78bfa;margin:50px 0 24px;font-weight:600}
      .desk{display:grid;grid-template-columns:repeat(4,1fr);gap:28px}
      .mob{display:grid;grid-template-columns:repeat(8,1fr);gap:24px}
      figure{margin:0}img{width:100%;display:block;border-radius:12px;border:1px solid rgba(255,255,255,.1)}
      .mob img{border-radius:22px}
      figcaption{font-size:16px;color:#a39db5;margin-top:10px}
      .foot{margin-top:50px;color:#6f6a80;font-size:16px;display:flex;justify-content:space-between}
    </style></head><body>
      <div class="h"><span class="n">${d.n}</span><div><h1>${d.name}</h1><div class="t">${d.tag} — ${d.desc}</div></div><div class="sw">${d.sw.map(c => `<i style="background:${c}"></i>`).join('')}</div></div>
      <h3>Web · 1440 × 900</h3><div class="desk">${desk}</div>
      <h3>Mobile · 390 × 844</h3><div class="mob">${mob}</div>${extra}
      <div class="foot"><span>Vidora — AI creative platform · UI exploration</span><span>Type: ${d.type} · Navigation: ${d.nav}</span></div>
    </body></html>`;
    fs.writeFileSync(`build/board-${d.id}.html`, html);
    const p = await b.newPage({ viewport: { width: 2800, height: 1200 } });
    await p.goto('file://' + path.resolve(`build/board-${d.id}.html`)); await p.waitForTimeout(1200);
    await p.screenshot({ path: `exports/_boards/${d.id}-board.png`, fullPage: true }); await p.close();
    console.log('board', d.id);
  }
  await b.close();
})();
