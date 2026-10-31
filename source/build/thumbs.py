"""Embeds compressed screenshots into build/designs_full.json for the overview page."""
import json, base64, io
from PIL import Image
D = json.load(open('build/designs.json'))
def uri(path, size, q=74):
    im = Image.open(path).convert('RGB').resize(size, Image.LANCZOS); b = io.BytesIO(); im.save(b, 'WEBP', quality=q, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
for d in D:
    e = f"exports/{d['id']}/"
    d['cover'] = uri(e + 'desktop-home.png', (880, 550)); d['mob'] = uri(e + 'mobile-home.png', (234, 506))
    d['studio'] = uri(e + 'desktop-studio.png', (440, 275), 70); d['img'] = uri(e + 'desktop-image.png', (440, 275), 70)
json.dump(D, open('build/designs_full.json', 'w'))
