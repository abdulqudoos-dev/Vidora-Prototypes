# Vidora — UI Prototypes

Six clickable UI directions for **Vidora**, an AI creative platform. Each one works on web and mobile and covers the full flow, from welcome screen to export.

The site is fully static: plain HTML with no build step needed to deploy it. Every image, icon and script is embedded in the page, so it also works offline.

## Pages

| Path | What it is |
|---|---|
| `/` | **Overview** — “Six directions. One simple flow.” Links to each direction |
| `/obsidian/` | 01 · Obsidian — signature dark/violet look. Tools: **Persona · Imagine · Motion · Voice · Editing Studio** |
| `/clay/` | 02 · Clay — claymorphism, playful and guided by a mascot |
| `/halo/` | 03 · Halo — glass over aurora, canvas-first, bottom dock everywhere |
| `/atelier/` | 04 · Atelier — luxury editorial |
| `/console/` | 05 · Console — power-user studio with a live render queue |
| `/prism/` | 06 · Prism — spatial, step-by-step guided flows |

Each prototype supports deep links, for example `/obsidian/#image`, `/prism/#voice` or `/halo/#studio`.
Views: `welcome`, `home`, `identity`, `image`, `video`, `voice`, `studio`, `library`.

## Deploy

Any static host works. The repository root is the site.

- **Vercel:** Import the repo → Framework preset **Other** → leave Build Command empty → Output Directory `.` (root) → Deploy.
- **Netlify:** Add new site → Import from GitHub → leave Build command empty → Publish directory `.` → Deploy.
- **GitHub Pages:** Settings → Pages → Deploy from a branch → `main` / `(root)`. (`.nojekyll` is already included.)

## Try this in any prototype (about 60 seconds)

1. Get started → **Create Your Identity** (Persona in Obsidian) → “Use sample photos” → Create
2. **Image** → Generate → on any picture press **Animate**
3. Generate the video → **Open in Studio** → Space to play, **S** to split, drag a trim handle
4. **Voice** → Generate → **Add to timeline** → **Export**

Also try long-pressing the mobile dock (or tapping its grid icon) to add, remove and reorder tools, and **⌘K / Ctrl+K** on web.

All AI generation, playback and voice recording is simulated for the prototype. Uploaded photos stay in the browser.

## Editing the source

The source and build scripts are in [`source/`](source/):

```
source/
  src/core.js        shared interaction engine (routing, generation states, uploads, timeline, dock, ⌘K)
  src/core.css       shared base styles (themed per design through --v-* variables)
  src/designs/*.html one file per direction (markup + design-specific CSS)
  src/images.js      embedded images (generated from assets/img)
  build.js           inlines engine, icons (lucide-static) and images into each page
  build/site.sh      assembles the deployable site into the repo root
  flow.js            end-to-end click test of the full flow (desktop + mobile)
  overflow.js        checks every screen for horizontal scrolling at phone width
```

```bash
cd source
npm install
npm run site      # rebuilds ../index.html and ../<direction>/index.html
npm test          # needs Playwright + Chromium
```

To rename tools in a single design without affecting the others, set `window.VIDORA_NAMES` in that design file (see `01-obsidian.html`).

Images in the prototypes were generated with AI for this exploration.
