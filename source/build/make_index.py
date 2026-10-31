"""Builds the overview page that presents all six directions.
Usage: python3 build/make_index.py [out.html] [--site]  (--site links to ./<name>/ instead of artifact URLs)"""
import json, html, sys
OUT = next((a for a in sys.argv[1:] if not a.startswith("--")), "dist/index.html")
SITE = "--site" in sys.argv
D = json.load(open('build/designs_full.json'))

cards = []
for d in D:
    if SITE: d['url'] = d['path']
    sw = ''.join(f'<i style="background:{c}" title="{c}"></i>' for c in d['sw'])
    cards.append(f'''
<article class="dir" id="d{d['n']}">
  <a class="shot" href="{d['url']}" target="_blank" rel="noopener">
    <img class="desk" src="{d['cover']}" alt="{d['name']} — home on desktop" loading="lazy">
    <img class="mob" src="{d['mob']}" alt="{d['name']} — home on mobile" loading="lazy">
  </a>
  <div class="meta">
    <div class="top"><span class="num">{d['n']}</span><span class="tag">{html.escape(d['tag'])}</span></div>
    <h2>{d['name']}</h2>
    <p>{html.escape(d['desc'])}</p>
    <dl>
      <div><dt>Navigation</dt><dd>{html.escape(d['nav'])}</dd></div>
      <div><dt>Type</dt><dd>{html.escape(d['type'])}</dd></div>
      <div><dt>Best for</dt><dd>{html.escape(d['best'])}</dd></div>
      <div><dt>Palette</dt><dd class="sw">{sw}</dd></div>
    </dl>
    <div class="minis"><img src="{d['img']}" alt="{d['name']} image tool" loading="lazy"><img src="{d['studio']}" alt="{d['name']} editing studio" loading="lazy"></div>
    <a class="open" href="{d['url']}" target="_blank" rel="noopener">Open the {d['name']} prototype <span aria-hidden="true">→</span></a>
  </div>
</article>''')

nav = ''.join(f'<a href="#d{d["n"]}"><b>{d["n"]}</b>{d["name"]}</a>' for d in D)

page = f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Vidora — Six UI Directions</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
<style>
:root{{--bg:#07060a;--p:#0f0d14;--ln:rgba(255,255,255,.08);--tx:#f4f1fb;--mu:#948fa6;--ac:#a78bfa}}
*{{box-sizing:border-box}}html{{scroll-behavior:smooth}}
body{{margin:0;background:var(--bg);color:var(--tx);font-family:Geist,system-ui,sans-serif;-webkit-font-smoothing:antialiased}}
body::before{{content:"";position:fixed;inset:-30% -20% auto auto;width:1000px;height:800px;background:radial-gradient(closest-side,rgba(124,58,237,.18),transparent);pointer-events:none}}
a{{color:inherit;text-decoration:none}}
.wrap{{max-width:1240px;margin:0 auto;padding:0 28px}}
header{{padding:72px 0 40px;border-bottom:1px solid var(--ln)}}
.k{{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ac);font-weight:600}}
h1{{font-family:'Instrument Serif',serif;font-weight:400;font-size:clamp(48px,7vw,96px);line-height:.95;margin:18px 0 18px;letter-spacing:-.02em}}
h1 em{{color:var(--ac)}}
.lead{{font-size:18px;color:var(--mu);max-width:640px;line-height:1.55}}
.toc{{display:flex;gap:8px;flex-wrap:wrap;margin-top:28px}}
.toc a{{display:inline-flex;gap:8px;align-items:center;height:40px;padding:0 16px;border-radius:99px;border:1px solid var(--ln);font-size:14px;transition:.2s}}
.toc a:hover{{border-color:var(--ac)}}
.toc b{{color:var(--ac);font-weight:500;font-size:12px}}
.facts{{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--ln);border:1px solid var(--ln);border-radius:18px;overflow:hidden;margin-top:36px}}
.facts div{{background:var(--p);padding:18px 20px}}
.facts b{{display:block;font-size:26px;font-weight:600;letter-spacing:-.02em}}
.facts span{{color:var(--mu);font-size:13px}}
.dir{{display:grid;grid-template-columns:1.25fr 1fr;gap:44px;padding:64px 0;border-bottom:1px solid var(--ln);align-items:center}}
.shot{{position:relative;display:block;padding-right:70px;padding-bottom:40px}}
.shot .desk{{width:100%;border-radius:14px;border:1px solid var(--ln);box-shadow:0 40px 80px -30px rgba(0,0,0,.9);display:block;transition:transform .6s cubic-bezier(.2,.8,.2,1)}}
.shot .mob{{position:absolute;right:0;bottom:0;width:150px;border-radius:24px;border:5px solid #1c1924;box-shadow:0 30px 60px -20px rgba(0,0,0,.9);transition:transform .6s cubic-bezier(.2,.8,.2,1)}}
.shot:hover .desk{{transform:translateY(-4px)}}
.shot:hover .mob{{transform:translateY(-10px) rotate(-2deg)}}
.top{{display:flex;align-items:center;gap:12px}}
.num{{font-family:'Instrument Serif',serif;font-size:44px;color:var(--ac);line-height:1}}
.tag{{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--mu);padding:6px 10px;border:1px solid var(--ln);border-radius:99px}}
.meta h2{{font-family:'Instrument Serif',serif;font-weight:400;font-size:56px;margin:10px 0 8px;letter-spacing:-.01em}}
.meta p{{color:#c9c3d8;line-height:1.6;font-size:15.5px;margin:0 0 20px}}
dl{{margin:0 0 20px;display:grid;gap:0}}
dl div{{display:grid;grid-template-columns:110px 1fr;padding:10px 0;border-top:1px solid var(--ln);font-size:14px}}
dt{{color:var(--mu)}}dd{{margin:0}}
.sw{{display:flex;gap:6px}}.sw i{{width:22px;height:22px;border-radius:6px;border:1px solid rgba(255,255,255,.15)}}
.minis{{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:22px}}
.minis img{{width:100%;border-radius:10px;border:1px solid var(--ln);display:block}}
.open{{display:inline-flex;align-items:center;gap:10px;height:50px;padding:0 22px;border-radius:14px;background:linear-gradient(135deg,#a78bfa,#7c3aed);font-weight:600;box-shadow:0 12px 30px -10px rgba(139,92,246,.8);transition:.2s}}
.open:hover{{transform:translateY(-2px)}}
.common{{padding:70px 0}}
.common h3{{font-family:'Instrument Serif',serif;font-weight:400;font-size:44px;margin:0 0 26px}}
.grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}}
.grid div{{padding:20px;border:1px solid var(--ln);border-radius:16px;background:var(--p)}}
.grid b{{display:block;margin-bottom:6px;font-weight:600}}
.grid span{{color:var(--mu);font-size:14px;line-height:1.55}}
.try{{margin-top:40px;padding:26px;border-radius:18px;border:1px solid rgba(167,139,250,.3);background:linear-gradient(135deg,rgba(124,58,237,.14),transparent)}}
.try ol{{margin:12px 0 0;padding-left:20px;line-height:2;color:#d6d0e4}}
footer{{padding:40px 0 70px;color:var(--mu);font-size:13px}}
@media (max-width:900px){{.dir{{grid-template-columns:1fr;gap:26px;padding:44px 0}}.facts{{grid-template-columns:1fr 1fr}}.grid{{grid-template-columns:1fr}}.shot .mob{{width:110px;border-width:4px;border-radius:18px}}.shot{{padding-right:40px;padding-bottom:30px}}.meta h2{{font-size:44px}}header{{padding-top:44px}}}}
</style></head><body>
<div class="wrap">
<header>
  <span class="k">Vidora · AI creative platform · UI exploration</span>
  <h1>Six directions.<br><em>One</em> simple flow.</h1>
  <p class="lead">Six clickable prototypes, each a different way to make Vidora feel premium and effortless. All six cover the same five tools and work on both web and mobile.</p>
  <nav class="toc">{nav}</nav>
  <div class="facts"><div><b>6</b><span>visual directions</span></div><div><b>5</b><span>tools, end to end</span></div><div><b>8</b><span>screens per direction</span></div><div><b>Web + mobile</b><span>responsive in one file</span></div></div>
</header>
{''.join(cards)}
<section class="common">
  <h3>Inside every prototype</h3>
  <div class="grid">
    <div><b>The whole flow</b><span>Welcome → Home → Create Your Identity → Image → Video → Editing Studio → Give It A Voice → Export and share. Each result links to the next step.</span></div>
    <div><b>A dock you can customize</b><span>Long-press the mobile dock (or tap the grid icon) to add, remove and drag-reorder up to five tools. Your choice is remembered.</span></div>
    <div><b>A CapCut-style studio</b><span>Multi-track timeline, drag to scrub, split (S), duplicate, delete, trim handles, zoom, titles, auto-captions, filters, colour and aspect ratio.</span></div>
    <div><b>Real uploads</b><span>Drop your own photos into Create Your Identity or the video start frame, or use the built-in sample set.</span></div>
    <div><b>Believable AI states</b><span>Live progress with plain-English steps, skeleton loaders, results that animate in, and credits that go down as you generate.</span></div>
    <div><b>⌘K command menu</b><span>Jump to any tool or action from the keyboard on web. Space plays the timeline in the studio.</span></div>
  </div>
  <div class="try"><b>Try this 60-second path in any prototype</b>
    <ol><li>Get started → open <b>Create Your Identity</b> → “Use sample photos” → Create</li><li>Go to <b>Image</b> → Generate → on any picture press <b>Animate</b></li><li>Generate the video → <b>Open in Studio</b>: play, press S to split, drag a trim handle</li><li>Open <b>Voice</b> → Generate → <b>Add to timeline</b> → Export</li></ol></div>
</section>
<footer>Prototype images were generated with AI for this exploration. All interactions are simulated; no real generation or upload leaves the browser.</footer>
</div></body></html>'''
open(OUT, 'w').write(page)
print('index', len(page) // 1024, 'KB')
