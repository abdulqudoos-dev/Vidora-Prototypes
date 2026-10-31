const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();
for(const f of fs.readdirSync('dist').filter(f=>/^0\d/.test(f))){
 for (const vp of [{width:1440,height:900},{width:390,height:844}]) {
 const p=await b.newPage({viewport:vp}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+process.cwd()+'/dist/'+f); await p.waitForTimeout(500);
 const log=[]; const clickVis=async(sel)=>{const els=await p.$$(sel); for(const e of els){ if(await e.isVisible()){ await e.click(); return true;} } log.push('NOVIS '+sel); return false;};
 await clickVis('[data-view="welcome"] [data-go="home"]'); await p.waitForTimeout(300);
 await p.evaluate(()=>Vidora.go('identity')); await p.waitForTimeout(300);
 await clickVis('[data-demo-upload="identity"]'); await p.waitForTimeout(1500);
 // prism: walk the steps
 for (const s of ['[data-tab="idt:2"]','[data-tab="idt:3"]']) if (await p.$(s)) { await clickVis(s); await p.waitForTimeout(200); }
 await clickVis('[data-view="identity"] [data-generate="identity"], [data-generate="identity"]'); await p.waitForTimeout(5600);
 log.push('identity:'+await p.evaluate(()=>document.querySelector('[data-gen="identity"]').dataset.state));
 await p.evaluate(()=>Vidora.go('image')); await p.waitForTimeout(300);
 for (const s of ['[data-tab="img:2"]','[data-tab="img:3"]','[data-tab="img:4"]']) if (await p.$(s)) { await clickVis(s); await p.waitForTimeout(200); }
 await clickVis('[data-generate="image"]'); await p.waitForTimeout(4000);
 log.push('image:'+await p.evaluate(()=>document.querySelector('[data-gen="image"]').dataset.state));
 await p.evaluate(()=>{ [...document.querySelectorAll('[data-view="image"] [data-send="videosrc"]')].find(e=>e.dataset.srcImg==='hero2')?.click(); });
 await p.waitForTimeout(400); log.push('nav:'+await p.evaluate(()=>document.body.dataset.current));
 for (const s of ['[data-tab="vid:2"]','[data-tab="vid:3"]']) if (await p.$(s)) { await clickVis(s); await p.waitForTimeout(200); }
 await clickVis('[data-generate="video"]'); await p.waitForTimeout(5100);
 log.push('video:'+await p.evaluate(()=>document.querySelector('[data-gen="video"]').dataset.state));
 const before=await p.evaluate(()=>document.querySelectorAll('[data-track="video"] [data-clip]').length);
 await clickVis('[data-view="video"] [data-add-clip="video"]'); await p.waitForTimeout(500);
 const after=await p.evaluate(()=>document.querySelectorAll('[data-track="video"] [data-clip]').length);
 log.push('studio:'+await p.evaluate(()=>document.body.dataset.current)+' clips '+before+'→'+after);
 await clickVis('[data-studio-play]'); await p.waitForTimeout(1200); await clickVis('[data-studio-play]');
 log.push('t='+await p.evaluate(()=>document.querySelector('[data-timecode]').textContent));
 await p.evaluate(()=>Vidora.go('voice')); await p.waitForTimeout(300);
 for (const s of ['[data-tab="voc:2"]','[data-tab="voc:3"]']) if (await p.$(s)) { await clickVis(s); await p.waitForTimeout(200); }
 await clickVis('[data-generate="voice"]'); await p.waitForTimeout(3200);
 log.push('voice:'+await p.evaluate(()=>document.querySelector('[data-gen="voice"]').dataset.state));
 await clickVis('[data-view="voice"] [data-add-clip="voice"]'); await p.waitForTimeout(400);
 await p.evaluate(()=>Vidora.openModal('export')); await p.waitForTimeout(400);
 await clickVis('#export [data-generate="export"]'); await p.waitForTimeout(3500);
 log.push('export:'+await p.evaluate(()=>document.querySelector('[data-gen="export"]').dataset.state));
 console.log(f, vp.width, log.join(' | '), errs.length?'ERR '+errs.join(';'):'');
 await p.close();}}
 // tablet overflow
 for(const f of fs.readdirSync('dist').filter(f=>/^0\d/.test(f))) for (const w of [768,1024]) { const p=await b.newPage({viewport:{width:w,height:900}}); await p.goto('file://'+process.cwd()+'/dist/'+f); await p.waitForTimeout(300); const bad=[]; for(const v of ['home','identity','image','video','voice','studio','library']){await p.evaluate(v=>Vidora.go(v),v);await p.waitForTimeout(150); const sw=await p.evaluate(()=>document.documentElement.scrollWidth); if(sw>w+2) bad.push(v+':'+sw);} if(bad.length) console.log('overflow',f,w,bad.join(' ')); await p.close(); }
await b.close();})();
