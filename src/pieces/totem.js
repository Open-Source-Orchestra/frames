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
