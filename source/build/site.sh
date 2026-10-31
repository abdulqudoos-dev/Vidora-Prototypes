#!/usr/bin/env bash
# Assembles the deployable static site into $1 (default: repo root)
set -euo pipefail
OUT="${1:-..}"
cd "$(dirname "$0")/.."
mkdir -p dist
node build.js >/dev/null
python3 build/make_index.py "$OUT/index.html" --site >/dev/null
for d in obsidian clay halo atelier console prism; do
  mkdir -p "$OUT/$d"; cp dist/0*-"$d".html "$OUT/$d/index.html"
done
touch "$OUT/.nojekyll"
echo "site built in $OUT"
