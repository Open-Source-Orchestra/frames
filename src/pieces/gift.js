/* ── gift: the pennies-of-aloha card (v0.1.7, 27 Nov 2026 — Shaka: "finish the x402 pennies of aloha
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
  var FACILITATOR = 'https://facilitator.payai.network';
  var USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
  var PAYTO = '0x25965899f4600b3AA5362ee4f34be95E5E62c934';
  var BASE_CHAIN = 8453;
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
    F + ' .osof-gift-honest{margin-top:10px;color:#8b84ad;font:11.5px/1.5 system-ui,-apple-system,sans-serif}'
  ].join('\n');

  var built = null;   // one card per frame (per page)
  var owhP = null;    // the wallet connect module, once per page

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
    var d = ctx.panel({ id: 'gift', title: '🌊 ' + t('gift.title', 'pennies of aloha') });
    var amt = 0.01, ui = null, owh = null, mounting = false, pend = null;
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
    var amts = [['0.01', '1¢'], ['0.10', '10¢'], ['1', '$1']].map(function (pair, i) {
      return h('button', { type: 'button', class: 'osof-gift-amt', 'data-v': pair[0], 'aria-pressed': i === 0 ? 'true' : 'false', on: {
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
        var req = { scheme: 'exact', network: 'base', maxAmountRequired: A.authorization.value, resource: RESOURCE, description: 'pennies of aloha 🤙 — every drop keeps a door open', mimeType: 'application/json', payTo: PAYTO, maxTimeoutSeconds: 300, asset: USDC, extra: { name: 'USD Coin', version: '2' } };
        sayT('🌊 verifying with the facilitator…');
        var vr = await fetch(FACILITATOR + '/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ x402Version: 1, paymentPayload: payload, paymentRequirements: req }) });
        var vj = await vr.json();
        if (!vj.isValid) { sayT('⚠️ the facilitator did not bless it: ' + (vj.invalidReason || 'unknown') + ' — nothing left your wallet'); return; }
        sayT('🌊 settling on Base… (seconds)');
        var sr = await fetch(FACILITATOR + '/settle', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ x402Version: 1, paymentPayload: payload, paymentRequirements: req }) });
        var sj = await sr.json();
        if (sj.success) {
          // PAʻA finding SITE-2 (28 Nov 2026): the facilitator's `transaction` is NETWORK DATA — only a 64-hex hash may reach markup
          var txh = owh.txOf(sj.transaction);
          say('🌊🤙 <b>ALOHA RECEIVED.</b> mahalo nui!' + (txh ? ('<br>✦ recorded on-chain: <a href="https://basescan.org/tx/' + txh + '" target="_blank" rel="noopener">' + txh.slice(0, 14) + '…' + txh.slice(-8) + '</a> ✦') : ''));
          ctx.emit('gift:sent', { tx: txh, amount: amt });
        } else {
          sayT('⚠️ settlement hiccup: ' + (sj.error || sj.errorReason || 'unknown') + ' — nothing left your wallet without success');
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
        ui = O.connect({ surface: 'frames', usdc: USDC, payTo: PAYTO, chain: BASE_CHAIN, usd: function () { return amt; }, send: sendWith, t: t });
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
      h('a', { href: 'https://facilitator.payai.network', target: '_blank', rel: 'noopener' }, 'PayAI'), ').'));
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
    },
    // first INTENT on the 🌊 (hover / touch / focus): fetch the picker so it is ready by the tap — never on page load
    warm: function (ctx) { if (ctx) loadOWH(ctx).catch(function () {}); },
    // a wallet app opened this page from our own link (?osogift=frames:<usd>:…): the card opens itself, amount kept, starts ≤ $10
    autoOpen: function (ctx, item) {
      var v = ''; try { v = new URLSearchParams(window.location.search).get('osogift') || ''; } catch (e) {}
      if (v.indexOf('frames:') !== 0) return;
      loadOWH(ctx).then(function (O) {
        var p = O.pending('frames'); if (!p) return;
        if (!FRAMES.gift.open(ctx, item)) return;
        built.setAmt(p.usd); built.pend(p);
      }).catch(function () {});
    }
  };
})();
