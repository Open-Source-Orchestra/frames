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
const OVERLAY = { frame: 'osoframes/0.1', id: 'ben-artist', name: 'Ben · artist frame', accent: '#2f9e6f', credit: { add: ['Ben'] },
  slots: { left: [{ kind: 'door', id: 'home', emoji: '🎸', label: 'Ben', href: '/?who=ben', tip: 'Ben, the first beta artist.' }, { kind: 'door', id: 'ben-tip', emoji: '💸', label: 'Tip Ben', href: 'https://artist.opensourceorchestra.org/tip/?artist=ben', tip: 'Tip Ben over x402.' }],
           'bottom-right': { remove: ['radio'] } } };
// 22 Nov 2026: a page whose own CSS reaches our <nav> zones (publicinform.com) + a late-built page chat FAB + a bottom mini player
const NAVLEAK = PAGE('nav leak', `<div style="max-width:560px;margin:60px auto 0">` + Array.from({ length: 30 }, (_, i) => `<p>Paragraph ${i + 1}. ${'Centred words. '.repeat(8)}</p>`).join('') + '</div>' +
  `<div id="mini" style="position:fixed;right:16px;bottom:12px;width:300px;height:44px;border-radius:22px;background:#333;color:#fff;font:13px/44px sans-serif;padding:0 16px">TAP TO PLAY — a song of the orchestra</div>` +
  `<script>setTimeout(function(){var b=document.createElement('button');b.id='oso-fab';b.textContent='Talk to OSO';b.style.cssText='position:fixed;right:20px;bottom:70px;padding:10px 16px;border-radius:999px';document.body.appendChild(b);},2800);</script>`)
  .replace('<style>', '<style>nav{position:fixed;top:0;left:0;right:0;z-index:50;display:grid;grid-template-columns:auto 1fr auto;padding:14px 32px;background:#000}nav::after{content:"";width:110px}')
  .replace('<main>', '<nav><a href="/">A page nav</a><span></span><a href="/x">Links</a></nav><main>');
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
        if (u.pathname === '/navleak.html') return rsp.writeHead(200, { 'content-type': TYPES['.html'] }).end(NAVLEAK);
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
  await p.goto('http://publicinform.com/narrow.html?frame=fresh', { waitUntil: 'load' });
  await p.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached', timeout: 15000 });
  const r = await p.evaluate(() => ({ id: OSOFrames.data.id, accent: getComputedStyle(document.getElementById('oso-frames')).getPropertyValue('--osof-accent').trim(), first: OSOFrames.data.slots.left[0].id, pitGone: !OSOFrames.data.slots.left.some((i) => i.id === 'pit'), n: OSOFrames.data.slots.left.length, version: OSOFrames.version, gear: !!document.querySelector('#oso-frames .osof-credit-g') }));
  ok(r.id === 'pit-protocol', `data-door=auto on publicinform.com → id ${r.id}`);
  ok(r.accent === '#7fe0ff', `accent applied (${r.accent})`);
  ok(r.first === 'home' && r.pitGone && r.n >= 10, `slot ops: prepend + remove (left: ${r.n} items, first ${r.first})`);
  ok(r.version === '0.1.2' && r.gear, `v${r.version} with the ⚙ gear in the credit mark`);
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
    return { rightX: z('right').left, leftX: z('left').left, vw, totemRight: !!tr && tr.left > vw / 2, overlaps, chat: !!F.querySelector('[data-osof-kind=chat]'), brAboveMini: br.bottom <= mini.top + 1, thanksShown: !!th && !th.hidden && th.classList.contains('osof-on'), thanksTop: thr && Math.round(thr.top), thanksCentred: thr && Math.abs((thr.left + thr.width / 2) - vw / 2) < 6, wordsUnderThanks: words, tourBar: !!F.querySelector('.osof-tourbar:not([hidden])'), metaX402: !!document.querySelector('head meta[name="x402"]') };
  });
  ok(r.rightX > r.vw / 2 && r.leftX < r.vw / 2, `page nav{left:0;right:0} cannot move the rails (left at ${Math.round(r.leftX)}, right at ${Math.round(r.rightX)})`);
  ok(r.totemRight, 'the totem is on the right rail');
  ok(r.overlaps === 0, `no frame item sits on another (${r.overlaps} overlaps)`);
  ok(r.brAboveMini, 'the bottom-right corner (chat) lifted above the page\'s mini player');
  ok(r.thanksShown && r.thanksCentred && r.thanksTop >= 0 && r.wordsUnderThanks === false, `the thanks line shows centred at the top (y=${r.thanksTop}) with no words under it`);
  ok(r.metaX402, 'agent language: <meta name="x402"> in <head>');
  ok(r.chat, 'before the page builds its own FAB, the frame offers its chat');
  await p.waitForTimeout(3600);
  r = await p.evaluate(() => { const F = document.getElementById('oso-frames'); const th = F.querySelector('.osof-thanks'); return { thanksGone: !th || th.hidden, chat: !!F.querySelector('[data-osof-kind=chat]'), fab: !!document.getElementById('oso-fab') }; });
  ok(r.thanksGone, 'the thanks line is gone after three seconds');
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
await b.close(); srv.close();
console.log(fails ? `\n✗ ${fails} check(s) failed` : '\n✓ e2e-settings: all green');
process.exit(fails ? 1 : 0);
