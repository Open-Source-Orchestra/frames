// SPDX-License-Identifier: AGPL-3.0-or-later · Copyright (C) 2026 Shaka Lei Kaumaka / Open Source Orchestra and the AI ʻohana
// 🛡️ CHAT GUARD for Open Source Orchestra Frames (src/pieces/chat.js + the totem lines) — FAILS CLOSED.
//
// Scar, 15 Nov 2026: a guard's hub map missed chat.opensourceorchestra.org and 15 test sessions reached the REAL hub
// and woke a real agent. So here EVERY request of the browser goes through ONE route handler with an explicit decision:
//   the local test server → served · a known hub host → the in-process MOCK hub · a known fixture → fulfilled ·
//   ANYTHING ELSE → aborted and the run FAILS. A tripwire also fails the run if any hub-shaped response did not come
//   from the mock (header x-osof-mock). Nothing here can reach a real desk.
//
// The mock hub has OLD-hub semantics by default (no stale-cursor law on the hub side), so every scenario proves the
// widget fix stands on its own, exactly like /shared/bin/chat-refresh-guard.mjs. Long-polls are time-scaled
// (wait=25 → 3 s) so the whole guard runs in well under 2 minutes.
//
// usage: node tests/chat-guard.mjs [--only late,stale] [--par 8] [--v] [--headed]
// exports the harness (startServer, newContext, MockHub, …) for tests/e2e-pieces.mjs.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SCALE = 0.12;              // mock long-poll: wait=25 s → 3 s
export const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type,authorization',
  'access-control-expose-headers': 'x-osof-mock', 'content-type': 'application/json', 'cache-control': 'no-store', 'x-osof-mock': '1' };

export async function loadPlaywright() {
  try { return await import('playwright'); } catch (e) { /* fall through */ }
  const roots = [path.join(ROOT, 'node_modules') + '/', ...(process.env.NODE_PATH || '').split(':').filter(Boolean).map(p => p.replace(/\/?$/, '/')), '/usr/lib/node_modules/', '/opt/taurus-npm/playwright/node_modules/'];
  for (const r of roots) { try { return createRequire(r)('playwright'); } catch (e) { /* next */ } }
  throw new Error('playwright not found — npm i -D playwright (or set NODE_PATH)');
}

// ── the local static server (the worktree root) ──
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.mjs': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.vtt': 'text/vtt' };
export function startServer(root = ROOT) {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      let p;
      try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { rsp.writeHead(400); return rsp.end(); }
      const f = path.join(root, p.endsWith('/') ? p + 'index.html' : p);
      if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404, { 'content-type': 'text/plain' }); return rsp.end('not found'); }
      rsp.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
      if (req.method === 'HEAD') return rsp.end();
      fs.createReadStream(f).pipe(rsp);
    });
    srv.listen(0, '127.0.0.1', () => res({ srv, origin: 'http://127.0.0.1:' + srv.address().port }));
  });
}

// ── hub hosts → mock personas (role/name the LIVE hub code stores for agent replies) ──
export const HUBS = [
  { re: /^chat\.opensourceorchestra\.org$|^oso-chat\.shakaverse\.workers\.dev$/, id: 'oso', role: 'oso', name: 'OSO 🎻' },
  { re: /^ohana-chat\.shakaverse\.workers\.dev$/, id: 'ohana', role: 'ohana', name: 'ʻOHANA 🫶' },
  { re: /\.workers\.dev$/, id: 'workers', role: 'agent', name: 'desk' },                   // any other workers.dev hub
];
export function hubFor(u) {
  if (/(^|\.)myagentohana\.com$/.test(u.hostname) && /^\/api\/chat(\/|$)/.test(u.pathname)) return { id: 'myagentohana', role: 'ohana', name: 'ʻOHANA 🫶', prefix: '/api/chat' };
  for (const h of HUBS) if (h.re.test(u.hostname)) return { ...h, prefix: '' };
  return null;
}
const HUB_SHAPED = /(^|\/)(poll|send|redeem|account\/profile|agent\/[a-z]+|watch\/updates)$/;

export class MockHub {
  constructor(persona) {
    this.persona = persona; this.seq = 0; this.msgs = []; this.waiters = [];
    this.sends = []; this.polls = []; this.badParams = [];
    this.wedgeArmed = false; this.wedged = [];
    this.sendDelay = 0;        // ms before /send answers (the echo then beats the /send response)
    this.semantics = 'old';    // 'old' = no stale law on the hub · 'new' = the 15 Nov STALE-CURSOR LAW
    this.autoReply = null;     // (send) => text|null : a reply pushed after autoReplyMs
    this.autoReplyMs = 1200;
  }
  push(m) { m.seq = ++this.seq; m.ts = Date.now(); this.msgs.push(m); this.waiters.splice(0).forEach(f => f()); return m; }
  reply(session, text, extra = {}) { return this.push({ session, role: this.persona.role, name: this.persona.name, text, ...extra }); }
  of(s, after) { return this.msgs.filter(m => m.session === s && m.seq > after); }
  max(s) { let mx = 0; for (const m of this.msgs) if (m.session === s && m.seq > mx) mx = m.seq; return mx; }
  waitFor(s, after, ms) { return new Promise(res => { const t = setTimeout(res, ms); const f = () => { if (this.of(s, after).length) { clearTimeout(t); res(); } else this.waiters.push(f); }; this.waiters.push(f); }); }
  async handle(route) {
    const req = route.request();
    const u = new URL(req.url());
    const p = u.pathname.slice(this.persona.prefix.length) || '/';
    const J = (o, s = 200) => route.fulfill({ status: s, headers: CORS, body: JSON.stringify(o) }).catch(() => {});
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS, body: '' }).catch(() => {});
    if (u.searchParams.has('timeout')) this.badParams.push('timeout= on ' + p);
    if (p === '/poll' && req.method() === 'GET') {
      const s = String(u.searchParams.get('session') || '');
      let after = Number(u.searchParams.get('after') || 0);
      const wait = Math.min(Number(u.searchParams.get('wait') || 0), 25);
      this.polls.push({ at: Date.now(), session: s, after, wait });
      if (!s) return J({ error: 'session required' }, 400);
      if (wait > 0 && this.wedgeArmed) { this.wedgeArmed = false; this.wedged.push(route); return; } // a frozen fetch: never settles
      let stale = false;
      if (this.semantics === 'new' && (!(after >= 0) || after > this.seq)) { stale = true; after = this.max(s); }
      let out = this.of(s, after);
      if (!out.length && wait > 0) { await this.waitFor(s, after, wait * 1000 * SCALE); out = this.of(s, after); }
      const body = { messages: out, typing: false, member: null, now: Date.now() };
      if (this.semantics === 'new') { body.cursor = this.max(s); if (stale) body.stale = true; }
      return J(body);
    }
    if (p === '/send' && req.method() === 'POST') {
      let b = {}; try { b = JSON.parse(req.postData() || '{}'); } catch (e) {}
      const s = String(b.session || ''), text = String(b.text || '').trim();
      if (!s || !text) return J({ error: 'session and text required' }, 400);
      const m = this.push({ session: s, role: 'visitor', name: String(b.name || 'guest'), member: null, text });
      this.push({ session: s, role: this.persona.role, name: this.persona.name, text: '🌺 heard you — the mock desk is composing, one sweet moment…', holdNote: true });
      const send = { session: s, text, name: b.name, seq: m.seq, at: Date.now() };
      this.sends.push(send);
      if (this.autoReply) { const r = this.autoReply(send); if (r) setTimeout(() => this.reply(s, r), this.autoReplyMs); }
      if (this.sendDelay) await new Promise(r => setTimeout(r, this.sendDelay));
      return J({ ok: true, seq: m.seq });
    }
    if (p === '/redeem' || p === '/account/profile') return J({ ok: false, error: 'code not recognized' }, 404);
    return J({ error: 'not found' }, 404);
  }
}

// a tiny valid WAV (0.4 s of silence) — served for every mocked audio URL
export function silentWav(seconds = 0.4, rate = 8000) {
  const n = Math.round(seconds * rate), b = Buffer.alloc(44 + n);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate, 28); b.writeUInt16LE(1, 32); b.writeUInt16LE(8, 34); b.write('data', 36); b.writeUInt32LE(n, 40); b.fill(128, 44);
  return b;
}
export const PNG_1PX = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN89+9/PQAJYwPWn4H2lQAAAABJRU5ErkJggg==', 'base64');

/* newContext: a browser context whose EVERY request passes the fail-closed router.
   opts.fixtures(u, req) → {status, headers, body} | null   (served for non-hub, non-local hosts)
   opts.local(u, req)    → {status, headers, body} | null   (override a local file, e.g. a dataset variant) */
export async function newContext(browser, origin, opts = {}) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: opts.viewport || { width: 1440, height: 900 }, ...(opts.mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}), reducedMotion: opts.reducedMotion || 'no-preference' });
  const state = { hubs: new Map(), leaks: [], requests: [], errors: [], origin };
  state.hub = id => state.hubs.get(id);
  await ctx.addInitScript(({ ls }) => {
    window.__OSOF_TEST__ = true; // the dev page's in-page mock steps aside: the network-layer mock below answers instead
    try { if (ls && !sessionStorage.getItem('__osof_ls')) { for (const k in ls) localStorage.setItem(k, ls[k]); sessionStorage.setItem('__osof_ls', '1'); } } catch (e) {}
    let hidden = false; // controllable visibility for the hidden / wake scenarios
    try {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') });
    } catch (e) {}
    window.__osofSetHidden = h => { hidden = h; document.dispatchEvent(new Event('visibilitychange')); };
  }, { ls: opts.localStorage || null });
  await ctx.route('**/*', async route => {
    const req = route.request();
    let u; try { u = new URL(req.url()); } catch (e) { state.leaks.push('bad url ' + req.url()); return route.abort().catch(() => {}); }
    state.requests.push({ at: Date.now(), method: req.method(), url: u.href, type: req.resourceType() });
    if (u.origin === origin) {
      const o = opts.local && opts.local(u, req);
      if (o) return route.fulfill(o).catch(() => {});
      return route.continue().catch(() => {});
    }
    const persona = hubFor(u);
    if (persona) {
      if (!state.hubs.has(persona.id)) state.hubs.set(persona.id, new MockHub(persona));
      return state.hubs.get(persona.id).handle(route);
    }
    if (HUB_SHAPED.test(u.pathname)) { state.leaks.push('UNMAPPED hub-shaped request ' + u.href + ' (aborted)'); return route.abort('blockedbyclient').catch(() => {}); }
    const f = opts.fixtures && opts.fixtures(u, req);
    if (f) return route.fulfill(f).catch(() => {});
    state.leaks.push('UNMOCKED ' + req.method() + ' ' + u.href + ' (aborted)');
    return route.abort('blockedbyclient').catch(() => {});
  });
  ctx.on('page', page => {
    page.on('pageerror', e => state.errors.push('pageerror: ' + String(e && e.message || e).slice(0, 300)));
    page.on('console', m => { if (m.type() === 'error') { const t = m.text(); if (!/Failed to load resource|net::ERR_|status of 404/.test(t)) state.errors.push('console: ' + t.slice(0, 300)); } });
    page.on('response', r => { // TRIPWIRE: a hub-shaped answer that did not come from the mock = a real hub was reached
      try { const u = new URL(r.url()); if (/(^|\/)(poll|send|redeem)$/.test(u.pathname) && u.origin !== origin && !r.headers()['x-osof-mock']) state.leaks.push('REAL HUB ANSWERED ' + u.href); } catch (e) {}
    });
  });
  return { ctx, state };
}

// helpers shared with e2e-pieces
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function until(fn, ms = 10000, step = 150) { const end = Date.now() + ms; while (Date.now() < end) { try { if (await fn()) return true; } catch (e) {} await sleep(step); } return false; }
export const chatText = page => page.evaluate(() => { const c = document.querySelector('#oso-frames .osof-chat'); return c ? c.textContent : ''; });
export const visitorLines = (page, sel = '#oso-frames .osof-chat-log:not([hidden]) .osof-msg-v') => page.$$eval(sel, els => els.map(e => e.textContent.replace(/^You:\s*/, '')));
export async function openChat(page) { await page.click('#oso-frames .osof-fab'); await page.waitForSelector('#oso-frames .osof-chat:not([hidden])', { timeout: 5000 }); }
export async function sendLine(page, text) { await page.fill('#oso-frames .osof-chat-in', text); await page.press('#oso-frames .osof-chat-in', 'Enter'); }

// ── the scenarios ──
const OSO_KEY = 'osof:chat:chat.opensourceorchestra.org:main:';
const SCEN = {
  // no network before the drawer opens; then exactly one reconcile read + wait=25 long-polls (never timeout=)
  async quiet(page, st) {
    await page.waitForTimeout(3000);
    const before = st.requests.filter(r => !r.url.startsWith(st.origin));
    if (before.length) throw new Error('network before any click: ' + before.map(r => r.url).join(', '));
    if (await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('osof:chat:') && /:(sess|after)$/.test(k)).length)) throw new Error('chat storage written before the drawer opened');
    await openChat(page);
    await until(() => st.hub('oso') && st.hub('oso').polls.length >= 2, 8000);
    const h = st.hub('oso'); if (!h) throw new Error('drawer opened but no hub call');
    const first = h.polls[0];
    if (first.after !== 0 || first.wait !== 0) throw new Error('first call is not the reconcile read (after=0, no wait): ' + JSON.stringify(first));
    const lp = h.polls.slice(1);
    if (!lp.length || lp.some(p => p.wait !== 25)) throw new Error('long-polls must say wait=25: ' + JSON.stringify(lp));
    if (h.badParams.length) throw new Error(h.badParams.join(', '));
    const n = await page.$$eval('#oso-frames .osof-note-honest', e => e.length);
    if (n !== 1) throw new Error('the honest note must be in the drawer');
    return 'no requests before the click · reconcile then wait=25 long-polls';
  },
  // a reply that lands ≥ one full long-poll cycle after the hold note is drawn without a reload
  async late(page, st, token) {
    await openChat(page);
    await sendLine(page, 'hello from the guard · late');
    await until(() => st.hub('oso') && st.hub('oso').sends.length === 1, 6000);
    const S = st.hub('oso').sends[0].session;
    if (!await until(async () => (await chatText(page)).includes('heard you'), 6000)) throw new Error('hold note not drawn');
    await page.waitForTimeout(25 * SCALE * 1000 * 1.6);   // ~1.6 long-poll cycles pass with nothing new
    st.hub('oso').reply(S, '🌺 ' + token + ' — the late real answer');
    if (!await until(async () => (await chatText(page)).includes(token), 9000)) throw new Error('late reply never drawn');
    const desk = await page.$$eval('#oso-frames .osof-note-desk', e => e.map(x => x.textContent));
    if (!desk.some(t => t.includes('heard you'))) throw new Error('hold note must be a desk note, not an agent bubble');
    return 'late reply drawn';
  },
  // returning visitor: stored cursor 9999 + history on an OLD hub (after=9999 → [] forever) → heals, history + reply drawn
  async stale(page, st, token) {
    const h = st.hub('oso');
    await openChat(page);
    await sendLine(page, 'hello from the guard · stale');
    await until(() => h.sends.length === 1, 6000);
    await page.waitForTimeout(2500);
    h.reply(st.sess, '🌺 ' + token + ' — answer for a returning visitor');
    if (!await until(async () => (await chatText(page)).includes(token), 12000)) throw new Error('reply hidden behind the stale cursor');
    const txt = await chatText(page);
    if (!txt.includes('older visit answer') || !txt.includes('older visit question')) throw new Error('history not drawn');
    const after = await page.evaluate(k => localStorage.getItem(k), OSO_KEY + 'after');
    if (!(Number(after) < 9999)) throw new Error('stored cursor not healed: ' + after);
    if (h.sends[0].session !== st.sess) throw new Error('returning visitor got a new session');
    return 'healed to after=' + after + ' · history + reply drawn';
  },
  // the patched hub's own law (stale:true + cursor) is adopted too
  async staleNew(page, st, token) {
    const h = st.hub('oso'); h.semantics = 'new';
    await openChat(page);
    await sendLine(page, 'hello from the guard · stale (new hub)');
    await until(() => h.sends.length === 1, 6000);
    await page.waitForTimeout(2000);
    h.reply(st.sess, '🌺 ' + token + ' — answer');
    if (!await until(async () => (await chatText(page)).includes(token), 10000)) throw new Error('reply not drawn (new hub)');
    return 'ok';
  },
  // a frozen in-flight long-poll + a wake (visibilitychange) → recovers, and only one long-poll stays in flight
  async wedge(page, st, token, live) {
    await openChat(page);
    await sendLine(page, 'hello from the guard · wedge');
    const h = st.hub('oso');
    await until(() => h.sends.length === 1, 6000);
    await page.waitForTimeout(1500);
    h.wedgeArmed = true;
    if (!await until(() => !h.wedgeArmed, 8000)) throw new Error('no long-poll arrived to wedge');
    await page.waitForTimeout(1500);
    h.reply(h.sends[0].session, '🌺 ' + token + ' — answer behind a frozen fetch');
    await page.waitForTimeout(2500);
    if ((await chatText(page)).includes(token)) throw new Error('reply drawn while wedged — the wedge did not hold (test invalid)');
    await page.evaluate(() => { window.__osofSetHidden(true); });
    await page.waitForTimeout(250);
    await page.evaluate(() => { window.__osofSetHidden(false); });
    if (!await until(async () => (await chatText(page)).includes(token), 6000)) throw new Error('wake did not recover the wedged chain');
    await page.waitForTimeout(1500);
    let peak = 0; for (let i = 0; i < 8; i++) { peak = Math.max(peak, live.size); await page.waitForTimeout(250); }
    if (peak > 1) throw new Error(peak + ' long-polls in flight after the wake');
    return 'wake recovered · in flight ≤ 1';
  },
  // the same wedge with NO wake event at all: the 32 s abort timer alone must recover
  async wedgeTimer(page, st, token) {
    await openChat(page);
    await sendLine(page, 'hello from the guard · wedge timer');
    const h = st.hub('oso');
    await until(() => h.sends.length === 1, 6000);
    await page.waitForTimeout(1500);
    h.wedgeArmed = true;
    if (!await until(() => !h.wedgeArmed, 8000)) throw new Error('no long-poll arrived to wedge');
    const t0 = Date.now();
    h.reply(h.sends[0].session, '🌺 ' + token + ' — the abort timer found me');
    if (!await until(async () => (await chatText(page)).includes(token), 40000, 400)) throw new Error('32 s abort timer did not recover');
    return 'recovered by the abort timer after ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s';
  },
  // the reply lands while the tab is hidden; it is on screen when the visitor comes back
  async hidden(page, st, token) {
    await openChat(page);
    await sendLine(page, 'hello from the guard · hidden');
    const h = st.hub('oso');
    await until(() => h.sends.length === 1, 6000);
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.__osofSetHidden(true));
    await page.waitForTimeout(1500);
    h.reply(h.sends[0].session, '🌺 ' + token + ' — answer while the tab slept');
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.__osofSetHidden(false));
    if (!await until(async () => (await chatText(page)).includes(token), 8000)) throw new Error('reply not drawn after the tab woke');
    return 'ok';
  },
  // 6 wake storms (focus + visibilitychange + online + pageshow) → never more than one long-poll in flight
  async chains(page, st, token, live, peakRef) {
    await openChat(page);
    await sendLine(page, 'hello from the guard · chains');
    const h = st.hub('oso');
    await until(() => h.sends.length === 1, 6000);
    await page.waitForTimeout(1200);
    for (let i = 0; i < 6; i++) {
      await page.evaluate(() => { window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('online')); window.dispatchEvent(new Event('pageshow')); });
      await page.waitForTimeout(700);
    }
    await page.waitForTimeout(2500);
    let peak = 0; for (let k = 0; k < 16; k++) { peak = Math.max(peak, live.size); await page.waitForTimeout(250); }
    h.reply(h.sends[0].session, '🌺 ' + token + ' — after the wake storm');
    if (!await until(async () => (await chatText(page)).includes(token), 8000)) throw new Error('reply not drawn after the wake storm');
    if (peak > 1) throw new Error('runaway poll chains: ' + peak + ' long-polls in flight');
    return 'steady in flight = ' + peak + ' · storm peak (browser view) = ' + peakRef.max;
  },
  // the pill's OSO line and totem faces: separate hubs, sessions, cursors and keys; the face prefix goes out, never comes back on screen
  async twoLines(page, st, token) {
    await openChat(page);
    await sendLine(page, 'hello oso');
    await until(() => st.hub('oso') && st.hub('oso').sends.length === 1, 6000);
    const chip = page.locator('#oso-frames .osof-chip[title="SHAKA"]');
    await chip.click();
    await sendLine(page, 'hello shaka');
    await until(() => st.hub('ohana') && st.hub('ohana').sends.length === 1, 6000);
    await page.click('#oso-frames .osof-chat-x');
    await page.click('#oso-frames .osof-tt-face[data-face="kala"]');
    await page.waitForSelector('#oso-frames .osof-chat:not([hidden])');
    await sendLine(page, 'hello kala');
    await until(() => st.hub('ohana').sends.length === 2, 6000);
    const oso = st.hub('oso').sends, oh = st.hub('ohana').sends;
    if (oso[0].text !== 'hello oso') throw new Error('OSO line text altered: ' + oso[0].text);
    if (oh[0].text !== '🗿[face:shaka] hello shaka') throw new Error('SHAKA line must carry the face prefix: ' + oh[0].text);
    if (oh[1].text !== '🗿[face:kala] hello kala') throw new Error('KALA line must carry the face prefix: ' + oh[1].text);
    const sessions = new Set([oso[0].session, oh[0].session, oh[1].session]);
    if (sessions.size !== 3) throw new Error('lines share a session');
    st.hub('ohana').reply(oh[0].session, '🤙 ' + token + '-SHAKA');
    st.hub('ohana').reply(oh[1].session, '🪕 ' + token + '-KALA');
    st.hub('oso').reply(oso[0].session, '🎻 ' + token + '-OSO');
    if (!await until(async () => (await chatText(page)).includes(token + '-KALA'), 8000)) throw new Error('KALA reply not drawn');
    const logs = await page.$$eval('#oso-frames .osof-chat-log', els => els.map(e => ({ label: e.getAttribute('aria-label'), text: e.textContent })));
    const byName = n => logs.find(l => l.label === 'Conversation with ' + n) || { text: '' };
    if (byName('KALA').text.includes('hello shaka') || byName('KALA').text.includes(token + '-SHAKA')) throw new Error('KALA log shows SHAKA traffic');
    if (byName('KALA').text.includes('🗿[face:')) throw new Error('face prefix drawn on screen');
    // switch back: SHAKA's reply (it arrived while SHAKA was not the active line) is caught up on activation
    await page.click('#oso-frames .osof-chip[title="SHAKA"]');
    if (!await until(async () => (await page.$eval('#oso-frames .osof-chat-log:not([hidden])', e => e.textContent)).includes(token + '-SHAKA'), 8000)) throw new Error('SHAKA reply not caught up after switching back');
    const shakaLines = await visitorLines(page);
    if (shakaLines.filter(t => t === 'hello shaka').length !== 1) throw new Error('SHAKA visitor line drawn ' + shakaLines.filter(t => t === 'hello shaka').length + '×');
    const keys = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith('osof:chat:')).map(k => [k, localStorage.getItem(k)])));
    const want = [OSO_KEY + 'sess', 'osof:chat:ohana-chat.shakaverse.workers.dev:shaka:sess', 'osof:chat:ohana-chat.shakaverse.workers.dev:kala:sess'];
    for (const k of want) if (!keys[k]) throw new Error('missing key ' + k + ' in ' + JSON.stringify(Object.keys(keys)));
    const vals = want.map(k => keys[k]);
    if (new Set(vals).size !== 3) throw new Error('two lines share a stored session');
    return '3 lines · 3 sessions · keys ' + want.map(k => k.replace('osof:chat:', '')).join(' | ');
  },
  // the echo law: the hub's echo beats the /send answer — still drawn once; two identical lines are two lines
  async echo(page, st) {
    await openChat(page);
    const h = st.hub('oso'); h.sendDelay = 1500;
    await sendLine(page, 'same words twice');
    await until(() => h.sends.length === 1, 6000);
    await page.waitForTimeout(2600);
    await sendLine(page, 'same words twice');
    await until(() => h.sends.length === 2, 6000);
    await page.waitForTimeout(2600);
    const lines = await visitorLines(page);
    const n = lines.filter(t => t === 'same words twice').length;
    if (n !== 2) throw new Error('expected 2 visitor bubbles, saw ' + n + ': ' + JSON.stringify(lines));
    return 'each line drawn once (echo beat the /send answer)';
  },
  // hub text is TEXT: markup stays text, only http(s) becomes a link
  async xss(page, st) {
    await openChat(page);
    await sendLine(page, 'hello · xss');
    const h = st.hub('oso');
    await until(() => h.sends.length === 1, 6000);
    h.reply(h.sends[0].session, 'try <img src=x onerror="window.__pwned=1"> and [bad](javascript:alert(1)) and **bold** https://example.org/a).');
    await until(async () => (await chatText(page)).includes('onerror'), 8000);
    const r = await page.evaluate(() => {
      const log = document.querySelector('#oso-frames .osof-chat-log:not([hidden])');
      return { imgs: log.querySelectorAll('img').length, links: [...log.querySelectorAll('a')].map(a => a.href), bold: log.querySelectorAll('strong').length, pwned: !!window.__pwned };
    });
    if (r.imgs || r.pwned) throw new Error('markup was parsed as HTML');
    if (r.links.length !== 1 || r.links[0] !== 'https://example.org/a') throw new Error('links: ' + JSON.stringify(r.links));
    if (r.bold !== 1) throw new Error('bold not rendered as text node');
    return 'text only · 1 https link · javascript: refused';
  },
  // a totem whose hub is myagentohana.com/api/chat (a path-prefixed hub): URLs + keys stay per hub path
  async apiChat(page, st, token) {
    await page.click('#oso-frames .osof-tt-face[data-face="oso"]');
    await page.waitForSelector('#oso-frames .osof-chat:not([hidden])');
    await sendLine(page, 'hello totem oso');
    const h = await until(() => st.hub('myagentohana') && st.hub('myagentohana').sends.length === 1, 6000);
    if (!h) throw new Error('nothing reached myagentohana.com/api/chat/send');
    const s = st.hub('myagentohana').sends[0];
    if (s.text !== '🗿[face:oso] hello totem oso') throw new Error('prefix: ' + s.text);
    st.hub('myagentohana').reply(s.session, '🎻 ' + token);
    if (!await until(async () => (await chatText(page)).includes(token), 8000)) throw new Error('reply not drawn');
    const keys = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('osof:chat:')));
    if (!keys.includes('osof:chat:myagentohana.com/api/chat:oso:sess')) throw new Error('keys: ' + JSON.stringify(keys));
    return 'path hub ok · key osof:chat:myagentohana.com/api/chat:oso:*';
  },
};

const CASES = [
  { name: 'quiet', fn: 'quiet' }, { name: 'late', fn: 'late' }, { name: 'stale', fn: 'stale', stale: true }, { name: 'stale-new-hub', fn: 'staleNew', stale: true },
  { name: 'wedge', fn: 'wedge' }, { name: 'wedge-timer', fn: 'wedgeTimer' }, { name: 'hidden', fn: 'hidden' }, { name: 'chains', fn: 'chains' },
  { name: 'two-lines', fn: 'twoLines' }, { name: 'echo', fn: 'echo' }, { name: 'xss', fn: 'xss' }, { name: 'api-chat-hub', fn: 'apiChat', apiChat: true },
  { name: 'late @390×844', fn: 'late', mobile: true }, { name: 'stale @390×844', fn: 'stale', stale: true, mobile: true }, { name: 'wedge @390×844', fn: 'wedge', mobile: true },
];

async function runCase(browser, origin, c, verbose) {
  const token = 'MOCKREPLY-' + c.fn.toUpperCase() + '-' + Math.random().toString(36).slice(2, 7);
  const sess = 'osof-guard-' + c.fn + '-' + Math.random().toString(36).slice(2, 8);
  const ls = c.stale ? { [OSO_KEY + 'sess']: JSON.stringify(sess), [OSO_KEY + 'after']: '9999' } : null;
  const html = c.apiChat ? fs.readFileSync(path.join(ROOT, 'tests/pieces.html'), 'utf8').replace('"hub": "https://ohana-chat.shakaverse.workers.dev"', '"hub": "https://myagentohana.com/api/chat"') : null;
  const { ctx, state } = await newContext(browser, origin, {
    viewport: c.mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, mobile: !!c.mobile, localStorage: ls,
    local: html ? (u => (u.pathname === '/tests/pieces.html' ? { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' }, body: html } : null)) : null,
  });
  state.sess = sess;
  if (c.stale) { // the hub already holds this returning visitor's earlier visit
    const h = new MockHub(hubFor(new URL('https://chat.opensourceorchestra.org/poll')));
    h.push({ session: sess, role: 'visitor', name: 'guest', text: 'older visit question' });
    h.reply(sess, 'older visit answer');
    for (let i = 0; i < 3; i++) h.push({ session: 'someone-else', role: 'visitor', text: 'another visitor' });
    state.hubs.set('oso', h);
  }
  const page = await ctx.newPage();
  const live = new Set(); const peakRef = { max: 0 };
  const isLP = r => { try { const u = new URL(r.url()); return !!hubFor(u) && /\/poll$/.test(u.pathname) && Number(u.searchParams.get('wait') || 0) > 0; } catch (e) { return false; } };
  page.on('request', r => { if (isLP(r)) { live.add(r); peakRef.max = Math.max(peakRef.max, live.size); } });
  page.on('requestfinished', r => live.delete(r));
  page.on('requestfailed', r => live.delete(r));
  const res = { name: c.name, pass: false };
  const t0 = Date.now();
  try {
    await page.goto(origin + '/tests/pieces.html', { waitUntil: 'load' });
    await page.waitForSelector('#oso-frames .osof-fab', { timeout: 8000 });
    res.note = await SCEN[c.fn](page, state, token, live, peakRef);
    res.pass = true;
  } catch (e) { res.error = String(e && e.message || e).slice(0, 400); }
  res.secs = ((Date.now() - t0) / 1000).toFixed(1);
  for (const h of state.hubs.values()) if (h.badParams.length) { res.pass = false; res.error = (res.error || '') + ' · ' + h.badParams.join(', '); }
  if (state.leaks.length) { res.pass = false; res.error = (res.error ? res.error + ' · ' : '') + 'FAIL-CLOSED: ' + [...new Set(state.leaks)].slice(0, 4).join(' | '); }
  if (state.errors.length) { res.pass = false; res.error = (res.error ? res.error + ' · ' : '') + [...new Set(state.errors)].slice(0, 3).join(' | '); }
  if (verbose) res.polls = Object.fromEntries([...state.hubs].map(([k, h]) => [k, h.polls.map(p => p.after + '/' + p.wait).join(' ')]));
  await ctx.close().catch(() => {});
  return res;
}

async function main() {
  const argv = process.argv.slice(2);
  const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
  const only = opt('--only', null), par = Number(opt('--par', 8)), verbose = argv.includes('--v');
  const { chromium } = await loadPlaywright();
  const { srv, origin } = await startServer();
  const browser = await chromium.launch({ headless: !argv.includes('--headed') });
  const list = CASES.filter(c => !only || only.split(',').some(o => c.name === o || c.fn === o || c.name.startsWith(o + ' ')));
  const t0 = Date.now(); const out = []; let i = 0;
  const worker = async () => { while (i < list.length) { const c = list[i++]; const r = await runCase(browser, origin, c, verbose); out.push(r);
    console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name.padEnd(18) + String(r.secs).padStart(5) + ' s  ' + (r.pass ? (r.note || '') : r.error) + (verbose && r.polls ? '  polls ' + JSON.stringify(r.polls) : '')); } };
  await Promise.all(Array.from({ length: Math.min(par, list.length) }, worker));
  await browser.close(); srv.close();
  const fails = out.filter(r => !r.pass);
  console.log('\n' + (fails.length ? '❌ ' + fails.length + ' FAIL' : '✅ ALL PASS') + ' — ' + out.length + ' chat scenarios in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s · mock hubs only, fail-closed');
  process.exit(fails.length ? 1 : 0);
}
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main().catch(e => { console.error(e); process.exit(2); });
