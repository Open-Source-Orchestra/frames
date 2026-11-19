// SPDX-License-Identifier: AGPL-3.0-or-later
// Records the first-visit walkthrough video of a framed page (Playwright screencast) with
// burned-in captions, then writes media/walkthrough.{mp4,jpg,vtt} via ffmpeg.
// Usage: node tools/make-walkthrough.mjs --url http://127.0.0.1:8790/?frame=fresh --out media [--music path.mp3]
// Safety: it never sends a chat message; every POST and every hub poll is aborted (fail closed).
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, renameSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch (e) { pw = require(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim() + '/playwright'); }
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const URL_ = arg('--url', 'http://127.0.0.1:8790/?frame=fresh');
const OUT = arg('--out', 'media');
const MUSIC = arg('--music', '');
const W = 1280, H = 720;
const tmp = join(OUT, '.rec'); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });

const browser = await pw.chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: tmp, size: { width: W, height: H } }, reducedMotion: 'no-preference' });
const page = await ctx.newPage();
const blocked = [];
await page.route('**/*', (route) => {
  const r = route.request(), u = r.url();
  const hub = /workers\.dev|chat\.opensourceorchestra\.org|\/api\/chat|\/poll|\/send|\/redeem/.test(u);
  if (r.method() !== 'GET' || hub) { blocked.push(r.method() + ' ' + u); return route.abort(); }
  return route.continue();
});
const errors = []; page.on('pageerror', (e) => errors.push(String(e)));

const cues = []; const t0 = Date.now(); const now = () => (Date.now() - t0) / 1000;
async function caption(text, secs) {
  const start = now();
  await page.evaluate((t) => {
    let c = document.getElementById('__wt_cap');
    if (!c) {
      c = document.createElement('div'); c.id = '__wt_cap';
      c.style.cssText = 'position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:2147483647;max-width:min(880px,86vw);padding:12px 22px;border-radius:16px;background:rgba(10,8,24,.86);color:#fbe2a0;font:600 22px/1.35 system-ui,sans-serif;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.5);border:1px solid rgba(251,226,160,.35);transition:opacity .35s;pointer-events:none';
      document.documentElement.appendChild(c);
    }
    c.style.opacity = t ? '1' : '0'; if (t) c.textContent = t;
  }, text);
  await page.waitForTimeout(secs * 1000);
  if (text) cues.push({ start, end: now(), text });
}
const clickByName = async (re) => { const b = page.getByRole('button', { name: re }).first(); if (await b.count()) { await b.click({ timeout: 3000 }).catch(() => {}); return true; } return false; };
const esc = () => page.keyboard.press('Escape');

await page.goto(URL_, { waitUntil: 'domcontentloaded' });
await caption('Welcome to the Open Source Orchestra universe ✨', 2.2);
await caption('On your first visit, the steward signs the page — once', 3.4);
await caption('Then every button around the edge says what it does — once, then rests', 14);
await caption('', 0.4);
if (await clickByName(/^theater/i)) { await caption('📺 The theater: films and recordings, each with credit and consent', 4.2); await esc(); }
if (await clickByName(/talk to shaka|shaka/i)) { await caption('🗿 The totem: six AI agents of the ʻohana — tap a face to talk (they are machines, and say so)', 4.6); await esc(); }
if (await clickByName(/talk to oso/i)) { await caption('💬 A live line to an agent — it connects only when you open it', 3.6); await esc(); }
await caption('📻 The radio plays consented songs — nothing loads until you press play', 3.4);
await page.evaluate(() => window.OSOFrames && window.OSOFrames.outline && window.OSOFrames.outline(true));
await caption('✏️ The frame is one open dataset: every button is one line of data', 4.4);
await page.evaluate(() => window.OSOFrames && window.OSOFrames.outline && window.OSOFrames.outline(false));
await caption('🍴 Fork it: github.com/Open-Source-Orchestra/frames · AGPL-3.0 + credit · CC BY-SA 4.0', 4.2);
await caption('🎁 A holiday gift from the AI ʻohana · Open Source Orchestra', 3);
await page.screenshot({ path: join(OUT, 'walkthrough.jpg'), type: 'jpeg', quality: 82 });
await ctx.close(); await browser.close();

const webm = readdirSync(tmp).find((f) => f.endsWith('.webm'));
if (!webm) throw new Error('no recording');
const vf = 'scale=1280:720,format=yuv420p';
const args = ['-y', '-loglevel', 'error', '-i', join(tmp, webm)];
const dur = now();
if (MUSIC && existsSync(MUSIC)) args.push('-i', MUSIC, '-filter_complex', `[1:a]volume=0.22,afade=t=in:st=0:d=2,afade=t=out:st=${Math.max(0, dur - 3).toFixed(1)}:d=3[a]`, '-map', '0:v', '-map', '[a]', '-shortest', '-c:a', 'aac', '-b:a', '128k');
args.push('-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-movflags', '+faststart', join(OUT, 'walkthrough.mp4'));
execFileSync('ffmpeg', args);
const ts = (s) => { const h = String(Math.floor(s / 3600)).padStart(2, '0'), m = String(Math.floor(s / 60) % 60).padStart(2, '0'), x = (s % 60).toFixed(3).padStart(6, '0'); return `${h}:${m}:${x}`; };
writeFileSync(join(OUT, 'walkthrough.vtt'), 'WEBVTT\n\n' + cues.map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${c.text}\n`).join('\n'));
rmSync(tmp, { recursive: true, force: true });
console.log(JSON.stringify({ seconds: Math.round(dur), cues: cues.length, blocked: blocked.length, errors }, null, 1));
