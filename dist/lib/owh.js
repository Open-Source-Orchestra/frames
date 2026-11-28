/*! owh · ʻohana wallet connect v1.0 · standalone lazy module of Open Source Orchestra Frames v0.1.17
 *  SPDX-License-Identifier: GPL-3.0-or-later · Built by Open Source Orchestra: Shaka Lei Kaumaka & the AI ʻohana (https://opensourceorchestra.org)
 *  Source of this exact file: https://github.com/Open-Source-Orchestra/frames → src/lib/owh.js (sets window.OWH only if absent) */
(function(){'use strict';if(window.OWH)return;
/* ── owh · ʻohana wallet connect v1.0 (28 Nov 2026) ───────────────────────────────────────────────────────────
 * WHY: a phone browser has NO injected wallet (window.ethereum exists only inside a wallet app's OWN browser), so the
 * "send with MetaMask" button of the x402 gift rail was a dead end on every phone ("pressing the wallet button on the
 * x402 gift rail doesn't work" — Shaka, 28 Nov 2026 14:13 BKK; then: "like OpenSea, super easy to connect your wallet",
 * "wallet to wallet, human to human or agent to agent").
 * WHAT — an OpenSea-style connect picker, ≤ 2 taps from the 🌊 to the wallet's own approve screen:
 *   1 · DETECTED wallets first (EIP-6963 announcements + legacy window.ethereum) — one found = one big button, more = a list;
 *   2 · on a PHONE with no wallet in the browser: one-tap universal links that open the wallet APP and come BACK to this page
 *       (real <a href>: the OS opens the app on the tap; nothing is fetched until the visitor taps):
 *         MetaMask  https://link.metamask.io/dapp/<host/path?query>      docs.metamask.io → use-deeplinks (verified 28 Nov 2026)
 *         Coinbase  https://go.cb-w.com/dapp?cb_url=<url>                Coinbase Wallet SDK → deep-link doc
 *         Phantom   https://phantom.com/ul/browse/<url>?ref=<origin>     docs.phantom.com → deeplinks → browse (phantom.app now 301s to phantom.com, whose iOS app-site-association registers /ul/*)
 *         Trust     https://link.trustwallet.com/open_url?coin_id=8453&url=<url> (Android) · …/send?asset=c8453_t<USDC>&address=&amount= (iOS has no dapp browser)
 *         other     ethereum:<USDC>@8453/transfer?address=<to>&uint256=<units>      (EIP-681 prefilled send)
 *       the page reopens INSIDE the wallet with ?osogift=<surface>:<usd>[:<rail>]:go → the card opens by itself and starts;
 *   3 · on a desktop with no wallet: a QR to scan with the phone's wallet (QR library fetched only when shown) + install links;
 *   4 · copy the address, always;  5 · "no wallet yet? sign up in 10 s" = a HOOK: window.OWH_SIGNUP = { label?, sub?, href? | open(api) }
 *       (absent → no row; open(api) gets {usd, payTo, usdc, chain, use(provider, info)} and may hand back an EIP-1193 provider).
 *   + authorize(provider, o): connect → be on Base → ONE EIP-3009 transferWithAuthorization signed by the wallet itself
 *     (eth_signTypedData_v4, gas-free for the giver) — no ethers.js, no CDN (the 506 KB signing library was the slowest tap on a phone).
 * No tracking, no storage, no third-party script on load, no key in the page. The three copies of this block (frames gift
 * piece, x402-tip.js, agent-gift-rail.js) are byte-identical: tools/inject-owh.py is the only writer between the markers.
 * Built by Open Source Orchestra: Shaka Lei Kaumaka & the AI ʻohana (https://opensourceorchestra.org) · SPDX-License-Identifier: GPL-3.0-or-later */
var OWH = (function () {
  var W = window, D = document, N = W.navigator || {};
  var UA = N.userAgent || '';
  var IOS = /iPad|iPhone|iPod/.test(UA) || (N.platform === 'MacIntel' && N.maxTouchPoints > 1);   // iPadOS Safari says "Mac"
  var ANDROID = /Android/i.test(UA);
  var PARAM = 'osogift';
  var DEFAULT_USD = 10;                                   // the preselected amount of every gift card (chips $1 · $10 · $100 + a custom box); a garbage ?osogift amount falls back to it. Hosts keep their own DEFAULT_USD in step.
  var AUTOSTART_MAX = 10;                                 // USD: a link can open the card at any amount, but only starts the wallet prompt up to this ($1 and $10 start; $100 waits for a tap)
  var LIB = 'https://frames.opensourceorchestra.org/lib/';                           // the lazy files live beside lib/owh.js (a self-hosting fork serves its own)
  try { var CS = D.currentScript; if (CS && CS.src && /\/lib\/owh(\.min)?\.js(\?|$)/.test(CS.src)) LIB = CS.src.replace(/[^\/]*(\?.*)?$/, ''); } catch (e) {}
  var QR_URL = LIB + 'owh-qr.min.js';
  var HOOK_URL = LIB + 'owh-signup.min.js';                // the passkey 'sign up in 10 s' row (window.OWH_SIGNUP), lazy
  function loadHook(done) {                               // once per page (shared by every copy of owh); each picker re-renders when it lands
    if (!W.__owhHookP) W.__owhHookP = new Promise(function (ok) { var s = D.createElement('script'); s.src = HOOK_URL; s.async = true; s.onload = s.onerror = function () { ok(); }; D.head.appendChild(s); });
    W.__owhHookP.then(function () { if (W.OWH_SIGNUP) done(); });
  }

  function nameOf(p) {                                    // which wallet is this provider? (the others also claim isMetaMask → they go first)
    if (!p) return '';
    if (p.isCoinbaseWallet || p.isCoinbaseBrowser) return 'Coinbase Wallet';
    if (p.isPhantom) return 'Phantom';
    if (p.isTrust || p.isTrustWallet) return 'Trust Wallet';
    if (p.isRainbow) return 'Rainbow';
    if (p.isRabby) return 'Rabby';
    if (p.isMetaMask) return 'MetaMask';
    return 'your wallet';
  }
  function env() { return { mobile: IOS || ANDROID, ios: IOS, android: ANDROID, injected: !!W.ethereum, wallet: nameOf(W.ethereum) }; }
  function units(usd) { return String(Math.round(usd * 1e6)); }          // USDC has 6 decimals
  function again(surface, usd, rail) {                                   // this very page, asking its gift card to reopen inside the wallet
    try { var u = new URL(W.location.href); u.searchParams.set(PARAM, surface + ':' + usd + ':' + (rail || '') + ':go'); return u.toString(); }
    catch (e) { return W.location.href; }
  }
  function links(o) {                                                    // o: {surface, usd, rail?, usdc, payTo, chain}
    var url = again(o.surface, o.usd, o.rail), bare = url.replace(/^https?:\/\//, '');
    return {
      url: url,
      metamask: 'https://link.metamask.io/dapp/' + bare,
      coinbase: 'https://go.cb-w.com/dapp?cb_url=' + encodeURIComponent(url),
      phantom: 'https://phantom.com/ul/browse/' + encodeURIComponent(url) + '?ref=' + encodeURIComponent(W.location.origin),
      trust: ANDROID ? 'https://link.trustwallet.com/open_url?coin_id=' + o.chain + '&url=' + encodeURIComponent(url)
                     : 'https://link.trustwallet.com/send?asset=c' + o.chain + '_t' + o.usdc + '&address=' + o.payTo + '&amount=' + o.usd,
      eip681: 'ethereum:' + o.usdc + '@' + o.chain + '/transfer?address=' + o.payTo + '&uint256=' + units(o.usd)
    };
  }
  function pending(surface) {                                            // opened by a handoff link → {usd, rail, go} once, URL cleaned
    try {
      var u = new URL(W.location.href), v = u.searchParams.get(PARAM); if (!v) return null;
      var p = v.split(':'); if (p[0] !== surface) return null;
      u.searchParams.delete(PARAM);
      W.history.replaceState(W.history.state, '', u.pathname + u.search + u.hash);
      var usd = parseFloat(p[1]), sane = usd >= 0.001 && usd <= 1000; if (!sane) usd = DEFAULT_USD;        // garbage in → the default amount, and never an auto-start
      return { usd: usd, rail: p[2] || '', go: sane && p[3] === 'go' && usd <= AUTOSTART_MAX };
    } catch (e) { return null; }
  }
  var BASE = { chainId: '0x2105', chainName: 'Base', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://mainnet.base.org'], blockExplorerUrls: ['https://basescan.org'] };
  function rnd32() { var b = new Uint8Array(32), s = '0x', i; (W.crypto || W.msCrypto).getRandomValues(b); for (i = 0; i < 32; i++) s += (b[i] < 16 ? '0' : '') + b[i].toString(16); return s; }
  async function ensureBase(p, o, step) {                // connect, be on the chain → the visitor's account
    step('connect');
    var accts = await p.request({ method: 'eth_requestAccounts' }), from = accts && accts[0];
    if (!from) throw new Error('the wallet gave no account');
    if (Number(await p.request({ method: 'eth_chainId' })) !== o.chain) {
      step('switch');
      try { await p.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x' + o.chain.toString(16) }] }); }
      catch (e) { if (e && e.code === 4001) throw e; await p.request({ method: 'wallet_addEthereumChain', params: [BASE] }); }
    }
    return from;
  }
  function pad32(h) { return ('0'.repeat(64) + String(h).replace(/^0x/, '').toLowerCase()).slice(-64); }
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  /* transfer(provider, o) → {from, hash, confirmed}: the PLAIN way — a normal USDC transfer(to, amount) from the visitor's own wallet (they pay a fraction of a
     cent of gas). No typed-data screen, so no "high-risk approval / untrusted EOA" alert. Proven on a Base fork (tests/fork-plain.mjs: the exact calldata moves the
     exact amount). Read-only preflights (balance) never block: a wallet that cannot answer eth_call simply skips them. */
  async function transfer(p, o) {
    var step = o.step || function () {};
    var from = await ensureBase(p, o, step);
    var u = Number(units(o.usd));                          // micro-USDC: an integer, far below 2^53 — no BigInt needed on an old phone
    step('check');
    try {
      var bal = parseInt(await p.request({ method: 'eth_call', params: [{ to: o.usdc, data: '0x70a08231' + pad32(from) }, 'latest'] }), 16);
      if (bal >= 0 && bal < u) { var er = new Error('you have ' + (bal / 1e6).toFixed(2) + ' USDC on Base in this wallet — pick a smaller gift'); er.owh = 'balance'; throw er; }
    } catch (e) { if (e && e.owh === 'balance') throw e; }
    step('send');
    var hash = await p.request({ method: 'eth_sendTransaction', params: [{ from: from, to: o.usdc, data: '0xa9059cbb' + pad32(o.payTo) + pad32(u.toString(16)), value: '0x0' }] });
    if (!/^0x[0-9a-fA-F]{64}$/.test(hash || '')) throw new Error('the wallet returned no transaction hash');
    step('wait');
    var ok = null;
    for (var i = 0; i < 30 && ok === null; i++) {
      await sleep(timeouts.poll);
      try { var rc = await p.request({ method: 'eth_getTransactionReceipt', params: [hash] }); if (rc) ok = rc.status === '0x1' || rc.status === 1; } catch (e) {}
    }
    if (ok === false) throw new Error('the transaction failed on-chain — nothing was transferred');
    return { from: from, hash: hash, confirmed: ok === true };
  }
  async function authorize(p, o) {                       // o: {usd, payTo, usdc, chain, step?:(what)=>void} → {from, signature, authorization}
    var step = o.step || function () {};
    var from = await ensureBase(p, o, step);
    var auth = { from: from, to: o.payTo, value: units(o.usd), validAfter: '0', validBefore: String(Math.floor(Date.now() / 1000) + 300), nonce: rnd32() };
    step('sign');
    var typed = { types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }],
        TransferWithAuthorization: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'validAfter', type: 'uint256' }, { name: 'validBefore', type: 'uint256' }, { name: 'nonce', type: 'bytes32' }] },
      primaryType: 'TransferWithAuthorization', domain: { name: 'USD Coin', version: '2', chainId: o.chain, verifyingContract: o.usdc }, message: auth };
    var signature = await p.request({ method: 'eth_signTypedData_v4', params: [from, JSON.stringify(typed)] });
    return { from: from, signature: signature, authorization: auth };
  }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }   // network data (facilitator, wallet) never becomes markup
  function txOf(v) { return typeof v === 'string' && /^0x[0-9a-fA-F]{64}$/.test(v) ? v : null; }            // only a 64-hex hash may reach a link or an event (PAʻA SITE-2, 28 Nov 2026)
  /* the gift rail's Base lane (https://gift-rail.opensourceorchestra.org/base — CORS *; PayAI itself is server-to-server and answers browsers 404 with no
     Access-Control-Allow-*: "Load failed" on Safari, 28 Nov 2026). post() NEVER throws and never returns HTML: {net, status, json}. */
  var NET = '⚠️ couldn’t reach the gift rail — nothing left your wallet. Try again in a moment, or copy the address below and send USDC on Base by hand to osoartist.eth';
  var NETSETTLE = '⚠️ lost the connection at the very last step — it may or may not have gone through: check your wallet / BaseScan before tapping again, or copy the address below and send by hand';
  var WHY = { invalid_exact_evm_insufficient_balance: 'not enough USDC on Base in this wallet', proxy_paused: 'the gift rail is resting 🌺 — copy the address below and send by hand',
    proxy_rate_limited: 'a little too fast — try again in a minute', settlement_pending: '⏳ still settling — it may still land (check BaseScan in a minute)',
    proxy_upstream_unreachable: 'the gift rail could not reach the payment network — try again in a moment', proxy_upstream_bad_reply: 'the gift rail could not reach the payment network — try again in a moment' };
  function why(code) {
    code = String(code || '');
    if (WHY[code]) return WHY[code];
    if (/valid_?before|expired/i.test(code)) return 'that took too long — tap again';
    if (/^proxy_(pin_|bad_json|too_large)/.test(code)) return 'something looked off with that request';
    if (/free_tier/.test(code)) return 'the gift rail is resting 🌺 — copy the address below and send by hand';
    return 'the gift rail did not accept it' + (code ? ' (' + code + ')' : '');                     // callers escape this with esc()
  }
  function rest(code) { return /^proxy_(paused|rate_limited|upstream)|free_tier/.test(String(code || '')); }   // a lane that is resting → offer the by-hand way
  var SLOW = '⚠️ the gift rail is slow right now — nothing left your wallet. Try again in a moment, or copy the address below and send USDC on Base by hand to osoartist.eth';
  var timeouts = { verify: 20000, settle: 60000, poll: 2000 };          // a stalled request must never leave "verifying…" on the card forever (venue Wi-Fi, a dropped connection): abort → plain words + the by-hand way
  async function post(base, path, body) {
    var ac = typeof AbortController === 'function' ? new AbortController() : null, to = ac && setTimeout(function () { ac.abort(); }, /\/settle$/.test(path) ? timeouts.settle : timeouts.verify);
    try {
      var r = await fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ac ? ac.signal : undefined }), j = null;
      try { j = await r.json(); } catch (e) {}
      clearTimeout(to);
      return { net: false, status: r.status, json: (j && typeof j === 'object') ? j : {} };
    } catch (e) { clearTimeout(to); return { net: true, timeout: !!(ac && ac.signal.aborted), status: 0, json: null }; }
  }
  function el(tag, attrs, kids) {
    var n = D.createElement(tag), k;
    for (k in (attrs || {})) { if (attrs[k] === true) n.setAttribute(k, ''); else if (attrs[k] !== false && attrs[k] != null) n.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === 'string' ? D.createTextNode(c) : c); });
    return n;
  }
  function css() {
    if (D.getElementById('owh-css')) return;
    var B = 'box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif;', out = [];
    function R(sel, body) { out.push(sel + '{' + body + '}', '#oso-frames ' + sel + '{' + body + '}'); }   // the frame's own resets must not win
    R('.owh', B + 'display:block;margin:12px 0 0;color:#f5efe6;text-align:left');
    R('.owh *', B);
    R('.owh .owh-h', 'margin:14px 0 4px;font:700 14px/1.4 system-ui,-apple-system,sans-serif;color:#f5efe6');
    R('.owh .owh-p', 'margin:0 0 10px;font:12.5px/1.5 system-ui,-apple-system,sans-serif;color:#9d97c9');
    R('.owh .owh-go', 'display:block;width:100%;min-height:50px;border:none;border-radius:12px;padding:12px;background:linear-gradient(90deg,#0052ff,#7c4ba8);color:#fff;font:700 15px system-ui,-apple-system,sans-serif;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:rgba(127,216,164,.28)');
    R('.owh .owh-go:disabled,.owh .owh-det:disabled', 'opacity:.5;cursor:wait');
    R('.owh .owh-more', 'display:block;margin:6px auto 0;min-height:44px;padding:8px 12px;background:none;border:none;color:#9d97c9;font:13px system-ui,-apple-system,sans-serif;text-decoration:underline;cursor:pointer;touch-action:manipulation');
    R('.owh .owh-list,.owh .owh-grid', 'display:grid;gap:8px');
    R('.owh .owh-grid', 'grid-template-columns:1fr 1fr');
    R('.owh .owh-b', 'display:flex;align-items:center;gap:10px;width:100%;min-height:50px;padding:8px 12px;border-radius:12px;background:#0b0710;border:1px solid #4a3565;color:#f5efe6;text-align:left;text-decoration:none;font:600 14px/1.25 system-ui,-apple-system,sans-serif;touch-action:manipulation;-webkit-tap-highlight-color:rgba(127,216,164,.28);cursor:pointer');
    R('.owh .owh-b:active,.owh .owh-b:focus-visible', 'border-color:#7fd8a4;outline:none');
    R('.owh .owh-wide', 'grid-column:1/-1');
    R('.owh .owh-i', 'font-size:20px;line-height:1;flex:none');
    R('.owh .owh-b img', 'width:28px;height:28px;border-radius:7px;flex:none');
    R('.owh .owh-b small', 'display:block;margin-top:2px;font:400 11px/1.3 system-ui,-apple-system,sans-serif;color:#9d97c9');
    R('.owh .owh-row', 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px');
    R('.owh .owh-c', 'background:#1c1230;color:#7fd8a4;border:1px solid #7fd8a4;border-radius:10px;padding:10px 14px;min-height:44px;font:600 13px system-ui,-apple-system,sans-serif;cursor:pointer;touch-action:manipulation');
    R('.owh .owh-n', 'margin-top:10px;font:13px/1.5 system-ui,-apple-system,sans-serif;color:#cdbce8;word-break:break-word');
    R('.owh .owh-n:empty', 'display:none');
    R('.owh .owh-addr', 'margin-top:10px;background:#0b0710;border:1px solid #4a3565;border-radius:10px;padding:8px 10px;font:12px ui-monospace,monospace;word-break:break-all;color:#cfc6e8');
    R('.owh .owh-qr', 'margin:12px auto 0;width:208px;max-width:100%;padding:10px;background:#fff;border-radius:12px;line-height:0;color:#111;font:13px system-ui,sans-serif');
    R('.owh .owh-qr svg', 'display:block;width:100%;height:auto');
    R('.owh .owh-cap', 'margin:6px 0 0;text-align:center;font:11.5px/1.4 system-ui,-apple-system,sans-serif;color:#9d97c9');
    R('.owh .owh-ex', 'margin-top:12px;font:12.5px/1.55 system-ui,-apple-system,sans-serif;color:#9d97c9');
    R('.owh .owh-ex a', 'color:#7fd8a4');
    R('.owh [hidden]', 'display:none!important');
    D.head.appendChild(el('style', { id: 'owh-css' }, [out.join('\n')]));
  }
  function qr(box, text, label) {                                         // lazy: the QR library is fetched only when a QR is shown
    function fail() { box.textContent = '(QR unavailable — copy the address instead)'; }
    function draw() {
      try {
        var q = W.__owhQR(0, 'M'); q.addData(text); q.make();
        box.innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
        var s = box.firstChild; if (s && s.setAttribute) { s.setAttribute('role', 'img'); s.setAttribute('aria-label', label || 'QR code'); }
      } catch (e) { fail(); }
    }
    if (W.__owhQR) return draw();
    box.textContent = '…';
    var s = el('script', { src: QR_URL, async: true }); s.onload = draw; s.onerror = fail; D.head.appendChild(s);
  }
  function copyText(text, done) {
    function fb() { var ta = el('textarea', { readonly: true, style: 'position:fixed;left:-9999px;top:0;opacity:0' }); ta.value = text; D.body.appendChild(ta); ta.select(); try { D.execCommand('copy'); done(); } catch (e) {} D.body.removeChild(ta); }
    if (N.clipboard && N.clipboard.writeText) N.clipboard.writeText(text).then(done, fb); else fb();
  }
  /* connect(o) → {el, refresh, setBusy, say, autostart, wallets}
     o: {surface, usdc, payTo, chain, usd:()=>number, rail?:()=>string, send:(provider, info)=>Promise|void, t?:(key,fallback)=>string, hook?:false, payToName?:string, safetyUrl?:string, plain?:false|()=>boolean, onPlain?:({tx,amount,confirmed,route})=>void, explorerTx?:string} */
  function connect(o) {
    css();
    var E = env(), t = o.t || function (k, d) { return d; };
    var seen = [], expanded = false, busy = false, left = false, qrOn = false, qrAddr = false;
    var root = el('div', { class: 'owh' });
    var go = el('button', { type: 'button', class: 'owh-go', hidden: true });
    var plainT = el('span', {}, [t('owh.plain', 'plain transfer')]), plainS = el('small', {}, [t('owh.plainsub', 'a normal wallet send — no signature screens, no warnings, a fraction of a cent of gas')]);
    plainT.appendChild(plainS);
    var plain = el('button', { type: 'button', class: 'owh-b owh-plain', hidden: true, style: 'margin-top:8px' }, [el('span', { class: 'owh-i', 'aria-hidden': 'true' }, ['🪙']), plainT]);
    function plainOn() { return typeof o.plain === 'function' ? !!o.plain() : o.plain !== false; }      // a host may hide the row per state (the agent rail: only on its Base lane)
    var plainMode = false;                                 // several wallets detected: tapping 🪙 turns the list into "which wallet sends it plainly?" 
    var list = el('div', { class: 'owh-list', hidden: true });
    var more = el('button', { type: 'button', class: 'owh-more', 'aria-expanded': 'false', hidden: true }, [t('owh.another', 'use another wallet ▾')]);
    var pick = el('div', { class: 'owh-pick', hidden: true });
    var note = el('div', { class: 'owh-n', role: 'status', 'aria-live': 'polite' });
    var grid = el('div', { class: 'owh-grid' }), A = {};
    var copyBtn = el('button', { type: 'button', class: 'owh-c' }, [t('owh.copy', '📋 copy address')]);
    var qrBtn = el('button', { type: 'button', class: 'owh-c', 'aria-expanded': 'false' }, [t('owh.qr', '▦ show QR')]);
    var row = el('div', { class: 'owh-row' }, [copyBtn, qrBtn]);
    var addr = el('div', { class: 'owh-addr', hidden: true }, [o.payTo]);
    var qrBox = el('div', { class: 'owh-qr', hidden: true });
    var qrCap = el('div', { class: 'owh-cap', hidden: true }, [t('owh.qrcap', 'scan with MetaMask · Coinbase Wallet · Trust · Rainbow — USDC on Base, amount filled in')]);
    var qrMode = el('button', { type: 'button', class: 'owh-more', hidden: true }, [t('owh.qraddr', 'address only (any wallet)')]);
    var shortTo = o.payTo.slice(0, 6) + '…' + o.payTo.slice(-4);
    var exKids = [t('owh.explain', 'Your wallet may call this a “high-risk approval” or say the recipient is an “untrusted EOA”. That is the wallet’s generic caution for any gasless USDC payment to an address it hasn’t seen. This signature sends exactly the amount you chose, once, to ' + (o.payToName ? o.payToName + ' (' + shortTo + ')' : shortTo) + ', and expires in 5 minutes — check the amount and address in the message.')];
    if (o.safetyUrl) exKids.push(' ', el('a', { href: o.safetyUrl, target: '_blank', rel: 'noopener' }, [t('owh.safety', 'what will my wallet say? ↗')]));
    var ex = el('div', { class: 'owh-ex' }, exKids);

    function say(m) { note.textContent = m || ''; }
    function cfg() { return { surface: o.surface, usd: o.usd(), rail: o.rail ? o.rail() : '', usdc: o.usdc, payTo: o.payTo, chain: o.chain }; }
    function detected() {
      var out = seen.slice();
      if (W.ethereum && !out.some(function (d) { return d.provider === W.ethereum; })) out.push({ info: { name: nameOf(W.ethereum), icon: '' }, provider: W.ethereum });
      return out;
    }
    var chosen = null;
    function run(d) { chosen = d; say(''); return o.send(d.provider, d.info); }
    function sayTx(msg, hash) { note.textContent = msg; var h = txOf(hash); if (h) { note.appendChild(D.createTextNode(' ')); note.appendChild(el('a', { href: (o.explorerTx || 'https://basescan.org/tx/') + h, target: '_blank', rel: 'noopener', style: 'color:#7fd8a4' }, [h.slice(0, 14) + '…' + h.slice(-8)])); } }
    async function runPlain(dw) {
      dw = dw || chosen || detected()[0]; if (!dw || busy) return;
      plainMode = false; busy = true; render(); say('');
      var nm = (dw.info && dw.info.name) || 'your wallet';
      try {
        var r = await transfer(dw.provider, { usd: o.usd(), payTo: o.payTo, usdc: o.usdc, chain: o.chain, step: function (w) {
          say(w === 'connect' ? '🔌 connecting ' + nm + '…' : w === 'switch' ? '🌉 switching to Base…' : w === 'check' ? '🔎 checking your USDC…' : w === 'send' ? t('owh.confirmplain', '✍️ confirm the gift in your wallet — it is a normal send') : '⏳ sent — waiting for Base to confirm…'); } });
        sayTx(r.confirmed ? '🌊🤙 ALOHA RECEIVED. mahalo nui! ✦ recorded on-chain:' : '⏳ sent — Base is still confirming; it should land within a minute:', r.hash);
        if (typeof o.onPlain === 'function') { try { o.onPlain({ tx: txOf(r.hash), amount: o.usd(), confirmed: r.confirmed, route: 'plain' }); } catch (e) {} }
      } catch (e) {
        var m = String((e && e.message) || e);
        say(e && e.code === 4001 ? '🌺 declined for now — the aloha waits patiently'
          : e && e.owh === 'balance' ? '⚠️ ' + m
          : /insufficient funds|gas required exceeds|exceeds the balance/i.test(m) ? '⚠️ not enough ETH on Base for the network fee (a fraction of a cent) — try the gas-free button above, or add a little ETH on Base'
          : '⚠️ ' + m.slice(0, 160) + ' — nothing was sent unless your wallet shows it');
      }
      busy = false; render();
    }
    plain.addEventListener('click', function () {
      var d = detected();
      if (d.length > 1 && !chosen) { plainMode = !plainMode; render(); return; }
      runPlain();
    });
    // ── the phone / desktop picker (below the detected wallets) ──
    if (E.mobile) {
      pick.appendChild(el('div', { class: 'owh-h' }, [t('owh.title', '👛 open the gift in your wallet app')]));
      pick.appendChild(el('div', { class: 'owh-p' }, [t('owh.sub', 'tap your wallet — it opens with the gift ready and you confirm inside it. nothing leaves until you do.')]));
      [['metamask', '🦊', 'MetaMask', 1], ['coinbase', '🔵', 'Coinbase Wallet', 1], ['phantom', '👻', 'Phantom', 1],
       ['trust', '🛡️', 'Trust Wallet', E.android ? 1 : 0], ['eip681', '👛', t('owh.other', 'another wallet'), 0]].forEach(function (w, i) {
        var sub = w[3] ? t('owh.gasfree', 'gas-free · opens the gift inside it') : t('owh.prefilled', 'USDC send, amount filled in');
        var a = el('a', { class: 'owh-b' + (i === 4 ? ' owh-wide' : ''), rel: 'noopener', 'data-w': w[0] }, [
          el('span', { class: 'owh-i', 'aria-hidden': 'true' }, [w[1]]), el('span', {}, [w[2], el('small', {}, [sub])])]);
        a.addEventListener('click', function () {                                    // nothing opened? say so and offer the by-hand way
          left = false;
          setTimeout(function () { if (!left && D.visibilityState === 'visible') { say(t('owh.nothing', 'nothing opened? that wallet app may not be installed — pick another, or copy the address below 🌺')); addr.hidden = false; } }, 1800);
        });
        A[w[0]] = a; grid.appendChild(a);
      });
      pick.appendChild(grid);
      D.addEventListener('visibilitychange', function () { if (D.visibilityState === 'hidden') left = true; });
      W.addEventListener('pagehide', function () { left = true; });
    } else {
      pick.appendChild(el('div', { class: 'owh-h' }, [t('owh.dtitle', '📱 scan with your phone’s wallet')]));
      pick.appendChild(el('div', { class: 'owh-p' }, [t('owh.dsub', 'no browser wallet found — open MetaMask, Coinbase Wallet, Trust or Rainbow on your phone and scan; or install a browser wallet and reload.')]));
    }
    var hook = null, warmT = 0;
    function renderHook() {
      if (hook) { hook.remove(); hook = null; }
      /* owh-signup hook wiring */
      if (o.hook === false || root.getClientRects().length === 0 || pick.hidden) return;   // hook:false = the host handles sign-up itself (the Fountain: Base Pay is Base-only) · built hidden at page load, or the picker is folded (a wallet is detected) → fetch NOTHING
      var h = W.OWH_SIGNUP;
      if (!h) { loadHook(renderHook); return; }                                // first time the picker is visible: the 1.6 KB hook, from our own fleet origin
      if (!(h.href || typeof h.open === 'function')) return;
      var cn = N.connection;                                                    // the hook may pre-load its own lib (from OUR origin) — never on a saver / 2G link,
      if (typeof h.warm === 'function' && !warmT && !(cn && (cn.saveData || /(^|-)2g$/.test(cn.effectiveType || '')))) {    // and only once the visitor LINGERS on the picker (2.5 s):
        warmT = setTimeout(function () { warmT = 0; if (root.getClientRects().length && !pick.hidden) { try { h.warm(); } catch (e) {} } }, 2500);   // a glance-and-close costs nothing
      }
      var inner = [el('span', { class: 'owh-i', 'aria-hidden': 'true' }, ['✨']), el('span', {}, [h.label || t('owh.signup', 'no wallet yet? sign up in 10 s'), el('small', {}, [h.sub || t('owh.signupsub', 'email or passkey — no app needed')])])];
      if (h.href) hook = el('a', { class: 'owh-b', href: h.href, rel: 'noopener', style: 'margin-top:8px' }, inner);
      else { hook = el('button', { type: 'button', class: 'owh-b', style: 'margin-top:8px' }, inner); hook.addEventListener('click', function () { h.open({ usd: o.usd(), payTo: o.payTo, usdc: o.usdc, chain: o.chain, say: say, use: function (p, info) { run({ provider: p, info: info || { name: 'your new wallet', icon: '' } }); } }); }); }
      pick.appendChild(hook);
    }
    pick.appendChild(row); pick.appendChild(addr); pick.appendChild(qrBox); pick.appendChild(qrCap); pick.appendChild(qrMode);
    function drawQr() { qr(qrBox, qrAddr ? o.payTo : links(cfg()).eip681, 'QR code: pay USDC on Base to the ʻohana wallet'); }
    function toggleQr(on) {
      qrOn = on == null ? !qrOn : on;
      qrBox.hidden = qrCap.hidden = qrMode.hidden = !qrOn; qrBtn.setAttribute('aria-expanded', qrOn ? 'true' : 'false');
      if (qrOn) { drawQr(); try { qrBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (x) {} }
    }
    qrBtn.addEventListener('click', function () { toggleQr(); });
    qrMode.addEventListener('click', function () { qrAddr = !qrAddr; qrMode.textContent = qrAddr ? t('owh.qrfull', 'USDC amount filled in') : t('owh.qraddr', 'address only (any wallet)'); drawQr(); });
    copyBtn.addEventListener('click', function () { addr.hidden = false; copyText(o.payTo, function () { copyBtn.textContent = t('owh.copied', '✅ copied — mahalo!'); setTimeout(function () { copyBtn.textContent = t('owh.copy', '📋 copy address'); }, 2500); }); });
    more.addEventListener('click', function () { expanded = !expanded; render(); });
    go.addEventListener('click', function () { var d = detected(); if (d[0]) run(d[0]); });

    root.appendChild(go); root.appendChild(list); root.appendChild(plain); root.appendChild(more); root.appendChild(pick); root.appendChild(ex); root.appendChild(note);

    function render() {
      var d = detected();
      list.textContent = '';
      if (d.length === 1) {
        go.hidden = false; go.textContent = t('owh.sendwith', '👛 send USDC with') + ' ' + d[0].info.name;
        list.hidden = true; more.hidden = false; pick.hidden = !expanded;
      } else if (d.length > 1) {
        go.hidden = true; list.hidden = false; more.hidden = false; pick.hidden = !expanded;
        d.forEach(function (w) {
          var ic = w.info.icon && /^data:image\//.test(w.info.icon) ? el('img', { src: w.info.icon, alt: '' }) : el('span', { class: 'owh-i', 'aria-hidden': 'true' }, ['👛']);
          var b = el('button', { type: 'button', class: 'owh-b owh-det', disabled: busy }, [ic, el('span', {}, [w.info.name, el('small', {}, [plainMode ? t('owh.plainwith', '🪙 plain transfer — a normal send') : t('owh.detected', 'detected in this browser · gas-free')])])]);
          b.addEventListener('click', function () { if (plainMode) runPlain(w); else run(w); });
          list.appendChild(b);
        });
      } else {
        go.hidden = true; list.hidden = true; more.hidden = true; pick.hidden = false;                // nothing detected → the picker IS the answer
      }
      more.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      more.textContent = expanded ? t('owh.fewer', 'hide other wallets ▴') : t('owh.another', 'use another wallet ▾');
      plain.hidden = !(d.length >= 1 && plainOn()); plain.disabled = busy;
      plainT.firstChild.nodeValue = plainMode ? t('owh.plainback', '↩ gas-free instead') : t('owh.plain', 'plain transfer');
      plainS.hidden = plainMode;
      go.disabled = busy; Array.prototype.forEach.call(list.querySelectorAll('button'), function (b) { b.disabled = busy; });
      var L = links(cfg()), id; for (id in A) A[id].setAttribute('href', L[id]);
      renderHook();
      var shown = root.getClientRects().length > 0;                                                  // a card built hidden at page load fetches NOTHING
      if (!E.mobile && !pick.hidden && !qrOn && shown) toggleQr(true);                              // desktop: the QR is the answer — once the card is on screen
      else if (qrOn && shown) drawQr();
    }
    // EIP-6963: wallets announce themselves; we only listen (and ask once) — nothing is fetched
    W.addEventListener('eip6963:announceProvider', function (ev) {
      var d = ev && ev.detail; if (!d || !d.info || !d.provider || typeof d.provider.request !== 'function') return;
      if (seen.some(function (x) { return x.provider === d.provider || x.info.uuid === d.info.uuid; })) return;
      seen.push({ info: { uuid: d.info.uuid, name: String(d.info.name || 'wallet').slice(0, 40), icon: String(d.info.icon || '') }, provider: d.provider });
      render();
    });
    try { W.dispatchEvent(new W.CustomEvent('eip6963:requestProvider')); } catch (e) {}
    render();
    // the picker re-renders the moment it is ACTUALLY on screen (a card built hidden at page load fetches nothing; a host that
    // mounts ui.el late, or opens its card without calling refresh(), still gets its QR / hook — no host contract needed)
    if (W.IntersectionObserver) { try { new W.IntersectionObserver(function (es) { for (var i = 0; i < es.length; i++) if (es[i].isIntersecting) { render(); return; } }).observe(root); } catch (e) {} }
    return {
      el: root,
      refresh: render,
      say: say,
      fallback: function () { expanded = true; render(); addr.hidden = false; try { addr.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {} },     // a failure state must offer something to TAP: open the picker + show the address
      wallets: detected,
      setBusy: function (b) { busy = !!b; render(); },
      autostart: function (p) {                              // we arrived inside a wallet's browser via a handoff link
        var t0 = Date.now();
        (function poll() {
          var d = detected();
          if (d.length) { render(); if (p && p.go && d.length === 1) run(d[0]); else say(t('owh.hereyouare', '🌺 aloha — you are in your wallet; choose it below to send the gift')); return; }
          if (Date.now() - t0 < 3500) return setTimeout(poll, 120);
          expanded = true; render();
        })();
      }
    };
  }
  return { version: '1.0', DEFAULT_USD: DEFAULT_USD, env: env, links: links, pending: pending, connect: connect, authorize: authorize, nameOf: nameOf, esc: esc, txOf: txOf, post: post, why: why, rest: rest, NET: NET, SLOW: SLOW, NETSETTLE: NETSETTLE, timeouts: timeouts, transfer: transfer };
})();
window.OWH=OWH;})();
