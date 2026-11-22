# FRAME-SPEC — the frame.json dataset (osoframes/0.1)

## 8 · Dataset (frame.json, schema `osoframes/0.1`)
```json
{
  "$schema": "https://frames.opensourceorchestra.org/schema/frame-0.1.json",
  "frame": "osoframes/0.1",
  "id": "oso-universe",
  "name": "The Open Source Orchestra universe",
  "credit": { "add": [] },
  "license": { "data": "CC-BY-SA-4.0", "code": "AGPL-3.0-or-later" },
  "strings": { },
  "slots": {
    "top-left":     [ {"kind":"globe"} ],
    "left":         [ {"kind":"theater", ...}, {"kind":"door","emoji":"🎼","label":"Songbook","href":"…","tip":"…","anim":"bob"} ],
    "bottom-left":  [ {"kind":"pill","emoji":"🦄","title":"Devcon IX · Lisbon","sub":"12–14 October 2027","href":"…","dismiss":true} ],
    "top-left":     [ {"kind":"globe"}, {"kind":"tour","emoji":"🌺","pin":true} ],
    "top-right":    [ {"kind":"door","emoji":"🌊","label":"Blessing Pool","pin":true, ...}, {"kind":"door","emoji":"🎻", ...} ],
    "right":        [ {"kind":"totem", ...}, {"kind":"door", ...} ],
    "bottom-right": [ {"kind":"chat", ...}, {"kind":"radio", ...} ],
    "overlay":      [ {"kind":"signature","src":"media/signature.svg","at":"bottom-right","by":"Shaka Lei Kaumaka"} ]
  }
}
```
Item kinds (v0.1): `door` · `pill` · `globe` · `theater` · `totem` · `chat` · `radio` · `signature` · `tour`. Every item may carry `id`, `tip` (tour caption), `unless`, `hideOnMobile`, `pin` (v0.1.3: stays on phones — the top corners).
- `door`: `emoji, label, href, tip, anim ∈ {bob, sway, spin, pulse, flutter, none}, newTab?` → `<a>` with `aria-label` that STARTS WITH the visible text (label-in-name).
- `theater`: `label, href (the full theater door), channels (URL of a channels.json like https://osodaomeet.opensourceorchestra.org/data/channels.json, or an inline array), video (walkthrough {src, poster, captions, duration})`. Button = small animated CRT TV ("THEATER" under it). Dialog = channel list (only `consent.status == published_with_consent` or inline items marked `consent:true`) + player (`<video controls preload="none">` / `<audio>`; YouTube via youtube-nocookie iframe only on click) + "open the full theater ↗".
- `totem`: `label, hub, route:"prefix", faces:[{k,n,e,c}]` (the six faces of myagentohana.com: shaka 🤙 #ffb443 · oso 🎻 #ff7eb6 · deva 🦄 #c792ea · crops 🌿 #2f9e6f · kala 🪕 #f7d794 · oke 💙 #4fc3f7). A stacked mini-totem (carved wood look, 26–30px faces, name on hover/focus). Tap a face → `chat:open` with `{hub, face:k, name:n, emoji:e, color:c, storage:'totem'}`; the hub routes by text prefix `🗿[face:<k>] ` (hub: `https://ohana-chat.shakaverse.workers.dev`, CORS `*`).
- `chat`: `label ("Talk to OSO"), name, emoji, hub ("https://chat.opensourceorchestra.org"), greeting, storage ("oso")` → gold FAB pill bottom-right (+ ✕ that bows out to a tiny emoji). Drawer = pit-chat-protocol client (see §8.1).
- `radio`: `label, tracks:[{title, artist, src, credit, license}], live:{status, page}` → compact dock (▶ play/pause, title, next, ↓ download, ✕ → tiny 📻). `preload="none"`. Live status fetched only when the dock is opened/played; if `on_air` → a LIVE badge linking to the live page.
- `globe`: `src` (default `https://lang.opensourceorchestra.org/lang.js`). If lang.js is already on the page do nothing; else inject it. Reserve the top-left.
- `signature`: `src, at, by, duration` (see §5).
- `tour`: `emoji 🌺, label, video {src, poster, captions, duration}` — v0.1.3: the ceremony button, always top-left under the globe (pinned on phones). The spoken passages live in the top-level `ceremony` object: `{base, ext, audio, credits, voice, license, say: {<item id or welcome|credit|sheet|closing>: "the words"}}`; a clip is `base/<key>.<ext>`, the caption shows the same words; without a clip a step shows its `tip`. Audio plays only after the visitor's tap.

### 8.1 Chat laws (from 15 Nov chat-refresh fix — MANDATORY, `/shared/kb/lessons/chat-refresh-bug-2026-11-15.md`)
### 8.1 Chat laws (from 15 Nov chat-refresh fix — MANDATORY, `/shared/kb/lessons/chat-refresh-bug-2026-11-15.md`)
Endpoints: `POST {hub}/send {session, text, name}` · `GET {hub}/poll?session=S&after=N&wait=25` → `{messages:[{seq, role, text, ...}], cursor?, stale?}` (read the real hub code in `/workspace/ohana-chat/worker.js` + `/workspace/oso-chat/` before coding).
1. **Per-hub storage keys** `osof:chat:<hubhost>:<face|main>:sess|after` — never reuse keys across hubs.
2. **STALE-CURSOR**: `reconcile()` once per load (poll `after=0` once, pull the stored cursor back if it is above the session max); `heal(d)` adopts `{stale, cursor}`.
3. **WAKE LAW**: 32 s abort timer; `visibilitychange`/`focus`/`pageshow`/`online` → `kick()`; 45 s heartbeat restarts a dead chain.
4. **SINGLE-FLIGHT**: exactly one poll chain; a wake only aborts the in-flight request; the chain re-arms itself.
5. **wait=25** (never `timeout`). **Echo law**: each visitor line drawn once (local echo, de-dupe the hub echo by seq/text).
6. Connect only when the drawer opens. Honest note in the drawer: these are AI agents of the ʻohana (machines), they answer from Taurus, replies may take a moment, conversations may be reviewed.
7. Text from the hub is TEXT (escape; linkify http(s) only).

## 9 · Gates (nothing ships without them)
