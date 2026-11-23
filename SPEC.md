# Open Source Orchestra Frames — build SPEC v0.1 (the contract every builder follows)

*16 Nov 2026 · owner: sysadmin 🫡 · repo working copy: `/shared/frames` (git) · public home (target): `https://frames.opensourceorchestra.org/` (Worker + static assets) · future home on Shaka's wish list: osoframes.com · repo: `github.com/Open-Source-Orchestra/frames`*

> Shaka, 16 Nov 2026 (11:28–11:34 BKK): *"create the data set surrounding the entire screen open source and fully copy left licensed so people down the road not only have to credit our work with the ohana but they also have to keep their work open source … have the whole frame be covered on both left and right with great emojis or animated features like the theater that go to key parts of our universe and have multiple agents like the totem itself on the screen and for a brief moment you see my signature on the bottom right … signed in real time once … all the buttons animate or show a text box literally once and no more time so the visitor isn't distracted … a one time cross fade description of every button you can activate as one button … for first time visitors a walk through video how the UX in our universe works … oso frame all the doors and we start getting the rest of the world hyped on forking us and integrating their own custom open source orchestra frame … copy left so the ohana always holds credit and the open source flows to the whole world!! this is a major gift … this Holiday season!"*

## 0 · One sentence
A **frame** is everything around the edge of a screen. **Open Source Orchestra Frames** turns that ring into an open, living instrument (doors, a theater, a totem of agents, a radio, a language globe, a signature) from **one script tag** and **one open dataset** (`frame.json`). Copyleft: the credit travels and every fork stays open.

## 1 · Install (what a door / a forker writes)
```html
<script src="https://lang.opensourceorchestra.org/lang.js" async></script>   <!-- ʻŌlelo law: every page carries it -->
<script src="https://frames.opensourceorchestra.org/frames.js" data-frame="https://frames.opensourceorchestra.org/frames/universe.json" defer></script>
```
- `data-frame`: URL of the dataset. Default = `frames/universe.json` resolved against frames.js' own URL.
- Inline alternative: `<script type="application/json" id="oso-frame">{…}</script>` (wins over data-frame).
- `?frame=outline` on any page (or `OSOFrames.outline(true)`) = blueprint view (hand-drawn cyan lines + slot labels, echoing Shaka's markup).
- `?frame=fresh` = behave like a first-time visitor (ignores once-flags for this page view; does NOT clear them). For demos/tests/video.
- `?frame=off` = render nothing (escape hatch).

## 2 · Files
```
frames.js              built single file, no dependencies, readable, SPDX banner (what doors load)
src/core.js            boot · dataset load/validate · slots/layout engine · once-law · panels · tour · outline · credit · mobile sheet
src/pieces/door.js     emoji doors (+ "anim" variants), pills
src/pieces/globe.js    language globe = ensure lang.js present; reserve top-left
src/pieces/theater.js  animated CRT TV button + theater dialog (channels)
src/pieces/totem.js    mini-totem of agent faces (stacked, carved, SVG/CSS) → opens chat line per face
src/pieces/chat.js     pit-chat-protocol client (drawer) used by the chat FAB and the totem
src/pieces/radio.js    radio dock (consented playlist + LIVE PIT on-air link)
src/pieces/signature.js Shaka's signature drawn in real time ONCE (bottom-right)
build.mjs              concatenates src → frames.js (+ banner), prints size; `node build.mjs --check` = syntax gate
frames/universe.json   THE dataset: the Open Source Orchestra universe frame (CC BY-SA 4.0)
frames/oso.json        flagship variant for opensourceorchestra.org (same pieces, OSO-local doors)
frames/minimal.json    smallest useful frame for forkers
schema/frame-0.1.json  JSON Schema of the dataset
media/                 signature.svg, tour video (mp4/webm/vtt/poster)
index.html             landing = the holiday gift + live frame + outline toggle + "fork it in 3 steps" + how it was built (receipts)
builder/index.html     "frame your door": edit a dataset in the browser → copy snippet / download frame.json
docs/                  FRAME-SPEC.md (dataset), FORK.md, HOW-IT-WAS-BUILT.md
tests/                 node unit tests + Playwright e2e (see §9)
LICENSE · LICENSES/ · NOTICE (§7(b)) · REUSE.toml · README.md · CONTRIBUTING.md · SECURITY.md · CHANGELOG.md · llms.txt
```

## 3 · Core API (the piece contract — pieces are written against THIS, nothing else)
`src/core.js` defines `window.OSOFrames` (alias `FRAMES` inside the bundle). The bundle is one IIFE: `core.js` first, then every `pieces/*.js` (each piece file is a plain block that calls `FRAMES.define(...)`), then `FRAMES.boot()`.

```js
FRAMES.version            // '0.1.0'
FRAMES.define(kind, factory)          // register a piece kind
// factory(ctx, item) → { el?: HTMLElement,            // the thing placed in the slot (button/feature). Optional for overlay-only pieces (signature)
//                        tour?: string|null,          // one-line description used by the cross-fade tour (falls back to item.tip || item.label)
//                        open?(): void, close?(): void }
FRAMES.open(id) / FRAMES.outline(bool) / FRAMES.tour() / FRAMES.reset()   // reset = clear this frame's once-flags + stored dismissals
FRAMES.on(name, fn) / FRAMES.emit(name, detail)                           // tiny event bus (also used by pieces)
```
`ctx` (one per item):
| member | meaning |
|---|---|
| `ctx.data` | the whole dataset (read-only) |
| `ctx.item` | this item (read-only) |
| `ctx.slot` | slot name (`top-left`,`left`,`bottom-left`,`bottom-right`,`right`,`top-right`, `overlay`) |
| `ctx.h(tag, attrs, ...kids)` | hyperscript helper; `attrs` supports `class`, `style` (string), `on:{click:fn}`, `aria-*`, `data-*`, booleans; kids = nodes/strings (strings are TEXT, never HTML) |
| `ctx.css(id, cssText)` | inject a `<style data-osof="id">` once. ALL selectors must start with `#oso-frames` |
| `ctx.once(key)` | `true` the FIRST time ever for this browser + frame `id` + major version (`localStorage 'osof:once:<frameId>:<key>'`), else `false`. `?frame=fresh` → always true. Never throws (private mode → behave as first time once per page view) |
| `ctx.store(ns)` | `{get(k), set(k,v), del(k)}` JSON in localStorage under `osof:<ns>:<k>`; never throws |
| `ctx.reduced` | `prefers-reduced-motion: reduce` |
| `ctx.mobile` | narrow layout active (`max-width: 720px` or coarse pointer + height < 560) |
| `ctx.panel({id, title, wide, onClose})` | returns `{root, body, head, open(opener), close(), isOpen()}`: one shared accessible dialog shell (role=dialog, aria-modal, labelled by title, focus trap, Esc closes, focus returns to opener, only ONE panel open at a time, scroll-locks nothing) |
| `ctx.t(key, fallback)` | UI string (en default; dataset `strings` may override) |
| `ctx.resolve(url)` | resolve relative URL against the dataset URL |
| `ctx.base` | base URL of frames.js (for media) |
| `ctx.emit/on` | = FRAMES.emit/on |
| `ctx.credit` | the attribution text (see §7) |

**Events used across pieces:** `chat:open {line}` (line = `{hub, face?, name, emoji, color?, greeting?, storage}`) · `theater:open {channel?}` · `radio:open` · `frame:ready` · `tour:start` / `tour:end`.

## 4 · Layout (the ring)
- Root: `<div id="oso-frames" class="osof" data-osof-version="0.1.0">` appended to `<body>`. **Light DOM** (so the ʻŌlelo bridge / Google Translate can translate labels), every selector scoped under `#oso-frames`, with a local reset (`#oso-frames *{box-sizing:border-box}` + explicit fonts). Brand names in `<span translate="no">` (Open Source Orchestra, ʻohana, Shaka Lei Kaumaka).
- Slots are fixed containers: `top-left` (globe lives here; lang.js draws its own button at top-left, we only reserve space), `left` rail (column, under top-left down to above bottom-left), `bottom-left` (pills + credit), `bottom-right` (chat FAB + radio dock), `right` rail, `top-right`.
- Rails: 46px round buttons, 10px gap, 10px from the edge (+ `env(safe-area-inset-*)`). If a rail's items don't fit the available height, the overflow goes into a final `⋯` button that opens a popover listing the rest (never a scrollbar).
- **Both rails are full**: the universe frame fills left and right from top to bottom (Shaka: "the whole frame covered on both left and right").
- Mobile (`ctx.mobile`): rails are hidden; ONE `🎻` "frame" button (top-right) opens a sheet (grid of every door + theater + totem faces); bottom-right keeps chat + radio mini. Signature + tour still once.
- z-index: frame 2147481000 · popovers 2147481500 · panels 2147482000 · tour captions 2147482500 · signature 2147482400.
- The frame never blocks the page: slot containers are `pointer-events:none`, their children `pointer-events:auto`.
- `unless` on any item: a CSS selector or `window.<name>`; if it matches on the page the item is skipped (adopt mode for doors that already carry a piece, e.g. `"unless":"window.__osoTV"`).

## 5 · THE ONE-TIME LAW (Shaka: "literally once and no more time so the visitor isn't distracted")
- Attention motion (entrance stagger, glow, wiggle, flying notes, TV flicker, totem blink, tip bubbles, signature, tour, video card) runs **at most once per browser** (`ctx.once`). After that the frame is STILL: **no `setInterval`, no infinite CSS animations, no loops**. Hover/focus feedback (user-initiated) is fine.
- First visit choreography (≈ 20 s total, never blocks clicks): t=0.3 s rails fade/slide in once (stagger 40 ms) → t≈1.2 s **signature** draws itself bottom-right (≈ 2.8 s), holds 1.2 s, fades → t≈5.5 s **tour**: a cross-fade of one caption per button (≈ 1.5 s each, 250 ms cross-fade, the button gets one soft glow), with a small `Skip ✕` (Esc also skips) → final card (6 s, then fades): "That was the frame. ✨ replays the tour any time · ▶ watch the 45-second walkthrough".
- The **✨ button** (right rail, second from top) replays the tour on demand = "every description, as one button".
- `prefers-reduced-motion`: no entrance motion; signature appears static for 1.5 s then fades; tour captions switch without movement.
- `?frame=fresh` forces first-visit behavior for one page view.

## 6 · Privacy + performance (CROPS)
- **Nothing connects until the visitor acts**: no hub calls, no audio/video bytes, no Google Translate, no status probes before a click (lang.js is loaded per the ʻŌlelo law; it is itself lazy). No cookies. localStorage only for once-flags, dismissals, chat sessions (namespaced `osof:`).
- frames.js: no dependencies; target ≤ 70 KB unminified; pieces build their dialogs on first open.
- Every external URL in the dataset is shown to the visitor as a normal link (no hidden beacons).

## 7 · Copyleft + credit (the gift's guarantee)
- Code: **AGPL-3.0-or-later** + **§7(b) attribution term** (NOTICE). Words, dataset, design, docs: **CC BY-SA 4.0**. Music/films in datasets: their performers' terms (consent law); the dataset carries `credit` + `license` per track/channel.
- Credit line (exact): **"Built on Open Source Orchestra Frames by Open Source Orchestra: Shaka Lei Kaumaka & the AI ʻohana (https://opensourceorchestra.org)"**.
- The frame ALWAYS renders a small credit mark (bottom-left edge, readable ≥ 4.5:1): `🎻 frame by the ʻohana` → links to the landing; its `title`/about popover carries the full credit line + license + source link. The dataset may ADD names (`credit.add`), never remove ours; core enforces it.
- Banner at the top of frames.js:
```
/*! Open Source Orchestra Frames v0.1.0 · https://github.com/Open-Source-Orchestra/frames
 *  SPDX-License-Identifier: AGPL-3.0-or-later · Copyright (C) 2026 Shaka Lei Kaumaka / Open Source Orchestra and the AI ʻohana
 *  AGPL §7(b): keep the credit "Built on Open Source Orchestra Frames by Open Source Orchestra: Shaka Lei Kaumaka & the AI ʻohana
 *  (https://opensourceorchestra.org)" visible in the frame. See NOTICE. Source of this exact file: https://github.com/Open-Source-Orchestra/frames */
```
- Honest scope (say it in README): copyleft binds the frame and works based on it; a site that merely loads the unmodified frame keeps its own license.

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
    "top-right":    [ {"kind":"door","emoji":"🎻", ...}, {"kind":"tour"} ],
    "right":        [ {"kind":"totem", ...}, {"kind":"door", ...} ],
    "bottom-right": [ {"kind":"chat", ...}, {"kind":"radio", ...} ],
    "overlay":      [ {"kind":"signature","src":"media/signature.svg","at":"bottom-right","by":"Shaka Lei Kaumaka"} ]
  }
}
```
Item kinds (v0.1): `door` · `pill` · `globe` · `theater` · `totem` · `chat` · `radio` · `signature` · `tour`. Every item may carry `id`, `tip` (tour caption), `unless`, `hideOnMobile`.
- `door`: `emoji, label, href, tip, anim ∈ {bob, sway, spin, pulse, flutter, none}, newTab?` → `<a>` with `aria-label` that STARTS WITH the visible text (label-in-name).
- `theater`: `label, href (the full theater door), channels (URL of a channels.json like https://osodaomeet.opensourceorchestra.org/data/channels.json, or an inline array), video (walkthrough {src, poster, captions, duration})`. Button = small animated CRT TV ("THEATER" under it). Dialog = channel list (only `consent.status == published_with_consent` or inline items marked `consent:true`) + player (`<video controls preload="none">` / `<audio>`; YouTube via youtube-nocookie iframe only on click) + "open the full theater ↗".
- `totem`: `label, hub, route:"prefix", faces:[{k,n,e,c}]` (the six faces of myagentohana.com: shaka 🤙 #ffb443 · oso 🎻 #ff7eb6 · deva 🦄 #c792ea · crops 🌿 #2f9e6f · kala 🪕 #f7d794 · oke 💙 #4fc3f7). A stacked mini-totem (carved wood look, 26–30px faces, name on hover/focus). Tap a face → `chat:open` with `{hub, face:k, name:n, emoji:e, color:c, storage:'totem'}`; the hub routes by text prefix `🗿[face:<k>] ` (hub: `https://ohana-chat.shakaverse.workers.dev`, CORS `*`).
- `chat`: `label ("Talk to OSO"), name, emoji, hub ("https://chat.opensourceorchestra.org"), greeting, storage ("oso")` → gold FAB pill bottom-right (+ ✕ that bows out to a tiny emoji). Drawer = pit-chat-protocol client (see §8.1).
- `radio`: `label, tracks:[{title, artist, src, credit, license}], live:{status, page}` → compact dock (▶ play/pause, title, next, ↓ download, ✕ → tiny 📻). `preload="none"`. Live status fetched only when the dock is opened/played; if `on_air` → a LIVE badge linking to the live page.
- `globe`: `src` (default `https://lang.opensourceorchestra.org/lang.js`). If lang.js is already on the page do nothing; else inject it. Reserve the top-left.
- `signature`: `src, at, by, duration` (see §5).
- `tour`: `emoji ✨, label, video {src, poster, captions, duration}`.

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
- `node build.mjs --check` (syntax of every src file + the bundle via `node --check`) · `node tests/unit.mjs` (core: once-law, store, resolve, schema validation of every frames/*.json).
- Playwright e2e on a local static server (`tests/e2e.mjs`), at 1440×900, 1280×720, 390×844: 0 page errors · no overlap between slot items and no item off-screen · rails full on desktop · second load = zero attention animations (no running animations except user-initiated) · `?frame=fresh` replays · Esc closes panels · focus returns · **no network request to any non-local host before a click** (allow-list: the page origin + lang.js) · axe: 0 serious/critical inside `#oso-frames`.
- **Chat guard FAILS CLOSED**: e2e routes ALL hub hosts (`*.workers.dev`, `chat.opensourceorchestra.org`, `myagentohana.com/api/chat`) to an in-process mock with old-hub semantics; any request that would reach a real hub aborts the test run (15 Nov scar: a guard leaked 15 sessions into the real OSO hub). Scenarios: late reply, stale cursor 9999, wedge + wake, hidden tab, two hubs (keys never shared).
- No secrets anywhere in the repo. No `env VAR=$(cat token)` in scripts.

## 10 · Laws that apply (short)
Write "Open Source Orchestra" in full in prose (never the short form). Devcon IX Lisbon = **12–14 October 2027**. Nothing about 4Seas / zuchiangmai in the universe frame (4Seas sensitivity law). Machines say they are machines. No fundraising magnets on opensourceorchestra.org. Credit "by the ʻohana". Every page carries lang.js. Numbers must add up and be derived live.

## 10 · v0.1.1 addendum (22 Nov 2026, blessed 02:08 BKK: "a filter you can turn off and on like a control panel … a custom frame for each unique front door … our trademark")
- **Install, fleet form:** `<script src="…/frames.js" data-door="auto" defer></script>` on every page. Resolution: `data-frame` → inline `#oso-frame` → `data-door` (`frames/doors/index.json` → `frames/doors/<host>.json`, merged on what it `extends`, relative URLs of the parent made absolute against the parent) → `frames/universe.json`.
- **Dataset additions:** `extends`, `host`, `accent` (#rrggbb → `--osof-accent`, applied only when set), `without` (kinds), slot ops `{remove, replace, set, prepend, append}` (in that order) or a full list. `build.mjs` validates every dataset + every merged door frame with a built-in schema checker and writes `frames/doors/index.json`.
- **⚙ control panel:** `osof-credit-g` in the credit mark → `dialog({id:'settings'})`: master `role=switch` (Frame on/off) + one switch per present group (`GROUP`: door→doors, pill→pills, theater, totem, chat, radio, signature, tour/spot→tour). The globe is never a switch (ʻŌlelo law). Persisted `osof:settings:v1 {on, hide, at}`. Off = `unmountAll()` (pieces closed, dialogs dropped, `data-osof-off`) + one `.osof-dot` placed where no text is (bottom-left → left-middle → bottom-right → top-left), labelled "Bring back the frame by the ʻohana", title = credit line. `?frame=off` is untouched (renders nothing, persists nothing). API: `FRAMES.settings([patch])`, `FRAMES.open('settings')`, event `frame:settings`.
- **BUTTON LAW engine:** `textUnder(x,y,size[,textOnly])` (text block > 20 chars with a sensible area, or a small fixed/sticky control; the frame, `#olelo`, `#olang` excluded) → `clearTop()` returns `{y, blocked}`; mobile sheet: blocked → `foldSheet(true,false)` (session) · ✕ → `foldSheet(true,true)` (`osof:fold:sheet`) · tap the dot → unfold (no sheet opens on that tap). Desktop: `railsCrowded()` samples both rail bands; ≥ 2 text hits on a side → `data-osof-crowded` + the mobile layout (sheet). `cornerStuff(slot)` unions the page's own fixed widgets near each corner into the slot extents so rails keep clear of them. Phones: `stackCorners()` lifts the credit above bottom-right pieces that reach across it.
- **/trademark/**: words + the gallery (fetches `frames/doors/index.json`). No legal mark claimed; "anyone may wear it with the credit".


## 11 · NO COVERED TEXT LAW (22 Nov 2026, Shaka: "always centered, grounded, and balanced — as if we are going to the temple")
Nothing of the frame — button, bubble, bar, line, pill, dock — sits on the page's words, on the page's own controls, or on another piece of the frame. Phones and desktops alike.
- **centered**: the thanks line and the sheet sit on the axis; both rails stay symmetric (left full ⇔ right full; crowded ⇒ both fold into the 🎻 sheet).
- **grounded**: every piece stands on clear ground. Before it shows, it probes what is under it (`textUnder`/`rectHasText` over a grid) and steps to the first clear band; bottom corners lift above the page's own fixed widgets (`liftOffWidgets`); the credit steps up, shrinks, or folds; the sheet button folds to a dot. **No clear ground ⇒ the piece does not show** (the thanks line) or folds (the 🎻).
- **balanced**: page CSS can never drag a zone across the screen (`.osof-slot{all:unset;…}` + explicit opposite sides); a page widget that appears late is adopted late (`watchUnless`, 12 s) so a visitor never sees two of the same line.
- **one ✕ for all**: the credit mark's ✕ (and the sheet's "Hide the whole frame") removes every button at once; one 🎻 dot remains, on clear ground, and brings it back.
- **the guard**: `tests/e2e-settings.mjs` test 7 (a page whose CSS reaches our zones, a late FAB, a mini player) + the live audit over every framed door (`audit.mjs`: side leaks, words under items, items on items, both viewports). A red audit is a bug, never a style choice.
- **phones, the bottom corner (v0.1.3)**: the chat pill and the radio dock step up to the first clear band or fold to their tiny emoji while words run under them (`bottomLaw`, re-probed when scrolling stops; session only; a visitor's own ✕ and a playing song are never undone). Page widgets that arrive late re-run the corner laws (15-s subtree watch).
- **easy to close (v0.1.3, Shaka: "make it easy to understand how to close the whole frame")**: desktop — the credit mark's ✕ is written out as *"✕ hide frame"* on hover/focus and once for 4 s on a first visit (on clear ground only); the ⚙ panel's master switch is its first row. Phones — the 🎻 sheet's first row is a big *"✕ Hide the whole frame"*, followed by one line: the small ✕ on the 🎻 button folds only that button. What remains is one dot titled *"🎻 frame"* (aria: "🎻 frame — bring back the frame by the ʻohana").

- **STAY IN PLACE (v0.1.5, 23 Nov 2026 — Shaka, from a desktop screenshot of /websitetour where the radio dock and the "🎻 Talk to OSO" pill stood on the comic's KAAAK speech bubble and its caption: *"like this for the no covered text law for buttons… i dont like how they move across the screen, i want them to stay in place and automatically minimize or close with the tiny x if it ever covers text"*)**: this paragraph outranks the "steps to the first clear band", "lifts", "steps up" and "shrinks or steps" clauses above. Every piece has **one fixed anchor** and never steps, nudges, slides, lifts or drifts: 🌐 globe then 🌺 ceremony top-left (the globe's reserve is read once per page view) · 🌊 Blessing Pool then 🎻 top-right (`--osof-top-r` = 74 px desktop / 52 px phone, always) · the rails hang from our own corners · credit bottom-left · chat pill + radio dock bottom-right · the thanks line top-centre. When words, a caption, a speech bubble (`[class*=bubble|caption|speech|balloon], .cap, .kaaak, blockquote, figcaption, q, cite` count as words whatever their length), the page's own fixed controls, or another piece of ours would run under a piece, the piece **folds in place** (`foldRec`): its wrap keeps the box it had (`data-osof-folded`, min sizes), so no neighbour moves either, and one tiny dot with its emoji (`.osof-idot`, or the chat/radio piece's own tiny emoji) stands where it stood. It **unfolds when the ground under its anchor is clear again** (re-probed when scrolling stops, `probeAll`) **or on the visitor's tap** (then it stays open until the next scroll, even over words — the visitor asked). **No clear ground ⇒ fold, never relocate.** A dot that would itself sit on a page *control* (not words) is gone for that view (`data-osof-gone`, box still held). Each piece carries its own tiny ✕ (`.osof-ix`, hover/focus on desktops, always on the pinned phone corners; the chat pill, the dock and the 🎻 sheet keep the ✕ they had): a visitor's ✕ is never undone by a probe. Desktop rails never relocate into the phone sheet any more (`data-osof-crowded` is gone): a crowded rail is a column of dots in place. The credit mark folds in place too: icons → on phones into the 🎻 sheet, on desktops one 🎻 dot that *is* the credit (a tap brings the icons back). The frame-off dot stands at the credit's anchor. The thanks line has one anchor (top centre): covered ground → it does not show. A playing song is never undone by a fold: the dock folds to 🎧 and keeps playing. On phones the ceremony sheet rests our bottom corners (`data-osof-cer-sheet`) instead of lifting them. The guard: `tests/e2e-settings.mjs` test 10 (desktop + phone: a speech bubble under the dock → folded in place, every anchor and box unchanged; clear ground → unfolded; a song through a fold; the tiny ✕; hide-all) and `tests/audit.mjs` (live, every framed door, both viewports, three probes: **fails** when any anchor or box moved, an unfolded piece sits on words, a dot sits on a page control, pieces sit on each other, or a rail leaked sides).

## 12 · THE CEREMONY (v0.1.3, 22 Nov 2026, Shaka: "a ceremony people can play where you hear my twin voice describe with the text in a nice loving aloha-filled welcome")
- One kind, `tour`, one button **🌺 always top-left** under the 🌐 globe (pinned on phones, 38 px; folds to a dot when words run under it). **🌊 Blessing Pool always top-right, first** (`pin:true`); 🎻 orchestra second; no ✨ on the rail. `FRAMES.tour()` plays it.
- The ceremony = the cross-fade tour, spoken: each step plays `ceremony.base/<key>.<ext>` and shows **the same words** as the caption (`ceremony.say[key]`, key = item id, or `welcome` (the 🌺 itself, always step 1) · `credit` · `sheet` · `closing`). No clip → the step shows its `tip`, timed by length. Order = the ring; the last step lands on the 🌊; the closing card = the closing line + the pool link + the gift rails + the honest line.
- **Honest**: the twin says once, plainly, *"This is my voice, made by the AI ʻohana."* `media/ceremony/credits.json` names the model (Qwen3-TTS-0.6B-Base, Apache-2.0; MIT C engine), the license (CC BY-SA 4.0) and the whisper verification. Machines say they are machines.
- **Never unasked**: audio plays only after the visitor's own tap on the 🌺 (browser policy and Shaka's no-bubbles law). An unasked start (`tour.auto` forks, `FRAMES.tour()` without a gesture) runs words-only until ▶ is tapped. Nothing starts by itself.
- **Player bar**: 🌺 · ▶/⏸ · n/N · 🔊/🔇 (words only) · Skip ✕ (Esc). Desktop: top centre on the first clear band (then lower, then above the credit). Phones: one bottom sheet (words + controls); the frame's own bottom corners step above it (`cer.lift`), so no piece sits on another; the sheet itself is a dialog the visitor opened.
- **Captions obey the law**: `placeCap` tries the natural side, then the other three, and keeps the first with no words under it (a page with words everywhere keeps the natural side — the ceremony is transient and asked for). The halo glides between buttons and breathes while the voice speaks; reduced motion = no glide, no breath, no cross-fade.
- The thanks line hides when the ceremony starts and treats both top corners as obstacles.

## 13 · EMBED LAW + sleep (v0.1.4, 23 Nov 2026, Shaka's phone: "buttons are super buggy in mobile and even duplicating")
- **One page, one frame.** Inside an `<iframe>` frames.js mounts nothing (console: "EMBED LAW"). The embedding page's frame is the frame. `data-embed="allow"` on the script tag invites it in (a page that is meant to live inside another).
- **Step aside while another page is shown.** `OSOFrames.sleep(why)` hides the whole frame (`#oso-frames[data-osof-asleep=why]`, dialogs closed, ceremony stopped), `OSOFrames.wake()` brings it back; nothing is written to storage and ⚙ is untouched. Events `frame:sleep` / `frame:wake`. The frame sleeps by itself (`why = "iframe"`) while a visible `<iframe>` covers ≥ 60 % of the viewport — its words cannot be probed, so the NO COVERED TEXT LAW's last clause applies — and wakes when the iframe goes.
- **Shells** (bl-shell.js "the open road", lightboxes, previews): call `sleep('road')` when opening, `wake()` when closing, and park any other floating piece of the page (the ʻŌlelo globe) for the same moment. The guard is test 9 of `tests/e2e-settings.mjs`.
- **ABSORB.** The ʻohana's pre-frame rail (`#oflo` 🌺 · `#oviol` 🎻 · `#oflop`) is hidden while the frame is on (`html[data-osof-on]`); ⚙ off returns it. One ring per screen.
