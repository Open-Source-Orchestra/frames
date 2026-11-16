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
