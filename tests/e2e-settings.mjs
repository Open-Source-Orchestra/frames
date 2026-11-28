#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later · Copyright (C) 2026 Shaka Lei Kaumaka / Open Source Orchestra and the AI ʻohana
// v0.1.1 e2e (Playwright, local server only — nothing reaches a real hub):
//   ⚙ control panel (frame off → one dot → back on; a piece off and on, remembered) · ?frame=off untouched ·
//   data-door="auto" resolves frames/doors/<host>.json (merged on universe.json; accent applied) and falls back ·
//   BUTTON LAW: a full-width text page on a narrow desktop folds the rails into the 🎻 sheet; the 🎻 never sits on text.
//   v0.1.3 (test 8): the ceremony — 🌺 always top-left (desktop + phone), 🌊 Blessing Pool first top-right, a tap starts voice + captions
//   v0.1.4 (test 9): EMBED LAW — inside an <iframe> nothing mounts; the shell page's frame sleeps while the road is open, wakes after; sleep/wake API
//   (audio stubbed), captions never on words, Esc stops, nothing starts by itself, the ✕ says "hide frame", the phone sheet's first row hides all.
//   v0.1.5 (test 10): STAY-IN-PLACE — a speech bubble under the dock folds it in place (anchors never move), clear ground unfolds, a song keeps
//   playing through a fold, the tiny ✕ folds a rail door on purpose, hide-all ✕; phones too.
//   v0.1.9 (test 12): THE TOTEM STAYS IN THE SCREEN — a page that wears its own chat button (adopted at mount OR built late) still lets a totem face
//   (rail + phone sheet) open the chat DRAWER in the page: no navigation to myagentohana.com, no second pill.
//   v0.1.10 (test 13): A FOLDED PIECE NEVER EATS A CLICK — a page's own panel opens under a frame item (1470×797); the item folds/goes, its held box lets every
//   click fall through to the page's ✕ (hit-test + a real mouse click), the dot / visible doors still take theirs.
//   v0.1.11 (test 14): every page-native chat launcher id of the census (20) keeps the frame's pill away but the totem drawer open.
// usage: node tests/e2e-settings.mjs
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.vtt': 'text/vtt', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg' };
const PAGE = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{margin:0;font:17px/1.6 Georgia,serif;background:#141230;color:#eee}main{padding:24px 0}p{margin:0 0 14px}</style></head><body><main>${body}</main>
<script src="/frames.js" data-door="auto" defer></script></body></html>`;
const WIDE = PAGE('wide text', Array.from({ length: 40 }, (_, i) => `<p>Paragraph ${i + 1}: this ordinary page runs its text from the very left edge to the very right edge of the window, so a frame that keeps its law must not sit on these words. ${'More words. '.repeat(12)}</p>`).join(''));
const NARROW = PAGE('narrow text', `<div style="max-width:560px;margin:0 auto">` + Array.from({ length: 30 }, (_, i) => `<p>Centred paragraph ${i + 1}. ${'Words in the middle. '.repeat(8)}</p>`).join('') + '</div>');
const OVERLAY = { frame: 'osoframes/0.1', id: 'ben-artist', name: 'Ben · artist frame', accent: '#2f9e6f', credit: { add: ['Ben'] },
  slots: { left: [{ kind: 'door', id: 'home', emoji: '🎸', label: 'Ben', href: '/?who=ben', tip: 'Ben, the first beta artist.' }, { kind: 'door', id: 'ben-tip', emoji: '💸', label: 'Tip Ben', href: 'https://artist.opensourceorchestra.org/tip/?artist=ben', tip: 'Tip Ben over x402.' }],
           'bottom-right': { remove: ['radio'] } } };
// 22 Nov 2026: a page whose own CSS reaches our <nav> zones (publicinform.com) + a late-built page chat FAB + a bottom mini player
const NAVLEAK = PAGE('nav leak', `<div style="max-width:560px;margin:60px auto 0">` + Array.from({ length: 30 }, (_, i) => `<p>Paragraph ${i + 1}. ${'Centred words. '.repeat(8)}</p>`).join('') + '</div>' +
  `<div id="mini" style="position:fixed;right:16px;bottom:12px;width:300px;height:44px;border-radius:22px;background:#333;color:#fff;font:13px/44px sans-serif;padding:0 16px">TAP TO PLAY — a song of the orchestra</div>` +
  `<a id="wide" href="/x" style="position:absolute;top:600px;left:30px;right:30px;height:50px;display:block;background:#222;color:#fff;font:14px/50px sans-serif;text-align:center">A WIDE BUTTON ROW THAT RUNS UNDER BOTH RAILS — FORK THE PROTOCOL</a>` +
  `<script>setTimeout(function(){var b=document.createElement('button');b.id='oso-fab';b.textContent='Talk to OSO';b.style.cssText='position:fixed;right:20px;bottom:70px;padding:10px 16px;border-radius:999px';document.body.appendChild(b);},3800);</script>`)
  .replace('<style>', '<style>nav{position:fixed;top:0;left:0;right:0;z-index:50;display:grid;grid-template-columns:auto 1fr auto;padding:14px 32px;background:#000}nav::after{content:"";width:110px}')
  .replace('<main>', '<nav><a href="/">A page nav</a><span></span><a href="/x">Links</a></nav><main>');
// 23 Nov 2026 (v0.1.4): a door's shell (bl-shell.js) opens another door in a full-screen <iframe> over this page
// 28 Nov 2026 (v0.1.9): a page that already wears its own chat button BEFORE the frame mounts (shakaleikaumaka.com #sp-fab, opensourceorchestra.org #oso-fab)
const OWNCHAT = NARROW.replace('</main>', `</main><button id="oso-fab" type="button" style="position:fixed;right:20px;bottom:70px;z-index:40;padding:10px 16px;border-radius:22px;border:0;background:#c44;color:#fff;font:14px sans-serif">Talk to OSO (the page's own)</button>`);
const SHELL = NARROW.replace('</main>', `</main><div id="oflo" style="position:fixed;top:10px;left:10px;z-index:9999;width:40px;height:40px">🌺</div><div id="oflop" style="display:none;position:fixed;top:60px;left:10px;z-index:9999">panel</div><a id="oviol" href="/join" style="position:fixed;top:60px;left:10px;z-index:9999;width:40px;height:40px">🎻</a><script>
window.openRoad = function (src) { var d = document.createElement('div'); d.id = 'blroad'; d.innerHTML = '<div style="position:fixed;inset:0;z-index:99990;background:#000;display:flex;flex-direction:column"><div style="flex:0 0 42px;color:#fff">✕ home</div><iframe src="' + src + '" style="flex:1;border:0;width:100%"></iframe></div>'; document.body.appendChild(d); };
window.closeRoad = function () { var d = document.getElementById('blroad'); if (d) d.remove(); };
</script>`);
// 23 Nov 2026 (v0.1.5): a comic page — a quiet top, then a panel whose speech bubble (absolute, short words) and caption scroll under
// the bottom-right corner (Shaka's desktop screenshot of /websitetour: the dock and the pill sat on the KAAAK bubble)
const COMIC = PAGE('comic', `<style>body{overflow-x:hidden}</style><div style="height:70vh"></div><div class="panel" style="position:relative;width:min(900px,80vw);margin:0 auto;height:560px;background:#223;border:3px solid #000">` +
  `<p class="cap" style="position:absolute;top:14px;left:14px;max-width:420px;background:#fff8df;color:#111;padding:8px 12px;font:600 15px/1.4 sans-serif">PANEL 1 · THE SEAT WITH YOUR NAME ON IT</p>` +
  `<p class="kaaak" style="position:absolute;right:calc(10px - 10vw);bottom:30px;width:250px;background:#fff;color:#111;padding:16px 14px;border-radius:18px;font:800 17px/1.4 sans-serif">See you inside!!! Bring your songs!!! The seat with your name on it.</p>` +
  `</div><div style="height:120vh"></div>`);
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
        if (u.pathname === '/comic.html') return rsp.writeHead(200, { 'content-type': TYPES['.html'] }).end(COMIC);
        if (u.pathname === '/navleak.html') return rsp.writeHead(200, { 'content-type': TYPES['.html'] }).end(NAVLEAK);
        if (u.pathname === '/ownchat.html') return rsp.writeHead(200, { 'content-type': TYPES['.html'] }).end(u.searchParams.get('fab') ? OWNCHAT.replace('id="oso-fab"', 'id="' + u.searchParams.get('fab').replace(/[^A-Za-z0-9_-]/g, '') + '"') : OWNCHAT);
        if (u.pathname === '/shell.html') return rsp.writeHead(200, { 'content-type': TYPES['.html'] }).end(SHELL);
        if (u.pathname === '/allow.html') return rsp.writeHead(200, { 'content-type': TYPES['.html'] }).end(NARROW.replace('data-door="auto"', 'data-door="auto" data-embed="allow"'));
        if (u.pathname === '/oso.html') return rsp.writeHead(200, { 'content-type': TYPES['.html'] }).end(NARROW.replace('data-door="auto"', 'data-frame="/frames/oso.json"'));
        if (u.pathname === '/overlay.json') return rsp.writeHead(200, { 'content-type': TYPES['.json'] }).end(JSON.stringify(OVERLAY));
        if (u.pathname === '/attr.html') return rsp.writeHead(200, { 'content-type': TYPES['.html'] }).end(NARROW.replace('data-door="auto"', 'data-door="auto" data-frame-overlay="/overlay.json"'));
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
  const reqs = []; p.on('request', (q) => { const u = new URL(q.url()); if (/^\/frames\/.*\.json$/.test(u.pathname)) reqs.push(u.pathname); });
  await p.goto('http://publicinform.com/narrow.html?frame=fresh', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached', timeout: 15000 });
  const r = await p.evaluate(() => ({ id: OSOFrames.data.id, accent: getComputedStyle(document.getElementById('oso-frames')).getPropertyValue('--osof-accent').trim(), first: OSOFrames.data.slots.left[0].id, pitGone: !OSOFrames.data.slots.left.some((i) => i.id === 'pit'), n: OSOFrames.data.slots.left.length, version: OSOFrames.version, gear: !!document.querySelector('#oso-frames .osof-credit-g') }));
  ok(r.id === 'pit-protocol', `data-door=auto on publicinform.com → id ${r.id}`);
  ok(r.accent === '#7fe0ff', `accent applied (${r.accent})`);
  ok(r.first === 'home' && r.pitGone && r.n >= 10, `slot ops: prepend + remove (left: ${r.n} items, first ${r.first})`);
  ok(r.version === '0.1.17' && r.gear, `v${r.version} with the ⚙ gear in the credit mark`);
  ok(!errs.length, 'no console/page errors' + (errs.length ? ' → ' + errs.join(' | ') : ''));
  // v0.1.16 the dataset waterfall: a known door goes straight to its own file (index.json is NOT read), the parent is the fallback already in flight (one request)
  ok(reqs.includes('/frames/doors/publicinform.com.json') && !reqs.includes('/frames/doors/index.json'), 'v0.1.16 known door → its own file straight away, NO index.json round trip (' + reqs.join(' ') + ')');
  ok(reqs.filter((x) => x === '/frames/universe.json').length === 1, 'v0.1.16 the parent dataset is requested ONCE (shared with the fallback already in flight)');
  await ctx.close();
}
// 2 · unknown host → the universe frame (fallback), no error
{
  const ctx = await ctxFor('nobody.example', { width: 1280, height: 800 });
  const p = await ctx.newPage(); const errs = errsOf(p);
  const reqs = []; p.on('request', (q) => { const u = new URL(q.url()); if (/^\/frames\/.*\.json$/.test(u.pathname)) reqs.push(u.pathname); });
  await p.goto('http://nobody.example/narrow.html', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached', timeout: 15000 });
  const id = await p.evaluate(() => OSOFrames.data.id);
  ok(id === 'oso-universe', `unknown host falls back to universe (${id})`);
  ok(reqs.includes('/frames/doors/index.json') && !reqs.some((x) => /\/doors\/nobody\.example\.json$/.test(x)), 'v0.1.16 an unknown host takes the index route and never requests a door file that does not exist (no 404): ' + reqs.join(' '));
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
// 4 · STAY-IN-PLACE (v0.1.5): edge-to-edge text on a 900px desktop → the rails stay where they are (no 🎻 sheet relocation);
//     every rail piece on words folds to a dot IN PLACE (box held), no unfolded piece sits on words; centred text → full rails
{
  const ctx = await ctxFor('nobody.example', { width: 900, height: 700 });
  const p = await ctx.newPage(); const errs = errsOf(p);
  await p.goto('http://nobody.example/wide.html', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(1800);
  let r = await p.evaluate(() => { const F = document.getElementById('oso-frames'); const items = [...F.querySelectorAll('[data-slot=left] > .osof-item:not([hidden]), [data-slot=right] > .osof-item:not([hidden])')].filter((e) => e.getClientRects().length); const folded = items.filter((e) => e.hasAttribute('data-osof-folded')); const dotInside = folded.every((e) => { const b = e.getBoundingClientRect(), d = e.querySelector('.osof-idot'); if (!d) return false; const r2 = d.getBoundingClientRect(); return r2.width > 4 && r2.left >= b.left - 1 && r2.right <= b.right + 1 && r2.top >= b.top - 1 && r2.bottom <= b.bottom + 1; }); const unfoldedOnWords = items.filter((e) => !e.hasAttribute('data-osof-folded')).filter((e) => { const r2 = e.getBoundingClientRect(); return document.elementsFromPoint(r2.left + r2.width / 2, r2.top + r2.height / 2).some((x) => !F.contains(x) && /^(P|LI|H\d)$/.test(x.tagName)); }).length; return { mode: F.getAttribute('data-mode'), crowded: F.hasAttribute('data-osof-crowded'), railsShown: [...F.querySelectorAll('[data-slot=left],[data-slot=right]')].every((z) => getComputedStyle(z).display !== 'none'), n: items.length, folded: folded.length, dotInside, unfoldedOnWords, sheetShown: getComputedStyle(F.querySelector('.osof-sheet-item')).display !== 'none' }; });
  ok(r.mode === 'desktop' && !r.crowded && r.railsShown && !r.sheetShown, `edge-to-edge text on a desktop: the rails stay rails (mode ${r.mode}, no sheet)`);
  ok(r.folded >= 3 && r.dotInside, `${r.folded} of ${r.n} rail pieces on words fold to dots IN PLACE (each dot inside the box it held)`);
  ok(r.unfoldedOnWords === 0, `no unfolded rail piece sits on words (${r.unfoldedOnWords})`);
  await p.goto('http://nobody.example/narrow.html', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(1200);
  r = await p.evaluate(() => { const F = document.getElementById('oso-frames'); return { mode: F.getAttribute('data-mode'), folded: F.querySelectorAll('[data-slot=left] [data-osof-folded], [data-slot=right] [data-osof-folded]').length }; });
  ok(r.mode === 'desktop' && r.folded === 0, 'centred text → full rails on desktop, nothing folded');
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
  r = await p.evaluate(() => { const x = document.querySelector('#oso-frames .osof-sheet-x'); const r = x.getBoundingClientRect(); return { x: !!x && r.width > 0, label: x.getAttribute('aria-label') }; });
  ok(r.x && /Hide/.test(r.label), 'the mobile 🎻 carries a tiny ✕ (fold)');
  await p.click('#oso-frames .osof-sheet-x');
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
// 6 · ARTIST FRAMES: an overlay on top of the door frame — by address (same origin), by tag attribute; a stranger's origin is ignored
{
  const ctx = await ctxFor('publicinform.com', { width: 1280, height: 800 });
  const p = await ctx.newPage(); const errs = errsOf(p);
  await p.goto('http://publicinform.com/narrow.html?frame-overlay=/overlay.json', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' });
  let r = await p.evaluate(() => { const d = OSOFrames.data; const home = d.slots.left.find((i) => i.id === 'home'); return { id: d.id, accent: d.accent, home: home && home.emoji + home.label, tip: !!d.slots.left.find((i) => i.id === 'ben-tip'), spec: !!d.slots.left.find((i) => i.id === 'spec'), radio: d.slots['bottom-right'].some((i) => i.kind === 'radio'), credit: OSOFrames._.creditLine(d), overlay: OSOFrames.overlay && OSOFrames.overlay.from, hrefAbs: home && home.href }; });
  ok(r.id === 'ben-artist' && r.accent === '#2f9e6f' && r.overlay === 'query', `?frame-overlay= layers on the door frame (id ${r.id}, accent ${r.accent}, from ${r.overlay})`);
  ok(r.home === '🎸Ben' && r.tip && r.spec && !r.radio, `merged by piece id: home replaced, ben-tip appended, the door's spec kept, radio removed`);
  ok(/with Ben/.test(r.credit), `credit.add joins the ʻohana line (${r.credit.slice(-30)})`);
  await p.goto('http://publicinform.com/narrow.html?frame-overlay=https://evil.example/x.json', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' });
  r = await p.evaluate(() => ({ id: OSOFrames.data.id, overlay: OSOFrames.overlay }));
  ok(r.id === 'pit-protocol' && !r.overlay, 'a stranger\'s origin in ?frame-overlay= is ignored (door frame alone)');
  await p.goto('http://publicinform.com/attr.html', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' });
  r = await p.evaluate(() => ({ id: OSOFrames.data.id, from: OSOFrames.overlay && OSOFrames.overlay.from }));
  ok(r.id === 'ben-artist' && r.from === 'tag', 'data-frame-overlay on the tag works too');
  await p.goto('http://publicinform.com/narrow.html', { waitUntil: 'commit' });
  await p.evaluate(() => { window.__framesOverlay = { frame: 'osoframes/0.1', id: 'inline-artist', slots: { right: [{ kind: 'door', id: 'all-doors', emoji: '🧭', label: 'Doors', href: 'https://myagentohana.com/doors/', tip: 'All doors.' }] } }; });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' });
  r = await p.evaluate(() => ({ id: OSOFrames.data.id, from: OSOFrames.overlay && OSOFrames.overlay.from }));
  ok(r.id === 'inline-artist' && r.from === 'window', 'window.__framesOverlay (inline object) works');
  ok(!errs.filter((e) => !/evil\.example/.test(e)).length, 'no errors on the overlay flow' + (errs.length ? ' → ' + errs.join(' | ') : ''));
  await ctx.close();
}
// 7 · NO COVERED TEXT LAW (22 Nov 2026): page CSS cannot drag a rail to the wrong side · frame items never sit on each other ·
//     the bottom corner lifts off a page's mini player · a late page FAB is adopted (no double chat) · no auto tour bubbles ·
//     the 3-second thanks line shows top-centre on no words and leaves · ✕ on the credit hides everything at once
{
  const ctx = await ctxFor('nobody.example', { width: 1280, height: 800 });
  const p = await ctx.newPage(); const errs = errsOf(p);
  await p.goto('http://nobody.example/navleak.html?frame=fresh', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(1300);
  let r = await p.evaluate(() => {
    const F = document.getElementById('oso-frames'), vw = innerWidth;
    const z = (s) => F.querySelector(`[data-slot="${s}"]`).getBoundingClientRect();
    const items = [...F.querySelectorAll('.osof-slot > .osof-item')].filter((e) => !e.hidden && e.getBoundingClientRect().width > 0).map((e) => ({ k: e.getAttribute('data-osof-kind'), id: e.getAttribute('data-osof-id'), r: e.getBoundingClientRect() }));
    let overlaps = 0;
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) { const a = items[i].r, b2 = items[j].r; const ix = Math.min(a.right, b2.right) - Math.max(a.left, b2.left), iy = Math.min(a.bottom, b2.bottom) - Math.max(a.top, b2.top); if (ix > 4 && iy > 4) overlaps++; }
    const totem = F.querySelector('[data-osof-kind=totem]'); const tr = totem && totem.getBoundingClientRect();
    const mini = document.getElementById('mini').getBoundingClientRect(); const br = z('bottom-right');
    const th = F.querySelector('.osof-thanks'); const thr = th && th.getBoundingClientRect();
    const words = th && !th.hidden ? document.elementsFromPoint(thr.left + thr.width / 2, thr.top + thr.height / 2).some((e) => !F.contains(e) && /^(P|A|H\d)$/.test(e.tagName)) : null;
    const brItems = [...F.querySelectorAll('[data-slot=bottom-right] > .osof-item:not([hidden])')].filter((e) => e.getBoundingClientRect().width > 0); const onMini = brItems.filter((e) => { const r2 = e.getBoundingClientRect(); return r2.bottom > mini.top && r2.top < mini.bottom && r2.right > mini.left && r2.left < mini.right; });
    return { rightX: z('right').left, leftX: z('left').left, vw, totemRight: !!tr && tr.left > vw / 2, overlaps, chat: !!F.querySelector('[data-osof-kind=chat]'), brStyleBottom: F.querySelector('[data-slot=bottom-right]').style.bottom, brBottom: getComputedStyle(F.querySelector('[data-slot=bottom-right]')).bottom, onMini: onMini.length, onMiniFolded: onMini.filter((e) => e.hasAttribute('data-osof-folded')).length, thanksShown: !!th && !th.hidden && th.classList.contains('osof-on'), thanksTop: thr && Math.round(thr.top), thanksCentred: thr && Math.abs((thr.left + thr.width / 2) - vw / 2) < 6, wordsUnderThanks: words, tourBar: !!F.querySelector('.osof-tourbar:not([hidden])'), metaX402: !!document.querySelector('head meta[name="x402"]') };
  });
  ok(r.rightX > r.vw / 2 && r.leftX < r.vw / 2, `page nav{left:0;right:0} cannot move the rails (left at ${Math.round(r.leftX)}, right at ${Math.round(r.rightX)})`);
  ok(r.totemRight, 'the totem is on the right rail');
  {
    const rr = await p.evaluate(() => { const F = document.getElementById('oso-frames'); const wide = document.getElementById('wide').getBoundingClientRect(); const on = [...F.querySelectorAll('[data-slot=left] > .osof-item:not([hidden]), [data-slot=right] > .osof-item:not([hidden])')].filter((e) => { const b2 = e.getBoundingClientRect(); return b2.width > 0 && b2.bottom > wide.top && b2.top < wide.bottom; }); return { mode: F.getAttribute('data-mode'), on: on.length, onFolded: on.filter((e) => e.hasAttribute('data-osof-folded')).length, leftKids: F.querySelectorAll('[data-slot=left] > .osof-item:not([hidden])').length, leftTop: F.querySelector('[data-slot=left]').style.top }; });
    ok(rr.mode === 'desktop' && rr.leftKids >= 3, `one wide button row does not fold the rails (mode ${rr.mode}, ${rr.leftKids} left items)`);
    ok(rr.on >= 1 && rr.onFolded === rr.on, `the rail pieces on the wide row fold in place (${rr.onFolded}/${rr.on}); the rails themselves stay (left top ${rr.leftTop})`);
  }
  ok(r.overlaps === 0, `no frame item sits on another (${r.overlaps} overlaps)`);
  ok(r.brStyleBottom === '' && r.brBottom === '10px' && r.onMini >= 1 && r.onMiniFolded === r.onMini, `the bottom-right corner never lifts off the page's mini player (bottom ${r.brBottom}); the ${r.onMini} piece(s) on it fold in place`);
  ok(!r.thanksShown, 'the thanks line has one anchor (top centre): the page\'s own nav covers it here → it does not show (no step down)');
  ok(r.metaX402, 'agent language: <meta name="x402"> in <head>');
  ok(r.chat, 'before the page builds its own FAB, the frame offers its chat');
  await p.waitForTimeout(4600);   // 28 Nov 2026: the page FAB now arrives at 3.8 s (was 2.8 s) — the shared box is often under heavy load; the order of events is what is tested
  r = await p.evaluate(() => { const F = document.getElementById('oso-frames'); const th = F.querySelector('.osof-thanks'); return { thanksGone: !th || th.hidden, chat: !!F.querySelector('[data-osof-kind=chat]'), fab: !!document.getElementById('oso-fab') }; });
  ok(r.thanksGone, 'the thanks line stays gone');
  ok(r.fab && !r.chat, 'the page built #oso-fab late → the frame\'s chat bowed out (no double "Talk to OSO")');
  await p.waitForTimeout(5200);
  ok(!(await p.evaluate(() => !!document.querySelector('#oso-frames .osof-tourbar:not([hidden]), #oso-frames .osof-cap.osof-on'))), 'no auto tour: no caption bubbles ever appear by themselves');
  await p.click('#oso-frames .osof-credit-x');
  r = await p.evaluate(() => ({ off: document.getElementById('oso-frames').hasAttribute('data-osof-off'), items: document.querySelectorAll('#oso-frames .osof-item').length, dotFocused: document.activeElement && document.activeElement.classList.contains('osof-dot'), ls: localStorage.getItem('osof:settings:v1') }));
  ok(r.off && r.items === 0 && /"on":false/.test(r.ls || ''), `✕ on the credit hides every button at once (${r.items} items left, remembered)`);
  ok(r.dotFocused, 'focus lands on the dot that brings it back');
  ok(!errs.length, 'no errors on the law page' + (errs.length ? ' → ' + errs.join(' | ') : ''));
  await ctx.close();
  // phone: the sheet carries "Hide the whole frame"
  const ctx2 = await ctxFor('nobody.example', { width: 390, height: 844 }, true);
  const p2 = await ctx2.newPage();
  await p2.goto('http://nobody.example/hero.html', { waitUntil: 'load' });
  await p2.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p2.waitForTimeout(800);
  await p2.click('#oso-frames .osof-sheetbtn');
  const hasHide = await p2.evaluate(() => !!document.querySelector('#osof-dlg-sheet:not([hidden]) .osof-sheet-hide'));
  ok(hasHide, 'the phone sheet offers "Hide the whole frame"');
  await p2.click('#osof-dlg-sheet .osof-sheet-hide');
  ok(await p2.evaluate(() => document.getElementById('oso-frames').hasAttribute('data-osof-off') && !!document.querySelector('#oso-frames .osof-dot')), 'one tap on a phone: everything gone, one dot stays');
  await ctx2.close();
}
// 8 · THE CEREMONY (v0.1.3, Shaka 22 Nov 2026 13:24 BKK): 🌺 top-left under the globe · 🌊 Blessing Pool first top-right · a tap plays
//     the twin voice with the same words as captions (audio stubbed here) · captions on no words · Esc stops · never starts by itself ·
//     "✕ hide frame" is visible once · phones: 🌺 at 38px top-left, 🌊 + 🎻 stacked top-right, the sheet at the bottom lifts our corners
const AUDIO_STUB = `window.__audioLog = []; window.Audio = class { constructor() { this.paused = true; this._l = {}; this.currentTime = 0; this.src = ''; }
  addEventListener(n, f) { (this._l[n] = this._l[n] || []).push(f); } removeEventListener() {} pause() { this.paused = true; window.__audioLog.push('pause'); }
  play() { this.paused = false; window.__audioLog.push('play:' + this.src.split('/').pop()); const s = this; setTimeout(() => { if (!s.paused) { s.paused = true; (s._l.ended || []).forEach((f) => f()); } }, 300); return Promise.resolve(); } };`;
{
  const ctx = await ctxFor('nobody.example', { width: 1440, height: 900 });   // room at the bottom-left for the 4-second "✕ hide frame" (it shows on clear ground only)
  await ctx.addInitScript(AUDIO_STUB);
  const p = await ctx.newPage(); const errs = errsOf(p);
  await p.goto('http://nobody.example/hero.html?frame=fresh', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(1900);
  let r = await p.evaluate(async () => {
    const F = document.getElementById('oso-frames');
    const cb = F.querySelector('[data-slot=top-left] .osof-cerbtn'), cr = cb && cb.getBoundingClientRect();
    const tr = [...F.querySelectorAll('[data-slot=top-right] > .osof-item:not(.osof-sheet-item)')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.getAttribute('data-osof-id'));
    const xl = F.querySelector('.osof-credit-x .osof-x-lbl');
    const say = OSOFrames.data.ceremony && OSOFrames.data.ceremony.say;
    const mp3 = await fetch('/media/ceremony/welcome.mp3', { method: 'HEAD' }).then((x) => x.status).catch(() => 0);
    return { cer: !!cb && cr.width > 0 && cr.left < 80 && cr.top < 160, cerTop: cr && Math.round(cr.top), cerSize: cr && Math.round(cr.width), pinned: cb && cb.closest('.osof-item').hasAttribute('data-osof-pin'), tr, oldTour: !!F.querySelector('[data-slot=top-right] [data-osof-kind=tour]'),
      bar: !!F.querySelector('.osof-tourbar:not([hidden])'), xlbl: !!xl, xlblShown: xl && getComputedStyle(xl).opacity === '1' && cb.closest('#oso-frames').querySelector('.osof-credit-x').classList.contains('osof-say'), saidWelcome: say && /This is my voice, made by the AI ʻohana/.test(say.welcome), nSay: say && Object.keys(say).length, mp3 };
  });
  ok(r.cer && r.pinned, `🌺 ceremony button sits top-left (y=${r.cerTop}, ${r.cerSize}px, pinned)`);
  ok(r.tr[0] === 'blessing-pool' && r.tr[1] === 'orchestra' && !r.oldTour, `🌊 Blessing Pool is first top-right, then 🎻 (${r.tr.join(', ')}); the old ✨ is gone`);
  ok(!r.bar, 'nothing starts by itself (no ceremony bar, no bubbles)');
  ok(r.xlbl && r.xlblShown, '"✕ hide frame" is written next to the credit mark on a first visit (4 s)');
  ok(r.saidWelcome && r.nSay >= 26 && r.mp3 === 200, `the script carries the honest line, ${r.nSay} passages, welcome.mp3 served (${r.mp3})`);
  await p.click('#oso-frames .osof-cerbtn');
  await p.waitForTimeout(250);
  r = await p.evaluate(() => {
    const F = document.getElementById('oso-frames');
    const bar = F.querySelector('.osof-tourbar:not([hidden])'), cap = F.querySelector('.osof-cap.on'), cr = cap && cap.getBoundingClientRect();
    const words = cap ? document.elementsFromPoint(cr.left + cr.width / 2, cr.top + cr.height / 2).some((e) => !F.contains(e) && /^(P|A|H\d|LI)$/.test(e.tagName)) : null;
    const br = bar && bar.getBoundingClientRect();
    const barWords = bar ? document.elementsFromPoint(br.left + br.width / 2, br.top + br.height / 2).some((e) => !F.contains(e) && /^(P|A|H\d|LI)$/.test(e.tagName)) : null;
    return { bar: !!bar, play: bar && !!bar.querySelector('.osof-cer-play'), mute: bar && !!bar.querySelector('.osof-cer-mute'), skip: bar && !!bar.querySelector('.osof-skip'), count: bar && bar.querySelector('.osof-count').textContent, cap: cap && cap.textContent, words, barWords, halo: !!F.querySelector('.osof-halo:not([hidden])'), breath: !!F.querySelector('.osof-halo.osof-breath'), log: window.__audioLog.slice(), on: F.hasAttribute('data-osof-ceremony') };
  });
  ok(r.bar && r.play && r.mute && r.skip, `a tap starts the ceremony: player bar with ▶/⏸ · ${r.count} · 🔊 · Skip ✕`);
  ok(r.log.filter((x) => /^play/.test(x))[0] === 'play:welcome.mp3', `the welcome clip plays first (${r.log.filter((x) => /^play/.test(x))[0]})`);
  ok(r.cap && /This is my voice, made by the AI ʻohana/.test(r.cap) && r.words === false, 'the caption shows the same words as the voice, on no page words');
  ok(r.barWords === false && r.halo && r.breath && r.on, 'the bar stands on clear ground; the spoken button breathes');
  await p.waitForTimeout(2600);
  r = await p.evaluate(() => { const F = document.getElementById('oso-frames'); return { count: F.querySelector('.osof-count').textContent, log: window.__audioLog.filter((x) => /^play/.test(x)), cap: (F.querySelector('.osof-cap.on') || {}).textContent }; });
  ok(r.log.length >= 3 && /^[3-9] \/ \d+$/.test(r.count), `steps advance when each clip ends (${r.count}; ${r.log.length} clips played)`);
  await p.click('#oso-frames .osof-cer-mute');
  r = await p.evaluate(() => ({ pressed: document.querySelector('#oso-frames .osof-cer-mute').getAttribute('aria-pressed'), bar: !!document.querySelector('#oso-frames .osof-tourbar:not([hidden])'), cap: !!document.querySelector('#oso-frames .osof-cap.on') }));
  ok(r.pressed === 'true' && r.bar && r.cap, '🔇 keeps the words and drops the voice');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(200);
  r = await p.evaluate(() => { const F = document.getElementById('oso-frames'); return { bar: !!F.querySelector('.osof-tourbar:not([hidden])'), cap: !!F.querySelector('.osof-cap.on'), on: F.hasAttribute('data-osof-ceremony'), paused: window.__audioLog[window.__audioLog.length - 1] }; });
  ok(!r.bar && !r.cap && !r.on, 'Esc stops the ceremony (bar, caption, halo gone)');
  ok(!errs.length, 'no errors on the ceremony' + (errs.length ? ' → ' + errs.join(' | ') : ''));
  await ctx.close();
  // phone
  const ctx2 = await ctxFor('nobody.example', { width: 390, height: 844 }, true);
  await ctx2.addInitScript(AUDIO_STUB);
  const p2 = await ctx2.newPage(); const errs2 = errsOf(p2);
  await p2.goto('http://nobody.example/hero.html?frame=fresh', { waitUntil: 'load' });
  await p2.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p2.waitForTimeout(900);
  r = await p2.evaluate(() => {
    const F = document.getElementById('oso-frames');
    const cb = F.querySelector('.osof-cerbtn'), cr = cb.getBoundingClientRect();
    const pool = F.querySelector('[data-slot=top-right] [data-osof-id=blessing-pool] .osof-btn'), pr = pool && pool.getBoundingClientRect();
    const sb = F.querySelector('.osof-sheetbtn'), sr = sb.getBoundingClientRect();
    return { cerVisible: cr.width > 0 && cr.width <= 40 && cr.left < 60 && cr.top >= 50, folded: cb.classList.contains('osof-fold'), poolVisible: !!pr && pr.width > 0 && pr.right > innerWidth - 60, poolAboveSheet: !!pr && pr.bottom <= sr.top, sheetVisible: sr.width > 0, bar: !!F.querySelector('.osof-tourbar:not([hidden])') };
  });
  ok(r.cerVisible && !r.folded, '📱 the 🌺 ceremony stays top-left on a phone (38px, under the globe, not folded on a quiet hero)');
  ok(r.poolVisible && r.poolAboveSheet && r.sheetVisible, '📱 🌊 Blessing Pool first top-right, the 🎻 sheet button under it');
  ok(!r.bar, '📱 nothing starts by itself');
  await p2.click('#oso-frames .osof-cerbtn');
  await p2.waitForTimeout(500);
  r = await p2.evaluate(() => {
    const F = document.getElementById('oso-frames');
    const bar = F.querySelector('.osof-tourbar:not([hidden])'), br = bar && bar.getBoundingClientRect();
    const txt = bar && bar.querySelector('.osof-cer-text.on');
    const brz = F.querySelector('[data-slot=bottom-right]').getBoundingClientRect(), blz = F.querySelector('[data-slot=bottom-left]').getBoundingClientRect();
    return { sheet: !!bar && bar.hasAttribute('data-osof-sheet') && Math.abs(br.bottom - (innerHeight - 8)) < 3 && br.left <= 10 && br.right >= innerWidth - 10, text: txt && txt.textContent, cornersAbove: brz.bottom <= br.top + 1 && blz.bottom <= br.top + 1, log: window.__audioLog.filter((x) => /^play/.test(x))[0] };
  });
  ok(r.sheet && /This is my voice/.test(r.text || ''), '📱 the words + controls sit in one bottom sheet');
  ok(r.cornersAbove, '📱 our chat/radio/credit corners step above the sheet (no piece on another)');
  ok(r.log === 'play:welcome.mp3', `📱 the voice plays after the tap (${r.log})`);
  await p2.click('#oso-frames .osof-skip');
  await p2.waitForTimeout(400);
  r = await p2.evaluate(() => { const F = document.getElementById('oso-frames'); const brz = F.querySelector('[data-slot=bottom-right]').getBoundingClientRect(); return { bar: !!F.querySelector('.osof-tourbar:not([hidden])'), back: brz.bottom > innerHeight - 60 }; });
  ok(!r.bar && r.back, '📱 Skip ✕ ends it and the corners come back down');
  await p2.click('#oso-frames .osof-sheetbtn');
  r = await p2.evaluate(() => { const d = document.querySelector('#osof-dlg-sheet:not([hidden])'); const first = d && d.querySelector('.osof-dlg-body').firstElementChild; return { first: first && first.className, text: first && first.textContent, note: d && !!d.querySelector('.osof-sheet-note') }; });
  ok(r.first === 'osof-sheet-hide' && /Hide the whole frame/.test(r.text || '') && r.note, '📱 the sheet\'s FIRST row is "✕ Hide the whole frame" (+ the one-line difference from the 🎻 ✕)');
  await p2.keyboard.press('Escape');
  // the phone bottom law: edge-to-edge words → the chat pill folds to its tiny emoji (or steps up) — never on words
  await p2.goto('http://nobody.example/wide.html', { waitUntil: 'load' });
  await p2.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p2.waitForTimeout(900);
  r = await p2.evaluate(() => { const F = document.getElementById('oso-frames'); const w = F.querySelector('.osof-chatwrap'); const vis = w && (w.getAttribute('data-mini') === '1' ? w.querySelector('.osof-fab-mini') : w.querySelector('.osof-fab')); const rr = vis && vis.getBoundingClientRect(); const under = rr ? document.elementsFromPoint(rr.left + rr.width / 2, rr.top + rr.height / 2).some((e) => !F.contains(e) && /^(P|LI|H\d)$/.test(e.tagName)) : null; return { mini: w && w.getAttribute('data-mini'), under, ls: localStorage.getItem('osof:ui:mini:chat') }; });
  ok(r.mini === '1' && !r.ls, `📱 edge-to-edge words: the chat pill folds to its tiny emoji for this view (not remembered; words under the tiny one: ${r.under})`);
  ok(!errs2.length, '📱 no errors' + (errs2.length ? ' → ' + errs2.join(' | ') : ''));
  await ctx2.close();
}
// ── test 9 (v0.1.4): EMBED LAW + sleep/wake — one page, one frame ───────────────────────────────────────────────────────
{
  const ctx = await ctxFor('nobody.example', { width: 390, height: 844 }, true);
  const p = await ctx.newPage(); const errs = errsOf(p);
  const infos = []; p.on('console', (m) => { if (/EMBED LAW/.test(m.text())) infos.push(m.text()); });
  await p.goto('http://nobody.example/shell.html', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(600);
  const SHOWN = () => [...document.querySelectorAll('#oso-frames button,#oso-frames a')].filter((e) => e.getBoundingClientRect().width > 0).length;
  let r = await p.evaluate((S) => ({ shown: eval(S)(), asleep: document.getElementById('oso-frames').getAttribute('data-osof-asleep') }), SHOWN.toString());
  ok(r.shown > 0 && !r.asleep, `the shell page wears its frame (${r.shown} buttons visible, awake)`);
  await p.evaluate(() => window.openRoad('/narrow.html'));
  await p.waitForTimeout(1500);
  const inner = p.frames().find((f) => f !== p.mainFrame());
  const innerHas = inner ? await inner.evaluate(() => ({ root: !!document.getElementById('oso-frames'), ver: !!(window.OSOFrames && window.OSOFrames.version) })) : null;
  ok(innerHas && !innerHas.root && innerHas.ver, `EMBED LAW: the door inside the <iframe> wears NO frame (script loaded, nothing mounted; ${infos.length} console note)`);
  r = await p.evaluate(() => { const F = document.getElementById('oso-frames'); return { asleep: F.getAttribute('data-osof-asleep'), shown: [...F.querySelectorAll('button,a')].filter((e) => e.getBoundingClientRect().width > 0).length, globe: true }; });
  ok(r.asleep === 'iframe' && r.shown === 0, `the shell page's own frame sleeps while the road is open (data-osof-asleep=${r.asleep}, ${r.shown} buttons visible)`);
  await p.evaluate(() => window.closeRoad());
  await p.waitForTimeout(900);
  r = await p.evaluate((S) => { const F = document.getElementById('oso-frames'); return { asleep: F.getAttribute('data-osof-asleep'), shown: eval(S)() }; }, SHOWN.toString());
  ok(!r.asleep && r.shown > 0, `the road closes → the frame wakes by itself (${r.shown} buttons visible again)`);
  r = await p.evaluate(() => { const F = document.getElementById('oso-frames'); const a = window.OSOFrames.sleep('road'); const s1 = F.getAttribute('data-osof-asleep'); const vis = [...F.querySelectorAll('button,a')].filter((e) => e.getBoundingClientRect().width > 0).length; const b = window.OSOFrames.wake(); return { a, s1, vis, b, s2: F.getAttribute('data-osof-asleep'), on: window.OSOFrames.settings().on, ls: Object.keys(localStorage).filter((k) => /asleep|road/.test(k)).length }; });
  ok(r.a && r.s1 === 'road' && r.vis === 0 && r.b && !r.s2 && r.on && r.ls === 0, 'OSOFrames.sleep(\'road\') / wake(): the API steps aside and back; ⚙ stays on; nothing remembered');
  // data-embed="allow": a page that invites the frame inside an iframe gets it
  await p.evaluate(() => window.openRoad('/allow.html'));
  await p.waitForTimeout(1500);
  const inner2 = p.frames().find((f) => f !== p.mainFrame() && /allow/.test(f.url()));
  const allowHas = inner2 ? await inner2.evaluate(() => !!document.querySelector('#oso-frames[data-osof-ready]')) : null;
  ok(allowHas === true, 'data-embed="allow" invites the frame into an iframe');
  await p.evaluate(() => window.closeRoad()); await p.waitForTimeout(600);
  // the frame absorbs the legacy rail: while the frame is on, #oflo/#oviol/#oflop are gone; ⚙ off brings them back
  r = await p.evaluate(() => { const vis = (id) => { const e = document.getElementById(id); return !!e && e.getBoundingClientRect().width > 0; }; const a = { oflo: vis('oflo'), oviol: vis('oviol'), attr: document.documentElement.getAttribute('data-osof-on') }; window.OSOFrames.settings({ on: false }); const b = { oflo: vis('oflo'), oviol: vis('oviol'), attr: document.documentElement.getAttribute('data-osof-on') }; window.OSOFrames.settings({ on: true }); const c = { oflo: vis('oflo'), attr: document.documentElement.getAttribute('data-osof-on') }; return { a, b, c }; });
  ok(!r.a.oflo && !r.a.oviol && r.a.attr === '' && r.b.oflo && r.b.oviol && r.b.attr === null && !r.c.oflo && r.c.attr === '', `the frame absorbs the page's legacy 🌺/🎻 rail while on (on: ${!r.a.oflo} · ⚙ off: back ${r.b.oflo} · on again: ${!r.c.oflo})`);
  ok(!errs.length, 'no errors on the shell' + (errs.length ? ' → ' + errs.join(' | ') : ''));
  await ctx.close();
}
// ── test 10 (v0.1.5): STAY-IN-PLACE — Shaka, 23 Nov 2026: "i want them to stay in place and automatically minimize or close with the tiny x if it ever covers text"
{
  const SNAP = `(() => { const F = document.getElementById('oso-frames'); const R = (e) => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
    const zones = {}; for (const z of F.querySelectorAll('.osof-slot')) { const s = z.getAttribute('data-slot'); if (s === 'overlay') continue; const cs = getComputedStyle(z); zones[s] = { top: cs.top, bottom: cs.bottom, left: cs.left, right: cs.right, styleBottom: z.style.bottom || '' }; }
    const items = {}; for (const w of F.querySelectorAll('.osof-slot > .osof-item')) { if (w.hidden || !w.getClientRects().length) continue; const k = w.getAttribute('data-osof-kind') + '#' + (w.getAttribute('data-osof-id') || ''); const mini = w.querySelector('[data-mini]'); items[k] = { box: R(w), folded: w.hasAttribute('data-osof-folded'), dotted: w.hasAttribute('data-osof-dotted'), gone: w.hasAttribute('data-osof-gone'), mini: mini ? mini.getAttribute('data-mini') : null, shown: R(w.querySelector('[data-osof-dotted] > .osof-idot, .osof-idot') && getComputedStyle(w.querySelector('.osof-idot')).display !== 'none' ? w.querySelector('.osof-idot') : (w.querySelector('[data-mini="1"] .osof-rd-mini, [data-mini="1"] .osof-fab-mini') || w.firstElementChild)) }; }
    const under = (sel) => { const e = F.querySelector(sel); if (!e || !e.getClientRects().length) return null; const r = e.getBoundingClientRect(); return document.elementsFromPoint(r.x + r.width / 2, r.y + r.height / 2).some((x) => !F.contains(x) && /^(P|LI|H\\d)$/.test(x.tagName)); };
    return { scrollY: Math.round(scrollY), zones, items, dockOnWords: under('.osof-radio .osof-dock'), pillOnWords: under('.osof-chatwrap .osof-fab'), mode: F.getAttribute('data-mode'), topR: getComputedStyle(F).getPropertyValue('--osof-top-r').trim(), audioPaused: window.__a ? window.__a.paused : null, miniEmoji: (F.querySelector('.osof-rd-mini') || {}).textContent }; })()`;
  const same = (a, b, keys) => keys.every((k) => JSON.stringify(a[k]) === JSON.stringify(b[k]));
  const ANCH = { 'top-left': ['top', 'left'], 'top-right': ['top', 'right'], left: ['top', 'left'], right: ['top', 'right'], 'bottom-left': ['bottom', 'left'], 'bottom-right': ['bottom', 'right'] };
  const anchorsSame = (a, b) => Object.keys(a.zones).every((z) => same(a.zones[z], b.zones[z], ANCH[z] || ['top', 'left']));
  const boxesSame = (a, b) => Object.keys(a.items).filter((k) => b.items[k] && !/^(credit|sheet)/.test(k)).every((k) => same(a.items[k], b.items[k], ['box']));
  const shownInside = (s) => Object.values(s.items).filter((i) => i.folded && !i.gone).every((i) => i.shown[2] > 4 && i.shown[0] >= i.box[0] - 1 && i.shown[1] >= i.box[1] - 1 && i.shown[0] + i.shown[2] <= i.box[0] + i.box[2] + 1 && i.shown[1] + i.shown[3] <= i.box[1] + i.box[3] + 1);
  const scrollUnder = `(() => { const k = document.querySelector('.kaaak').getBoundingClientRect(); window.scrollBy(0, k.bottom + 6 - innerHeight); })()`;
  const movedList = (a, b) => { const out = []; for (const z of Object.keys(a.zones)) for (const k of (ANCH[z] || ['top', 'left'])) if (a.zones[z][k] !== b.zones[z][k]) out.push(`${z}.${k} ${a.zones[z][k]}→${b.zones[z][k]}`); for (const k of Object.keys(a.items)) if (b.items[k] && !/^(credit|sheet)/.test(k) && JSON.stringify(a.items[k].box) !== JSON.stringify(b.items[k].box)) out.push(`${k} ${a.items[k].box}→${b.items[k].box}`); return out; };
  // desktop
  const ctx = await ctxFor('nobody.example', { width: 1440, height: 900 });
  await ctx.addInitScript(AUDIO_STUB + ` Object.defineProperty(HTMLMediaElement.prototype, 'paused', { get() { return !this.__playing; }, configurable: true }); HTMLMediaElement.prototype.play = function () { this.__playing = true; window.__a = this; return Promise.resolve(); }; HTMLMediaElement.prototype.pause = function () { this.__playing = false; }; HTMLMediaElement.prototype.load = function () {};`);
  const p = await ctx.newPage(); const errs = errsOf(p);
  await p.goto('http://nobody.example/comic.html', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(1500);
  const s0 = await p.evaluate(SNAP);
  ok(s0.items['radio#radio'] && !s0.items['radio#radio'].folded && s0.items['chat#chat'] && !s0.items['chat#chat'].folded && s0.zones['bottom-right'].bottom === '10px', `quiet top of the page: dock + pill unfolded at their anchor (bottom ${s0.zones['bottom-right'].bottom})`);
  await p.evaluate(scrollUnder); await p.waitForTimeout(900);
  const s1 = await p.evaluate(SNAP);
  ok(s1.items['radio#radio'].folded && s1.items['radio#radio'].mini === '1' && s1.items['chat#chat'].folded && s1.items['chat#chat'].mini === '1', `the speech bubble scrolls under the corner → the dock and the pill FOLD to their tiny emoji (scrollY ${s1.scrollY}; dock ${JSON.stringify(s1.items['radio#radio'])}, pill ${JSON.stringify(s1.items['chat#chat'])})`);
  ok(anchorsSame(s0, s1) && boxesSame(s0, s1) && s1.zones['bottom-right'].styleBottom === '', 'nothing moved: every zone anchor and every piece box is exactly where it was (no step-up, no lift)' + (movedList(s0, s1).length ? ' → ' + movedList(s0, s1).join(' | ') : ''));
  ok(shownInside(s1) && s1.dockOnWords !== true && s1.pillOnWords !== true, 'each tiny emoji sits inside the box its piece held; no unfolded piece on the words');
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(900);
  const s2 = await p.evaluate(SNAP);
  ok(!s2.items['radio#radio'].folded && !s2.items['chat#chat'].folded && anchorsSame(s0, s2) && boxesSame(s0, s2), 'back on clear ground → both unfold, still exactly in place');
  // a playing song is never undone by a fold: press ▶, scroll under the bubble → folded to 🎧, still playing
  await p.click('#oso-frames .osof-rd-play'); await p.waitForTimeout(300);
  const playing = await p.evaluate(() => !!window.__a && !window.__a.paused);
  await p.evaluate(scrollUnder); await p.waitForTimeout(900);
  const s3 = await p.evaluate(SNAP);
  ok(playing && s3.items['radio#radio'].folded && s3.audioPaused === false && s3.miniEmoji === '🎧', `a song playing through a fold keeps playing (folded to ${s3.miniEmoji}, paused=${s3.audioPaused})`);
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(900);
  // the tiny ✕ on a rail door: fold on purpose, in place; a probe never undoes it; the dot unfolds it on a tap
  const door = '#oso-frames [data-slot=left] > .osof-item[data-osof-kind=door]:not([hidden])';
  const d0 = await p.evaluate((sel) => { const w = document.querySelector(sel); const r = w.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; }, door);
  await p.hover(door);
  const xShown = await p.evaluate((sel) => { const x = document.querySelector(sel + ' > .osof-ix'); return !!x && getComputedStyle(x).display !== 'none' && x.getBoundingClientRect().width > 0; }, door);
  await p.click(door + ' > .osof-ix');
  await p.evaluate(() => window.scrollBy(0, 300)); await p.waitForTimeout(700);
  const d1 = await p.evaluate((sel) => { const w = document.querySelector(sel); const r = w.getBoundingClientRect(); const dot = w.querySelector('.osof-idot'); const dr = dot.getBoundingClientRect(); return { box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], folded: w.hasAttribute('data-osof-folded'), dotted: w.hasAttribute('data-osof-dotted'), dotInside: dr.width > 4 && dr.left >= r.left - 1 && dr.right <= r.right + 1 && dr.top >= r.top - 1 && dr.bottom <= r.bottom + 1 }; }, door);
  ok(xShown && d1.folded && d1.dotted && d1.dotInside && JSON.stringify(d1.box) === JSON.stringify(d0), `the tiny ✕ (on hover) folds a rail door in place (box ${d1.box}); a scroll-stop probe leaves it folded`);
  await p.click(door + ' > .osof-idot'); await p.waitForTimeout(200);
  ok(await p.evaluate((sel) => !document.querySelector(sel).hasAttribute('data-osof-folded'), door), 'a tap on the dot unfolds it (the door itself is not opened by that tap)');
  // one ✕ for all
  await p.click('#oso-frames .osof-credit-x');
  const off = await p.evaluate(() => { const F = document.getElementById('oso-frames'); const d = F.querySelector('.osof-dot'); const r = d && d.getBoundingClientRect(); return { off: F.hasAttribute('data-osof-off'), items: F.querySelectorAll('.osof-item').length, dotAt: r && [Math.round(r.x), Math.round(r.y)] }; });
  ok(off.off && off.items === 0 && off.dotAt && off.dotAt[0] === 10 && off.dotAt[1] === 900 - 28, `✕ on the credit hides everything at once; the one dot stays at the credit's anchor (${off.dotAt})`);
  { const e2 = errs.filter((e) => !/ERR_FAILED|net::|ERR_ABORTED/.test(e)); ok(!e2.length, 'no errors on the comic page (aborted media loads are the fail-closed routing)' + (e2.length ? ' → ' + e2.slice(0, 5).join(' | ') : '')); }
  await ctx.close();
  // phone: same page — the corners fold in place, the 🌊 keeps its anchor even when it folds
  const ctx2 = await ctxFor('nobody.example', { width: 390, height: 844 }, true);
  const p2 = await ctx2.newPage(); const errs2 = errsOf(p2);
  await p2.goto('http://nobody.example/comic.html', { waitUntil: 'load' });
  await p2.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p2.waitForTimeout(1200);
  const m0 = await p2.evaluate(SNAP);
  await p2.evaluate(scrollUnder); await p2.waitForTimeout(900);
  const m1 = await p2.evaluate(SNAP);
  ok(m1.mode === 'mobile' && m1.items['radio#radio'].folded && m1.items['chat#chat'].folded && anchorsSame(m0, m1) && boxesSame(m0, m1) && shownInside(m1), `📱 the bubble under the corner folds the dock + pill in place; no anchor moved (bottom ${m1.zones['bottom-right'].bottom}; dock ${JSON.stringify(m1.items['radio#radio'])}, pill ${JSON.stringify(m1.items['chat#chat'])}` + (movedList(m0, m1).length ? '; moved ' + movedList(m0, m1).join(' | ') : '') + ')');
  { const e3 = errs2.filter((e) => !/ERR_FAILED|net::|ERR_ABORTED/.test(e)); errs2.length = 0; errs2.push(...e3); }
  ok(m1.topR === '52px' && m0.topR === '52px', `📱 the top-right stack keeps its anchor (--osof-top-r ${m1.topR}) — it folds, it never steps down`);
  ok(!errs2.length, '📱 no errors' + (errs2.length ? ' → ' + errs2.join(' | ') : ''));
  await ctx2.close();
}
// 11 · v0.1.7 PENNIES OF ALOHA — the 🌊 Blessing Pool (gift:true) opens the x402 card instead of navigating; v0.1.12 the card mounts
// the ʻohana wallet connect picker (lib/owh.js, lazy). The wallet below is a fake EIP-1193 provider that signs by itself (no ethers):
// the card pays through it + a fail-closed mocked facilitator; the legacy #x4-wrap pill is absorbed.
{
  const WALLET = `
    window.__rpc = [];
    window.ethereum = { isMetaMask: true, request: async ({ method, params }) => {
      window.__rpc.push(method + (method === 'eth_signTypedData_v4' ? ':' + JSON.parse(params[1]).message.value + ':' + JSON.parse(params[1]).message.to : ''));
      if (method === 'eth_requestAccounts') return ['0x1111111111111111111111111111111111111111'];
      if (method === 'eth_chainId') return '0x2105';
      if (method === 'eth_signTypedData_v4') return '0x' + 'ab'.repeat(65);
      return null; } };
    window.__giftSent = []; document.addEventListener('osoframes:gift:sent', (e) => window.__giftSent.push(e.detail));`;
  const ctx = await ctxFor('nobody.example', { width: 1280, height: 800 });
  const libHits = []; ctx.on('request', (r) => { if (/\/lib\//.test(r.url())) libHits.push(new URL(r.url()).pathname); });
  // fail-closed: the facilitator is mocked; registered AFTER ctxFor's catch-all so it wins for these URLs only
  await ctx.route('https://gift-rail.opensourceorchestra.org/base/**', (route) => {
    const u = route.request().url();
    if (u.endsWith('/verify')) return route.fulfill({ json: { isValid: true } });
    if (u.endsWith('/settle')) return route.fulfill({ json: { success: true, transaction: '0x' + 'cd'.repeat(32) } });
    return route.abort();
  });
  await ctx.addInitScript(WALLET);
  const p = await ctx.newPage(); const errs = errsOf(p);
  await p.goto('http://nobody.example/narrow.html', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(1200);
  ok(libHits.length === 0, 'v0.1.12 PAGE-LOAD COST: nothing under /lib/ is fetched until the visitor shows intent' + (libHits.length ? ' → ' + libHits.join(',') : ''));
  const bp = '#oso-frames [data-slot=top-right] a[href="https://blessingpool.com/"]';
  ok(await p.evaluate((s) => { const a = document.querySelector(s); return !!a && a.getAttribute('aria-haspopup') === 'dialog'; }, bp), '🌊 Blessing Pool pinned top-right, href kept (SEO/no-JS), aria-haspopup=dialog');
  await p.hover(bp); await p.waitForTimeout(500);
  ok(libHits.includes('/lib/owh.js'), 'v0.1.12 first INTENT (hover/touch/focus on the 🌊) fetches the wallet picker module — the tap then feels instant');
  const urlBefore = p.url();
  await p.click(bp); await p.waitForTimeout(500);
  const card = await p.evaluate(() => { const d = document.querySelector('#oso-frames .osof-dlg[id*="gift"]'); if (!d || d.hidden) return null; return { role: d.getAttribute('role'), modal: d.getAttribute('aria-modal'), title: (d.querySelector('.osof-dlg-title') || {}).textContent || '' }; });
  ok(!!card && card.role === 'dialog' && card.modal === 'true' && /gifts of aloha/.test(card.title), 'a tap opens the gifts-of-aloha card (modal dialog), no navigation' + (card ? '' : ' (card not found)'));
  ok(p.url() === urlBefore, 'the tap did NOT navigate away');
  ok(await p.evaluate(() => { const r = document.querySelector('#oso-frames .osof-gift-rails'); return !!r && /Stripe/.test(r.textContent) && /PayPal/.test(r.textContent) && /Venmo/.test(r.textContent) && /x402/.test(r.textContent) && !!r.querySelector('a[href^="https://blessingpool.com"]'); }), 'the card carries the rails: pool page + Stripe · PayPal · Venmo + the x402 agent instructions');
  ok(await p.evaluate(() => { const g = document.querySelector('#oso-frames .owh-go'); return !!g && !g.hidden && /send USDC with MetaMask/.test(g.textContent); }), 'v0.1.12 a detected wallet → ONE big button "send USDC with MetaMask" (2 taps from the 🌊 to the wallet prompt)');
  await p.click('#oso-frames .osof-gift-amt[data-v="1"]');
  await p.click('#oso-frames .owh-go');
  await p.waitForFunction(() => /ALOHA RECEIVED/.test((document.querySelector('#oso-frames .osof-gift-st') || {}).innerHTML || ''), { timeout: 8000 });
  ok(true, 'gift flow settles through the mocked facilitator (the WALLET signs EIP-3009 itself → PayAI verify+settle)');
  ok(await p.evaluate(() => !!document.querySelector('#oso-frames .osof-gift-st a[href*="basescan.org/tx/0xcdcd"]')), 'on-chain receipt link shown');
  ok(await p.evaluate(() => window.__giftSent.length === 1 && window.__giftSent[0].amount === 1), 'gift:sent event emitted with the amount');
  ok(await p.evaluate(() => window.__rpc.filter((x) => x.startsWith('eth_signTypedData_v4')).join() === 'eth_signTypedData_v4:1000000:0x25965899f4600b3AA5362ee4f34be95E5E62c934'), 'the wallet was asked to sign exactly 1000000 USDC units ($1) to the ʻohana wallet');
  ok(await p.evaluate(() => !window.ethers), 'v0.1.12 no ethers.js, no cdnjs — the signing library is gone');
  await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => { const d = document.querySelector('#oso-frames .osof-dlg[id*="gift"]'); return d && d.hidden; }), 'Esc closes the card');
  // ABSORB: a legacy #x4-wrap on the page is hidden while the frame is on
  const absorbed = await p.evaluate(() => {
    const w = document.createElement('div'); w.id = 'x4-wrap'; w.innerHTML = '<button id="x4-pill">🤖</button><button id="x4-x">✕</button>';
    const m = document.createElement('button'); m.id = 'x4-mini'; document.body.appendChild(w); document.body.appendChild(m);
    return getComputedStyle(w).display === 'none' && getComputedStyle(m).display === 'none';
  });
  ok(absorbed, 'the pre-frame #x4-wrap/#x4-mini are absorbed while the frame is on (old cached pills)');
  { const e2 = errs.filter((e) => !/ERR_FAILED|net::|ERR_ABORTED/.test(e)); ok(!e2.length, 'no console/page errors' + (e2.length ? ' → ' + e2.slice(0, 4).join(' | ') : '')); }
  await ctx.close();
  // phone: the sheet's Blessing Pool tile opens the card and closes the sheet
  const ctx2 = await ctxFor('nobody.example', { width: 390, height: 844 }, true);
  await ctx2.route('https://gift-rail.opensourceorchestra.org/base/**', (route) => route.abort());
  await ctx2.addInitScript(WALLET);
  const p2 = await ctx2.newPage();
  await p2.goto('http://nobody.example/narrow.html', { waitUntil: 'load' });
  await p2.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p2.waitForTimeout(1200);
  await p2.click('#oso-frames .osof-sheetbtn'); await p2.waitForTimeout(400);
  // the 🎻 may start folded over words (first tap only unfolds it) → tap again until the sheet is open
  for (let i = 0; i < 3 && !(await p2.evaluate(() => !!document.querySelector('#osof-dlg-sheet:not([hidden])'))); i++) { await p2.click('#oso-frames .osof-sheetbtn'); await p2.waitForTimeout(400); }
  const tile = '#osof-dlg-sheet a[href="https://blessingpool.com/"]';
  ok(await p2.evaluate((s) => !!document.querySelector(s), tile), '📱 the phone sheet carries the Blessing Pool tile');
  await p2.click(tile); await p2.waitForTimeout(400);
  ok(await p2.evaluate(() => { const g = document.querySelector('#osof-dlg-gift'); const s = document.querySelector('#osof-dlg-sheet'); return g && !g.hidden && s && s.hidden; }), '📱 tile tap → card opens, sheet closes');
  await ctx2.close();
}

// 11a2 · Shaka 28 Nov 2026 16:57 BKK ("get rid of the 1c and 10c … $1 $10 and $100 and custom"): the amount row is EXACTLY $1 · $10 · $100 + the custom box, $10 preselected, and a default gift signs 10000000 units
{
  const ctx = await ctxFor('nobody.example', { width: 1280, height: 800 });
  await ctx.route('https://gift-rail.opensourceorchestra.org/base/**', (route) => { const u = route.request().url(); if (u.endsWith('/verify')) return route.fulfill({ json: { isValid: true } }); return route.fulfill({ json: { success: true, transaction: '0x' + 'cd'.repeat(32) } }); });
  await ctx.addInitScript(`window.__rpc = []; window.ethereum = { isMetaMask: true, request: async ({ method, params }) => { window.__rpc.push(method + (method === 'eth_signTypedData_v4' ? ':' + JSON.parse(params[1]).message.value : '')); if (method === 'eth_chainId') return '0x2105'; if (method === 'eth_signTypedData_v4') return '0x' + 'ab'.repeat(65); return ['0x1111111111111111111111111111111111111111']; } };`);
  const p = await ctx.newPage();
  await p.goto('http://nobody.example/narrow.html', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(900);
  await p.click('#oso-frames [data-slot=top-right] a[href="https://blessingpool.com/"]'); await p.waitForTimeout(700);
  const r = await p.evaluate(() => ({ chips: [...document.querySelectorAll('#oso-frames .osof-gift-amt')].map((b) => b.textContent + ':' + b.dataset.v + ':' + b.getAttribute('aria-pressed')), custom: !!document.querySelector('#oso-frames .osof-gift-custom'), text: document.querySelector('#osof-dlg-gift').innerText }));
  ok(JSON.stringify(r.chips) === JSON.stringify(['$1:1:false', '$10:10:true', '$100:100:false']) && r.custom, '💲 the amount row = $1 · $10 · $100 + custom, $10 preselected (' + r.chips.join(' ') + ')');
  ok(!/1¢|10¢/.test(r.text), '💲 no 1¢ / 10¢ anywhere in the card');
  await p.click('#oso-frames .owh-go'); await p.waitForFunction(() => /ALOHA RECEIVED/.test((document.querySelector('#oso-frames .osof-gift-st') || {}).textContent || ''), { timeout: 8000 });
  ok(await p.evaluate(() => window.__rpc.filter((x) => x.startsWith('eth_signTypedData_v4')).join() === 'eth_signTypedData_v4:10000000'), '💲 the default gift signs exactly 10000000 USDC units ($10)');
  await p.click('#oso-frames .osof-gift-amt[data-v="100"]'); await p.click('#oso-frames .owh-go');
  await p.waitForFunction(() => window.__rpc.filter((x) => x.startsWith('eth_signTypedData_v4')).length === 2, { timeout: 8000 });
  ok(await p.evaluate(() => window.__rpc.filter((x) => x.startsWith('eth_signTypedData_v4'))[1] === 'eth_signTypedData_v4:100000000'), '💲 tapping $100 signs 100000000 units');
  await ctx.close();
}
// 11b · PAʻA SITE-2 (28 Nov 2026): the facilitator's reply is NETWORK DATA — a hostile `transaction` must never become markup or an event payload
{
  const WALLET = `
    window.ethereum = { isMetaMask: true, request: async ({ method }) => (method === 'eth_chainId' ? '0x2105' : method === 'eth_signTypedData_v4' ? '0x' + 'ab'.repeat(65) : ['0x1111111111111111111111111111111111111111']) };
    window.__giftSent = []; document.addEventListener('osoframes:gift:sent', (e) => window.__giftSent.push(e.detail));`;
  const HOSTILE = '0x"><img src=x onerror="window.__xss=1"><a href="javascript:window.__xss=2">x</a>';
  for (const [label, tx] of [['hostile markup', HOSTILE], ['not a hash (short hex)', '0xabc'], ['not a string', 12345]]) {
    const ctx = await ctxFor('nobody.example', { width: 1280, height: 800 });
    await ctx.route('https://gift-rail.opensourceorchestra.org/base/**', (route) => {
      const u = route.request().url();
      if (u.endsWith('/verify')) return route.fulfill({ json: { isValid: true } });
      if (u.endsWith('/settle')) return route.fulfill({ json: { success: true, transaction: tx } });
      return route.abort();
    });
    await ctx.addInitScript(WALLET);
    const p = await ctx.newPage(); const errs = errsOf(p);
    await p.goto('http://nobody.example/narrow.html', { waitUntil: 'load' });
    await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(1000);
    await p.click('#oso-frames [data-slot=top-right] a[href="https://blessingpool.com/"]'); await p.waitForTimeout(600);
    await p.click('#oso-frames .osof-gift-amt[data-v="1"]');
    await p.click('#oso-frames .owh-go');
    await p.waitForFunction(() => /ALOHA RECEIVED/.test((document.querySelector('#oso-frames .osof-gift-st') || {}).textContent || ''), { timeout: 8000 });
    await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const st = document.querySelector('#oso-frames .osof-gift-st'); return { imgs: st.querySelectorAll('img,script,iframe,svg').length, links: Array.from(st.querySelectorAll('a')).map((a) => a.getAttribute('href')), xss: window.__xss || 0, sent: window.__giftSent.map((e) => e.tx) }; });
    ok(r.imgs === 0 && !r.xss, '11b ' + label + ': no element injected from the facilitator reply, no script ran');
    ok(r.links.length === 0 && r.sent.length === 1 && r.sent[0] === null, '11b ' + label + ': no receipt link, gift:sent carries tx = null (never the hostile value)');
    { const e2 = errs.filter((e) => !/ERR_FAILED|net::|ERR_ABORTED/.test(e)); ok(!e2.length, '11b ' + label + ': no console/page errors' + (e2.length ? ' → ' + e2.slice(0, 3).join(' | ') : '')); }
    await ctx.close();
  }
}

// 11c · v0.1.12 THE PHONE (Shaka, 28 Nov 2026, on his phone: "pressing the wallet button on the x402 gift rail doesn't work"):
// no wallet in the browser → NO dead end: the picker opens the wallet APP by universal link; the page comes back inside the wallet and starts.
{
  const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: IPHONE });
  const navs = [];
  await ctx.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (u.hostname === 'nobody.example' || u.hostname === '127.0.0.1') return route.continue({ url: `http://127.0.0.1:${srv.port}${u.pathname}${u.search}` });
    if (/^(link\.metamask\.io|go\.cb-w\.com|phantom\.(app|com)|link\.trustwallet\.com)$/.test(u.hostname)) { navs.push(u.href); return route.fulfill({ body: '<h1>wallet landing</h1>', contentType: 'text/html' }); }
    if (/lang\.opensourceorchestra\.org/.test(u.hostname)) return route.fulfill({ status: 200, contentType: 'text/javascript', body: '/* lang.js stub */' });
    return route.abort();
  });
  const p = await ctx.newPage(); const errs = errsOf(p);
  await p.goto('http://nobody.example/narrow.html', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(1200);
  // on a phone the rail folds into the 🎻 sheet: the Blessing Pool tile is the door (same as test 11's phone block)
  await p.tap('#oso-frames .osof-sheetbtn'); await p.waitForTimeout(400);
  for (let i = 0; i < 3 && !(await p.evaluate(() => !!document.querySelector('#osof-dlg-sheet:not([hidden])'))); i++) { await p.tap('#oso-frames .osof-sheetbtn'); await p.waitForTimeout(400); }
  await p.tap('#osof-dlg-sheet a[href="https://blessingpool.com/"]'); await p.waitForTimeout(1200);
  const txt = await p.evaluate(() => (document.querySelector('#osof-dlg-gift') || {}).innerText || '');
  ok(!/no wallet (found|detected)/i.test(txt) && /MetaMask/.test(txt) && /Coinbase Wallet/.test(txt) && /Phantom/.test(txt) && /Trust Wallet/.test(txt) && /another wallet/.test(txt), '📱 no wallet in the browser → NO dead end: MetaMask · Coinbase Wallet · Phantom · Trust Wallet · another wallet' + (txt ? '' : ' (card empty)'));
  ok(await p.evaluate(() => { const d = document.querySelector('#osof-dlg-gift .osof-dlg-box, #osof-dlg-gift'); const r = d.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 0.5 && document.documentElement.scrollWidth <= innerWidth + 1; }), '📱 the card fits the 390 px screen (no sideways scroll)');
  await p.tap('#oso-frames .osof-gift-amt[data-v="1"]'); await p.waitForTimeout(200);
  const href = await p.locator('#osof-dlg-gift .owh-grid a[data-w=eip681]').getAttribute('href');
  ok(/uint256=1000000$/.test(href || ''), '📱 picking $1 rewrites every wallet link (1000000 USDC units)');
  const req = p.waitForRequest((r) => r.url().startsWith('https://link.metamask.io/dapp/'), { timeout: 5000 }).catch(() => null);
  await p.tap('#osof-dlg-gift .owh-grid a[data-w=metamask]');
  const rq = await req;
  ok(!!rq && /osogift=frames%3A1%3A%3Ago/.test(rq.url()) && /nobody\.example\/narrow\.html/.test(rq.url()), '📱 tap MetaMask → universal link carrying THIS page + ?osogift=frames:1 (the way back)' + (rq ? '' : ' (no navigation)'));
  { const e2 = errs.filter((e) => !/ERR_FAILED|net::|ERR_ABORTED/.test(e)); ok(!e2.length, '📱 no console/page errors' + (e2.length ? ' → ' + e2.slice(0, 3).join(' | ') : '')); }
  await ctx.close();
}
// 11d · the way back: opened INSIDE a wallet by our own link → the card opens by itself, amount kept, the wallet is asked ONCE; $50 never auto-starts
{
  const WALLET_LATE = `window.__rpc = []; setTimeout(function(){ window.ethereum = { isMetaMask: true, request: async ({ method, params }) => { window.__rpc.push(method + (method === 'eth_signTypedData_v4' ? ':' + JSON.parse(params[1]).message.value : '')); if (method === 'eth_chainId') return '0x2105'; if (method === 'eth_signTypedData_v4') return '0x' + 'ab'.repeat(65); return ['0x1111111111111111111111111111111111111111']; } }; }, 500);`;
  const mk = async (q) => {
    const ctx = await ctxFor('nobody.example', { width: 390, height: 844 }, true);
    await ctx.route('https://gift-rail.opensourceorchestra.org/base/**', (route) => { const u = route.request().url(); if (u.endsWith('/verify')) return route.fulfill({ json: { isValid: true } }); if (u.endsWith('/settle')) return route.fulfill({ json: { success: true, transaction: '0x' + 'ef'.repeat(32) } }); return route.abort(); });
    await ctx.addInitScript(WALLET_LATE);
    const p = await ctx.newPage(); const errs = errsOf(p);
    await p.goto('http://nobody.example/narrow.html' + q, { waitUntil: 'load' });
    return { ctx, p, errs };
  };
  let r = await mk('?osogift=frames:1::go&keep=1');
  await r.p.waitForFunction(() => /ALOHA RECEIVED/.test((document.querySelector('#oso-frames .osof-gift-st') || {}).textContent || ''), { timeout: 14000 });
  ok(await r.p.evaluate(() => document.querySelector('#oso-frames .osof-gift-amt[aria-pressed="true"]').dataset.v === '1' && window.__rpc.filter((x) => x.startsWith('eth_signTypedData_v4')).join() === 'eth_signTypedData_v4:1000000'), '🔙 way back: the card opened itself, $1 selected, the wallet asked ONCE for 1000000 units, settled');
  ok(await r.p.evaluate(() => location.search === '?keep=1'), '🔙 way back: ?osogift removed from the URL, other params kept');
  await r.ctx.close();
  r = await mk('?osogift=frames:50::go');
  await r.p.waitForTimeout(3500);
  ok(await r.p.evaluate(() => { const d = document.querySelector('#oso-frames .osof-dlg[id*="gift"]'); return !!d && !d.hidden && document.querySelector('#oso-frames .osof-gift-custom').value === '50' && window.__rpc.filter((x) => x.startsWith('eth_sign')).length === 0; }), '🔙 way back with $50: the card opens with 50 in the box, the wallet is NOT prompted (auto-start cap $10)');
  await r.ctx.close();
}
// 11e · fail-soft: if lib/owh.js cannot load, the card never dead-ends — the by-hand way (copy the address) appears with a kind line
{
  const ctx = await ctxFor('nobody.example', { width: 1280, height: 800 });
  await ctx.route('**/lib/owh.js', (route) => route.abort());
  const p = await ctx.newPage();
  await p.goto('http://nobody.example/narrow.html', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(1000);
  await p.click('#oso-frames [data-slot=top-right] a[href="https://blessingpool.com/"]'); await p.waitForTimeout(900);
  ok(await p.evaluate(() => { const fb = document.querySelector('#oso-frames .osof-gift-fb'); return !!fb && !fb.hidden && /0x25965899f4600b3AA5362ee4f34be95E5E62c934/.test(fb.textContent) && /could not load/.test(document.querySelector('#oso-frames .osof-gift-st').textContent); }), 'lib/owh.js unavailable → the by-hand fallback shows the ʻohana address + copy, with a kind line (no dead end)');
  await ctx.close();
}

// 11f · Shaka's friend (28 Nov 2026): the wallet signed, then the card said "⚠️ hiccup: Load failed" — PayAI is server-to-server (no CORS), the gift rail's Base lane is the
// browser-safe hop. FAILURE PATHS in plain words + the by-hand way on screen (a failure state must offer something to TAP).
{
  const WALLET = `window.ethereum = { isMetaMask: true, request: async ({ method }) => (method === 'eth_chainId' ? '0x2105' : method === 'eth_signTypedData_v4' ? '0x' + 'ab'.repeat(65) : ['0x1111111111111111111111111111111111111111']) };`;
  const cases = [
    ['rail unreachable (Safari "Load failed")', (route) => route.abort('failed'), /couldn.t reach the gift rail — nothing left your wallet/, true],
    ['not enough USDC', (route) => route.fulfill({ json: { isValid: false, invalidReason: 'invalid_exact_evm_insufficient_balance' } }), /not enough USDC on Base in this wallet/, false],
    ['rail resting', (route) => route.fulfill({ status: 503, json: { isValid: false, invalidReason: 'proxy_paused' } }), /gift rail is resting/, true],
    ['settlement_pending is not a failure', (route) => (route.request().url().endsWith('/verify') ? route.fulfill({ json: { isValid: true } }) : route.fulfill({ json: { success: false, errorReason: 'settlement_pending' } })), /still settling — it may still land/, false],
  ];
  for (const [label, handler, re, fallback] of cases) {
    const ctx = await ctxFor('nobody.example', { width: 1280, height: 800 });
    await ctx.route('https://gift-rail.opensourceorchestra.org/base/**', handler);
    await ctx.addInitScript(WALLET);
    const p = await ctx.newPage();
    await p.goto('http://nobody.example/narrow.html', { waitUntil: 'load' });
    await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(900);
    await p.click('#oso-frames [data-slot=top-right] a[href="https://blessingpool.com/"]'); await p.waitForTimeout(700);
    await p.click('#oso-frames .owh-go'); await p.waitForTimeout(1500);
    const r = await p.evaluate(() => ({ st: (document.querySelector('#oso-frames .osof-gift-st') || {}).textContent || '', addr: !!document.querySelector('#oso-frames .owh-addr:not([hidden])'), ex: !!document.querySelector('#oso-frames .owh-ex') }));
    ok(re.test(r.st) && !/hiccup|Load failed|Failed to fetch/i.test(r.st), '11f ' + label + ': plain words, never "hiccup"/"Load failed" → ' + r.st.slice(0, 90));
    if (fallback) ok(r.addr, '11f ' + label + ': the by-hand way (address + copy) is on screen');
    if (label.startsWith('rail unreachable')) ok(r.ex, '11f the pre-sign explainer ("high-risk approval" / "untrusted EOA") is in the card');
    await ctx.close();
  }
}

// 11g · v0.1.16 THE PLAIN TRANSFER (Shaka, 28 Nov 2026: "yes you can do all these yourself"): beside the gas-free button, a 🪙 plain transfer = a normal USDC send from the visitor's own wallet
// (no typed-data screen → no "high-risk approval / untrusted EOA" warning). It never touches the gift rail.
{
  const ctx = await ctxFor('nobody.example', { width: 1280, height: 800 });
  let railHits = 0; await ctx.route('https://gift-rail.opensourceorchestra.org/base/**', (route) => { railHits++; return route.abort(); });
  await ctx.addInitScript(`window.__rpc = []; window.__txs = []; window.__giftSent = []; document.addEventListener('osoframes:gift:sent', (e) => window.__giftSent.push(e.detail));
    var polls = 0; window.ethereum = { isMetaMask: true, request: async ({ method, params }) => { window.__rpc.push(method);
      if (method === 'eth_requestAccounts') return ['0x1111111111111111111111111111111111111111'];
      if (method === 'eth_chainId') return '0x2105';
      if (method === 'eth_call') return '0x' + (500000000).toString(16).padStart(64, '0');
      if (method === 'eth_sendTransaction') { window.__txs.push(params[0]); return '0x' + 'ef'.repeat(32); }
      if (method === 'eth_getTransactionReceipt') { polls++; return polls < 2 ? null : { status: '0x1' }; }
      throw new Error('unexpected ' + method); } };`);
  const p = await ctx.newPage(); const errs = errsOf(p);
  await p.goto('http://nobody.example/narrow.html', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(900);
  await p.click('#oso-frames [data-slot=top-right] a[href="https://blessingpool.com/"]'); await p.waitForTimeout(700);
  ok(await p.evaluate(() => { const b = document.querySelector('#oso-frames .owh-plain'); return !!b && !b.hidden && /plain transfer/.test(b.textContent) && /no signature screens/.test(b.textContent); }), '11g a detected wallet → the 🪙 "plain transfer" row sits beside the gas-free button, in words a stranger understands');
  await p.evaluate(() => { OWH.timeouts.poll = 20; });
  await p.click('#oso-frames .osof-gift-amt[data-v="1"]'); await p.click('#oso-frames .owh-plain');
  await p.waitForFunction(() => /ALOHA RECEIVED/.test((document.querySelector('#oso-frames .osof-gift-st') || {}).textContent + (document.querySelector('#oso-frames .owh-n') || {}).textContent), { timeout: 8000 });
  const r = await p.evaluate(() => ({ tx: window.__txs[0], rpc: window.__rpc.slice(), sent: window.__giftSent, link: (document.querySelector('#oso-frames .owh-n a') || {}).href }));
  ok(r.tx && r.tx.to.toLowerCase() === '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' && r.tx.value === '0x0' && r.tx.data === '0xa9059cbb' + '00000000000000000000000025965899f4600b3aa5362ee4f34be95e5e62c934' + (1000000).toString(16).padStart(64, '0'), '11g the wallet was asked for a plain USDC transfer(osoartist.eth, 1000000) — to the USDC contract, value 0, exact calldata');
  ok(!r.rpc.includes('eth_signTypedData_v4') && railHits === 0, '11g no typed-data signature was requested and the gift rail was never called (a plain send is peer to peer)');
  ok(r.link === 'https://basescan.org/tx/0x' + 'ef'.repeat(32), '11g the card shows the BaseScan receipt for exactly that hash');
  ok(r.sent.length === 1 && r.sent[0].route === 'plain' && r.sent[0].amount === 1 && r.sent[0].tx === '0x' + 'ef'.repeat(32), '11g gift:sent fires once with route "plain", the amount and the hash');
  { const e2 = errs.filter((e) => !/ERR_FAILED|net::|ERR_ABORTED/.test(e)); ok(!e2.length, '11g no console/page errors' + (e2.length ? ' → ' + e2.slice(0, 4).join(' | ') : '')); }
  await ctx.close();
}
// 11h · v0.1.16 THE FLAGSHIP (Shaka, 28 Nov 2026: "yes you can do all these yourself with my blessing" — SPEC §10 relaxed): opensourceorchestra.org's 🌊 opens the same card on a tap
{
  const ctx = await ctxFor('opensourceorchestra.org', { width: 1280, height: 800 });
  const p = await ctx.newPage(); const errs = errsOf(p);
  await p.goto('http://opensourceorchestra.org/oso.html', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(900);
  const id = await p.evaluate(() => OSOFrames.data.id);
  ok(id === 'oso-flagship', '11h the flagship dataset is worn (id ' + id + ')');
  const bp = '#oso-frames [data-slot=top-right] a[href="https://blessingpool.com/"]';
  ok(await p.evaluate((s) => { const a = document.querySelector(s); return !!a && a.getAttribute('aria-haspopup') === 'dialog'; }, bp), '11h the flagship 🌊 carries aria-haspopup=dialog (it opens the gift card)');
  const urlBefore = p.url(); await p.click(bp); await p.waitForTimeout(700);
  ok(await p.evaluate(() => { const d = document.querySelector('#oso-frames .osof-dlg[id*="gift"]'); return !!d && !d.hidden && d.getAttribute('role') === 'dialog'; }) && p.url() === urlBefore, '11h a tap on the flagship 🌊 opens the gifts-of-aloha card, no navigation');
  ok(await p.evaluate(() => !document.querySelector('#oso-frames .osof-gift-banner') && !document.querySelector('#oso-frames [data-osof-kind=gift]')), '11h still no magnet: the card opens ONLY on the visitor\'s tap (nothing auto-opens, no banner)');
  { const e2 = errs.filter((e) => !/ERR_FAILED|net::|ERR_ABORTED/.test(e)); ok(!e2.length, '11h no console/page errors' + (e2.length ? ' → ' + e2.slice(0, 4).join(' | ') : '')); }
  await ctx.close();
}

// 11i · v0.1.17 ACCESSIBILITY (SPEC §9 "axe: 0 serious/critical inside #oso-frames"): the credit ✕'s accessible name must CONTAIN its visible label ("hide frame", shown on hover/focus and once for 4 s on a first visit)
// — axe `label-content-name-mismatch` (serious) flagged "Hide the whole frame …" on the live flagship. axe-core is looked up beside the playwright cache; no axe → the test says so and is skipped (never silently green).
{
  const AXE = [process.env.AXE_JS, '/workspace/.cache/pw/node_modules/axe-core/axe.min.js', '/usr/lib/node_modules/axe-core/axe.min.js'].filter(Boolean).find((f) => existsSync(f));
  if (!AXE) console.log('⚠ 11i skipped: axe-core not found (set AXE_JS=/path/to/axe.min.js)');
  else for (const [label, vp, mobile] of [['desktop', { width: 1280, height: 800 }, false], ['phone', { width: 390, height: 844 }, true]]) {
    const ctx = await ctxFor('nobody.example', vp, mobile); const p = await ctx.newPage();
    await p.goto('http://nobody.example/narrow.html?frame=fresh', { waitUntil: 'load' });
    await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(1200);
    await p.evaluate(() => { const x = document.querySelector('#oso-frames .osof-credit-x'); if (x) x.classList.add('osof-say'); });      // the visible "✕ hide frame" label is ON while axe looks
    await p.addScriptTag({ path: AXE });
    const v = await p.evaluate(async () => { const res = await axe.run('#oso-frames', { resultTypes: ['violations'] }); return res.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical').map((x) => x.id + ' → ' + x.nodes[0].target.join(' ')); });
    ok(v.length === 0, '11i ' + label + ': axe finds 0 serious/critical inside #oso-frames' + (v.length ? ' → ' + v.join(' | ') : ''));
    await ctx.close();
  }
}

// 12 · v0.1.9 THE TOTEM STAYS IN THE SCREEN (Shaka, 28 Nov 2026: "i like when you can talk to the totem in screen like devconpit.com as a standard")
{
  const ctx = await ctxFor('nobody.example', { width: 1280, height: 800 });
  const p = await ctx.newPage(); const errs = errsOf(p);
  await p.goto('http://nobody.example/ownchat.html?frame=fresh', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(900);
  let r = await p.evaluate(() => { const F = document.getElementById('oso-frames'); return { pill: !!F.querySelector('[data-osof-kind=chat]'), own: !!document.getElementById('oso-fab'), faces: F.querySelectorAll('.osof-tt-face').length, drawerBuilt: !!document.querySelector('.osof-chat'), path: location.pathname }; });
  ok(r.own && !r.pill, 'the page already has its own chat button → the frame draws NO second pill (adopt mode kept)');
  ok(r.faces >= 6, `the totem is on the rail (${r.faces} faces)`);
  await p.click('#oso-frames .osof-tt-face'); await p.waitForTimeout(500);
  r = await p.evaluate(() => { const d = document.querySelector('.osof-chat'); return { path: location.pathname, open: !!d && !d.hidden, name: (document.querySelector('.osof-chat-name') || {}).textContent || '', chips: document.querySelectorAll('.osof-chat-chips button').length }; });
  ok(r.path === '/ownchat.html', `a face tap does NOT leave the page (still ${r.path})`);
  ok(r.open && r.name.trim().length > 0, `the chat drawer opens IN the page, talking to ${r.name.trim()}`);
  ok(r.chips >= 6, `the drawer carries the totem chips (${r.chips})`);
  await p.click('.osof-chat-x'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.querySelector('.osof-chat').hidden), 'the ✕ closes the drawer');
  ok(!errs.filter((e) => /^PE:/.test(e)).length, 'no page errors' + (errs.length ? ' → ' + errs.join(' | ') : ''));
  await ctx.close();
}
{ // the page's own button is built LATE (after the frame offered its pill): the pill steps aside, the drawer stays
  const ctx = await ctxFor('nobody.example', { width: 1280, height: 800 });
  const p = await ctx.newPage(); const errs = errsOf(p);
  await p.goto('http://nobody.example/navleak.html?frame=fresh', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(5200);
  let r = await p.evaluate(() => { const F = document.getElementById('oso-frames'); return { pill: !!F.querySelector('[data-osof-kind=chat]'), own: !!document.getElementById('oso-fab') }; });
  ok(r.own && !r.pill, 'late page FAB adopted: the frame pill stepped aside (no double chat)');
  await p.click('#oso-frames .osof-tt-face'); await p.waitForTimeout(500);
  r = await p.evaluate(() => { const d = document.querySelector('.osof-chat'); return { path: location.pathname, open: !!d && !d.hidden }; });
  ok(r.path === '/navleak.html' && r.open, 'after a late adopt, a totem face still opens the drawer in the page (no navigation)');
  await ctx.close();
}
{ // phones: the 🎻 sheet's face tile opens the drawer too
  const ctx = await ctxFor('nobody.example', { width: 390, height: 844 }, true);
  const p = await ctx.newPage(); const errs = errsOf(p);
  await p.goto('http://nobody.example/ownchat.html?frame=fresh', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(900);
  await p.click('#oso-frames .osof-sheetbtn'); await p.waitForTimeout(400);
  for (let i = 0; i < 3 && !(await p.evaluate(() => !!document.querySelector('#osof-dlg-sheet:not([hidden])'))); i++) { await p.click('#oso-frames .osof-sheetbtn'); await p.waitForTimeout(400); }
  const nFaces = await p.evaluate(() => document.querySelectorAll('#osof-dlg-sheet [data-osof-face]').length);
  ok(nFaces >= 6, `📱 the sheet lists the totem faces (${nFaces})`);
  await p.click('#osof-dlg-sheet [data-osof-face]'); await p.waitForTimeout(500);
  const r = await p.evaluate(() => { const d = document.querySelector('.osof-chat'); return { path: location.pathname, open: !!d && !d.hidden }; });
  ok(r.path === '/ownchat.html' && r.open, '📱 a face tile opens the drawer in the page (no navigation)');
  ok(!errs.filter((e) => /^PE:/.test(e)).length, '📱 no page errors');
  await ctx.close();
}

// 13 · v0.1.10 A FOLDED PIECE NEVER EATS A CLICK (Shaka, 28 Nov 2026, opensourceorchestra.org: "the x close button doesnt work on talk to oso")
// The page's own chat panel opened under a frame item at a 1470×797 window; the probe folded the item and then marked it GONE — but only its
// CHILDREN were hidden: the wrapper kept its held box and pointer-events:auto, an invisible click-catcher over the page's ✕. The law of the box:
// a piece that has stepped aside keeps its BOX (nothing moves) but lets every click fall through; only the dot / mini that is still shown takes taps.
{
  const ctx = await ctxFor('nobody.example', { width: 1470, height: 797 });
  const p = await ctx.newPage(); const errs = errsOf(p);
  await p.goto('http://nobody.example/narrow.html?frame=fresh', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(1200);
  // build the page's OWN panel (a fixed widget of the page, like #oso-chat) with its ✕ exactly under the 2nd top-right item
  const geo = await p.evaluate(() => {
    const items = [...document.querySelectorAll('#oso-frames [data-slot=top-right]>.osof-item')].filter((e) => e.getBoundingClientRect().width > 4);
    const t = items[1] || items[0]; if (!t) return null;
    const r = t.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const panel = document.createElement('div'); panel.id = 'oso-chat';
    panel.style.cssText = `position:fixed;z-index:61;width:300px;height:380px;left:${Math.round(cx + 18 - 300)}px;top:${Math.round(cy - 22)}px;background:#1a1736;color:#eee;border:1px solid #555;border-radius:14px;font:15px/1.4 Georgia,serif`;
    panel.innerHTML = '<div id="oso-head" style="padding:12px 14px">OSO — live from the Open Source Orchestra</div>'
      + '<button id="oso-x" type="button" style="position:absolute;top:10px;right:10px;width:16px;height:24px;padding:0;border:0;background:none;color:#fff;font:16px/24px sans-serif;cursor:pointer">✕</button>';
    document.body.appendChild(panel);
    window.__closed = 0; document.getElementById('oso-x').onclick = () => { window.__closed++; panel.style.display = 'none'; };
    const xb = document.getElementById('oso-x').getBoundingClientRect();
    return { item: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }, x: { l: xb.left, t: xb.top, w: xb.width, h: xb.height } };
  });
  ok(!!geo, 'fixture: the top-right slot has items to sit under');
  // the probe (MutationObserver → debounce) folds/gones the item that now sits on the page's panel
  await p.waitForFunction(() => document.querySelector('#oso-frames [data-slot=top-right]>.osof-item[data-osof-gone],#oso-frames [data-slot=top-right]>.osof-item[data-osof-folded]'), { timeout: 6000 }).catch(() => {});
  await p.waitForTimeout(600);
  const st = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('#oso-frames .osof-item[data-osof-gone],#oso-frames .osof-item[data-osof-folded]').forEach((w) => {
      const cs = getComputedStyle(w); const gone = w.hasAttribute('data-osof-gone');
      const kids = [...w.querySelectorAll('*')].filter((k) => { const c = getComputedStyle(k); return c.pointerEvents !== 'none' && c.visibility !== 'hidden' && c.display !== 'none' && k.getBoundingClientRect().width > 0 && !k.classList.contains('osof-idot') && !k.closest('.osof-idot') && !/osof-(rd|fab)-mini/.test(k.className); });
      out.push({ gone, wrapPE: cs.pointerEvents, liveKids: gone ? kids.length : 0 });
    });
    return out;
  });
  ok(st.length > 0, `the law stepped a piece aside under the panel (${st.length} folded/gone wrapper${st.length === 1 ? '' : 's'}) — the test is not vacuous`);
  ok(st.every((s) => s.wrapPE === 'none'), 'every folded/gone wrapper lets clicks fall through (pointer-events:none)' + (st.some((s) => s.wrapPE !== 'none') ? ' → ' + JSON.stringify(st) : ''));
  ok(st.filter((s) => s.gone).every((s) => s.liveKids === 0), 'a GONE piece has no clickable descendant left');
  // the page's ✕ is what a click at its centre/corners reaches — never a frame item
  const hits = await p.evaluate((g) => {
    const x = g.x, pts = [[x.l + x.w / 2, x.t + x.h / 2], [x.l + 3, x.t + 3], [x.l + x.w - 3, x.t + 3], [x.l + 3, x.t + x.h - 3], [x.l + x.w - 3, x.t + x.h - 3]];
    return pts.map(([px, py]) => { const e = document.elementFromPoint(px, py); return e ? (e.id || e.tagName.toLowerCase() + '.' + String(e.className).slice(0, 24)) : null; });
  }, geo);
  ok(hits.every((h) => h === 'oso-x'), `a click anywhere on the page's ✕ reaches the ✕ (hit: ${hits.join(', ')})`);
  await p.mouse.click(geo.x.l + geo.x.w / 2, geo.x.t + geo.x.h / 2); await p.waitForTimeout(300);
  ok(await p.evaluate(() => window.__closed === 1), 'a REAL mouse click on the ✕ runs the page\'s close handler (the panel closes)');
  // …and the frame still works everywhere else: a visible rail door is still a hit target, a dot (if any) still takes its tap
  ok(await p.evaluate(() => { const a = document.querySelector('#oso-frames [data-slot=left] .osof-item:not([data-osof-gone]):not([data-osof-folded]) a, #oso-frames [data-slot=left] .osof-item:not([data-osof-gone]):not([data-osof-folded]) button'); if (!a) return true; const r = a.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!e && !!e.closest('.osof-item'); }), 'a visible frame door still takes its clicks (we did not switch pointer events off globally)');
  ok(await p.evaluate(() => { const d = [...document.querySelectorAll('#oso-frames .osof-item[data-osof-folded]:not([data-osof-gone]) .osof-idot')].find((x) => x.getBoundingClientRect().width > 0); if (!d) return true; const r = d.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!e && (e === d || d.contains(e)); }), 'a folded piece\'s dot still takes its tap');
  ok(!errs.filter((e) => /^PE:/.test(e)).length, 'no page errors' + (errs.length ? ' → ' + errs.join(' | ') : ''));
  await ctx.close();
}

// 14 · v0.1.11 the extended page-native chat launcher list (hosted slugs and doors carry their own chat launchers)
{ // every page-native chat launcher id of the census: no second pill, the totem still opens the drawer
  const ids = ['sp-fab', 'sp-fabwrap', 'ij-fab', 'ttp-fab', 'cr-fab', 'cr-fabwrap', 'ohanaTalkRoot', 'tchatBtn', 'tchat', 'gy-fab', 'gy-fabwrap', 'kprot-fab', 'kprot-fab-mini', 'tele-fab', 'tele-fab-mini', 'vlog-fab', 'vlog-fab-mini', 'traceyTalkRoot', 'komoroTalkRoot', 'oso-fabwrap'];
  const ctx = await ctxFor('nobody.example', { width: 1280, height: 800 });
  let bad = [];
  for (const id of ids) {
    const p = await ctx.newPage();
    await p.goto('http://nobody.example/ownchat.html?frame=fresh&fab=' + id, { waitUntil: 'load' });
    await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached' }); await p.waitForTimeout(500);
    const pill = await p.evaluate(() => !!document.querySelector('#oso-frames [data-osof-kind=chat]'));
    await p.click('#oso-frames .osof-tt-face', { timeout: 4000 }).catch(() => {}); await p.waitForTimeout(250);
    const r = await p.evaluate(() => { const d = document.querySelector('.osof-chat'); return { path: location.pathname, open: !!d && !d.hidden }; });
    if (pill || !r.open || r.path !== '/ownchat.html') bad.push(id + (pill ? ':pill' : '') + (r.open ? '' : ':nodrawer') + (r.path !== '/ownchat.html' ? ':navigated' : ''));
    await p.close();
  }
  ok(bad.length === 0, `${ids.length} page-native chat launcher ids: no second pill, a totem tap opens the drawer in the page` + (bad.length ? ' → ' + bad.join(' ') : ''));
  await ctx.close();
}

await b.close(); srv.close();
console.log(fails ? `\n✗ ${fails} check(s) failed` : '\n✓ e2e-settings: all green');
process.exit(fails ? 1 : 0);
