/*! tests/fake-core.js — a MINIMAL, STRICT stand-in for src/core.js (SPEC §3) so the media pieces
 *  (theater · totem · chat · radio) can be tested before the merge. NOT shipped; the real core is src/core.js.
 *  SPDX-License-Identifier: AGPL-3.0-or-later · Copyright (C) 2026 Shaka Lei Kaumaka / Open Source Orchestra and the AI ʻohana
 *  Strict on purpose: ctx.h throws on null/array kids and ctx.css reports any selector that does not start with
 *  #oso-frames, so a piece that leans on something outside the SPEC §3 contract fails here first. */
(function () {
  'use strict';
  var VERSION = '0.1.0';
  var MAJOR = VERSION.split('.')[0];
  var kinds = {};
  var bus = {};
  var mounted = {};
  var root = null;
  var data = null;
  var dataUrl = document.baseURI;
  var FRESH = /[?&]frame=fresh\b/.test(location.search);
  var OFF = /[?&]frame=off\b/.test(location.search);
  var me = document.currentScript;
  var BASE = new URL('../', (me && me.src) || location.href).href; // frames.js lives at the repo root
  var mem = {};
  var CREDIT = 'Built on Open Source Orchestra Frames by Open Source Orchestra: Shaka Lei Kaumaka & the AI ʻohana (https://opensourceorchestra.org)';

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } }

  function on(name, fn) {
    (bus[name] = bus[name] || []).push(fn);
    return function off() { var a = bus[name] || []; var i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); };
  }
  function emit(name, detail) {
    (bus[name] || []).slice().forEach(function (fn) {
      try { fn(detail); } catch (e) { setTimeout(function () { throw e; }); }
    });
  }

  // ctx.h(tag, attrs, ...kids): strings are TEXT, never HTML. STRICT: kids must be Nodes or strings/numbers.
  function h(tag, attrs) {
    var el = document.createElement(tag);
    var a = attrs || {};
    Object.keys(a).forEach(function (k) {
      var v = a[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'on') { Object.keys(v).forEach(function (ev) { el.addEventListener(ev, v[ev]); }); return; }
      if (k === 'class') { el.className = String(v); return; }
      if (k === 'style') { el.setAttribute('style', String(v)); return; }
      if (typeof v === 'function' || (typeof v === 'object')) throw new TypeError('fake-core h(): attribute ' + k + ' must be a string/number/boolean');
      el.setAttribute(k, v === true ? '' : String(v));
    });
    for (var i = 2; i < arguments.length; i++) {
      var kid = arguments[i];
      if (kid instanceof Node) el.appendChild(kid);
      else if (typeof kid === 'string' || typeof kid === 'number') el.appendChild(document.createTextNode(String(kid)));
      else throw new TypeError('fake-core h(): kid #' + (i - 2) + ' of <' + tag + '> must be a Node or a string (got ' + (kid === null ? 'null' : Array.isArray(kid) ? 'array' : typeof kid) + ')');
    }
    return el;
  }

  var injected = {};
  function checkRules(rules, id) {
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.type === 1) { // CSSStyleRule
        r.selectorText.split(',').forEach(function (s) {
          if (s.trim().indexOf('#oso-frames') !== 0) console.error('fake-core css(' + id + '): selector outside #oso-frames: ' + s.trim());
        });
      } else if (r.cssRules && r.type !== 7) { checkRules(r.cssRules, id); } // media/supports; keyframes (7) are fine
    }
  }
  function css(id, text) {
    if (injected[id]) return;
    injected[id] = true;
    var st = document.createElement('style');
    st.setAttribute('data-osof', id);
    st.textContent = text;
    document.head.appendChild(st);
    try { checkRules(st.sheet.cssRules, id); } catch (e) { console.error('fake-core css(' + id + '): ' + e.message); }
  }

  function frameId() { return (data && data.id) || 'frame'; }
  function once(key) {
    if (FRESH) return true;
    var k = 'osof:once:' + frameId() + ':' + key;
    var v;
    try { v = localStorage.getItem(k); } catch (e) { v = Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; }
    if (v === MAJOR) return false;
    lsSet(k, MAJOR);
    return true;
  }
  function store(ns) {
    var p = 'osof:' + ns + ':';
    return {
      get: function (k) { var v = lsGet(p + k); if (v === null) return null; try { return JSON.parse(v); } catch (e) { return null; } },
      set: function (k, v) { try { lsSet(p + k, JSON.stringify(v)); } catch (e) {} },
      del: function (k) { lsDel(p + k); }
    };
  }
  function mq(q) { try { return window.matchMedia(q).matches; } catch (e) { return false; } }
  function t(key, fallback) { var s = data && data.strings; return (s && typeof s[key] === 'string') ? s[key] : fallback; }
  function resolve(u) { try { return new URL(u, dataUrl).href; } catch (e) { return u; } }

  // ---- the ONE shared accessible dialog shell (role=dialog, aria-modal, focus trap, Esc, focus return, one at a time)
  var openPanel = null;
  var FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),video[controls],audio[controls],iframe,[tabindex]:not([tabindex="-1"])';
  function panel(opts) {
    var pid = 'osof-panel-' + String(opts.id || 'p').replace(/[^a-z0-9_-]/gi, '');
    var titleId = pid + '-title';
    var opener = null;
    var x = h('button', { type: 'button', class: 'osof-panel-x', 'aria-label': t('panel.close', 'Close') }, '✕');
    var head = h('div', { class: 'osof-panel-head' }, h('h2', { id: titleId, class: 'osof-panel-title' }, String(opts.title || '')), x);
    var body = h('div', { class: 'osof-panel-body' });
    var box = h('div', { id: pid, class: 'osof-panel' + (opts.wide ? ' osof-panel-wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId, tabindex: '-1' }, head, body);
    var veil = h('div', { class: 'osof-veil', hidden: true }, box);
    var api;
    function isOpen() { return !veil.hidden; }
    function close() {
      if (!isOpen()) return;
      veil.hidden = true;
      if (openPanel === api) openPanel = null;
      try { if (opts.onClose) opts.onClose(); } catch (e) { setTimeout(function () { throw e; }); }
      var o = opener; opener = null;
      if (o && o.isConnected && typeof o.focus === 'function') o.focus();
    }
    function open(op) {
      if (openPanel && openPanel !== api) openPanel.close();
      opener = op || document.activeElement;
      if (!veil.isConnected) root.appendChild(veil);
      veil.hidden = false;
      openPanel = api;
      var f = body.querySelector(FOCUSABLE) || x;
      try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); }
    }
    x.addEventListener('click', close);
    veil.addEventListener('mousedown', function (e) { if (e.target === veil) close(); });
    veil.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
      if (e.key !== 'Tab') return;
      var list = Array.prototype.filter.call(box.querySelectorAll(FOCUSABLE), function (n) { return n.offsetParent !== null || n === document.activeElement; });
      if (!list.length) { e.preventDefault(); return; }
      var first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    api = { root: box, body: body, head: head, open: open, close: close, isOpen: isOpen };
    return api;
  }

  var SLOTS = ['top-left', 'left', 'bottom-left', 'bottom-right', 'right', 'top-right', 'overlay'];
  var BASE_CSS = '' +
    '#oso-frames{position:static;font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#f4efe6}' +
    '#oso-frames *{box-sizing:border-box}' +
    '#oso-frames .osof-slot{position:fixed;z-index:2147481000;pointer-events:none;display:flex;gap:10px}' +
    '#oso-frames .osof-slot>*{pointer-events:auto}' +
    '#oso-frames .osof-slot-top-left{top:calc(10px + env(safe-area-inset-top));left:calc(10px + env(safe-area-inset-left));width:46px;height:46px}' +
    '#oso-frames .osof-slot-left{left:calc(10px + env(safe-area-inset-left));top:72px;bottom:120px;flex-direction:column;align-items:center;width:46px}' +
    '#oso-frames .osof-slot-right{right:calc(10px + env(safe-area-inset-right));top:72px;bottom:170px;flex-direction:column;align-items:center;width:46px}' +
    '#oso-frames .osof-slot-top-right{top:calc(10px + env(safe-area-inset-top));right:calc(10px + env(safe-area-inset-right));flex-direction:row}' +
    '#oso-frames .osof-slot-bottom-left{left:calc(10px + env(safe-area-inset-left));bottom:calc(10px + env(safe-area-inset-bottom));flex-direction:column;align-items:flex-start;gap:6px}' +
    '#oso-frames .osof-slot-bottom-right{right:calc(10px + env(safe-area-inset-right));bottom:calc(10px + env(safe-area-inset-bottom));flex-direction:column;align-items:flex-end;gap:10px}' +
    '#oso-frames .osof-slot-overlay{inset:0}' +
    '@media (max-width:720px){#oso-frames .osof-slot-left,#oso-frames .osof-slot-right{display:none}}' +
    '#oso-frames .osof-veil{position:fixed;inset:0;z-index:2147482000;background:rgba(8,5,16,.55);display:flex;align-items:center;justify-content:center;padding:16px}' +
    '#oso-frames .osof-veil[hidden]{display:none}' +
    '#oso-frames .osof-panel{position:relative;width:min(440px,100%);max-height:min(86vh,760px);overflow:auto;background:#120b24;color:#ece7f6;border:1px solid #3a2a66;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.6)}' +
    '#oso-frames .osof-panel-wide{width:min(980px,100%)}' +
    '#oso-frames .osof-panel:focus{outline:none}' +
    '#oso-frames .osof-panel-head{position:sticky;top:0;z-index:1;display:flex;align-items:center;gap:10px;padding:14px 16px 10px 20px;background:#120b24;border-bottom:1px solid #2a1f4a}' +
    '#oso-frames .osof-panel-title{margin:0;font:700 18px/1.25 Georgia,"Times New Roman",serif;color:#f0c75e}' +
    '#oso-frames .osof-panel-x{margin-left:auto;width:34px;height:34px;border-radius:999px;border:1px solid #3a2a66;background:#1c1333;color:#ece7f6;font-size:15px;cursor:pointer}' +
    '#oso-frames .osof-panel-x:focus-visible{outline:2px solid #f0c75e;outline-offset:2px}' +
    '#oso-frames .osof-panel-body{padding:16px 20px 20px}';

  function define(kind, factory) { kinds[kind] = factory; }

  function skip(item) {
    var u = item && item.unless;
    if (!u) return false;
    if (/^window\./.test(u)) return !!window[u.slice(7)];
    try { return !!document.querySelector(u); } catch (e) { return false; }
  }

  function boot(ds, url) {
    if (OFF || root) return;
    if (!ds) { var tag = document.getElementById('oso-frame'); ds = tag ? JSON.parse(tag.textContent) : { slots: {} }; }
    data = ds;
    if (url) dataUrl = url;
    root = h('div', { id: 'oso-frames', class: 'osof', 'data-osof-version': VERSION });
    css('core', BASE_CSS);
    var slotEls = {};
    SLOTS.forEach(function (s) { slotEls[s] = h('div', { class: 'osof-slot osof-slot-' + s, 'data-slot': s }); root.appendChild(slotEls[s]); });
    document.body.appendChild(root);
    var n = 0;
    SLOTS.forEach(function (s) {
      ((ds.slots && ds.slots[s]) || []).forEach(function (item) {
        n++;
        if (skip(item)) return;
        var f = kinds[item.kind];
        if (!f) return;
        var ctx = {
          data: ds, item: item, slot: s, h: h, css: css, once: once, store: store,
          reduced: mq('(prefers-reduced-motion: reduce)'),
          mobile: mq('(max-width: 720px)') || (mq('(pointer: coarse)') && window.innerHeight < 560),
          panel: panel, t: t, resolve: resolve, base: BASE, emit: emit, on: on, credit: CREDIT
        };
        var res;
        try { res = f(ctx, item) || {}; } catch (e) { console.error('fake-core: piece ' + item.kind + ' threw: ' + (e && e.stack || e)); return; }
        if (res.el) { res.el.setAttribute('data-osof-kind', item.kind); slotEls[s].appendChild(res.el); }
        mounted[item.id || (item.kind + '-' + n)] = res;
      });
    });
    emit('frame:ready', {});
  }

  window.FRAMES = window.OSOFrames = {
    version: VERSION,
    define: define,
    on: on,
    emit: emit,
    boot: boot,
    open: function (id) { var m = mounted[id]; if (m && m.open) m.open(); },
    close: function (id) { var m = mounted[id]; if (m && m.close) m.close(); },
    outline: function () {},
    tour: function () { emit('tour:start', {}); emit('tour:end', {}); },
    reset: function () {
      var dead = [];
      try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf('osof:') === 0) dead.push(k); } } catch (e) {}
      dead.forEach(lsDel);
    },
    _mounted: mounted
  };
})();
