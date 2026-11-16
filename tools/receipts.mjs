// SPDX-License-Identifier: AGPL-3.0-or-later
// Writes media/receipts.json from the repository itself (no hand-typed numbers).
// Usage: node tools/receipts.mjs [--sketch 2026-11-16T04:28:24Z] [--checks N]
import { execSync } from 'node:child_process';
import { statSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const sh = (c) => execSync(c, { encoding: 'utf8' }).trim();
const sketch = new Date(arg('--sketch', '2026-11-16T04:28:24Z'));     // Shaka's message with the drawn frame (11:28 BKK)
const commits = +sh('git rev-list --count HEAD');
const first = new Date(sh('git log --reverse --format=%cI | head -1'));
const now = new Date();
const kb = existsSync('frames.js') ? Math.round(statSync('frames.js').size / 102.4) / 10 : null;
let checks = arg('--checks', null);
if (!checks && existsSync('tests/out/checks.json')) { try { checks = JSON.parse(readFileSync('tests/out/checks.json', 'utf8')).passed; } catch (e) {} }
const hours = Math.round((now - sketch) / 36e5 * 10) / 10;
const out = {
  hours: hours + ' h', commits, kb: kb ?? '—', tests: checks ?? '—',
  sketch: sketch.toISOString(), first_commit: first.toISOString(), built: now.toISOString(),
  note: `Sketch ${sketch.toISOString().slice(0, 16)}Z → this build ${now.toISOString().slice(0, 16)}Z · ${commits} commits · frames.js ${kb} KB · numbers derived from git at build time.`
};
writeFileSync('media/receipts.json', JSON.stringify(out, null, 2) + '\n');
console.log(out.note);
