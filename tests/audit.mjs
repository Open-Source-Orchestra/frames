#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later · Copyright (C) 2026 Shaka Lei Kaumaka / Open Source Orchestra and the AI ʻohana
// STAY-IN-PLACE live audit (v0.1.5, 23 Nov 2026 — Shaka: "i want them to stay in place and automatically minimize or close with the
// tiny x if it ever covers text"). For every framed door, desktop + phone, THREE probes (top of the page · scrolled · scrolled back):
//   ✗ MOVED   a zone's anchored sides changed, or a piece's box changed between probes (a folded piece keeps its box)
//   ✗ TEXT    an unfolded piece sits on the page's words (or its dot sits on a page control)
//   ✗ SELF    two pieces of the frame sit on each other
//   ✗ SIDE    a rail landed on the wrong side (page CSS leaked into our <nav> zones)
// Exit 1 when anything is flagged. usage: node tests/audit.mjs [--hosts FILE] [--only host] [--out DIR] [--par 4] [--path /]
//   [--override 'oso-frames="<version-id>"']   (serve a staged Worker version through the Cloudflare-Workers-Version-Overrides header)
import { readFileSync, writeFileSync, mkdirSync, appendFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const HOSTS_FILE = arg('--hosts', join(HERE, 'audit-hosts.txt'));
const ONLY = arg('--only', null);
const OUT = arg('--out', join(HERE, '..', 'audit-out'));
const PAR = +arg('--par', 4);
const PATH = arg('--path', '/');
const OVERRIDE = arg('--override', null);
mkdirSync(OUT + '/shots', { recursive: true });
const defaultHosts = ['opensourceorchestra.org', 'publicinform.com', 'shakaleikaumaka.com', 'blessingpool.com', 'myagentohana.com'];
const hosts = (existsSync(HOSTS_FILE) ? readFileSync(HOSTS_FILE, 'utf8').split('\n').map((s) => s.trim()).filter((s) => s && !s.startsWith('#')) : defaultHosts).filter((h) => !ONLY || h === ONLY || h === ONLY.replace(/^https?:\/\//, '').split('/')[0]);
const VIEWS = [{ name: 'desktop', w: 1440, h: 900 }, { name: 'phone', w: 390, h: 844, mobile: true }];
async function loadPlaywright() {
  try { return await import('playwright'); } catch (e) { /* next */ }
  for (const r of ['/usr/lib/node_modules/', '/usr/local/lib/node_modules/']) { try { return createRequire(r)('playwright'); } catch (e) { /* next */ } }
  throw new Error('playwright not found');
}
const { chromium } = await loadPlaywright();

// runs inside the page: mirrors core.js textUnder() + ctrlUnder(); reports zones, pieces, words-under, self overlaps, side leaks
const PROBE = `(() => {
  const root = document.getElementById('oso-frames');
  const vw = innerWidth, vh = innerHeight;
  const out = { ready: !!(root && root.hasAttribute('data-osof-ready')), ver: window.OSOFrames && window.OSOFrames.version, mode: root && root.getAttribute('data-mode'), off: !!(root && root.hasAttribute('data-osof-off')), asleep: root && root.getAttribute('data-osof-asleep'), scrollY: Math.round(scrollY), zones: {}, items: [], textHits: [], ctrlHits: [], selfHits: [], sideLeaks: [] };
  if (!root) return out;
  const ours = (a) => root.contains(a) || a.id === 'olelo' || a.id === 'oso-frames';
  const ownText = (a) => { let n = 0; for (const c of a.childNodes) if (c.nodeType === 3) n += (c.nodeValue || '').replace(/\\s+/g, ' ').trim().length; return n; };
  const TEXT_TAGS = { P: 1, LI: 1, H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1, BLOCKQUOTE: 1, PRE: 1, TD: 1, TH: 1, DT: 1, DD: 1, FIGCAPTION: 1, LABEL: 1, SUMMARY: 1, A: 1, SPAN: 1, SMALL: 1, EM: 1, STRONG: 1, B: 1, I: 1, CODE: 1 };
  const isBubble = (a) => { try { return a.matches('[class*="bubble"],[class*="caption"],[class*="speech"],[class*="balloon"],.cap,.kaaak,blockquote,figcaption,q,cite'); } catch (e) { return false; } };
  const textUnder = (x, y, size) => {
    const gx = [x + 2, x + size / 2, x + size - 2], gy = [y + 2, y + size / 2, y + size - 2];
    for (const px of gx) for (const py of gy) {
      if (px < 0 || py < 0 || px >= vw || py >= vh) continue;
      for (const el of document.elementsFromPoint(px, py)) {
        if (el === document.body || el === document.documentElement) continue;
        for (let a = el; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
          if (ours(a)) break;
          const cs = getComputedStyle(a);
          if (cs.visibility === 'hidden' || +cs.opacity < 0.05) break;
          const tl = (TEXT_TAGS[a.tagName] || isBubble(a)) ? (a.innerText || '').replace(/\\s+/g, ' ').trim().length : ownText(a);
          if (tl > 2) { const r = a.getBoundingClientRect(); if (r.width * r.height > 200 && r.width * r.height < vw * vh * 0.45) return { tag: a.tagName, cls: String(a.className).slice(0, 40), text: (a.innerText || a.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 60) }; }
        }
      }
    }
    return null;
  };
  const ctrlUnder = (x, y, size) => {
    for (const [px, py] of [[x + 2, y + 2], [x + size / 2, y + size / 2], [x + size - 2, y + size - 2]]) {
      if (px < 0 || py < 0 || px >= vw || py >= vh) continue;
      for (const el of document.elementsFromPoint(px, py)) {
        if (el === document.body || el === document.documentElement) continue;
        for (let a = el; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
          if (ours(a)) break;
          const cs = getComputedStyle(a);
          if (cs.visibility === 'hidden' || +cs.opacity < 0.05 || cs.pointerEvents === 'none') break;
          if (cs.position === 'fixed' || cs.position === 'sticky') { const r = a.getBoundingClientRect(); if (r.width * r.height < vw * vh * 0.35) return { tag: a.tagName, id: a.id, cls: String(a.className).slice(0, 40) }; break; }
        }
      }
    }
    return null;
  };
  const vis = (e) => { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false; const r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4 && r.right > 0 && r.bottom > 0 && r.left < vw && r.top < vh; };
  const R = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; };
  for (const z of root.querySelectorAll('.osof-slot')) {
    const s = z.getAttribute('data-slot'); if (s === 'overlay') continue;
    const r = z.getBoundingClientRect(); const cs = getComputedStyle(z);
    const kids = [...z.children].filter(vis);
    out.zones[s] = { rect: R(z), kids: kids.length, top: cs.top, bottom: cs.bottom, left: cs.left, right: cs.right, styleBottom: z.style.bottom || '' };
    if (kids.length) {
      const mid = r.left + r.width / 2;
      if (/right/.test(s) && mid < vw / 2) out.sideLeaks.push(s + ' at x=' + Math.round(r.left));
      if (/left/.test(s) && mid > vw / 2) out.sideLeaks.push(s + ' at x=' + Math.round(r.left));
    }
  }
  const rects = [];
  for (const w of root.querySelectorAll('.osof-slot > .osof-item')) {
    if (w.hidden || w.getAttribute('data-osof-kind') === 'globe' || !w.getClientRects().length) continue;
    const box = R(w); if (box.w < 2 || box.h < 2) continue;
    const folded = w.hasAttribute('data-osof-folded'), gone = w.hasAttribute('data-osof-gone');
    const shown = gone ? null : folded ? (w.querySelector('.osof-idot') && getComputedStyle(w.querySelector('.osof-idot')).display !== 'none' ? w.querySelector('.osof-idot') : (w.querySelector('[data-mini="1"] .osof-rd-mini, [data-mini="1"] .osof-fab-mini') || null)) : (w.querySelector('.osof-btn, .osof-credit, .osof-pillbox, .osof-totem, .osof-tv, .osof-chatwrap, .osof-radio, button, a') || w);
    const sr = shown ? R(shown) : null;
    const kind = w.getAttribute('data-osof-kind'), id = w.getAttribute('data-osof-id') || '';
    const rec = { kind, id, box, folded, gone, shown: sr };
    out.items.push(rec);
    if (!shown || !sr || sr.w < 2) continue;
    rects.push({ rec, r: shown.getBoundingClientRect(), e: w });
    const S = Math.max(6, Math.min(12, Math.floor(Math.min(sr.w, sr.h) / 2)));
    if (folded) { const c = ctrlUnder(sr.x, sr.y, S) || ctrlUnder(sr.x + sr.w - S, sr.y + sr.h - S, S); if (c) out.ctrlHits.push({ item: kind + '#' + id, at: [sr.x, sr.y], under: c }); continue; }
    const xs = [], ys = [];
    for (let x = sr.x; x <= sr.x + sr.w - S; x += Math.max(S, (sr.w - S) / 4)) xs.push(x); xs.push(sr.x + sr.w - S);
    for (let y = sr.y; y <= sr.y + sr.h - S; y += Math.max(S, (sr.h - S) / 4)) ys.push(y); ys.push(sr.y + sr.h - S);
    let hit = null;
    outer: for (const x of xs) for (const y of ys) { hit = textUnder(x, y, S); if (hit) break outer; }
    if (hit) out.textHits.push({ item: kind + '#' + id, at: [sr.x, sr.y], under: hit });
  }
  const sb = root.querySelector('.osof-sheetbtn'); if (sb && vis(sb)) { const r = R(sb); out.items.push({ kind: 'sheet', id: '', box: r, folded: sb.classList.contains('osof-fold'), shown: r }); if (!sb.classList.contains('osof-fold')) { const S = 12; const hit = textUnder(r.x, r.y, S) || textUnder(r.x + r.w - S, r.y + r.h - S, S); if (hit) out.textHits.push({ item: 'sheet', at: [r.x, r.y], under: hit }); } }
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    const ix = Math.max(0, Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left)), iy = Math.max(0, Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top));
    const inter = ix * iy, small = Math.min(a.r.width * a.r.height, b.r.width * b.r.height);
    if (small > 0 && inter / small > 0.2) out.selfHits.push((a.rec.kind + '#' + a.rec.id) + ' × ' + (b.rec.kind + '#' + b.rec.id) + ' ' + Math.round(inter / small * 100) + '%');
  }
  return out;
})()`;

const b = await chromium.launch();
const results = [];
const jsonl = OUT + '/audit.jsonl'; writeFileSync(jsonl, '');
function diffProbes(p0, p1) {
  const moved = [];
  for (const s of Object.keys(p0.zones || {})) { const A = p0.zones[s], B = p1.zones[s]; if (!B || !A.kids || !B.kids) continue; for (const k of ['top', 'bottom', 'left', 'right']) if (A[k] !== B[k]) moved.push(`${s}.${k} ${A[k]}→${B[k]}`); }
  const by = {}; for (const it of p0.items || []) by[it.kind + '#' + it.id] = it;
  for (const it of p1.items || []) { const o = by[it.kind + '#' + it.id]; if (!o || it.kind === 'credit' || it.kind === 'sheet') continue; const a = o.box, c = it.box; if (Math.abs(a.x - c.x) > 2 || Math.abs(a.y - c.y) > 2 || Math.abs(a.w - c.w) > 2 || Math.abs(a.h - c.h) > 2) moved.push(`${it.kind}#${it.id} ${a.x},${a.y},${a.w},${a.h}→${c.x},${c.y},${c.w},${c.h}`); }
  return moved;
}
async function one(host, v) {
  const ctx = await b.newContext({ viewport: { width: v.w, height: v.h }, isMobile: !!v.mobile, hasTouch: !!v.mobile, deviceScaleFactor: 1, userAgent: v.mobile ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 ohana-frames-audit' : undefined, extraHTTPHeaders: OVERRIDE ? { 'Cloudflare-Workers-Version-Overrides': OVERRIDE } : {} });
  const page = await ctx.newPage();
  const rec = { host, view: v.name, status: null, error: null };
  const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));
  try {
    const rsp = await page.goto('https://' + host + PATH, { waitUntil: 'load', timeout: 45000 });
    rec.status = rsp && rsp.status();
    try { await page.waitForSelector('#oso-frames[data-osof-ready]', { state: 'attached', timeout: 15000 }); } catch (e) { rec.noFrame = true; }
    await page.waitForTimeout(3500);
    await page.mouse.move(v.w / 2, v.h / 2);
    const p0 = await page.evaluate(PROBE);
    await page.evaluate(() => window.scrollBy(0, Math.min(Math.max(400, innerHeight * 0.6), Math.max(0, document.documentElement.scrollHeight - innerHeight))));
    await page.waitForTimeout(900);
    const p1 = await page.evaluate(PROBE);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(900);
    const p2 = await page.evaluate(PROBE);
    rec.ver = p0.ver; rec.mode = p0.mode; rec.off = p0.off; rec.asleep = p0.asleep;
    rec.moved = diffProbes(p0, p1).concat(diffProbes(p0, p2).map((m) => 'back:' + m));
    rec.textHits = [].concat(p0.textHits, p1.textHits, p2.textHits);
    rec.ctrlHits = [].concat(p0.ctrlHits, p1.ctrlHits, p2.ctrlHits);
    rec.selfHits = [].concat(p0.selfHits, p1.selfHits, p2.selfHits);
    rec.sideLeaks = [].concat(p0.sideLeaks, p1.sideLeaks);
    rec.folded = { top: p0.items.filter((i) => i.folded).length, scrolled: p1.items.filter((i) => i.folded).length };
    rec.pageErrors = errs;
    rec.flag = rec.moved.length || rec.textHits.length || rec.ctrlHits.length || rec.selfHits.length || rec.sideLeaks.length;
    await page.evaluate(() => window.scrollBy(0, Math.min(Math.max(400, innerHeight * 0.6), Math.max(0, document.documentElement.scrollHeight - innerHeight)))); await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/shots/${host}-${v.name}.png`, fullPage: false }).catch(() => {});
  } catch (e) { rec.error = String(e && e.message || e).slice(0, 160); }
  await ctx.close();
  appendFileSync(jsonl, JSON.stringify(rec) + '\n');
  results.push(rec);
  const mark = rec.error ? '⚠' : rec.noFrame ? '·' : rec.flag ? '✗' : '✓';
  console.log(`${mark} ${host} ${v.name} v${rec.ver || '-'} mode=${rec.mode || '-'} moved=${(rec.moved || []).length} text=${(rec.textHits || []).length} ctrl=${(rec.ctrlHits || []).length} self=${(rec.selfHits || []).length} side=${(rec.sideLeaks || []).length} folded=${rec.folded ? rec.folded.top + '→' + rec.folded.scrolled : '-'}${rec.error ? ' ' + rec.error : ''}`);
  if (rec.flag) { for (const m of rec.moved) console.log('    MOVED ' + m); for (const t of rec.textHits) console.log(`    TEXT  ${t.item} @${t.at} on “${t.under.text}”`); for (const t of rec.ctrlHits) console.log(`    CTRL  ${t.item} @${t.at} on ${t.under.tag}#${t.under.id}`); for (const s of rec.selfHits) console.log('    SELF  ' + s); for (const s of rec.sideLeaks) console.log('    SIDE  ' + s); }
}
const jobs = []; for (const h of hosts) for (const v of VIEWS) jobs.push([h, v]);
let i = 0;
await Promise.all(Array.from({ length: PAR }, async () => { while (i < jobs.length) { const [h, v] = jobs[i++]; await one(h, v); } }));
await b.close();
const flagged = results.filter((r) => r.flag), errs = results.filter((r) => r.error), none = results.filter((r) => r.noFrame);
let md = `# STAY-IN-PLACE live audit · ${new Date().toISOString()}${OVERRIDE ? ' · override ' + OVERRIDE : ''}\n\n${hosts.length} hosts × ${VIEWS.length} views = ${results.length} loads · flagged ${flagged.length} · no frame ${none.length} · errors ${errs.length}\n\n`;
md += '| host | view | v | mode | moved | text under | dot on control | self | side |\n|---|---|---|---|---|---|---|---|---|\n';
for (const r of results.sort((a, c) => a.host.localeCompare(c.host) || a.view.localeCompare(c.view))) {
  md += `| ${r.host} | ${r.view} | ${r.ver || '-'} | ${r.error ? '⚠ ' + r.error : r.noFrame ? 'no frame' : r.mode} | ${(r.moved || []).join('; ')} | ${(r.textHits || []).map((t) => `${t.item} on “${t.under.text}”`).join('; ')} | ${(r.ctrlHits || []).map((t) => `${t.item} on ${t.under.tag}#${t.under.id}`).join('; ')} | ${(r.selfHits || []).join('; ')} | ${(r.sideLeaks || []).join('; ')} |\n`;
}
writeFileSync(OUT + '/REPORT.md', md);
console.log(`\nflagged ${flagged.length} · no frame ${none.length} · errors ${errs.length} → ${OUT}/REPORT.md`);
process.exit(flagged.length || errs.length ? 1 : 0);
