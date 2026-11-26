/* ── gift: the pennies-of-aloha card (v0.1.7, 27 Nov 2026 — Shaka: "finish the x402 pennies of aloha
 * button fix on all doors and frames") ──────────────────────────────────────────────────────────────
 * A door rec with "gift": true (the 🌊 Blessing Pool, top-right on every door) keeps its href (SEO,
 * middle-click, no-JS) but a TAP opens this card instead of navigating: USDC on Base straight to the
 * ʻohana's agent-launch wallet (osoartist.eth = 0x2596…c934 — the ONE address, Shaka's law 23 Nov),
 * gas-free for the giver (EIP-3009 transferWithAuthorization, verified + settled by the PayAI
 * facilitator). No fox → copy the address by hand; humans also get the Stripe · PayPal · Venmo rails
 * and a link out to the Blessing Pool page. Agents get the x402 instructions link.
 * The card is a modal the visitor ASKED for — the NO COVERED TEXT law does not fold it.
 * Same flow lives standalone on unframed doors: shakaleikaumaka.com/assets/x402-tip.js (v2.0) — keep in sync.
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
  var FACILITATOR = 'https://facilitator.payai.network';
  var USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
  var PAYTO = '0x25965899f4600b3AA5362ee4f34be95E5E62c934';
  var BASE_CHAIN = 8453;
  var RESOURCE = 'https://shakaleikaumaka.com/x402-bless.json';
  var ETHERS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.4/ethers.umd.min.js';
  var F = '#oso-frames';
  var CSS = [
    F + ' .osof-gift-sub{color:#cdbce8;font:13px/1.5 system-ui,-apple-system,sans-serif;margin:0 0 12px}',
    F + ' .osof-gift-sub a{color:#7fd8a4}',
    F + ' .osof-gift-amts{display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 12px}',
    F + ' .osof-gift-amt{background:#0b0710;border:1px solid #4a3565;color:#f5efe6;border-radius:10px;padding:8px 14px;font:14px system-ui,-apple-system,sans-serif;cursor:pointer}',
    F + ' .osof-gift-amt[aria-pressed="true"]{border-color:#7fd8a4;color:#7fd8a4}',
    F + ' .osof-gift-custom{background:#0b0710;border:1px solid #4a3565;color:#f5efe6;border-radius:10px;padding:8px 10px;font:14px system-ui,-apple-system,sans-serif;width:96px}',
    F + ' .osof-gift-send{width:100%;background:linear-gradient(90deg,#0052ff,#7c4ba8);color:#fff;border:none;border-radius:12px;padding:12px;font:700 15px system-ui,-apple-system,sans-serif;cursor:pointer;margin-top:2px}',
    F + ' .osof-gift-send:disabled{opacity:.5;cursor:wait}',
    F + ' .osof-gift-st{color:#9d97c9;font:13px/1.5 system-ui,-apple-system,sans-serif;margin-top:12px;word-break:break-word}',
    F + ' .osof-gift-st a{color:#7fd8a4}',
    F + ' .osof-gift-fb{margin-top:14px;border-top:1px solid #2c2140;padding-top:12px}',
    F + ' .osof-gift-addr{background:#0b0710;border:1px solid #4a3565;border-radius:10px;padding:8px 10px;font:12px ui-monospace,monospace;word-break:break-all;color:#cfc6e8}',
    F + ' .osof-gift-copy{background:#1c1230;color:#7fd8a4;border:1px solid #7fd8a4;border-radius:10px;padding:8px 14px;font:13px system-ui,-apple-system,sans-serif;cursor:pointer;margin-top:8px}',
    F + ' .osof-gift-rails{margin-top:14px;border-top:1px solid #2c2140;padding-top:10px;color:#cdbce8;font:13px/1.8 system-ui,-apple-system,sans-serif}',
    F + ' .osof-gift-rails a{color:#fbe2a0}',
    F + ' .osof-gift-honest{margin-top:10px;color:#8b84ad;font:11.5px/1.5 system-ui,-apple-system,sans-serif}'
  ].join('\n');

  var built = null;   // one card per frame (per page)

  function ensureEthers() {
    if (window.ethers) return Promise.resolve();
    if (!window.__osofGiftEthersP) {
      window.__osofGiftEthersP = new Promise(function (res, rej) {
        var s = document.createElement('script');
        s.src = ETHERS_URL;
        s.onload = res;
        s.onerror = function () { rej(new Error('could not load ethers from cdnjs')); };
        document.head.appendChild(s);
      });
    }
    return window.__osofGiftEthersP;
  }

  function build(ctx) {
    var h = ctx.h, t = ctx.t;
    var d = ctx.panel({ id: 'gift', title: '🌊 ' + t('gift.title', 'pennies of aloha') });
    var amt = 0.01;
    var st = h('div', { class: 'osof-gift-st', role: 'status', 'aria-live': 'polite' });
    var fb = h('div', { class: 'osof-gift-fb', hidden: true });
    var custom = h('input', { class: 'osof-gift-custom', type: 'number', min: '0.001', step: '0.001', placeholder: t('gift.custom', 'custom $'), 'aria-label': t('gift.custom', 'custom amount in dollars') });
    var send = h('button', { type: 'button', class: 'osof-gift-send' }, t('gift.send', '🦊 send with MetaMask'));
    function say(m) { st.innerHTML = m || ''; }     // trusted, our own markup only (tx hash is hex)
    function sayT(m) { st.textContent = m; }
    var amts = [['0.01', '1¢'], ['0.10', '10¢'], ['1', '$1']].map(function (pair, i) {
      return h('button', { type: 'button', class: 'osof-gift-amt', 'data-v': pair[0], 'aria-pressed': i === 0 ? 'true' : 'false', on: {
        click: function (e) {
          d.body.querySelectorAll('.osof-gift-amt').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          e.currentTarget.setAttribute('aria-pressed', 'true');
          amt = parseFloat(pair[0]); custom.value = '';
        } } }, pair[1]);
    });
    custom.addEventListener('input', function () {
      var v = parseFloat(custom.value);
      if (v > 0) { amt = v; d.body.querySelectorAll('.osof-gift-amt').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); }
    });

    var addr = h('div', { class: 'osof-gift-addr' }, PAYTO);
    var copy = h('button', { type: 'button', class: 'osof-gift-copy', on: {
      click: function () {
        function okC() { copy.textContent = t('gift.copied', '✅ copied — mahalo!'); setTimeout(function () { copy.textContent = t('gift.copy', '📋 copy address'); }, 2500); }
        function fbC() { var ta = document.createElement('textarea'); ta.value = PAYTO; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); okC(); } catch (e) {} document.body.removeChild(ta); }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(PAYTO).then(okC, fbC); else fbC();
      } } }, t('gift.copy', '📋 copy address'));
    fb.appendChild(h('div', { class: 'osof-gift-sub', style: 'margin-bottom:6px' }, t('gift.nofox', 'no fox? no worries — send USDC on Base by hand to the ʻohana wallet:')));
    fb.appendChild(addr); fb.appendChild(copy);

    send.addEventListener('click', async function () {
      try {
        if (!window.ethereum) { sayT(t('gift.nowallet', '🦊 no wallet found — install MetaMask (or any EIP-1193 fox), or use the address below 🌺')); fb.hidden = false; return; }
        if (!(amt > 0)) { sayT('⚠️ pick an amount above zero'); return; }
        send.disabled = true;
        sayT('⏳ loading the signing library…'); await ensureEthers();
        sayT('🦊 connecting the fox…');
        var provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        var net = await provider.getNetwork();
        if (Number(net.chainId) !== BASE_CHAIN) {
          sayT('🌉 switching to Base…');
          try { await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] }); }
          catch (e) { await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: '0x2105', chainName: 'Base', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://mainnet.base.org'], blockExplorerUrls: ['https://basescan.org'] }] }); }
          provider = new ethers.BrowserProvider(window.ethereum);
        }
        var signer = await provider.getSigner();
        var from = await signer.getAddress();
        var value = BigInt(Math.round(amt * 1e6));
        var now = Math.floor(Date.now() / 1000);
        var nonce = ethers.hexlify(ethers.randomBytes(32));
        var auth = { from: from, to: PAYTO, value: value, validAfter: 0, validBefore: now + 300, nonce: nonce };
        sayT('✍️ sign the aloha (EIP-3009 — gas-free for you)…');
        var sig = await signer.signTypedData(
          { name: 'USD Coin', version: '2', chainId: BASE_CHAIN, verifyingContract: USDC },
          { TransferWithAuthorization: [
            { name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'value', type: 'uint256' },
            { name: 'validAfter', type: 'uint256' }, { name: 'validBefore', type: 'uint256' }, { name: 'nonce', type: 'bytes32' }] },
          auth);
        var payload = { x402Version: 1, scheme: 'exact', network: 'base', payload: { signature: sig, authorization: { from: auth.from, to: auth.to, value: auth.value.toString(), validAfter: String(auth.validAfter), validBefore: String(auth.validBefore), nonce: auth.nonce } } };
        var req = { scheme: 'exact', network: 'base', maxAmountRequired: value.toString(), resource: RESOURCE, description: 'pennies of aloha 🤙 — every drop keeps a door open', mimeType: 'application/json', payTo: PAYTO, maxTimeoutSeconds: 300, asset: USDC, extra: { name: 'USD Coin', version: '2' } };
        sayT('🌊 verifying with the facilitator…');
        var vr = await fetch(FACILITATOR + '/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ x402Version: 1, paymentPayload: payload, paymentRequirements: req }) });
        var vj = await vr.json();
        if (!vj.isValid) { sayT('⚠️ the facilitator did not bless it: ' + (vj.invalidReason || 'unknown') + ' — nothing left your wallet'); send.disabled = false; return; }
        sayT('🌊 settling on Base… (seconds)');
        var sr = await fetch(FACILITATOR + '/settle', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ x402Version: 1, paymentPayload: payload, paymentRequirements: req }) });
        var sj = await sr.json();
        if (sj.success) {
          say('🌊🤙 <b>ALOHA RECEIVED.</b> mahalo nui!' + (sj.transaction ? ('<br>✦ on-chain forever: <a href="https://basescan.org/tx/' + sj.transaction + '" target="_blank" rel="noopener">' + sj.transaction.slice(0, 14) + '…' + sj.transaction.slice(-8) + '</a> ✦') : ''));
          ctx.emit('gift:sent', { tx: sj.transaction || null, amount: amt });
        } else {
          sayT('⚠️ settlement hiccup: ' + (sj.error || sj.errorReason || 'unknown') + ' — nothing left your wallet without success');
        }
      } catch (e) {
        if (e && e.code === 4001) { sayT('🦊 declined for now — the aloha waits patiently 🌺'); }
        else if (/insufficient/i.test(String(e && e.message || e))) { sayT('⚠️ not enough USDC on Base in this wallet'); }
        else { sayT('⚠️ hiccup: ' + ((e && e.message) || e)); }
      }
      send.disabled = false;
    });

    d.body.appendChild(h('div', { class: 'osof-gift-sub' },
      'USDC on ', h('b', {}, 'Base'), ' straight to the ʻohana’s agent-launch wallet — gas-free for you (EIP-3009; the pool settles it via ',
      h('a', { href: 'https://facilitator.payai.network', target: '_blank', rel: 'noopener' }, 'PayAI'), ').'));
    d.body.appendChild(h('div', { class: 'osof-gift-amts' }, amts, custom));
    d.body.appendChild(send);
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
      reset: function () { sayT(''); fb.hidden = true; send.disabled = false; }
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
    }
  };
})();
