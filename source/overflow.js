const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();
for(const f of fs.readdirSync('dist').filter(f=>/^0\d/.test(f))){const p=await b.newPage({viewport:{width:390,height:844}});await p.goto('file://'+process.cwd()+'/dist/'+f);await p.waitForTimeout(500);
 const bad=[];for(const v of ['welcome','home','identity','image','video','voice','studio','library']){await p.evaluate(v=>Vidora.go(v),v);await p.waitForTimeout(250);
  for(const st of ['empty','done']){await p.evaluate(st=>document.querySelectorAll('[data-gen]').forEach(g=>g.dataset.state=st),st);await p.waitForTimeout(80);
   const w=await p.evaluate(()=>document.documentElement.scrollWidth); if(w>392) bad.push(v+'/'+st+':'+w);}}
 console.log(f, bad.join(' ')||'ok'); await p.close();}
await b.close();})();
