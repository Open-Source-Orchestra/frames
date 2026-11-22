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
      const tries = [8];
      for (let y = 136; y <= vh * 0.4; y += hgt + 14) tries.push(y);
      for (let i = 0; i < tries.length; i++) {
        const box = { left: r.left, right: r.right, top: tries[i], height: hgt };
        if (!ctx.textAt(box)) { el.style.setProperty('--osof-thanks-y', tries[i] + 'px'); return true; }
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

    return {
      el: el,
      tour: null,
      open: function () { gone = false; el.hidden = true; el.classList.remove('osof-on'); show(); },
      close: function () { clearTimeout(t0); hide('close'); window.removeEventListener('resize', offResize); }
    };
  });
}
