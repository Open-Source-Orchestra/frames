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
