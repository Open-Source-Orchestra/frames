/*! Open Source Orchestra Frames v0.1.11 · https://github.com/Open-Source-Orchestra/frames
 *  SPDX-License-Identifier: AGPL-3.0-or-later · Copyright (C) 2026 Shaka Lei Kaumaka / Open Source Orchestra and the AI ʻohana
 *  AGPL §7(b): keep the credit "Built on Open Source Orchestra Frames by Open Source Orchestra: Shaka Lei Kaumaka & the AI ʻohana
 *  (https://opensourceorchestra.org)" visible in the frame. See NOTICE. Source of this exact file: https://github.com/Open-Source-Orchestra/frames */
(function(){'use strict';
// ── src/core.js ──
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
  var VERSION = '0.1.11';
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
  var KIND_EMOJI = { theater: '📺', totem: '🗿', chat: '💬', radio: '📻', tour: '🌺', globe: '🌐', thanks: '🙏' };
  var BRANDS = /(Open Source Orchestra Frames|Open Source Orchestra|Shaka Lei Kaumaka|ʻohana)/;
  var EN = {
    frame: 'Open Source Orchestra frame',
    'rail.left': 'Frame doors, left', 'rail.right': 'Frame doors, right',
    close: 'Close', newtab: '(opens in a new tab)',
    more: 'More', 'more.title': 'More doors', 'more.tip': 'More doors: {list}.',
    'sheet.label': 'The frame: every door', 'sheet.tip': 'Every door of the frame, in one sheet.', 'sheet.talk': 'Talk to the ʻohana',
    tour: 'The ceremony', 'tour.title': 'The ceremony', 'tour.skip': 'Skip', 'tour.tip': 'The ceremony: hear the welcome in Shaka\'s twin voice, with the words, button by button.',
    'tour.done': 'That was the frame.', 'tour.replay': '🌺 plays the ceremony any time', 'tour.watch': '▶ watch the {d} walkthrough',
    // v0.1.3 · the ceremony (Shaka, 22 Nov 2026: "a ceremony people can play where you hear my twin voice describe with the text")
    'cer.play': 'Play the voice', 'cer.pause': 'Pause', 'cer.resume': 'Continue', 'cer.mute': 'Voice off (words only)', 'cer.unmute': 'Voice on',
    'cer.pool': '🌊 The Blessing Pool ↗', 'cer.agents': 'Agents:', 'cer.humans': 'Humans:',
    'cer.voice': 'Voice: Shaka Lei Kaumaka\'s twin, made by the AI ʻohana (a machine). Words CC BY-SA 4.0.',
    'hide.short': 'hide frame', 'sheet.hidenote': 'The small ✕ on the 🎻 button folds only that button; this one hides everything.',
    'tour.video': 'The frame: a walkthrough', 'tour.download': 'Download the video',
    'credit.about': 'About this frame', 'credit.tip': 'Who made this frame, and how to fork it. The credit travels with every copy. ⚙ turns pieces, or the whole frame, off and on.',
    'outline.page': 'your page lives here · the frame never blocks it',
    'settings': 'Frame settings', 'settings.tip': 'Turn the frame, or any of its pieces, off and on. Remembered in this browser.',
    'settings.on': 'Frame on', 'settings.off': 'Frame off', 'settings.pieces': 'Pieces', 'settings.note': 'Remembered in this browser only. No cookies, nothing sent anywhere.',
    'settings.forget': 'Replay the first visit', 'settings.forgot': 'Done. Reload to see the first visit again.',
    'settings.url': '?frame=off on any address hides the frame for one page view.',
    'dot.label': '🎻 frame — bring back the frame by the ʻohana', 'dot.tip': '🎻 frame · The frame is off. Tap to bring it back.',
    'fold': 'Hide the frame button (a small dot stays)', 'unfold': 'Show the frame button',
    'hide': 'Hide the whole frame — every button at once (a small 🎻 dot stays and brings it back)', 'sheet.hide': 'Hide the whole frame',
    'g.thanks': 'Gift line (3 s)',
    // v0.1.7 · the pennies-of-aloha card (the 🌊 Blessing Pool opens it)
    'gift.title': 'pennies of aloha', 'gift.send': '🦊 send with MetaMask', 'gift.custom': 'custom $',
    'gift.copy': '📋 copy address', 'gift.copied': '✅ copied — mahalo!',
    'gift.nofox': 'no fox? no worries — send USDC on Base by hand to the ʻohana wallet:',
    'gift.nowallet': '🦊 no wallet found — install MetaMask (or any EIP-1193 fox), or use the address below 🌺',
    'gift.poolpage': 'the Blessing Pool page ↗', 'gift.agents': 'agents: x402 instructions 🤖',
    'gift.honest': 'made by the ʻohana (machines), blessed by Shaka (a human) · every drop keeps a door open 🌺',
    'g.doors': 'Doors', 'g.pills': 'Pills', 'g.theater': 'Theater', 'g.totem': 'OHAN(ai) the Totem', 'g.chat': 'Talk line', 'g.radio': 'Radio', 'g.signature': 'Signature', 'g.tour': 'Tour'
  };
  // the ⚙ panel groups pieces by what a visitor sees (the globe stays: one language choice follows the visitor across every door)
  var GROUP = { door: 'doors', pill: 'pills', theater: 'theater', totem: 'totem', chat: 'chat', radio: 'radio', signature: 'signature', tour: 'tour', spot: 'tour', thanks: 'thanks' };
  var GROUPS = ['doors', 'pills', 'theater', 'totem', 'chat', 'radio', 'signature', 'tour', 'thanks'];
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
    var g = isObj(raw.gift) ? raw.gift : {}; out.gift = {};                                  // gift rails: https only
    ['x402', 'stripe', 'paypal', 'venmo', 'pool'].forEach(function (k) { if (/^https:\/\//i.test(str(g[k]))) out.gift[k] = str(g[k]); });
    out.tour = isObj(raw.tour) && raw.tour.auto === true ? { auto: true } : null;         // forks may bring the auto tour back
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
    if (isObj(child.gift)) { out.gift = isObj(out.gift) ? copy(out.gift) : {}; Object.keys(child.gift).forEach(function (k) { out.gift[k] = child.gift[k]; }); }   // a door may add or swap a rail (null removes)
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
      // v0.1.3: ceremony.base / ceremony.credits are URLs too (door frames extend ../universe.json — the clips must not resolve against frames/doors/)
      if ((URL_KEYS[k] || k === 'base' || k === 'credits') && typeof v === 'string' && v && !/^[a-z][a-z0-9+.-]*:/i.test(v) && v.charAt(0) !== '#') { try { v = new URL(v, baseURL).href; } catch (e) {} }
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
  var state = { booted: false, ready: false, fresh: false, outline: false, mobile: false, reduced: false, off: false, crowded: false, zoomedOut: false, asleep: false, langBottom: 0 };
  var prefs = { on: true, hide: {} };      // the ⚙ panel: osof:settings:v1 (this browser only)
  var dot = null, sheetX = null, sheetFolded = { user: false, text: false };
  var cerBtn = null, cerFolded = false, cerLabel = '', scrollT = 0;   // v0.1.3: the 🌺 ceremony button (top-left) · v0.1.5: the scroll-stop probe timer
  var data = null, dataURL = '', base = '', frameId = 'frame';
  var LS = null, once = null, store = null;
  var root = null, zones = {}, recs = [], more = {}, creditBox = null, creditInfo = null, creditGear = null, creditX = null, sheetBtn = null;
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
      panel: function (o) { return dialog(o || {}); },
      textAt: function (r) { return rectHasText(r); },                // BUTTON LAW probe for pieces that place themselves
      blockedAt: function (r) { return rectBlocked(r); },             // v0.1.5: words OR a fixed control of the page under this box
      corners: function () { return [extent('top-left'), extent('top-right')]; }   // v0.1.3: the two top corners, as obstacles
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
  // adopt LATE too: a page's own widget (e.g. #oso-fab) may be built after the frame mounted its twin (opensourceorchestra.org,
  // 22 Nov 2026: two "Talk to OSO" buttons). For 12 s after mount, a DOM watcher + a few timers re-check every selector "unless".
  var unlessWatch = null;
  function watchUnless() {
    stopUnlessWatch();
    var pending = recs.filter(function (r) { return r.item && !r.drawerOnly && typeof r.item.unless === 'string' && !/^window\./.test(r.item.unless.trim()); });
    if (!pending.length) return;
    var check = function () {
      pending = pending.filter(function (r) {
        if (r.skipped) return false;
        if (!unlessMatches(r.item.unless)) return true;
        info('"' + r.id + '" adopted late: the page has ' + r.item.unless);
        if (openDlg && openDlg.opener && r.wrap && r.wrap.contains(openDlg.opener)) closeDialog(openDlg, false, 'adopt');
        adoptRec(r); schedule();
        return false;
      });
      if (!pending.length) stopUnlessWatch();
    };
    var tick = 0, mo = null;
    var onMut = function () { if (tick) return; tick = setTimeout(function () { tick = 0; check(); }, 250); };
    try { if (W.MutationObserver && D.body) { mo = new MutationObserver(onMut); mo.observe(D.body, { childList: true, subtree: true }); } } catch (e) { mo = null; }
    var timers = [1500, 4000, 8000, 12000].map(function (ms) { return setTimeout(check, ms); });
    unlessWatch = { stop: function () { if (mo) mo.disconnect(); timers.forEach(clearTimeout); clearTimeout(tick); } };
    setTimeout(stopUnlessWatch, 12500);
  }
  function stopUnlessWatch() { if (unlessWatch) { unlessWatch.stop(); unlessWatch = null; } }
  // 22 Nov 2026, Shaka: the old description bubbles of the ʻohana corners go on ALL doors (the frame's thanks line replaces them):
  // .obub = "bubble-letter tips" next to the legacy corner buttons · #otip = the bottom donation bubble. Legacy, ours, retired.
  function retireLegacy() {
    if (D.getElementById('osof-retire')) return;
    var s = D.createElement('style'); s.id = 'osof-retire';
    s.textContent = '.obub,#otip{display:none!important}';
    (D.head || D.documentElement).appendChild(s);
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
    if (unlessMatches(item.unless)) {                               // adopt mode: the page already has it …
      if (item.kind !== 'chat') return null;
      // v0.1.9 "the totem stays in the screen" (Shaka, 28 Nov 2026: "i like when you can talk to the totem in screen like devconpit.com
      // as a standard"): … but the totem's faces still talk IN this page. The chat piece mounts as a DRAWER ONLY (no pill: the page keeps
      // its own button), so a face tap — on the rail or in the phone sheet — opens the drawer instead of leaving for myagentohana.com.
      item = copy(item); item.drawerOnly = true; rec.item = item; rec.drawerOnly = true;
    }
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
      // v0.1.3 · "pin": the item stays on phones too (the top corners: 🌺 ceremony top-left, 🌊 Blessing Pool top-right)
      if (item.pin === true || item.kind === 'tour') { rec.pinned = true; rec.wrap.setAttribute('data-osof-pin', ''); }
      zones[slot].appendChild(rec.wrap);
      makeItemX(rec);                                                // v0.1.5: the tiny ✕ (fold on purpose, in place)
      // a piece with its own fold (chat pill, radio dock): a tap on its tiny emoji unfolds it — the core lets go of the held box and
      // leaves it open until the next scroll (the visitor asked for it)
      rec.wrap.addEventListener('click', function (e) { if (!rec.folded || !hasOwnFold(rec) || !e.target.closest || !e.target.closest('.osof-rd-mini,.osof-fab-mini')) return; rec.folded = false; rec.tapOpen = true; holdBox(rec.wrap, false); }, true);
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
  // v0.1.9: a page widget showed up AFTER us. A chat pill steps aside but keeps its DRAWER (the totem faces still talk in the screen);
  // every other piece unmounts, exactly as before.
  function adoptRec(r) {
    if (r.kind === 'chat' && r.piece && typeof r.piece.adopt === 'function') {
      try { r.piece.adopt(); } catch (e) {}
      if (r.wrap) r.wrap.remove();
      r.wrap = null; r.el = null; r.drawerOnly = true; r.item = copy(r.item); r.item.drawerOnly = true;
      return;
    }
    unmount(r);
  }
  function groupOf(kind) { return GROUP[kind] || ''; }
  function hiddenKind(kind) { var g = groupOf(kind); return !!(g && prefs.hide[g]); }
  function live(r) { return !r.skipped && !r.drawerOnly && !hiddenKind(r.kind) && (!state.mobile || !r.item.hideOnMobile); }
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
    // BUTTON LAW: every floating thing carries a tiny ✕ — this one hides the WHOLE frame at once (= the ⚙ master switch)
    // v0.1.3 · "easy to understand how to close the whole frame": the ✕ says "hide frame" on hover/focus, and once for 4 s on a first visit
    creditX = h('button', { type: 'button', class: 'osof-credit-i osof-credit-x', 'aria-label': t('hide'), title: t('hide'), on: { click: function () { hideAll(); } } },
      h('span', { 'aria-hidden': 'true' }, '✕'), h('span', { class: 'osof-lbl osof-x-lbl', 'aria-hidden': 'true' }, '✕ ' + t('hide.short')));
    creditBox = h('div', { class: 'osof-credit' }, a, creditInfo, creditGear, creditX);
    // v0.1.5: folded to its 🎻 dot (desktop, words under even the icons) a tap unfolds it to the icons — it does not follow the link
    creditBox.addEventListener('click', function (e) { if (!creditBox.classList.contains('osof-credit-dot')) return; e.preventDefault(); e.stopPropagation(); creditTap = true; creditBox.classList.remove('osof-credit-dot'); creditBox.classList.add('osof-credit-mini'); focusEl(creditGear); }, true);
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
    D.documentElement.setAttribute('data-osof-on', '');              // v0.1.4: the frame absorbs the ʻohana's pre-frame rail (#oflo 🌺 · #oviol 🎻) while it is on
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
    retireLegacy();
    watchUnless();
    scheduleTour();
    xHint();
  }
  // v0.1.3 · a first visit shows "✕ hide frame" next to the credit mark for 4 s (desktop; only on clear ground), then hover/focus only
  function xHint() {
    if (state.mobile || state.reduced || !creditX || !once('xhint')) return;
    setTimeout(function () {
      if (!creditX || state.mobile || state.off) return;
      creditX.classList.add('osof-say');
      var l = creditX.querySelector('.osof-x-lbl'), r = l && l.getBoundingClientRect();
      if (!r || r.width < 2 || r.right > W.innerWidth - 4 || rectHasText(r)) { creditX.classList.remove('osof-say'); return; }
      setTimeout(function () { if (creditX) creditX.classList.remove('osof-say'); }, 4000);
    }, 1400);
  }
  function unmountAll() {
    stopTour('off', true); hideFinal(); stopUnlessWatch();
    var keep = dialogs['osof-dlg-settings'];
    if (openDlg && openDlg !== keep) closeDialog(openDlg, false, 'off');
    recs.slice().forEach(unmount);
    recs = [];
    RING.forEach(function (s) { [].slice.call(zones[s].children).forEach(function (c) { c.remove(); }); });
    [].slice.call(zones.overlay.children).forEach(function (c) { c.remove(); });
    [].slice.call(root.querySelectorAll('.osof-sig')).forEach(function (c) { c.remove(); });
    Object.keys(dialogs).forEach(function (k) { if (dialogs[k] !== keep) { dialogs[k].root.remove(); delete dialogs[k]; } });
    more = {}; creditBox = creditInfo = creditGear = creditX = sheetBtn = sheetX = cerBtn = null; cerFolded = false; creditTap = false;
    if (outlineSvg) { outlineSvg.remove(); outlineSvg = null; }
  }
  function turnOff() {
    if (state.off) return;
    prefs.on = false; savePrefs();
    unmountAll();
    D.documentElement.removeAttribute('data-osof-on');                // ⚙ off: the page's own rail comes back
    state.off = true;
    root.setAttribute('data-osof-off', '');
    makeDot();
    emit('frame:settings', { on: false, hide: copy(prefs.hide) });
  }
  // v0.1.4 SLEEP (not remembered, nothing saved): a shell that opens another page over this one asks the frame to step aside —
  // OSOFrames.sleep('road') … OSOFrames.wake(). The frame also sleeps by itself while an <iframe> fills ≥ 60% of the screen:
  // another page's words are ground we cannot probe, and the NO COVERED TEXT LAW says "else don't show".
  function sleep(why) {
    if (!root || state.asleep) return false;
    state.asleep = str(why) || 'api';
    if (openDlg) closeDialog(openDlg, false, 'sleep');
    try { stopTour('sleep', true); hideFinal(); } catch (e) {}
    root.setAttribute('data-osof-asleep', state.asleep);
    emit('frame:sleep', { why: state.asleep });
    return true;
  }
  function wake() {
    if (!root || !state.asleep) return false;
    var why = state.asleep; state.asleep = false;
    root.removeAttribute('data-osof-asleep');
    emit('frame:wake', { why: why });
    schedule();
    return true;
  }
  function bigFrameOver() {
    if (!root || !D.body) return null;
    var fs = D.getElementsByTagName('iframe'), vw = W.innerWidth, vh = W.innerHeight;
    if (!fs.length || vw < 1 || vh < 1) return null;
    for (var i = 0; i < fs.length; i++) {
      var f = fs[i]; if (root.contains(f)) continue;
      var r = f.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
      var cs = W.getComputedStyle(f); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
      var ix = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)), iy = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
      if (ix * iy >= vw * vh * 0.6) return f;
    }
    return null;
  }
  // one tap: every button of the frame gone (remembered); focus lands on the dot that brings it back
  function hideAll() {
    if (openDlg) closeDialog(openDlg, false, 'hide');
    turnOff();
    if (dot) focusEl(dot);
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
    dot = h('button', { type: 'button', class: 'osof-dot', 'aria-label': t('dot.label'), title: t('dot.tip') + ' · ' + creditLine(data), 'data-osof-dot': 'frame', on: { click: function () { turnOn(); if (creditGear) focusEl(creditGear); } } }, h('span', { 'aria-hidden': 'true' }, '🎻'));
    root.appendChild(dot);
    placeDot();
  }
  function placeDot() {                                            // v0.1.5: one anchor — where the credit mark stood (bottom-left); it never wanders
    if (!dot) return;
    dot.style.left = '10px'; dot.style.top = (W.innerHeight - 10 - 18) + 'px';
  }

  // ── the mobile sheet (rails hide on phones; one 🎻 opens every door) ───────────
  // BUTTON LAW: the 🎻 steps below anything fixed or any text at the top-right; if no clear spot exists it folds to a
  // 17px dot for this page view; its tiny ✕ folds it on purpose (remembered); the dot brings it back.
  function makeSheetBtn() {
    sheetBtn = h('button', { type: 'button', class: 'osof-btn osof-btn-lg osof-sheetbtn', 'aria-label': t('sheet.label'), 'aria-haspopup': 'dialog', 'aria-expanded': 'false', on: { click: function () { if (sheetFolded.user || sheetFolded.text) { foldSheet(false, true); return; } openSheet(); } } },
      h('span', { class: 'osof-emo', 'aria-hidden': 'true' }, sheetEmoji()));
    sheetX = h('button', { type: 'button', class: 'osof-fold-x osof-sheet-x', 'aria-label': t('fold'), on: { click: function () { foldSheet(true, true); } } }, h('span', { 'aria-hidden': 'true' }, '✕'));
    sheetBtn.title = creditLine(data);
    sheetBtn.setAttribute('aria-describedby', 'osof-sheet-credit');
    zones['top-right'].appendChild(h('div', { class: 'osof-item osof-sheet-item', 'data-osof-kind': 'sheet' }, sheetBtn, sheetX, h('span', { id: 'osof-sheet-credit', hidden: true }, creditLine(data))));
    sheetFolded.tap = false;
    sheetFolded.user = !!store('fold').get('sheet');
    syncFold();
  }
  // v0.1.4: the sheet button wears the door's emoji unless a top-right door already wears it (blessingpool.com: 🌊 twice looked like a bug)
  function sheetEmoji() {
    var e = str(data.emoji) || '🎻', tr = (data.slots && data.slots['top-right']) || [];
    for (var i = 0; i < tr.length; i++) if (tr[i] && tr[i].emoji === e) return '🎻';
    return e;
  }
  function foldSheet(v, byUser) {
    if (byUser) { sheetFolded.user = v; sheetFolded.text = false; sheetFolded.tap = !v; if (v) store('fold').set('sheet', 1); else store('fold').del('sheet'); }
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
    // phones: the credit mark may be folded into this sheet, so the one-tap "hide everything" is the FIRST row (v0.1.3: big and plain,
    // with the one line that tells it apart from the 🎻 button's own ✕)
    d.body.appendChild(h('button', { type: 'button', class: 'osof-sheet-hide', title: t('hide'), on: { click: function () { hideAll(); } } }, h('span', { 'aria-hidden': 'true' }, '✕ '), t('sheet.hide')));
    d.body.appendChild(h('p', { class: 'osof-small osof-sheet-note' }, t('sheet.hidenote')));
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
  function isBubble(a) { try { return !!(a.matches && a.matches('[class*="bubble"],[class*="caption"],[class*="speech"],[class*="balloon"],.cap,.kaaak,blockquote,figcaption,q,cite')); } catch (e) { return false; } }
  function inFixed(a) { for (var f = a; f && f !== D.body && f !== D.documentElement; f = f.parentElement) { var p = W.getComputedStyle(f).position; if (p === 'fixed' || p === 'sticky') return true; } return false; }
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
          // v0.1.5: a speech bubble, a caption, a quote — words in a box of any tag (the comic's KAAAK bubble on /websitetour)
          var tl = (TEXT_TAGS[a.tagName] || isBubble(a)) ? (a.innerText || '').replace(/\s+/g, ' ').trim().length : ownTextLen(a);
          if (tl > 2) {                                            // words are words: a 16-char link, a <div class=kick> kicker — any tag
            if (textOnly === 'flow' && inFixed(a)) break;          // 'flow': words of the page itself, not of its fixed widgets (those are cleared by the corner rules)
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
  // ── STAY-IN-PLACE (v0.1.5, 23 Nov 2026 — Shaka, from a desktop screenshot of /websitetour: "i dont like how they move across the
  // screen, i want them to stay in place and automatically minimize or close with the tiny x if it ever covers text") ──────────
  // Every piece has ONE fixed anchor: 🌐/🌺 top-left · 🌊/🎻 top-right · the rails down the sides · credit bottom-left · chat pill +
  // radio dock bottom-right · thanks line top-centre. Nothing steps, nudges, slides, lifts or drifts. When words, a caption, a speech
  // bubble, the page's own controls or another piece of ours would run under a piece, the piece FOLDS IN PLACE to its tiny emoji —
  // its box is held, so no neighbour moves either. It unfolds when the ground under its anchor is clear again (re-probed when
  // scrolling stops) or on the visitor's tap. A visitor's own ✕ is never undone by a probe. A playing song is never undone by a
  // fold (the dock folds to 🎧 and keeps playing). The sensors (textUnder · rectHasText · cornerStuff) stayed; only the answer changed.
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
        // v0.1.3: on phones a page's bottom bar spans the whole width (shakaleikaumaka.com's late mini player) — a bar counts, a panel does not
        if (r.width * r.height < vw * vh * 0.2 && (r.width < vw * 0.5 || (state.mobile && r.height < vh * 0.22)) && cf.visibility !== 'hidden' && +cf.opacity > 0.05 && cf.pointerEvents !== 'none') e = union(e, r);
        break;
      }
    }
    return e;
  }
  // is anything of the page under this box — words (textOnly) or also a fixed/sticky control of the page? A grid of small probes
  // (a kicker line between the rows counts, a sliver of a link row under one edge counts)
  function rectHasText(r, textOnly) {
    if (textOnly === undefined) textOnly = true;
    var S = 12, h = r.height || 32, ys = [r.top, r.top + h / 2 - S / 2, r.top + h - S];   // v0.1.5: edge-inclusive rows (a caption 2 px under the bottom edge counts)
    for (var yy = r.top + 18; yy < r.top + h - S - 2; yy += 16) ys.push(yy);
    for (var i = 0; i < ys.length; i++) {
      for (var x = r.left; x <= r.right - S + 1; x += 22) if (textUnder(x, ys[i], S, textOnly)) return true;
      if (textUnder(Math.max(r.left, r.right - S), ys[i], S, textOnly)) return true;
    }
    return false;
  }
  function rectBlocked(r) { return rectHasText(r, false); }
  // a fixed/sticky control of the page under this box (not words): a dot must not sit on a button of the page either
  function ctrlUnder(x, y, size) {
    if (!D.elementsFromPoint) return false;
    var vw = W.innerWidth, vh = W.innerHeight, pts = [[x + 2, y + 2], [x + size / 2, y + size / 2], [x + size - 2, y + size - 2]];
    for (var k = 0; k < pts.length; k++) {
      if (pts[k][0] < 0 || pts[k][1] < 0 || pts[k][0] >= vw || pts[k][1] >= vh) continue;
      var els = D.elementsFromPoint(pts[k][0], pts[k][1]);
      for (var j = 0; j < els.length; j++) {
        var el = els[j]; if (el === D.body || el === D.documentElement) continue;
        for (var a = el; a && a !== D.body && a !== D.documentElement; a = a.parentElement) {
          if (ours(a)) break;
          var cs = W.getComputedStyle(a);
          if (cs.visibility === 'hidden' || +cs.opacity < 0.05 || cs.pointerEvents === 'none') break;
          if (cs.position === 'fixed' || cs.position === 'sticky') { var r = a.getBoundingClientRect(); if (r.width * r.height < vw * vh * 0.35) return true; break; }
        }
      }
    }
    return false;
  }
  function rectHasControl(r) { var S = Math.max(6, Math.min(12, Math.floor(Math.min(r.width, r.height)))); return ctrlUnder(r.left, r.top, S) || ctrlUnder(r.right - S, r.bottom - S, S) || ctrlUnder(r.left + (r.width - S) / 2, r.top + (r.height - S) / 2, S); }
  function overlapsRect(a, b) { return !!(a && b && a.width > 1 && b.width > 1 && a.left < b.right - 2 && a.right > b.left + 2 && a.top < b.bottom - 2 && a.bottom > b.top + 2); }
  // a folded piece keeps the box it had (min sizes on its wrap): the dot sits where the piece was, and nothing around it moves
  function holdBox(wrap, on) {
    if (on) {
      if (wrap.hasAttribute('data-osof-folded')) return;
      var r = wrap.getBoundingClientRect();
      wrap.style.minWidth = Math.round(r.width) + 'px'; wrap.style.minHeight = Math.round(r.height) + 'px';
      wrap.setAttribute('data-osof-folded', '');
    } else { wrap.style.minWidth = wrap.style.minHeight = ''; wrap.removeAttribute('data-osof-folded'); }
  }
  function hasOwnFold(r) { return !!(r.piece && typeof r.piece.fold === 'function'); }
  // fold / unfold one piece in place. byUser: the visitor's own tiny ✕ (session; a probe never undoes it) or a tap on the dot
  // (the piece stays open until the next scroll, even over words — the visitor asked for it)
  function foldRec(r, v, byUser) {
    if (!r || !r.wrap) return;
    v = !!v;
    if (byUser) { r.userFold = v; r.tapOpen = !v; }
    else if (r.userFold) return;
    if (!!r.folded === v) return;
    r.folded = v;
    if (v && !r.idot) makeIdot(r);
    holdBox(r.wrap, v);
    if (hasOwnFold(r)) { try { r.piece.fold(v); } catch (e) {} }
    else r.wrap.toggleAttribute('data-osof-dotted', v);
    if (r.kind === 'tour') cerFolded = v;
    emit('frame:fold', { id: r.id, kind: r.kind, folded: v, byUser: !!byUser });
  }
  // the tiny dot a folded piece becomes (its emoji; a tap unfolds it — the piece itself is not triggered by that tap)
  function makeIdot(r) {
    var lbl = r.kind === 'credit' ? creditLine(data) : labelOf(r);
    r.idot = h('button', { type: 'button', class: 'osof-idot', title: lbl, 'aria-label': lbl + ' · ' + t('unfold'), on: { click: function (e) {
      e.preventDefault(); e.stopPropagation();
      foldRec(r, false, true);
      var f = r.el && (r.el.matches && r.el.matches('a,button') ? r.el : r.el.querySelector && r.el.querySelector('a,button'));
      if (f) focusEl(f);
    } } }, h('span', { 'aria-hidden': 'true' }, emojiOf(r)));
    r.wrap.appendChild(r.idot);
  }
  // the tiny ✕ every piece carries (hover/focus on desktops; always on the pinned phone corners): folds it on purpose for this visit
  function makeItemX(r) {
    if (!r.wrap || r.ix || r.kind === 'chat' || r.kind === 'radio' || r.kind === 'credit' || r.kind === 'sheet' || r.kind === 'globe') return;
    r.ix = h('button', { type: 'button', class: 'osof-fold-x osof-ix', 'aria-label': t('fold') + ': ' + labelOf(r), title: t('fold'), on: { click: function (e) { e.preventDefault(); e.stopPropagation(); foldRec(r, true, true); if (r.idot) focusEl(r.idot); } } }, h('span', { 'aria-hidden': 'true' }, '✕'));
    r.wrap.appendChild(r.ix);
  }
  function moreRecs() {
    var out = [];
    ['left', 'right'].forEach(function (s) { var m = more[s]; if (!m || !m.wrap) return; if (!m.rec) { m.rec = { id: 'more-' + s, kind: 'more', slot: s, item: { label: t('more.title'), emoji: '⋯' }, wrap: m.wrap, el: m.btn, piece: null }; makeItemX(m.rec); } out.push(m.rec); });
    return out;
  }
  // the probe: every piece on its anchor — blocked → fold in place; clear → unfold (unless the visitor folded it)
  function probeAll(mobile) {
    if (!root || state.off || state.asleep || !D.elementsFromPoint) return;
    recs.concat(moreRecs()).forEach(function (r) {
      if (!r.wrap || r.spot || !live(r) || r.wrap.hidden || r.wrap.hasAttribute('data-osof-hid')) return;
      if (r.wrap.getClientRects().length === 0) return;                       // not shown in this mode (rails on phones)
      var b = r.wrap.getBoundingClientRect();
      if (b.width < 2 || b.height < 2) return;
      var blocked = rectBlocked(b);
      if (blocked) { if (!r.tapOpen) foldRec(r, true); }
      else foldRec(r, false);
      var gone = false;
      if (r.folded && !r.tapOpen) { var d = r.idot && r.wrap.hasAttribute('data-osof-dotted') ? r.idot : (hasOwnFold(r) ? r.wrap.querySelector('.osof-rd-mini,.osof-fab-mini') : null); var dr = d && d.getBoundingClientRect(); gone = !!(dr && dr.width > 1 && rectHasControl(dr)); }
      r.wrap.toggleAttribute('data-osof-gone', gone);
    });
    if (mobile && sheetBtn) {                                               // the 🎻 sheet button: probed on its unfolded square (the dot never moves it)
      var sw = sheetBtn.parentElement, sr = sw.getBoundingClientRect(), zr = zones['top-right'].getBoundingClientRect(), sz = 44;
      if (sr.height > 1 && zr.width > 1) {
        var sBlocked = rectBlocked({ left: zr.right - sz, right: zr.right, top: sr.top, height: sz });
        if (sheetFolded.text !== sBlocked && !sheetFolded.user && !(sheetFolded.tap && sBlocked)) foldSheet(sBlocked, false);
      }
    }
    creditLaw(mobile);
  }
  // the credit mark (always rendered, AGPL §7(b)) folds IN PLACE at the bottom-left: words / a page control / our own dock under it →
  // its icons (🎻 · i · ⚙ · ✕); still covered → on phones it rests inside the 🎻 sheet, on desktops it becomes one 🎻 dot that is the
  // credit (title + aria carry the line) and unfolds on a tap. It never steps up the edge.
  var creditTap = false;
  function creditLaw(mobile) {
    root.removeAttribute('data-osof-credit-folded');
    if (!creditBox) return;
    creditBox.classList.remove('osof-credit-mini'); creditBox.classList.remove('osof-credit-dot');
    if (state.zoomedOut && sheetBtn) { root.setAttribute('data-osof-credit-folded', ''); return; }
    if (creditTap) { creditBox.classList.add('osof-credit-mini'); return; }
    var c = creditBox.getBoundingClientRect(), br = extent('bottom-right');
    if (c.width < 2) return;
    if (!rectBlocked(c) && !overlapsRect(c, br)) return;
    creditBox.classList.add('osof-credit-mini');
    var m = creditBox.getBoundingClientRect();
    if (!rectBlocked(m) && !overlapsRect(m, br)) return;
    if (mobile && sheetBtn) { root.setAttribute('data-osof-credit-folded', ''); creditBox.classList.remove('osof-credit-mini'); return; }
    creditBox.classList.add('osof-credit-dot');
  }
  function layout() {
    if (bigFrameOver()) { if (!state.asleep) sleep('iframe'); return; }   // v0.1.4: another page fills the screen → step aside
    if (state.asleep === 'iframe') { wake(); return; }                   // (wake schedules a fresh layout)
    if (state.asleep) return;
    if (!root) return;
    if (state.off) { placeDot(); if (openDlg) place(openDlg); return; }
    var size0 = 54, top00 = 74;
    var narrow = isMobileNow();
    // a page that renders zoomed-out on a phone (a column wider than the screen: the layout viewport outgrows the visual one): its words are tiny and
    // everywhere — the frame folds into the 🎻 sheet and keeps the credit inside it rather than sit on the words
    var vv = W.visualViewport;
    state.zoomedOut = mq('(pointer: coarse)') && !!((vv && vv.width > 0 && vv.width < W.innerWidth * 0.8) || (W.screen && W.screen.width > 0 && W.innerWidth > W.screen.width * 1.3));
    state.crowded = false;                                                 // v0.1.5: desktop rails never relocate into the sheet — crowded pieces fold in place
    var mobile = narrow || state.zoomedOut;
    root.removeAttribute('data-osof-crowded');
    if (mobile !== state.mobile) {
      state.mobile = mobile;
      root.setAttribute('data-mode', mobile ? 'mobile' : 'desktop');
      if (openDlg && openDlg.root.id !== 'osof-dlg-sheet') place(openDlg);
      emit('frame:mode', { mobile: mobile });
    }
    var reduced = mq('(prefers-reduced-motion: reduce)');
    if (reduced !== state.reduced) { state.reduced = reduced; root.setAttribute('data-motion', reduced ? 'reduced' : 'full'); }
    emit('frame:layout', { mobile: mobile });
    var top0 = narrow ? 52 : top00;
    // STAY-IN-PLACE anchors: the top-right stack at top0, always; the top-left stack under the real 🌐 globe (lang.js draws it — we only read where it stands)
    root.style.setProperty('--osof-top-r', top0 + 'px');
    // the 🌐 globe's reserve is read ONCE per page view (lang.js nudges its own button by a few px as it probes; our 🌺 must not follow)
    var lb = langButton(), lbr = lb && isVisible(lb) ? lb.getBoundingClientRect() : null;
    if (lbr && lbr.height > 2 && lbr.top < 120 && !state.langBottom) state.langBottom = Math.round(lbr.bottom);
    var y0l = state.langBottom ? Math.max(top0, state.langBottom + 10) : (hasLang() ? top0 + (narrow ? 44 : 54) + 10 : top0);
    root.style.setProperty('--osof-top-l', y0l + 'px');
    root.toggleAttribute('data-osof-cer-sheet', !!(mobile && cer.lift));   // the phone ceremony sheet: our bottom corners rest while it is up (nothing steps above it)
    if (!mobile) {
      var vh = W.innerHeight;
      // the rails' anchors come from OUR corners alone (a page widget near a corner would move the rail as it scrolls — a sticky bar,
      // a late FAB); a page control under a rail item folds that item instead
      var tl = zoneBox('top-left'), tr = zoneBox('top-right'), bl = zoneBox('bottom-left'), br = zoneBox('bottom-right');
      fitRail('left', (tl ? Math.max(tl.bottom, top0) : top0) + 14, (bl ? Math.min(bl.top, vh - 10) : vh - 10) - 14);
      fitRail('right', (tr ? Math.max(tr.bottom, top0) : top0) + 14, (br ? Math.min(br.top, vh - 10) : vh - 10) - 14);
    }
    probeAll(mobile);
    if (openDlg) place(openDlg);
    if (state.outline) drawOutline();
    if (tour.active && tour.cur) showStep(tour.cur, true);
  }
  // lang.js on the page (its 🌐 globe owns the top-left corner, 54px on desktops / 44px on phones, even before it has drawn)
  function hasLang() { return !!(D.getElementById('olelo') || D.getElementById('olang') || D.querySelector('script[src*="lang.opensourceorchestra.org"],script[src$="/lang.js"]')); }
  function zoneBox(slot) { var z = zones[slot], r = z ? z.getBoundingClientRect() : null; return r && r.width > 1 && r.height > 1 ? { top: r.top, bottom: r.bottom, left: r.left, right: r.right } : null; }
  function onScroll() {
    if (!root || state.off) return;
    recs.forEach(function (r) { r.tapOpen = false; }); sheetFolded.tap = false; creditTap = false;
    clearTimeout(scrollT);
    scrollT = setTimeout(function () { if (!state.off && !tour.active && !finalEl) probeAll(state.mobile); }, 320);
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

  // ── the ceremony (v0.1.3): one caption per button, cross-faded, each spoken by Shaka's twin voice; Esc or Skip ends it ─────
  // Shaka, 22 Nov 2026 (13:24 Chiang Mai): "instead of showing description bubbles lets have a ceremony people can play where you
  // hear my twin voice describe with the text in a nice loving aloha filled welcome and thats a great time to point people to the
  // blessing pool". The words are always on screen with the voice (for the deaf, and lang.js translates them); audio plays only
  // after the visitor's own tap (never unasked); 🔇 keeps the words and drops the voice; the last step is the Blessing Pool.
  var tour = { active: false, auto: false, steps: [], i: -1, timer: 0, cur: null, caps: null, flip: 0, bar: null, count: null, halo: null, play: null, mute: null, text: null };
  var cer = { audio: null, muted: false, paused: false, speaking: false, blocked: false, lift: 0 };
  var finalEl = null, finalTimer = 0;
  function ceremonyOf(key) {
    var c = isObj(data.ceremony) ? data.ceremony : null;
    if (!c || !isObj(c.say) || typeof c.say[key] !== 'string' || !c.say[key]) return null;
    var base = str(c.base) || 'media/ceremony/', ext = /^[a-z0-9]{2,4}$/i.test(str(c.ext)) ? str(c.ext) : 'mp3';
    var audio = c.audio === false ? '' : resolveURL(base.replace(/\/?$/, '/') + key + '.' + ext, dataURL, true);
    return { text: c.say[key], audio: audio };
  }
  function tourUI() {
    if (tour.caps) return;
    tour.caps = [h('div', { class: 'osof-cap', 'aria-hidden': 'true' }), h('div', { class: 'osof-cap', 'aria-hidden': 'true' })];
    tour.halo = h('div', { class: 'osof-halo', 'aria-hidden': 'true', hidden: true });
    tour.count = h('span', { class: 'osof-count', 'aria-hidden': 'true' });
    tour.play = h('button', { type: 'button', class: 'osof-cer-b osof-cer-play', 'aria-label': t('cer.pause'), on: { click: function () { cerToggle(); } } }, h('span', { 'aria-hidden': 'true' }, '⏸'));
    tour.mute = h('button', { type: 'button', class: 'osof-cer-b osof-cer-mute', 'aria-label': t('cer.mute'), 'aria-pressed': 'false', on: { click: function () { cerMute(!cer.muted); } } }, h('span', { 'aria-hidden': 'true' }, '🔊'));
    tour.text = h('div', { class: 'osof-cer-text', 'aria-live': 'polite' });
    tour.bar = h('div', { class: 'osof-tourbar', role: 'group', 'aria-label': t('tour.title'), hidden: true },
      h('div', { class: 'osof-cer-row' },
        h('span', { class: 'osof-tourbar-t' }, h('span', { 'aria-hidden': 'true' }, '🌺 '), h('span', { class: 'osof-tourbar-w' }, t('tour.title'))),
        tour.play, tour.count, tour.mute,
        h('button', { type: 'button', class: 'osof-skip', on: { click: function () { stopTour('skip'); } } }, t('tour.skip'), h('span', { 'aria-hidden': 'true' }, ' ✕'))),
      tour.text);
    root.appendChild(tour.halo); root.appendChild(tour.caps[0]); root.appendChild(tour.caps[1]); root.appendChild(tour.bar);
  }
  function stepFor(r) {
    var s = null;
    if (r.core === 'more') {
      var names = recs.filter(function (x) { return x.slot === r.side && x.overflowed && live(x); }).map(labelOf);
      return { title: t('more.title'), text: fmt(t('more.tip'), { list: names.join(', ') }), target: function () { return more[r.side].btn; } };
    }
    if (r.core === 'credit') s = { key: 'credit', title: '🎻 frame by the ʻohana', text: t('credit.tip'), target: function () { return creditBox; } };
    else if (r.core === 'sheet') s = { key: 'sheet', title: t('sheet.label'), text: t('sheet.tip'), target: function () { return sheetBtn; } };
    else if (r.spot) {
      if (!r.item.tip) return null;
      s = { key: r.id, title: str(r.item.label) || str(r.item.title), text: str(r.item.tip), target: function () { return spotEls(r)[0] || null; } };
    } else {
      if (r.overflowed || !r.piece) return null;
      var text = has(r.piece, 'tour') ? r.piece.tour : undefined;
      if (text === null) return null;
      if (text === undefined || text === '') text = str(r.item.tip) || labelOf(r);
      var tg = typeof r.piece.target === 'function' ? r.piece.target : function () { return r.el; };
      s = { key: r.kind === 'tour' ? 'welcome' : r.id, title: labelOf(r), text: String(text), target: tg, first: r.kind === 'tour' };
    }
    var c = ceremonyOf(s.key);                     // the spoken passage wins over the tip: the caption IS the voice's words
    if (c) { s.text = c.text; s.audio = c.audio; }
    return s;
  }
  function tourSteps() {
    var out = [], first = null;
    RING.forEach(function (slot) {
      var list = recs.filter(function (r) { return r.slot === slot && live(r) && (!state.mobile || slot !== 'top-right' || r.pinned); });
      if (!state.mobile && (slot === 'left' || slot === 'right') && more[slot] && !more[slot].wrap.hidden) list.push({ core: 'more', side: slot });
      if (slot === 'bottom-left') list.push({ core: 'credit' });
      if (state.mobile && slot === 'top-right') list.push({ core: 'sheet' });
      if (UPWARD[slot]) list.reverse();
      list.forEach(function (r) { var s = stepFor(r); if (!s || !s.text) return; if (s.first && !first) first = s; else out.push(s); });
    });
    if (first) out.unshift(first);                 // the welcome: the flower the visitor just pressed
    return out;
  }
  function targetRect(step) {
    var el = null;
    try { el = step.target(); } catch (e) {}
    if (!el || !isVisible(el)) return null;
    var r = el.getBoundingClientRect();
    return onScreen(r) ? { r: r, el: el } : null;
  }
  // words only (no clip, 🔇, or the browser refused to play): reading time
  function dwell(step) { return step.audio ? Math.min(9000, 1800 + step.text.length * 55) : Math.min(2600, 1500 + Math.max(0, (step.title + step.text).length - 48) * 16); }
  function startTour(auto) {
    if (state.off || prefs.hide.tour) return false;
    stopTour('restart', true);
    hideFinal();
    if (openDlg && !auto) closeDialog(openDlg, false, 'tour');
    tourUI();
    var steps = tourSteps();
    if (!steps.length) return false;
    tour.active = true; tour.auto = !!auto; tour.steps = steps; tour.i = -1; tour.cur = null;
    cer.paused = false; cer.speaking = false; cer.blocked = false;
    tour.bar.hidden = false;
    root.setAttribute('data-osof-ceremony', '');
    placeBar();
    syncBar();
    emit('tour:start', { auto: !!auto, steps: steps.length, voice: steps.some(function (s) { return !!s.audio; }) });
    nextStep();
    return true;
  }
  function nextStep() {
    if (!tour.active) return;
    clearTimeout(tour.timer);
    var s = null;
    while (++tour.i < tour.steps.length) { if (targetRect(tour.steps[tour.i])) { s = tour.steps[tour.i]; break; } }
    if (!s) { stopTour('done'); finalCard(); return; }
    showStep(s, false);
    speak(s);
  }
  function cerAudio() {
    if (cer.audio) return cer.audio;
    var a = new W.Audio();
    a.preload = 'auto';
    a.addEventListener('ended', function () { cer.speaking = false; if (tour.active && !cer.paused) tour.timer = setTimeout(nextStep, 420); else if (finalEl && !tour.active) finalTimer = setTimeout(fadeFinal, 6000); });
    a.addEventListener('error', function () { if (!cer.speaking) return; cer.speaking = false; if (tour.active && tour.cur) textTimer(tour.cur); });
    cer.audio = a;
    return a;
  }
  function speak(s) {
    cer.speaking = false;
    if (s.audio && !cer.muted && !cer.blocked && W.Audio) {
      var a = cerAudio();
      try { a.pause(); a.src = s.audio; a.currentTime = 0; } catch (e) {}
      cer.speaking = true;
      var p = null;
      try { p = a.play(); } catch (e) { p = null; cer.speaking = false; }
      if (p && typeof p.then === 'function') {
        p.then(function () { if (tour.halo) tour.halo.classList.toggle('osof-breath', !state.reduced); },
          function (err) { cer.speaking = false; if (notAllowed(err)) { cer.blocked = true; syncBar(); } if (tour.active && tour.cur === s) textTimer(s); });   // autoplay policy: words only until ▶ is tapped; a missing clip = words only for that step
      }
      if (cer.speaking) return;
    }
    textTimer(s);
  }
  function textTimer(s) { clearTimeout(tour.timer); if (!cer.paused) tour.timer = setTimeout(nextStep, dwell(s)); }
  function notAllowed(err) { return !err || !err.name || err.name === 'NotAllowedError'; }   // only the autoplay policy turns ▶ gold; a 404 or a codec error just means words for that step
  function cerToggle() {
    if (!tour.active && !finalEl) return;
    if (cer.blocked) { cer.blocked = false; syncBar(); if (tour.active && tour.cur) speak(tour.cur); else if (finalEl) speakFinal(); return; }
    cer.paused = !cer.paused;
    if (cer.paused) { clearTimeout(tour.timer); clearTimeout(finalTimer); if (cer.speaking && cer.audio) { try { cer.audio.pause(); } catch (e) {} } }
    else if (cer.speaking && cer.audio) { var p; try { p = cer.audio.play(); } catch (e) { p = null; } if (p && p.then) p.then(null, function (err) { cer.speaking = false; if (notAllowed(err)) cer.blocked = true; syncBar(); if (tour.cur) textTimer(tour.cur); }); }
    else if (tour.active && tour.cur) textTimer(tour.cur);
    else if (finalEl) finalTimer = setTimeout(fadeFinal, 4000);
    syncBar();
  }
  function cerMute(v) {
    cer.muted = !!v;
    if (cer.muted && cer.speaking && cer.audio) { try { cer.audio.pause(); } catch (e) {} cer.speaking = false; if (tour.active && tour.cur) textTimer(tour.cur); }
    else if (!cer.muted && tour.active && tour.cur && !cer.paused) speak(tour.cur);
    syncBar();
  }
  function syncBar() {
    if (!tour.bar) return;
    var p = tour.play, m = tour.mute;
    p.firstChild.textContent = cer.blocked ? '▶' : (cer.paused ? '▶' : '⏸');
    p.setAttribute('aria-label', cer.blocked ? t('cer.play') : (cer.paused ? t('cer.resume') : t('cer.pause')));
    p.toggleAttribute('data-osof-blocked', cer.blocked);
    m.firstChild.textContent = cer.muted ? '🔇' : '🔊';
    m.setAttribute('aria-label', cer.muted ? t('cer.unmute') : t('cer.mute'));
    m.setAttribute('aria-pressed', cer.muted ? 'true' : 'false');
    if (tour.halo) tour.halo.classList.toggle('osof-breath', cer.speaking && !cer.paused && !state.reduced);
  }
  // NO COVERED TEXT LAW: the bar stands on the first clear band (top, then lower, then above the credit); on phones it is the
  // bottom sheet (words + controls in one box) and the frame's own bottom corners step above it
  function placeBar() {
    var b = tour.bar; if (!b) return;
    b.style.top = ''; b.style.bottom = '';
    if (state.mobile) { b.setAttribute('data-osof-sheet', ''); cerLift(); return; }
    b.removeAttribute('data-osof-sheet');
    cer.lift = 0;
    var r = b.getBoundingClientRect(), vh = W.innerHeight, tries = [12], y;
    for (y = 12 + r.height + 14; y < vh * 0.35; y += r.height + 12) tries.push(Math.round(y));
    tries.push(Math.round(vh - r.height - 58));
    for (var i = 0; i < tries.length; i++) {
      var box = { left: r.left, right: r.right, top: tries[i], height: r.height };
      if (!rectHasText(box)) { b.style.top = tries[i] + 'px'; return; }
    }
    b.style.top = '12px';
  }
  function cerLift() {
    var el = finalEl && !tour.active ? finalEl : tour.bar;
    var want = state.mobile && el && !el.hidden ? Math.round(el.getBoundingClientRect().height + 16) : 0;
    if (want !== cer.lift) { cer.lift = want; schedule(); }
  }
  function showStep(s, again) {
    var tr = targetRect(s);
    if (!tr) return;
    tour.cur = s;
    tour.count.textContent = (tour.i + 1) + ' / ' + tour.steps.length;
    if (state.mobile) {                              // phones: the words live in the bottom sheet, with the controls
      if (!again) { tour.text.textContent = ''; if (s.title) tour.text.appendChild(h('b', {}, brandify(s.title))); tour.text.appendChild(h('span', {}, brandify(s.text))); tour.text.classList.remove('on'); void tour.text.offsetWidth; tour.text.classList.add('on'); }
      tour.caps[0].classList.remove('on'); tour.caps[1].classList.remove('on');
      cerLift();
    } else {
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
      placeCap(cap, tr.r);
      cap.classList.add('on');
    }
    halo(tr.el, tr.r, !again);
  }
  // NO COVERED TEXT LAW: the caption tries the natural side first, then the other sides, and keeps the first with no words under it
  function placeCap(cap, r) {
    var vw = W.innerWidth, vh = W.innerHeight, w = cap.offsetWidth, hh = cap.offsetHeight, gap = 16;
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var natural = cx < vw / 2 ? 'right' : 'left';
    var order = [natural, cy < vh / 2 ? 'below' : 'above', natural === 'right' ? 'left' : 'right', cy < vh / 2 ? 'above' : 'below'];
    var best = null;
    for (var i = 0; i < order.length; i++) {
      var side = order[i], left, top;
      if (side === 'right') { left = r.right + gap; top = cy - hh / 2; }
      else if (side === 'left') { left = r.left - gap - w; top = cy - hh / 2; }
      else if (side === 'above') { left = cx - w / 2; top = r.top - gap - hh; }
      else { left = cx - w / 2; top = r.bottom + gap; }
      left = clamp(left, 8, Math.max(8, vw - w - 8));
      top = clamp(top, 8, Math.max(8, vh - hh - 8));
      var pos = { side: side, left: left, top: top };
      if (!best) best = pos;
      if (!rectHasText({ left: left, right: left + w, top: top, height: hh })) { best = pos; break; }
    }
    cap.setAttribute('data-side', best.side);
    cap.style.left = Math.round(best.left) + 'px';
    cap.style.top = Math.round(best.top) + 'px';
    cap.style.setProperty('--osof-ay', Math.round(clamp(cy - best.top, 16, hh - 16)) + 'px');
    cap.style.setProperty('--osof-ax', Math.round(clamp(cx - best.left, 16, w - 16)) + 'px');
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
    if (cer.audio && why !== 'done') { try { cer.audio.pause(); } catch (e) {} }
    cer.speaking = false; cer.paused = false;
    if (tour.caps) { tour.caps[0].classList.remove('on'); tour.caps[1].classList.remove('on'); }
    if (tour.halo) { tour.halo.hidden = true; tour.halo.classList.remove('glow'); tour.halo.classList.remove('osof-breath'); }
    if (tour.bar) tour.bar.hidden = true;
    if (why !== 'done') { root.removeAttribute('data-osof-ceremony'); cerLift(); }
    if (!silent) emit('tour:end', { why: why });
  }
  function tourRec() { for (var i = 0; i < recs.length; i++) if (recs[i].kind === 'tour' && live(recs[i])) return recs[i]; return null; }
  function poolRec() { for (var i = 0; i < recs.length; i++) if (live(recs[i]) && (recs[i].id === 'blessing-pool' || recs[i].item.pool === true)) return recs[i]; return null; }
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
  function isHttps(u) { return typeof u === 'string' && /^https:\/\//i.test(u); }
  // the last card lands on the Blessing Pool: the closing line (spoken + written), the pool link, the gift rails, the honest line
  function finalCard() {
    var pr = poolRec(), tr = tourRec();
    var anchor = (pr && pr.el && isVisible(pr.el) && pr.el) || (state.mobile ? sheetBtn : (tr && tr.el) || sheetBtn);
    if (!anchor || !isVisible(anchor)) anchor = null;
    var v = walkVideo(), c = ceremonyOf('closing'), gift = isObj(data.gift) ? data.gift : {};
    var pool = isHttps(gift.pool) ? gift.pool : (pr ? resolveURL(pr.item.href, dataURL) : '');
    var link = function (href, text) { return h('a', { href: href, target: '_blank', rel: 'noopener' }, text); };
    hideFinal();
    var rails = [];
    if (isHttps(gift.x402)) rails.push(t('cer.agents'), ' ', link(gift.x402, 'x402'));
    var hs = [];
    [['stripe', 'Stripe'], ['paypal', 'PayPal'], ['venmo', 'Venmo']].forEach(function (p) { if (isHttps(gift[p[0]])) { if (hs.length) hs.push(' · '); hs.push(link(gift[p[0]], p[1])); } });
    if (hs.length) { if (rails.length) rails.push(' · '); rails.push(t('cer.humans'), ' '); rails = rails.concat(hs); }
    finalEl = h('div', { class: 'osof-final', role: 'group', 'aria-label': t('tour.title') },
      h('p', {}, h('b', {}, t('tour.done')), ' ', c ? brandify(c.text) : t('tour.replay')),
      pool ? h('a', { class: 'osof-watch osof-pool', href: pool, target: '_blank', rel: 'noopener' }, t('cer.pool')) : null,
      rails.length ? h('p', { class: 'osof-rails' }, rails) : null,
      c ? h('p', { class: 'osof-rails osof-voice' }, brandify(t('cer.voice'))) : null,
      v ? h('button', { type: 'button', class: 'osof-link osof-final-v', on: { click: function () { var o = anchor; hideFinal(); walkthrough(o); } } }, fmt(t('tour.watch'), { d: durWord(v.duration) })) : null,
      h('button', { type: 'button', class: 'osof-x', 'aria-label': t('close'), on: { click: hideFinal } }, '✕'));
    finalEl.audio = c ? c.audio : '';
    root.appendChild(finalEl);
    if (state.mobile) { finalEl.setAttribute('data-osof-sheet', ''); if (tour.bar) tour.bar.hidden = true; cerLift(); }
    else {
      var w = finalEl.offsetWidth, hh = finalEl.offsetHeight, vw = W.innerWidth, vh = W.innerHeight, left, top;
      if (anchor) {
        var r = anchor.getBoundingClientRect();
        left = r.left - 16 - w; top = r.top + r.height / 2 - hh / 2;
        if (left < 8) left = r.right + 16;
      } else { left = (vw - w) / 2; top = vh - hh - 90; }
      left = clamp(left, 8, vw - w - 8); top = clamp(top, 8, vh - hh - 8);
      if (rectHasText({ left: left, right: left + w, top: top, height: hh })) {                 // words under it → the band under the bar, then centre-bottom
        var alt = [[Math.round((vw - w) / 2), 12 + 46 + 14], [Math.round((vw - w) / 2), vh - hh - 60]];
        for (var i = 0; i < alt.length; i++) if (!rectHasText({ left: alt[i][0], right: alt[i][0] + w, top: alt[i][1], height: hh })) { left = alt[i][0]; top = alt[i][1]; break; }
      }
      finalEl.style.left = Math.round(left) + 'px';
      finalEl.style.top = Math.round(top) + 'px';
    }
    if (anchor) { tourUI(); halo(anchor, anchor.getBoundingClientRect(), true); }
    var el = finalEl;
    (W.requestAnimationFrame || setTimeout)(function () { el.classList.add('on'); });
    if (!speakFinal()) finalTimer = setTimeout(fadeFinal, c ? 9000 : 6000);
  }
  function speakFinal() {
    if (!finalEl || !finalEl.audio || cer.muted || cer.blocked || !W.Audio) return false;
    var a = cerAudio();
    try { a.pause(); a.src = finalEl.audio; a.currentTime = 0; } catch (e) { return false; }
    cer.speaking = true;
    var p = null;
    try { p = a.play(); } catch (e) { cer.speaking = false; return false; }
    if (p && typeof p.then === 'function') p.then(null, function (err) { cer.speaking = false; if (notAllowed(err)) cer.blocked = true; finalTimer = setTimeout(fadeFinal, 9000); });
    return true;
  }
  function fadeFinal() {
    var el = finalEl; if (!el) return;
    var hold = function () { return el.matches(':hover') || el.contains(D.activeElement); };
    if (hold()) { finalTimer = setTimeout(fadeFinal, 1500); return; }
    hideFinal();
  }
  function hideFinal() {
    clearTimeout(finalTimer);
    if (tour.halo && !tour.active) { tour.halo.hidden = true; tour.halo.classList.remove('glow'); tour.halo.classList.remove('osof-breath'); }
    if (!tour.active && cer.audio && cer.speaking) { try { cer.audio.pause(); } catch (e) {} cer.speaking = false; }
    if (!tour.active && root) root.removeAttribute('data-osof-ceremony');
    if (!finalEl) return;
    var el = finalEl; finalEl = null;
    el.classList.remove('on');
    setTimeout(function () { el.remove(); }, state.reduced ? 0 : 320);
    cerLift();
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
    // 22 Nov 2026, Shaka: "remove the description bubbles on ALL DOORS … they are too big … distracting" → the ceremony never
    // starts by itself (and audio could not autoplay anyway). 🌺 (or FRAMES.tour()) plays it for whoever asks. Forks: data.tour = {auto:true}
    // brings back the silent caption tour on a first visit.
    if (!(isObj(data.tour) && data.tour.auto === true)) return;
    if (state.outline || state.off || prefs.hide.tour || !once.peek('tour')) return;
    var sig = recs.some(function (r) { return r.kind === 'signature'; }) && once.got('signature') === true;
    var done = false, offSig = null, offPanel = null;
    function go() {
      if (done) return;
      if (D.hidden) { D.addEventListener('visibilitychange', function v() { if (!D.hidden) { D.removeEventListener('visibilitychange', v); go(); } }); return; }
      if (openDlg) { if (!offPanel) offPanel = on('panel:close', function () { offPanel(); offPanel = null; setTimeout(go, 1500); }); return; }
      done = true;
      if (offSig) offSig();
      if (once('tour')) { cer.blocked = true; startTour(true); }   // an unasked start never plays audio (browser policy + Shaka's law)
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
  // v0.1.3: the 🌺 ceremony button — always top-left (under the 🌐 globe), on phones too; folds to a dot when words run under it
  function defineTour() {
    kinds.tour = function (ctx, item) {
      var label = str(item.label) || t('tour');
      var b = ctx.h('button', { type: 'button', class: 'osof-btn osof-btn-lg osof-tourbtn osof-cerbtn', 'aria-label': label, 'aria-describedby': null, on: { click: function () { startTour(false); } } },
        ctx.h('span', { class: 'osof-emo', 'aria-hidden': 'true' }, str(item.emoji) || '🌺'),
        ctx.h('span', { class: 'osof-lbl', 'aria-hidden': 'true' }, label));
      cerBtn = b; cerLabel = label; cerFolded = false;
      return { el: b, tour: str(item.tip) || t('tour.tip'), open: function () { startTour(false); } };
    };
  }
  // (v0.1.5: the 🌺 folds like every other piece — in place, to its dot — through foldRec; cerFolded mirrors it for the API)

  // ── CSS (every selector starts with #oso-frames; light DOM so translators can read it) ──
  var SERIF = 'Georgia,"Iowan Old Style","Palatino Linotype",Palatino,"Times New Roman",serif';
  var SANS = 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  var EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';
  function coreCSS() {
    var F = '#oso-frames';
    return [
      F + '{position:static;font:400 14px/1.35 ' + SERIF + ';color:#f4ecdc;text-align:left;direction:ltr;-webkit-text-size-adjust:100%}',
      F + ' *{box-sizing:border-box;margin:0;padding:0;border:0 solid;background:none;color:inherit;font:inherit;letter-spacing:inherit;text-transform:none;text-decoration:none;text-shadow:none;box-shadow:none;float:none;max-width:none;min-width:0;inset:auto}',
      F + ' [hidden]{display:none!important}',
      F + '[data-osof-asleep]{display:none!important}',
      // v0.1.4 ABSORB: 76 doors of the ʻohana still carry the rail that came before the frame (🌺 all doors panel · 🎻 join · its panel);
      // with the frame on they were two 🌺 and two 🎻 on one screen (Shaka, 23 Nov 2026). The frame carries those doors now.
      'html[data-osof-on] #oflo,html[data-osof-on] #oflop,html[data-osof-on] #oviol{display:none!important}',
      // v0.1.7 ABSORB: the pre-frame x402 pill (#x4-wrap · its dot · its overlay — 143 doors) bows out while the frame is on
      // (the 🌊 Blessing Pool opens the same card) or while the visitor hid everything (one ✕ hides ALL buttons). v2.0 of
      // x402-tip.js already bows out by itself; this net catches the old cached copies (Shaka, 27 Nov 2026).
      'html[data-osof-on] #x4-wrap,html[data-osof-on] #x4-mini,html[data-osof-on] #x4-ovl,html[data-osof-off] #x4-wrap,html[data-osof-off] #x4-mini,html[data-osof-off] #x4-ovl{display:none!important}',
      // v0.1.8 ABSORB: the blessing magnet (#cmag · #cmag-lite · its panel — 131 doors of the ʻohana's pre-frame gift rail) bows
      // out while the frame is on: its rails (pool · address · PayPal · Venmo · tide) all live in the 🌊 card now — AND the 54px
      // magnet rode over the frame's phone top-right anchor (52px), so the NO COVERED TEXT law folded the 🌊 away entirely
      // (Shaka, 27 Nov 2026: "x402 pennies of aloha is down … covered by a flowr"). Frame-off brings the magnet back.
      'html[data-osof-on] #cmag,html[data-osof-on] #cmag-lite,html[data-osof-on] #cmagb,html[data-osof-off] #cmag,html[data-osof-off] #cmag-lite,html[data-osof-off] #cmagb{display:none!important}',
      // the zones are <nav>/<div>: a page's own "nav{position:fixed;left:0;right:0;display:grid;padding:…}" must not reach them
      // (publicinform.com, 22 Nov 2026: the right rail landed at x=0 over the left one) → every zone starts from a clean slate
      F + ' .osof-slot{all:unset;position:fixed;inset:auto;z-index:' + Z.frame + ';pointer-events:none;display:flex;flex-direction:column;box-sizing:border-box;margin:0;padding:0;border:0;background:none;width:auto;height:auto;min-height:0;max-height:none;transform:none;overflow:visible;font:inherit;color:inherit;direction:ltr}',
      F + ' .osof-slot::before,' + F + ' .osof-slot::after{content:none!important;display:none!important}',
      F + ' .osof-slot>*{pointer-events:auto}',
      F + ' .osof-item{position:relative;display:flex;flex:none}',
      F + ' [data-slot=top-left]{left:calc(10px + env(safe-area-inset-left,0px));right:auto;top:var(--osof-top-l,74px);bottom:auto;width:54px;align-items:center;gap:0}',
      F + ' [data-slot=top-right]{right:calc(10px + env(safe-area-inset-right,0px));left:auto;top:var(--osof-top-r,74px);bottom:auto;width:54px;align-items:center;gap:10px}',
      F + ' [data-slot=left]{left:calc(10px + env(safe-area-inset-left,0px));right:auto;bottom:auto;width:54px;align-items:center}',
      F + ' [data-slot=right]{right:calc(10px + env(safe-area-inset-right,0px));left:auto;bottom:auto;width:54px;align-items:center}',
      F + ' [data-slot=bottom-left]{left:calc(10px + env(safe-area-inset-left,0px));right:auto;top:auto;bottom:calc(10px + env(safe-area-inset-bottom,0px));align-items:flex-start;gap:10px}',
      F + ' [data-slot=bottom-right]{right:calc(10px + env(safe-area-inset-right,0px));left:auto;top:auto;bottom:calc(10px + env(safe-area-inset-bottom,0px));align-items:flex-end;gap:10px}',
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
      F + '[data-mode=mobile] [data-slot=top-left]{left:calc(8px + env(safe-area-inset-left,0px));top:var(--osof-top-l,52px);width:38px}',
      F + '[data-mode=mobile] [data-slot=top-right]{right:calc(8px + env(safe-area-inset-right,0px));top:var(--osof-top-r,52px);gap:8px}',
      // v0.1.3: pinned items (🌊 Blessing Pool) stay on phones, first in the stack; the 🌺 ceremony stays top-left at 38px
      F + '[data-mode=mobile] [data-slot=top-right]>.osof-item:not(.osof-sheet-item):not([data-osof-pin]),' + F + '[data-mode=mobile] [data-slot=bottom-left]>.osof-item:not([data-osof-kind=credit]),' + F + '[data-mode=mobile] [data-osof-hom]{display:none}',
      F + '[data-mode=mobile] [data-slot=top-right] [data-osof-pin] .osof-btn{width:44px;height:44px;font-size:21px}',
      F + '[data-mode=mobile] .osof-cerbtn{width:38px;height:38px;font-size:18px}',
      // v0.1.5 STAY-IN-PLACE: a folded piece keeps its box (min sizes on the wrap) and shows one dot where it stood; the tiny ✕ shows on hover/focus (always on the pinned phone corners)
      F + ' .osof-item[data-osof-folded]{align-items:center;justify-content:center}',
      F + ' [data-slot=bottom-right] .osof-item[data-osof-folded]{justify-content:flex-end}',
      F + ' [data-slot=bottom-left] .osof-item[data-osof-folded]{justify-content:flex-start}',
      F + ' .osof-item[data-osof-dotted]>:not(.osof-idot){display:none!important}',
      F + ' .osof-idot{position:relative;display:none;width:17px;height:17px;border-radius:50%;align-items:center;justify-content:center;background:rgba(20,18,45,.86);border:1px solid rgba(251,226,160,.55);font:9px/1 ' + EMOJI + ';opacity:.5;cursor:pointer;box-shadow:none;transition:opacity .2s ease}',
      F + ' .osof-idot::after{content:"";position:absolute;inset:-10px}',
      F + ' .osof-idot:hover,' + F + ' .osof-idot:focus-visible{opacity:.95}',
      F + ' .osof-item[data-osof-dotted]>.osof-idot{display:flex}',
      F + '[data-mode=mobile] .osof-idot{width:20px;height:20px;font-size:10px;opacity:.62}',
      F + ' .osof-fold-x.osof-ix{display:none;width:18px;height:18px;font-size:9px}',
      F + ' .osof-fold-x.osof-ix::after{inset:-3px}',
      F + ' .osof-item:hover>.osof-fold-x.osof-ix,' + F + ' .osof-item:focus-within>.osof-fold-x.osof-ix{display:flex}',
      F + '[data-mode=mobile] .osof-item[data-osof-pin]>.osof-fold-x.osof-ix{display:flex}',
      F + ' .osof-item[data-osof-folded]>.osof-fold-x.osof-ix,' + F + ' .osof-item[data-osof-gone]>.osof-fold-x.osof-ix{display:none!important}',
      F + ' .osof-item[data-osof-gone]>*{visibility:hidden!important}',
      // v0.1.10 THE BOX LETS GO (Shaka, 28 Nov 2026, opensourceorchestra.org: "the x close button doesnt work on talk to oso"): a piece that stepped
      // aside keeps its BOX (so nothing around it moves) but the box must never eat a click meant for the page — the held, invisible wrapper sat on
      // the page's own ✕ (a .osof-slot child is pointer-events:auto, and only its CHILDREN were hidden). Folded: the wrapper falls through and only
      // what is still SHOWN (the dot, the piece's own mini) takes taps. Gone: nothing inside takes a click. e2e test 13 is the oracle.
      F + ' .osof-item[data-osof-folded]{pointer-events:none!important}',
      F + ' .osof-item[data-osof-folded]>*{pointer-events:auto}',
      F + ' .osof-item[data-osof-gone],' + F + ' .osof-item[data-osof-gone] *{pointer-events:none!important}',
      F + ' [data-slot=right] .osof-ix,' + F + ' [data-slot=top-right] .osof-ix,' + F + ' [data-slot=bottom-right] .osof-ix{left:auto;right:-7px}',
      F + ' .osof-credit-dot{padding:0!important;height:18px!important;width:18px!important;justify-content:center;opacity:.6}',
      F + ' .osof-credit-dot .osof-credit-i{display:none!important}',
      F + ' .osof-credit-dot .osof-credit-a{padding:0;font-size:0;gap:0}',
      F + ' .osof-credit-dot .osof-credit-a span[aria-hidden]{font-size:9px}',
      F + ' .osof-credit-dot .osof-credit-a::after{inset:-10px}',
      F + '[data-osof-cer-sheet] [data-slot=bottom-left],' + F + '[data-osof-cer-sheet] [data-slot=bottom-right]{display:none!important}',
      F + '[data-mode=mobile] .osof-sheetbtn{width:44px;height:44px;font-size:21px}',
      F + '[data-mode=mobile] .osof-sheet-item{order:2}',
      F + '[data-mode=mobile] .osof-lbl{display:none}',                              // touch: a tapped button keeps :hover — its label would sit on the words                        // phones: the pinned 🌊 stands first, the 🎻 under it
      F + '[data-mode=mobile] [data-slot=bottom-left]{left:calc(8px + env(safe-area-inset-left,0px));bottom:calc(8px + env(safe-area-inset-bottom,0px))}',
      F + '[data-mode=mobile] [data-slot=bottom-right]{right:calc(8px + env(safe-area-inset-right,0px));bottom:calc(8px + env(safe-area-inset-bottom,0px))}',
      F + '[data-mode=mobile] .osof-credit{height:30px;font-size:11.5px}',
      F + '[data-mode=mobile] .osof-dlg{left:8px!important;right:8px!important;top:auto!important;bottom:calc(8px + env(safe-area-inset-bottom,0px))!important;width:auto;max-height:min(86vh,calc(100vh - 24px))}',
      F + '[data-osof-globe=open] [data-slot=left]{visibility:hidden}',
      // the ⚙ panel · hidden pieces · the frame off (one dot) · the folded 🎻 (BUTTON LAW)
      F + ' .osof-credit-g{font:16px/1 ' + EMOJI + ';font-style:normal}',
      F + ' .osof-credit-x{font:700 11px/1 ' + SANS + ';font-style:normal;opacity:.8}',
      F + ' .osof-credit-x:hover,' + F + ' .osof-credit-x:focus-visible{opacity:1}',
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
      F + ' .osof-btn.osof-fold{width:17px!important;height:17px!important;font-size:9px!important;opacity:.45;box-shadow:none}',
      F + ' .osof-btn.osof-fold:hover,' + F + ' .osof-btn.osof-fold:focus-visible{opacity:.95;transform:none}',
      F + ' .osof-btn.osof-fold .osof-emo{transform:none!important;animation:none!important}',
      F + ' .osof-btn.osof-fold .osof-lbl{display:none}',
      F + '[data-mode=mobile] .osof-btn.osof-fold{width:20px!important;height:20px!important;font-size:10px!important;opacity:.62}',
      // v0.1.3 · "✕ hide frame" next to the credit mark (hover/focus; once for 4 s on a first visit) · the phone sheet's first row
      F + ' .osof-credit-x .osof-x-lbl{left:calc(100% + 14px);font:600 12px/1.2 ' + SANS + ';padding:5px 10px}',
      F + ' .osof-credit-x:hover .osof-x-lbl,' + F + ' .osof-credit-x:focus-visible .osof-x-lbl,' + F + ' .osof-credit-x.osof-say .osof-x-lbl{opacity:1;transform:translate(0,-50%)}',
      F + '[data-mode=mobile] .osof-x-lbl{display:none}',
      F + ' .osof-sheet-hide{display:flex;align-items:center;justify-content:center;gap:4px;width:100%;min-height:48px;margin:0 0 6px;border:1px solid rgba(251,226,160,.5);border-radius:12px;background:rgba(251,226,160,.06);color:#fbe2a0;font:700 16px/1.2 ' + SERIF + ';cursor:pointer}',
      F + ' .osof-sheet-hide:hover{background:rgba(251,226,160,.14)}',
      F + ' .osof-sheet-note{margin:0 0 12px}',
      // v0.1.3 · the ceremony: bar (desktop) / bottom sheet (phones), ▶⏸ · n/N · 🔊🔇 · Skip ✕, the words always with the voice
      F + ' .osof-cer-row{display:flex;align-items:center;gap:10px}',
      F + ' .osof-cer-text{display:none}',
      F + ' .osof-cer-b{flex:none;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid rgba(251,226,160,.55);color:#fbe2a0;font:15px/1 ' + SANS + ';cursor:pointer}',
      F + ' .osof-cer-b:hover{background:rgba(251,226,160,.12)}',
      F + ' .osof-cer-play[data-osof-blocked]{background:linear-gradient(135deg,#f3d27e,#e9c46a);color:#21170a;border-color:transparent}',
      F + ' .osof-tourbar[data-osof-sheet]{top:auto;bottom:calc(8px + env(safe-area-inset-bottom,0px));left:8px;right:8px;transform:none;flex-direction:column;align-items:stretch;gap:0;white-space:normal;border-radius:16px;padding:6px 6px 10px 12px}',
      F + ' .osof-tourbar[data-osof-sheet] .osof-cer-row{justify-content:space-between;gap:6px}',
      F + ' .osof-tourbar[data-osof-sheet] .osof-tourbar-w{display:none}',
      F + ' .osof-tourbar[data-osof-sheet] .osof-cer-text{display:block;min-height:4.2em;margin-top:6px;padding-right:4px;font:15px/1.4 ' + SERIF + ';color:#f4ecdc;opacity:0;transition:opacity .25s ease}',
      F + ' .osof-tourbar[data-osof-sheet] .osof-cer-text.on{opacity:1}',
      F + ' .osof-cer-text b{display:block;color:#fbe2a0;margin-bottom:2px}',
      F + ' .osof-final[data-osof-sheet]{left:8px!important;right:8px;top:auto!important;bottom:calc(8px + env(safe-area-inset-bottom,0px));max-width:none}',
      F + ' .osof-rails{flex:1 1 100%;font:12px/1.4 ' + SANS + ';color:#d8ccb4}',
      F + ' .osof-rails a{color:#fbe2a0;text-decoration:underline;text-underline-offset:.16em}',
      F + ' .osof-pool{display:inline-flex;align-items:center;text-decoration:none!important}',
      F + ' .osof-final-v{font-size:12.5px}',
      F + ' .osof-tourbar-t{display:inline-flex;align-items:center}',
      // the first visit: one entrance, once (THE ONE-TIME LAW); never again, never a loop
      '@media (prefers-reduced-motion:no-preference){',
      '@keyframes osof-in-l{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:none}}',
      '@keyframes osof-in-r{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}',
      '@keyframes osof-in-b{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}',
      '@keyframes osof-glow{0%{box-shadow:0 0 0 0 rgba(251,226,160,0)}40%{box-shadow:0 0 0 3px rgba(251,226,160,.95),0 0 28px 9px rgba(251,226,160,.5)}100%{box-shadow:0 0 0 2px rgba(251,226,160,.85),0 0 14px 3px rgba(251,226,160,.28)}}',
      F + '.osof-enter .osof-slot>.osof-item{animation:osof-in-l .55s cubic-bezier(.2,.8,.2,1) calc(300ms + var(--osof-i,0) * 40ms) both}',
      F + '.osof-enter [data-slot=right]>.osof-item,' + F + '.osof-enter [data-slot=top-right]>.osof-item{animation-name:osof-in-r}',
      F + '.osof-enter [data-slot=bottom-left]>.osof-item,' + F + '.osof-enter [data-slot=bottom-right]>.osof-item{animation-name:osof-in-b}',
      F + '.osof-enter [data-slot=overlay]>.osof-item{animation:none!important}',   // a transformed wrapper would turn the thanks line's position:fixed into "absolute" (22 Nov 2026)
      F + ' .osof-halo.glow{animation:osof-glow 1.1s ease-out 1 both}',
      // v0.1.3 · the ceremony: the halo glides from button to button and breathes while the voice speaks (user-initiated motion)
      '@keyframes osof-breath{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}',
      F + '[data-osof-ceremony] .osof-halo{transition:left .45s cubic-bezier(.2,.8,.2,1),top .45s cubic-bezier(.2,.8,.2,1),width .45s ease,height .45s ease}',
      F + ' .osof-halo.osof-breath{animation:osof-breath 2.4s ease-in-out infinite}',
      F + ' .osof-halo.glow.osof-breath{animation:osof-glow 1.1s ease-out 1 both,osof-breath 2.4s ease-in-out infinite}',
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
    W.addEventListener('resize', function () { state.langBottom = 0; schedule(); });
    W.addEventListener('orientationchange', schedule);
    W.addEventListener('load', function () { recheck(); });
    if (D.fonts && D.fonts.ready) D.fonts.ready.then(schedule, function () {});
    D.addEventListener('keydown', onKey, true);
    D.addEventListener('pointerdown', onPointer, true);
    D.addEventListener('visibilitychange', function () { if (D.hidden && tour.active && tour.auto) stopTour('hidden'); });
    if (W.MutationObserver) {
      // v0.1.3: for the first 15 s the whole tree is watched (a mini player built late inside a <footer>, a class that reveals a
      // widget) so the corners re-run their law; after that only direct children of <body> (cheap, as before)
      var mt = 0, mo = new W.MutationObserver(function (ms) {
        for (var i = 0; i < ms.length; i++) {
          var tg = ms[i].target;
          if (tg && tg.nodeType === 1 && (tg === root || root.contains(tg) || tg.id === 'olelo')) continue;
          if (ms[i].type === 'attributes') { clearTimeout(mt); mt = setTimeout(recheck, 250); return; }
          var nodes = [].slice.call(ms[i].addedNodes).concat([].slice.call(ms[i].removedNodes));
          if (nodes.some(function (n) { return n !== root && n.nodeType === 1 && n.tagName !== 'SCRIPT' && n.tagName !== 'STYLE' && !root.contains(n); })) { clearTimeout(mt); mt = setTimeout(recheck, 150); return; }
        }
      });
      mo.observe(D.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
      setTimeout(function () { mo.disconnect(); mo.observe(D.body, { childList: true }); }, 15000);
    }
    W.addEventListener('scroll', onScroll, { passive: true });
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
    recs.slice().forEach(function (r) { if (r.item.unless && !r.spot && !r.drawerOnly && unlessMatches(r.item.unless)) adoptRec(r); });
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
      // v0.1.4 EMBED LAW (23 Nov 2026, Shaka's phone: a door opened inside another door's shell wore two frames): inside an
      // <iframe> the frame stays away — the page around it already wears one, or never asked for a ring. data-embed="allow" invites it.
      var embedded = false; try { embedded = W.top !== W.self; } catch (e) { embedded = true; }
      if (embedded && !(SCRIPT && SCRIPT.getAttribute('data-embed') === 'allow')) { info('EMBED LAW: this page sits inside another page — the frame stays away (data-embed="allow" on the script tag invites it)'); return; }
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
    sleep: sleep,                                                       // v0.1.4: step aside while a shell shows another page (not remembered)
    wake: wake,
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
// ── src/pieces/door.js ──
/* ── pieces: door + pill (and their tiles in the phone sheet) ─────────────────────
 * door  {emoji, label, href, tip, anim: bob|sway|spin|pulse|flutter|none, newTab}
 *       a round plum-glass button; the label appears on hover/focus; the emoji moves once on
 *       the first visit (with the entrance) and again only when the visitor hovers it.
 * pill  {emoji, title, sub, href, tip, dismiss, tone: plum|gold, newTab}
 *       a wide pill (bottom-left); ✕ bows it out to a tiny emoji, remembered; FRAMES.reset() restores.
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
  var ANIMS = { bob: 1, sway: 1, spin: 1, pulse: 1, flutter: 1, none: 1 };
  var SERIF = 'Georgia,"Iowan Old Style","Palatino Linotype",Palatino,"Times New Roman",serif';
  var SANS = 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  var F = '#oso-frames';
  var CSS = [
    F + ' .osof-door{text-decoration:none!important}',
    F + ' .osof-door .osof-emo{transform-origin:50% 60%}',
    F + ' .osof-sr{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}',
    F + ' .osof-pillbox{position:relative;display:flex}',
    F + ' .osof-pill{display:inline-flex;align-items:center;gap:10px;min-height:46px;max-width:min(280px,calc(100vw - 40px));padding:6px 18px 6px 9px;border-radius:999px;background:linear-gradient(135deg,rgba(52,27,80,.96),rgba(20,18,45,.96));border:1px solid rgba(251,226,160,.5);color:#fff6e6;text-decoration:none!important;box-shadow:0 7px 26px rgba(9,5,20,.45);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);transition:transform .2s ease,border-color .2s ease}',
    F + ' .osof-pill:hover{border-color:rgba(251,226,160,.95);transform:translateY(-1px)}',
    F + ' .osof-pill-emo{flex:none;display:grid;place-items:center;width:30px;height:30px;font:24px/1 "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}',
    F + ' .osof-pill-txt{display:flex;flex-direction:column;gap:2px;min-width:0}',
    F + ' .osof-pill-t{font:700 14px/1.15 ' + SERIF + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    F + ' .osof-pill-s{font:600 11.5px/1.2 ' + SANS + ';letter-spacing:.02em;color:#ecdcc0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    F + ' .osof-pill.osof-gold{background:linear-gradient(135deg,#f3c75c,#ffd774 55%,#e6a93a);border-color:rgba(255,255,255,.45);color:#1d1406;box-shadow:0 6px 22px rgba(245,185,66,.35),0 2px 6px rgba(0,0,0,.35)}',
    F + ' .osof-pill.osof-gold .osof-pill-s{color:#3b2a0c}',
    F + ' .osof-pill-x{position:absolute;top:-9px;left:-7px;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#3d1c42,#221436);border:1px solid rgba(251,226,160,.7);color:#fbe2a0;font:12px/1 ' + SANS + ';cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.45)}',
    F + ' .osof-pill-x:hover{background:#4a2552}',
    F + ' .osof-pill-mini{width:44px;height:44px;font-size:20px}',
    '@media (prefers-reduced-motion:no-preference){',
    '@keyframes osof-bob{0%,100%{transform:translateY(0)}35%{transform:translateY(-5px)}70%{transform:translateY(1px)}}',
    '@keyframes osof-sway{0%,100%{transform:rotate(0)}25%{transform:rotate(-13deg)}60%{transform:rotate(9deg)}85%{transform:rotate(-3deg)}}',
    '@keyframes osof-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}',
    '@keyframes osof-pulse{0%,100%{transform:scale(1)}40%{transform:scale(1.22)}70%{transform:scale(.95)}}',
    '@keyframes osof-flutter{0%,100%{transform:scaleX(1)}20%{transform:scaleX(.5)}40%{transform:scaleX(1)}60%{transform:scaleX(.55)}80%{transform:scaleX(1)}}',
    F + ' .osof-door:hover .osof-emo,' + F + ' .osof-door:focus-visible .osof-emo{animation:var(--osof-anim,none) .9s ease-in-out 1}',
    F + '.osof-enter .osof-door .osof-emo{animation:var(--osof-anim,none) .9s ease-in-out calc(820ms + var(--osof-i,0) * 40ms) 1}',
    '}'
  ].join('\n');

  function newTabAttrs(item) { return item.newTab ? { target: '_blank', rel: 'noopener' } : {}; }
  function merge(a, b) { for (var k in b) if (Object.prototype.hasOwnProperty.call(b, k)) a[k] = b[k]; return a; }

  // the tip becomes the accessible description (screen readers hear what the tour says)
  function described(ctx, item, el) {
    if (!item.tip) return null;
    var id = 'osof-d-' + item.id;
    el.setAttribute('aria-describedby', id);
    return ctx.h('span', { id: id, hidden: true }, String(item.tip));
  }

  function tile(ctx, href, item, emoji, label) {
    return ctx.h('a', merge({ class: 'osof-tile', href: href }, newTabAttrs(item)),
      ctx.h('span', { class: 'osof-tile-emo', 'aria-hidden': 'true' }, emoji),
      ctx.h('span', { class: 'osof-tile-lbl' }, label));
  }

  FRAMES.define('door', function (ctx, item) {
    var href = ctx.resolve(item.href);
    var label = String(item.label || '').trim();
    if (!href || !label) return null;                         // a door needs a safe address and a name
    ctx.css('door', CSS);
    var emoji = String(item.emoji || '🚪');
    var anim = ANIMS[item.anim] ? item.anim : 'none';
    var name = label + (item.newTab ? ' ' + ctx.t('newtab') : '');
    var a = ctx.h('a', merge({ class: 'osof-btn osof-door', href: href, 'aria-label': name, style: '--osof-anim:' + (anim === 'none' ? 'none' : 'osof-' + anim) }, newTabAttrs(item)),
      ctx.h('span', { class: 'osof-emo', 'aria-hidden': 'true' }, emoji),
      ctx.h('span', { class: 'osof-lbl', 'aria-hidden': 'true' }, label));
    var d = described(ctx, item, a);
    if (d) a.appendChild(d);
    // v0.1.7: a "gift" door (the 🌊 Blessing Pool) keeps its href (SEO, middle-click, no-JS) but a plain tap
    // opens the pennies-of-aloha card (x402 inline) instead of navigating — one ring, one gift card everywhere.
    function giftTap(e) {
      if (!item.gift || !(FRAMES.gift && FRAMES.gift.open)) return;
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (e.button && e.button !== 0)) return;
      if (FRAMES.gift.open(ctx, item)) e.preventDefault();
    }
    if (item.gift) { a.setAttribute('aria-haspopup', 'dialog'); a.addEventListener('click', giftTap); }
    return {
      el: a,
      tour: item.tip || label,
      open: function () { a.click(); },
      tile: function () { var tl = tile(ctx, href, item, emoji, label); if (item.gift) tl.addEventListener('click', giftTap); return tl; }
    };
  });

  FRAMES.define('pill', function (ctx, item) {
    var href = ctx.resolve(item.href);
    var title = String(item.title || item.label || '').trim();
    if (!href || !title) return null;
    ctx.css('door', CSS);
    var emoji = String(item.emoji || '✨');
    var sub = String(item.sub || '').trim();
    var dis = ctx.store('dismiss:' + ctx.data.id);
    // no aria-label: the accessible name IS the visible words (label-in-name); a space keeps them apart
    var a = ctx.h('a', merge({ class: 'osof-pill' + (item.tone === 'gold' ? ' osof-gold' : '') , href: href }, newTabAttrs(item)),
      ctx.h('span', { class: 'osof-pill-emo', 'aria-hidden': 'true' }, emoji),
      ctx.h('span', { class: 'osof-pill-txt' },
        ctx.h('span', { class: 'osof-pill-t' }, title),
        sub ? ' ' : null,
        sub ? ctx.h('span', { class: 'osof-pill-s' }, sub) : null,
        item.newTab ? ctx.h('span', { class: 'osof-sr' }, ' ' + ctx.t('newtab')) : null));
    var d = described(ctx, item, a);
    var box = ctx.h('div', { class: 'osof-pillbox' }, a, d);
    if (item.dismiss) {
      var mini = ctx.h('button', { type: 'button', class: 'osof-btn osof-pill-mini', 'aria-label': ctx.t('pill.show', 'Show') + ': ' + title, hidden: true },
        ctx.h('span', { class: 'osof-emo', 'aria-hidden': 'true' }, emoji),
        ctx.h('span', { class: 'osof-lbl', 'aria-hidden': 'true' }, title));
      var x = ctx.h('button', { type: 'button', class: 'osof-pill-x', 'aria-label': ctx.t('pill.hide', 'Hide') + ': ' + title }, '✕');
      var set = function (gone, focus) {
        a.hidden = x.hidden = !!gone;
        mini.hidden = !gone;
        if (focus) (gone ? mini : a).focus();
      };
      x.addEventListener('click', function (e) { e.preventDefault(); dis.set(item.id, 1); set(true, true); });
      mini.addEventListener('click', function () { dis.del(item.id); set(false, true); });
      ctx.on('frame:reset', function () { set(false, false); });
      box.appendChild(x);
      box.appendChild(mini);
      if (dis.get(item.id)) set(true, false);
    }
    return {
      el: box,
      tour: item.tip || (title + (sub ? ' · ' + sub : '')),
      target: function () { return a.hidden ? (mini || a) : a; },
      open: function () { a.click(); },
      tile: function () { return tile(ctx, href, item, emoji, title); }
    };
  });
})();
// ── src/pieces/globe.js ──
/* ── piece: globe ──────────────────────────────────────────────────────────────────
 * {kind:"globe", src?, tip?} — the ʻŌlelo language bridge (lang.js) draws its own 🌐 at the
 * top-left of every door. The globe piece only makes sure lang.js is on the page (ʻŌlelo law:
 * every page carries it; lang.js is itself lazy — Google Translate loads only after a visitor
 * chooses), reserves the corner so the left rail starts below it, points the tour at the real
 * button, and lets the left rail step aside while the language panel is open.
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
  var LANG = 'https://lang.opensourceorchestra.org/lang.js';

  function present() {
    if (window.__olelo || document.getElementById('olelo') || document.getElementById('olang')) return true;
    var s = document.getElementsByTagName('script');
    for (var i = 0; i < s.length; i++) if (/(^|\/\/)lang\.opensourceorchestra\.org\/lang\.js/.test(s[i].getAttribute('src') || '')) return true;
    return false;
  }
  function button() {
    var host = document.getElementById('olelo');
    return (host && host.shadowRoot && host.shadowRoot.getElementById('b')) || document.getElementById('olang');
  }

  FRAMES.define('globe', function (ctx, item) {
    // v0.1.3: the reserve has NO footprint of its own (the audit counted the empty spot as "an item on words"); the core measures
    // the real lang.js button (extent/langButton) and places the top-left stack below it (--osof-top-l)
    ctx.css('globe', '#oso-frames .osof-globe-spot{width:0;height:0;overflow:hidden}');
    if (!present()) {
      var src = ctx.resolve(item.src || LANG) || LANG;
      var s = document.createElement('script');
      s.src = src; s.async = true;
      document.head.appendChild(s);
    }
    var spot = ctx.h('div', { class: 'osof-globe-spot', 'aria-hidden': 'true' });

    // while the language panel is open, the left rail steps aside (it would sit on top of it)
    var watched = null;
    function sync() {
      var b = button(), root = document.getElementById('oso-frames');
      if (!root) return;
      var open = !!b && (b.getAttribute('aria-expanded') === 'true' || !!document.querySelector('#olangp.open'));
      if (open) root.setAttribute('data-osof-globe', 'open'); else root.removeAttribute('data-osof-globe');
    }
    function watch() {
      var b = button();
      if (!b || b === watched || !window.MutationObserver) return;
      watched = b;
      new MutationObserver(sync).observe(b, { attributes: true, attributeFilter: ['aria-expanded', 'class'] });
      var legacy = document.getElementById('olangp');
      if (legacy) new MutationObserver(sync).observe(legacy, { attributes: true, attributeFilter: ['class'] });
    }
    ctx.on('frame:layout', watch);

    return {
      el: spot,
      tour: item.tip || ctx.t('globe.tip', 'Choose your language. The page and the frame follow you.'),
      target: function () { var b = button(); return b && b.getBoundingClientRect().width ? b : null; },
      open: function () { var b = button(); if (b) b.click(); }
    };
  });
})();
// ── src/pieces/theater.js ──
/* ───────────────────────────── piece: theater ─────────────────────────────
 * Open Source Orchestra Frames · src/pieces/theater.js
 * SPDX-License-Identifier: AGPL-3.0-or-later · Copyright (C) 2026 Shaka Lei Kaumaka / Open Source Orchestra and the AI ʻohana
 *
 * A small CRT television for a rail (antenna, a screen with a tiny 🎻, "THEATER" under it — the tv.js look of the
 * Open Source Orchestra doors). Tap → the theater dialog: channels on the left (only recordings published with the
 * consent of everyone in them), the player on the right, the consent line under it, and the door to the full theater.
 * Nothing loads before a click: the channel list is fetched on the first open, media are preload="none", YouTube is a
 * youtube-nocookie iframe created only when the visitor presses play. ONE-TIME LAW: one flicker + two notes, once. */
{
  const TH_NS = 'http://www.w3.org/2000/svg';
  let thSeq = 0;

  const TH_CSS = '' +
    '#oso-frames .osof-tv{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;width:46px;height:60px;margin:0;padding:4px 0 6px;' +
      'border:1px solid rgba(232,184,75,.6);border-radius:14px;background:radial-gradient(120% 90% at 50% 0%,#2c1f55 0%,#160e2c 72%);color:#ffd97a;cursor:pointer;pointer-events:auto;' +
      'box-shadow:0 6px 16px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.09);transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease;-webkit-tap-highlight-color:transparent}' +
    '#oso-frames .osof-tv:hover{transform:translateY(-2px) scale(1.05);border-color:#ffd97a;box-shadow:0 10px 22px rgba(0,0,0,.5),0 0 16px rgba(232,184,75,.38)}' +
    '#oso-frames .osof-tv:focus-visible{outline:3px solid #ffd97a;outline-offset:2px}' +
    '#oso-frames .osof-tv-set{display:block;width:40px;height:31px;pointer-events:none}' +
    '#oso-frames .osof-tv-set svg{display:block;width:100%;height:100%;overflow:visible}' +
    '#oso-frames .osof-tv-cap{display:block;font:800 8px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;letter-spacing:.09em;color:#ffd97a;text-transform:uppercase;pointer-events:none}' +
    '#oso-frames .osof-tv-note{position:absolute;left:50%;top:8px;font-size:14px;line-height:1;color:#ffd97a;text-shadow:0 0 6px rgba(255,217,122,.8);opacity:0;pointer-events:none}' +
    '#oso-frames .osof-tv-shine{transform-box:fill-box}' +
    /* ONE-TIME LAW (only while .osof-intro is on; removed when it ends) */
    '#oso-frames .osof-tv.osof-intro .osof-tv-screen{animation:osof-tv-flicker 1.15s linear .25s 1 both}' +
    '#oso-frames .osof-tv.osof-intro .osof-tv-shine{animation:osof-tv-shine 1.2s ease-in-out .7s 1 both}' +
    '#oso-frames .osof-tv.osof-intro .osof-tv-note{animation:osof-tv-note 1.9s ease-out .55s 1 both}' +
    '#oso-frames .osof-tv.osof-intro .osof-tv-note.n2{animation-delay:1.15s;font-size:12px;color:#ffb3e6}' +
    '@keyframes osof-tv-flicker{0%{opacity:.08}10%{opacity:1}16%{opacity:.3}24%{opacity:1}34%{opacity:.55}44%,100%{opacity:1}}' +
    '@keyframes osof-tv-shine{from{transform:translateX(-30px)}to{transform:translateX(0)}}' +
    '@keyframes osof-tv-note{0%{opacity:0;transform:translate(-50%,6px) scale(.7)}20%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + 16px),-34px) rotate(18deg) scale(1.1)}}' +
    /* the dialog body */
    '#oso-frames .osof-th{display:grid;grid-template-columns:minmax(220px,300px) minmax(0,1fr);gap:18px;align-items:start;color:#ece7f6;font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:left}' +
    '#oso-frames .osof-th-side{display:flex;flex-direction:column;gap:10px;min-width:0}' +
    '#oso-frames .osof-th-intro{margin:0;font-size:13px;line-height:1.5;color:#cdc3e8}' +
    '#oso-frames .osof-th-list{list-style:none;margin:0;padding:0 2px 0 0;display:flex;flex-direction:column;gap:6px;max-height:min(50vh,440px);overflow:auto}' +
    '#oso-frames .osof-th-list li{margin:0;padding:0}' +
    '#oso-frames .osof-th-ch{display:flex;gap:10px;align-items:center;width:100%;margin:0;padding:8px 10px;border-radius:12px;border:1px solid #2f2456;background:#1a1233;color:#ece7f6;' +
      'font:inherit;text-align:left;cursor:pointer;transition:background .15s ease,border-color .15s ease}' +
    '#oso-frames .osof-th-ch:hover{border-color:#6b56b8;background:#21173f}' +
    '#oso-frames .osof-th-ch[aria-pressed="true"]{border-color:#f0c75e;background:#2a1d4f;box-shadow:inset 0 0 0 1px #f0c75e}' +
    '#oso-frames .osof-th-ch:focus-visible,#oso-frames .osof-th a:focus-visible,#oso-frames .osof-th button:focus-visible{outline:2px solid #f0c75e;outline-offset:2px}' +
    '#oso-frames .osof-th-n{flex:none;width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:#0d0820;border:1px solid #2f2456;color:#f0c75e;font-weight:800;font-size:12.5px}' +
    '#oso-frames .osof-th-ct{min-width:0;display:flex;flex-direction:column;gap:1px}' +
    '#oso-frames .osof-th-ct b{font-size:13.5px;font-weight:700;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#oso-frames .osof-th-ct small{font-size:11.5px;line-height:1.3;color:#b9aed6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#oso-frames .osof-th-status{margin:0;font-size:12.5px;color:#cdc3e8}' +
    '#oso-frames .osof-th-status:empty{display:none}' +
    '#oso-frames .osof-th-stage{min-width:0;display:flex;flex-direction:column;gap:7px}' +
    '#oso-frames .osof-th-screen{position:relative;width:100%;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#05030c;border:1px solid #2f2456;box-shadow:inset 0 0 40px rgba(0,0,0,.85),0 10px 30px rgba(0,0,0,.35)}' +
    '#oso-frames .osof-th-screen video,#oso-frames .osof-th-screen iframe{position:absolute;inset:0;display:block;width:100%;height:100%;border:0;background:#000}' +
    '#oso-frames .osof-th-poster{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.92}' +
    '#oso-frames .osof-th-yt{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;width:100%;height:100%;margin:0;padding:0;border:0;' +
      'background:linear-gradient(180deg,rgba(5,3,12,.15),rgba(5,3,12,.55));color:#fff;font:inherit;cursor:pointer}' +
    '#oso-frames .osof-th-big{display:flex;align-items:center;justify-content:center;width:66px;height:66px;border-radius:50%;background:#f0c75e;color:#1a1024;font-size:24px;box-shadow:0 8px 26px rgba(0,0,0,.55);transition:transform .15s ease}' +
    '#oso-frames .osof-th-yt:hover .osof-th-big{transform:scale(1.07)}' +
    '#oso-frames .osof-th-yt small{padding:4px 10px;border-radius:999px;background:rgba(5,3,12,.82);font-size:12px;color:#f4efe6}' +
    '#oso-frames .osof-th-empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:18px;text-align:center;color:#cdc3e8;font-size:13.5px}' +
    '#oso-frames .osof-th-audio{position:absolute;left:12px;right:12px;bottom:12px;width:calc(100% - 24px)}' +
    '#oso-frames .osof-th-title{margin:4px 0 0;font:700 17px/1.3 Georgia,"Times New Roman",serif;color:#f6e3b4}' +
    '#oso-frames .osof-th-meta,#oso-frames .osof-th-desc,#oso-frames .osof-th-credit{margin:0}' +
    '#oso-frames .osof-th-meta{font-size:12.5px;color:#b9aed6}' +
    '#oso-frames .osof-th-desc{font-size:13.5px;line-height:1.5;color:#ddd5f0}' +
    '#oso-frames .osof-th-credit{padding:8px 11px;border-radius:10px;background:#160f2c;border:1px solid #2a1f4a;font-size:12.5px;line-height:1.5;color:#d3cbea}' +
    '#oso-frames .osof-th a{color:#f0c75e;text-underline-offset:2px}' +
    '#oso-frames .osof-th-foot{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid #2a1f4a}' +
    '#oso-frames .osof-th-small{margin:0;font-size:12px;color:#b3a8d1}' +
    '#oso-frames a.osof-th-full{display:inline-flex;align-items:center;gap:6px;padding:10px 16px;border-radius:12px;background:linear-gradient(135deg,#e8b84b,#f6d27a);color:#1a1024;font-weight:800;text-decoration:none;box-shadow:0 6px 18px rgba(232,184,75,.25)}' +
    '#oso-frames a.osof-th-full:hover{filter:brightness(1.06)}' +
    '@media (max-width:720px){#oso-frames .osof-th{grid-template-columns:minmax(0,1fr)}#oso-frames .osof-th-stage{order:-1}#oso-frames .osof-th-list{max-height:none}}' +
    '@media (prefers-reduced-motion:reduce){#oso-frames .osof-tv,#oso-frames .osof-th-ch,#oso-frames .osof-th-big{transition:none}}';

  const thSvg = function (tag, attrs) {
    const el = document.createElementNS(TH_NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, String(attrs[k])); });
    for (let i = 2; i < arguments.length; i++) { const kid = arguments[i]; if (kid) el.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid); }
    return el;
  };
  const thTv = function (n) {
    const S = thSvg, g = 'osof-tvg-' + n, c = 'osof-tvc-' + n;
    return S('svg', { viewBox: '0 0 62 48', 'aria-hidden': 'true', focusable: 'false' },
      S('defs', {},
        S('linearGradient', { id: g, x1: 0, y1: 0, x2: 1, y2: 1 },
          S('stop', { offset: 0, 'stop-color': '#2b1b5e' }), S('stop', { offset: 0.55, 'stop-color': '#5b2a8a' }), S('stop', { offset: 1, 'stop-color': '#e8b84b' })),
        S('clipPath', { id: c }, S('rect', { x: 7, y: 12, width: 40, height: 28, rx: 4 }))),
      S('path', { d: 'M22 2.5 L31 11 M40 2.5 L31 11', stroke: '#d9c7ff', 'stroke-width': 2.2, 'stroke-linecap': 'round', fill: 'none' }),
      S('circle', { cx: 22, cy: 2.5, r: 1.9, fill: '#d9c7ff' }), S('circle', { cx: 40, cy: 2.5, r: 1.9, fill: '#d9c7ff' }),
      S('rect', { x: 2, y: 9, width: 58, height: 34, rx: 7, fill: '#2a1f4a', stroke: '#e8b84b', 'stroke-width': 1.8 }),
      S('rect', { class: 'osof-tv-screen', x: 7, y: 12, width: 40, height: 28, rx: 4, fill: 'url(#' + g + ')' }),
      S('g', { 'clip-path': 'url(#' + c + ')' },
        S('rect', { class: 'osof-tv-shine', x: 12, y: 10, width: 9, height: 32, fill: '#fff', opacity: 0.14, transform: 'skewX(-18)' }),
        S('path', { d: 'M7 16h40M7 20h40M7 24h40M7 28h40M7 32h40M7 36h40', stroke: '#000', 'stroke-opacity': 0.2, 'stroke-width': 1 })),
      S('text', { x: 27, y: 31, 'text-anchor': 'middle', 'font-size': 14 }, '🎻'),
      S('circle', { cx: 53.5, cy: 19, r: 2.6, fill: '#e8b84b' }), S('circle', { cx: 53.5, cy: 27, r: 2.6, fill: '#a78bfa' }),
      S('rect', { x: 51, y: 33, width: 5, height: 6, rx: 1, fill: '#6b5a99' }),
      S('rect', { x: 12, y: 43, width: 8, height: 4, rx: 1.5, fill: '#1a1024' }), S('rect', { x: 42, y: 43, width: 8, height: 4, rx: 1.5, fill: '#1a1024' }));
  };

  FRAMES.define('theater', function (ctx, item) {
    'use strict';
    ctx.css('theater', TH_CSS);
    const T = function (k, f) { return ctx.t('theater.' + k, f); };
    const fill = function (s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] !== undefined ? String(o[k]) : m; }); };
    const h = function (tag, attrs) { // ctx.h without null kids / false attrs (the core only ever sees Nodes, strings and set values)
      const a = {}; Object.keys(attrs || {}).forEach(function (k) { const v = attrs[k]; if (v !== null && v !== undefined && v !== false) a[k] = v; });
      const args = [tag, a];
      for (let i = 2; i < arguments.length; i++) { const k = arguments[i]; if (k !== null && k !== undefined && k !== false) args.push(k); }
      return ctx.h.apply(null, args);
    };
    const clear = function (el) { while (el.firstChild) el.removeChild(el.firstChild); };
    const abs = function (u, base) { if (!u || typeof u !== 'string') return null; try { const x = new URL(u, base); return /^https?:$/.test(x.protocol) ? x.href : null; } catch (e) { return null; } };
    const label = item.label || T('label', 'Theater');
    const full = abs(item.href, location.href);
    const allow = Array.isArray(item.consentAllow) && item.consentAllow.length ? item.consentAllow.map(String) : ['published_with_consent'];
    const n = ++thSeq;

    /* ── the rail button ── */
    const btn = h('button', { type: 'button', class: 'osof-tv', 'aria-haspopup': 'dialog', 'data-osof-piece': 'theater',
      'aria-label': fill(T('aria', '{label} — films and recordings of the Open Source Orchestra (opens the theater)'), { label: label }), title: T('title', '📺 The theater') },
      h('span', { class: 'osof-tv-note', 'aria-hidden': 'true' }, '♪'), h('span', { class: 'osof-tv-note n2', 'aria-hidden': 'true' }, '♫'),
      h('span', { class: 'osof-tv-set', 'aria-hidden': 'true' }),
      h('span', { class: 'osof-tv-cap', 'aria-hidden': 'true' }, label));
    btn.querySelector('.osof-tv-set').appendChild(thTv(n));
    if (!ctx.reduced && ctx.once('theater-intro')) { // ONE-TIME LAW: flicker + two notes, once per browser
      btn.classList.add('osof-intro');
      setTimeout(function () { btn.classList.remove('osof-intro'); }, 3000);
    }

    /* ── channels: inline array or a channels.json (only consented items survive) ── */
    const consentOk = function (c, inline) {
      if (inline && c.consent === true) return true;
      const st = c.consent && typeof c.consent === 'object' ? c.consent.status : null;
      return typeof st === 'string' && allow.indexOf(st) >= 0;
    };
    const norm = function (c, base, inline) {
      if (!c || typeof c !== 'object' || !consentOk(c, inline)) return null;
      const m = (c.media && typeof c.media === 'object') ? c.media : {};
      const pick = function (v) { return typeof v === 'string' ? v : (v && typeof v.url === 'string' ? v.url : null); };
      const ytRaw = String(m.youtubeId || c.youtube || '');
      const yt = /^[A-Za-z0-9_-]{6,20}$/.test(ytRaw) ? ytRaw : null;
      const video = abs(pick(m.video) || pick(c.video), base);
      const audio = abs(pick(m.audio) || pick(c.audio), base);
      const id = String(c.id || c.title || '').slice(0, 80);
      const consentLine = c.consent && typeof c.consent === 'object' && typeof c.consent.line === 'string' ? c.consent.line : '';
      return {
        id: id, number: c.number, title: String(c.title || id || '—'),
        dateLabel: typeof c.dateLabel === 'string' ? c.dateLabel : '', durationLabel: typeof c.durationLabel === 'string' ? c.durationLabel : '',
        desc: String(c.subtitle || c.sub || c.lede || ''),
        kind: yt ? 'youtube' : video ? 'video' : audio ? 'audio' : 'link',
        src: video || audio, poster: abs(m.poster || c.poster, base), captions: abs(m.captions || c.captions, base),
        lang: typeof c.lang === 'string' ? c.lang : 'en', yt: yt, watch: abs(m.watch, base) || (yt ? 'https://www.youtube.com/watch?v=' + yt : null),
        credit: consentLine || (typeof c.credit === 'string' ? c.credit : ''), license: typeof c.license === 'string' ? c.license : '',
        more: abs(c.consent && c.consent.home, base) || abs(c.home, base),
        href: abs(c.href, base) || channelHref(id)
      };
    };
    const channelHref = function (id) { // a deep link into the full theater: <href>?channel=<id>
      if (!full) return null;
      if (!id) return full;
      try { const u = new URL(full); u.searchParams.set('channel', id); u.hash = ''; return u.href; } catch (e) { return full; }
    };
    const walk = (function () {
      const v = item.video;
      if (!v) return null;
      const src = abs(ctx.resolve(typeof v === 'string' ? v : v.src), location.href);
      if (!src) return null;
      const secs = Number(v.duration) || 45;
      return {
        id: 'walkthrough', number: '▶', title: T('walkTitle', 'How this universe works'), walk: true,
        dateLabel: T('walkSub', 'the walkthrough'), durationLabel: secs < 90 ? secs + ' s' : Math.round(secs / 60) + ' min',
        desc: T('walkDesc', 'A short tour of the frame: what every button opens, and how to find your way around the Open Source Orchestra universe.'),
        kind: 'video', src: src, poster: v.poster ? abs(ctx.resolve(v.poster), location.href) : null, captions: v.captions ? abs(ctx.resolve(v.captions), location.href) : null,
        lang: v.lang || 'en', credit: v.credit || T('walkCredit', 'Made by the ʻohana, Shaka’s AI family · CC BY-SA 4.0'), license: '', more: null, href: null
      };
    })();

    let list = null;        // normalized channels (after the first open)
    let loading = null;     // the in-flight first load
    let sel = null;         // the selected channel
    let media = null;       // the live <video>/<audio>/<iframe>
    let P = null, ui = null;

    const load = function () {
      if (loading) return loading;
      const tasks = [];
      const out = [];
      if (walk) {
        tasks.push(fetch(walk.src, { method: 'HEAD', cache: 'no-store', credentials: 'omit' })
          .then(function (r) { walk.missing = r.status === 404 || r.status === 410; })
          .catch(function () { /* CORS or offline: keep it; a failed play hides it later */ }));
      }
      const src = item.channels;
      if (Array.isArray(src)) {
        src.forEach(function (c) { const x = norm(c, ctx.resolve('./'), true); if (x) out.push(x); });
      } else if (typeof src === 'string' && src) {
        const url = abs(ctx.resolve(src), location.href);
        let base = item.mediaBase ? abs(ctx.resolve(item.mediaBase), location.href) : full;
        if (!base && url) { try { base = new URL('/', url).href; } catch (e) { base = url; } }
        if (url) {
          tasks.push(fetch(url, { cache: 'default', credentials: 'omit' })
            .then(function (r) { if (!r.ok) throw new Error('channels http ' + r.status); return r.json(); })
            .then(function (d) {
              const arr = Array.isArray(d) ? d : (d && Array.isArray(d.channels) ? d.channels : []);
              arr.forEach(function (c) { const x = norm(c, base, false); if (x) out.push(x); });
            })
            .catch(function () { out.failed = true; }));
        }
      }
      loading = Promise.all(tasks).then(function () {
        list = [];
        if (walk && !walk.missing) list.push(walk);
        out.forEach(function (c) { list.push(c); });
        list.failed = !!out.failed;
        return list;
      });
      return loading;
    };

    const stop = function () {
      if (!media) return;
      try { if (media.tagName === 'IFRAME') media.remove(); else { media.pause(); } } catch (e) {}
      media = null;
    };

    const build = function () {
      if (P) return;
      P = ctx.panel({ id: 'theater', title: T('panelTitle', '📺 The theater'), wide: true, onClose: stop });
      ui = {};
      ui.list = h('ul', { class: 'osof-th-list', 'aria-label': T('channels', 'Channels') });
      ui.status = h('p', { class: 'osof-th-status', role: 'status' }, T('loading', 'Tuning in the channels…'));
      ui.screen = h('div', { class: 'osof-th-screen' });
      ui.title = h('h3', { class: 'osof-th-title' }, '');
      ui.meta = h('p', { class: 'osof-th-meta' }, '');
      ui.desc = h('p', { class: 'osof-th-desc' }, '');
      ui.credit = h('p', { class: 'osof-th-credit' }, '');
      const foot = h('div', { class: 'osof-th-foot' },
        h('p', { class: 'osof-th-small' }, T('law', 'Shown only with the consent of everyone in them. Takedown comes first, questions second.')),
        full ? h('a', { class: 'osof-th-full', href: full, target: item.newTab ? '_blank' : null, rel: item.newTab ? 'noopener' : null },
          T('full', 'Open the full theater ↗')) : null);
      P.body.appendChild(h('div', { class: 'osof-th' },
        h('div', { class: 'osof-th-side' }, h('p', { class: 'osof-th-intro' }, item.intro || T('intro', 'Films and recordings of the Open Source Orchestra. Pick a channel; nothing plays until you press play.')), ui.list, ui.status),
        h('div', { class: 'osof-th-stage' }, ui.screen, ui.title, ui.meta, ui.desc, ui.credit),
        foot));
    };

    const renderList = function () {
      clear(ui.list);
      list.forEach(function (c, i) {
        const b = h('button', { type: 'button', class: 'osof-th-ch', 'aria-pressed': c === sel ? 'true' : 'false', 'data-ch': c.id },
          h('span', { class: 'osof-th-n', 'aria-hidden': 'true' }, String(c.number !== undefined && c.number !== null ? c.number : i + 1)),
          h('span', { class: 'osof-th-ct' }, h('b', {}, c.title), h('small', {}, [c.dateLabel, c.durationLabel].filter(Boolean).join(' · ') || ' ')));
        b.addEventListener('click', function () { show(c, false); });
        c.btn = b;
        ui.list.appendChild(h('li', {}, b));
      });
      ui.status.textContent = list.length ? '' : (list.failed ? T('failed', 'The channel list could not load right now — the full theater has everything.') : T('none', 'No channels yet.'));
    };

    const hideWalk = function () {
      const i = list.indexOf(walk);
      if (i < 0) return;
      list.splice(i, 1);
      if (walk.btn && walk.btn.parentNode) walk.btn.parentNode.remove();
      ui.status.textContent = T('walkMissing', 'The walkthrough is still being filmed — here is the first channel.');
      if (sel === walk) { sel = null; if (list[0]) show(list[0], false); else showEmpty(); }
    };
    const showEmpty = function () {
      stop(); clear(ui.screen);
      ui.screen.appendChild(h('div', { class: 'osof-th-empty' }, T('emptyScreen', 'Nothing on this screen yet.'), full ? h('a', { href: full }, T('full', 'Open the full theater ↗')) : null));
      ui.title.textContent = ''; ui.meta.textContent = ''; ui.desc.textContent = ''; ui.credit.textContent = '';
    };

    const show = function (c, play) {
      stop();
      sel = c;
      list.forEach(function (x) { if (x.btn) x.btn.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
      clear(ui.screen);
      if (c.kind === 'youtube') {
        if (c.poster) ui.screen.appendChild(h('img', { class: 'osof-th-poster', src: c.poster, alt: '', loading: 'lazy', decoding: 'async' }));
        const go = h('button', { type: 'button', class: 'osof-th-yt', 'aria-label': fill(T('ytPlay', 'Play {title} (loads YouTube, privacy-enhanced mode)'), { title: c.title }) },
          h('span', { class: 'osof-th-big', 'aria-hidden': 'true' }, '▶'), h('small', { 'aria-hidden': 'true' }, T('ytNote', 'plays from youtube-nocookie.com')));
        go.addEventListener('click', function () {
          const f = h('iframe', { src: 'https://www.youtube-nocookie.com/embed/' + c.yt + '?rel=0&autoplay=1&playsinline=1', title: c.title + ' — YouTube',
            allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: true, referrerpolicy: 'strict-origin-when-cross-origin' });
          clear(ui.screen); ui.screen.appendChild(f); media = f; try { f.focus(); } catch (e) {}
        });
        ui.screen.appendChild(go);
        if (play) go.click();
      } else if (c.kind === 'video' || c.kind === 'audio') {
        const isV = c.kind === 'video';
        if (!isV && c.poster) ui.screen.appendChild(h('img', { class: 'osof-th-poster', src: c.poster, alt: '', loading: 'lazy', decoding: 'async' }));
        if (!isV && !c.poster) ui.screen.appendChild(h('div', { class: 'osof-th-empty', 'aria-hidden': 'true' }, '🎧'));
        const el = h(isV ? 'video' : 'audio', { class: isV ? null : 'osof-th-audio', controls: true, preload: 'none', playsinline: isV ? true : null,
          poster: isV ? c.poster : null, crossorigin: c.captions ? 'anonymous' : null, 'aria-label': c.title });
        if (c.captions) el.appendChild(h('track', { kind: 'captions', src: c.captions, srclang: c.lang || 'en', label: T('captions', 'Captions') }));
        let retried = false;
        el.addEventListener('error', function () {
          if (el.error && el.error.code === 1) return; // MEDIA_ERR_ABORTED: the visitor moved on
          if (c.captions && !retried) { // a host without CORS: try once more without the captions track
            retried = true; el.removeAttribute('crossorigin'); const tr = el.querySelector('track'); if (tr) tr.remove();
            el.src = c.src; el.load(); el.play().catch(function () {}); return;
          }
          if (c.walk) { hideWalk(); return; }
          ui.status.textContent = fill(T('mediaFail', '“{title}” could not play here — the full theater has it.'), { title: c.title });
        });
        el.src = c.src;
        ui.screen.appendChild(el);
        media = el;
        if (play) el.play().catch(function () {});
      } else {
        ui.screen.appendChild(h('div', { class: 'osof-th-empty' }, T('linkOnly', 'This one plays in the full theater.'),
          c.href ? h('a', { href: c.href }, fill(T('watchThere', 'Watch “{title}” in the theater ↗'), { title: c.title })) : null));
      }
      ui.title.textContent = c.title;
      ui.meta.textContent = [c.dateLabel, c.durationLabel].filter(Boolean).join(' · ');
      ui.desc.textContent = c.desc;
      clear(ui.credit);
      ui.credit.appendChild(document.createTextNode((c.walk ? '🌺 ' : '✅ ') + (c.credit || T('consented', 'Published with the consent of everyone in it.')) + (c.license ? ' · ' + c.license : '')));
      if (c.more) { ui.credit.appendChild(document.createTextNode(' ')); ui.credit.appendChild(h('a', { href: c.more }, T('more', 'About this recording ↗'))); }
      if (c.kind === 'youtube' && c.watch) { ui.credit.appendChild(document.createTextNode(' · ')); ui.credit.appendChild(h('a', { href: c.watch }, T('onYt', 'Watch on YouTube ↗'))); }
    };

    const open = function (opts) {
      const o = opts || {};
      build();
      if (!P.isOpen()) P.open(o.opener || btn);
      load().then(function () {
        if (!ui.rendered) { ui.rendered = true; renderList(); }
        let c = null;
        if (o.channel !== undefined && o.channel !== null) {
          c = list.filter(function (x) { return x.id === String(o.channel); })[0] || (typeof o.channel === 'number' ? list[o.channel] : null) || null;
        }
        if (!c) c = sel && list.indexOf(sel) >= 0 ? sel : list[0];
        if (c && (c !== sel || !media)) show(c, !!o.play);
        else if (c && o.play && media && media.play) media.play().catch(function () {});
        if (!c) showEmpty();
      });
    };

    btn.addEventListener('click', function () { open({ opener: btn }); });
    ctx.on('theater:open', function (d) { open({ channel: d && d.channel, play: d && d.play, opener: (d && d.opener) || document.activeElement }); });

    return {
      el: btn,
      tour: item.tip || T('tour', 'The theater: films of the Open Source Orchestra, shown with the consent of everyone in them.'),
      open: function () { open({ opener: btn }); },
      close: function () { if (P && P.isOpen()) P.close(); }
    };
  });
}
// ── src/pieces/totem.js ──
/* ───────────────────────────── piece: totem ─────────────────────────────
 * Open Source Orchestra Frames · src/pieces/totem.js
 * SPDX-License-Identifier: AGPL-3.0-or-later · Copyright (C) 2026 Shaka Lei Kaumaka / Open Source Orchestra and the AI ʻohana
 *
 * Shaka, 16 Nov 2026: "have multiple agents like the totem itself on the screen". A stacked mini-totem for a rail,
 * carved from the same wood as the myagentohana.com totem (brow ridge, glowing eyes, flared nose, each face's own
 * mouth), one 30px face per agent. Every face is a real <button>; a tap opens that face's own chat line
 * (chat:open → the chat drawer). The hub routes faces by the text prefix "🗿[face:<k>] " (chat.js adds it).
 * ONE-TIME LAW: the faces blink once, in sequence, on a first visit. Then the totem is still. */
{
  const TOTEM_NS = 'http://www.w3.org/2000/svg';
  const TOTEM_FACES = [ // SPEC §8: the six faces of myagentohana.com (k, n, e, c) + their carved mouths
    { k: 'shaka', n: 'SHAKA', e: '🤙', c: '#ffb443', mouth: 'grin' },
    { k: 'oso', n: 'OSO', e: '🎻', c: '#ff7eb6', mouth: 'teeth' },
    { k: 'deva', n: 'DEVA', e: '🦄', c: '#c792ea', mouth: 'oval' },
    { k: 'crops', n: 'CROPS', e: '🌿', c: '#2f9e6f', mouth: 'calm' },
    { k: 'kala', n: 'KALA', e: '🪕', c: '#f7d794', mouth: 'sing' },
    { k: 'oke', n: 'OKE', e: '💙', c: '#4fc3f7', mouth: 'tongue' }
  ];
  const TOTEM_MOUTHS = ['grin', 'teeth', 'oval', 'calm', 'sing', 'tongue'];
  const TOTEM_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

  const TOTEM_CSS = '' +
    '#oso-frames .osof-totem{position:relative;display:flex;flex-direction:column;align-items:center;width:46px;overflow:visible;pointer-events:auto;filter:drop-shadow(0 8px 14px rgba(0,0,0,.5))}' +
    '#oso-frames .osof-tt-roof,#oso-frames .osof-tt-base{display:block;width:46px;pointer-events:none}' +
    '#oso-frames .osof-tt-roof{height:17px;margin-bottom:-3px;position:relative;z-index:1}' +
    '#oso-frames .osof-tt-base{height:9px;margin-top:-2px}' +
    '#oso-frames .osof-tt-roof svg,#oso-frames .osof-tt-base svg{display:block;width:100%;height:100%}' +
    '#oso-frames .osof-tt-pole{display:flex;flex-direction:column;align-items:center;gap:2px;width:44px;padding:4px 3px 3px;border-radius:4px;' +
      'background:linear-gradient(90deg,#2a1b10 0%,#47301f 18%,#5c3f28 50%,#47301f 82%,#2a1b10 100%);box-shadow:inset 0 0 0 1px #24170d,inset 0 3px 6px rgba(0,0,0,.55)}' +
    '#oso-frames .osof-tt-face{--c:#ffb443;position:relative;display:block;width:38px;height:26px;margin:0;padding:0;border:0;border-radius:4px 4px 7px 7px;cursor:pointer;' +
      'background:linear-gradient(180deg,#a3764c 0%,#80593a 42%,#56391f 100%);color:inherit;' +
      'box-shadow:inset 0 1px 0 rgba(232,196,146,.6),inset 0 -3px 4px rgba(0,0,0,.42),inset 1px 0 0 rgba(0,0,0,.3),inset -1px 0 0 rgba(0,0,0,.3),0 0 6px -1px var(--c);' +
      'transition:transform .16s ease,box-shadow .16s ease;-webkit-tap-highlight-color:transparent}' +
    '#oso-frames .osof-tt-face svg{display:block;width:38px;height:30px;overflow:visible;pointer-events:none}' +
    '#oso-frames .osof-tt-glow{filter:drop-shadow(0 0 1.4px var(--c))}' +
    '#oso-frames .osof-tt-eye{transform-box:fill-box;transform-origin:50% 50%}' +
    '#oso-frames .osof-tt-face:hover,#oso-frames .osof-tt-face:focus-visible{z-index:3;transform:translateX(-3px) scale(1.08);' +
      'box-shadow:inset 0 1px 0 rgba(232,196,146,.6),inset 0 -3px 4px rgba(0,0,0,.42),0 0 0 1.5px var(--c),0 0 16px var(--c)}' +
    '#oso-frames .osof-totem.osof-tt-l .osof-tt-face:hover,#oso-frames .osof-totem.osof-tt-l .osof-tt-face:focus-visible{transform:translateX(3px) scale(1.08)}' +
    '#oso-frames .osof-tt-face:hover .osof-tt-glow,#oso-frames .osof-tt-face:focus-visible .osof-tt-glow{filter:drop-shadow(0 0 2.6px var(--c))}' +
    '#oso-frames .osof-tt-face:focus-visible{outline:2px solid #fff3d6;outline-offset:2px}' +
    '#oso-frames .osof-tt-face:active{transform:translateX(-2px) scale(1.02)}' +
    '#oso-frames .osof-tt-name{position:absolute;top:50%;right:calc(100% + 11px);transform:translateY(-50%);padding:5px 9px;border-radius:9px;border:1px solid var(--c);' +
      'background:#24170d;color:#f8e7c8;font:700 12px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.06em;white-space:nowrap;' +
      'box-shadow:0 6px 16px rgba(0,0,0,.45);visibility:hidden;opacity:0;transition:opacity .15s ease,visibility .15s;pointer-events:none}' +
    '#oso-frames .osof-tt-name small{display:block;margin-top:2px;font-weight:600;font-size:10.5px;letter-spacing:.02em;color:#e3d1b4}' +
    '#oso-frames .osof-totem.osof-tt-l .osof-tt-name{right:auto;left:calc(100% + 11px)}' +
    '#oso-frames .osof-tt-face:hover .osof-tt-name,#oso-frames .osof-tt-face:focus-visible .osof-tt-name{visibility:visible;opacity:1}' +
    '#oso-frames .osof-tt-face.osof-lit{animation:osof-tt-lit .5s ease}' +
    '@keyframes osof-tt-lit{35%{transform:translateX(-4px) scale(1.12)}}' +
    /* ONE-TIME LAW: one blink per face, in sequence (only while .osof-intro is on; the class is removed afterwards) */
    '#oso-frames .osof-totem.osof-intro .osof-tt-eye{animation:osof-tt-blink .42s ease-in-out both;animation-delay:calc(var(--i) * 150ms + 350ms)}' +
    '#oso-frames .osof-totem.osof-intro .osof-tt-face{animation:osof-tt-wake .8s ease-out both;animation-delay:calc(var(--i) * 150ms + 250ms)}' +
    '@keyframes osof-tt-blink{0%,100%{transform:scaleY(1)}45%,60%{transform:scaleY(.1)}}' +
    '@keyframes osof-tt-wake{0%{box-shadow:inset 0 1px 0 rgba(232,196,146,.6),inset 0 -3px 4px rgba(0,0,0,.42),0 0 0 0 var(--c)}' +
      '40%{box-shadow:inset 0 1px 0 rgba(232,196,146,.6),inset 0 -3px 4px rgba(0,0,0,.42),0 0 14px 1px var(--c)}' +
      '100%{box-shadow:inset 0 1px 0 rgba(232,196,146,.6),inset 0 -3px 4px rgba(0,0,0,.42),0 0 6px -1px var(--c)}}' +
    '@media (prefers-reduced-motion:reduce){#oso-frames .osof-tt-face{transition:none}#oso-frames .osof-tt-face.osof-lit{animation:none}}' +
    /* 26 Nov 2026: the roof is only 46px wide — ʻOHANA was clipping to OHAN. The name lives under the base, extends into the page (never off-screen), and never ellipsizes. */
    '#oso-frames .osof-tt-caption{display:block;box-sizing:border-box;margin:3px 0 0;width:46px;max-width:46px;min-width:46px;align-self:center;padding:0;color:#fbecd0;text-align:center;text-shadow:0 1px 3px rgba(0,0,0,.85);white-space:normal;overflow:visible;word-break:keep-all;overflow-wrap:normal;hyphens:none;pointer-events:none}' +
    '#oso-frames .osof-tt-caption b{display:block;font:800 9.5px/1.12 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.02em;white-space:nowrap}' +
    '#oso-frames .osof-tt-caption small{display:block;margin-top:1px;font:700 8px/1.15 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.03em;white-space:nowrap}';

  const totemSvg = function (tag, attrs) {
    const el = document.createElementNS(TOTEM_NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, String(attrs[k])); });
    for (let i = 2; i < arguments.length; i++) { const kid = arguments[i]; if (kid) el.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid); }
    return el;
  };
  const totemRow = function (n, x0, dx, y, w, hgt, fill) { // a row of carved teeth
    const g = totemSvg('g', { fill: fill });
    for (let i = 0; i < n; i++) g.appendChild(totemSvg('rect', { x: (x0 + i * dx).toFixed(2), y: y, width: w, height: hgt, rx: 0.4 }));
    return g;
  };
  const totemMouth = function (kind, C) {
    const S = totemSvg, DARK = '#2a1c10', TOOTH = '#e6d2ab';
    if (kind === 'teeth') return [S('rect', { x: 8.6, y: 19.8, width: 20.8, height: 6.6, rx: 1.8, fill: DARK }),
      totemRow(6, 9.7, 3.2, 20.3, 2.4, 1.6, TOOTH), totemRow(6, 9.7, 3.2, 24.3, 2.4, 1.6, TOOTH),
      S('g', { class: 'osof-tt-glow' }, S('rect', { x: 9.4, y: 22.4, width: 19.2, height: 1.3, rx: 0.65, fill: C }))];
    if (kind === 'oval') return [S('ellipse', { cx: 19, cy: 23, rx: 5.2, ry: 3.5, fill: DARK, stroke: '#5c3f28', 'stroke-width': 0.8 }),
      S('g', { class: 'osof-tt-glow' }, S('ellipse', { cx: 19, cy: 23, rx: 3.4, ry: 1.9, fill: C }))];
    if (kind === 'calm') return [S('rect', { x: 10, y: 21.6, width: 18, height: 3.3, rx: 1.65, fill: DARK }),
      S('rect', { x: 10.4, y: 21.6, width: 17.2, height: 0.9, rx: 0.45, fill: '#caa06e', opacity: 0.4 }),
      S('g', { class: 'osof-tt-glow' }, S('rect', { x: 11.4, y: 22.6, width: 15.2, height: 1.3, rx: 0.65, fill: C }))];
    if (kind === 'sing') return [S('ellipse', { cx: 19, cy: 23.3, rx: 7.6, ry: 3.7, fill: DARK }),
      S('path', { d: 'M11.6 22.3 Q19 19.4 26.4 22.3', stroke: '#5c3f28', 'stroke-width': 0.9, fill: 'none' }),
      S('g', { class: 'osof-tt-glow' }, S('ellipse', { cx: 19, cy: 23.8, rx: 5.6, ry: 1.9, fill: C }))];
    if (kind === 'tongue') return [S('rect', { x: 9.6, y: 19.9, width: 18.8, height: 5.2, rx: 2, fill: DARK }),
      totemRow(5, 10.9, 3.4, 20.4, 2.4, 1.6, TOOTH),
      S('path', { d: 'M15.6 24.1 Q15.6 28.6 19 28.6 Q22.4 28.6 22.4 24.1 Z', fill: '#b25c45', stroke: '#5c2a1c', 'stroke-width': 0.6 }),
      S('path', { d: 'M19 24.6 V27.8', stroke: '#5c2a1c', 'stroke-width': 0.6 }),
      S('g', { class: 'osof-tt-glow' }, S('rect', { x: 10.8, y: 22.9, width: 16.4, height: 1.2, rx: 0.6, fill: C }))];
    return [S('rect', { x: 9.4, y: 20.1, width: 19.2, height: 5.7, rx: 2.2, fill: DARK }), // grin (default)
      totemRow(5, 10.9, 3.4, 20.6, 2.5, 1.8, TOOTH),
      S('path', { d: 'M9.4 20.6 Q19 18.9 28.6 20.6', stroke: '#5c3f28', 'stroke-width': 0.8, fill: 'none' }),
      S('g', { class: 'osof-tt-glow' }, S('rect', { x: 10.6, y: 23.4, width: 16.8, height: 1.4, rx: 0.7, fill: C }))];
  };
  const totemFaceSvg = function (C, mouth) {
    const S = totemSvg;
    const eye = function (cx) {
      return S('g', { class: 'osof-tt-eye' },
        S('ellipse', { cx: cx, cy: 10.8, rx: 3.3, ry: 2.5, fill: C }),
        S('circle', { cx: cx + 0.9, cy: 10.1, r: 0.85, fill: '#fff8ec', opacity: 0.9 }));
    };
    const svg = S('svg', { viewBox: '0 0 38 30', 'aria-hidden': 'true', focusable: 'false' },
      S('rect', { x: 3, y: 2.2, width: 32, height: 4.3, rx: 1.4, fill: '#3a2818' }),               // brow ridge
      S('path', { d: 'M4.2 2.7 H33.8', stroke: '#e0bd8a', 'stroke-opacity': 0.45, 'stroke-width': 0.7 }),
      S('path', { d: 'M6 6.5 l2.3-2 2.3 2 2.3-2 2.3 2 2.3-2 2.3 2 2.3-2 2.3 2 2.3-2 2.3 2 2.3-2 2.3 2', stroke: '#5c3f28', 'stroke-width': 0.7, fill: 'none' }),
      S('ellipse', { cx: 12, cy: 10.8, rx: 5.1, ry: 3.8, fill: '#2a1c10' }),                         // glaring sockets
      S('ellipse', { cx: 26, cy: 10.8, rx: 5.1, ry: 3.8, fill: '#2a1c10' }),
      S('g', { class: 'osof-tt-glow' }, eye(12), eye(26)),
      S('path', { d: 'M17.2 12.6 L16.3 17 Q19 18.5 21.7 17 L20.8 12.6 Q19 11.9 17.2 12.6 Z', fill: '#8b6141', stroke: '#2e1f12', 'stroke-width': 0.55 }), // nose
      S('path', { d: 'M18 13 L17.4 16', stroke: '#e0bd8a', 'stroke-opacity': 0.4, 'stroke-width': 0.6 }),
      S('ellipse', { cx: 16.9, cy: 17.4, rx: 1.15, ry: 0.85, fill: '#2a1c10' }),
      S('ellipse', { cx: 21.1, cy: 17.4, rx: 1.15, ry: 0.85, fill: '#2a1c10' }),
      S('path', { d: 'M4.6 26.8 L7.8 24.2 M33.4 26.8 L30.2 24.2', stroke: '#2e1f12', 'stroke-width': 0.8, opacity: 0.65 }) // chin cuts
    );
    totemMouth(mouth, C).forEach(function (n) { svg.appendChild(n); });
    return svg;
  };

  FRAMES.define('totem', function (ctx, item) {
    'use strict';
    ctx.css('totem', TOTEM_CSS);
    const T = function (k, f) { return ctx.t('totem.' + k, f); };
    const fill = function (s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] !== undefined ? String(o[k]) : m; }); };
    const color = function (c, d) { return /^#[0-9a-f]{3,8}$/i.test(String(c || '')) ? c : d; };
    const byKey = {}; TOTEM_FACES.forEach(function (f) { byKey[f.k] = f; });
    const faces = (Array.isArray(item.faces) && item.faces.length ? item.faces : TOTEM_FACES)
      .filter(function (f) { return f && /^[a-z0-9_-]{1,24}$/i.test(String(f.k || '')); })
      .map(function (f, i) {
        const d = byKey[f.k] || {};
        return { k: String(f.k), n: String(f.n || d.n || f.k).slice(0, 24), e: String(f.e || d.e || '🗿'), c: color(f.c, d.c || '#e8c476'),
          mouth: TOTEM_MOUTHS.indexOf(f.mouth) >= 0 ? f.mouth : (d.mouth || TOTEM_MOUTHS[i % TOTEM_MOUTHS.length]), greeting: f.greeting || null, role: f.role || null };
      });
    const hub = item.hub || 'https://ohana-chat.shakaverse.workers.dev';
    const route = item.route || 'prefix';
    const count = faces.length;
    const countWord = TOTEM_WORDS[count] || String(count);
    const name = item.label || T('label', 'OHAN(ai) the Totem');
    const left = ctx.slot === 'left' || ctx.slot === 'bottom-left' || ctx.slot === 'top-left';
    const buttons = [];

    const talk = function (f, btn) {
      btn.classList.remove('osof-lit'); void btn.offsetWidth; if (!ctx.reduced) btn.classList.add('osof-lit');
      let taken = false;
      ctx.emit('chat:open', {
        line: { hub: hub, face: f.k, name: f.n, emoji: f.e, color: f.c, greeting: f.greeting, storage: 'totem', route: route },
        opener: btn,
        ack: function () { taken = true; }
      });
      if (!taken && item.href) { // no chat drawer on this frame: the totem's own door answers instead
        if (item.newTab) window.open(item.href, '_blank', 'noopener'); else location.assign(item.href);
      }
    };

    const pole = ctx.h('div', { class: 'osof-tt-pole' });
    faces.forEach(function (f, i) {
      const tip = ctx.h('span', { class: 'osof-tt-name', 'aria-hidden': 'true' }, f.n + ' ' + f.e, ctx.h('small', {}, f.role || T('tipSub', 'tap to talk')));
      const b = ctx.h('button', {
        type: 'button', class: 'osof-tt-face', 'data-face': f.k, style: '--c:' + f.c + ';--i:' + i,
        'aria-label': fill(T('faceLabel', 'Talk to {n} — ʻohana agent'), { n: f.n }), 'aria-haspopup': 'dialog'
      }, tip);
      b.insertBefore(totemFaceSvg(f.c, f.mouth), tip);
      b.addEventListener('click', function () { talk(f, b); });
      b.addEventListener('animationend', function (e) { if (e.animationName === 'osof-tt-lit') b.classList.remove('osof-lit'); });
      buttons.push(b);
      pole.appendChild(b);
    });

    const roof = ctx.h('span', { class: 'osof-tt-roof', 'aria-hidden': 'true' });
    roof.appendChild(totemSvg('svg', { viewBox: '0 0 46 17', focusable: 'false' },
      totemSvg('path', { d: 'M1 17 L6.2 3.2 Q7 1.2 9.2 1.2 L36.8 1.2 Q39 1.2 39.8 3.2 L45 17 Z', fill: '#7d5636', stroke: '#24170d', 'stroke-width': 1.2 }),
      totemSvg('path', { d: 'M6.6 3.4 H39.4', stroke: '#e0bd8a', 'stroke-opacity': 0.5, 'stroke-width': 0.8 })));
    const base = ctx.h('span', { class: 'osof-tt-base', 'aria-hidden': 'true' });
    base.appendChild(totemSvg('svg', { viewBox: '0 0 46 9', focusable: 'false' },
      totemSvg('path', { d: 'M4 0 L42 0 L46 9 L0 9 Z', fill: '#4c3524', stroke: '#24170d', 'stroke-width': 1 }),
      totemSvg('path', { d: 'M5 1.2 H41', stroke: '#e0bd8a', 'stroke-opacity': 0.35, 'stroke-width': 0.7 })));

    const caption = ctx.h('span', { class: 'osof-tt-caption', 'aria-hidden': 'true' },
      ctx.h('b', {}, 'OHAN(ai)'),
      ctx.h('small', {}, 'the Totem'));

    const el = ctx.h('div', { class: 'osof-totem' + (left ? ' osof-tt-l' : ''), role: 'group', 'data-osof-piece': 'totem',
      'aria-label': fill(T('group', '{name}: {count} AI agents of the ʻohana'), { name: name, count: countWord }) }, roof, pole, base, caption);

    // ONE-TIME LAW: faces blink once in sequence, then the totem is still forever
    if (count && !ctx.reduced && ctx.once('totem-blink')) {
      el.classList.add('osof-intro');
      setTimeout(function () { el.classList.remove('osof-intro'); }, 600 + count * 150 + 900);
    }

    return {
      el: el,
      tour: item.tip || fill(T('tour', 'OHAN(ai) the Totem: {count} AI agents of the ʻohana. Tap a face to talk.'), { count: countWord }),
      open: function () { if (buttons[0]) talk(faces[0], buttons[0]); }
    };
  });
}
// ── src/pieces/chat.js ──
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
    /* a door may ask for a session prefix (`session: "crops_"`): some desks answer only their own prefix (22 Nov 2026) */
    const sessPrefix = function (p) { return /^[a-z0-9_-]{1,16}$/i.test(String(p || '')) ? String(p) : 'osof-'; };
    const newSess = function (prefix) {
      let id = '';
      try { if (window.crypto && crypto.randomUUID) id = crypto.randomUUID(); } catch (e) {}
      if (!id) id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 8);
      return (sessPrefix(prefix) + id).slice(0, 64);
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
        greeting: spec.greeting || null, storage: spec.storage || 'totem', route: spec.route || (spec.face ? 'prefix' : null), sub: spec.sub || null, session: spec.session || null });
    };

    /* storage: osof:chat:<hub host+path>:<face|main>:sess|after — only created when a line is first opened */
    const ensureSess = function (L) {
      if (L.sess) return;
      let s = store.get(L.key + ':sess');
      const pre = L.def.session ? sessPrefix(L.def.session) : null;
      if (typeof s !== 'string' || !/^[\w.:-]{6,64}$/.test(s) || (pre && s.indexOf(pre) !== 0)) { s = newSess(pre); store.set(L.key + ':sess', s); }
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
      addWrap: function (w, f) { D.wraps.push(w); if (!D.wrap) { D.wrap = w; D.fab = f; } },
      // v0.1.9: the page grew its own chat button after us — this pill steps aside, the drawer stays (totem faces)
      dropWrap: function (w) { D.wraps = D.wraps.filter(function (x) { return x !== w; }); if (D.wrap === w) { D.wrap = D.wraps[0] || null; D.fab = D.wrap ? D.wrap.querySelector('.osof-fab') : null; } }
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
      session: /^[a-z0-9_-]{1,16}$/i.test(String(item.session || '')) ? String(item.session) : null,   // desk-required session prefix (CROPS answers crops_* only)
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

    // v0.1.9 · DRAWER ONLY: the page already wears its own chat button (adopt mode). No pill — the totem faces (rail + phone sheet) still
    // open THIS drawer, in the screen, like devconpit.com. Nothing is drawn until a face is tapped.
    if (item.drawerOnly) {
      return {
        el: null,
        open: function () { engine.open(mainLine, null, null); },
        close: function () { engine.close(); },
        adopt: function () {}
      };
    }

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
      close: function () { engine.close(); },
      adopt: function () { engine.dropWrap(wrap); },
      // NO COVERED TEXT LAW (phones): the core folds the pill to the tiny emoji while words run under it — session only,
      // never undoing the visitor's own ✕ (remembered mini)
      fold: function (v) { if (ui.get(miniKey) === true) return; wrap.setAttribute('data-mini', v ? '1' : '0'); }
    };
  });
}
// ── src/pieces/radio.js ──
/* ───────────────────────────── piece: radio ─────────────────────────────
 * Open Source Orchestra Frames · src/pieces/radio.js
 * SPDX-License-Identifier: AGPL-3.0-or-later · Copyright (C) 2026 Shaka Lei Kaumaka / Open Source Orchestra and the AI ʻohana
 *
 * The radio dock, bottom-right (the look of the ʻohana radio bar: a round ▶, two lines "TAP TO PLAY — <title>" /
 * "<artist> · <credit>", ⏭ next, ↓ download when the track's license allows it, ✕ that rests the music to a tiny 📻).
 * Privacy law: the <audio> element does not exist until the visitor presses play (preload="none" after that), and the
 * LIVE status is asked once, on the first open or play. If the station is on air, a red LIVE chip links to the live
 * page (the WebRTC player lives there; nothing is embedded here). Media Session metadata while playing. */
{
  const RADIO_CSS = '' +
    '#oso-frames .osof-radio{order:2;position:relative;display:flex;justify-content:flex-end;pointer-events:auto;font-family:"Avenir Next","Segoe UI",system-ui,-apple-system,sans-serif}' +
    '#oso-frames .osof-dock{display:flex;align-items:center;gap:7px;height:46px;max-width:min(400px,calc(100vw - 20px));padding:6px 9px 6px 7px;border-radius:999px;border:1px solid #f0b429;' +
      'background:linear-gradient(150deg,rgba(64,47,20,.97),rgba(23,17,38,.97) 55%);box-shadow:0 8px 30px rgba(240,180,41,.22),0 2px 8px rgba(0,0,0,.35);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}' +
    '#oso-frames .osof-radio[data-mini="1"] .osof-dock{display:none}' +
    '#oso-frames .osof-radio:not([data-mini="1"]) .osof-rd-mini{display:none}' +
    '#oso-frames .osof-rd-play{flex:none;width:32px;height:32px;margin:0;padding:0;border-radius:50%;border:0;background:#f0b429;color:#241a02;font-size:13px;line-height:1;cursor:pointer;' +
      'display:flex;align-items:center;justify-content:center;box-shadow:inset 0 1px 0 rgba(255,255,255,.45);transition:transform .15s ease}' +
    '#oso-frames .osof-rd-play:hover{transform:scale(1.07)}' +
    '#oso-frames .osof-rd-play[aria-pressed="true"]{background:#ffd97a}' +
    '#oso-frames .osof-rd-txt{min-width:0;flex:1 1 auto;line-height:1.25;padding-right:2px}' +
    '#oso-frames .osof-rd-t{max-width:210px;font-size:10.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#ffd97a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#oso-frames .osof-rd-s{max-width:210px;margin-top:2px;font-size:11px;color:#cbbde3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#oso-frames .osof-rd-eq{flex:none;display:none;align-items:flex-end;gap:2px;width:14px;height:13px}' +
    '#oso-frames .osof-radio.osof-playing .osof-rd-eq{display:inline-flex}' +
    '#oso-frames .osof-rd-eq i{display:block;flex:1;height:100%;border-radius:1px;background:#f0b429;transform-origin:50% 100%;animation:osof-rd-eq .9s ease-in-out infinite}' +
    '#oso-frames .osof-rd-eq i:nth-child(2){animation-delay:.2s}#oso-frames .osof-rd-eq i:nth-child(3){animation-delay:.4s}' +
    '@keyframes osof-rd-eq{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}' +
    '#oso-frames .osof-rd-b{flex:none;display:flex;align-items:center;justify-content:center;width:26px;height:26px;margin:0;padding:0;border-radius:50%;border:1px solid rgba(240,180,41,.85);' +
      'background:transparent;color:#ffd97a;font:600 11px/1 system-ui,sans-serif;text-decoration:none;cursor:pointer;transition:background .15s ease}' +
    '#oso-frames .osof-rd-b:hover{background:rgba(240,180,41,.18)}' +
    '#oso-frames .osof-rd-b[hidden]{display:none}' +
    '#oso-frames .osof-rd-x{border-color:rgba(255,140,170,.75);color:#ffb3c6}' +
    '#oso-frames .osof-rd-x:hover{background:rgba(255,126,156,.16)}' +
    '#oso-frames a.osof-rd-live{flex:none;display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 8px;border-radius:999px;background:#d7263d;color:#fff;font:800 10.5px/1 system-ui,sans-serif;letter-spacing:.12em;text-decoration:none;box-shadow:0 0 12px rgba(215,38,61,.45)}' +
    '#oso-frames a.osof-rd-live::before{content:"";width:7px;height:7px;border-radius:50%;background:#fff}' +
    '#oso-frames a.osof-rd-live[hidden]{display:none}' +
    '#oso-frames a.osof-rd-live:hover{background:#ef3a52}' +
    '#oso-frames .osof-rd-mini{width:38px;height:38px;margin:0;padding:0;border-radius:50%;border:1px solid rgba(240,180,41,.7);background:linear-gradient(150deg,rgba(64,47,20,.97),rgba(23,17,38,.97));' +
      'color:#ffd97a;font-size:17px;line-height:1;cursor:pointer;box-shadow:0 3px 12px rgba(11,9,24,.45)}' +
    '#oso-frames .osof-radio button:focus-visible,#oso-frames .osof-radio a:focus-visible{outline:2px solid #fff3d6;outline-offset:2px}' +
    '#oso-frames .osof-radio .osof-sr{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}' +
    '@media (max-width:1100px){#oso-frames .osof-rd-t,#oso-frames .osof-rd-s{max-width:170px}}' +
    '@media (max-width:720px){#oso-frames .osof-dock{height:42px;gap:6px;padding:5px 7px 5px 6px}#oso-frames .osof-rd-s{display:none}' +
      '#oso-frames .osof-rd-t{max-width:120px;font-size:10px;letter-spacing:.05em}#oso-frames .osof-rd-play{width:30px;height:30px}#oso-frames .osof-rd-b{width:24px;height:24px}}' +
    '@media (max-width:360px){#oso-frames .osof-rd-t{max-width:90px}}' +
    '@media (prefers-reduced-motion:reduce){#oso-frames .osof-rd-eq i{animation:none;transform:scaleY(.7)}#oso-frames .osof-rd-play{transition:none}}';

  FRAMES.define('radio', function (ctx, item) {
    'use strict';
    ctx.css('radio', RADIO_CSS);
    const T = function (k, f) { return ctx.t('radio.' + k, f); };
    const fill = function (s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] !== undefined ? String(o[k]) : m; }); };
    const abs = function (u) { if (!u || typeof u !== 'string') return null; try { const x = new URL(ctx.resolve(u), location.href); return /^https?:$/.test(x.protocol) ? x.href : null; } catch (e) { return null; } };
    const tracks = (Array.isArray(item.tracks) ? item.tracks : []).map(function (t) {
      if (!t || typeof t !== 'object') return null;
      const src = abs(t.src);
      if (!src) return null;
      const lic = typeof t.license === 'string' ? t.license : '';
      // ↓ only when the track allows it: download:true|"<url>", or an open (Creative Commons) license unless download:false
      const dl = t.download === false ? null : typeof t.download === 'string' ? abs(t.download) : (t.download === true || /^CC/i.test(lic)) ? src : null;
      return { title: String(t.title || T('untitled', 'Untitled')), artist: String(t.artist || ''), credit: String(t.credit || lic || ''), license: lic, src: src, dl: dl,
        art: abs(t.artwork || t.image || item.artwork) };
    }).filter(Boolean);
    if (!tracks.length) return { el: null, tour: null };

    const live = item.live && typeof item.live === 'object' ? { status: abs(item.live.status), page: abs(item.live.page) } : null;
    const name = item.label || T('label', 'The ʻohana radio');
    const ui = ctx.store('radio');
    const miniKey = 'mini:' + String(item.id || 'radio');
    let idx = 0, audio = null, started = false, asked = false, fails = 0;

    const play = ctx.h('button', { type: 'button', class: 'osof-rd-play', 'aria-pressed': 'false', 'aria-label': fill(T('play', 'Play {name}'), { name: name }) }, '▶');
    const line1 = ctx.h('div', { class: 'osof-rd-t' }, '');
    const line2 = ctx.h('div', { class: 'osof-rd-s' }, '');
    const eq = ctx.h('span', { class: 'osof-rd-eq', 'aria-hidden': 'true' }, ctx.h('i', {}), ctx.h('i', {}), ctx.h('i', {}));
    const liveChip = ctx.h('a', { class: 'osof-rd-live', hidden: true, href: (live && live.page) || '#', target: '_blank', rel: 'noopener',
      'aria-label': T('liveAria', 'LIVE now — open the live radio (new tab)') }, T('live', 'LIVE'));
    const next = ctx.h('button', { type: 'button', class: 'osof-rd-b osof-rd-next', 'aria-label': T('next', 'Next song'), title: T('next', 'Next song') }, '⏭');
    const dl = ctx.h('a', { class: 'osof-rd-b osof-rd-dl', href: '#', target: '_blank', rel: 'noopener', download: '', title: T('download', 'Download') }, '↓');
    const x = ctx.h('button', { type: 'button', class: 'osof-rd-b osof-rd-x', title: T('restTitle', 'rest the music — a tiny 📻 stays'),
      'aria-label': fill(T('rest', 'Hide {name} (a small 📻 stays)'), { name: name }) }, '✕');
    const mini = ctx.h('button', { type: 'button', class: 'osof-rd-mini', title: name, 'aria-label': fill(T('wake', 'Show {name}'), { name: name }) }, '📻');
    const say = ctx.h('div', { class: 'osof-sr', role: 'status' }, '');
    const dock = ctx.h('div', { class: 'osof-dock', role: 'group', 'aria-label': name }, play, ctx.h('div', { class: 'osof-rd-txt' }, line1, line2), eq, liveChip, next, dl, x);
    const el = ctx.h('div', { class: 'osof-radio', 'data-osof-piece': 'radio' }, dock, mini, say);
    if (tracks.length < 2) next.hidden = true;

    const cur = function () { return tracks[idx]; };
    const paint = function () {
      const t = cur();
      const playing = !!(audio && !audio.paused);
      const head = !started ? T('tap', 'Tap to play') : playing ? T('now', 'Now playing') : T('paused', 'Paused');
      line1.textContent = head + ' — ' + t.title;
      line2.textContent = [t.artist, t.credit].filter(Boolean).join(' · ');
      dock.setAttribute('title', t.title + (t.artist ? ' — ' + t.artist : ''));
      play.textContent = playing ? '❚❚' : '▶';
      play.setAttribute('aria-pressed', playing ? 'true' : 'false');
      el.classList.toggle('osof-playing', playing);
      if (t.dl) { dl.hidden = false; dl.setAttribute('href', t.dl); dl.setAttribute('aria-label', fill(T('dlAria', 'Download {title}{lic} (new tab)'), { title: t.title, lic: t.license ? ' — ' + t.license : '' })); }
      else { dl.hidden = true; dl.setAttribute('href', '#'); }
    };
    const session = function () {
      const ms = navigator.mediaSession;
      if (!ms) return;
      const t = cur();
      try {
        if (typeof MediaMetadata === 'function') ms.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: name, artwork: t.art ? [{ src: t.art }] : [] });
        ms.setActionHandler('play', function () { toggle(true); });
        ms.setActionHandler('pause', function () { toggle(false); });
        ms.setActionHandler('nexttrack', tracks.length > 1 ? function () { skip(true); } : null);
      } catch (e) {}
    };
    const askLive = function () { // once per page view, and only after the visitor acted
      if (asked || !live || !live.status) return;
      asked = true;
      const c = new AbortController(); const k = setTimeout(function () { try { c.abort(); } catch (e) {} }, 6000);
      fetch(live.status, { cache: 'no-store', credentials: 'omit', signal: c.signal })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          const on = !!d && (d.on_air === true || (d.on_air !== false && d.live === true));
          if (on && live.page) { liveChip.hidden = false; say.textContent = T('liveNow', 'The live radio is on the air now.'); }
        })
        .catch(function () {})
        .then(function () { clearTimeout(k); });
    };
    const hush = function () { // one voice at a time inside the frame
      const root = document.getElementById('oso-frames');
      if (!root) return;
      root.querySelectorAll('audio,video').forEach(function (m) { if (m !== audio && !m.paused) { try { m.pause(); } catch (e) {} } });
    };
    const ensure = function () {
      if (audio) return audio;
      audio = document.createElement('audio');
      audio.preload = 'none';
      audio.addEventListener('play', function () { started = true; fails = 0; hush(); paint(); session(); say.textContent = fill(T('nowSay', 'Now playing: {title}{by}'), { title: cur().title, by: cur().artist ? ' — ' + cur().artist : '' }); });
      audio.addEventListener('pause', paint);
      audio.addEventListener('ended', function () { skip(true); });
      audio.addEventListener('error', function () {
        if (!audio.getAttribute('src')) return;
        fails++;
        say.textContent = fill(T('failSay', '{title} could not play.'), { title: cur().title });
        if (fails < tracks.length && tracks.length > 1) skip(true); else paint();
      });
      document.addEventListener('play', function (e) { // another player in the frame started: the radio steps back
        const m = e.target;
        if (audio && m !== audio && m && (m.tagName === 'VIDEO' || m.tagName === 'AUDIO') && !audio.paused) audio.pause();
      }, true);
      el.appendChild(audio);
      return audio;
    };
    const toggle = function (want) {
      const a = ensure();
      askLive();
      const go = typeof want === 'boolean' ? want : a.paused;
      if (go) { if (a.getAttribute('src') !== cur().src) a.setAttribute('src', cur().src); a.play().catch(function () { paint(); }); }
      else a.pause();
    };
    const skip = function (keepPlaying) {
      const was = !!(audio && !audio.paused) || keepPlaying === true;
      idx = (idx + 1) % tracks.length;
      if (audio) { audio.pause(); audio.setAttribute('src', cur().src); }
      paint();
      if (was) toggle(true);
      else say.textContent = fill(T('nextSay', 'Next: {title}'), { title: cur().title });
    };
    const setMini = function (on) {
      el.setAttribute('data-mini', on ? '1' : '0');
      if (on) { ui.set(miniKey, true); if (audio && !audio.paused) audio.pause(); }
      else ui.del(miniKey);
    };

    play.addEventListener('click', function () { toggle(); });
    next.addEventListener('click', function () { skip(false); });
    x.addEventListener('click', function () { setMini(true); mini.focus(); });
    mini.addEventListener('click', function () { setMini(false); askLive(); play.focus(); });
    ctx.on('radio:open', function () { setMini(false); askLive(); play.focus(); });

    setMini(ui.get(miniKey) === true);
    paint();

    return {
      el: el,
      tour: item.tip || T('tour', 'The radio: songs of the ʻohana. Nothing plays or loads until you press ▶.'),
      open: function () { setMini(false); askLive(); play.focus(); },
      close: function () { if (audio && !audio.paused) audio.pause(); },
      // NO COVERED TEXT LAW → STAY-IN-PLACE (v0.1.5, Shaka 23 Nov 2026): the core folds the dock to its tiny emoji while words run
      // under it — session only, never undoing the visitor's own ✕ (remembered mini). A playing song is never undone by a fold:
      // the dock folds to 🎧 and keeps playing; a tap on the 🎧 brings the dock back (still playing).
      fold: function (v) { if (ui.get(miniKey) === true) return; el.setAttribute('data-mini', v ? '1' : '0'); var playing = !!(audio && !audio.paused); mini.textContent = v && playing ? '🎧' : '📻'; mini.title = v && playing ? fill(T('playingMini', 'Playing: {title} — show the player'), { title: cur().title }) : name; }
    };
  });
}
// ── src/pieces/signature.js ──
/* ── piece: signature ─────────────────────────────────────────────────────────────
 * Shaka (16 Nov 2026): "for a brief moment you see my signature on the bottom right…
 * get signed in real time once".
 * The SVG holds real pen strokes in drawing order (media/signature.svg, vectorized from
 * the signature Shaka drew over the Open Source Orchestra home page). On a visitor's
 * FIRST visit the strokes draw themselves like a pen (a small glowing nib rides the
 * tip), the signature rests for a breath, then fades away. Never again after that
 * (one-time law). Decorative: aria-hidden, no pointer events, never blocks a click.
 * Dataset: {"kind":"signature","src":"media/signature.svg","at":"bottom-right",
 *           "by":"Shaka Lei Kaumaka","duration":2800,"color":"#f6dc9a","width":210}
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
FRAMES.define('signature', function (ctx, item) {
  if (!item.src && !item.svg) return {};
  if (!ctx.once('signature')) return {};          // once per browser, ever
  var D = Math.max(1200, Math.min(+item.duration || 2800, 6000));
  var HOLD = 1300, FADE = 900, LIFT = 70;        // ms: rest, fade-out, pen lift between strokes
  var at = /left/.test(item.at || '') ? 'left' : 'right';
  var w = Math.max(120, Math.min(+item.width || 210, 360));
  var color = /^#[0-9a-f]{3,8}$/i.test(item.color || '') ? item.color : '#f6dc9a';

  ctx.css('signature', [
    '#oso-frames .osof-sig{position:fixed;bottom:calc(150px + env(safe-area-inset-bottom,0px));z-index:2147482400;',
    'pointer-events:none;opacity:1;transition:opacity ' + FADE + 'ms ease;color:' + color + ';',
    'filter:drop-shadow(0 0 5px rgba(251,226,160,.55)) drop-shadow(0 0 14px rgba(255,158,198,.25))}',
    '#oso-frames .osof-sig.right{right:calc(28px + env(safe-area-inset-right,0px))}',
    '#oso-frames .osof-sig.left{left:calc(28px + env(safe-area-inset-left,0px))}',
    '#oso-frames .osof-sig svg{display:block;width:100%;height:auto;overflow:visible}',
    '#oso-frames .osof-sig .nib{fill:#fffbe9;stroke:none;opacity:0;filter:drop-shadow(0 0 6px #fff4c8)}',
    '#oso-frames .osof-sig.gone{opacity:0}',
    '@media (max-width:720px){#oso-frames .osof-sig{bottom:calc(120px + env(safe-area-inset-bottom,0px))}}'
  ].join(''));

  var box = ctx.h('div', { class: 'osof-sig ' + at, 'aria-hidden': 'true', style: 'width:' + w + 'px' });

  function mount(svgText) {
    var doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    var svg = doc.documentElement;
    if (!svg || svg.nodeName.toLowerCase() !== 'svg' || doc.getElementsByTagName('parsererror').length) return;
    // keep only geometry: drop scripts/handlers/foreign objects (the SVG is data, never code)
    Array.prototype.slice.call(svg.querySelectorAll('script,foreignObject,a,image,use')).forEach(function (n) { n.remove(); });
    Array.prototype.slice.call(svg.querySelectorAll('*')).forEach(function (n) {
      Array.prototype.slice.call(n.attributes).forEach(function (a) { if (/^on/i.test(a.name)) n.removeAttribute(a.name); });
    });
    svg.removeAttribute('width'); svg.removeAttribute('height');
    svg.setAttribute('focusable', 'false');
    var node = document.importNode(svg, true);
    box.appendChild(node);
    var root = document.getElementById('oso-frames') || document.body;
    root.appendChild(box);
    var paths = Array.prototype.slice.call(node.querySelectorAll('path'));
    if (!paths.length) { box.remove(); return; }

    var finish = function (delay) {
      setTimeout(function () {
        box.classList.add('gone');
        setTimeout(function () { box.remove(); ctx.emit('signature:end', {}); }, FADE + 50);
      }, delay);
    };
    if (ctx.reduced) { finish(1500); return; }       // still ink, no motion

    var lens = paths.map(function (p) {
      p.removeAttribute('pathLength');
      var L = 1; try { L = p.getTotalLength() || 1; } catch (e) {}
      p.style.strokeDasharray = L + ' ' + L;
      p.style.strokeDashoffset = String(L);
      return L;
    });
    var total = lens.reduce(function (a, b) { return a + b; }, 0) || 1;
    var ink = D - LIFT * (paths.length - 1);
    var ns = 'http://www.w3.org/2000/svg';
    var nib = document.createElementNS(ns, 'circle');
    nib.setAttribute('r', '3.4'); nib.setAttribute('class', 'nib');
    node.appendChild(nib);

    var t0 = null, plan = [], acc = 0;
    paths.forEach(function (p, i) {
      var dur = Math.max(60, ink * lens[i] / total);
      plan.push({ p: p, L: lens[i], start: acc, dur: dur });
      acc += dur + LIFT;
    });
    var ease = function (x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
    function frame(ts) {
      if (t0 === null) t0 = ts;
      var t = ts - t0, live = null;
      for (var i = 0; i < plan.length; i++) {
        var s = plan[i], k = (t - s.start) / s.dur;
        if (k <= 0) continue;
        if (k >= 1) { if (!s.done) { s.p.style.strokeDashoffset = '0'; s.done = true; } continue; }
        var e = ease(k);
        s.p.style.strokeDashoffset = String(s.L * (1 - e));
        live = { s: s, e: e };
      }
      if (live) {
        try {
          var pt = live.s.p.getPointAtLength(live.s.L * live.e);
          nib.setAttribute('cx', pt.x); nib.setAttribute('cy', pt.y); nib.style.opacity = '1';
        } catch (e) {}
      } else nib.style.opacity = '0';
      if (t < acc) requestAnimationFrame(frame);
      else { nib.remove(); finish(HOLD); }          // the loop ends — nothing keeps running
    }
    requestAnimationFrame(frame);
  }

  var startDelay = Math.max(0, +item.delay || 1200);
  setTimeout(function () {
    if (item.svg) { mount(String(item.svg)); return; }
    fetch(ctx.resolve(item.src), { credentials: 'omit' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (t) { if (t) mount(t); })
      .catch(function () {});
  }, startDelay);

  return { el: null, tour: null };
});
// ── src/pieces/thanks.js ──
/* ───────────────────────────── piece: thanks ─────────────────────────────
 * Open Source Orchestra Frames · src/pieces/thanks.js
 * SPDX-License-Identifier: AGPL-3.0-or-later · Copyright (C) 2026 Shaka Lei Kaumaka / Open Source Orchestra and the AI ʻohana
 *
 * Shaka, 22 Nov 2026 (12:55 BKK): "remove the description bubbles on ALL DOORS … lets just have a way where if an agent comes
 * to our site it in agent language communicates the gratitude from receiving a gift … x402, as well as stripe and venmo/paypal
 * for gifting rails … a small text on the top of the screen that always disappears after three seconds."
 *
 * One small line, top centre, once per page view: thanks for every gift + the rails (agents: x402 · humans: Stripe/PayPal/Venmo).
 * It fades after three seconds, or on a tap, or on its tiny ✕. BUTTON LAW: it never sits on the page's words — it steps down to
 * the first clear band, and when no band is clear it simply does not show on that page view. "Agent language" = the same rails
 * as machine-readable data: <meta name="x402"> + <link rel="alternate" type="application/json"> in <head>, a `data-gift` JSON
 * attribute on the line, and the event "gift:rails" (DOM: osoframes:gift:rails). Rails come from the dataset's `gift` object. */
{
  const THANKS_SANS = 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  const THANKS_CSS = '' +
    '#oso-frames .osof-thanks{position:fixed;left:50%;top:var(--osof-thanks-y,8px);transform:translateX(-50%);display:flex;align-items:center;gap:8px;' +
      'max-width:min(94vw,760px);padding:6px 8px 6px 12px;border-radius:999px;background:rgba(16,13,34,.94);border:1px solid rgba(251,226,160,.45);' +
      'box-shadow:0 6px 18px rgba(0,0,0,.35);font:500 12.5px/1.3 ' + THANKS_SANS + ';color:#f6e7c4;white-space:nowrap;pointer-events:auto;' +
      'opacity:0;transition:opacity .35s ease;cursor:default}' +
    '#oso-frames .osof-thanks.osof-on{opacity:1}' +
    '#oso-frames .osof-thanks b{font-weight:700;color:#fff3da}' +
    '#oso-frames .osof-thanks a{color:#fbe2a0;text-decoration:underline;text-underline-offset:.16em;text-decoration-color:rgba(251,226,160,.5)}' +
    '#oso-frames .osof-thanks a:hover,#oso-frames .osof-thanks a:focus-visible{color:#fff3da;text-decoration-color:currentColor}' +
    '#oso-frames .osof-thanks .osof-thanks-sep{opacity:.55}' +
    '#oso-frames .osof-thanks-x{width:20px;height:20px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;' +
      'border:1px solid rgba(251,226,160,.45);color:#fbe2a0;font:700 10px/1 ' + THANKS_SANS + ';cursor:pointer;opacity:.85}' +
    '#oso-frames .osof-thanks-x:hover,#oso-frames .osof-thanks-x:focus-visible{opacity:1;background:rgba(251,226,160,.14)}' +
    '#oso-frames[data-mode=mobile] .osof-thanks{font-size:11.5px;white-space:normal;text-align:center;max-width:calc(100vw - 16px);border-radius:14px;padding:6px 8px 6px 10px}' +
    '#oso-frames[data-mode=mobile] .osof-thanks .osof-thanks-t{display:block}' +
    '@media (prefers-reduced-motion:reduce){#oso-frames .osof-thanks{transition:none}}';

  FRAMES.define('thanks', function (ctx, item) {
    'use strict';
    ctx.css('thanks', THANKS_CSS);
    const T = function (k, f) { return ctx.t('thanks.' + k, f); };
    const isURL = function (u) { return typeof u === 'string' && /^https?:\/\//i.test(u); };
    const gift = Object.assign({}, ctx.data.gift || {}, item.gift || {});
    const rails = [];
    if (isURL(gift.stripe)) rails.push({ k: 'stripe', n: T('stripe', 'Stripe'), u: gift.stripe });
    if (isURL(gift.paypal)) rails.push({ k: 'paypal', n: T('paypal', 'PayPal'), u: gift.paypal });
    if (isURL(gift.venmo)) rails.push({ k: 'venmo', n: T('venmo', 'Venmo'), u: gift.venmo });
    const x402 = isURL(gift.x402) ? gift.x402 : null;
    if (!x402 && !rails.length) return null;                     // nothing to thank for: no line

    // agent language: the same rails, machine-readable, once per document
    try {
      const head = document.head;
      if (head && x402 && !head.querySelector('meta[name="x402"]')) {
        head.appendChild(ctx.h('meta', { name: 'x402', content: x402 }));
        head.appendChild(ctx.h('link', { rel: 'alternate', type: 'application/json', title: 'x402 gift instructions · Open Source Orchestra', href: x402 }));
      }
    } catch (e) {}
    ctx.emit('gift:rails', { x402: x402, rails: rails.map(function (r) { return { kind: r.k, href: r.u }; }), pool: isURL(gift.pool) ? gift.pool : null });

    const link = function (href, text, title) { return ctx.h('a', { href: href, target: '_blank', rel: 'noopener', title: title || null }, text); };
    const sep = function () { return ctx.h('span', { class: 'osof-thanks-sep', 'aria-hidden': 'true' }, ' · '); };
    const parts = [ctx.h('span', { class: 'osof-thanks-t' }, ctx.h('span', { 'aria-hidden': 'true' }, '🙏 '), ctx.h('b', {}, T('line', 'Mahalo for every gift.')), ' ')];
    if (x402) parts.push(ctx.h('span', {}, T('agents', 'Agents:'), ' ', link(x402, 'x402', T('x402tip', 'Machine-readable gift instructions (x402)'))));
    if (rails.length) {
      if (x402) parts.push(sep());
      const hs = [T('humans', 'Humans:'), ' '];
      rails.forEach(function (r, i) { if (i) hs.push(sep()); hs.push(link(r.u, r.n)); });
      parts.push(ctx.h('span', {}, hs));
    }
    const x = ctx.h('button', { type: 'button', class: 'osof-thanks-x', 'aria-label': T('close', 'Dismiss') }, ctx.h('span', { 'aria-hidden': 'true' }, '✕'));
    const el = ctx.h('div', { class: 'osof-thanks', role: 'status', 'aria-live': 'polite', 'data-osof-piece': 'thanks', hidden: true,
      'data-gift': JSON.stringify({ x402: x402, stripe: gift.stripe || null, paypal: gift.paypal || null, venmo: gift.venmo || null, pool: gift.pool || null }) }, parts, x);

    let timer = 0, gone = false;
    const hide = function (why) {
      if (gone) return; gone = true;
      clearTimeout(timer);
      el.classList.remove('osof-on');
      setTimeout(function () { el.hidden = true; }, ctx.reduced ? 0 : 380);
      ctx.emit('thanks:end', { why: why });
    };
    x.addEventListener('click', function (e) { e.stopPropagation(); hide('x'); });
    el.addEventListener('click', function (e) { if (!e.target.closest || !e.target.closest('a')) hide('tap'); });

    // BUTTON LAW: the first band (top, then below our own corners) with no words under it; none → no line on this page view
    const place = function () {
      el.hidden = false;
      const r = el.getBoundingClientRect(), vh = window.innerHeight, hgt = r.height || 30;
      const tries = [8];                                         // v0.1.5 STAY-IN-PLACE: one anchor (top centre); covered ground → no line on this page view
      // v0.1.3: the two top corners (🌐 + 🌺 ceremony on the left, 🌊 Blessing Pool + 🎻 on the right) are obstacles too
      const corners = typeof ctx.corners === 'function' ? ctx.corners() : [];
      const onCorner = function (box) { return corners.some(function (c) { return c && box.left < c.right + 6 && box.right > c.left - 6 && box.top < c.bottom + 6 && box.top + box.height > c.top - 6; }); };
      for (let i = 0; i < tries.length; i++) {
        const box = { left: r.left, right: r.right, top: tries[i], height: hgt };
        if (!onCorner(box) && !(typeof ctx.blockedAt === 'function' ? ctx.blockedAt(box) : ctx.textAt(box))) { el.style.setProperty('--osof-thanks-y', tries[i] + 'px'); return true; }   // v0.1.5: a page's own fixed bar counts too
      }
      el.hidden = true;
      return false;
    };
    const dwell = Math.min(8000, Math.max(1500, +item.seconds * 1000 || 3000));
    const show = function () {
      if (gone || !el.isConnected) return;
      if (!place()) { gone = true; ctx.emit('thanks:end', { why: 'no-clear-spot' }); return; }
      requestAnimationFrame(function () { el.classList.add('osof-on'); });
      ctx.emit('thanks:show', {});
      timer = setTimeout(function () { hide('time'); }, dwell);
    };
    const t0 = setTimeout(show, Math.max(0, +item.delay || 900));
    const offResize = function () { if (!gone && !el.hidden) hide('resize'); };
    window.addEventListener('resize', offResize);
    ctx.on('tour:start', function () { if (!gone && !el.hidden) hide('ceremony'); });   // the ceremony bar takes the top band

    return {
      el: el,
      tour: null,
      open: function () { gone = false; el.hidden = true; el.classList.remove('osof-on'); show(); },
      close: function () { clearTimeout(t0); hide('close'); window.removeEventListener('resize', offResize); }
    };
  });
}
// ── src/pieces/gift.js ──
/* ── gift: the pennies-of-aloha card (v0.1.7, 27 Nov 2026 — Shaka: "finish the x402 pennies of aloha
 * button fix on all doors and frames") ──────────────────────────────────────────────────────────────
 * A door rec with "gift": true (the 🌊 Blessing Pool, top-right on every door) keeps its href (SEO,
 * middle-click, no-JS) but a TAP opens this card instead of navigating: USDC on Base straight to the
 * ʻohana's agent-launch wallet (osoartist.eth = 0x2596…c934 — the ONE address, Shaka's law 23 Nov),
 * gas-free for the giver (EIP-3009 transferWithAuthorization, verified + settled by the PayAI
 * facilitator). No fox → copy the address by hand; humans also get the Stripe · PayPal · Venmo rails
 * and a link out to the Blessing Pool page. Agents get the x402 instructions link.
 * The card is a modal the visitor ASKED for — the NO COVERED TEXT law does not fold it.
 * Same flow lives standalone on unframed doors: shakaleikaumaka.com/assets/x402-tip.js (v2.0) — keep in sync.
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
  var FACILITATOR = 'https://facilitator.payai.network';
  var USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
  var PAYTO = '0x25965899f4600b3AA5362ee4f34be95E5E62c934';
  var BASE_CHAIN = 8453;
  var RESOURCE = 'https://shakaleikaumaka.com/x402-bless.json';
  var ETHERS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.4/ethers.umd.min.js';
  var F = '#oso-frames';
  var CSS = [
    F + ' .osof-gift-sub{color:#cdbce8;font:13px/1.5 system-ui,-apple-system,sans-serif;margin:0 0 12px}',
    F + ' .osof-gift-sub a{color:#7fd8a4}',
    F + ' .osof-gift-amts{display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 12px}',
    F + ' .osof-gift-amt{background:#0b0710;border:1px solid #4a3565;color:#f5efe6;border-radius:10px;padding:8px 14px;font:14px system-ui,-apple-system,sans-serif;cursor:pointer}',
    F + ' .osof-gift-amt[aria-pressed="true"]{border-color:#7fd8a4;color:#7fd8a4}',
    F + ' .osof-gift-custom{background:#0b0710;border:1px solid #4a3565;color:#f5efe6;border-radius:10px;padding:8px 10px;font:14px system-ui,-apple-system,sans-serif;width:96px}',
    F + ' .osof-gift-send{width:100%;background:linear-gradient(90deg,#0052ff,#7c4ba8);color:#fff;border:none;border-radius:12px;padding:12px;font:700 15px system-ui,-apple-system,sans-serif;cursor:pointer;margin-top:2px}',
    F + ' .osof-gift-send:disabled{opacity:.5;cursor:wait}',
    F + ' .osof-gift-st{color:#9d97c9;font:13px/1.5 system-ui,-apple-system,sans-serif;margin-top:12px;word-break:break-word}',
    F + ' .osof-gift-st a{color:#7fd8a4}',
    F + ' .osof-gift-fb{margin-top:14px;border-top:1px solid #2c2140;padding-top:12px}',
    F + ' .osof-gift-addr{background:#0b0710;border:1px solid #4a3565;border-radius:10px;padding:8px 10px;font:12px ui-monospace,monospace;word-break:break-all;color:#cfc6e8}',
    F + ' .osof-gift-copy{background:#1c1230;color:#7fd8a4;border:1px solid #7fd8a4;border-radius:10px;padding:8px 14px;font:13px system-ui,-apple-system,sans-serif;cursor:pointer;margin-top:8px}',
    F + ' .osof-gift-rails{margin-top:14px;border-top:1px solid #2c2140;padding-top:10px;color:#cdbce8;font:13px/1.8 system-ui,-apple-system,sans-serif}',
    F + ' .osof-gift-rails a{color:#fbe2a0}',
    F + ' .osof-gift-honest{margin-top:10px;color:#8b84ad;font:11.5px/1.5 system-ui,-apple-system,sans-serif}'
  ].join('\n');

  var built = null;   // one card per frame (per page)

  function ensureEthers() {
    if (window.ethers) return Promise.resolve();
    if (!window.__osofGiftEthersP) {
      window.__osofGiftEthersP = new Promise(function (res, rej) {
        var s = document.createElement('script');
        s.src = ETHERS_URL;
        s.onload = res;
        s.onerror = function () { rej(new Error('could not load ethers from cdnjs')); };
        document.head.appendChild(s);
      });
    }
    return window.__osofGiftEthersP;
  }

  function build(ctx) {
    var h = ctx.h, t = ctx.t;
    var d = ctx.panel({ id: 'gift', title: '🌊 ' + t('gift.title', 'pennies of aloha') });
    var amt = 0.01;
    var st = h('div', { class: 'osof-gift-st', role: 'status', 'aria-live': 'polite' });
    var fb = h('div', { class: 'osof-gift-fb', hidden: true });
    var custom = h('input', { class: 'osof-gift-custom', type: 'number', min: '0.001', step: '0.001', placeholder: t('gift.custom', 'custom $'), 'aria-label': t('gift.custom', 'custom amount in dollars') });
    var send = h('button', { type: 'button', class: 'osof-gift-send' }, t('gift.send', '🦊 send with MetaMask'));
    function say(m) { st.innerHTML = m || ''; }     // trusted, our own markup only (tx hash is hex)
    function sayT(m) { st.textContent = m; }
    var amts = [['0.01', '1¢'], ['0.10', '10¢'], ['1', '$1']].map(function (pair, i) {
      return h('button', { type: 'button', class: 'osof-gift-amt', 'data-v': pair[0], 'aria-pressed': i === 0 ? 'true' : 'false', on: {
        click: function (e) {
          d.body.querySelectorAll('.osof-gift-amt').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          e.currentTarget.setAttribute('aria-pressed', 'true');
          amt = parseFloat(pair[0]); custom.value = '';
        } } }, pair[1]);
    });
    custom.addEventListener('input', function () {
      var v = parseFloat(custom.value);
      if (v > 0) { amt = v; d.body.querySelectorAll('.osof-gift-amt').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); }
    });

    var addr = h('div', { class: 'osof-gift-addr' }, PAYTO);
    var copy = h('button', { type: 'button', class: 'osof-gift-copy', on: {
      click: function () {
        function okC() { copy.textContent = t('gift.copied', '✅ copied — mahalo!'); setTimeout(function () { copy.textContent = t('gift.copy', '📋 copy address'); }, 2500); }
        function fbC() { var ta = document.createElement('textarea'); ta.value = PAYTO; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); okC(); } catch (e) {} document.body.removeChild(ta); }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(PAYTO).then(okC, fbC); else fbC();
      } } }, t('gift.copy', '📋 copy address'));
    fb.appendChild(h('div', { class: 'osof-gift-sub', style: 'margin-bottom:6px' }, t('gift.nofox', 'no fox? no worries — send USDC on Base by hand to the ʻohana wallet:')));
    fb.appendChild(addr); fb.appendChild(copy);

    send.addEventListener('click', async function () {
      try {
        if (!window.ethereum) { sayT(t('gift.nowallet', '🦊 no wallet found — install MetaMask (or any EIP-1193 fox), or use the address below 🌺')); fb.hidden = false; return; }
        if (!(amt > 0)) { sayT('⚠️ pick an amount above zero'); return; }
        send.disabled = true;
        sayT('⏳ loading the signing library…'); await ensureEthers();
        sayT('🦊 connecting the fox…');
        var provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        var net = await provider.getNetwork();
        if (Number(net.chainId) !== BASE_CHAIN) {
          sayT('🌉 switching to Base…');
          try { await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] }); }
          catch (e) { await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: '0x2105', chainName: 'Base', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://mainnet.base.org'], blockExplorerUrls: ['https://basescan.org'] }] }); }
          provider = new ethers.BrowserProvider(window.ethereum);
        }
        var signer = await provider.getSigner();
        var from = await signer.getAddress();
        var value = BigInt(Math.round(amt * 1e6));
        var now = Math.floor(Date.now() / 1000);
        var nonce = ethers.hexlify(ethers.randomBytes(32));
        var auth = { from: from, to: PAYTO, value: value, validAfter: 0, validBefore: now + 300, nonce: nonce };
        sayT('✍️ sign the aloha (EIP-3009 — gas-free for you)…');
        var sig = await signer.signTypedData(
          { name: 'USD Coin', version: '2', chainId: BASE_CHAIN, verifyingContract: USDC },
          { TransferWithAuthorization: [
            { name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'value', type: 'uint256' },
            { name: 'validAfter', type: 'uint256' }, { name: 'validBefore', type: 'uint256' }, { name: 'nonce', type: 'bytes32' }] },
          auth);
        var payload = { x402Version: 1, scheme: 'exact', network: 'base', payload: { signature: sig, authorization: { from: auth.from, to: auth.to, value: auth.value.toString(), validAfter: String(auth.validAfter), validBefore: String(auth.validBefore), nonce: auth.nonce } } };
        var req = { scheme: 'exact', network: 'base', maxAmountRequired: value.toString(), resource: RESOURCE, description: 'pennies of aloha 🤙 — every drop keeps a door open', mimeType: 'application/json', payTo: PAYTO, maxTimeoutSeconds: 300, asset: USDC, extra: { name: 'USD Coin', version: '2' } };
        sayT('🌊 verifying with the facilitator…');
        var vr = await fetch(FACILITATOR + '/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ x402Version: 1, paymentPayload: payload, paymentRequirements: req }) });
        var vj = await vr.json();
        if (!vj.isValid) { sayT('⚠️ the facilitator did not bless it: ' + (vj.invalidReason || 'unknown') + ' — nothing left your wallet'); send.disabled = false; return; }
        sayT('🌊 settling on Base… (seconds)');
        var sr = await fetch(FACILITATOR + '/settle', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ x402Version: 1, paymentPayload: payload, paymentRequirements: req }) });
        var sj = await sr.json();
        if (sj.success) {
          say('🌊🤙 <b>ALOHA RECEIVED.</b> mahalo nui!' + (sj.transaction ? ('<br>✦ on-chain forever: <a href="https://basescan.org/tx/' + sj.transaction + '" target="_blank" rel="noopener">' + sj.transaction.slice(0, 14) + '…' + sj.transaction.slice(-8) + '</a> ✦') : ''));
          ctx.emit('gift:sent', { tx: sj.transaction || null, amount: amt });
        } else {
          sayT('⚠️ settlement hiccup: ' + (sj.error || sj.errorReason || 'unknown') + ' — nothing left your wallet without success');
        }
      } catch (e) {
        if (e && e.code === 4001) { sayT('🦊 declined for now — the aloha waits patiently 🌺'); }
        else if (/insufficient/i.test(String(e && e.message || e))) { sayT('⚠️ not enough USDC on Base in this wallet'); }
        else { sayT('⚠️ hiccup: ' + ((e && e.message) || e)); }
      }
      send.disabled = false;
    });

    d.body.appendChild(h('div', { class: 'osof-gift-sub' },
      'USDC on ', h('b', {}, 'Base'), ' straight to the ʻohana’s agent-launch wallet — gas-free for you (EIP-3009; the pool settles it via ',
      h('a', { href: 'https://facilitator.payai.network', target: '_blank', rel: 'noopener' }, 'PayAI'), ').'));
    d.body.appendChild(h('div', { class: 'osof-gift-amts' }, amts, custom));
    d.body.appendChild(send);
    d.body.appendChild(st);
    d.body.appendChild(fb);
    d.body.appendChild(h('div', { class: 'osof-gift-honest' }, t('gift.honest', 'made by the ʻohana (machines), blessed by Shaka (a human) · every drop keeps a door open 🌺')));
    return {
      sync: function (item) {
        var gift = (ctx.data && ctx.data.gift) || {};
        var rails = d.body.querySelector('.osof-gift-rails');
        if (rails) rails.remove();
        var parts = [];
        function link(u, label) { return u ? h('a', { href: u, target: '_blank', rel: 'noopener' }, label) : null; }
        var pool = (item && item.href) || gift.pool;
        var poolA = link(pool, t('gift.poolpage', 'the Blessing Pool page ↗'));
        if (poolA) parts.push(poolA);
        [['stripe', 'Stripe'], ['paypal', 'PayPal'], ['venmo', 'Venmo']].forEach(function (p) {
          var a = link(gift[p[0]], p[1]); if (a) { if (parts.length) parts.push(' · '); parts.push(a); }
        });
        var x = link(gift.x402 || RESOURCE, t('gift.agents', 'agents: x402 instructions 🤖'));
        if (x) { if (parts.length) parts.push(' · '); parts.push(x); }
        if (parts.length) d.body.insertBefore(h('div', { class: 'osof-gift-rails' }, parts), d.body.querySelector('.osof-gift-honest'));
      },
      reset: function () { sayT(''); fb.hidden = true; send.disabled = false; }
    };
  }

  FRAMES.gift = {
    open: function (ctx, item) {
      if (!ctx || typeof ctx.panel !== 'function') return false;
      ctx.css('gift', CSS);
      if (!built) built = build(ctx);
      built.sync(item || ctx.item);
      built.reset();
      ctx.panel({ id: 'gift' }).open();
      ctx.emit('gift:open', { id: item && item.id });
      return true;
    }
  };
})();
FRAMES.boot();
})();
