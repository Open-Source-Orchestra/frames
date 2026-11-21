#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later · Copyright (C) 2026 Shaka Lei Kaumaka / Open Source Orchestra and the AI ʻohana
// v0.1.1 e2e (Playwright, local server only — nothing reaches a real hub):
//   ⚙ control panel (frame off → one dot → back on; a piece off and on, remembered) · ?frame=off untouched ·
//   data-door="auto" resolves frames/doors/<host>.json (merged on universe.json; accent applied) and falls back ·
//   BUTTON LAW: a full-width text page on a narrow desktop folds the rails into the 🎻 sheet; the 🎻 never sits on text.
// usage: node tests/e2e-settings.mjs
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.vtt': 'text/vtt', '.jpg': 'image/jpeg', '.mp4': 'video/mp4' };
const PAGE = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{margin:0;font:17px/1.6 Georgia,serif;background:#141230;color:#eee}main{padding:24px 0}p{margin:0 0 14px}</style></head><body><main>${body}</main>
<script src="/frames.js" data-door="auto" defer></script></body></html>`;
const WIDE = PAGE('wide text', Array.from({ length: 40 }, (_, i) => `<p>Paragraph ${i + 1}: this ordinary page runs its text from the very left edge to the very right edge of the window, so a frame that keeps its law must not sit on these words. ${'More words. '.repeat(12)}</p>`).join(''));
const NARROW = PAGE('narrow text', `<div style="max-width:560px;margin:0 auto">` + Array.from({ length: 30 }, (_, i) => `<p>Centred paragraph ${i + 1}. ${'Words in the middle. '.repeat(8)}</p>`).join('') + '</div>');
const HERO = PAGE('hero then text', `<div style="height:280px"></div><div style="max-width:560px;margin:0 auto">` + Array.from({ length: 30 }, (_, i) => `<p>Paragraph ${i + 1}. ${'Words below a quiet hero. '.repeat(8)}</p>`).join('') + '</div>');

async function loadPlaywright() {
  try { return await import('playwright'); } catch (e) { /* next */ }
  const roots = ['/usr/lib/node_modules/', '/usr/local/lib/node_modules/', ...(process.env.NODE_PATH || '').split(':').filter(Boolean).map((p) => p.replace(/\/?$/, '/'))];
  try { roots.unshift(require('node:child_process').execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim() + '/'); } catch (e) { /* no npm */ }
  for (const r of roots) { try { return createRequire(r)('playwright'); } catch (e) { /* next */ } }
  throw new Error('playwright not found');
}
const require = createRequire(import.meta.url);

// the server answers for ANY host name (Host header) so data-door="auto" can be tested per host
function serve() {
  return new Promise((res) => {
    const srv = http.createServer(async (req, rsp) => {
      const u = new URL(req.url, 'http://x');
      try {
        if (u.pathname === '/wide.html') return rsp.writeHead(200, { 'content-type': TYPES['.html'] }).end(WIDE);
        if (u.pathname === '/narrow.html') return rsp.writeHead(200, { 'content-type': TYPES['.html'] }).end(NARROW);
        if (u.pathname === '/hero.html') return rsp.writeHead(200, { 'content-type': TYPES['.html'] }).end(HERO);
        if (u.pathname.startsWith('/__hub')) { rsp.writeHead(500).end('{}'); return; }
        const p = join(ROOT, decodeURIComponent(u.pathname));
        const body = await readFile(p);
        rsp.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream', 'access-control-allow-origin': '*' }).end(body);
      } catch (e) { rsp.writeHead(404).end('not found'); }
    });
    srv.listen(0, '127.0.0.1', () => res({ port: srv.address().port, close: () => srv.close() }));
  });
}

let fails = 0;
const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fails++; };

const { chromium } = await loadPlaywright();
const srv = await serve();
const b = await chromium.launch();
// every request is pinned to our local server, whatever host the page claims (publicinform.com → 127.0.0.1); nothing else is allowed
async function ctxFor(host, viewport, mobile) {
  const ctx = await b.newContext({ viewport, isMobile: !!mobile, hasTouch: !!mobile });
  await ctx.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (u.hostname === host || u.hostname === '127.0.0.1') return route.continue({ url: `http://127.0.0.1:${srv.port}${u.pathname}${u.search}` });
    if (/lang\.opensourceorchestra\.org/.test(u.hostname)) return route.fulfill({ status: 200, contentType: 'text/javascript', body: '/* lang.js stub */' });
    return route.abort();            // FAIL CLOSED: no real hub, no real door
  });
  return ctx;
}
const errsOf = (p) => { const e = []; p.on('pageerror', (x) => e.push('PE:' + String(x).slice(0, 160))); p.on('console', (m) => { if (m.type() === 'error') e.push('CE:' + m.text().slice(0, 160)); }); p.on('response', (r) => { if (r.status() >= 400) e.push('HTTP' + r.status() + ':' + r.url().slice(0, 120)); }); return e; };

// 1 · data-door="auto" on a known host → that door frame, merged, with its accent
{
  const ctx = await ctxFor('publicinform.com', { width: 1280, height: 800 });
  const p = await ctx.newPage(); const errs = errsOf(p);
  await p.goto('http://publicinform.com/narrow.html?frame=fresh', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached', timeout: 15000 });
  const r = await p.evaluate(() => ({ id: OSOFrames.data.id, accent: getComputedStyle(document.getElementById('oso-frames')).getPropertyValue('--osof-accent').trim(), first: OSOFrames.data.slots.left[0].id, pitGone: !OSOFrames.data.slots.left.some((i) => i.id === 'pit'), n: OSOFrames.data.slots.left.length, version: OSOFrames.version, gear: !!document.querySelector('#oso-frames .osof-credit-g') }));
  ok(r.id === 'pit-protocol', `data-door=auto on publicinform.com → id ${r.id}`);
  ok(r.accent === '#7fe0ff', `accent applied (${r.accent})`);
  ok(r.first === 'home' && r.pitGone && r.n >= 10, `slot ops: prepend + remove (left: ${r.n} items, first ${r.first})`);
  ok(r.version === '0.1.1' && r.gear, `v${r.version} with the ⚙ gear in the credit mark`);
  ok(!errs.length, 'no console/page errors' + (errs.length ? ' → ' + errs.join(' | ') : ''));
  await ctx.close();
}
// 2 · unknown host → the universe frame (fallback), no error
{
  const ctx = await ctxFor('nobody.example', { width: 1280, height: 800 });
  const p = await ctx.newPage(); const errs = errsOf(p);
  await p.goto('http://nobody.example/narrow.html', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached', timeout: 15000 });
  const id = await p.evaluate(() => OSOFrames.data.id);
  ok(id === 'oso-universe', `unknown host falls back to universe (${id})`);
  ok(!errs.length, 'fallback without errors' + (errs.length ? ' → ' + errs.join(' | ') : ''));
  await ctx.close();
}
// 3 · the ⚙ panel: off → dot → on · a piece off, remembered across a reload · ?frame=off still renders nothing
{
  const ctx = await ctxFor('publicinform.com', { width: 1280, height: 800 });
  const p = await ctx.newPage(); const errs = errsOf(p);
  await p.goto('http://publicinform.com/narrow.html', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' });
  await p.click('#oso-frames .osof-credit-g');
  const open = await p.evaluate(() => { const d = document.getElementById('osof-dlg-settings'); return d && !d.hidden && d.getAttribute('role') === 'dialog' && !!d.querySelector('[role=switch]'); });
  ok(open, '⚙ opens an accessible settings dialog with switches');
  const nSw = await p.evaluate(() => document.querySelectorAll('#osof-dlg-settings [role=switch]').length);
  ok(nSw >= 6, `${nSw} switches (frame + pieces)`);
  // radio off
  await p.click('#osof-dlg-settings .osof-sws [role=switch]:has-text("Radio")');
  let r = await p.evaluate(() => ({ hid: !!document.querySelector('#oso-frames [data-osof-kind=radio][data-osof-hid]'), vis: !!document.querySelector('#oso-frames [data-osof-kind=radio]:not([data-osof-hid])'), ls: localStorage.getItem('osof:settings:v1') }));
  ok(r.hid && !r.vis && /"radio":true/.test(r.ls || ''), `radio off → hidden and remembered (${r.ls})`);
  // frame off
  await p.click('#osof-dlg-settings .osof-sw-big');
  r = await p.evaluate(() => ({ off: document.getElementById('oso-frames').hasAttribute('data-osof-off'), dot: !!document.querySelector('#oso-frames .osof-dot'), slots: [...document.querySelectorAll('#oso-frames .osof-slot')].every((z) => getComputedStyle(z).display === 'none'), recs: document.querySelectorAll('#oso-frames .osof-item').length, title: (document.querySelector('#oso-frames .osof-dot') || {}).title || '' }));
  ok(r.off && r.dot && r.slots && r.recs === 0, `frame off → slots gone, one dot (${r.recs} items left)`);
  ok(/Built on Open Source Orchestra Frames/.test(r.title), 'the dot carries the AGPL §7(b) credit');
  await p.reload({ waitUntil: 'load' }); await p.waitForSelector('#oso-frames', { state: 'attached' });
  await p.waitForTimeout(600);
  r = await p.evaluate(() => ({ off: document.getElementById('oso-frames').hasAttribute('data-osof-off'), dot: !!document.querySelector('#oso-frames .osof-dot'), sig: !!document.querySelector('.osof-sig') }));
  ok(r.off && r.dot && !r.sig, 'off is remembered after a reload (dot only, no signature)');
  await p.keyboard.press('Escape');
  await p.focus('#oso-frames .osof-dot'); await p.keyboard.press('Enter');
  await p.waitForTimeout(400);
  r = await p.evaluate(() => ({ on: !document.getElementById('oso-frames').hasAttribute('data-osof-off'), items: document.querySelectorAll('#oso-frames .osof-item').length, radioHid: !document.querySelector('#oso-frames [data-osof-kind=radio]:not([data-osof-hid])'), focus: document.activeElement && document.activeElement.className }));
  ok(r.on && r.items > 10, `the dot brings the frame back by keyboard (${r.items} items)`);
  ok(r.radioHid, 'the radio stays off (its own switch)');
  await p.click('#oso-frames .osof-credit-g');
  await p.click('#osof-dlg-settings .osof-sws [role=switch]:has-text("Radio")');
  r = await p.evaluate(() => ({ radioHid: !!document.querySelector('#oso-frames [data-osof-kind=radio][data-osof-hid]'), vis: !!document.querySelector('#oso-frames [data-osof-kind=radio]') }));
  ok(!r.radioHid && r.vis, 'radio back on');
  const api = await p.evaluate(() => OSOFrames.settings());
  ok(api.on === true && !api.hide.radio && api.groups.includes('radio'), 'OSOFrames.settings() reports the state');
  await p.goto('http://publicinform.com/narrow.html?frame=off', { waitUntil: 'load' }); await p.waitForTimeout(500);
  ok(await p.evaluate(() => !document.getElementById('oso-frames')), '?frame=off still renders nothing at all');
  ok(!errs.length, 'no errors across the panel flow' + (errs.length ? ' → ' + errs.join(' | ') : ''));
  await ctx.close();
}
// 4 · BUTTON LAW: edge-to-edge text on a 900px desktop → rails fold into the 🎻 sheet; no text under the sheet button
{
  const ctx = await ctxFor('nobody.example', { width: 900, height: 700 });
  const p = await ctx.newPage(); const errs = errsOf(p);
  await p.goto('http://nobody.example/wide.html', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(1800);
  let r = await p.evaluate(() => { const F = document.getElementById('oso-frames'); const sb = F.querySelector('.osof-sheetbtn'); const r = sb.getBoundingClientRect(); const under = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2).filter((e) => !F.contains(e)).find((e) => /^(P|LI|H\d)$/.test(e.tagName)); return { mode: F.getAttribute('data-mode'), crowded: F.hasAttribute('data-osof-crowded'), railsShown: [...F.querySelectorAll('[data-slot=left],[data-slot=right]')].some((z) => getComputedStyle(z).display !== 'none'), sheetVisible: r.width > 0, folded: sb.classList.contains('osof-fold'), textUnderSheet: !!under && !sb.classList.contains('osof-fold') }; });
  ok(r.crowded && r.mode === 'mobile' && !r.railsShown, `edge-to-edge text → rails fold into the sheet (mode ${r.mode})`);
  ok(r.sheetVisible && !r.textUnderSheet, `the 🎻 sits on no text (folded: ${r.folded})`);
  await p.goto('http://nobody.example/narrow.html', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(1200);
  r = await p.evaluate(() => { const F = document.getElementById('oso-frames'); return { mode: F.getAttribute('data-mode'), crowded: F.hasAttribute('data-osof-crowded') }; });
  ok(!r.crowded && r.mode === 'desktop', 'centred text → full rails on desktop');
  ok(!errs.length, 'no errors on the law pages' + (errs.length ? ' → ' + errs.join(' | ') : ''));
  await ctx.close();
}
// 5 · phone: the ✕ folds the 🎻 to a dot (remembered); the dot unfolds it
{
  const ctx = await ctxFor('nobody.example', { width: 390, height: 844 }, true);
  const p = await ctx.newPage(); const errs = errsOf(p);
  await p.goto('http://nobody.example/wide.html', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(800);
  let r = await p.evaluate(() => { const sb = document.querySelector('#oso-frames .osof-sheetbtn'); return { folded: sb.classList.contains('osof-fold'), ls: localStorage.getItem('osof:fold:sheet') }; });
  ok(r.folded && r.ls === null, 'phone + edge-to-edge text: the 🎻 folds to a dot for this page view only (BUTTON LAW)');
  await p.goto('http://nobody.example/hero.html', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(800);
  r = await p.evaluate(() => { const x = document.querySelector('#oso-frames .osof-fold-x'); const r = x.getBoundingClientRect(); return { x: !!x && r.width > 0, label: x.getAttribute('aria-label') }; });
  ok(r.x && /Hide/.test(r.label), 'the mobile 🎻 carries a tiny ✕ (fold)');
  await p.click('#oso-frames .osof-fold-x');
  r = await p.evaluate(() => { const sb = document.querySelector('#oso-frames .osof-sheetbtn'); const rr = sb.getBoundingClientRect(); return { folded: sb.classList.contains('osof-fold'), w: Math.round(rr.width), ls: localStorage.getItem('osof:fold:sheet') }; });
  ok(r.folded && r.w <= 22 && r.ls === '1', `✕ folds the 🎻 to a ${r.w}px dot, remembered`);
  await p.reload({ waitUntil: 'load' }); await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(600);
  ok(await p.evaluate(() => document.querySelector('#oso-frames .osof-sheetbtn').classList.contains('osof-fold')), 'still folded after a reload');
  await p.click('#oso-frames .osof-sheetbtn');
  r = await p.evaluate(() => { const sb = document.querySelector('#oso-frames .osof-sheetbtn'); return { folded: sb.classList.contains('osof-fold'), ls: localStorage.getItem('osof:fold:sheet'), sheetOpen: !!document.querySelector('#osof-dlg-sheet:not([hidden])') }; });
  ok(!r.folded && r.ls === null && !r.sheetOpen, 'tapping the dot unfolds (no sheet opens on that tap)');
  ok(!errs.length, 'no errors on the phone' + (errs.length ? ' → ' + errs.join(' | ') : ''));
  await ctx.close();
}
await b.close(); srv.close();
console.log(fails ? `\n✗ ${fails} check(s) failed` : '\n✓ e2e-settings: all green');
process.exit(fails ? 1 : 0);
