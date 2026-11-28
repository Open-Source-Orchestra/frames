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
const ORDER = ['door', 'globe', 'theater', 'totem', 'chat', 'radio', 'signature', 'thanks', 'gift'];   // fixed order; missing files are fine
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

// gate 2a · lib/owh.js — the ʻohana wallet connect picker as a standalone LAZY module (fetched by the 🌊 card on the first intent, never on page load).
// Built from the readable src/lib/owh.js; it sets window.OWH only if absent (idempotent beside an inlined copy) and carries no dependency.
const owhSrc = existsSync(join(ROOT, 'src/lib/owh.js')) ? read('src/lib/owh.js') : '';
if (owhSrc) {
  const OWH_VERSION = (/version: '([0-9.]+)'/.exec(owhSrc) || [])[1] || '?';
  const owhBundle = `/*! owh · ʻohana wallet connect v${OWH_VERSION} · standalone lazy module of Open Source Orchestra Frames v${VERSION}\n *  SPDX-License-Identifier: GPL-3.0-or-later · Built by Open Source Orchestra: Shaka Lei Kaumaka & the AI ʻohana (https://opensourceorchestra.org)\n *  Source of this exact file: https://github.com/Open-Source-Orchestra/frames → src/lib/owh.js (sets window.OWH only if absent) */\n` +
    "(function(){'use strict';if(window.OWH)return;\n" + owhSrc.trim() + "\nwindow.OWH=OWH;})();\n";
  const tmp2 = mkdtempSync(join(tmpdir(), 'osof-'));
  const f2 = join(tmp2, 'owh.js'); writeFileSync(f2, owhBundle);
  syntax('lib/owh.js (bundle, strict mode)', f2); rmSync(tmp2, { recursive: true, force: true });
  if (CHECK_ONLY) {
    const disk = existsSync(join(ROOT, 'lib/owh.js')) ? read('lib/owh.js') : '';
    if (disk === owhBundle) ok('lib/owh.js is up to date with src/lib/owh.js'); else fail('lib/owh.js is stale or missing — run: node build.mjs');
  } else if (!failed) { writeFileSync(join(ROOT, 'lib/owh.js'), owhBundle); ok('wrote lib/owh.js'); }
  // the vendored lazy files must exist (the card and the sign-up row fetch them from our own origin, never a third party)
  for (const f of ['lib/owh-qr.min.js', 'lib/owh-signup.min.js', 'lib/base-account-2.6.0.min.js', 'lib/base-account-2.6.0.min.js.NOTICE.txt', 'LICENSES/Apache-2.0.txt']) {
    if (existsSync(join(ROOT, f))) ok(`present ${f}`); else fail(`missing ${f}`);
  }
}

// gate 2b · every dataset validates against schema/frame-0.1.json (a small built-in validator: the subset the schema uses),
// door frames (frames/doors/<host>.json) are also merged onto their parent with the SAME code the browser runs
// (src/core.js → FRAMES._.mergeFrame) and the merged frame validates too. frames/doors/index.json (the gallery) is rebuilt.
import { createContext, runInContext } from 'node:vm';
const schema = JSON.parse(read('schema/frame-0.1.json'));
function validate(root, value, sch, path, errs, depth = 0) {
  if (depth > 40 || !sch || typeof sch !== 'object') return;
  if (sch.$ref) { const m = /^#\/\$defs\/([\w-]+)$/.exec(sch.$ref); if (!m || !root.$defs[m[1]]) { errs.push(`${path}: unknown $ref ${sch.$ref}`); return; } return validate(root, value, root.$defs[m[1]], path, errs, depth + 1); }
  const type = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
  if (sch.type && sch.type !== type && !(sch.type === 'integer' && Number.isInteger(value))) { errs.push(`${path}: expected ${sch.type}, got ${type}`); return; }
  if (sch.const !== undefined && JSON.stringify(value) !== JSON.stringify(sch.const)) errs.push(`${path}: must be ${JSON.stringify(sch.const)}`);
  if (sch.enum && !sch.enum.some((e) => JSON.stringify(e) === JSON.stringify(value))) errs.push(`${path}: must be one of ${sch.enum.join('|')}`);
  if (type === 'string') {
    if (sch.minLength != null && value.length < sch.minLength) errs.push(`${path}: shorter than ${sch.minLength}`);
    if (sch.maxLength != null && value.length > sch.maxLength) errs.push(`${path}: longer than ${sch.maxLength}`);
    if (sch.pattern && !new RegExp(sch.pattern, 'u').test(value)) errs.push(`${path}: does not match ${sch.pattern}`);
  }
  if (type === 'number') {
    if (sch.minimum != null && value < sch.minimum) errs.push(`${path}: below ${sch.minimum}`);
    if (sch.maximum != null && value > sch.maximum) errs.push(`${path}: above ${sch.maximum}`);
  }
  if (type === 'array') {
    if (sch.minItems != null && value.length < sch.minItems) errs.push(`${path}: fewer than ${sch.minItems} items`);
    if (sch.maxItems != null && value.length > sch.maxItems) errs.push(`${path}: more than ${sch.maxItems} items`);
    if (sch.items) value.forEach((v, i) => validate(root, v, sch.items, `${path}[${i}]`, errs, depth + 1));
  }
  if (type === 'object') {
    for (const k of sch.required || []) if (!(k in value)) errs.push(`${path}: missing "${k}"`);
    for (const k of Object.keys(value)) {
      if (sch.properties && k in sch.properties) validate(root, value[k], sch.properties[k], `${path}.${k}`, errs, depth + 1);
      else if (sch.additionalProperties === false) errs.push(`${path}: unknown field "${k}"`);
      else if (sch.additionalProperties && typeof sch.additionalProperties === 'object') validate(root, value[k], sch.additionalProperties, `${path}.${k}`, errs, depth + 1);
    }
  }
  if (sch.allOf) for (const sub of sch.allOf) validate(root, value, sub, path, errs, depth + 1);
  if (sch.anyOf) { const ok = sch.anyOf.some((sub) => { const e = []; validate(root, value, sub, path, e, depth + 1); return !e.length; }); if (!ok) errs.push(`${path}: matches none of the allowed shapes`); }
  if (sch.oneOf) { const n = sch.oneOf.filter((sub) => { const e = []; validate(root, value, sub, path, e, depth + 1); return !e.length; }).length; if (n !== 1) errs.push(`${path}: must match exactly one shape (matched ${n})`); }
  if (sch.if) { const e = []; validate(root, value, sch.if, path, e, depth + 1); if (!e.length && sch.then) validate(root, value, sch.then, path, errs, depth + 1); if (e.length && sch.else) validate(root, value, sch.else, path, errs, depth + 1); }
}
function check(obj, label) { const errs = []; validate(schema, obj, schema, label, errs); return errs; }
// the browser's own merge, run here in node (core.js is a plain IIFE; with no window it still returns the api)
const vmCtx = createContext({ console });
runInContext(core + '\n;FRAMES', vmCtx);
const FR = runInContext('FRAMES', vmCtx);
const mergeFrame = FR && FR._ && FR._.mergeFrame;
if (typeof mergeFrame !== 'function') fail('core.js does not expose FRAMES._.mergeFrame');
const dsFiles = (existsSync(join(ROOT, 'frames')) ? readdirSync(join(ROOT, 'frames')) : []).filter((f) => f.endsWith('.json')).map((f) => 'frames/' + f);
const doorFiles = existsSync(join(ROOT, 'frames/doors')) ? readdirSync(join(ROOT, 'frames/doors')).filter((f) => f.endsWith('.json') && f !== 'index.json').map((f) => 'frames/doors/' + f) : [];
let dsBad = 0;
const loadJSON = (p) => { try { return JSON.parse(read(p)); } catch (e) { fail(`${p}: not valid JSON (${e.message})`); dsBad++; return null; } };
for (const p of dsFiles) { const d = loadJSON(p); if (!d) continue; const e = check(d, p); if (e.length) { dsBad++; fail(`${p} fails the schema:\n    ` + e.slice(0, 8).join('\n    ')); } if (d.extends) { dsBad++; fail(`${p}: a base dataset must not use "extends"`); } }
const gallery = [];
for (const p of doorFiles) {
  const d = loadJSON(p); if (!d) continue;
  const host = p.slice('frames/doors/'.length, -5);
  let e = check(d, p);
  if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(host)) e.push(`${p}: the file name must be the lower-case host (frames/doors/<host>.json)`);
  if (d.host && d.host !== host) e.push(`${p}: "host" is ${d.host} but the file is for ${host}`);
  if (!d.extends) e.push(`${p}: a door frame must "extends" a base dataset (../universe.json)`);
  let merged = null;
  if (d.extends && typeof d.extends === 'string') {
    const parentPath = join('frames/doors', d.extends).replace(/\\/g, '/');
    if (!existsSync(join(ROOT, parentPath))) e.push(`${p}: extends ${d.extends} → ${parentPath} does not exist`);
    else if (mergeFrame) { const parent = loadJSON(parentPath); if (parent) { merged = mergeFrame(parent, d); e = e.concat(check(merged, p + ' (merged)').map((x) => x)); if (merged.id === parent.id) e.push(`${p}: give the door its own "id" (now equal to the parent's "${parent.id}")`); } }
  }
  if (e.length) { dsBad++; fail(`${p} fails:\n    ` + e.slice(0, 10).join('\n    ')); continue; }
  const items = merged ? Object.values(merged.slots).reduce((n, l) => n + l.length, 0) : 0;
  const doors = merged ? Object.values(merged.slots).reduce((n, l) => n + l.filter((it) => it.kind === 'door').length, 0) : 0;
  gallery.push({ host, file: p.replace(/^frames\/doors\//, ''), id: merged ? merged.id : d.id, name: merged ? merged.name : d.name, emoji: (merged && merged.emoji) || d.emoji || '🎻', accent: (merged && merged.accent) || '', extends: d.extends, items, doors, signature: merged ? merged.slots.overlay.some((it) => it.kind === 'signature') : false, url: 'https://' + host + '/' });
}
// gate 2c · v0.1.12 — every dataset's Blessing Pool door must carry "gift": true (frames/oso.json lacked it from v0.1.7 to v0.1.11: the flagship's 🌊 never opened the card)
for (const p of dsFiles) { const d = loadJSON(p); if (!d) continue; for (const [slot, items] of Object.entries(d.slots || {})) for (const it of (Array.isArray(items) ? items : [])) if (it && it.kind === 'door' && /^https:\/\/blessingpool\.com\/?$/.test(it.href || '') && it.gift !== true) { dsBad++; fail(`${p} → ${slot}: the Blessing Pool door must carry "gift": true (the 🌊 opens the pennies-of-aloha card)`); } }
if (!dsBad) ok(`${dsFiles.length} dataset(s) + ${doorFiles.length} door frame(s) validate against schema/frame-0.1.json (door frames also merged)`);
if (doorFiles.length) {
  gallery.sort((a, b) => a.host.localeCompare(b.host));
  const idx = JSON.stringify({ frame: 'osoframes/0.1', built: 'by build.mjs — do not edit; add a frames/doors/<host>.json instead', license: 'CC-BY-SA-4.0', credit: 'Built on Open Source Orchestra Frames by Open Source Orchestra: Shaka Lei Kaumaka & the AI ʻohana (https://opensourceorchestra.org)', count: gallery.length, doors: gallery }, null, 1) + '\n';
  const idxPath = join(ROOT, 'frames/doors/index.json');
  if (CHECK_ONLY) { if (existsSync(idxPath) && readFileSync(idxPath, 'utf8') === idx) ok('frames/doors/index.json is up to date'); else fail('frames/doors/index.json is stale — run: node build.mjs'); }
  else if (!dsBad) { writeFileSync(idxPath, idx); ok(`wrote frames/doors/index.json (${gallery.length} door frames)`); }
}

// gate 3 · no secrets anywhere we ship (SPEC §9)
const SECRET = /(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[abpr]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{30,})/;
const shipped = ['frames.js', ...dsFiles, ...doorFiles];
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
