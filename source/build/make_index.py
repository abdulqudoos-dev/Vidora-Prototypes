"""Builds the overview page that presents all six directions.
Usage: python3 build/make_index.py [out.html] [--site]  (--site links to ./<name>/ instead of artifact URLs)"""
import json, sys, base64, urllib.parse, os
OUT = next((a for a in sys.argv[1:] if not a.startswith("--")), "dist/index.html")
SITE = "--site" in sys.argv
HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'designs_full.json')))
fav = open(os.path.join(HERE, '../assets/favicon.svg')).read().strip()
png = base64.b64encode(open(os.path.join(HERE, '../assets/apple-touch-icon.png'), 'rb').read()).decode()
SHORT = {'01': 'Signature', '02': 'Claymorphism', '03': 'Glass', '04': 'Editorial', '05': 'Pro studio', '06': 'Guided'}

cards = ''.join(f'''
  <a class="card" href="{d['path'] if SITE else d['url']}">
    <div class="shot"><img class="desk" src="{d['cover']}" alt="{d['name']} on desktop" loading="lazy"><img class="mob" src="{d['mob']}" alt="{d['name']} on mobile" loading="lazy"></div>
    <div class="cap"><span class="n">{d['n']}</span><b>{d['name']}</b><span class="t">{SHORT[d['n']]}</span><span class="go" aria-hidden="true">→</span></div>
  </a>''' for d in D)

page = f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Vidora — Six Directions</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,{urllib.parse.quote(fav)}">
<link rel="apple-touch-icon" href="data:image/png;base64,{png}">
<meta name="theme-color" content="#07060a">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400..600&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
<style>
:root{{--bg:#07060a;--ln:rgba(255,255,255,.08);--tx:#f4f1fb;--mu:#8f8aa1;--ac:#a78bfa}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--tx);font-family:Geist,system-ui,sans-serif;-webkit-font-smoothing:antialiased}}
body::before{{content:"";position:fixed;inset:-30% -20% auto auto;width:1000px;height:800px;background:radial-gradient(closest-side,rgba(124,58,237,.16),transparent);pointer-events:none}}
a{{color:inherit;text-decoration:none}}
.wrap{{position:relative;max-width:1200px;margin:0 auto;padding:40px 28px 80px}}
.logo{{display:flex;align-items:center;gap:10px;font-weight:600;font-size:17px;letter-spacing:-.02em}}
.logo img{{width:28px;height:28px}}
h1{{font-family:'Instrument Serif',serif;font-weight:400;font-size:clamp(46px,7vw,92px);line-height:.95;letter-spacing:-.02em;margin:64px 0 56px}}
h1 em{{color:var(--ac)}}
.grid{{display:grid;grid-template-columns:1fr 1fr;gap:56px 40px}}
.card{{display:block}}
.shot{{position:relative;padding:0 56px 34px 0}}
.desk{{width:100%;display:block;border-radius:14px;border:1px solid var(--ln);box-shadow:0 40px 80px -30px rgba(0,0,0,.9);transition:transform .6s cubic-bezier(.2,.8,.2,1)}}
.mob{{position:absolute;right:0;bottom:0;width:22%;border-radius:20px;border:4px solid #1c1924;box-shadow:0 30px 60px -20px rgba(0,0,0,.9);transition:transform .6s cubic-bezier(.2,.8,.2,1)}}
.card:hover .desk{{transform:translateY(-4px)}}
.card:hover .mob{{transform:translateY(-10px) rotate(-2deg)}}
.cap{{display:flex;align-items:baseline;gap:12px;margin-top:20px;padding-top:16px;border-top:1px solid var(--ln)}}
.n{{font-family:'Instrument Serif',serif;font-size:26px;color:var(--ac)}}
.cap b{{font-family:'Instrument Serif',serif;font-weight:400;font-size:34px;letter-spacing:-.01em}}
.t{{color:var(--mu);font-size:14px}}
.go{{margin-left:auto;font-size:22px;color:var(--mu);transition:.3s}}
.card:hover .go{{color:var(--ac);transform:translateX(4px)}}
@media (max-width:820px){{.grid{{grid-template-columns:1fr;gap:44px}}h1{{margin:44px 0 40px}}.shot{{padding:0 40px 26px 0}}.cap b{{font-size:30px}}}}
</style></head><body>
<main class="wrap">
  <div class="logo"><img src="data:image/svg+xml,{urllib.parse.quote(fav)}" alt="">Vidora</div>
  <h1>Six directions.<br><em>One</em> simple flow.</h1>
  <div class="grid">{cards}
  </div>
</main>
</body></html>'''
open(OUT, 'w').write(page)
print('index', len(page) // 1024, 'KB')
