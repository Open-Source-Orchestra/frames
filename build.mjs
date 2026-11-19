#!/usr/bin/env node
// Open Source Orchestra Frames · build.mjs — concatenates src/ → frames.js (one readable file, no dependencies)
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Shaka Lei Kaumaka / Open Source Orchestra and the AI ʻohana
//
//   node build.mjs           build frames.js, then run every gate below on it
//   node build.mjs --check   gates only (syntax of every src file + the bundle, frames.js up to date, no secrets)
//   node build.mjs --strict  also fail when frames.js is over the 70 KB target
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const ORDER = ['door', 'globe', 'theater', 'totem', 'chat', 'radio', 'signature'];   // fixed order; missing files are fine
const TARGET = 70 * 1024;
const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has('--check'), STRICT = args.has('--strict');

const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const core = read('src/core.js');
const VERSION = (/var VERSION = '([0-9.]+)'/.exec(core) || [])[1];
if (!VERSION) { console.error('✗ cannot find VERSION in src/core.js'); process.exit(1); }

// SPEC §7 — the banner, exactly
const BANNER = `/*! Open Source Orchestra Frames v${VERSION} · https://github.com/Open-Source-Orchestra/frames
 *  SPDX-License-Identifier: AGPL-3.0-or-later · Copyright (C) 2026 Shaka Lei Kaumaka / Open Source Orchestra and the AI ʻohana
 *  AGPL §7(b): keep the credit "Built on Open Source Orchestra Frames by Open Source Orchestra: Shaka Lei Kaumaka & the AI ʻohana
 *  (https://opensourceorchestra.org)" visible in the frame. See NOTICE. Source of this exact file: https://github.com/Open-Source-Orchestra/frames */
`;

const pieces = ORDER.map((k) => ({ k, p: `src/pieces/${k}.js` })).filter((x) => existsSync(join(ROOT, x.p)));
const extra = existsSync(join(ROOT, 'src/pieces')) ? readdirSync(join(ROOT, 'src/pieces')).filter((f) => f.endsWith('.js') && !ORDER.includes(f.slice(0, -3))) : [];
if (extra.length) console.log(`  · not in the build order (ignored): ${extra.join(', ')}`);

const bundle = BANNER + "(function(){'use strict';\n" +
  '// ── src/core.js ──\n' + core.trim() + '\n' +
  pieces.map((x) => `// ── ${x.p} ──\n` + read(x.p).trim() + '\n').join('') +
  'FRAMES.boot();\n})();\n';

let failed = false;
const fail = (msg) => { failed = true; console.error('✗ ' + msg); };
const ok = (msg) => console.log('✓ ' + msg);

// gate 1 · syntax of every source file and of the bundle (node --check)
const tmp = mkdtempSync(join(tmpdir(), 'osof-'));
function syntax(label, file) {
  try { execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }); ok(`syntax ${label}`); }
  catch (e) { fail(`syntax ${label}\n${String(e.stderr || e.message).trim()}`); }
}
syntax('src/core.js', join(ROOT, 'src/core.js'));
for (const x of pieces) syntax(x.p, join(ROOT, x.p));
const tmpBundle = join(tmp, 'frames.js');
writeFileSync(tmpBundle, bundle);
syntax('frames.js (bundle, strict mode)', tmpBundle);
rmSync(tmp, { recursive: true, force: true });

// gate 2 · the bundle on disk is this build
if (CHECK_ONLY) {
  const disk = existsSync(join(ROOT, 'frames.js')) ? read('frames.js') : '';
  if (disk === bundle) ok('frames.js is up to date with src/');
  else fail('frames.js is stale or missing — run: node build.mjs');
} else if (!failed) {
  writeFileSync(join(ROOT, 'frames.js'), bundle);
  ok('wrote frames.js');
}

// gate 3 · no secrets anywhere we ship (SPEC §9)
const SECRET = /(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[abpr]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{30,})/;
const shipped = ['frames.js', ...(existsSync(join(ROOT, 'frames')) ? readdirSync(join(ROOT, 'frames')) : []).filter((f) => f.endsWith('.json')).map((f) => 'frames/' + f)];
const leaks = [bundle, ...shipped.filter((p) => existsSync(join(ROOT, p))).map(read)].filter((s) => SECRET.test(s));
if (leaks.length) fail('something that looks like a secret is in the bundle or a dataset'); else ok('no secrets in the bundle or datasets');

// report · size and the one-time law's usual suspects (loops are reported, not fatal: chat may need a heartbeat)
const bytes = Buffer.byteLength(bundle), gz = gzipSync(bundle).length;
const kb = (n) => (n / 1024).toFixed(1) + ' KB';
console.log(`  · frames.js ${kb(bytes)} (${kb(gz)} gzip) · core + ${pieces.map((x) => x.k).join(', ') || 'no pieces'}`);
for (const k of ORDER) if (!pieces.some((x) => x.k === k)) console.log(`  · piece "${k}" not present — the frame skips it`);
if (bytes > TARGET) (STRICT ? fail : (m) => console.log('  ⚠ ' + m))(`frames.js is over the ${kb(TARGET)} target`);
const loops = bundle.split('\n').map((l, i) => [l, i + 1]).filter(([l]) => /\binfinite\b|setInterval\s*\(/.test(l) && !/osof:allow-loop/.test(l) && !/^\s*(\/\/|\*)/.test(l));
if (loops.length) console.log(`  ⚠ one-time law: ${loops.length} line(s) with "infinite"/setInterval — make sure each is user-initiated or not motion:\n` + loops.map(([l, n]) => `    frames.js:${n}: ${l.trim().slice(0, 110)}`).join('\n'));

process.exit(failed ? 1 : 0);
