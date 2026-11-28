/* ── gift: the gifts-of-aloha card (v0.1.7 — first called "pennies of aloha", 27 Nov 2026 — Shaka: "finish the x402 pennies of aloha
 * button fix on all doors and frames") · v0.1.12 wallet connect (28 Nov 2026) ───────────────────────────────
 * A door rec with "gift": true (the 🌊 Blessing Pool, top-right on every door) keeps its href (SEO,
 * middle-click, no-JS) but a TAP opens this card instead of navigating: USDC on Base straight to the
 * ʻohana's agent-launch wallet (osoartist.eth = 0x2596…c934 — the ONE address, Shaka's law 23 Nov),
 * gas-free for the giver (EIP-3009 transferWithAuthorization, verified + settled by the PayAI
 * facilitator). Humans also get the Stripe · PayPal · Venmo rails and a link out to the Blessing Pool
 * page. Agents get the x402 instructions link. The card is a modal the visitor ASKED for — the NO COVERED
 * TEXT law does not fold it.
 *
 * v0.1.12 · THE WALLET CONNECT PICKER (Shaka on his phone, 28 Nov 2026: "pressing the wallet button on the x402 gift
 * rail doesn't work" · "super easy, like OpenSea, wallet to wallet, human to human or agent to agent"). A phone browser
 * has NO injected wallet, so "send with MetaMask" was a dead end on every phone. The card now mounts the ʻohana wallet
 * connect picker — lib/owh.js, fetched on the first INTENT (hover / touch / focus on the 🌊, or the tap itself), never on
 * page load: detected wallets first (EIP-6963) → on a phone the wallet APP opens by universal link and this card reopens
 * INSIDE it (?osogift=frames:…, starts by itself up to $10) → desktop QR → copy the address → "sign up in 10 s" hook.
 * The wallet signs the EIP-3009 typed data ITSELF (OWH.authorize): no ethers.js, no cdnjs. If lib/owh.js cannot load,
 * the card falls back to the by-hand way (copy the address) — never a dead end.
 * PAʻA SITE-2 (28 Nov 2026): the facilitator's reply is NETWORK DATA — only a 64-hex hash may reach markup or gift:sent.
 * Same flow lives standalone on unframed doors: shakaleikaumaka.com/assets/x402-tip.js (v2.1) and /assets/agent-gift-rail.js
 * (v1.2) — keep in sync (one OWH, three mounts).
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
  var FACILITATOR = 'https://gift-rail.opensourceorchestra.org/base';    // the gift rail's Base lane (CORS-enabled; pins payee/asset/amount). PayAI itself is server-to-server: browsers get 404 + no CORS → "Load failed" on Safari (28 Nov 2026)
  var USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
  var PAYTO = '0x25965899f4600b3AA5362ee4f34be95E5E62c934';
  var BASE_CHAIN = 8453;
  var DEFAULT_USD = 10;      // the preselected chip ($1 · $10 · $100 + custom) — Shaka 28 Nov 2026; "default $1" = flip this one number
  var RESOURCE = 'https://shakaleikaumaka.com/x402-bless.json';
  var F = '#oso-frames';
  var CSS = [
    F + ' .osof-gift-sub{color:#cdbce8;font:13px/1.5 system-ui,-apple-system,sans-serif;margin:0 0 12px}',
    F + ' .osof-gift-sub a{color:#7fd8a4}',
    F + ' .osof-gift-amts{display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 4px}',
    F + ' .osof-gift-amt{background:#0b0710;border:1px solid #4a3565;color:#f5efe6;border-radius:10px;padding:10px 14px;min-height:44px;font:14px system-ui,-apple-system,sans-serif;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:rgba(127,216,164,.28)}',
    F + ' .osof-gift-amt[aria-pressed="true"]{border-color:#7fd8a4;color:#7fd8a4}',
    F + ' .osof-gift-custom{background:#0b0710;border:1px solid #4a3565;color:#f5efe6;border-radius:10px;padding:8px 10px;min-height:44px;font:14px system-ui,-apple-system,sans-serif;width:96px}',
    F + ' .osof-gift-slot{min-height:20px;color:#9d97c9;font:13px/1.5 system-ui,-apple-system,sans-serif}',
    F + ' .osof-gift-st{color:#9d97c9;font:13px/1.5 system-ui,-apple-system,sans-serif;margin-top:12px;word-break:break-word}',
    F + ' .osof-gift-st a{color:#7fd8a4}',
    F + ' .osof-gift-st:empty{display:none}',
    F + ' .osof-gift-fb{margin-top:14px;border-top:1px solid #2c2140;padding-top:12px}',
    F + ' .osof-gift-addr{background:#0b0710;border:1px solid #4a3565;border-radius:10px;padding:8px 10px;font:12px ui-monospace,monospace;word-break:break-all;color:#cfc6e8}',
    F + ' .osof-gift-copy{background:#1c1230;color:#7fd8a4;border:1px solid #7fd8a4;border-radius:10px;padding:10px 14px;min-height:44px;font:13px system-ui,-apple-system,sans-serif;cursor:pointer;margin-top:8px;touch-action:manipulation}',
    F + ' .osof-gift-rails{margin-top:14px;border-top:1px solid #2c2140;padding-top:10px;color:#cdbce8;font:13px/1.8 system-ui,-apple-system,sans-serif}',
    F + ' .osof-gift-rails a{color:#fbe2a0}',
    F + ' .osof-gift-honest{margin-top:10px;color:#8b84ad;font:11.5px/1.5 system-ui,-apple-system,sans-serif}',
    F + ' [data-osof-busy]{opacity:.65;transition:opacity .2s ease}'                      // v0.1.18: the tapped 🌊 while the Fountain is on its way (≤ 4 s); no motion, no layout change
  ].join('\n');

  var built = null;   // one card per frame (per page)
  var owhP = null;    // the wallet connect module, once per page

  /* ── v0.1.18 · THE UNIVERSE FOUNTAIN (Shaka, 28 Nov 2026: "not a small magnet but a universe fountain of blessings" · "lets ship and do these") ──
   * A tap on the 🌊 now opens the Fountain — one big calm sheet (Apple Pay · Google Pay · card first, Venmo + PayPal prefilled, a crypto wallet on
   * 12 chains with Base gas-free, stage QR) — lazy-loaded from lib/fountain.js beside frames.js (ctx.base; on every door of ours that is
   * https://frames.opensourceorchestra.org/lib/fountain.js — the LAUNCHER.md contract). The Fountain pins osoartist.eth in code and reads its kill
   * switch from <frames origin>/fountain-config.json. The card below stays as the EXACT fallback: a 404, a block, a 4-s timeout, a file without
   * OSOFountain → the card opens as before. The first copy of the module on a page wins (shakafans.com's root mounts it inline), so a page that
   * already carries window.OSOFountain is never given a second script, and a page with an inline Fountain is scrolled to it instead of a sheet. */
  var OFN_TIMEOUT = 4000;
  var ofnP = null;        // the Fountain module, once per page
  var ofnOpening = false; // single flight: a second tap while the script is in flight does nothing
  var ofnBridged = false;
  function hasFountain() { return !!(window.OSOFountain && typeof window.OSOFountain.open === 'function'); }
  function loadFountain(ctx) {
    if (hasFountain()) return Promise.resolve(window.OSOFountain);
    if (!ofnP) {
      ofnP = new Promise(function (res, rej) {
        var done = false, tm = null, s = document.createElement('script');
        function fin(err) { if (done) return; done = true; clearTimeout(tm); if (err) { ofnP = null; rej(err); } else res(window.OSOFountain); }
        tm = setTimeout(function () { fin(new Error('fountain timeout')); }, OFN_TIMEOUT);
        try { s.src = new URL('lib/fountain.js', ctx.base || document.baseURI).href; } catch (e) { fin(e); return; }
        s.async = true;
        s.onload = function () { fin(hasFountain() ? null : new Error('fountain missing')); };
        s.onerror = function () { fin(new Error('fountain failed to load')); };
        document.head.appendChild(s);
      });
    }
    return ofnP;
  }
  // the element focus returns to when the Fountain closes: the tapped 🌊 (rail door) — or, on a phone, the 🎻 button once its sheet has closed
  function vis(el) { return !!el && el.isConnected && el.getClientRects().length > 0; }
  function fountainAnchor(ctx, item) {
    var root = document.getElementById('oso-frames'), a = document.activeElement;
    if (root && a && a !== document.body && root.contains(a) && vis(a)) return a;
    var href = item && item.href ? String(item.href) : '';
    var all = root ? root.querySelectorAll('a[aria-haspopup="dialog"]') : [];
    for (var i = 0; i < all.length; i++) if (vis(all[i]) && (!href || all[i].getAttribute('href') === href)) return all[i];
    var sb = root && root.querySelector('.osof-sheetbtn'); return vis(sb) ? sb : null;
  }
  // the phone 🎻 sheet is a frame dialog: it steps aside for the Fountain exactly as it does for the card (never a sheet under a sheet)
  function closeSheet(ctx) {
    var el = document.getElementById('osof-dlg-sheet'); if (!el || el.hidden) return;
    try { var d = ctx.panel({ id: 'sheet' }); if (d && d.isOpen && d.isOpen()) d.close(); } catch (e) {}
  }
  function bridge(ctx) {                                    // the Fountain's gift event → the frame's gift:sent, once per page (tx = network data: 64-hex or nothing)
    if (ofnBridged) return; ofnBridged = true;
    window.addEventListener('fountain:gift', function (e) {
      var d = (e && e.detail) || {}; var tx = /^0x[0-9a-fA-F]{64}$/.test(String(d.tx || '')) ? String(d.tx) : null;
      ctx.emit('gift:sent', { tx: tx, amount: d.usd, chainId: d.chainId, route: 'fountain' });
    });
  }
  function openFountain(ctx, item, from, pend) {           // resolves true when the Fountain is on screen (or already was); rejects → the caller opens the card
    return loadFountain(ctx).then(function (F) {
      bridge(ctx);
      if (F.isOpen && F.isOpen()) return true;
      var inline = document.querySelector('.ofn.ofn-page');  // a page that mounts its own Fountain: go there, never a second one on top
      if (inline && !pend) { try { inline.scrollIntoView({ behavior: ctx.reduced ? 'auto' : 'smooth', block: 'start' }); var f = inline.querySelector('[data-focus]'); if (f) f.focus({ preventScroll: true }); } catch (e) {} return true; }
      closeSheet(ctx);
      if (!vis(from)) from = fountainAnchor(ctx, item);     // the tapped tile went away with the sheet → focus will return to the 🎻 button (or the rail door)
      var o = { surface: 'frames' }; if (from) o.from = from; if (pend) o.pending = pend;
      F.open(o);
      return true;
    });
  }

  // lib/owh.js lives next to frames.js (ctx.base = the directory of this script). It sets window.OWH only if absent.
  function loadOWH(ctx) {
    if (window.OWH && window.OWH.connect) return Promise.resolve(window.OWH);
    if (!owhP) {
      owhP = new Promise(function (res, rej) {
        var s = document.createElement('script');
        try { s.src = new URL('lib/owh.js', ctx.base || document.baseURI).href; } catch (e) { rej(e); return; }
        s.async = true;
        s.onload = function () { if (window.OWH && window.OWH.connect) res(window.OWH); else { owhP = null; rej(new Error('owh missing')); } };
        s.onerror = function () { owhP = null; rej(new Error('owh failed to load')); };
        document.head.appendChild(s);
      });
    }
    return owhP;
  }

  function build(ctx) {
    var h = ctx.h, t = ctx.t;
    var d = ctx.panel({ id: 'gift', title: '🌊 ' + t('gift.title', 'gifts of aloha') });
    var amt = DEFAULT_USD, ui = null, owh = null, mounting = false, pend = null;
    var st = h('div', { class: 'osof-gift-st', role: 'status', 'aria-live': 'polite' });
    var slot = h('div', { class: 'osof-gift-slot' });
    var fb = h('div', { class: 'osof-gift-fb', hidden: true });      // the by-hand way — only if the picker could not load
    var custom = h('input', { class: 'osof-gift-custom', type: 'number', min: '0.001', step: '0.001', inputmode: 'decimal', placeholder: t('gift.custom', 'custom $'), 'aria-label': t('gift.custom', 'custom amount in dollars') });
    function say(m) { st.innerHTML = m || ''; }     // OUR OWN markup only: never interpolate a value that came from the network (the tx hash is validated by OWH.txOf first)
    function sayT(m) { st.textContent = m; }
    function chips() { return d.body.querySelectorAll('.osof-gift-amt'); }
    function setAmt(v) {                                  // one place that changes the amount: chips, custom box, and every wallet link
      amt = v; var hit = false;
      chips().forEach(function (x) { var m = Math.abs(parseFloat(x.getAttribute('data-v')) - v) < 1e-9; x.setAttribute('aria-pressed', m ? 'true' : 'false'); if (m) hit = true; });
      custom.value = hit ? '' : String(v);
      if (ui) ui.refresh();
    }
    var amts = [['1', '$1'], ['10', '$10'], ['100', '$100']].map(function (pair) {
      return h('button', { type: 'button', class: 'osof-gift-amt', 'data-v': pair[0], 'aria-pressed': parseFloat(pair[0]) === DEFAULT_USD ? 'true' : 'false', on: {
        click: function () { setAmt(parseFloat(pair[0])); } } }, pair[1]);
    });
    custom.addEventListener('input', function () {
      var v = parseFloat(custom.value);
      if (v > 0) { amt = v; chips().forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); if (ui) ui.refresh(); }
    });

    // ── the by-hand fallback (only shown when the picker could not load) ──
    var addr = h('div', { class: 'osof-gift-addr' }, PAYTO);
    var copy = h('button', { type: 'button', class: 'osof-gift-copy', on: {
      click: function () {
        function okC() { copy.textContent = t('gift.copied', '✅ copied — mahalo!'); setTimeout(function () { copy.textContent = t('gift.copy', '📋 copy address'); }, 2500); }
        function fbC() { var ta = document.createElement('textarea'); ta.value = PAYTO; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); okC(); } catch (e) {} document.body.removeChild(ta); }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(PAYTO).then(okC, fbC); else fbC();
      } } }, t('gift.copy', '📋 copy address'));
    fb.appendChild(h('div', { class: 'osof-gift-sub', style: 'margin-bottom:6px' }, t('gift.byhand', 'send USDC on Base by hand to the ʻohana wallet:')));
    fb.appendChild(addr); fb.appendChild(copy);

    // ── the money flow: the CHOSEN wallet signs EIP-3009 itself (no ethers), PayAI verifies + settles ──
    async function sendWith(wp, info) {
      try {
        if (!wp) return;
        if (!(amt > 0)) { sayT('⚠️ pick an amount above zero'); return; }
        if (ui) ui.setBusy(true);
        var A = await owh.authorize(wp, { usd: amt, payTo: PAYTO, usdc: USDC, chain: BASE_CHAIN, step: function (w) {
          sayT(w === 'connect' ? '🦊 connecting ' + ((info && info.name) || 'your wallet') + '…' : w === 'switch' ? '🌉 switching to Base…' : '✍️ sign the aloha (EIP-3009 — gas-free for you)…'); } });
        var payload = { x402Version: 1, scheme: 'exact', network: 'base', payload: { signature: A.signature, authorization: A.authorization } };
        var req = { scheme: 'exact', network: 'base', maxAmountRequired: A.authorization.value, resource: RESOURCE, description: 'gifts of aloha 🤙 — every drop keeps a door open', mimeType: 'application/json', payTo: PAYTO, maxTimeoutSeconds: 300, asset: USDC, extra: { name: 'USD Coin', version: '2' } };
        var body = { x402Version: 1, paymentPayload: payload, paymentRequirements: req };
        sayT('🌊 verifying with the gift rail…');
        var V = await owh.post(FACILITATOR, '/verify', body);
        if (V.net) { sayT(V.timeout ? owh.SLOW : owh.NET); ui.fallback(); return; }
        var vj = V.json;
        if (!vj.isValid) { var vc = vj.invalidReason || vj.invalidMessage || ''; sayT('⚠️ ' + owh.why(vc) + ' — nothing left your wallet'); if (owh.rest(vc)) ui.fallback(); return; }
        sayT('🌊 settling on Base… (seconds)');
        var S = await owh.post(FACILITATOR, '/settle', body);
        if (S.net) { sayT(owh.NETSETTLE); ui.fallback(); return; }
        var sj = S.json;
        if (sj.success) {
          // PAʻA finding SITE-2 (28 Nov 2026): the facilitator's `transaction` is NETWORK DATA — only a 64-hex hash may reach markup
          var txh = owh.txOf(sj.transaction);
          say('🌊🤙 <b>ALOHA RECEIVED.</b> mahalo nui!' + (txh ? ('<br>✦ recorded on-chain: <a href="https://basescan.org/tx/' + txh + '" target="_blank" rel="noopener">' + txh.slice(0, 14) + '…' + txh.slice(-8) + '</a> ✦') : ''));
          ctx.emit('gift:sent', { tx: txh, amount: amt });
        } else {
          var sc = sj.errorReason || sj.errorMessage || sj.error || '';
          sayT(/settlement_pending/.test(sc) ? owh.why(sc) : '⚠️ ' + owh.why(sc) + ' — nothing left your wallet without success'); if (owh.rest(sc)) ui.fallback();
        }
      } catch (e) {
        if (e && e.code === 4001) { sayT('🦊 declined for now — the aloha waits patiently 🌺'); }
        else if (/insufficient/i.test(String(e && e.message || e))) { sayT('⚠️ not enough USDC on Base in this wallet'); }
        else { sayT('⚠️ hiccup: ' + ((e && e.message) || e)); }
      } finally { if (ui) ui.setBusy(false); }
    }

    // ── the picker: fetched lazily (first intent or tap); a failure leaves the by-hand way, never a dead end ──
    function mount() {
      if (ui || mounting) return;
      mounting = true; slot.textContent = '…';
      loadOWH(ctx).then(function (O) {
        owh = O;
        ui = O.connect({ surface: 'frames', usdc: USDC, payTo: PAYTO, payToName: 'osoartist.eth', safetyUrl: 'https://shakaleikaumaka.com/gift-safety/', chain: BASE_CHAIN, usd: function () { return amt; }, send: sendWith, t: t,
          onPlain: function (e) { ctx.emit('gift:sent', { tx: e.tx, amount: e.amount, route: 'plain' }); } });     // the plain 🪙 send (a normal USDC transfer) is a gift too
        slot.textContent = ''; slot.appendChild(ui.el);
        mounting = false; ui.refresh();
        if (pend) { var p = pend; pend = null; setAmt(p.usd); ui.autostart(p); }
      }).catch(function () {
        mounting = false; slot.textContent = ''; fb.hidden = false;
        sayT(t('gift.nopicker', '🌺 the wallet picker could not load — send USDC on Base by hand to the ʻohana wallet below'));
      });
    }

    d.body.appendChild(h('div', { class: 'osof-gift-sub' },
      'USDC on ', h('b', {}, 'Base'), ' straight to the ʻohana’s agent-launch wallet — gas-free for you (EIP-3009; the pool settles it via ',
      h('a', { href: 'https://facilitator.payai.network', target: '_blank', rel: 'noopener' }, 'PayAI'), '), or a plain transfer from your own wallet.'));
    d.body.appendChild(h('div', { class: 'osof-gift-amts' }, amts, custom));
    d.body.appendChild(slot);
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
      reset: function () { sayT(''); fb.hidden = true; if (ui) { ui.say(''); ui.setBusy(false); ui.refresh(); } else mount(); },
      setAmt: setAmt,
      pend: function (p) { pend = p; }
    };
  }

  // ── the gifts-of-aloha CARD (v0.1.7 → v0.1.17 behaviour, unchanged) — since v0.1.18 the exact fallback of the Fountain ──
  function openCard(ctx, item) {
    ctx.css('gift', CSS);
    if (!built) built = build(ctx);
    built.sync(item || ctx.item);
    built.reset();
    ctx.panel({ id: 'gift' }).open();
    ctx.emit('gift:open', { id: item && item.id, via: 'card' });
    return true;
  }
  // a wallet app opened this page from our own link (?osogift=frames:<usd>:…) and the Fountain could not load: the card opens itself, amount kept, starts ≤ $10
  function autoOpenCard(ctx, item) {
    loadOWH(ctx).then(function (O) {
      var p = O.pending('frames'); if (!p) return;
      if (!openCard(ctx, item)) return;
      built.setAmt(p.usd); built.pend(p);
    }).catch(function () {});
  }
  function hasReturn() { return /[?&]osogift=frames:/.test(window.location.search); }

  FRAMES.gift = {
    // a TAP on the 🌊 (rail door or sheet tile): the Fountain, lazily — or the card, exactly as before. Always true: the tap never navigates.
    open: function (ctx, item) {
      if (!ctx || typeof ctx.panel !== 'function') return false;
      if (hasFountain() && window.OSOFountain.isOpen && window.OSOFountain.isOpen()) return true;   // one sheet, never two
      if (ofnOpening) return true;                                                                 // the script is on its way (single flight)
      var from = fountainAnchor(ctx, item);
      ofnOpening = true; if (from) { from.setAttribute('aria-busy', 'true'); from.setAttribute('data-osof-busy', ''); }
      function settle() { ofnOpening = false; if (from) { from.removeAttribute('aria-busy'); from.removeAttribute('data-osof-busy'); } }
      ctx.css('gift', CSS);
      openFountain(ctx, item, from, null).then(function () { settle(); ctx.emit('gift:open', { id: item && item.id, via: 'fountain' }); },
        function () { settle(); openCard(ctx, item); });
      return true;
    },
    // first INTENT on the 🌊 (hover / touch / focus): fetch the Fountain and the picker so the tap feels instant — never on page load
    warm: function (ctx) { if (!ctx) return; loadFountain(ctx).catch(function () {}); loadOWH(ctx).catch(function () {}); },
    // RETURN (mandatory for every launcher — LAUNCHER.md): back from a wallet app as ?osogift=frames:<usd>:c<chainId>:go → the Fountain opens at the
    // wallet step with pending:true (it reads + cleans the URL itself; ≤ $10 auto-starts). If it cannot load, the card handles the way back as before.
    autoOpen: function (ctx, item) {
      if (!ctx || !hasReturn()) return;
      var from = fountainAnchor(ctx, item);
      openFountain(ctx, item, from, true).then(function () { ctx.emit('gift:open', { id: item && item.id, via: 'fountain', pending: true }); },
        function () { if (hasReturn()) autoOpenCard(ctx, item); });
    }
  };
})();
