#!/usr/bin/env node
// Open Source Orchestra Frames · tests/serve.mjs — a tiny static server for the dev page and the e2e (no dependencies)
// SPDX-License-Identifier: AGPL-3.0-or-later
//   node tests/serve.mjs [port]          → serves the repo root on http://127.0.0.1:<port>/  (open /tests/dev.html)
//   import { serve } from './serve.mjs'  → await serve({ port: 0 }) → { url, close }
// Dev-page helpers (this server only): /tests/dev.html?ds=oso|minimal|universe swaps the dataset on the
// <script data-frame>; ?inline=<name> embeds that dataset inline (<script type="application/json" id="oso-frame">);
// ?page=oso adds stand-ins for the flagship's own chat button (#oso-fab) and jukebox (#miniplayer).
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = normalize(join(dirname(fileURLToPath(import.meta.url)), '..'));
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.vtt': 'text/vtt; charset=utf-8', '.mp3': 'audio/mpeg', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8'
};
const DATASETS = new Set(['universe', 'oso', 'minimal']);
const FLAGSHIP_STANDINS = `
<div id="oso-fabwrap" style="position:fixed;right:22px;bottom:96px;z-index:60"><button id="oso-fab" type="button" style="display:flex;align-items:center;gap:9px;background:linear-gradient(135deg,#e8c476,#c9962e);color:#241a05;border:none;border-radius:50px;padding:10px 20px 10px 14px;font:700 15px system-ui,sans-serif;cursor:pointer">🎻 Talk to OSO</button></div>
<div id="miniplayer" style="position:fixed;bottom:14px;right:14px;z-index:99999;display:flex;align-items:center;gap:8px;background:rgba(23,17,38,.92);border:1px solid #f0b429;border-radius:999px;padding:8px 16px;color:#f0e6c8;font:600 13px system-ui,sans-serif">▶ TAP TO PLAY · Butterflies and Love</div>`;

async function devPage(path, query) {
  let html = await readFile(path, 'utf8');
  const ds = query.get('ds'), inline = query.get('inline');
  if (ds && DATASETS.has(ds)) html = html.replace('<script src="../frames.js"', `<script src="../frames.js" data-frame="../frames/${ds}.json"`);
  if (inline && DATASETS.has(inline)) {
    const json = (await readFile(join(ROOT, 'frames', inline + '.json'), 'utf8')).replace(/</g, '\\u003c');
    html = html.replace('<script src="../frames.js"', `<script type="application/json" id="oso-frame">${json}</script>\n<script src="../frames.js"`);
  }
  if (query.get('page') === 'oso') html = html.replace('</body>', FLAGSHIP_STANDINS + '\n</body>');
  return html;
}

export function serve({ port = 0, host = '127.0.0.1', root = ROOT } = {}) {
  const server = http.createServer(async (req, res) => {
    try {
      const u = new URL(req.url, 'http://local');
      let p = normalize(join(root, decodeURIComponent(u.pathname)));
      if (p !== root && !p.startsWith(root + sep)) { res.writeHead(403).end('forbidden'); return; }
      let st = await stat(p).catch(() => null);
      if (st && st.isDirectory()) { p = join(p, 'index.html'); st = await stat(p).catch(() => null); }
      if (!st || !st.isFile() || /(^|[\\/])\.[^\\/]/.test(p.slice(root.length))) { res.writeHead(404, { 'content-type': 'text/plain' }).end('not found'); return; }
      const type = TYPES[extname(p).toLowerCase()] || 'application/octet-stream';
      const body = p.endsWith(join('tests', 'dev.html')) ? await devPage(p, u.searchParams) : await readFile(p);
      res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store', 'access-control-allow-origin': '*' });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (e) { res.writeHead(500, { 'content-type': 'text/plain' }).end(String(e && e.message || e)); }
  });
  return new Promise((resolve) => server.listen(port, host, () => {
    const a = server.address();
    resolve({ url: `http://${host}:${a.port}/`, server, close: () => new Promise((r) => server.close(() => r())) });
  }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1])) {
  const port = Number(process.argv[2] || 8787);
  serve({ port }).then(({ url }) => console.log(`🎻 frames dev server: ${url}tests/dev.html  (Ctrl+C to stop)`));
}
