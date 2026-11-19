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
