#!/usr/bin/env node
// usage: node tests/fork-plain.mjs   (needs foundry's anvil on PATH or ANVIL=/path/to/anvil, and a Base RPC: BASE_RPC=… default publicnode)
// FORK PROOF for OWH.transfer(): the exact calldata the PLAIN button sends really moves USDC to PAYTO on Base.
// anvil forks Base mainnet locally (nothing real is touched), a real holder is impersonated locally, and the REAL owh.js runs in Chromium
// with a provider that forwards to that node. Assertions are on-chain facts (balances, receipt, Transfer log), not on our own code's opinion.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chromium } from '/usr/lib/node_modules/playwright/index.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), OWH_JS = process.env.OWH_JS || (existsSync(join(HERE, '..', 'src/lib/owh.js')) ? join(HERE, '..', 'src/lib/owh.js') : join(HERE, '..', 'owh.js'));
const ANVIL = process.env.ANVIL || '/workspace/.foundry/bin/anvil', RPC = process.env.BASE_RPC || 'https://base-rpc.publicnode.com';
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', PAYTO = '0x25965899f4600b3AA5362ee4f34be95E5E62c934';
const HOLDER = process.env.HOLDER || '0x3304E22DDaa22bCdC5fCa2269b418046aE7b566A', POOR = '0x00000000000000000000000000000000000dEaD1';
const PORT = 18900 + Math.floor(Math.random() * 90), URL_ = 'http://127.0.0.1:' + PORT;
async function rpc(method, params) { const r = await fetch(URL_, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }); const j = await r.json(); if (j.error) throw Object.assign(new Error(method + ': ' + (j.error.message || JSON.stringify(j.error))), { code: j.error.code }); return j.result; }
const pad = (a) => a.toLowerCase().replace(/^0x/, '').padStart(64, '0');
const bal = async (a) => BigInt(await rpc('eth_call', [{ to: USDC, data: '0x70a08231' + pad(a) }, 'latest']));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n + (x ? ' — ' + x : '')); } };
const proc = spawn(ANVIL, ['--fork-url', RPC, '--port', String(PORT), '--silent', '--auto-impersonate'], { stdio: 'ignore' });
let browser;
try {
  for (let i = 0; i < 80; i++) { try { await rpc('eth_chainId', []); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  if (Number(await rpc('eth_chainId', [])) !== 8453) throw new Error('the fork is not Base (chainId ' + (await rpc('eth_chainId', [])) + ')');
  await rpc('anvil_setBalance', [HOLDER, '0xDE0B6B3A7640000']); await rpc('anvil_setBalance', [POOR, '0xDE0B6B3A7640000']);
  const hb0 = await bal(HOLDER); console.log('fork up · holder USDC', Number(hb0) / 1e6);
  if (hb0 < 120000000n) console.log('  (holder holds < $120 — the $100 case is skipped)');
  browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext()).newPage();
  await page.exposeFunction('nodeRpc', (m, p) => rpc(m, p).catch((e) => ({ __err: e.message, code: e.code })));
  await page.goto('about:blank'); await page.addScriptTag({ path: OWH_JS });
  await page.evaluate(({ HOLDER, POOR }) => {
    OWH.timeouts.poll = 50;
    window.mk = (acct) => ({ request: async ({ method, params }) => {
      if (method === 'eth_requestAccounts') return [acct];
      if (method === 'wallet_switchEthereumChain') return null;
      const r = await window.nodeRpc(method, params || []);
      if (r && r.__err) throw Object.assign(new Error(r.__err), { code: r.code });
      return r;
    } });
    window.HOLDER = HOLDER; window.POOR = POOR;
  }, { HOLDER, POOR });
  const give = (acct, usd) => page.evaluate(async ({ acct, usd, USDC, PAYTO }) => {
    const steps = []; try { const r = await OWH.transfer(window.mk(acct), { usd, payTo: PAYTO, usdc: USDC, chain: 8453, step: (w) => steps.push(w) }); return { r, steps }; } catch (e) { return { err: String(e.message), owh: e.owh, steps }; }
  }, { acct, usd, USDC, PAYTO });
  const cases = [['$1', 1, 1000000n], ['$10', 10, 10000000n], ['custom $2.75', 2.75, 2750000n], ['custom 1¢', 0.01, 10000n]];
  if (hb0 >= 120000000n) cases.push(['$100', 100, 100000000n]);
  for (const [label, usd, units] of cases) {
    const p0 = await bal(PAYTO), h0 = await bal(HOLDER);
    const o = await give(HOLDER, usd);
    const p1 = await bal(PAYTO), h1 = await bal(HOLDER);
    const rc = o.r && (await rpc('eth_getTransactionReceipt', [o.r.hash]));
    const log = rc && (rc.logs || []).find((l) => l.address.toLowerCase() === USDC.toLowerCase() && l.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef');
    ok(`${label}: OWH.transfer() resolved {confirmed:true} and the receipt says success`, !!o.r && o.r.confirmed === true && rc && rc.status === '0x1', JSON.stringify(o).slice(0, 200));
    ok(`${label}: PAYTO (osoartist.eth) gained EXACTLY ${units} units (${Number(units) / 1e6} USDC)`, p1 - p0 === units, String(p1 - p0));
    ok(`${label}: the giver lost exactly the same amount (nothing skimmed, nothing extra)`, h0 - h1 === units, String(h0 - h1));
    ok(`${label}: the USDC Transfer log is from=giver → to=PAYTO · value=${units}`, !!log && '0x' + log.topics[1].slice(26) === HOLDER.toLowerCase() && '0x' + log.topics[2].slice(26) === PAYTO.toLowerCase() && BigInt(log.data) === units);
  }
  { const p0 = await bal(PAYTO); const o = await give(POOR, 10);
    ok('a wallet with no USDC → stopped by the balance preflight BEFORE any transaction (owh:"balance")', o.owh === 'balance' && /0\.00 USDC/.test(o.err || ''), JSON.stringify(o));
    ok('…and PAYTO did not change', (await bal(PAYTO)) === p0); }
  { // a holder who has USDC but is asked for more than they hold: the node itself would revert — we must stop first
    const rich = await bal(HOLDER); const o = await give(HOLDER, Number(rich) / 1e6 + 1000);
    ok('asking for more than the wallet holds → stopped before the wallet prompt', o.owh === 'balance', JSON.stringify(o).slice(0, 160)); }
  { // and WITHOUT the preflight (a wallet that cannot eth_call) the chain itself refuses → we surface it, we never claim success
    const o = await page.evaluate(async ({ POOR, USDC, PAYTO }) => {
      const base = window.mk(POOR); const prov = { request: async (a) => { if (a.method === 'eth_call') throw new Error('unsupported'); return base.request(a); } };
      try { const r = await OWH.transfer(prov, { usd: 10, payTo: PAYTO, usdc: USDC, chain: 8453 }); return { r }; } catch (e) { return { err: String(e.message) }; }
    }, { POOR, USDC, PAYTO });
    ok('no preflight + empty wallet → the chain refuses (revert) and OWH reports an error, never a gift', !!o.err && !o.r, JSON.stringify(o).slice(0, 200)); }
} catch (e) { fail++; console.log('  ✗ harness: ' + e.message); }
finally { try { if (browser) await browser.close(); } catch {} proc.kill('SIGKILL'); }
console.log(`\n${pass} passed, ${fail} failed${fail ? '' : ' — fork proof: the PLAIN button moves exactly the chosen USDC to osoartist.eth on Base'}`);
process.exit(fail ? 1 : 0);
