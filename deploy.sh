#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later
# Build dist/ from the repo and deploy it as an assets-only Cloudflare Worker.
# Gates first; nothing ships red. Token: read inside a subshell assignment (never argv, never printed).
set -u
cd "$(dirname "$0")"
node build.mjs --check || { echo "✗ build/syntax gate failed"; exit 1; }
|| { echo "✗ unit tests failed"; exit 1; }
rm -rf dist && mkdir -p dist
cp -r frames.js frames schema media index.html llms.txt LICENSE NOTICE LICENSES dist/ 2>/dev/null
[ -d builder ] && cp -r builder dist/
[ -f frames.min.js ] && cp frames.min.js dist/
[ -f 404.html ] && cp 404.html dist/
[ -f robots.txt ] && cp robots.txt dist/
[ -f sitemap.xml ] && cp sitemap.xml dist/
mkdir -p dist/docs && cp docs/*.md dist/docs/ 2>/dev/null; cp README.md SPEC.md CHANGELOG.md dist/ 2>/dev/null
cat > dist/_headers <<'H'
/*
  Access-Control-Allow-Origin: *
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: interest-cohort=()
/frames.js
  ! Cache-Control
  Cache-Control: public, max-age=300
/frames.min.js
  ! Cache-Control
  Cache-Control: public, max-age=300
/frames/*
  ! Cache-Control
  Cache-Control: public, max-age=300
/media/*
  ! Cache-Control
  Cache-Control: public, max-age=86400
/*.md
  Content-Type: text/markdown; charset=utf-8
/LICENSE
  Content-Type: text/plain; charset=utf-8
/NOTICE
  Content-Type: text/plain; charset=utf-8
H
find dist -name '*.md' -o -name '*.json' | head -0
echo "dist: $(find dist -type f | wc -l) files, $(du -sh dist | cut -f1)"
[ "${1:-}" = "--dry" ] && { echo "dry run: not deploying"; exit 0; }
( unset CF_API_TOKEN; CLOUDFLARE_API_TOKEN="$(cat /workspace/.cf-workers-token)" npx --yes wrangler@4 deploy )
