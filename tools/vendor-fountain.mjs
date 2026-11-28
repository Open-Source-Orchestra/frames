#!/usr/bin/env node
// Open Source Orchestra Frames · tools/vendor-fountain.mjs — bring the Universe Fountain's built artifacts into this repo (v0.1.18, 28 Nov 2026)
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The Fountain (GPL-3.0-or-later) is built in its own repo (source of truth on the build box: /shared/fountain — `node build.mjs` there writes
// dist/fountain.js + dist/fountain.min.js). The frames Worker PUBLISHES it for every door (LAUNCHER.md contract):
//   lib/fountain.js        ← dist/fountain.min.js   (served as https://frames.opensourceorchestra.org/lib/fountain.js, the bytes a door runs)
//   lib/fountain.src.js    ← dist/fountain.js       (the readable source of those exact bytes, GPL: next to it, like /frames.src.js)
//   fountain-config.json   ← preview/fountain-config.json (the KILL SWITCH: served `cache-control: no-cache`; the Fountain reads it with ?t=<now> + cache:'no-store')
//   lib/fountain.SOURCE.txt — where these bytes came from (repo path + git commit + date), so a reader of the served file can find the source.
// usage: node tools/vendor-fountain.mjs [/path/to/fountain-repo]      (default /shared/fountain) · exit 1 if anything is missing or unsafe
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.argv[2] || '/shared/fountain';
const PAYTO = '0x25965899f4600b3AA5362ee4f34be95E5E62c934';   // the ONE address (Shaka's law, 23 Nov 2026) — a config naming another payee never ships
const files = [['dist/fountain.min.js', 'lib/fountain.js'], ['dist/fountain.js', 'lib/fountain.src.js'], ['preview/fountain-config.json', 'fountain-config.json']];
let bad = 0; const fail = (m) => { bad++; console.error('✗ ' + m); };
for (const [from] of files) if (!existsSync(join(SRC, from))) fail(`missing ${join(SRC, from)}`);
if (bad) process.exit(1);
const min = readFileSync(join(SRC, 'dist/fountain.min.js'), 'utf8');
const cfg = JSON.parse(readFileSync(join(SRC, 'preview/fountain-config.json'), 'utf8'));
if (!/OSOFountain/.test(min)) fail('dist/fountain.min.js does not define OSOFountain');
if (!min.includes(PAYTO)) fail('dist/fountain.min.js does not pin the ʻohana wallet ' + PAYTO);
if (cfg.payTo !== PAYTO) fail('fountain-config.json names another payee: ' + cfg.payTo);
if (cfg.enabled !== true) console.log('  ⚠ fountain-config.json ships with enabled=false (wallet gifts rest) — intended?');
if (bad) process.exit(1);
let rev = 'unknown', when = new Date().toISOString();
try { rev = execFileSync('git', ['-C', SRC, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch (e) { /* not a git checkout */ }
for (const [from, to] of files) { writeFileSync(join(ROOT, to), readFileSync(join(SRC, from))); console.log(`✓ ${to}  ← ${from}  (${statSync(join(ROOT, to)).size} bytes)`); }
const ver = (/var (?:VERSION|[A-Za-z_$]+)="?'?([0-9]+\.[0-9]+\.[0-9]+)/.exec(min) || [])[1] || '?';
writeFileSync(join(ROOT, 'lib/fountain.SOURCE.txt'), `lib/fountain.js = the Universe Fountain v${ver} (minified build) · lib/fountain.src.js = the readable source of those exact bytes\n` +
  `License: GPL-3.0-or-later · Built by Open Source Orchestra: Shaka Lei Kaumaka & the AI ʻohana (https://opensourceorchestra.org) — a machine made it\n` +
  `Vendored from the Fountain repo at commit ${rev} on ${when} by tools/vendor-fountain.mjs (frames repo: https://github.com/Open-Source-Orchestra/frames)\n` +
  `Kill switch: /fountain-config.json (served no-cache) — {enabled, disabledChains[], message, payTo}; the payee is pinned in code, a config naming another payee is refused.\n`);
console.log(`✓ lib/fountain.SOURCE.txt (fountain v${ver}, source commit ${rev})`);
