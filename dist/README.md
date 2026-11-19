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

- `?frame=outline` — see the frame's blueprint · `?frame=fresh` — replay the first visit · `?frame=off` — hide it
- Datasets: [`frames/universe.json`](frames/universe.json) · [`frames/minimal.json`](frames/minimal.json) · schema: [`schema/frame-0.1.json`](schema/frame-0.1.json)

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
| ✨ tour | first visit: every button says what it does, once, then rests — ✨ replays it |
| ✍️ signature | the steward signs the page in real time, once, then the ink fades |
| doors & pills | emoji links down both edges + small pills for what's next |

## The laws of the frame

- **Once, then still.** Every animation and tip plays one time per visitor. No loops.
- **Nothing connects until you act.** No chat, audio, video or translation before a click. No cookies, no trackers.
- **Machines say they are machines.** **Consent before people.** **Keyboard, screen readers, reduced motion and small screens are first-class.**

## Develop

```bash
node build.mjs          # src/core.js + src/pieces/*.js → frames.js (with gates)
node build.mjs --check  # syntax + dataset + secrets gates only
node tests/serve.mjs    # local dev server; open tests/dev.html?frame=fresh
./deploy.sh --dry       # build dist/ (Worker static site) without deploying
```

`SPEC.md` is the full contract; `docs/` holds the dataset spec and the fork guide.

## The guarantee

The code is **AGPL-3.0-or-later** with an **AGPL §7(b) attribution term** (`NOTICE`): forks stay open, hosting counts, and this line travels with every copy:

> Built on Open Source Orchestra Frames by Open Source Orchestra: Shaka Lei Kaumaka & the AI ʻohana (https://opensourceorchestra.org)

Words, datasets and design are **CC BY-SA 4.0**. Songs and films keep their makers' own terms and consent. Plain words in `NOTICE`; not legal advice.
