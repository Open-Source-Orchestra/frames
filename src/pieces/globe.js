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
    ctx.css('globe', '#oso-frames .osof-globe-spot{width:54px;height:59px}#oso-frames[data-mode=mobile] .osof-globe-spot{width:38px;height:43px}');
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
