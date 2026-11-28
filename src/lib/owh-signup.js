/* owh-signup.js v0.1 — the "no wallet yet? sign up in 10 s" row of the ʻohana connect picker (OWH_SIGNUP hook)
 * SPDX-License-Identifier: GPL-3.0-or-later
 * Built by Open Source Orchestra: Shaka Lei Kaumaka & the AI ʻohana (https://opensourceorchestra.org)
 *
 * One tap → Coinbase Wallet's own sign-in popup (keys.coinbase.com): "Sign In / Create Account" with a PASSKEY
 * (Face ID / fingerprint) — no app, no email, no seed phrase, no account of ours, no API key — then Base Pay sends
 * USDC on Base to the ʻohana wallet, gas sponsored. Self-custodial: the visitor holds the passkey, we never see a key.
 *
 * Laws kept: the SDK (Apache-2.0 @base-org/account 2.6.0, vendored UNMODIFIED, ~242 KB gzip) is fetched from OUR origin only
 * after the picker is shown (the visitor already tapped 🌊) and is never run against Coinbase until the visitor taps this row;
 * telemetry:false → our page makes zero third-party requests (the popup is Coinbase's own page).
 * Why Base Pay and not api.use(provider) → EIP-3009 → PayAI: a brand-new passkey wallet is undeployed and signs ERC-6492;
 * PayAI refuses undeployed wallets (eip6492_factory_not_allowed). Base Pay is a plain USDC transfer, so it just works.
 */
(function () {
  'use strict';
  var W = window, D = document, N = W.navigator || {}, UA = N.userAgent || '';
  var me = D.currentScript;
  var SDK = (me && me.getAttribute('data-sdk')) || 'https://frames.opensourceorchestra.org/lib/base-account-2.6.0.min.js';
  var NAME = 'Open Source Orchestra';
  var loading = null, provider = null, ready = false;
  var IOS = /iPad|iPhone|iPod/.test(UA) || (N.platform === 'MacIntel' && N.maxTouchPoints > 1);
  // in-app browsers (X, Telegram, Instagram, Facebook, WeChat…) often block pop-ups and passkeys → say so, kindly
  var INAPP = (IOS && !/Safari\//i.test(UA)) || /; wv\)|FBAN|FBAV|Instagram|Line\/|Twitter|MicroMessenger|Snapchat|LinkedInApp/i.test(UA);

  function load() {
    if (W.createBaseAccountSDK && W.base) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise(function (ok, no) {
      var s = D.createElement('script'); s.src = SDK; s.async = true;
      s.onload = function () { (W.createBaseAccountSDK && W.base) ? ok() : (loading = null, no(new Error('sdk-missing'))); };
      s.onerror = function () { loading = null; no(new Error('sdk-load-failed')); };
      D.head.appendChild(s);
    });
    return loading;
  }
  function prov() {
    return provider || (provider = W.createBaseAccountSDK({ appName: NAME, appLogoUrl: '', preference: { telemetry: false } }).getProvider());
  }
  function warm() {                                   // own-origin fetch + evaluate; NO request to Coinbase happens here
    if (ready) return Promise.resolve(true);
    return load().then(function () { prov(); ready = true; return true; });
  }
  function usdStr(n) { return (Math.round(Number(n) * 1e6) / 1e6).toFixed(6).replace(/0+$/, '').replace(/\.$/, ''); }
  function short(s) { s = String(s || ''); return s.length > 140 ? s.slice(0, 137) + '…' : s; }

  var api = W.OhanaPasskeyWallet = {
    warm: warm,
    isReady: function () { return ready; },
    inApp: INAPP,
    connect: function () {                           // create-or-sign-in only (future: membership / "Sign in with Base")
      if (!ready) { warm()['catch'](function () {}); return Promise.reject(Object.assign(new Error('warming'), { code: 'WARMING' })); }
      return prov().request({ method: 'eth_requestAccounts' }).then(function (a) { return { address: a[0] }; });
    },
    pay: function (o) {                              // must be called synchronously inside the tap (popup rules)
      if (!ready) { warm()['catch'](function () {}); return Promise.reject(Object.assign(new Error('warming'), { code: 'WARMING' })); }
      return W.base.pay({ amount: usdStr(o.amount), to: o.to, testnet: false, telemetry: false });
    }
  };

  W.OWH_SIGNUP = {
    label: 'no wallet yet? sign up in 10 s',
    sub: INAPP ? 'a passkey — open this page in Safari / Chrome for the best result' : 'a passkey (Face ID) — no app, no email, no seed phrase',
    warm: function () { warm()['catch'](function () {}); },
    open: function (a) {
      var say = typeof a.say === 'function' ? a.say : function () {};
      var usd = Number(a.usd);
      if (!(usd > 0)) { say('pick an amount first 🌺'); return; }
      if (!ready) { warm()['catch'](function () {}); say('one sec — getting ready… tap again 🌺'); return; }
      say('✨ opening Coinbase Wallet — choose “Create Account” (passkey) or “Sign In”');
      api.pay({ amount: usd, to: a.payTo }).then(function (r) {
        say('✅ $' + usdStr(usd) + ' sent — mahalo! 🌺' + (r && r.id ? ' (' + String(r.id).slice(0, 10) + '…)' : ''));
      }, function (e) {
        var m = String((e && e.message) || e || '');
        if ((e && (e.code === 4001 || e.code === 'CANCELLED')) || /reject|denied|closed|cancel/i.test(m)) say('no worries — maybe later 🌺');
        else say('couldn’t finish (' + short(m) + ') — you can still copy the address or scan the QR above 🌺');
      });
    }
  };
})();
