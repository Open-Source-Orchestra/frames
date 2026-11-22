/* ───────────────────────────── piece: chat ─────────────────────────────
 * Open Source Orchestra Frames · src/pieces/chat.js
 * SPDX-License-Identifier: AGPL-3.0-or-later · Copyright (C) 2026 Shaka Lei Kaumaka / Open Source Orchestra and the AI ʻohana
 *
 * The gold "Talk to OSO" pill (bottom-right) + ONE chat drawer shared by every line: the pill's own line and every
 * face of the totem. Client of the pit-chat-protocol (POST {hub}/send · GET {hub}/poll?session&after&wait=25) with
 * every chat law of 15 Nov 2026 (Shaka: "you have to hit refresh to see the response of the agent"):
 *   1 per-hub + per-face storage keys  osof:chat:<hub host+path>:<face|main>:sess|after   (never shared across hubs)
 *   2 STALE-CURSOR  reconcile() once per load per line (after=0 read, pull a cursor that is ahead back) + heal({stale,cursor})
 *   3 WAKE LAW      32 s abort timer · visibilitychange/focus/pageshow/online → kick() · 45 s heartbeat (while open)
 *   4 SINGLE-FLIGHT exactly one poll chain for the whole drawer; a wake only aborts the in-flight request, the chain re-arms
 *   5 wait=25 (never `timeout`) · ECHO LAW: each visitor line drawn once (local echo; the hub echo is matched by seq/text)
 *   6 nothing connects until the drawer opens · honest note: machines, answers from Taurus, may take a moment, may be reviewed
 *   7 hub text is TEXT (DOM text nodes only; http(s) links and **bold** become elements, never HTML)
 * Totem lines carry the face in a text prefix "🗿[face:<k>] " (the hub routes by it); the prefix is stripped on echo. */
{
  const CHAT_ABORT_MS = 32000;   // wake law: a long-poll that has not settled after 32 s is aborted
  const CHAT_BEAT_MS = 15000;    // heartbeat tick while the drawer is open
  const CHAT_DEAD_MS = 45000;    // …restarts the chain when nothing was heard for 45 s
  const CHAT_WAIT_S = 25;        // long-poll law: hubs read `wait`, never `timeout`
  const CHAT_HISTORY = 40;       // how much of a returning visitor's conversation is drawn again
  const CHAT_MAX = 1800;         // hubs keep 2000 chars; leave room for the face prefix
  const CHAT_FACE_RE = /^\s*🗿\[face:[a-z0-9_-]{1,24}\]\s*/i;
  const CHAT_DEFAULT_FACES = [   // SPEC §8 totem faces (used when a totem item carries no faces of its own)
    { k: 'shaka', n: 'SHAKA', e: '🤙', c: '#ffb443' }, { k: 'oso', n: 'OSO', e: '🎻', c: '#ff7eb6' },
    { k: 'deva', n: 'DEVA', e: '🦄', c: '#c792ea' }, { k: 'crops', n: 'CROPS', e: '🌿', c: '#2f9e6f' },
    { k: 'kala', n: 'KALA', e: '🪕', c: '#f7d794' }, { k: 'oke', n: 'OKE', e: '💙', c: '#4fc3f7' }
  ];
  const chatShared = { engine: null };

  const CHAT_CSS = '' +
    /* the pill */
    '#oso-frames .osof-chatwrap{position:relative;order:1;display:flex;justify-content:flex-end;align-items:center;pointer-events:auto}' +
    '#oso-frames .osof-fab{position:relative;display:inline-flex;align-items:center;gap:8px;height:44px;margin:0;padding:0 20px 0 13px;border:0;border-radius:999px;' +
      'background:linear-gradient(135deg,#f3d58f 0%,#dcae4c 48%,#c9962e 100%);color:#241a05;font:700 15px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;letter-spacing:.01em;' +
      'cursor:pointer;box-shadow:0 6px 22px rgba(201,150,46,.42),inset 0 1px 0 rgba(255,255,255,.5),inset 0 -2px 0 rgba(120,80,10,.25);transition:transform .18s ease,box-shadow .18s ease;-webkit-tap-highlight-color:transparent}' +
    '#oso-frames .osof-fab:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(201,150,46,.55),inset 0 1px 0 rgba(255,255,255,.5),inset 0 -2px 0 rgba(120,80,10,.25)}' +
    '#oso-frames .osof-fab:focus-visible,#oso-frames .osof-fab-x:focus-visible,#oso-frames .osof-fab-mini:focus-visible{outline:3px solid #fff3d6;outline-offset:2px}' +
    '#oso-frames .osof-fab-e{font-size:21px;line-height:1}' +
    '#oso-frames .osof-fab-dot{position:absolute;top:6px;right:9px;width:9px;height:9px;border-radius:50%;background:#16a34a;border:2px solid #fff3d6}' +
    '#oso-frames .osof-fab-note{position:absolute;left:14px;top:4px;font-size:13px;color:#fff3d6;text-shadow:0 1px 2px rgba(60,40,0,.6);opacity:0;pointer-events:none}' +
    '#oso-frames .osof-fab-x{position:absolute;top:-10px;left:-10px;z-index:1;width:24px;height:24px;padding:0;border-radius:50%;border:1px solid rgba(255,243,214,.75);' +
      'background:#2a1740;color:#ffe9b8;font:600 11px/1 system-ui,sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,.45)}' +
    '#oso-frames .osof-fab-x:hover{background:#3d1c52}' +
    '#oso-frames .osof-fab-mini{width:40px;height:40px;padding:0;border-radius:50%;border:1px solid rgba(255,255,255,.4);background:linear-gradient(135deg,#f3d58f,#c9962e);' +
      'color:#241a05;font-size:19px;line-height:1;cursor:pointer;box-shadow:0 4px 14px rgba(201,150,46,.45)}' +
    '#oso-frames .osof-chatwrap[data-mini="1"] .osof-fab,#oso-frames .osof-chatwrap[data-mini="1"] .osof-fab-x{display:none}' +
    '#oso-frames .osof-chatwrap:not([data-mini="1"]) .osof-fab-mini{display:none}' +
    '#oso-frames .osof-chatwrap.osof-is-open{visibility:hidden}' +
    /* one-time entrance (ONE-TIME LAW: only when ctx.once said so; the class is removed when it ends) */
    '#oso-frames .osof-chatwrap.osof-intro .osof-fab{animation:osof-fab-in .6s cubic-bezier(.2,.9,.3,1.3) both}' +
    '#oso-frames .osof-chatwrap.osof-intro .osof-fab-note{animation:osof-fab-note 1.6s ease-out .55s 1 both}' +
    '#oso-frames .osof-chatwrap.osof-intro .osof-fab-note.n2{left:24px;animation-delay:.95s}' +
    '@keyframes osof-fab-in{from{opacity:0;transform:translateY(14px) scale(.92)}to{opacity:1;transform:none}}' +
    '@keyframes osof-fab-note{0%{opacity:0;transform:translateY(4px)}25%{opacity:1}100%{opacity:0;transform:translate(8px,-26px) rotate(14deg)}}' +
    /* the drawer */
    '#oso-frames .osof-chat{position:fixed;right:calc(10px + env(safe-area-inset-right));bottom:var(--osof-chat-b,64px);z-index:2147481900;width:min(388px,calc(100vw - 20px));' +
      'height:min(580px,calc(100vh - var(--osof-chat-b,64px) - 18px));display:flex;flex-direction:column;overflow:hidden;background:#161226;color:#ece7f6;' +
      'border:1px solid #3a2f60;border-radius:18px;box-shadow:0 22px 64px rgba(0,0,0,.55),0 0 0 1px rgba(232,196,118,.08);font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:left}' +
    '#oso-frames .osof-chat[hidden]{display:none}' +
    '#oso-frames .osof-chat-head{display:flex;align-items:center;gap:11px;padding:12px 12px 11px 14px;background:linear-gradient(180deg,#231b40,#1e1836);border-bottom:1px solid #322a52}' +
    '#oso-frames .osof-chat-av{flex:none;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;line-height:1;background:#120e20;box-shadow:0 0 0 2px var(--c,#e8c476),0 0 14px -2px var(--c,#e8c476)}' +
    '#oso-frames .osof-chat-id{min-width:0;flex:1}' +
    '#oso-frames .osof-chat-name{margin:0;font:700 16px/1.2 Georgia,"Times New Roman",serif;color:#f6e3b4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#oso-frames .osof-chat-sub{display:flex;align-items:center;gap:6px;margin-top:3px;font-size:12px;line-height:1.3;color:#b9aed6}' +
    '#oso-frames .osof-chat-sub::before{content:"";flex:none;width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px #22c55e}' +
    '#oso-frames .osof-chat-x{flex:none;width:34px;height:34px;padding:0;border-radius:50%;border:1px solid #3a2f60;background:#161226;color:#ece7f6;font-size:15px;line-height:1;cursor:pointer}' +
    '#oso-frames .osof-chat-x:hover{background:#231c3d}' +
    '#oso-frames .osof-chat button:focus-visible,#oso-frames .osof-chat a:focus-visible{outline:2px solid #e8c476;outline-offset:2px}' +
    '#oso-frames .osof-chat-chips{display:flex;align-items:center;gap:6px;padding:8px 12px;background:#1a1530;border-bottom:1px solid #2a2346;overflow-x:auto;scrollbar-width:none}' +
    '#oso-frames .osof-chat-chips::-webkit-scrollbar{display:none}' +
    '#oso-frames .osof-chat-chips[hidden]{display:none}' +
    '#oso-frames .osof-chip{flex:none;display:inline-flex;align-items:center;justify-content:center;gap:5px;height:32px;min-width:32px;padding:0 8px;border-radius:999px;border:1px solid #3a2f60;' +
      'background:#120e20;color:#ece7f6;font:700 11px/1 system-ui,sans-serif;letter-spacing:.05em;cursor:pointer;transition:background .15s ease,border-color .15s ease}' +
    '#oso-frames .osof-chip-e{font-size:16px;letter-spacing:0}' +
    '#oso-frames .osof-chip:hover{background:#1f1838;border-color:var(--c,#e8c476)}' +
    '#oso-frames .osof-chip[aria-pressed="true"]{border-color:var(--c,#e8c476);background:#2a2148;box-shadow:inset 0 0 0 1px var(--c,#e8c476),0 0 10px -3px var(--c,#e8c476)}' +
    '#oso-frames .osof-chip-sep{flex:none;align-self:stretch;width:1px;margin:4px 3px;background:#3a2f60}' +
    '#oso-frames .osof-chip-lab{flex:none;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#a99fc8;margin-right:2px}' +
    '#oso-frames .osof-chat-logs{flex:1;min-height:0;display:flex;flex-direction:column;background:radial-gradient(120% 70% at 100% 0%,rgba(232,196,118,.06),transparent 60%),#161226}' +
    '#oso-frames .osof-chat-log{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:14px 14px 10px;display:flex;flex-direction:column;gap:9px}' +
    '#oso-frames .osof-chat-log[hidden]{display:none}' +
    '#oso-frames .osof-msg{max-width:86%;padding:9px 12px;border-radius:15px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;line-height:1.48}' +
    '#oso-frames .osof-msg-v{align-self:flex-end;background:linear-gradient(135deg,#e2b456,#cf9d38);color:#161226;border-bottom-right-radius:5px;font-weight:550}' +
    '#oso-frames .osof-msg-a{align-self:flex-start;background:#211b3b;border:1px solid #352c5c;border-bottom-left-radius:5px}' +
    '#oso-frames .osof-msg-failed{opacity:.6;border:1px dashed #8a3b4f}' +
    '#oso-frames .osof-msg-who{display:block;margin-bottom:3px;font-size:11.5px;font-weight:700;letter-spacing:.05em;color:var(--c,#e8c476)}' +
    '#oso-frames .osof-msg a{color:#f1cf7e;text-decoration:underline;text-underline-offset:2px}' +
    '#oso-frames .osof-msg-v a{color:#161226}' +
    '#oso-frames .osof-msg strong{font-weight:750}' +
    '#oso-frames .osof-note{align-self:center;max-width:94%;text-align:center;font-size:12px;line-height:1.45;color:#c4b9de;white-space:pre-wrap;overflow-wrap:anywhere}' +
    '#oso-frames .osof-note a{color:#f1cf7e}' +
    '#oso-frames .osof-note-honest{padding:8px 11px;border-radius:11px;background:#1b1631;border:1px dashed #43386e}' +
    '#oso-frames .osof-note-desk{padding:6px 10px;border-radius:10px;background:#1b1631}' +
    '#oso-frames .osof-note-tag{display:inline-block;margin-right:6px;padding:1px 7px;border-radius:999px;border:1px solid #43386e;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#b9aed6}' +
    '#oso-frames .osof-divider{align-self:stretch;display:flex;align-items:center;gap:8px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#a99fc8}' +
    '#oso-frames .osof-divider::before,#oso-frames .osof-divider::after{content:"";flex:1;height:1px;background:#2f2750}' +
    '#oso-frames .osof-typing{align-self:flex-start;display:inline-flex;gap:5px;padding:11px 13px;border-radius:15px;border-bottom-left-radius:5px;background:#211b3b;border:1px solid #352c5c}' +
    '#oso-frames .osof-typing[hidden]{display:none}' +
    '#oso-frames .osof-typing i{width:6px;height:6px;border-radius:50%;background:#c4b9de;opacity:.35;animation:osof-typing 1.2s ease-in-out infinite}' +
    '#oso-frames .osof-typing i:nth-child(2){animation-delay:.18s}#oso-frames .osof-typing i:nth-child(3){animation-delay:.36s}' +
    '@keyframes osof-typing{0%,60%,100%{opacity:.3;transform:none}30%{opacity:1;transform:translateY(-2px)}}' +
    '#oso-frames .osof-chat-form{display:flex;align-items:flex-end;gap:8px;margin:0;padding:10px 12px calc(10px + env(safe-area-inset-bottom));border-top:1px solid #322a52;background:#1e1836}' +
    '#oso-frames .osof-chat-in{flex:1;min-width:0;height:42px;min-height:42px;max-height:124px;margin:0;resize:none;border-radius:12px;border:1px solid #3a2f60;background:#161226;color:#ece7f6;' +
      'padding:10px 12px;font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
    '#oso-frames .osof-chat-in::placeholder{color:#9f95c0;opacity:1}' +
    '#oso-frames .osof-chat-in:focus{outline:2px solid #e8c476;outline-offset:0;border-color:transparent}' +
    '#oso-frames .osof-chat-send{flex:none;height:42px;padding:0 16px;border-radius:12px;border:0;background:#e8c476;color:#161226;font:800 14px/1 system-ui,sans-serif;cursor:pointer}' +
    '#oso-frames .osof-chat-send:hover:not(:disabled){background:#f3d58f}' +
    '#oso-frames .osof-chat-send:disabled{opacity:.45;cursor:default}' +
    '#oso-frames .osof-sr{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}' +
    '@media (max-width:720px){' +
      '#oso-frames .osof-chat{left:calc(8px + env(safe-area-inset-left));right:calc(8px + env(safe-area-inset-right));top:calc(8px + env(safe-area-inset-top));width:auto;height:auto;border-radius:16px}' +
      '#oso-frames .osof-chat-in{font-size:16px}' +
      '#oso-frames .osof-fab{height:42px;font-size:14px;padding:0 17px 0 12px}' +
    '}' +
    '@media (prefers-reduced-motion:reduce){#oso-frames .osof-typing i{animation:none;opacity:.8}#oso-frames .osof-fab{transition:none}}';

  /* ── the engine: ONE drawer, many lines, one poll chain ───────────────────────────────────────────── */
  const makeEngine = function (ctx, h, T, fill) {
    'use strict';
    const store = ctx.store('chat');
    const lines = [];
    const D = { el: null, open: false, active: null, opener: null, wrap: null, fab: null, wraps: [], beatT: 0, listening: false };

    const hubBase = function (hub) { return String(hub || '').replace(/\/+$/, ''); };
    const hubKey = function (hub) {
      try { const u = new URL(hub, location.href); return (u.host + u.pathname.replace(/\/+$/, '')).toLowerCase(); }
      catch (e) { return String(hub || 'hub').toLowerCase(); }
    };
    const newSess = function () {
      let id = '';
      try { if (window.crypto && crypto.randomUUID) id = crypto.randomUUID(); } catch (e) {}
      if (!id) id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 8);
      return ('osof-' + id).slice(0, 64);
    };
    const facePrefix = function (k) { return /^[a-z0-9_-]{1,24}$/i.test(k) ? '🗿[face:' + k + '] ' : ''; };

    const line = function (def, isMain) {
      const id = hubKey(def.hub) + '|' + (def.face || 'main');
      for (let i = 0; i < lines.length; i++) if (lines[i].id === id) return lines[i];
      const L = {
        id: id, def: def, main: !!isMain, key: hubKey(def.hub) + ':' + (def.face || 'main'), base: hubBase(def.hub),
        sess: null, after: 0, seen: new Set(), mine: new Set(), pending: [],
        reconciled: false, running: false, ctl: null, ctlAt: 0, lastBeat: 0, fails: 0, napWake: null,
        waiting: false, waitT: 0, hubTyping: false, log: null, greetEl: null, typingEl: null, chip: null
      };
      lines.push(L);
      if (D.el) renderChips();
      return L;
    };
    const lineFor = function (spec) {
      if (!spec || !spec.hub) return lines[0];
      return line({ hub: spec.hub, face: spec.face || null, name: spec.name || 'ʻohana', emoji: spec.emoji || '🫶', color: spec.color || '#e8c476',
        greeting: spec.greeting || null, storage: spec.storage || 'totem', route: spec.route || (spec.face ? 'prefix' : null), sub: spec.sub || null });
    };

    /* storage: osof:chat:<hub host+path>:<face|main>:sess|after — only created when a line is first opened */
    const ensureSess = function (L) {
      if (L.sess) return;
      let s = store.get(L.key + ':sess');
      if (typeof s !== 'string' || !/^[\w.:-]{6,64}$/.test(s)) { s = newSess(); store.set(L.key + ':sess', s); }
      L.sess = s;
      const a = store.get(L.key + ':after');
      L.after = (typeof a === 'number' && isFinite(a) && a >= 0) ? Math.floor(a) : 0;
    };
    const saveAfter = function (L) { store.set(L.key + ':after', L.after); };
    const pollUrl = function (L, wait) {
      return L.base + '/poll?session=' + encodeURIComponent(L.sess) + '&after=' + (wait ? L.after : 0) + (wait ? '&wait=' + CHAT_WAIT_S : '');
    };

    /* ── text: TEXT only. http(s) links (bare or [label](url)) and **bold** become DOM nodes; nothing is parsed as HTML */
    const LINK_RE = /\[([^\]\n]{1,160})\]\((https?:\/\/[^\s()<>]{1,2000})\)|(https?:\/\/[^\s<>"'`]{2,2000})/g;
    const safeUrl = function (u) { try { const x = new URL(u); return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : null; } catch (e) { return null; } };
    const shortUrl = function (u) {
      try { const x = new URL(u); let s = x.host + (x.pathname === '/' ? '' : x.pathname); return s.length > 52 ? s.slice(0, 50) + '…' : s; } catch (e) { return u; }
    };
    const pushText = function (parent, s) {
      if (!s) return;
      const re = /\*\*([^*\n]{1,240})\*\*/g; let last = 0, m;
      while ((m = re.exec(s))) {
        if (m.index > last) parent.appendChild(document.createTextNode(s.slice(last, m.index)));
        parent.appendChild(h('strong', {}, m[1]));
        last = m.index + m[0].length;
      }
      if (last < s.length) parent.appendChild(document.createTextNode(s.slice(last)));
    };
    const richText = function (parent, text) {
      const s = String(text == null ? '' : text); let last = 0, m;
      LINK_RE.lastIndex = 0;
      while ((m = LINK_RE.exec(s))) {
        let url = m[2] || m[3]; const lab = m[1] || null; let trail = '';
        if (!lab) { const tm = url.match(/[.,!?;:)\]}'"…]+$/); if (tm) { trail = tm[0]; url = url.slice(0, url.length - trail.length); } }
        pushText(parent, s.slice(last, m.index));
        const safe = safeUrl(url);
        if (safe) parent.appendChild(h('a', { href: safe, target: '_blank', rel: 'noopener noreferrer nofollow' }, lab || shortUrl(safe)));
        else pushText(parent, lab ? m[0] : url);
        pushText(parent, trail);
        last = m.index + m[0].length;
      }
      pushText(parent, s.slice(last));
    };

    /* ── drawing ── */
    const nearBottom = function (el) { return el.scrollHeight - el.scrollTop - el.clientHeight < 80; };
    const place = function (L, node, before) {
      const log = L.log; const stick = nearBottom(log);
      if (before && before.parentNode === log) log.insertBefore(node, before);
      else if (L.typingEl && L.typingEl.parentNode === log) log.insertBefore(node, L.typingEl);
      else log.appendChild(node);
      if (stick || !before) log.scrollTop = log.scrollHeight;
      return node;
    };
    const bubble = function (L, kind, text, before) {
      const el = h('div', { class: 'osof-msg osof-msg-' + kind });
      if (kind === 'a') el.appendChild(h('span', { class: 'osof-msg-who', 'aria-hidden': 'true' }, L.def.name + ' ' + L.def.emoji));
      if (kind === 'a') el.appendChild(h('span', { class: 'osof-sr' }, L.def.name + ': '));
      if (kind === 'v') el.appendChild(h('span', { class: 'osof-sr' }, T('you', 'You') + ': '));
      richText(el, text);
      return place(L, el, before);
    };
    const note = function (L, text, kind, before) {
      const el = h('div', { class: 'osof-note' + (kind ? ' osof-note-' + kind : '') });
      if (kind === 'desk') el.appendChild(h('span', { class: 'osof-note-tag' }, T('deskTag', 'desk note')));
      richText(el, text);
      return place(L, el, before);
    };
    const setTyping = function (L) {
      if (!L.typingEl) return;
      const on = !!(L.waiting || L.hubTyping);
      if (on === !L.typingEl.hidden) return;
      L.typingEl.hidden = !on;
      if (on) { L.log.appendChild(L.typingEl); L.log.scrollTop = L.log.scrollHeight; }
    };
    const stopWaiting = function (L) { L.waiting = false; clearTimeout(L.waitT); setTyping(L); };

    /* one message from the hub (or the history read). Visitor lines are drawn ONCE (echo law). */
    const render = function (L, m, history, before) {
      if (!m || typeof m.seq !== 'number' || !isFinite(m.seq)) return;
      if (L.seen.has(m.seq)) return;
      L.seen.add(m.seq);
      if (m.seq > L.after) { L.after = m.seq; saveAfter(L); }
      const raw = String(m.text == null ? '' : m.text);
      if (m.role === 'visitor') {
        const text = raw.replace(CHAT_FACE_RE, '');
        if (L.mine.has(m.seq)) return;                                   // our own line, already drawn locally
        for (let i = 0; i < L.pending.length; i++) {                     // the hub echo can beat the /send response
          const p = L.pending[i];
          if (p.seq === null && p.text === text) { p.seq = m.seq; L.mine.add(m.seq); return; }
        }
        bubble(L, 'v', text, before);                                    // another tab, or the conversation's history
        return;
      }
      if (m.role === 'system') { note(L, raw, null, before); return; }
      if (m.holdNote || m.sleepNote || m.throttleNote) {                 // automatic hub notes never pose as the agent
        if (history) return;
        note(L, raw, 'desk', before);
        if (m.sleepNote || m.throttleNote) stopWaiting(L);
        return;
      }
      bubble(L, 'a', raw, before);
      if (!history) stopWaiting(L);
    };
    const heal = function (L, d) {
      if (d && d.stale && typeof d.cursor === 'number' && isFinite(d.cursor) && d.cursor >= 0 && d.cursor < L.after) { L.after = Math.floor(d.cursor); saveAfter(L); }
    };
    const take = function (L, d) {
      if (!d || typeof d !== 'object') return;
      heal(L, d);
      (Array.isArray(d.messages) ? d.messages : []).forEach(function (m) { render(L, m, false, null); });
      L.hubTyping = !!d.typing; setTyping(L);
    };

    /* STALE-CURSOR LAW: once per load per line, read the session from 0; a stored cursor above the session's newest
       message is pulled back (works even against an unpatched hub); the history is drawn above the greeting. */
    const reconcile = async function (L) {
      const ctl = new AbortController();
      const kill = setTimeout(function () { try { ctl.abort(); } catch (e) {} }, 15000);
      try {
        const r = await fetch(pollUrl(L, false), { signal: ctl.signal, cache: 'no-store', credentials: 'omit' });
        if (!r.ok) return;
        const d = await r.json();
        const ms = (d && Array.isArray(d.messages)) ? d.messages.filter(function (m) { return m && typeof m.seq === 'number' && isFinite(m.seq); }) : [];
        let mx = 0; ms.forEach(function (m) { if (m.seq > mx) mx = m.seq; });
        if (L.after > mx) { L.after = mx; saveAfter(L); }
        const tail = ms.slice(-CHAT_HISTORY);
        ms.forEach(function (m) { if (tail.indexOf(m) < 0) { L.seen.add(m.seq); if (m.seq > L.after) { L.after = m.seq; saveAfter(L); } } });
        const shown = tail.filter(function (m) { return !(m.holdNote || m.sleepNote || m.throttleNote); });
        if (shown.length) {
          L.log.setAttribute('aria-busy', 'true');
          place(L, h('div', { class: 'osof-divider' }, T('earlier', 'Earlier in this conversation')), L.greetEl);
          tail.forEach(function (m) { render(L, m, true, L.greetEl); });
          L.log.removeAttribute('aria-busy');
          L.log.scrollTop = L.log.scrollHeight;
        } else { tail.forEach(function (m) { render(L, m, true, L.greetEl); }); }
        heal(L, d);
      } catch (e) { /* the long-poll still runs; the hub's own stale law heals what this could not */ }
      finally { clearTimeout(kill); }
    };

    /* ── the ONE poll chain (single-flight) ── */
    const nap = function (L, ms) {
      return new Promise(function (res) {
        let done = false; let tm = 0;
        const fin = function () { if (done) return; done = true; clearTimeout(tm); if (L.napWake === fin) L.napWake = null; res(); };
        tm = setTimeout(fin, ms); L.napWake = fin;
      });
    };
    const run = async function (L) {
      if (L.running) return;
      L.running = true; L.lastBeat = Date.now();
      try {
        if (!L.reconciled) { L.reconciled = true; await reconcile(L); }
        while (D.open && D.active === L) {
          const ctl = new AbortController();
          L.ctl = ctl; L.ctlAt = Date.now();
          const kill = setTimeout(function () { try { ctl.abort(); } catch (e) {} }, CHAT_ABORT_MS);
          try {
            const r = await fetch(pollUrl(L, true), { signal: ctl.signal, cache: 'no-store', credentials: 'omit' });
            if (!r.ok) throw new Error('poll http ' + r.status);
            const d = await r.json();
            L.fails = 0;
            take(L, d);
          } catch (e) {
            if (e && e.name === 'AbortError') await nap(L, 60);                       // a wake or the 32 s timer: re-arm at once
            else { L.fails++; await nap(L, Math.min(20000, 1000 * Math.pow(2, Math.min(L.fails, 5)))); }
          } finally {
            clearTimeout(kill);
            if (L.ctl === ctl) L.ctl = null;
            L.lastBeat = Date.now();
          }
        }
      } finally { L.running = false; }
    };
    /* WAKE LAW: a wake never starts a second chain; it only aborts the in-flight request (the chain re-arms itself) */
    const kick = function () {
      if (!D.open || !D.active) return;
      const L = D.active;
      if (L.napWake) L.napWake();
      if (!L.running) { run(L); return; }
      if (L.ctl && Date.now() - L.ctlAt > 1200) { try { L.ctl.abort(); } catch (e) {} }
    };
    const beat = function () {
      clearTimeout(D.beatT);
      if (!D.open) return;
      D.beatT = setTimeout(function () {
        if (!D.open) return;
        const L = D.active;
        if (L && (!L.running || Date.now() - L.lastBeat > CHAT_DEAD_MS)) kick();
        beat();
      }, CHAT_BEAT_MS);
    };
    const listen = function () {
      if (D.listening) return; D.listening = true;
      document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
      window.addEventListener('focus', kick);
      window.addEventListener('pageshow', kick);
      window.addEventListener('online', kick);
      window.addEventListener('resize', function () { if (D.open) position(); });
    };

    /* ── sending ── */
    const send = async function () {
      const L = D.active; if (!L) return;
      let text = String(D.input.value || '').trim();
      if (!text) return;
      if (text.length > CHAT_MAX) text = text.slice(0, CHAT_MAX);
      D.input.value = ''; syncForm();
      const p = { text: text, seq: null, el: null };
      L.pending.push(p);
      p.el = bubble(L, 'v', text, null);
      L.log.scrollTop = L.log.scrollHeight;
      L.waiting = true; clearTimeout(L.waitT);
      L.waitT = setTimeout(function () { L.waiting = false; setTyping(L); }, 180000);
      setTyping(L);
      const wire = (L.def.face && (L.def.route || 'prefix') === 'prefix') ? facePrefix(L.def.face) + text : text;
      let ok = false, err = null;
      try {
        const r = await fetch(L.base + '/send', { method: 'POST', headers: { 'content-type': 'application/json' }, cache: 'no-store', credentials: 'omit',
          body: JSON.stringify({ session: L.sess, text: wire, name: 'guest' }) });
        let d = null; try { d = await r.json(); } catch (e) {}
        if (r.ok && d && typeof d.seq === 'number') {
          ok = true;
          if (p.seq === null) p.seq = d.seq;
          L.mine.add(d.seq);
        } else err = d && d.error ? String(d.error) : null;
      } catch (e) { err = null; }
      if (!ok) {
        const i = L.pending.indexOf(p); if (i >= 0 && p.seq === null) L.pending.splice(i, 1);
        if (p.el) p.el.classList.add('osof-msg-failed');
        stopWaiting(L);
        note(L, err || T('sendFail', 'That message did not reach the desk (a connection hiccup). Please try again in a moment.'), null, null);
      }
      if (D.open && D.active === L && !L.running) run(L);
    };
    const syncForm = function () {
      if (!D.input) return;
      D.sendBtn.disabled = !String(D.input.value || '').trim();
      D.input.style.height = '42px';
      if (D.input.scrollHeight > 44) D.input.style.height = Math.min(124, D.input.scrollHeight + 2) + 'px';
    };

    /* ── the drawer (built on first open) ── */
    const build = function () {
      if (D.el) return;
      D.av = h('span', { class: 'osof-chat-av', 'aria-hidden': 'true' }, '🎻');
      D.name = h('h2', { class: 'osof-chat-name', id: 'osof-chat-title' }, 'OSO');
      D.sub = h('div', { class: 'osof-chat-sub' }, '');
      D.x = h('button', { type: 'button', class: 'osof-chat-x', 'aria-label': T('close', 'Close the chat') }, '✕');
      D.chips = h('div', { class: 'osof-chat-chips', role: 'group', 'aria-label': T('chips', 'Choose who to talk to') });
      D.logs = h('div', { class: 'osof-chat-logs' });
      D.input = h('textarea', { class: 'osof-chat-in', rows: '1', maxlength: String(CHAT_MAX), enterkeyhint: 'send', autocomplete: 'off', 'aria-label': 'Message' });
      D.sendBtn = h('button', { type: 'submit', class: 'osof-chat-send', disabled: true }, T('send', 'Send'));
      D.form = h('form', { class: 'osof-chat-form' }, D.input, D.sendBtn);
      D.el = h('div', { class: 'osof-chat', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'osof-chat-title', hidden: true },
        h('div', { class: 'osof-chat-head' }, D.av, h('div', { class: 'osof-chat-id' }, D.name, D.sub), D.x),
        D.chips, D.logs, D.form);
      D.x.addEventListener('click', function () { close(); });
      D.form.addEventListener('submit', function (e) { e.preventDefault(); send(); });
      D.input.addEventListener('input', syncForm);
      D.input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); send(); }
      });
      D.el.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } });
      (document.getElementById('oso-frames') || document.body).appendChild(D.el);
      renderChips();
      listen();
    };
    const renderChips = function () {
      if (!D.chips) return;
      while (D.chips.firstChild) D.chips.removeChild(D.chips.firstChild);
      const faces = lines.filter(function (L) { return !L.main; });
      D.chips.hidden = lines.length < 2;
      let sep = false;
      lines.forEach(function (L) {
        if (!L.main && !sep && lines.some(function (x) { return x.main; })) {
          D.chips.appendChild(h('span', { class: 'osof-chip-sep', 'aria-hidden': 'true' }));
          D.chips.appendChild(h('span', { class: 'osof-chip-lab', 'aria-hidden': 'true' }, T('totem', 'totem')));
          sep = true;
        }
        const nm = L.def.name;
        const b = h('button', { type: 'button', class: 'osof-chip', 'aria-pressed': D.active === L ? 'true' : 'false', style: '--c:' + safeColor(L.def.color),
          'aria-label': fill(L.main ? T('chipMain', 'Talk to {n}') : T('chipFace', 'Talk to {n} — ʻohana totem'), { n: nm }), title: nm },
          h('span', { class: 'osof-chip-e', 'aria-hidden': 'true' }, L.def.emoji), L.main ? h('span', { 'aria-hidden': 'true' }, nm) : null);
        b.addEventListener('click', function () { activate(L); D.input.focus(); });
        L.chip = b;
        D.chips.appendChild(b);
      });
      if (!faces.length) D.chips.hidden = true;
    };
    const safeColor = function (c) { return /^#[0-9a-f]{3,8}$/i.test(String(c || '')) ? c : '#e8c476'; };
    const mkLog = function (L) {
      const log = h('div', { class: 'osof-chat-log', role: 'log', 'aria-live': 'polite', 'aria-label': fill(T('logLabel', 'Conversation with {n}'), { n: L.def.name }) });
      L.log = log;
      note(L, T('honest', '🤖 You are talking to AI agents of the ʻohana: machines, not people. They answer from Taurus, a reply can take a minute or two, and conversations may be reviewed.'), 'honest', null);
      const g = L.def.greeting || fill(T('faceGreeting', '{e} Aloha! {n} here, a face of the ʻohana totem. Ask me anything.'), { e: L.def.emoji, n: L.def.name });
      L.greetEl = bubble(L, 'a', g, null);
      L.typingEl = h('div', { class: 'osof-typing', hidden: true, 'aria-hidden': 'true' }, h('i', {}), h('i', {}), h('i', {}));
      log.appendChild(L.typingEl);
      return log;
    };
    const activate = function (L) {
      const old = D.active;
      if (old && old !== L) {
        if (old.ctl) { try { old.ctl.abort(); } catch (e) {} }
        if (old.napWake) old.napWake();
        if (old.log) old.log.hidden = true;
      }
      D.active = L;
      ensureSess(L);
      if (!L.log) D.logs.appendChild(mkLog(L));
      L.log.hidden = false;
      lines.forEach(function (x) { if (x.chip) x.chip.setAttribute('aria-pressed', x === L ? 'true' : 'false'); });
      D.el.style.setProperty('--c', safeColor(L.def.color));
      D.av.textContent = L.def.emoji;
      D.name.textContent = L.def.name;
      D.sub.textContent = L.def.sub || (L.main ? T('sub', 'AI agent of the ʻohana · live from Taurus') : T('faceSub', 'ʻohana totem · AI agent · live from Taurus'));
      D.input.setAttribute('aria-label', fill(T('inputLabel', 'Message to {n}'), { n: L.def.name }));
      D.input.setAttribute('placeholder', fill(T('placeholder', 'Ask {n} anything…'), { n: L.def.name }));
      L.log.scrollTop = L.log.scrollHeight;
      setTyping(L);
      run(L);
    };
    const position = function () {
      let b = D.anchorB || 64;
      const anchor = D.wrap && (D.wrap.getAttribute('data-mini') === '1' ? D.wrap.querySelector('.osof-fab-mini') : D.fab);
      const r = anchor ? anchor.getBoundingClientRect() : null;
      if (r && r.height) b = Math.max(8, Math.round(window.innerHeight - r.bottom));
      else {
        const dock = (document.getElementById('oso-frames') || document).querySelector('.osof-radio');
        const q = dock ? dock.getBoundingClientRect() : null;
        if (q && q.height && q.right > window.innerWidth - 160) b = Math.round(window.innerHeight - q.top + 10);
      }
      D.anchorB = b;
      D.el.style.setProperty('--osof-chat-b', b + 'px');
    };
    const open = function (L, opener, wrap) {
      build();
      D.wrap = wrap || D.wrap || D.wraps[0] || null;
      D.fab = D.wrap ? D.wrap.querySelector('.osof-fab') : null;
      D.opener = opener || document.activeElement;
      position();
      D.el.hidden = false;
      D.open = true;
      D.wraps.forEach(function (w) { w.classList.add('osof-is-open'); const f = w.querySelector('.osof-fab'); if (f) f.setAttribute('aria-expanded', 'true'); });
      activate(L || lines[0]);
      beat();
      syncForm();
      try { D.input.focus({ preventScroll: true }); } catch (e) { D.input.focus(); }
    };
    const close = function () {
      if (!D.open) return;
      D.open = false;
      D.el.hidden = true;
      clearTimeout(D.beatT);
      lines.forEach(function (L) { if (L.ctl) { try { L.ctl.abort(); } catch (e) {} } if (L.napWake) L.napWake(); });
      D.wraps.forEach(function (w) { w.classList.remove('osof-is-open'); const f = w.querySelector('.osof-fab'); if (f) f.setAttribute('aria-expanded', 'false'); });
      const o = D.opener; D.opener = null;
      const vis = function (n) { return n && n.isConnected && n.getClientRects().length > 0 && getComputedStyle(n).visibility !== 'hidden'; };
      if (vis(o)) o.focus();
      else if (D.wrap) { const f = D.wrap.getAttribute('data-mini') === '1' ? D.wrap.querySelector('.osof-fab-mini') : D.fab; if (f) f.focus(); }
    };

    // every line (pill or totem face) arrives here; `ack` tells the sender the drawer took it
    ctx.on('chat:open', function (det) {
      if (det && typeof det.ack === 'function') det.ack();
      const L = det && det.line ? lineFor(det.line) : lines[0];
      open(L, det && det.opener, null);
    });

    return {
      line: line,
      open: open,
      close: close,
      addWrap: function (w, f) { D.wraps.push(w); if (!D.wrap) { D.wrap = w; D.fab = f; } }
    };
  };

  FRAMES.define('chat', function (ctx, item) {
    'use strict';
    const T = function (k, f) { return ctx.t('chat.' + k, f); };
    const fill = function (s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] !== undefined && o[k] !== null ? String(o[k]) : m; }); };
    // ctx.h with optional kids (null/false are skipped here, so the core's h only ever sees Nodes and strings)
    const h = function (tag, attrs) {
      const a = [tag, attrs || {}];
      for (let i = 2; i < arguments.length; i++) { const k = arguments[i]; if (k !== null && k !== undefined && k !== false) a.push(k); }
      return ctx.h.apply(null, a);
    };
    ctx.css('chat', CHAT_CSS);

    const mainDef = {
      hub: item.hub || 'https://chat.opensourceorchestra.org',
      face: /^[a-z0-9_-]{1,24}$/i.test(String(item.face || '')) ? String(item.face) : null,   // a door may name its line (PIT FAM): the hub sees the prefix
      route: item.route || (item.face ? 'prefix' : null),
      name: item.name || 'OSO',
      emoji: item.emoji || '🎻',
      color: item.color || '#e8c476',
      greeting: item.greeting || T('greeting', '🎻 Aloha! I am OSO, an AI agent of the Open Source Orchestra. Ask me about the music, the circle, or how to join in.'),
      storage: item.storage || 'oso',
      sub: item.sub || T('sub', 'AI agent of the ʻohana · live from Taurus')
    };
    const label = item.label || fill(T('label', 'Talk to {name}'), { name: mainDef.name });
    const engine = chatShared.engine || (chatShared.engine = makeEngine(ctx, h, T, fill));
    const mainLine = engine.line(mainDef, true);
    // the totem faces of this dataset become chips in the drawer (each one its own line, session and cursor)
    Object.keys(ctx.data && ctx.data.slots || {}).forEach(function (s) {
      ((ctx.data.slots[s]) || []).forEach(function (it) {
        if (!it || it.kind !== 'totem') return;
        const faces = Array.isArray(it.faces) && it.faces.length ? it.faces : CHAT_DEFAULT_FACES;
        faces.forEach(function (f) {
          engine.line({ hub: it.hub || 'https://ohana-chat.shakaverse.workers.dev', face: f.k, name: f.n, emoji: f.e, color: f.c, greeting: f.greeting || null, storage: 'totem', route: it.route || 'prefix' });
        });
      });
    });

    // ── the pill (+ ✕ that bows out to a tiny emoji, remembered) ──
    const ui = ctx.store('chat');
    const miniKey = 'fab:' + String(item.id || mainDef.storage) + ':mini';
    const fab = h('button', { type: 'button', class: 'osof-fab', 'aria-haspopup': 'dialog', 'aria-expanded': 'false',
      'aria-label': label + ' — ' + T('fabHint', 'an AI agent of the ʻohana answers (opens the chat)'), title: label },
      h('span', { class: 'osof-fab-note', 'aria-hidden': 'true' }, '♪'), h('span', { class: 'osof-fab-note n2', 'aria-hidden': 'true' }, '♫'),
      h('span', { class: 'osof-fab-e', 'aria-hidden': 'true' }, mainDef.emoji),
      h('span', { class: 'osof-fab-t' }, label),
      h('span', { class: 'osof-fab-dot', 'aria-hidden': 'true' }));
    const bow = h('button', { type: 'button', class: 'osof-fab-x', title: fill(T('hideTitle', 'hide — a tiny {e} stays'), { e: mainDef.emoji }),
      'aria-label': fill(T('hide', 'Hide the {label} button (a small {e} stays)'), { label: label, e: mainDef.emoji }) }, '✕');
    const mini = h('button', { type: 'button', class: 'osof-fab-mini', title: label,
      'aria-label': fill(T('unhide', 'Show the {label} button'), { label: label }) }, mainDef.emoji);
    const wrap = h('div', { class: 'osof-chatwrap', 'data-osof-piece': 'chat' }, fab, bow, mini);
    const setMini = function (on) { wrap.setAttribute('data-mini', on ? '1' : '0'); if (on) ui.set(miniKey, true); else ui.del(miniKey); };
    setMini(ui.get(miniKey) === true);
    fab.addEventListener('click', function () { engine.open(mainLine, fab, wrap); });
    bow.addEventListener('click', function (e) { e.stopPropagation(); setMini(true); mini.focus(); });
    mini.addEventListener('click', function (e) { e.stopPropagation(); setMini(false); fab.focus(); });
    engine.addWrap(wrap, fab);

    // ONE-TIME LAW: the pill rises once with two notes, then it is still forever
    if (wrap.getAttribute('data-mini') !== '1' && !ctx.reduced && ctx.once('chat-intro')) {
      wrap.classList.add('osof-intro');
      setTimeout(function () { wrap.classList.remove('osof-intro'); }, 2800);
    }

    return {
      el: wrap,
      tour: item.tip || fill(T('tour', '{label}: an AI agent of the ʻohana answers you, live from Taurus.'), { label: label }),
      open: function () { engine.open(mainLine, fab, wrap); },
      close: function () { engine.close(); }
    };
  });
}
