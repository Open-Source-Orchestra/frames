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
      // NO COVERED TEXT LAW (phones): the core folds the dock to the tiny 📻 while words run under it — session only, never
      // while a song plays (the visitor pressed ▶), never undoing the visitor's own ✕ (remembered mini)
      fold: function (v) { if (ui.get(miniKey) === true) return; if (v && audio && !audio.paused) return; el.setAttribute('data-mini', v ? '1' : '0'); }
    };
  });
}
