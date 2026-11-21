/* Open Source Orchestra Frames · src/core.js
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * Copyright (C) 2026 Shaka Lei Kaumaka / Open Source Orchestra and the AI ʻohana
 *
 * The ring around the screen. One dataset (frame.json) becomes six slots around the edge
 * plus an overlay. This file holds: boot · dataset load + light validation · slots and the
 * layout engine (rails fill top to bottom; what does not fit goes into one ⋯) · THE ONE-TIME
 * LAW (ctx.once) · the shared accessible panel · the tour (cross-fade captions, the ✨ item,
 * "spot" items, the final card, the walkthrough video) · outline (blueprint) mode · the credit
 * mark · the mobile sheet. Pieces plug in with FRAMES.define(kind, factory) — contract: SPEC §3.
 * Privacy: the only request this file makes is the dataset itself. No cookies, ever.
 */
var FRAMES = (function (W) {
  'use strict';
  var VERSION = '0.1.1';
  var MAJOR = VERSION.split('.')[0];
  if (W && W.OSOFrames && W.OSOFrames.__osof) {            // loaded twice: the first copy rules
    if (W.console) W.console.info('🎻 frames: already on this page; the second copy stays quiet.');
    return { version: VERSION, __dup: true, define: function () {}, boot: function () {}, on: function () { return function () {}; }, emit: function () {} };
  }
  var D = W && W.document;
  var SCRIPT = D ? (D.currentScript || (function () { var s = D.querySelectorAll('script[src*="frames"]'); return s[s.length - 1] || null; })()) : null;

  var SVGNS = 'http://www.w3.org/2000/svg';
  var SVG_TAGS = /^(svg|g|path|circle|ellipse|rect|line|polyline|polygon|text|tspan|defs|linearGradient|radialGradient|stop|clipPath|mask|pattern|use|symbol|title|desc|filter|fe[A-Z]\w*)$/;
  var Z = { frame: 2147481000, outline: 2147481001, halo: 2147481002, pop: 2147481500, panel: 2147482000, sig: 2147482400, tour: 2147482500 };
  var HOME = 'https://frames.opensourceorchestra.org/';
  var SOURCE = 'https://github.com/Open-Source-Orchestra/frames';
  // AGPL §7(b): this exact line travels with every copy. Datasets may ADD names (credit.add), never remove it.
  var CREDIT = 'Built on Open Source Orchestra Frames by Open Source Orchestra: Shaka Lei Kaumaka & the AI ʻohana (https://opensourceorchestra.org)';
  var SLOTS = ['top-left', 'left', 'bottom-left', 'bottom-right', 'right', 'top-right', 'overlay'];
  var RING = ['top-left', 'left', 'bottom-left', 'bottom-right', 'right', 'top-right'];   // the tour traces the frame: down the left, across the bottom, up the right
  var UPWARD = { 'bottom-right': 1, right: 1, 'top-right': 1 };
  var KIND_EMOJI = { theater: '📺', totem: '🗿', chat: '💬', radio: '📻', tour: '✨', globe: '🌐' };
  var BRANDS = /(Open Source Orchestra Frames|Open Source Orchestra|Shaka Lei Kaumaka|ʻohana)/;
  var EN = {
    frame: 'Open Source Orchestra frame',
    'rail.left': 'Frame doors, left', 'rail.right': 'Frame doors, right',
    close: 'Close', newtab: '(opens in a new tab)',
    more: 'More', 'more.title': 'More doors', 'more.tip': 'More doors: {list}.',
    'sheet.label': 'The frame: every door', 'sheet.tip': 'Every door of the frame, in one sheet.', 'sheet.talk': 'Talk to the ʻohana',
    tour: 'Tour', 'tour.title': 'A tour of the frame', 'tour.skip': 'Skip', 'tour.tip': 'Replay this tour any time.',
    'tour.done': 'That was the frame.', 'tour.replay': '✨ replays the tour any time', 'tour.watch': '▶ watch the {d} walkthrough',
    'tour.video': 'The frame: a walkthrough', 'tour.download': 'Download the video',
    'credit.about': 'About this frame', 'credit.tip': 'Who made this frame, and how to fork it. The credit travels with every copy. ⚙ turns pieces, or the whole frame, off and on.',
    'outline.page': 'your page lives here · the frame never blocks it',
    'settings': 'Frame settings', 'settings.tip': 'Turn the frame, or any of its pieces, off and on. Remembered in this browser.',
    'settings.on': 'Frame on', 'settings.off': 'Frame off', 'settings.pieces': 'Pieces', 'settings.note': 'Remembered in this browser only. No cookies, nothing sent anywhere.',
    'settings.forget': 'Replay the first visit', 'settings.forgot': 'Done. Reload to see the first visit again.',
    'settings.url': '?frame=off on any address hides the frame for one page view.',
    'dot.label': 'Bring back the frame by the ʻohana', 'dot.tip': 'The frame is off. Tap to bring it back.',
    'fold': 'Hide the frame button (a small dot stays)', 'unfold': 'Show the frame button',
    'g.doors': 'Doors', 'g.pills': 'Pills', 'g.theater': 'Theater', 'g.totem': 'Totem of agents', 'g.chat': 'Talk line', 'g.radio': 'Radio', 'g.signature': 'Signature', 'g.tour': 'Tour'
  };
  // the ⚙ panel groups pieces by what a visitor sees (the globe stays: one language choice follows the visitor across every door)
  var GROUP = { door: 'doors', pill: 'pills', theater: 'theater', totem: 'totem', chat: 'chat', radio: 'radio', signature: 'signature', tour: 'tour', spot: 'tour' };
  var GROUPS = ['doors', 'pills', 'theater', 'totem', 'chat', 'radio', 'signature', 'tour'];
  var TEXT_TAGS = { P: 1, LI: 1, H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1, BLOCKQUOTE: 1, PRE: 1, TD: 1, TH: 1, DT: 1, DD: 1, FIGCAPTION: 1, LABEL: 1, SUMMARY: 1, A: 1, SPAN: 1, SMALL: 1, EM: 1, STRONG: 1, B: 1, I: 1, CODE: 1 };

  // ── small helpers ───────────────────────────────────────────────────────────────
  function has(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
  function isObj(x) { return !!x && typeof x === 'object' && !Array.isArray(x); }
  function str(x) { return typeof x === 'string' ? x : (typeof x === 'number' ? String(x) : ''); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function slug(s) { return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48); }
  function fmt(s, vars) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return has(vars, k) ? String(vars[k]) : ''; }).replace(/\s{2,}/g, ' ').trim(); }
  function log(kind, args) { var c = W && W.console; if (c && c[kind]) c[kind].apply(c, ['🎻 frames:'].concat([].slice.call(args))); }
  function info() { log('info', arguments); }
  function warn() { log('warn', arguments); }
  function deepFreeze(o) { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.keys(o).forEach(function (k) { deepFreeze(o[k]); }); } return o; }
  function copy(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }

  // ?frame=off | fresh | outline (combinable: ?frame=fresh,outline)
  function parseFlags(search) {
    var f = { off: false, fresh: false, outline: false };
    var m = /[?&]frame=([^&#]*)/.exec(search || '');
    if (m) { try { decodeURIComponent(m[1]).split(/[,+\s]+/).forEach(function (w) { if (has(f, w)) f[w] = true; }); } catch (e) {} }
    return f;
  }

  function probeStorage(w) {
    try { var s = w && w.localStorage; if (!s) return null; s.setItem('osof:probe', '1'); s.removeItem('osof:probe'); return s; } catch (e) { return null; }
  }

  // THE ONE-TIME LAW. once(key) is true the FIRST time ever for this browser + frame id + major
  // version, else false. ?frame=fresh: first-visit behaviour for this page view (flags untouched).
  // Never throws: without storage (private mode, sandboxed frames) it is "first time" once per page view.
  function makeOnce(ls, frameId, fresh) {
    var seen = {}, got = {};
    function key(k) { return 'osof:once:' + frameId + ':' + k; }
    function peek(k) {
      k = String(k);
      if (seen[k]) return false;
      if (fresh || !ls) return true;
      try { return ls.getItem(key(k)) !== MAJOR; } catch (e) { return true; }
    }
    function once(k) {
      k = String(k);
      var first = peek(k);
      if (!seen[k]) got[k] = first;
      seen[k] = 1;
      if (first && !fresh && ls) { try { ls.setItem(key(k), MAJOR); } catch (e) {} }
      return first;
    }
    once.peek = peek;
    once.got = function (k) { return got[String(k)]; };   // what the first call answered in this page view
    return once;
  }

  // store(ns) → {get, set, del}: JSON in localStorage under osof:<ns>:<k>; memory fallback; never throws.
  function makeStore(ls) {
    var mem = {};
    return function store(ns) {
      var p = 'osof:' + ns + ':';
      return {
        get: function (k) {
          var key = p + k;
          if (has(mem, key)) return mem[key];
          try { var v = ls ? ls.getItem(key) : null; if (v != null) return JSON.parse(v); } catch (e) {}
          return null;
        },
        set: function (k, v) {
          var key = p + k;
          if (v === undefined) { this.del(k); return; }
          mem[key] = v;
          try { if (ls) ls.setItem(key, JSON.stringify(v)); } catch (e) {}
        },
        del: function (k) { var key = p + k; delete mem[key]; try { if (ls) ls.removeItem(key); } catch (e) {} },
        _mem: mem
      };
    };
  }

  // Only http(s) (and mailto: for doors) ever leave a dataset. javascript:, data:, file: … → ''.
  function resolveURL(u, base, mediaOnly) {
    if (u == null || typeof u === 'object') return '';
    u = String(u).trim();
    if (!u) return '';
    var x;
    try { x = base ? new URL(u, base) : new URL(u); } catch (e) { return ''; }
    if (x.protocol === 'http:' || x.protocol === 'https:') return x.href;
    if (!mediaOnly && x.protocol === 'mailto:') return x.href;
    return '';
  }

  // Fit a rail: the heights of its items in order, the room it has, the gap bounds and the height
  // of the ⋯ button. Items keep their order; what does not fit goes into ⋯ (never a scrollbar);
  // leftover room is shared out as a slightly wider gap so the rail runs top to bottom.
  function fitColumn(hs, avail, minGap, maxGap, moreH) {
    var n = hs.length, sum = 0, i;
    for (i = 0; i < n; i++) sum += hs[i];
    if (!n) return { n: 0, gap: minGap, more: false };
    if (sum + minGap * (n - 1) <= avail) {
      var g = n > 1 ? minGap + (avail - sum - minGap * (n - 1)) / (n - 1) : minGap;
      return { n: n, gap: Math.floor(Math.min(maxGap, g) * 10) / 10, more: false };
    }
    var k = 0, acc = 0;
    while (k < n && acc + hs[k] + minGap * (k + 1) + moreH <= avail) { acc += hs[k]; k++; }
    var rest = avail - acc - moreH - minGap * k;
    var gap = k > 0 ? Math.min(maxGap, minGap + rest / k) : minGap;
    return { n: k, gap: Math.floor(gap * 10) / 10, more: moreH <= avail };
  }

  // Light validation (the full JSON Schema lives in schema/frame-0.1.json). Unknown kinds stay in
  // the data and are skipped at render time with one console.info — never an error.
  function normalize(raw) {
    if (!isObj(raw)) throw new Error('the dataset is not a JSON object');
    var fr = str(raw.frame);
    if (fr && !/^osoframes\/0(\.|$)/.test(fr)) info('dataset says "' + fr + '"; this frame reads osoframes/0.x — trying anyway');
    var out = copy(raw);
    out.frame = fr || 'osoframes/0.1';
    out.id = slug(raw.id) || 'frame';
    out.name = str(raw.name) || EN.frame;
    var add = isObj(raw.credit) && Array.isArray(raw.credit.add) ? raw.credit.add : [];
    if (isObj(raw.credit) && Object.keys(raw.credit).some(function (k) { return k !== 'add'; })) info('credit can only be added to (credit.add), never replaced or hidden — AGPL §7(b)');
    out.credit = { add: add.map(function (x) { return str(x).trim(); }).filter(Boolean).slice(0, 12) };
    out.license = { data: (isObj(raw.license) && str(raw.license.data)) || 'CC-BY-SA-4.0', code: 'AGPL-3.0-or-later' };
    out.accent = /^#[0-9a-f]{6}$/i.test(str(raw.accent)) ? str(raw.accent).toLowerCase() : '';
    out.host = doorHost(raw.host);
    delete out.extends; delete out.without;
    var strings = {};
    if (isObj(raw.strings)) Object.keys(raw.strings).forEach(function (k) { if (typeof raw.strings[k] === 'string') strings[k] = raw.strings[k]; });
    out.strings = strings;
    out.slots = {};
    var ids = {};
    var rawSlots = isObj(raw.slots) ? raw.slots : {};
    Object.keys(rawSlots).forEach(function (s) { if (SLOTS.indexOf(s) < 0) info('unknown slot "' + s + '" skipped'); });
    SLOTS.forEach(function (s) {
      var list = Array.isArray(rawSlots[s]) ? rawSlots[s] : [];
      out.slots[s] = list.filter(function (it) { return isObj(it) && typeof it.kind === 'string' && it.kind; }).map(function (it) {
        var c = copy(it);
        var id = slug(c.id) || slug(c.kind + '-' + (c.label || c.title || c.name || c.selector || '')) || c.kind;
        if (ids[id]) { var n = 2; while (ids[id + '-' + n]) n++; id = id + '-' + n; }
        ids[id] = 1; c.id = id;
        return c;
      });
    });
    return out;
  }

  // ── per-door frames: a small dataset that EXTENDS another (frames/doors/<host>.json → ../universe.json) ──
  // child wins for id/name/description/emoji/accent/license.data; strings merge; credit.add concatenates (never removes);
  // "without": ["signature","pill"] drops every item of those kinds; each slot is either an array (replace)
  // or ops {remove:[id|"kind:x"], prepend:[…], append:[…], replace:[items by id], set:{id:{field:value}}}.
  function mergeFrame(parent, child, byId) {
    if (!isObj(child)) return copy(parent);
    if (!isObj(parent)) parent = { slots: {} };
    var out = copy(parent); delete out.extends;
    ['id', 'name', 'description', 'emoji', 'accent', 'host'].forEach(function (k) { if (has(child, k) && child[k] != null) out[k] = child[k]; });
    if (isObj(child.strings)) { out.strings = isObj(out.strings) ? out.strings : {}; Object.keys(child.strings).forEach(function (k) { out.strings[k] = child.strings[k]; }); }
    if (isObj(child.credit) && Array.isArray(child.credit.add)) {
      out.credit = isObj(out.credit) ? out.credit : {}; out.credit.add = (Array.isArray(out.credit.add) ? out.credit.add : []).slice();
      child.credit.add.forEach(function (x) { if (out.credit.add.indexOf(x) < 0) out.credit.add.push(x); });
    }
    if (isObj(child.license) && child.license.data) { out.license = isObj(out.license) ? out.license : {}; out.license.data = child.license.data; }
    out.slots = isObj(out.slots) ? out.slots : {};
    var without = Array.isArray(child.without) ? child.without.map(str) : [];
    var matches = function (it, sel) { sel = str(sel); return sel.indexOf('kind:') === 0 ? it.kind === sel.slice(5) : (str(it.id) === sel); };
    SLOTS.forEach(function (sl) {
      var list = Array.isArray(out.slots[sl]) ? out.slots[sl] : [];
      if (without.length) list = list.filter(function (it) { return !(isObj(it) && without.indexOf(str(it.kind)) >= 0); });
      var ops = isObj(child.slots) ? child.slots[sl] : undefined;
      if (Array.isArray(ops) && byId) ops = { replace: ops };          // an overlay merges by piece id: same id → replaced, new id → appended
      if (Array.isArray(ops)) list = copy(ops);
      else if (isObj(ops)) {
        if (Array.isArray(ops.remove)) list = list.filter(function (it) { return !ops.remove.some(function (sel) { return isObj(it) && matches(it, sel); }); });
        if (Array.isArray(ops.replace)) ops.replace.forEach(function (ni) { if (!isObj(ni)) return; var hit = false; list = list.map(function (it) { if (isObj(it) && str(it.id) && str(it.id) === str(ni.id)) { hit = true; return copy(ni); } return it; }); if (!hit) list.push(copy(ni)); });
        if (isObj(ops.set)) list = list.map(function (it) { var patch = isObj(it) && str(it.id) ? ops.set[it.id] : null; if (!isObj(patch)) return it; var c = copy(it); Object.keys(patch).forEach(function (k) { if (k !== 'kind') c[k] = copy(patch[k]); }); return c; });
        if (Array.isArray(ops.prepend)) list = copy(ops.prepend).concat(list);
        if (Array.isArray(ops.append)) list = list.concat(copy(ops.append));
      }
      out.slots[sl] = list;
    });
    return out;
  }
  // a parent dataset's relative URLs (href/src/poster/captions/channels/hub/status/page) are made absolute against
  // the PARENT's own URL before the merge — the child's relative URLs keep resolving against the child file.
  var URL_KEYS = { href: 1, src: 1, poster: 1, captions: 1, channels: 1, hub: 1, status: 1, page: 1 };
  function absolutize(x, baseURL) {
    if (Array.isArray(x)) return x.map(function (v) { return absolutize(v, baseURL); });
    if (!isObj(x)) return x;
    var out = {};
    Object.keys(x).forEach(function (k) {
      var v = x[k];
      if (URL_KEYS[k] && typeof v === 'string' && v && !/^[a-z][a-z0-9+.-]*:/i.test(v) && v.charAt(0) !== '#') { try { v = new URL(v, baseURL).href; } catch (e) {} }
      out[k] = (isObj(v) || Array.isArray(v)) ? absolutize(v, baseURL) : v;
    });
    return out;
  }
  function doorHost(v) { return str(v).toLowerCase().replace(/^www\./, '').replace(/[^a-z0-9.-]/g, '').slice(0, 120); }

  function creditLine(d) {
    var add = d && d.credit && d.credit.add && d.credit.add.length ? ' · with ' + d.credit.add.join(', ') : '';
    return CREDIT + add;
  }

  // ── DOM helpers (only touched after boot) ─────────────────────────────────────
  function h(tag, attrs) {
    var el = SVG_TAGS.test(tag) ? D.createElementNS(SVGNS, tag) : D.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!has(attrs, k)) continue;
        var v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'on') { for (var ev in v) if (has(v, ev) && typeof v[ev] === 'function') el.addEventListener(ev, v[ev]); continue; }
        if (/^on/i.test(k)) continue;                       // handlers only via on:{}, never strings
        el.setAttribute(k, v === true ? '' : String(v));
      }
    }
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, kid) {
    if (kid == null || kid === false || kid === true) return;
    if (Array.isArray(kid)) { for (var i = 0; i < kid.length; i++) add(el, kid[i]); return; }
    el.appendChild(kid.nodeType ? kid : D.createTextNode(String(kid)));   // strings are TEXT, never HTML
  }
  // brand names stay untranslated (ʻŌlelo / Google Translate honour translate="no" + notranslate)
  function brandify(text) {
    var parts = String(text == null ? '' : text).split(BRANDS), out = [];
    for (var i = 0; i < parts.length; i++) {
      if (!parts[i]) continue;
      out.push(i % 2 ? h('span', { translate: 'no', class: 'notranslate' }, parts[i]) : parts[i]);
    }
    return out;
  }
  var injected = {};
  // a door's accent (frames/doors/<host>.json "accent": "#hex") recolours the gold of every piece
  function accentCSS(text) {
    if (!data || !data.accent) return text;
    return text.replace(/rgba\(251,\s*226,\s*160,\s*(\.\d+|1|0)\)/g, function (m, a) { return 'color-mix(in srgb,var(--osof-accent) ' + Math.round(parseFloat(a) * 100) + '%,transparent)'; })
      .replace(/#fbe2a0/gi, 'var(--osof-accent)');
  }
  function css(id, text) {
    id = String(id);
    if (injected[id]) return injected[id];
    var s = D.createElement('style');
    s.setAttribute('data-osof', id);
    if (SCRIPT && SCRIPT.nonce) s.nonce = SCRIPT.nonce;             // strict-CSP doors
    s.textContent = accentCSS(String(text));
    (D.head || D.documentElement).appendChild(s);
    return (injected[id] = s);
  }
  function isVisible(el) {
    if (!el || !el.isConnected || !el.getBoundingClientRect) return false;
    var r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    var cs = W.getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.02;
  }
  function onScreen(r) { return r && r.right > 0 && r.bottom > 0 && r.left < W.innerWidth && r.top < W.innerHeight; }
  function focusEl(el) { if (!el || !el.focus) return; try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
  function focusables(box) {
    var q = box.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,iframe,video[controls],audio[controls],[tabindex]:not([tabindex="-1"])');
    return [].filter.call(q, function (el) { return el.getClientRects().length > 0 && W.getComputedStyle(el).visibility !== 'hidden'; });
  }
  function mq(q) { try { return !!(W.matchMedia && W.matchMedia(q).matches); } catch (e) { return false; } }

  // ── event bus (also mirrored as DOM events "osoframes:<name>" on document) ─────
  var bus = {};
  function on(name, fn) {
    (bus[name] = bus[name] || []).push(fn);
    return function off() { var a = bus[name], i = a ? a.indexOf(fn) : -1; if (i >= 0) a.splice(i, 1); };
  }
  function emit(name, detail) {
    var a = (bus[name] || []).slice();
    for (var i = 0; i < a.length; i++) { try { a[i](detail, name); } catch (e) { warn('listener for "' + name + '" failed', e); } }
    try { if (D && W.CustomEvent) D.dispatchEvent(new W.CustomEvent('osoframes:' + name, { detail: detail })); } catch (e) {}
  }
  function listening(name) { return !!(bus[name] && bus[name].length); }

  // ── state ───────────────────────────────────────────────────────────────────────
  var kinds = {};
  var state = { booted: false, ready: false, fresh: false, outline: false, mobile: false, reduced: false, off: false, crowded: false, zoomedOut: false };
  var prefs = { on: true, hide: {} };      // the ⚙ panel: osof:settings:v1 (this browser only)
  var dot = null, sheetX = null, sheetFolded = { user: false, text: false };
  var data = null, dataURL = '', base = '', frameId = 'frame';
  var LS = null, once = null, store = null;
  var root = null, zones = {}, recs = [], more = {}, creditBox = null, creditInfo = null, creditGear = null, sheetBtn = null;
  var dialogs = {}, openDlg = null, ro = null, layoutQueued = false, unknownSeen = {};

  function t(key, fallback) {
    var s = data && data.strings;
    if (s && typeof s[key] === 'string') return s[key];
    if (fallback != null) return String(fallback);
    return has(EN, key) ? EN[key] : String(key);
  }

  function makeCtx(rec) {
    var ctx = {
      data: data, item: rec.item, slot: rec.slot, h: h, css: css,
      once: function (k) { return once(k); },
      store: function (ns) { return store(ns); },
      t: t,
      resolve: function (u) { return resolveURL(u, dataURL); },
      base: base,
      emit: emit, on: on,
      credit: creditLine(data),
      panel: function (o) { return dialog(o || {}); }
    };
    Object.defineProperty(ctx, 'reduced', { enumerable: true, get: function () { return state.reduced; } });
    Object.defineProperty(ctx, 'mobile', { enumerable: true, get: function () { return state.mobile; } });
    return ctx;
  }

  // ── unless: "window.name" or a CSS selector that matches on the page (outside the frame) ──
  function unlessMatches(u) {
    if (!u) return false;
    var s = String(u).trim();
    var m = /^window\.([\w$]+(?:\.[\w$]+)*)$/.exec(s);
    if (m) {
      var o = W, path = m[1].split('.');
      for (var i = 0; i < path.length; i++) { try { o = o == null ? undefined : o[path[i]]; } catch (e) { o = undefined; } }
      return !!o;
    }
    try {
      var els = D.querySelectorAll(s);
      for (var j = 0; j < els.length; j++) if (!root || !root.contains(els[j])) return true;
    } catch (e) { info('"unless" is neither window.<name> nor a CSS selector:', s); }
    return false;
  }
  function spotEls(rec) {
    var out = [];
    try {
      var els = D.querySelectorAll(String(rec.item.selector || ''));
      for (var i = 0; i < els.length; i++) if (!root.contains(els[i]) && isVisible(els[i])) out.push(els[i]);
    } catch (e) {}
    return out;
  }

  function labelOf(r) { var it = r.item || {}; return str(it.label) || str(it.title) || str(it.name) || t(r.kind, r.kind); }
  function emojiOf(r) { var it = r.item || {}; return str(it.emoji) || KIND_EMOJI[r.kind] || '•'; }

  // ── mounting ────────────────────────────────────────────────────────────────────
  function mount(slot, item, idx) {
    var rec = { id: item.id, kind: item.kind, slot: slot, item: item, idx: idx, wrap: null, el: null, piece: null };
    if (unlessMatches(item.unless)) return null;                    // adopt mode: the page already has it
    if (item.kind === 'spot') { rec.spot = true; recs.push(rec); return rec; }
    var f = kinds[item.kind];
    if (!f) { if (!unknownSeen[item.kind]) { unknownSeen[item.kind] = 1; info('no piece for kind "' + item.kind + '" in this build; skipped'); } return null; }
    var piece;
    try { piece = f(makeCtx(rec), item); } catch (e) { warn('piece "' + item.kind + '" (' + item.id + ') failed; skipped', e); return null; }
    if (!piece) return null;
    rec.piece = piece;
    if (piece.el && piece.el.nodeType === 1) {
      rec.el = piece.el;
      rec.wrap = h('div', { class: 'osof-item', 'data-osof-kind': item.kind, 'data-osof-id': item.id }, piece.el);
      if (item.hideOnMobile) rec.wrap.setAttribute('data-osof-hom', '');
      zones[slot].appendChild(rec.wrap);
    }
    recs.push(rec);
    return rec;
  }
  function unmount(rec) {
    rec.skipped = true;
    if (rec.wrap) rec.wrap.remove();
    try { if (rec.piece && rec.piece.close) rec.piece.close(); } catch (e) {}
    recs = recs.filter(function (r) { return r !== rec; });
  }
  function groupOf(kind) { return GROUP[kind] || ''; }
  function hiddenKind(kind) { var g = groupOf(kind); return !!(g && prefs.hide[g]); }
  function live(r) { return !r.skipped && !hiddenKind(r.kind) && (!state.mobile || !r.item.hideOnMobile); }
  function openRec(r, opener) {
    if (r.piece && typeof r.piece.open === 'function') { r.piece.open(opener); return true; }
    var href = resolveURL(r.item.href, dataURL);
    if (!href) return false;
    if (r.item.newTab) W.open(href, '_blank', 'noopener'); else W.location.href = href;
    return true;
  }

  // ── shared accessible dialog (panels + popovers): one open at a time, Esc, focus trap, focus returns ──
  function dialog(opts) {
    var id = 'osof-dlg-' + (slug(opts.id) || ('p' + Object.keys(dialogs).length));
    if (dialogs[id]) return dialogs[id];
    var modal = opts.modal !== false;
    var x = h('button', { type: 'button', class: 'osof-x', 'aria-label': t('close') }, '✕');
    var head = h('div', { class: 'osof-dlg-head' }, h('h2', { class: 'osof-dlg-title', id: id + '-t' }, brandify(str(opts.title) || t('frame'))), x);
    var body = h('div', { class: 'osof-dlg-body' });
    var el = h('div', { id: id, class: 'osof-dlg ' + (modal ? 'osof-panel' : 'osof-pop') + (opts.wide ? ' osof-wide' : ''), role: 'dialog', 'aria-modal': modal ? 'true' : 'false', 'aria-labelledby': id + '-t', tabindex: '-1', hidden: true }, head, body);
    var api = { root: el, body: body, head: head, modal: modal, opts: opts, opener: null };
    api.open = function (opener) { openDialog(api, opener); };
    api.close = function () { closeDialog(api, true, 'api'); };
    api.isOpen = function () { return openDlg === api; };
    x.addEventListener('click', function () { closeDialog(api, true, 'x'); });
    root.appendChild(el);
    if (ro) ro.observe(el);
    return (dialogs[id] = api);
  }
  function openDialog(api, opener) {
    if (openDlg === api) { place(api); return; }
    if (openDlg) closeDialog(openDlg, false, 'swap');
    if (tour.active) stopTour('panel');
    hideFinal();
    var a = D.activeElement;
    api.opener = opener && opener.nodeType === 1 ? opener : (a && a !== D.body && !api.root.contains(a) ? a : null);
    api.root.hidden = false;
    openDlg = api;
    if (api.opener && api.opener.hasAttribute('aria-expanded')) api.opener.setAttribute('aria-expanded', 'true');
    place(api);
    focusEl(focusables(api.body)[0] || api.root.querySelector('.osof-x'));
    emit('panel:open', { id: api.root.id });
  }
  function closeDialog(api, restore, why) {
    if (openDlg !== api) return;
    openDlg = null;
    var hadFocus = api.root.contains(D.activeElement);
    api.root.hidden = true;
    var o = api.opener;
    if (o && o.hasAttribute && o.hasAttribute('aria-expanded')) o.setAttribute('aria-expanded', 'false');
    if (restore || hadFocus && why !== 'outside') {
      if (o && isVisible(o)) focusEl(o);
      else if (state.mobile && sheetBtn && isVisible(sheetBtn)) focusEl(sheetBtn);
    }
    if (typeof api.opts.onClose === 'function') { try { api.opts.onClose(why); } catch (e) { warn(e); } }
    emit('panel:close', { id: api.root.id, why: why });
  }
  function place(api) {
    var el = api.root, s = el.style;
    s.left = s.top = '';
    if (state.mobile || el.hidden) return;                     // phones: a bottom sheet (CSS)
    var vw = W.innerWidth, vh = W.innerHeight, w = el.offsetWidth, hh = el.offsetHeight;
    var o = api.opener, r = o && o.isConnected ? o.getBoundingClientRect() : null, left, top;
    if (api.opts.wide || !r || (!r.width && !r.height)) { left = (vw - w) / 2; top = (vh - hh) / 2; }
    else {
      var cx = r.left + r.width / 2;
      if (cx < vw * 0.42) left = r.right + 14; else if (cx > vw * 0.58) left = r.left - 14 - w; else left = cx - w / 2;
      if (r.top > vh * 0.62) top = r.bottom - hh; else if (r.bottom < vh * 0.3) top = r.top; else top = r.top + r.height / 2 - hh / 2;
    }
    s.left = Math.round(clamp(left, 8, Math.max(8, vw - w - 8))) + 'px';
    s.top = Math.round(clamp(top, 8, Math.max(8, vh - hh - 8))) + 'px';
  }
  function onKey(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (openDlg) { e.stopPropagation(); closeDialog(openDlg, true, 'esc'); return; }
      if (tour.active) { e.stopPropagation(); stopTour('esc'); return; }
      if (finalEl) { hideFinal(); return; }
    }
    if (e.key === 'Tab' && openDlg && openDlg.modal) {
      var f = focusables(openDlg.root);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1], a = D.activeElement;
      if (!openDlg.root.contains(a)) { e.preventDefault(); focusEl(first); }
      else if (e.shiftKey && a === first) { e.preventDefault(); focusEl(last); }
      else if (!e.shiftKey && a === last) { e.preventDefault(); focusEl(first); }
    }
  }
  function onPointer(e) {
    var tg = e.target;
    if (tour.active && tour.auto && root.contains(tg) && !(tour.bar && tour.bar.contains(tg))) stopTour('click');
    if (!openDlg || openDlg.opts.sticky) return;
    if (openDlg.root.contains(tg)) return;
    if (openDlg.opener && openDlg.opener.contains && openDlg.opener.contains(tg)) return;   // the opener toggles itself
    closeDialog(openDlg, false, 'outside');
  }

  // ── the ⋯ (rail overflow) ─────────────────────────────────────────────────────
  function makeMore(side) {
    var b = h('button', { type: 'button', class: 'osof-btn osof-more', 'aria-label': t('more.title'), 'aria-haspopup': 'dialog', 'aria-expanded': 'false' },
      h('span', { class: 'osof-emo', 'aria-hidden': 'true' }, '⋯'), h('span', { class: 'osof-lbl', 'aria-hidden': 'true' }, t('more')));
    var w = h('div', { class: 'osof-item', 'data-osof-kind': 'more', hidden: true }, b);
    b.addEventListener('click', function () {
      var d = dialog({ id: 'more-' + side, title: t('more.title'), modal: false });
      if (d.isOpen()) { d.close(); return; }
      d.body.textContent = '';
      d.body.appendChild(h('div', { class: 'osof-rows' }, recs.filter(function (r) { return r.slot === side && r.overflowed && live(r); }).map(row)));
      d.open(b);
    });
    zones[side].appendChild(w);
    return { wrap: w, btn: b };
  }
  function row(r) {
    var it = r.item, href = resolveURL(it.href, dataURL);
    var kids = [h('span', { class: 'osof-row-emo', 'aria-hidden': 'true' }, emojiOf(r)), h('span', { class: 'osof-row-lbl' }, brandify(labelOf(r)))];
    if ((r.kind === 'door' || r.kind === 'pill') && href) {
      return h('a', { class: 'osof-row', href: href, target: it.newTab ? '_blank' : null, rel: it.newTab ? 'noopener' : null }, kids);
    }
    return h('button', { type: 'button', class: 'osof-row', on: { click: function () { if (openDlg) closeDialog(openDlg, false, 'swap'); openRec(r, more[r.slot] && more[r.slot].btn); } } }, kids);
  }

  // ── the credit mark (always rendered; AGPL §7(b)) ──────────────────────────────
  function makeCredit() {
    var a = h('a', { class: 'osof-credit-a', href: HOME, title: creditLine(data) + ' · code: AGPL-3.0-or-later · words & data: CC BY-SA 4.0' },
      h('span', { 'aria-hidden': 'true' }, '🎻'), ' frame by the ', h('span', { translate: 'no', class: 'notranslate' }, 'ʻohana'));
    creditInfo = h('button', { type: 'button', class: 'osof-credit-i', 'aria-label': t('credit.about'), 'aria-haspopup': 'dialog', 'aria-expanded': 'false', on: { click: function () { about(creditInfo); } } }, 'i');
    creditGear = h('button', { type: 'button', class: 'osof-credit-i osof-credit-g', 'aria-label': t('settings'), 'aria-haspopup': 'dialog', 'aria-expanded': 'false', on: { click: function () { settings(creditGear); } } }, h('span', { 'aria-hidden': 'true' }, '⚙'));
    creditBox = h('div', { class: 'osof-credit' }, a, creditInfo, creditGear);
    zones['bottom-left'].appendChild(h('div', { class: 'osof-item', 'data-osof-kind': 'credit' }, creditBox));
  }
  function about(opener) {
    var d = dialog({ id: 'about', title: t('credit.about'), modal: false });
    if (d.isOpen()) { d.close(); return; }
    var link = function (href, text) { return h('a', { href: href, target: '_blank', rel: 'noopener' }, text); };
    d.body.textContent = '';
    d.body.appendChild(h('div', { class: 'osof-about' },
      h('p', { class: 'osof-credit-line' }, brandify(CREDIT.replace(' (https://opensourceorchestra.org)', '')), ' (', link('https://opensourceorchestra.org', 'opensourceorchestra.org'), ')'),
      data.credit.add.length ? h('p', {}, 'With ', data.credit.add.join(', '), '.') : null,
      h('p', {}, 'Code: AGPL-3.0-or-later, with the §7(b) credit term: keep this line visible. Words, design and dataset: CC BY-SA 4.0. Forks stay open.'),
      h('p', {}, 'This frame: ', brandify(data.name), ' · data ', data.license.data, '.'),
      h('p', { class: 'osof-about-links' },
        link(HOME, 'Fork your own frame ↗'), ' · ', link(SOURCE, 'source code ↗'),
        /^https?:/.test(dataURL) ? [' · ', link(dataURL, 'this dataset ↗')] : null),
      h('p', { class: 'osof-small' }, 'Made by AI agents of the ', h('span', { translate: 'no', class: 'notranslate' }, 'ʻohana'), ' (machines), blessed by ', h('span', { translate: 'no', class: 'notranslate' }, 'Shaka Lei Kaumaka'), ' (a human). v' + VERSION + '.')));
    d.open(opener);
  }

  // ── the ⚙ control panel: the frame, or any piece, off and on (remembered in this browser) ──
  function loadPrefs() {
    var v = store('settings').get('v1');
    prefs = { on: !(isObj(v) && v.on === false), hide: {} };
    if (isObj(v) && isObj(v.hide)) GROUPS.forEach(function (g) { if (v.hide[g]) prefs.hide[g] = true; });
  }
  function savePrefs() { store('settings').set('v1', { on: prefs.on, hide: prefs.hide, at: new Date().toISOString().slice(0, 10) }); }
  function presentGroups() {
    var seen = {};
    SLOTS.forEach(function (sl) { (data.slots[sl] || []).forEach(function (it) { var g = groupOf(it.kind); if (g && it.kind !== 'spot') seen[g] = 1; }); });
    return GROUPS.filter(function (g) { return seen[g]; });
  }
  function sw(label, checked, onToggle, big) {
    var b = h('button', { type: 'button', role: 'switch', 'aria-checked': checked ? 'true' : 'false', class: 'osof-sw' + (big ? ' osof-sw-big' : '') },
      h('span', { class: 'osof-sw-l' }, brandify(label)), h('span', { class: 'osof-sw-k', 'aria-hidden': 'true' }));
    b.addEventListener('click', function () { var on = b.getAttribute('aria-checked') !== 'true'; b.setAttribute('aria-checked', on ? 'true' : 'false'); onToggle(on, b); });
    return b;
  }
  function settings(opener) {
    var d = dialog({ id: 'settings', title: t('settings'), modal: false });
    if (d.isOpen()) { d.close(); return; }
    d.body.textContent = '';
    var pieces = h('div', { class: 'osof-sws', role: 'group', 'aria-label': t('settings.pieces') });
    var master = sw(prefs.on ? t('settings.on') : t('settings.off'), prefs.on, function (on, b) {
      b.firstChild.textContent = on ? t('settings.on') : t('settings.off');
      pieces.toggleAttribute('data-osof-dim', !on);
      if (on) turnOn(); else turnOff();
    }, true);
    presentGroups().forEach(function (g) {
      pieces.appendChild(sw(t('g.' + g), !prefs.hide[g], function (on) { setGroup(g, on); }));
    });
    pieces.toggleAttribute('data-osof-dim', !prefs.on);
    var forgot = h('span', { class: 'osof-small', role: 'status' });
    d.body.appendChild(h('div', { class: 'osof-settings' },
      master,
      h('h3', {}, t('settings.pieces')), pieces,
      h('p', { class: 'osof-small' }, t('settings.note'), ' ', t('settings.url')),
      h('p', { class: 'osof-small' }, h('button', { type: 'button', class: 'osof-link', on: { click: function () { api.reset(); forgot.textContent = ' ' + t('settings.forgot'); } } }, '↺ ', t('settings.forget')), forgot),
      h('p', { class: 'osof-small osof-sheet-credit' }, brandify(creditLine(data)))));
    d.open(opener);
  }
  function setGroup(g, on) {
    if (on) delete prefs.hide[g]; else prefs.hide[g] = true;
    savePrefs();
    if (state.off) return;
    if (on) { // pieces that were never mounted because the group was hidden at boot
      SLOTS.forEach(function (sl) { data.slots[sl].forEach(function (item, i) { if (groupOf(item.kind) === g && !recs.some(function (r) { return r.id === item.id; })) { var r = mount(sl, item, i); if (r && ro && r.el && (sl === 'left' || sl === 'right')) ro.observe(r.el); } }); });
    } else {
      recs.forEach(function (r) { if (groupOf(r.kind) === g) { if (openDlg && r.piece && r.piece.el && openDlg.opener && r.wrap && r.wrap.contains(openDlg.opener)) closeDialog(openDlg, false, 'hide'); try { if (r.piece && r.piece.close) r.piece.close(); } catch (e) {} } });
      if (g === 'tour') { stopTour('hide'); hideFinal(); }
    }
    applyHidden();
    schedule();
    emit('frame:settings', { on: prefs.on, hide: copy(prefs.hide) });
  }
  function applyHidden() {
    recs.forEach(function (r) { if (r.wrap) r.wrap.toggleAttribute('data-osof-hid', hiddenKind(r.kind)); });
    if (root) root.toggleAttribute('data-osof-nosig', !!prefs.hide.signature);
  }
  function mountAll() {
    state.off = false;
    root.removeAttribute('data-osof-off');
    if (dot) { dot.remove(); dot = null; }
    makeSheetBtn();
    SLOTS.forEach(function (s) { data.slots[s].forEach(function (item, i) { if (!hiddenKind(item.kind)) mount(s, item, i); }); });
    more.left = makeMore('left');
    more.right = makeMore('right');
    makeCredit();
    applyHidden();
    var first = once('entrance');
    if (first && !state.reduced) {
      var off = { 'top-left': 0, 'top-right': 0, left: 2, right: 2, 'bottom-left': 6, 'bottom-right': 6 };
      RING.forEach(function (s) { [].forEach.call(zones[s].children, function (c, i) { c.style.setProperty('--osof-i', off[s] + i); }); });
      root.classList.add('osof-enter');
      setTimeout(function () { root.classList.remove('osof-enter'); }, 300 + 40 * 26 + 1700);
    }
    recs.forEach(function (r) { if (ro && r.el && (r.slot === 'left' || r.slot === 'right')) ro.observe(r.el); });
    observeSpots();
    layout();
    if (state.outline) drawOutline();
    scheduleTour();
  }
  function unmountAll() {
    stopTour('off', true); hideFinal();
    var keep = dialogs['osof-dlg-settings'];
    if (openDlg && openDlg !== keep) closeDialog(openDlg, false, 'off');
    recs.slice().forEach(unmount);
    recs = [];
    RING.forEach(function (s) { [].slice.call(zones[s].children).forEach(function (c) { c.remove(); }); });
    [].slice.call(zones.overlay.children).forEach(function (c) { c.remove(); });
    [].slice.call(root.querySelectorAll('.osof-sig')).forEach(function (c) { c.remove(); });
    Object.keys(dialogs).forEach(function (k) { if (dialogs[k] !== keep) { dialogs[k].root.remove(); delete dialogs[k]; } });
    more = {}; creditBox = creditInfo = creditGear = sheetBtn = sheetX = null;
    if (outlineSvg) { outlineSvg.remove(); outlineSvg = null; }
  }
  function turnOff() {
    if (state.off) return;
    prefs.on = false; savePrefs();
    unmountAll();
    state.off = true;
    root.setAttribute('data-osof-off', '');
    makeDot();
    emit('frame:settings', { on: false, hide: copy(prefs.hide) });
  }
  function turnOn() {
    if (!state.off) return;
    prefs.on = true; savePrefs();
    var d = dialogs['osof-dlg-settings'], wasOpen = d && d.isOpen();
    mountAll();
    if (wasOpen) { d.opener = creditGear; place(d); if (creditGear) creditGear.setAttribute('aria-expanded', 'true'); }
    emit('frame:settings', { on: true, hide: copy(prefs.hide) });
  }
  // the frame is off: one small dot stays at an edge (never over text) and brings it back — it is also the credit mark
  function makeDot() {
    if (dot) return;
    dot = h('button', { type: 'button', class: 'osof-dot', 'aria-label': t('dot.label'), title: t('dot.tip') + ' · ' + creditLine(data), on: { click: function () { turnOn(); if (creditGear) focusEl(creditGear); } } }, h('span', { 'aria-hidden': 'true' }, '🎻'));
    root.appendChild(dot);
    placeDot();
  }
  function placeDot() {
    if (!dot) return;
    var vw = W.innerWidth, vh = W.innerHeight, S = 18, tries = [[10, vh - 10 - S], [10, Math.round(vh * 0.5)], [vw - 10 - S, vh - 10 - S], [10, 84]], pick = tries[0];
    for (var i = 0; i < tries.length; i++) { if (!textUnder(tries[i][0], tries[i][1], S)) { pick = tries[i]; break; } }
    dot.style.left = pick[0] + 'px'; dot.style.top = pick[1] + 'px';
  }

  // ── the mobile sheet (rails hide on phones; one 🎻 opens every door) ───────────
  // BUTTON LAW: the 🎻 steps below anything fixed or any text at the top-right; if no clear spot exists it folds to a
  // 17px dot for this page view; its tiny ✕ folds it on purpose (remembered); the dot brings it back.
  function makeSheetBtn() {
    sheetBtn = h('button', { type: 'button', class: 'osof-btn osof-btn-lg osof-sheetbtn', 'aria-label': t('sheet.label'), 'aria-haspopup': 'dialog', 'aria-expanded': 'false', on: { click: function () { if (sheetFolded.user || sheetFolded.text) { foldSheet(false, true); return; } openSheet(); } } },
      h('span', { class: 'osof-emo', 'aria-hidden': 'true' }, str(data.emoji) || '🎻'));
    sheetX = h('button', { type: 'button', class: 'osof-fold-x', 'aria-label': t('fold'), on: { click: function () { foldSheet(true, true); } } }, h('span', { 'aria-hidden': 'true' }, '✕'));
    sheetBtn.title = creditLine(data);
    sheetBtn.setAttribute('aria-describedby', 'osof-sheet-credit');
    zones['top-right'].appendChild(h('div', { class: 'osof-item osof-sheet-item', 'data-osof-kind': 'sheet' }, sheetBtn, sheetX, h('span', { id: 'osof-sheet-credit', hidden: true }, creditLine(data))));
    sheetFolded.user = !!store('fold').get('sheet');
    syncFold();
  }
  function foldSheet(v, byUser) {
    if (byUser) { sheetFolded.user = v; sheetFolded.text = false; if (v) store('fold').set('sheet', 1); else store('fold').del('sheet'); }
    else sheetFolded.text = v;
    syncFold();
    if (byUser) focusEl(sheetBtn);
  }
  function syncFold() {
    if (!sheetBtn) return;
    var f = sheetFolded.user || sheetFolded.text;
    sheetBtn.classList.toggle('osof-fold', f);
    sheetBtn.setAttribute('aria-label', f ? t('unfold') : t('sheet.label'));
    if (f) sheetBtn.removeAttribute('aria-haspopup'); else sheetBtn.setAttribute('aria-haspopup', 'dialog');
    sheetX.hidden = f;
  }
  function openSheet() {
    var d = dialog({ id: 'sheet', title: data.name });
    if (d.isOpen()) { d.close(); return; }
    d.body.textContent = '';
    var tiles = [], faces = [];
    var order = ['top-right', 'left', 'right', 'bottom-left'];
    var list = [];
    order.forEach(function (s) { recs.forEach(function (r) { if (r.slot === s && live(r) && !r.spot && r.kind !== 'tour') list.push(r); }); });
    recs.forEach(function (r) { if (r.kind === 'tour' && live(r)) list.push(r); });
    list.forEach(function (r) {
      var t1 = r.piece && typeof r.piece.tile === 'function' ? r.piece.tile() : null;
      if (t1) { [].concat(t1).forEach(function (x) { if (x && x.nodeType === 1) { hookTile(x, d); (x.getAttribute('data-osof-face') != null ? faces : tiles).push(x); } }); return; }
      if (r.kind === 'totem' && Array.isArray(r.item.faces) && listening('chat:open')) {
        r.item.faces.forEach(function (f) { if (isObj(f)) faces.push(faceTile(r, f, d)); });
        return;
      }
      var tl = genericTile(r, d);
      if (tl) tiles.push(tl);
    });
    d.body.appendChild(h('div', { class: 'osof-tiles' }, tiles));
    if (faces.length) d.body.appendChild(h('div', { class: 'osof-sheet-sec' }, h('h3', {}, brandify(t('sheet.talk'))), h('div', { class: 'osof-tiles osof-faces' }, faces)));
    d.body.appendChild(h('p', { class: 'osof-small osof-sheet-credit' }, brandify(creditLine(data))));
    d.open(sheetBtn);
  }
  function hookTile(el, d) { el.addEventListener('click', function () { if (d.isOpen()) closeDialog(d, false, 'tile'); }); }
  function genericTile(r, d) {
    var it = r.item, href = resolveURL(it.href, dataURL), canOpen = r.piece && typeof r.piece.open === 'function';
    var kids = [h('span', { class: 'osof-tile-emo', 'aria-hidden': 'true' }, emojiOf(r)), h('span', { class: 'osof-tile-lbl' }, brandify(labelOf(r)))];
    if (!canOpen && !href) return null;
    if (!canOpen) return h('a', { class: 'osof-tile', href: href, target: it.newTab ? '_blank' : null, rel: it.newTab ? 'noopener' : null }, kids);
    return h('button', { type: 'button', class: 'osof-tile', on: { click: function () { closeDialog(d, false, 'tile'); openRec(r, sheetBtn); } } }, kids);
  }
  function faceTile(r, f, d) {
    var c = /^#[0-9a-f]{3,8}$/i.test(str(f.c)) ? f.c : '#fbe2a0';
    return h('button', { type: 'button', class: 'osof-tile osof-face', 'data-osof-face': str(f.k), style: '--osof-face:' + c, on: { click: function () {
      closeDialog(d, false, 'tile');
      emit('chat:open', { line: { hub: str(r.item.hub), face: str(f.k), name: str(f.n), emoji: str(f.e), color: c, storage: 'totem', route: str(r.item.route) || 'prefix' }, opener: sheetBtn });
    } } }, h('span', { class: 'osof-tile-emo', 'aria-hidden': 'true' }, str(f.e) || '🗿'), h('span', { class: 'osof-tile-lbl' }, str(f.n)));
  }

  // ── layout engine ─────────────────────────────────────────────────────────────
  function isMobileNow() { return mq('(max-width: 720px)') || (mq('(pointer: coarse)') && W.innerHeight < 560); }
  function schedule() {
    if (layoutQueued || !root) return;
    layoutQueued = true;
    (W.requestAnimationFrame || setTimeout)(function () { layoutQueued = false; layout(); });
  }
  function union(a, r) {
    if (!r) return a;
    if (r.width === undefined) r = { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.right - r.left, height: r.bottom - r.top };
    if (r.width < 1 || r.height < 1) return a;
    if (!a) return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
    return { top: Math.min(a.top, r.top), bottom: Math.max(a.bottom, r.bottom), left: Math.min(a.left, r.left), right: Math.max(a.right, r.right) };
  }
  // the ʻŌlelo button (lang.js) lives at the top-left on every door; the left rail starts below it
  function langButton() {
    var host = D.getElementById('olelo'), b = host && host.shadowRoot ? host.shadowRoot.getElementById('b') : null;
    return b || D.getElementById('olang');
  }
  function extent(slot) {
    var e = null;
    var z = zones[slot];
    if (z) [].forEach.call(z.children, function (c) { if (!c.hidden && !c.classList.contains('osof-dlg')) e = union(e, c.getBoundingClientRect()); });
    recs.forEach(function (r) {
      if (r.slot !== slot || !live(r)) return;
      if (r.spot) spotEls(r).forEach(function (el) { e = union(e, el.getBoundingClientRect()); });
      if (r.piece && typeof r.piece.target === 'function') { var tg = r.piece.target(); if (tg && isVisible(tg)) e = union(e, tg.getBoundingClientRect()); }
    });
    if (slot === 'top-left') { var lb = langButton(); if (lb && isVisible(lb)) e = union(e, lb.getBoundingClientRect()); }
    return e;
  }
  // BUTTON LAW (19 Nov 2026): a floating button never covers text. What sits under a square at (x,y,size)?
  // → the rect of a text block (> 20 characters) or of a small fixed/sticky control of the page; null when clear.
  function ownTextLen(a) {                                       // characters in the element's OWN text nodes (any tag)
    var n = 0, c = a.childNodes;
    for (var i = 0; i < c.length; i++) if (c[i].nodeType === 3) n += (c[i].nodeValue || '').replace(/\s+/g, ' ').trim().length;
    return n;
  }
  // ours = the frame itself and the ʻŌlelo host (#olelo). The LEGACY 🌐 corner (#olang) is page content: its label bar
  // ("every language — on a Planet We Share As One") is words the 🎻 must not sit on (blessingpool.com at 390px).
  function ours(a) { return (root && root.contains(a)) || a.id === 'olelo' || a.id === 'oso-frames'; }
  function textUnder(x, y, size, textOnly) {
    if (!D.elementsFromPoint) return null;
    var vw = W.innerWidth, vh = W.innerHeight, pts = [], gx = [x + 2, x + size / 2, x + size - 2], gy = [y + 2, y + size / 2, y + size - 2];
    for (var gi = 0; gi < 3; gi++) for (var gj = 0; gj < 3; gj++) pts.push([gx[gi], gy[gj]]);        // a 3×3 grid: a sliver of a link row under one edge counts
    for (var k = 0; k < pts.length; k++) {
      if (pts[k][0] < 0 || pts[k][1] < 0 || pts[k][0] >= vw || pts[k][1] >= vh) continue;
      var els = D.elementsFromPoint(pts[k][0], pts[k][1]);
      for (var j = 0; j < els.length; j++) {
        var el = els[j];
        if (el === D.body || el === D.documentElement) continue;
        for (var a = el; a && a !== D.body && a !== D.documentElement; a = a.parentElement) {
          if (ours(a)) break;
          var cs = W.getComputedStyle(a);
          if (cs.visibility === 'hidden' || +cs.opacity < 0.05) break;
          var tl = TEXT_TAGS[a.tagName] ? (a.innerText || '').replace(/\s+/g, ' ').trim().length : ownTextLen(a);
          if (tl > 2) {                                            // words are words: a 16-char link, a <div class=kick> kicker — any tag
            var tr = a.getBoundingClientRect();
            if (tr.width * tr.height > 200 && tr.width * tr.height < vw * vh * 0.45) return tr;
          }
          if (!textOnly && (cs.position === 'fixed' || cs.position === 'sticky')) {
            var r = a.getBoundingClientRect();
            if (r.width * r.height > vw * vh * 0.35) break;                          // a background layer, not a control
            if (cs.pointerEvents === 'none' && r.height > 160) break;
            return r;
          }
        }
      }
    }
    return null;
  }
  // step below any small fixed/sticky bar — or text — of the page that sits where a top corner wants to be
  function clearTop(side, y0, size) {
    var x = side === 'left' ? 10 : W.innerWidth - 10 - size, y = y0, blocked = false;
    for (var k = 0; k < 8; k++) {
      var hit = textUnder(x, y, size);
      if (!hit) break;
      y = Math.ceil(hit.bottom) + 8;
    }
    if (y > W.innerHeight * 0.4 || textUnder(x, y, size)) { y = y0; blocked = true; }
    return { y: y, blocked: blocked };
  }
  // a folded 🎻 (20px dot) looks for a clear spot down the right edge: the first y with nothing under it, else the top corner
  function dotSpot(x, y0) {
    var vh = W.innerHeight, tries = [y0, 8, 30, 52], y;
    for (y = 96; y < vh * 0.6; y += 44) tries.push(y);
    for (var i = 0; i < tries.length; i++) if (!textUnder(x, tries[i], 20)) return tries[i];
    return 8;
  }
  // the page's own fixed widgets near a corner (an old 🎻 corner, a chat FAB, a mini player): rails keep clear of them
  function cornerStuff(slot) {
    var vw = W.innerWidth, vh = W.innerHeight, e = null, seen = [];
    if (!D.elementsFromPoint) return null;
    var left = /left/.test(slot), top = /top/.test(slot);
    for (var dx = 20; dx <= 92; dx += 36) for (var dy = 12; dy <= 300; dy += 36) {
      var x = left ? dx : vw - dx, y = top ? dy : vh - dy;
      if (x < 0 || x >= vw || y < 0 || y >= vh) continue;
      var els = D.elementsFromPoint(x, y);
      for (var j = 0; j < els.length; j++) {
        var a = els[j];
        if (a === D.body || a === D.documentElement || ours(a) || seen.indexOf(a) >= 0) continue;
        var f = a; while (f && f !== D.body && !ours(f)) { var cs = W.getComputedStyle(f); if (cs.position === 'fixed' || cs.position === 'sticky') break; f = f.parentElement; }
        if (!f || f === D.body || ours(f)) continue;
        seen.push(a);
        var r = f.getBoundingClientRect(), cf = W.getComputedStyle(f);
        if (r.width * r.height < vw * vh * 0.2 && r.width < vw * 0.5 && cf.visibility !== 'hidden' && +cf.opacity > 0.05 && cf.pointerEvents !== 'none') e = union(e, r);
        break;
      }
    }
    return e;
  }
  // are the rails about to sit on the page's text? (narrow windows, edge-to-edge paragraphs) → fold into the 🎻 sheet
  function railsCrowded(top0) {
    var vw = W.innerWidth, vh = W.innerHeight, hits = 0, size = 46;
    if (!D.elementsFromPoint || vw < 721) return false;
    for (var side = 0; side < 2; side++) {
      var x = side ? vw - 10 - size : 10, n = 0;
      for (var y = top0 + 20; y < vh - 90 && n < 3; y += 72) if (textUnder(x, y, size, true)) n++;
      hits = Math.max(hits, n);
    }
    return hits >= 2;
  }
  function layout() {
    if (!root) return;
    if (state.off) { placeDot(); if (openDlg) place(openDlg); return; }
    var size0 = 54, top00 = 74;
    var narrow = isMobileNow();
    // a page that renders zoomed-out on a phone (a column wider than the screen: the layout viewport outgrows the visual one): its words are tiny and
    // everywhere — the frame folds into the 🎻 sheet and keeps the credit inside it rather than sit on the words
    var vv = W.visualViewport;
    state.zoomedOut = mq('(pointer: coarse)') && !!((vv && vv.width > 0 && vv.width < W.innerWidth * 0.8) || (W.screen && W.screen.width > 0 && W.innerWidth > W.screen.width * 1.3));
    state.crowded = !narrow && (state.zoomedOut || railsCrowded(top00));
    var mobile = narrow || state.crowded;
    root.toggleAttribute('data-osof-crowded', state.crowded);
    if (mobile !== state.mobile) {
      state.mobile = mobile;
      root.setAttribute('data-mode', mobile ? 'mobile' : 'desktop');
      if (openDlg && openDlg.root.id !== 'osof-dlg-sheet') place(openDlg);
      emit('frame:mode', { mobile: mobile });
    }
    var reduced = mq('(prefers-reduced-motion: reduce)');
    if (reduced !== state.reduced) { state.reduced = reduced; root.setAttribute('data-motion', reduced ? 'reduced' : 'full'); }
    emit('frame:layout', { mobile: mobile });
    var size = narrow ? 44 : size0, top0 = narrow ? 52 : top00;
    var ct = clearTop('right', top0, size);
    root.style.setProperty('--osof-top-r', ct.y + 'px');
    if (mobile) {
      if (sheetFolded.text !== ct.blocked && !sheetFolded.user) foldSheet(ct.blocked, false);
      if (sheetFolded.text || sheetFolded.user) root.style.setProperty('--osof-top-r', dotSpot(W.innerWidth - 8 - 20, ct.y) + 'px');   // the dot, too, sits on no words
    }
    placeCredit(mobile);
    stackCorners(mobile);
    if (!mobile) {
      var vh = W.innerHeight;
      var tl = union(extent('top-left'), cornerStuff('top-left')), tr = union(extent('top-right'), cornerStuff('top-right'));
      var bl = union(extent('bottom-left'), cornerStuff('bottom-left')), br = union(extent('bottom-right'), cornerStuff('bottom-right'));
      fitRail('left', (tl ? Math.max(tl.bottom, top0) : top0) + 14, (bl ? Math.min(bl.top, vh - 10) : vh - 10) - 14);
      fitRail('right', (tr ? Math.max(tr.bottom, top0) : top0) + 14, (br ? Math.min(br.top, vh - 10) : vh - 10) - 14);
    }
    keepOffText(mobile);
    if (openDlg) place(openDlg);
    if (state.outline) drawOutline();
    if (tour.active && tour.cur) showStep(tour.cur, true);
  }
  // BUTTON LAW at the bottom edge: a pill that would sit on the page's words tucks away for this layout (desktop); on phones the
  // credit mark shrinks to its icons (🎻 · i · ⚙) when words run under it — the credit stays visible, the words stay readable
  function rectHasText(r) {
    // a grid of small probes over the whole rect (a kicker line under the bottom edge counts too)
    var S = 12, h = r.height || 32, ys = [r.top + 2, r.top + h / 2 - S / 2, r.top + h - S - 2];
    for (var i = 0; i < ys.length; i++) {
      for (var x = r.left; x <= r.right - S + 1; x += 22) if (textUnder(x, ys[i], S, true)) return true;
      if (textUnder(Math.max(r.left, r.right - S), ys[i], S, true)) return true;
    }
    return false;
  }
  function keepOffText(mobile) {
    recs.forEach(function (r) {
      if (r.kind !== 'pill' || !r.wrap) return;
      if (mobile || !live(r)) { r.wrap.removeAttribute('data-osof-tuck'); return; }
      r.wrap.removeAttribute('data-osof-tuck');
      var b = r.wrap.getBoundingClientRect();
      if (b.width > 2 && rectHasText(b)) r.wrap.setAttribute('data-osof-tuck', '');
    });
  }
  // the credit mark (always visible, AGPL §7(b)) and the BUTTON LAW: words under it → on desktops it steps up the left edge to
  // the first clear spot (the rail fits above it); with no clear spot, or on phones, it shrinks to its icons (🎻 · i · ⚙)
  function placeCredit(mobile) {
    var z = zones['bottom-left'];
    z.style.bottom = '';
    root.removeAttribute('data-osof-credit-folded');
    if (!creditBox) return;
    creditBox.classList.remove('osof-credit-mini');
    var c = creditBox.getBoundingClientRect(), vh = W.innerHeight;
    if (state.zoomedOut && sheetBtn) { root.setAttribute('data-osof-credit-folded', ''); return; }
    if (c.width < 2 || !rectHasText(c)) return;
    var step = c.height + 10, k, y;
    for (k = 1; k <= 10; k++) {                                  // step up the left edge to the first clear spot
      y = c.top - k * step;
      if (y < vh * 0.45) break;
      if (!rectHasText({ left: c.left, right: c.right, top: y, height: c.height })) { z.style.bottom = Math.round(vh - (y + c.height)) + 'px'; return; }
    }
    creditBox.classList.add('osof-credit-mini');                  // icons only (🎻 · i · ⚙)
    var m = creditBox.getBoundingClientRect();
    if (!rectHasText(m)) return;
    for (k = 1; k <= 10; k++) {
      y = m.top - k * (m.height + 10);
      if (y < vh * 0.45) break;
      if (!rectHasText({ left: m.left, right: m.right, top: y, height: m.height })) { z.style.bottom = Math.round(vh - (y + m.height)) + 'px'; return; }
    }
    // phones: no clear spot at all (a words panel fills the screen) → the credit folds INTO the 🎻 sheet button, which carries
    // the credit line (title + description) and whose sheet shows it in full — AGPL §7(b) stays visible, the words stay readable
    if (mobile && sheetBtn) { root.setAttribute('data-osof-credit-folded', ''); creditBox.classList.remove('osof-credit-mini'); }
  }
  // phones: when the bottom-right pieces (chat, radio dock) reach across the bottom-left credit, the credit steps up above them
  function stackCorners(mobile) {
    var z = zones['bottom-left'];
    if (!mobile || z.style.bottom) return;
    var br = extent('bottom-right'), bl = z.getBoundingClientRect();
    if (!br || bl.width < 2 || br.left > bl.right + 6 || br.top > bl.bottom || br.bottom < bl.top) return;
    var lift = Math.round(W.innerHeight - br.top + 8), y = W.innerHeight - lift - bl.height, S = Math.min(bl.height, 32);
    // BUTTON LAW: step up only onto a clear spot (probed across the credit's whole width); if words live there, stay put
    if (y < 60) return;
    for (var x = bl.left; x <= bl.right - S + 1; x += S) if (textUnder(x, y, S, true)) return;
    if (textUnder(bl.right - S, y, S, true)) return;
    z.style.bottom = lift + 'px';
  }
  function fitRail(side, top, bottom) {
    var z = zones[side], m = more[side];
    var list = recs.filter(function (r) { return r.slot === side && r.wrap && live(r); });
    list.forEach(function (r) { r.wrap.hidden = false; r.overflowed = false; r.wrap.style.marginLeft = r.wrap.style.marginRight = ''; });
    m.wrap.hidden = true;
    var avail = Math.max(0, Math.floor(bottom - top));
    z.style.top = Math.round(top) + 'px';
    z.style.height = avail + 'px';
    var hs = list.map(function (r) { return r.wrap.offsetHeight; });
    var fit = fitColumn(hs, avail, 10, 22, 46);
    list.forEach(function (r, i) { if (i >= fit.n) { r.wrap.hidden = true; r.overflowed = true; } });
    m.wrap.hidden = !(fit.more && fit.n < list.length);
    z.style.gap = fit.gap + 'px';
    // an item wider than the rail (the theater TV) stays at least 6px away from the screen edge
    var edge = side === 'left' ? z.getBoundingClientRect().left : W.innerWidth - z.getBoundingClientRect().right;
    list.forEach(function (r) {
      if (r.wrap.hidden) return;
      var w = r.wrap.offsetWidth, shift = Math.max(0, 6 - (edge + 27 - w / 2));
      if (shift) r.wrap.style[side === 'left' ? 'marginLeft' : 'marginRight'] = Math.ceil(shift * 2) + 'px';
    });
  }

  // ── the tour: one caption per button, cross-faded; Esc or Skip ends it ─────────
  var tour = { active: false, auto: false, steps: [], i: -1, timer: 0, cur: null, caps: null, flip: 0, bar: null, count: null, halo: null };
  var finalEl = null, finalTimer = 0;
  function tourUI() {
    if (tour.caps) return;
    tour.caps = [h('div', { class: 'osof-cap', 'aria-hidden': 'true' }), h('div', { class: 'osof-cap', 'aria-hidden': 'true' })];
    tour.halo = h('div', { class: 'osof-halo', 'aria-hidden': 'true', hidden: true });
    tour.count = h('span', { class: 'osof-count', 'aria-hidden': 'true' });
    tour.bar = h('div', { class: 'osof-tourbar', role: 'group', 'aria-label': t('tour.title'), hidden: true },
      h('span', { class: 'osof-tourbar-t' }, h('span', { 'aria-hidden': 'true' }, '✨ '), t('tour.title')), tour.count,
      h('button', { type: 'button', class: 'osof-skip', on: { click: function () { stopTour('skip'); } } }, t('tour.skip'), h('span', { 'aria-hidden': 'true' }, ' ✕')));
    root.appendChild(tour.halo); root.appendChild(tour.caps[0]); root.appendChild(tour.caps[1]); root.appendChild(tour.bar);
  }
  function stepFor(r) {
    if (r.core === 'more') {
      var names = recs.filter(function (x) { return x.slot === r.side && x.overflowed && live(x); }).map(labelOf);
      return { title: t('more.title'), text: fmt(t('more.tip'), { list: names.join(', ') }), target: function () { return more[r.side].btn; } };
    }
    if (r.core === 'credit') return { title: '🎻 frame by the ʻohana', text: t('credit.tip'), target: function () { return creditBox; } };
    if (r.core === 'sheet') return { title: t('sheet.label'), text: t('sheet.tip'), target: function () { return sheetBtn; } };
    if (r.spot) {
      if (!r.item.tip) return null;
      return { title: str(r.item.label) || str(r.item.title), text: str(r.item.tip), target: function () { return spotEls(r)[0] || null; } };
    }
    if (r.overflowed || !r.piece) return null;
    var text = has(r.piece, 'tour') ? r.piece.tour : undefined;
    if (text === null) return null;
    if (text === undefined || text === '') text = str(r.item.tip) || labelOf(r);
    var tg = typeof r.piece.target === 'function' ? r.piece.target : function () { return r.el; };
    return { title: labelOf(r), text: String(text), target: tg };
  }
  function tourSteps() {
    var out = [];
    RING.forEach(function (slot) {
      var list = state.mobile && slot === 'top-right' ? [] : recs.filter(function (r) { return r.slot === slot && live(r); });
      if (!state.mobile && (slot === 'left' || slot === 'right') && more[slot] && !more[slot].wrap.hidden) list.push({ core: 'more', side: slot });
      if (slot === 'bottom-left') list.push({ core: 'credit' });
      if (state.mobile && slot === 'top-right') list.push({ core: 'sheet' });
      if (UPWARD[slot]) list.reverse();
      list.forEach(function (r) { var s = stepFor(r); if (s && s.text) out.push(s); });
    });
    return out;
  }
  function targetRect(step) {
    var el = null;
    try { el = step.target(); } catch (e) {}
    if (!el || !isVisible(el)) return null;
    var r = el.getBoundingClientRect();
    return onScreen(r) ? { r: r, el: el } : null;
  }
  function dwell(step) { return Math.min(2600, 1500 + Math.max(0, (step.title + step.text).length - 48) * 16); }
  function startTour(auto) {
    if (state.off || prefs.hide.tour) return false;
    stopTour('restart', true);
    hideFinal();
    if (openDlg && !auto) closeDialog(openDlg, false, 'tour');
    tourUI();
    var steps = tourSteps();
    if (!steps.length) return false;
    tour.active = true; tour.auto = !!auto; tour.steps = steps; tour.i = -1; tour.cur = null;
    tour.bar.hidden = false;
    emit('tour:start', { auto: !!auto, steps: steps.length });
    nextStep();
    return true;
  }
  function nextStep() {
    if (!tour.active) return;
    var s = null;
    while (++tour.i < tour.steps.length) { if (targetRect(tour.steps[tour.i])) { s = tour.steps[tour.i]; break; } }
    if (!s) { stopTour('done'); finalCard(); return; }
    showStep(s, false);
    tour.timer = setTimeout(nextStep, dwell(s));
  }
  function showStep(s, again) {
    var tr = targetRect(s);
    if (!tr) return;
    var cap;
    if (again) cap = tour.caps[tour.flip];
    else {
      var old = tour.caps[tour.flip];
      tour.flip = 1 - tour.flip;
      cap = tour.caps[tour.flip];
      cap.textContent = '';
      if (s.title) cap.appendChild(h('b', {}, brandify(s.title)));
      cap.appendChild(h('span', {}, brandify(s.text)));
      old.classList.remove('on');
    }
    tour.cur = s;
    tour.count.textContent = (tour.i + 1) + ' / ' + tour.steps.length;
    placeCap(cap, tr.r);
    cap.classList.add('on');
    halo(tr.el, tr.r, !again);
  }
  function placeCap(cap, r) {
    var vw = W.innerWidth, vh = W.innerHeight, w = cap.offsetWidth, hh = cap.offsetHeight, gap = 16;
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2, side, left, top;
    if (state.mobile) side = cy > vh * 0.55 ? 'above' : 'below';
    else side = cx < vw / 2 ? 'right' : 'left';
    if (side === 'right') { left = r.right + gap; top = cy - hh / 2; }
    else if (side === 'left') { left = r.left - gap - w; top = cy - hh / 2; }
    else if (side === 'above') { left = cx - w / 2; top = r.top - gap - hh; }
    else { left = cx - w / 2; top = r.bottom + gap; }
    left = clamp(left, 8, Math.max(8, vw - w - 8));
    top = clamp(top, 8, Math.max(8, vh - hh - 8));
    cap.setAttribute('data-side', side);
    cap.style.left = Math.round(left) + 'px';
    cap.style.top = Math.round(top) + 'px';
    cap.style.setProperty('--osof-ay', Math.round(clamp(cy - top, 16, hh - 16)) + 'px');
    cap.style.setProperty('--osof-ax', Math.round(clamp(cx - left, 16, w - 16)) + 'px');
  }
  function halo(el, r, pulse) {
    var hl = tour.halo, pad = 5;
    var br = parseFloat(W.getComputedStyle(el).borderTopLeftRadius) || 0;
    var round = br >= Math.min(r.width, r.height) / 2 - 1;
    hl.style.left = (r.left - pad) + 'px'; hl.style.top = (r.top - pad) + 'px';
    hl.style.width = (r.width + pad * 2) + 'px'; hl.style.height = (r.height + pad * 2) + 'px';
    hl.style.borderRadius = round ? '999px' : (br + pad) + 'px';
    hl.hidden = false;
    if (pulse && !state.reduced) { hl.classList.remove('glow'); void hl.offsetWidth; hl.classList.add('glow'); }
  }
  function stopTour(why, silent) {
    if (!tour.active) return;
    clearTimeout(tour.timer);
    tour.active = false; tour.cur = null;
    if (tour.caps) { tour.caps[0].classList.remove('on'); tour.caps[1].classList.remove('on'); }
    if (tour.halo) { tour.halo.hidden = true; tour.halo.classList.remove('glow'); }
    if (tour.bar) tour.bar.hidden = true;
    if (!silent) emit('tour:end', { why: why });
  }
  function tourRec() { for (var i = 0; i < recs.length; i++) if (recs[i].kind === 'tour' && live(recs[i])) return recs[i]; return null; }
  function walkVideo() {
    var tr = tourRec(), v = tr && isObj(tr.item.video) ? tr.item.video : null;
    if (!v) recs.forEach(function (r) { if (!v && r.kind === 'theater' && isObj(r.item.video)) v = r.item.video; });
    return v && resolveURL(v.src, dataURL, true) ? v : null;
  }
  function durWord(d) {
    var m = /^\s*(\d+)\s*(s|sec|secs|seconds?)\s*$/i.exec(str(d)); if (m) return m[1] + '-second';
    m = /^\s*(\d+)\s*(m|min|mins|minutes?)\s*$/i.exec(str(d)); if (m) return m[1] + '-minute';
    return '';
  }
  function finalCard() {
    var tr = tourRec(), anchor = state.mobile ? sheetBtn : (tr && tr.el) || sheetBtn;
    if (!anchor || !isVisible(anchor)) anchor = null;
    var v = walkVideo();
    hideFinal();
    finalEl = h('div', { class: 'osof-final', role: 'group', 'aria-label': t('tour.title') },
      h('p', {}, h('b', {}, t('tour.done')), ' ', t('tour.replay')),
      v ? h('button', { type: 'button', class: 'osof-watch', on: { click: function () { var o = anchor; hideFinal(); walkthrough(o); } } }, fmt(t('tour.watch'), { d: durWord(v.duration) })) : null,
      h('button', { type: 'button', class: 'osof-x', 'aria-label': t('close'), on: { click: hideFinal } }, '✕'));
    root.appendChild(finalEl);
    var w = finalEl.offsetWidth, hh = finalEl.offsetHeight, vw = W.innerWidth, vh = W.innerHeight, left, top;
    if (anchor) {
      var r = anchor.getBoundingClientRect();
      if (state.mobile) { left = vw - w - 8; top = r.bottom + 14; } else { left = r.left - 16 - w; top = r.top + r.height / 2 - hh / 2; }
      tourUI(); halo(anchor, r, true);
    } else { left = (vw - w) / 2; top = vh - hh - 90; }
    finalEl.style.left = Math.round(clamp(left, 8, vw - w - 8)) + 'px';
    finalEl.style.top = Math.round(clamp(top, 8, vh - hh - 8)) + 'px';
    var el = finalEl;
    (W.requestAnimationFrame || setTimeout)(function () { el.classList.add('on'); });
    var hold = function () { return el.matches(':hover') || el.contains(D.activeElement); };
    var fade = function () { if (finalEl !== el) return; if (hold()) { finalTimer = setTimeout(fade, 1500); return; } hideFinal(); };
    finalTimer = setTimeout(fade, 6000);
  }
  function hideFinal() {
    clearTimeout(finalTimer);
    if (tour.halo && !tour.active) { tour.halo.hidden = true; tour.halo.classList.remove('glow'); }
    if (!finalEl) return;
    var el = finalEl; finalEl = null;
    el.classList.remove('on');
    setTimeout(function () { el.remove(); }, state.reduced ? 0 : 320);
  }
  function walkthrough(opener) {
    var v = walkVideo();
    if (!v) return;
    var d = dialog({ id: 'walkthrough', title: t('tour.video'), wide: true, onClose: function () { var x = d.body.querySelector('video'); if (x) try { x.pause(); } catch (e) {} } });
    if (!d.body.firstChild) {                                    // built on first open: no bytes before a click
      var src = resolveURL(v.src, dataURL, true), cap = resolveURL(v.captions, dataURL, true), poster = resolveURL(v.poster, dataURL, true);
      var cross = cap && new URL(cap).origin !== W.location.origin;
      var video = h('video', { class: 'osof-video', controls: true, preload: 'none', playsinline: true, poster: poster || null, crossorigin: cross ? 'anonymous' : null, src: src },
        cap ? h('track', { kind: 'captions', srclang: 'en', label: 'English', src: cap, default: true }) : null);
      d.body.appendChild(video);
      d.body.appendChild(h('p', { class: 'osof-small' }, str(v.duration) ? str(v.duration) + ' · ' : '', h('a', { href: src, download: '' }, t('tour.download'))));
    }
    d.open(opener);
  }
  function scheduleTour() {
    if (state.outline || state.off || prefs.hide.tour || !once.peek('tour')) return;
    var sig = recs.some(function (r) { return r.kind === 'signature'; }) && once.got('signature') === true;
    var done = false, offSig = null, offPanel = null;
    function go() {
      if (done) return;
      if (D.hidden) { D.addEventListener('visibilitychange', function v() { if (!D.hidden) { D.removeEventListener('visibilitychange', v); go(); } }); return; }
      if (openDlg) { if (!offPanel) offPanel = on('panel:close', function () { offPanel(); offPanel = null; setTimeout(go, 1500); }); return; }
      done = true;
      if (offSig) offSig();
      if (once('tour')) startTour(true);
    }
    if (sig) offSig = on('signature:end', function () { setTimeout(go, 350); });
    setTimeout(go, sig ? 8200 : 5500);
  }

  // ── outline mode: hand-drawn cyan strokes + slot labels (echoing Shaka's markup) ──
  var outlineSvg = null;
  function rng(seed) { var s = (seed >>> 0) || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10007) / 10007; }; }
  function wobble(pts, seed, amp) {             // pts: [[x,y],…] → a pen-like path through them
    var rand = rng(seed), out = [], ph1 = rand() * 6.28, ph2 = rand() * 6.28, dist = 0;
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy) || 1;
      var n = Math.max(1, Math.round(len / 24)), nx = -dy / len, ny = dx / len;
      for (var j = 0; j < n; j++) {
        var k = j / n, d = dist + len * k;
        var off = amp * (Math.sin(d / 37 + ph1) * 0.65 + Math.sin(d / 13 + ph2) * 0.35) + (rand() - 0.5) * amp * 0.5;
        out.push([a[0] + dx * k + nx * off, a[1] + dy * k + ny * off]);
      }
      dist += len;
    }
    out.push(pts[pts.length - 1]);
    var dd = 'M' + out[0][0].toFixed(1) + ' ' + out[0][1].toFixed(1);
    for (var m = 1; m < out.length - 1; m++) {
      var mx = (out[m][0] + out[m + 1][0]) / 2, my = (out[m][1] + out[m + 1][1]) / 2;
      dd += 'Q' + out[m][0].toFixed(1) + ' ' + out[m][1].toFixed(1) + ' ' + mx.toFixed(1) + ' ' + my.toFixed(1);
    }
    var last = out[out.length - 1];
    return dd + 'L' + last[0].toFixed(1) + ' ' + last[1].toFixed(1);
  }
  function boxPts(b, rad, over) {               // a rounded box drawn in one stroke that overshoots its start
    var l = b.left, r = b.right, tp = b.top, bt = b.bottom, c = Math.min(rad, (r - l) / 2, (bt - tp) / 2), p = [];
    p.push([l + c, tp - 1], [r - c, tp], [r - c * 0.3, tp + c * 0.3], [r, tp + c], [r + 1, bt - c], [r - c * 0.3, bt - c * 0.3], [r - c, bt],
      [l + c, bt + 1], [l + c * 0.3, bt - c * 0.3], [l, bt - c], [l - 1, tp + c], [l + c * 0.3, tp + c * 0.3], [l + c + over, tp - 2]);
    return p;
  }
  function slotNote(slot) {
    var list = recs.filter(function (r) { return r.slot === slot && live(r); });
    var count = {};
    list.forEach(function (r) { var k = r.spot ? 'spot' : r.kind; count[k] = (count[k] || 0) + 1; });
    var words = Object.keys(count).map(function (k) { return count[k] > 1 ? count[k] + ' ' + k + 's' : k; });
    if (slot === 'bottom-left') words.push('credit');
    if (more[slot] && !more[slot].wrap.hidden) words.push('⋯');
    return slot + (words.length ? ' · ' + words.join(' + ') : '');
  }
  function drawOutline() {
    if (outlineSvg) { outlineSvg.remove(); outlineSvg = null; }
    if (!state.outline || !root) return;
    var vw = W.innerWidth, vh = W.innerHeight;
    var svg = h('svg', { class: 'osof-outline', 'aria-hidden': 'true', focusable: 'false', width: vw, height: vh, viewBox: '0 0 ' + vw + ' ' + vh });
    var ink = h('g', { class: 'osof-ink' }), notes = h('g', { class: 'osof-notes' });
    var stroke = function (d, cls) { ink.appendChild(h('path', { d: d, class: cls || '' })); };
    var note = function (x, y, txt, anchor) { notes.appendChild(h('text', { x: Math.round(x), y: Math.round(y), 'text-anchor': anchor || 'start' }, txt)); };
    var seed = 11, boxes = {};
    RING.forEach(function (slot) {
      var e = slot === 'left' || slot === 'right' ? (state.mobile ? null : zones[slot].getBoundingClientRect()) : extent(slot);
      if (!e || (e.bottom - e.top) < 4) return;
      var b = { left: e.left - 7, right: e.right + 7, top: e.top - 7, bottom: e.bottom + 7 };
      boxes[slot] = b;
      stroke(wobble(boxPts(b, 16, 9), seed += 7, 1.6));
      stroke(wobble(boxPts(b, 16, -4), seed += 7, 2.2), 'osof-ink2');
    });
    var tl = boxes['top-left'], tr = boxes['top-right'], bl = boxes['bottom-left'], br = boxes['bottom-right'];
    var yTop = 26, yBot = vh - 22;
    stroke(wobble([[tl ? tl.right + 18 : 60, yTop + 6], [vw * 0.3, yTop - 4], [vw * 0.55, yTop + 3], [tr ? tr.left - 18 : vw - 60, yTop - 2]], seed += 7, 3));
    stroke(wobble([[bl ? bl.right + 18 : 60, yBot], [vw * 0.45, yBot - 3], [br ? br.left - 18 : vw - 60, yBot + 1]], seed += 7, 3));
    Object.keys(boxes).forEach(function (slot) {
      var b = boxes[slot], txt = slotNote(slot);
      if (slot === 'left' || slot === 'top-left' || slot === 'bottom-left') note(b.right + 10, slot === 'bottom-left' ? b.top - 8 : b.top + 18, txt);
      else note(b.left - 10, slot === 'bottom-right' ? b.top - 8 : b.top + 18, txt, 'end');
    });
    var sig = recs.filter(function (r) { return r.kind === 'signature'; })[0];
    if (sig && !state.mobile) note(vw - 34, br ? br.top - 120 : vh - 200, 'overlay · signature, once', 'end');
    note(vw / 2, vh / 2, t('outline.page'), 'middle');
    svg.appendChild(ink); svg.appendChild(notes);
    root.appendChild(svg);
    outlineSvg = svg;
  }

  // ── the ✨ tour item (a core kind): "every description, as one button" ─────────
  function defineTour() {
    kinds.tour = function (ctx, item) {
      var label = str(item.label) || t('tour');
      var b = ctx.h('button', { type: 'button', class: 'osof-btn osof-tourbtn', 'aria-label': label, 'aria-describedby': null, on: { click: function () { startTour(false); } } },
        ctx.h('span', { class: 'osof-emo', 'aria-hidden': 'true' }, str(item.emoji) || '✨'),
        ctx.h('span', { class: 'osof-lbl', 'aria-hidden': 'true' }, label));
      return { el: b, tour: str(item.tip) || t('tour.tip'), open: function () { startTour(false); } };
    };
  }

  // ── CSS (every selector starts with #oso-frames; light DOM so translators can read it) ──
  var SERIF = 'Georgia,"Iowan Old Style","Palatino Linotype",Palatino,"Times New Roman",serif';
  var SANS = 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  var EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';
  function coreCSS() {
    var F = '#oso-frames';
    return [
      F + '{position:static;font:400 14px/1.35 ' + SERIF + ';color:#f4ecdc;text-align:left;direction:ltr;-webkit-text-size-adjust:100%}',
      F + ' *{box-sizing:border-box;margin:0;padding:0;border:0 solid;background:none;color:inherit;font:inherit;letter-spacing:inherit;text-transform:none;text-decoration:none;text-shadow:none;box-shadow:none;float:none;max-width:none;min-width:0}',
      F + ' [hidden]{display:none!important}',
      F + ' .osof-slot{position:fixed;z-index:' + Z.frame + ';pointer-events:none;display:flex;flex-direction:column}',
      F + ' .osof-slot>*{pointer-events:auto}',
      F + ' .osof-item{position:relative;display:flex;flex:none}',
      F + ' [data-slot=top-left]{left:calc(10px + env(safe-area-inset-left,0px));top:74px;width:54px;align-items:center}',
      F + ' [data-slot=top-right]{right:calc(10px + env(safe-area-inset-right,0px));top:var(--osof-top-r,74px);width:54px;align-items:center;gap:10px}',
      F + ' [data-slot=left]{left:calc(10px + env(safe-area-inset-left,0px));width:54px;align-items:center}',
      F + ' [data-slot=right]{right:calc(10px + env(safe-area-inset-right,0px));width:54px;align-items:center}',
      F + ' [data-slot=bottom-left]{left:calc(10px + env(safe-area-inset-left,0px));bottom:calc(10px + env(safe-area-inset-bottom,0px));align-items:flex-start;gap:10px}',
      F + ' [data-slot=bottom-right]{right:calc(10px + env(safe-area-inset-right,0px));bottom:calc(10px + env(safe-area-inset-bottom,0px));align-items:flex-end;gap:10px}',
      F + ' [data-slot=overlay]{inset:0;z-index:' + Z.sig + '}',
      F + ' [data-slot=overlay]>*{pointer-events:none}',
      F + ' [data-osof-kind=globe],' + F + ' [data-osof-kind=globe] *{pointer-events:none!important}',
      // the round plum-glass button: the visual language of the ʻohana doors
      F + ' .osof-btn{position:relative;display:flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:50%;background:rgba(20,18,45,.86);border:1px solid rgba(251,226,160,.45);color:#fbe2a0;font:21px/1 ' + EMOJI + ';cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.32);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);-webkit-tap-highlight-color:transparent;user-select:none;transition:transform .25s ease,border-color .25s ease,background-color .25s ease}',
      F + ' .osof-btn:hover{border-color:rgba(251,226,160,.95);background:rgba(36,28,70,.94);transform:translateY(-1px)}',
      F + ' .osof-btn:focus{outline:none}',
      F + ' .osof-btn:focus-visible,' + F + ' .osof-tile:focus-visible,' + F + ' .osof-row:focus-visible,' + F + ' a:focus-visible,' + F + ' button:focus-visible{outline:2px solid #fbe2a0;outline-offset:3px;box-shadow:0 0 0 6px rgba(20,18,45,.88)}',
      F + ' .osof-btn-lg{width:54px;height:54px;font-size:25px}',
      F + ' [data-slot=top-right]>.osof-item:not(.osof-sheet-item):first-of-type .osof-btn,' + F + ' [data-slot=top-right]>.osof-sheet-item+.osof-item .osof-btn{width:54px;height:54px;font-size:25px}',
      F + ' .osof-emo{display:inline-block;line-height:1}',
      F + ' .osof-more .osof-emo{font:700 22px/1 ' + SANS + ';color:#fbe2a0;transform:translateY(-3px)}',
      F + ' .osof-lbl{position:absolute;top:50%;left:calc(100% + 12px);white-space:nowrap;pointer-events:none;opacity:0;padding:6px 12px;border-radius:999px;background:rgba(12,10,28,.97);border:1px solid rgba(251,226,160,.55);color:#fbe2a0;font:600 13px/1.2 ' + SERIF + ';box-shadow:0 6px 18px rgba(0,0,0,.4);transform:translate(-4px,-50%);transition:opacity .18s ease,transform .18s ease}',
      F + ' [data-slot=right] .osof-lbl,' + F + ' [data-slot=top-right] .osof-lbl{left:auto;right:calc(100% + 12px);transform:translate(4px,-50%)}',
      F + ' .osof-btn:hover .osof-lbl,' + F + ' .osof-btn:focus-visible .osof-lbl{opacity:1;transform:translate(0,-50%)}',
      // the credit mark (always visible, ≥ 4.5:1)
      F + ' .osof-credit{display:inline-flex!important;visibility:visible!important;opacity:1!important;align-items:center;gap:2px;height:32px;padding:0 3px 0 11px;border-radius:999px;background:rgba(16,13,34,.92);border:1px solid rgba(251,226,160,.38);box-shadow:0 4px 14px rgba(0,0,0,.3);font:500 12px/1 ' + SANS + ';color:#f6e7c4}',
      F + ' .osof-credit-a{position:relative;display:inline-flex;align-items:center;gap:5px;color:#f6e7c4;white-space:nowrap;padding:0 6px 0 0}',
      F + ' .osof-credit-a::after{content:"";position:absolute;inset:-7px -2px -7px -12px}',
      F + ' .osof-credit-a:hover{text-decoration:underline;text-underline-offset:.2em}',
      F + ' .osof-credit-i{position:relative;width:26px;height:26px;border-radius:50%;border:1px solid rgba(251,226,160,.45);color:#fbe2a0;font:italic 700 13px/1 ' + SERIF + ';cursor:pointer}',
      F + ' .osof-credit-i::after{content:"";position:absolute;inset:-4px}',
      F + ' .osof-credit-i:hover{background:rgba(251,226,160,.14)}',
      // dialogs
      F + ' .osof-dlg{position:fixed;z-index:' + Z.panel + ';left:50%;top:12vh;width:min(380px,calc(100vw - 24px));max-height:calc(100vh - 24px);display:flex;flex-direction:column;background:linear-gradient(165deg,rgba(40,25,70,.985),rgba(13,10,28,.985));border:1px solid rgba(251,226,160,.45);border-radius:18px;box-shadow:0 22px 70px rgba(0,0,0,.6);color:#f4ecdc;overflow:hidden;font:15px/1.5 ' + SERIF + '}',
      F + ' .osof-dlg.osof-pop{z-index:' + Z.pop + ';width:min(300px,calc(100vw - 24px))}',
      F + ' .osof-dlg.osof-wide{width:min(760px,calc(100vw - 32px))}',
      F + ' .osof-dlg:focus{outline:none}',
      F + ' .osof-dlg-head{display:flex;align-items:center;gap:10px;padding:12px 12px 10px 18px;border-bottom:1px solid rgba(251,226,160,.16)}',
      F + ' .osof-dlg-title{flex:1;font:700 17px/1.25 ' + SERIF + ';color:#fbe2a0}',
      F + ' .osof-x{flex:none;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid rgba(251,226,160,.32);color:#efe3c8;font:15px/1 ' + SANS + ';cursor:pointer}',
      F + ' .osof-x:hover{background:rgba(251,226,160,.12)}',
      F + ' .osof-dlg-body{padding:14px 18px 18px;overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}',
      F + ' .osof-dlg-body p+p{margin-top:9px}',
      F + ' .osof-dlg a{color:#fbe2a0;text-decoration:underline;text-underline-offset:.16em}',
      F + ' .osof-small{font:12.5px/1.45 ' + SANS + ';color:#d8ccb4}',
      F + ' .osof-credit-line{font-weight:700;color:#fff3da}',
      F + ' .osof-rows{display:flex;flex-direction:column;gap:4px}',
      F + ' .osof-row{display:flex;align-items:center;gap:12px;width:100%;min-height:44px;padding:6px 10px;border-radius:12px;color:#f4ecdc;text-decoration:none!important;cursor:pointer;font:15px/1.25 ' + SERIF + '}',
      F + ' .osof-row:hover{background:rgba(251,226,160,.1)}',
      F + ' .osof-row-emo{font:22px/1 ' + EMOJI + ';width:28px;text-align:center}',
      F + ' .osof-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:10px}',
      F + ' .osof-tile{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;min-height:86px;padding:10px 6px;border-radius:16px;background:rgba(251,226,160,.06);border:1px solid rgba(251,226,160,.26);color:#f4ecdc;text-align:center;text-decoration:none!important;font:600 13px/1.25 ' + SERIF + ';cursor:pointer}',
      F + ' .osof-tile:hover{border-color:rgba(251,226,160,.85);background:rgba(251,226,160,.12)}',
      F + ' .osof-tile-emo{font:28px/1 ' + EMOJI + '}',
      F + ' .osof-face{border-color:color-mix(in srgb,var(--osof-face) 55%,transparent)}',
      F + ' .osof-sheet-sec{margin-top:16px}',
      F + ' .osof-sheet-sec h3{font:700 12px/1.2 ' + SANS + ';letter-spacing:.14em;text-transform:uppercase;color:#e9c46a;margin:0 0 9px}',
      F + ' .osof-sheet-credit{margin-top:16px}',
      F + ' .osof-video{display:block;width:100%;aspect-ratio:16/9;background:#000;border-radius:12px}',
      F + ' .osof-dlg-body .osof-video+p{margin-top:9px}',
      // the tour
      F + ' .osof-cap{position:fixed;z-index:' + Z.tour + ';left:0;top:0;width:max-content;max-width:min(300px,calc(100vw - 32px));padding:10px 15px 12px;border-radius:16px;background:linear-gradient(140deg,rgba(46,27,78,.97),rgba(16,12,34,.97));border:1px solid rgba(251,226,160,.6);color:#f4ecdc;font:15px/1.4 ' + SERIF + ';box-shadow:0 14px 40px rgba(0,0,0,.5);pointer-events:none;opacity:0;transition:opacity .25s ease}',
      F + ' .osof-cap.on{opacity:1}',
      F + ' .osof-cap b{display:block;color:#fbe2a0;font-weight:700;margin-bottom:2px}',
      F + ' .osof-cap::before{content:"";position:absolute;width:12px;height:12px;background:inherit;border:inherit;border-width:0 0 1px 1px;transform:rotate(45deg)}',
      F + ' .osof-cap[data-side=right]::before{left:-7px;top:calc(var(--osof-ay,50%) - 6px)}',
      F + ' .osof-cap[data-side=left]::before{right:-7px;top:calc(var(--osof-ay,50%) - 6px);transform:rotate(225deg)}',
      F + ' .osof-cap[data-side=below]::before{top:-7px;left:calc(var(--osof-ax,50%) - 6px);transform:rotate(135deg)}',
      F + ' .osof-cap[data-side=above]::before{bottom:-7px;left:calc(var(--osof-ax,50%) - 6px);transform:rotate(-45deg)}',
      F + ' .osof-halo{position:fixed;z-index:' + Z.halo + ';pointer-events:none;box-shadow:0 0 0 2px rgba(251,226,160,.85),0 0 14px 3px rgba(251,226,160,.28)}',
      F + ' .osof-tourbar{position:fixed;z-index:' + Z.tour + ';top:12px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:4px 4px 4px 14px;border-radius:999px;background:rgba(12,10,28,.95);border:1px solid rgba(251,226,160,.45);color:#f4ecdc;font:13px/1.2 ' + SERIF + ';box-shadow:0 8px 26px rgba(0,0,0,.45);white-space:nowrap}',
      F + ' .osof-count{font:12px/1 ' + SANS + ';color:#d9cdb5;font-variant-numeric:tabular-nums}',
      F + ' .osof-skip{min-height:34px;padding:0 13px;border-radius:999px;border:1px solid rgba(251,226,160,.55);color:#fbe2a0;font:600 13px/1 ' + SANS + ';cursor:pointer}',
      F + ' .osof-skip:hover{background:rgba(251,226,160,.12)}',
      F + ' .osof-final{position:fixed;z-index:' + Z.tour + ';display:flex;align-items:center;gap:10px;max-width:min(430px,calc(100vw - 16px));padding:10px 10px 10px 16px;border-radius:16px;background:linear-gradient(140deg,rgba(46,27,78,.97),rgba(16,12,34,.97));border:1px solid rgba(251,226,160,.6);color:#f4ecdc;font:14px/1.4 ' + SERIF + ';box-shadow:0 14px 40px rgba(0,0,0,.5);opacity:0;transition:opacity .3s ease;flex-wrap:wrap}',
      F + ' .osof-final.on{opacity:1}',
      F + ' .osof-final p{flex:1 1 220px}',
      F + ' .osof-final b{color:#fbe2a0}',
      F + ' .osof-watch{min-height:40px;padding:0 14px;border-radius:999px;background:linear-gradient(135deg,#f3d27e,#e9c46a);color:#21170a;font:700 13px/1 ' + SANS + ';cursor:pointer}',
      F + ' .osof-watch:hover{filter:brightness(1.06)}',
      // outline (blueprint)
      F + ' .osof-outline{position:fixed;left:0;top:0;z-index:' + Z.outline + ';pointer-events:none;overflow:visible}',
      F + ' .osof-outline path{fill:none;stroke:#5fd4ff;stroke-width:2.3;stroke-linecap:round;stroke-linejoin:round;opacity:.92}',
      F + ' .osof-outline path.osof-ink2{stroke-width:1.2;opacity:.45}',
      F + ' .osof-outline text{fill:#7fe0ff;font:600 14px/1 "Segoe Print","Bradley Hand","Chalkboard SE","Comic Sans MS",cursive;paint-order:stroke;stroke:rgba(8,10,30,.82);stroke-width:3.5px;stroke-linejoin:round}',
      // phones: rails rest; one 🎻 opens the sheet; chat + radio stay; the credit stays
      F + '[data-mode=desktop] .osof-sheet-item{display:none}',
      F + '[data-mode=mobile] [data-slot=left],' + F + '[data-mode=mobile] [data-slot=right]{display:none}',
      F + '[data-mode=mobile] [data-slot=top-left]{left:calc(8px + env(safe-area-inset-left,0px));top:52px;width:38px}',
      F + '[data-mode=mobile] [data-slot=top-right]{right:calc(8px + env(safe-area-inset-right,0px));top:var(--osof-top-r,52px)}',
      F + '[data-mode=mobile] [data-slot=top-right]>.osof-item:not(.osof-sheet-item),' + F + '[data-mode=mobile] [data-slot=bottom-left]>.osof-item:not([data-osof-kind=credit]),' + F + '[data-mode=mobile] [data-osof-hom]{display:none}',
      F + '[data-mode=mobile] .osof-sheetbtn{width:44px;height:44px;font-size:21px}',
      F + '[data-mode=mobile] [data-slot=bottom-left]{left:calc(8px + env(safe-area-inset-left,0px));bottom:calc(8px + env(safe-area-inset-bottom,0px))}',
      F + '[data-mode=mobile] [data-slot=bottom-right]{right:calc(8px + env(safe-area-inset-right,0px));bottom:calc(8px + env(safe-area-inset-bottom,0px))}',
      F + '[data-mode=mobile] .osof-credit{height:30px;font-size:11.5px}',
      F + '[data-mode=mobile] .osof-dlg{left:8px!important;right:8px!important;top:auto!important;bottom:calc(8px + env(safe-area-inset-bottom,0px))!important;width:auto;max-height:min(86vh,calc(100vh - 24px))}',
      F + '[data-osof-globe=open] [data-slot=left]{visibility:hidden}',
      // the ⚙ panel · hidden pieces · the frame off (one dot) · the folded 🎻 (BUTTON LAW)
      F + ' .osof-credit-g{font:16px/1 ' + EMOJI + ';font-style:normal}',
      F + ' .osof-credit-g span{display:inline-block;transition:transform .35s ease}',
      F + ' .osof-credit-g:hover span,' + F + ' .osof-credit-g:focus-visible span{transform:rotate(60deg)}',
      F + ' .osof-settings h3{font:700 12px/1.2 ' + SANS + ';letter-spacing:.14em;text-transform:uppercase;color:#e9c46a;margin:14px 0 8px}',
      F + ' .osof-sws{display:flex;flex-direction:column;gap:2px}',
      F + ' .osof-sws[data-osof-dim]{opacity:.45}',
      F + ' .osof-sw{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:40px;padding:4px 6px 4px 8px;border-radius:12px;color:#f4ecdc;font:15px/1.25 ' + SERIF + ';cursor:pointer;text-align:left}',
      F + ' .osof-sw:hover{background:rgba(251,226,160,.1)}',
      F + ' .osof-sw-big{min-height:48px;font:700 17px/1.2 ' + SERIF + ';color:#fbe2a0;border:1px solid rgba(251,226,160,.3)}',
      F + ' .osof-sw-k{position:relative;flex:none;width:40px;height:22px;border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(251,226,160,.35);transition:background .2s ease}',
      F + ' .osof-sw-k::after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#f4ecdc;transition:transform .2s ease}',
      F + ' .osof-sw[aria-checked=true] .osof-sw-k{background:linear-gradient(135deg,#f3d27e,#e9c46a)}',
      F + ' .osof-sw[aria-checked=true] .osof-sw-k::after{transform:translateX(18px);background:#21170a}',
      F + ' .osof-link{color:#fbe2a0;text-decoration:underline;text-underline-offset:.16em;cursor:pointer;font:inherit}',
      F + ' .osof-settings .osof-small{margin-top:10px}',
      F + ' [data-osof-hid]{display:none!important}',
      F + ' [data-osof-tuck]{display:none!important}',
      F + '[data-osof-credit-folded] [data-osof-kind=credit]{display:none!important}',
      F + ' .osof-credit-mini{padding-left:6px}',
      F + ' .osof-credit-mini .osof-credit-a{padding:0;font-size:0;gap:0}',
      F + ' .osof-credit-mini .osof-credit-a span[aria-hidden]{font-size:15px}',
      F + ' .osof-credit-mini .osof-credit-a::after{inset:-7px -2px -7px -6px}',
      F + '[data-osof-nosig] .osof-sig{display:none!important}',
      F + '[data-osof-off] .osof-slot{display:none!important}',
      F + ' .osof-dot{position:fixed;z-index:' + Z.frame + ';width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(20,18,45,.86);border:1px solid rgba(251,226,160,.55);font:9px/1 ' + EMOJI + ';opacity:.5;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3);transition:opacity .2s ease,transform .2s ease}',
      F + ' .osof-dot:hover,' + F + ' .osof-dot:focus-visible{opacity:1;transform:scale(1.25)}',
      F + ' .osof-dot::after{content:"";position:absolute;inset:-10px}',
      F + ' .osof-fold-x{position:absolute;top:-7px;left:-7px;z-index:1;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#3d1c42,#221436);border:1px solid rgba(251,226,160,.7);color:#fbe2a0;font:10px/1 ' + SANS + ';cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.45)}',
      F + ' .osof-fold-x::after{content:"";position:absolute;inset:-6px}',
      F + ' .osof-sheetbtn.osof-fold{width:17px!important;height:17px!important;font-size:9px!important;opacity:.45;box-shadow:none}',
      F + ' .osof-sheetbtn.osof-fold:hover,' + F + ' .osof-sheetbtn.osof-fold:focus-visible{opacity:.95;transform:none}',
      F + ' .osof-sheetbtn.osof-fold .osof-emo{transform:none!important;animation:none!important}',
      F + '[data-mode=mobile] .osof-sheetbtn.osof-fold{width:20px!important;height:20px!important;font-size:10px!important;opacity:.62}',
      // the first visit: one entrance, once (THE ONE-TIME LAW); never again, never a loop
      '@media (prefers-reduced-motion:no-preference){',
      '@keyframes osof-in-l{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:none}}',
      '@keyframes osof-in-r{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}',
      '@keyframes osof-in-b{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}',
      '@keyframes osof-glow{0%{box-shadow:0 0 0 0 rgba(251,226,160,0)}40%{box-shadow:0 0 0 3px rgba(251,226,160,.95),0 0 28px 9px rgba(251,226,160,.5)}100%{box-shadow:0 0 0 2px rgba(251,226,160,.85),0 0 14px 3px rgba(251,226,160,.28)}}',
      F + '.osof-enter .osof-slot>.osof-item{animation:osof-in-l .55s cubic-bezier(.2,.8,.2,1) calc(300ms + var(--osof-i,0) * 40ms) both}',
      F + '.osof-enter [data-slot=right]>.osof-item,' + F + '.osof-enter [data-slot=top-right]>.osof-item{animation-name:osof-in-r}',
      F + '.osof-enter [data-slot=bottom-left]>.osof-item,' + F + '.osof-enter [data-slot=bottom-right]>.osof-item{animation-name:osof-in-b}',
      F + ' .osof-halo.glow{animation:osof-glow 1.1s ease-out 1 both}',
      '}',
      '@media (prefers-reduced-motion:reduce){' + F + ' .osof-btn,' + F + ' .osof-lbl,' + F + ' .osof-cap,' + F + ' .osof-final{transition:none}}'
    ].join('\n');
  }

  // ── boot ──────────────────────────────────────────────────────────────────────
  function whenBody(fn) { if (D.body) fn(); else D.addEventListener('DOMContentLoaded', fn); }
  function scriptBase() {
    try { return new URL('.', (SCRIPT && SCRIPT.src) || D.baseURI).href; } catch (e) { return ''; }
  }
  function fetchJSON(url) {
    return W.fetch(url, { credentials: 'omit', mode: 'cors' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url);
      return r.json();
    });
  }
  // "extends": a dataset built on another one (relative to the child's own URL); at most 4 deep
  function withParents(d, url, depth) {
    if (!isObj(d) || !str(d.extends) || depth > 3) return Promise.resolve({ data: d, url: url });
    var pu = resolveURL(d.extends, url, true);
    if (!pu) return Promise.resolve({ data: d, url: url });
    return fetchJSON(pu).then(function (p) { return withParents(p, pu, depth + 1); }).then(function (res) {
      return { data: mergeFrame(absolutize(res.data, res.url), d), url: url, parentURL: res.url };
    }, function (e) { info('could not load the parent frame ' + pu + ' (' + e.message + '); using the door dataset alone'); return { data: d, url: url }; });
  }
  // ARTIST FRAMES (22 Nov 2026): a third layer on top of the door's frame — a per-page or per-person overlay, same schema,
  // merged by piece id. Sources, in order: data-frame-overlay="<url>" on the script tag (the site author's choice: any https URL)
  // · ?frame-overlay=<url> in the address · window.__framesOverlay = "<url>" | {…inline dataset…} (set before frames.js runs).
  // Address and window overlays must live on the page's own origin or on the frames host — a link can't dress our door in a stranger's frame.
  function overlaySource() {
    var attr = SCRIPT && SCRIPT.getAttribute('data-frame-overlay');
    if (attr) { var au = resolveURL(attr, D.baseURI, true); return au ? { url: au, from: 'tag' } : null; }
    var m = /[?&]frame-overlay=([^&#]*)/.exec((W.location && W.location.search) || '');
    var q = ''; if (m) { try { q = decodeURIComponent(m[1]); } catch (e) { q = ''; } }
    var win = W.__framesOverlay;
    if (isObj(win)) return { data: win, url: D.baseURI, from: 'window' };
    var cand = q || (typeof win === 'string' ? win : '');
    if (!cand) return null;
    var u = resolveURL(cand, D.baseURI, true);
    if (!u) return null;
    var ok = false;
    try { var o = new URL(u).origin; ok = o === W.location.origin || (base && o === new URL(base).origin); } catch (e) {}
    if (!ok) { info('frame overlay ignored: ' + u + ' is not on this page\'s origin or the frames host'); return null; }
    return { url: u, from: q ? 'query' : 'window' };
  }
  function withOverlay(res) {
    var src = overlaySource();
    if (!src) return res;
    var apply = function (d, url) {
      if (!isObj(d)) { info('frame overlay is not a JSON object; ignored'); return res; }
      return withParents(d, url, 0).then(function (ov) {        // an overlay may itself "extends" (resolved against its own URL)
        var merged = mergeFrame(absolutize(res.data, res.url), ov.data, true);
        return { data: merged, url: url, baseURL: res.url, overlay: { from: src.from, url: url } };
      });
    };
    if (src.data) return apply(src.data, src.url);
    return fetchJSON(src.url).then(function (d) { return apply(d, src.url); }, function (e) { info('frame overlay ' + src.url + ' failed (' + e.message + '); wearing the door frame alone'); return res; });
  }
  function loadData() { return loadBase().then(withOverlay); }
  function loadBase() {
    var inline = D.getElementById('oso-frame');
    if (inline && /json/i.test(inline.getAttribute('type') || '')) {
      try { return withParents(JSON.parse(inline.textContent), D.baseURI, 0); } catch (e) { info('inline #oso-frame is not valid JSON; trying data-frame', e); }
    }
    var attr = SCRIPT && SCRIPT.getAttribute('data-frame');
    var door = SCRIPT && !attr ? SCRIPT.getAttribute('data-door') : null;
    var fallback = resolveURL(attr || 'frames/universe.json', attr ? D.baseURI : base, true);
    if (!fallback) return Promise.reject(new Error('no dataset URL'));
    var main = fetchJSON(fallback).then(function (d) { return withParents(d, fallback, 0); });
    if (door == null) return main;
    // data-door="auto" → frames/doors/<this host>.json next to frames.js (data-door="example.org" names a host). The index
    // (frames/doors/index.json, built by build.mjs) is read first so a door without its own frame costs no 404: it wears the fallback.
    var host = doorHost(door === 'auto' || door === '' ? (W.location && W.location.hostname) : door);
    var iurl = host ? resolveURL('frames/doors/index.json', base, true) : '';
    if (!iurl) return main;
    return fetchJSON(iurl).then(function (idx) {
      var list = isObj(idx) && Array.isArray(idx.doors) ? idx.doors : [];
      var hit = null;
      for (var i = 0; i < list.length; i++) if (isObj(list[i]) && doorHost(list[i].host) === host) { hit = list[i]; break; }
      if (!hit) { info('no door frame for ' + host + ' — wearing ' + fallback.split('/').pop()); return main; }
      var durl = resolveURL('frames/doors/' + (str(hit.file) || host + '.json'), base, true);
      return fetchJSON(durl).then(function (d) { return withParents(d, durl, 0); });
    }).catch(function (e) { info('door frame lookup failed (' + (e && e.message) + ') — wearing the fallback'); return main; });
  }
  var overlayInfo = null;
  function start(raw, url, overlay) {
    overlayInfo = overlay || null;
    data = deepFreeze(normalize(raw));
    dataURL = url;
    frameId = data.id;
    once = makeOnce(LS, frameId, state.fresh);
    store = makeStore(LS);
    css('core', coreCSS());
    state.mobile = isMobileNow();
    state.reduced = mq('(prefers-reduced-motion: reduce)');
    root = h('div', { id: 'oso-frames', class: 'osof', 'data-osof-version': VERSION, 'data-frame': frameId, 'data-mode': state.mobile ? 'mobile' : 'desktop', 'data-motion': state.reduced ? 'reduced' : 'full', role: 'region', 'aria-label': t('frame') });
    ro = W.ResizeObserver ? new W.ResizeObserver(schedule) : null;
    SLOTS.forEach(function (s) {
      var rail = s === 'left' || s === 'right';
      zones[s] = h(rail ? 'nav' : 'div', { class: 'osof-slot', 'data-slot': s, 'aria-label': rail ? t('rail.' + s) : null });
      root.appendChild(zones[s]);
    });
    loadPrefs();
    if (data.accent) { root.style.setProperty('--osof-accent', data.accent); root.setAttribute('data-accent', data.accent); }
    D.body.appendChild(root);
    ['top-left', 'top-right', 'bottom-left', 'bottom-right'].forEach(function (s) { if (ro) ro.observe(zones[s]); });
    if (prefs.on) mountAll(); else { state.off = true; root.setAttribute('data-osof-off', ''); makeDot(); info('the frame is off for this browser (⚙) — the small 🎻 dot brings it back'); }
    W.addEventListener('resize', schedule);
    W.addEventListener('orientationchange', schedule);
    W.addEventListener('load', function () { recheck(); });
    if (D.fonts && D.fonts.ready) D.fonts.ready.then(schedule, function () {});
    D.addEventListener('keydown', onKey, true);
    D.addEventListener('pointerdown', onPointer, true);
    D.addEventListener('visibilitychange', function () { if (D.hidden && tour.active && tour.auto) stopTour('hidden'); });
    if (W.MutationObserver) {
      var mt = 0;
      new W.MutationObserver(function (ms) {
        for (var i = 0; i < ms.length; i++) {
          var nodes = [].slice.call(ms[i].addedNodes).concat([].slice.call(ms[i].removedNodes));
          if (nodes.some(function (n) { return n !== root && n.nodeType === 1 && n.tagName !== 'SCRIPT' && n.tagName !== 'STYLE'; })) { clearTimeout(mt); mt = setTimeout(recheck, 150); return; }
        }
      }).observe(D.body, { childList: true });
    }
    setTimeout(schedule, 300);
    setTimeout(recheck, 1500);
    setTimeout(schedule, 3200);                                  // a page's late hero/entrance motion has settled by now
    setTimeout(schedule, 6000);                                  // …and a header that grows when its fonts arrive
    state.ready = api.ready = true;
    root.setAttribute('data-osof-ready', '');
    emit('frame:ready', { id: frameId, items: recs.length, mobile: state.mobile, on: prefs.on, accent: data.accent || '', overlay: overlayInfo });
  }
  // late arrivals: a page widget that appears after us (unless), spots, the lang.js button
  function recheck() {
    recs.slice().forEach(function (r) { if (r.item.unless && !r.spot && unlessMatches(r.item.unless)) unmount(r); });
    observeSpots();
    schedule();
  }
  var spotSeen = W && typeof W.WeakSet === 'function' ? new W.WeakSet() : null;
  function observeSpots() {
    if (!ro || !spotSeen) return;
    recs.forEach(function (r) {
      if (!r.spot) return;
      try { [].forEach.call(D.querySelectorAll(String(r.item.selector || '')), function (el) { if (!spotSeen.has(el) && !root.contains(el)) { spotSeen.add(el); ro.observe(el); } }); } catch (e) {}
    });
    var lb = langButton();
    if (lb && !spotSeen.has(lb)) { spotSeen.add(lb); ro.observe(lb); }
  }

  var api = {
    version: VERSION,
    __osof: true,
    ready: false,
    define: function (kind, factory) {
      if (typeof kind !== 'string' || !kind || typeof factory !== 'function') { warn('define(kind, factory) needs a name and a function'); return; }
      if (kind === 'spot') { warn('"spot" is built into the core'); return; }
      kinds[kind] = factory;
    },
    boot: function () {
      if (state.booted || !D) return;
      state.booted = true;
      var f = parseFlags(W.location && W.location.search);
      if (f.off) { info('?frame=off — nothing rendered'); return; }
      state.fresh = f.fresh;
      state.outline = f.outline;
      LS = probeStorage(W);
      base = scriptBase();
      whenBody(function () {
        loadData().then(function (res) { start(res.data, res.url, res.overlay); }).catch(function (e) { info('the frame stays away: ' + (e && e.message ? e.message : e)); });
      });
    },
    open: function (id) {
      if (!root) return false;
      if (id === 'sheet') { if (state.off) return false; openSheet(); return true; }
      if (id === 'about' || id === 'credit') { if (state.off) return false; about(creditInfo); return true; }
      if (id === 'settings') { settings(creditGear || dot); return true; }
      for (var i = 0; i < recs.length; i++) if (recs[i].id === id) return openRec(recs[i]);
      return false;
    },
    outline: function (on) {
      state.outline = on === undefined ? !state.outline : !!on;
      if (root) { root.toggleAttribute('data-osof-outline', state.outline); drawOutline(); }
      return state.outline;
    },
    tour: function () { return root ? startTour(false) : false; },
    reset: function () {
      var pre = ['osof:once:' + frameId + ':', 'osof:dismiss:' + frameId + ':'];
      try {
        var keys = [];
        for (var i = 0; LS && i < LS.length; i++) keys.push(LS.key(i));
        keys.forEach(function (k) { if (k && (k.indexOf(pre[0]) === 0 || k.indexOf(pre[1]) === 0)) LS.removeItem(k); });
      } catch (e) {}
      once = makeOnce(LS, frameId, state.fresh);
      store = makeStore(LS);
      emit('frame:reset', { id: frameId });
    },
    on: on,
    emit: emit,
    // the ⚙ panel as an API: settings() → {on, hide}; settings({on:false}) · settings({hide:{radio:true}})
    settings: function (patch) {
      if (isObj(patch) && root) {
        if (isObj(patch.hide)) GROUPS.forEach(function (g) { if (has(patch.hide, g)) setGroup(g, !patch.hide[g]); });
        if (has(patch, 'on')) { if (patch.on) turnOn(); else turnOff(); }
      }
      return { on: prefs.on, hide: copy(prefs.hide), groups: data ? presentGroups() : GROUPS.slice() };
    },
    _: { makeOnce: makeOnce, makeStore: makeStore, resolveURL: resolveURL, fitColumn: fitColumn, normalize: normalize, parseFlags: parseFlags, slug: slug, creditLine: creditLine, fmt: fmt, durWord: durWord, mergeFrame: mergeFrame, absolutize: absolutize, doorHost: doorHost, CREDIT: CREDIT, VERSION: VERSION, GROUPS: GROUPS }
  };
  Object.defineProperty(api, 'data', { enumerable: true, get: function () { return data; } });
  Object.defineProperty(api, 'overlay', { enumerable: true, get: function () { return overlayInfo; } });
  defineTour();
  if (W) W.OSOFrames = api;
  return api;
})(typeof window !== 'undefined' ? window : undefined);
