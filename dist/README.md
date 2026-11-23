# Open Source Orchestra Frames 🖼️🎻

**The open frame around any screen.** Doors, a theater, a totem of AI agents, a radio, a language globe and a signature around your web page — from **one script tag** and **one open dataset**. Copyleft: the credit travels and every fork stays open.

A holiday gift from the AI ʻohana · Open Source Orchestra · November 2026.

```
home (this site):  https://frames.opensourceorchestra.org/
built by:          Open Source Orchestra — Shaka Lei Kaumaka & the AI ʻohana
                   (AI agents running Claude Opus 5.5 on Taurus: https://taurusagents.com/r/k3kfDrXp)
license:           code AGPL-3.0-or-later + §7(b) credit (NOTICE) · words & data CC BY-SA 4.0
```

## Use it (30 seconds)

```html
<script src="https://frames.opensourceorchestra.org/frames.js" defer></script>
```

That gives your page the universe frame of the Open Source Orchestra. Point at your own dataset to make it yours:

```html
<script src="https://frames.opensourceorchestra.org/frames.js" data-frame="/my-frame.json" defer></script>
```

One tag for **every page of every door** — the frame picks the door's own small dataset by host name (v0.1.1):

```html
<script src="https://frames.opensourceorchestra.org/frames.js" data-door="auto" defer></script>
```

- `?frame=outline` — see the frame's blueprint · `?frame=fresh` — replay the first visit · `?frame=off` — hide it for one page view
- **⚙** in the credit mark (bottom-left): the frame, or any piece, off and on — remembered in that browser only. Off leaves one small 🎻 dot that brings it back.
- Datasets: [`frames/universe.json`](frames/universe.json) · [`frames/minimal.json`](frames/minimal.json) · per-door: [`frames/doors/`](frames/doors/) · schema: [`schema/frame-0.1.json`](schema/frame-0.1.json)

## Make your door's frame (5 minutes)

`frames/doors/<your.host>.json` extends the universe with your accent and your first doors — see [`docs/DOORS.md`](docs/DOORS.md). The gallery of door frames: <https://frames.opensourceorchestra.org/trademark/> — *the frame is the mark*; anyone may wear it with the credit. A page or a person can add a third layer (an **artist frame**): `data-frame-overlay`, `?frame-overlay=`, or `window.__framesOverlay` — see [`docs/ARTIST-FRAMES.md`](docs/ARTIST-FRAMES.md).

## Fork it (15 minutes)

1. Fork this repo.
2. Edit `frames/minimal.json` (every button is one line of data) — or use the frame builder at `/builder/`.
3. Settings → Pages → main, root. Your frame is live at `https://<you>.github.io/frames/`. Add the script tag to your site.
4. Bring your own signature: `python3 -I tools/vectorize-signature.py crop.png my-signature.svg` (Shaka's signature stays his — see `LICENSES/LicenseRef-Shaka-Signature.txt`).

## What's in the frame

| piece | what it does |
|---|---|
| 🌐 globe | one language choice that follows the visitor (via the ʻŌlelo bridge) |
| 📺 theater | a little TV opening films & recordings, each with credit and consent |
| 🗿 totem | a stack of AI agents; tap a face to talk (machines, and they say so) |
| 💬 talk line | live chat on the open PIT chat protocol (connects only when opened) |
| 📻 radio | consented songs; nothing loads before you press play |
| 🌺 ceremony | top-left, always: the welcome in Shaka's twin voice (a machine, and it says so) with the same words as captions, button by button, ending at the 🌊 Blessing Pool (top-right, always). Plays only when tapped; ▶⏸ · 🔇 · Skip ✕ |
| ✍️ signature | the steward signs the page in real time, once, then the ink fades |
| doors & pills | emoji links down both edges + small pills for what's next |

## The laws of the frame

- **Once, then still.** Every animation and tip plays one time per visitor. No loops.
- **Nothing connects until you act.** No chat, audio, video or translation before a click. No cookies, no trackers.
- **Machines say they are machines.** **Consent before people.** **Keyboard, screen readers, reduced motion and small screens are first-class.**
- **A floating button never covers text** (BUTTON LAW, 19 Nov 2026) — the frame steps aside, folds to a dot, or folds its rails into the 🎻 sheet rather than sit on a word; and it always has a tiny ✕ or ⚙ to go away.
- **NO COVERED TEXT LAW** (22 Nov 2026, v0.1.2 · SPEC §11): *centered, grounded, balanced.* Nothing of the frame sits on the page's words, on the page's own controls, or on another piece — phones and desktops. Pieces probe the ground under them and step aside, lift, fold, or do not show. Page CSS cannot drag a rail across the screen; a page widget built late is adopted late. The credit mark's ✕ hides every button at once; one 🎻 dot stays and brings it back.
- **No description bubbles** (22 Nov 2026): the tour never starts by itself; since v0.1.3 the 🌺 ceremony plays it on request, spoken. One 3-second line at the top says thank you for every gift (x402 for agents · Stripe, PayPal, Venmo for humans) and leaves.

## Develop

```bash
node build.mjs          # src/core.js + src/pieces/*.js → frames.js (with gates)
node build.mjs --check  # syntax + every dataset and door frame against the schema + secrets gates
node tests/e2e-settings.mjs   # v0.1.1 e2e: ⚙ panel, data-door, accent, BUTTON LAW (local server only)
node tests/serve.mjs    # local dev server; open tests/dev.html?frame=fresh
./deploy.sh --dry       # build dist/ (Worker static site) without deploying
```

`SPEC.md` is the full contract; `docs/` holds the dataset spec (`FRAME-SPEC.md`) and the per-door guide (`DOORS.md`).

## The guarantee

The code is **AGPL-3.0-or-later** with an **AGPL §7(b) attribution term** (`NOTICE`): forks stay open, hosting counts, and this line travels with every copy:

> Built on Open Source Orchestra Frames by Open Source Orchestra: Shaka Lei Kaumaka & the AI ʻohana (https://opensourceorchestra.org)

Words, datasets and design are **CC BY-SA 4.0**. Songs and films keep their makers' own terms and consent. Plain words in `NOTICE`; not legal advice.

## License

Code: **AGPL-3.0-or-later** (this repo shipped AGPL and stays AGPL; see [`LICENSE`](LICENSE)). Songs, lyrics, chords, words, art, photos, pages and links: **CC BY-SA 4.0** (see [`LICENSES/CC-BY-SA-4.0.txt`](LICENSES/CC-BY-SA-4.0.txt)). Credit: Shaka Lei Kaumaka & the AI ʻohana of the Open Source Orchestra (https://opensourceorchestra.org) — the credit line in [`NOTICE`](NOTICE) travels with every fork. Everything published before 19 Nov 2026 stays under its old licence, irrevocably. Forever a part of the infinite garden.
