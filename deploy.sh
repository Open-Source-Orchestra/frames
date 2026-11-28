#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later
# Build dist/ from the repo and deploy it as an assets-only Cloudflare Worker.
# Gates first; nothing ships red. Token: read inside a subshell assignment (never argv, never printed).
set -u
cd "$(dirname "$0")"
WORKER=oso-frames; HOST=https://frames.opensourceorchestra.org
# wrangler with the token read inside a subshell assignment (never argv, never printed)
wr() { ( unset CF_API_TOKEN; CLOUDFLARE_API_TOKEN="$(cat /workspace/.cf-workers-token)" npx --yes wrangler@4 "$@" ); }
# `deployments list` prints OLDEST first → take the last deployment's first version line "(100%) <id>".
live_id() { wr deployments list --name "$WORKER" 2>/dev/null | grep -oE 'Version\(s\):[[:space:]]+\([0-9]+%\)[[:space:]]+[0-9a-f-]{36}' | tail -1 | grep -oE '[0-9a-f-]{36}$'; }
usage() { cat <<'U'
usage: ./deploy.sh                 build + gates + deploy to 100 % (the classic lane)
       ./deploy.sh --dry           build + gates, deploy nothing
       ./deploy.sh --stage         build + gates + `versions upload` → a Version ID with 0 traffic
       ./deploy.sh --smoke <id>    put <id> at 0 % beside the live version, curl frames.js through the
                                   Cloudflare-Workers-Version-Overrides header (nobody else sees it)
       ./deploy.sh --canary <id> <pct>   live@(100-pct)% + <id>@pct%
       ./deploy.sh --promote <id>  <id>@100%          ./deploy.sh --rollback <id>  wrangler rollback <id>
Recipe + laws: /shared/kb/skills/deploy-safety-gates.md ("Canary via Workers versions").
U
}
case "${1:-}" in
  -h|--help) usage; exit 0 ;;
  --smoke)
    B="${2:?version id}"; A="$(live_id)"; [ -n "$A" ] || { echo "✗ could not read the live version id"; exit 1; }
    [ "$A" = "$B" ] && { echo "✗ $B is already the live version"; exit 1; }
    echo "live=$A  staged=$B → deployment A@100% B@0%"
    wr versions deploy "$A@100%" "$B@0%" -y || exit 1
    echo "— served through the override header (first 3 lines of frames.js):"
    curl -s -H "Cloudflare-Workers-Version-Overrides: $WORKER=\"$B\"" "$HOST/frames.js" | head -3
    echo "— without the header (what visitors get):"; curl -s "$HOST/frames.js" | head -3
    echo "next: ./deploy.sh --canary $B 10   or   ./deploy.sh --promote $B   (rollback: ./deploy.sh --rollback $A)"; exit 0 ;;
  --canary)
    B="${2:?version id}"; P="${3:?percent}"; A="$(live_id)"; [ -n "$A" ] || { echo "✗ could not read the live version id"; exit 1; }
    echo "live=$A@$((100-P))%  canary=$B@$P%"; wr versions deploy "$A@$((100-P))%" "$B@$P%" -y; exit $? ;;
  --promote)  B="${2:?version id}"; wr versions deploy "$B@100%" -y; exit $? ;;
  --rollback) wr rollback "${2:?previous version id}" -y; exit $? ;;
esac
node build.mjs --check || { echo "✗ build/syntax gate failed"; exit 1; }
rm -rf dist && mkdir -p dist
cp -r frames.js frames schema media index.html llms.txt LICENSE NOTICE LICENSES dist/ 2>/dev/null
[ -d builder ] && cp -r builder dist/
# v0.1.13 (mobile flow, 28 Nov 2026): the SERVED frames.js is a minified build (299 KB → ~120 KB decoded, ~30 KB brotli — the frames origin was 58 % of the flagship's whole first
# visit on a phone). The readable file stays beside it as /frames.src.js (AGPL: the source of the served bytes) and in the repo; the credit banner is preserved.
cp frames.js dist/frames.src.js
( npx --yes terser@5 frames.js --compress --mangle --comments '/^!/' -o dist/frames.js ) || { echo "✗ minify failed"; exit 1; }
node --check dist/frames.js || { echo "✗ the minified frames.js fails the syntax gate"; exit 1; }
head -c 200 dist/frames.js | grep -q 'Open Source Orchestra Frames v' || { echo "✗ the credit banner did not survive the minifier"; exit 1; }
echo "frames.js served minified: $(wc -c < frames.js) → $(wc -c < dist/frames.js) bytes ($(gzip -9 -c dist/frames.js | wc -c) gzip)"
[ -d lib ] && cp -r lib dist/          # v0.1.12: the lazy wallet connect module + QR + sign-up hook (+ the vendored Apache-2.0 SDK with its NOTICE)
[ -d trademark ] && cp -r trademark dist/
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
  Cache-Control: public, max-age=300, stale-while-revalidate=3600
/frames.src.js
  ! Cache-Control
  Cache-Control: public, max-age=300
/frames.min.js
  ! Cache-Control
  Cache-Control: public, max-age=300
/frames/*
  ! Cache-Control
  Cache-Control: public, max-age=300, stale-while-revalidate=3600
/media/*
  ! Cache-Control
  Cache-Control: public, max-age=86400
/lib/owh.js
  ! Cache-Control
  Cache-Control: public, max-age=300
/lib/owh-signup.min.js
  ! Cache-Control
  Cache-Control: public, max-age=300
/lib/owh-qr.min.js
  ! Cache-Control
  Cache-Control: public, max-age=86400
/lib/base-account-2.6.0.min.js
  ! Cache-Control
  Cache-Control: public, max-age=31536000, immutable
/lib/*.txt
  Content-Type: text/plain; charset=utf-8
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
if [ "${1:-}" = "--stage" ]; then
  TAG="$(git rev-parse --short HEAD 2>/dev/null || echo untracked)"; MSG="$(git log -1 --format=%s 2>/dev/null | cut -c1-120)"
  echo "staging a version (0 traffic) tag=$TAG"
  wr versions upload --tag "$TAG" --message "${MSG:-stage}" || exit 1
  echo "next: ./deploy.sh --smoke <Version ID above>"; exit 0
fi
wr deploy
