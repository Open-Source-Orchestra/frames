# Changelog

## 0.1.1 — 2026-11-22 "a frame for every door"
Blessed by Shaka Lei Kaumaka on 22 Nov 2026, 02:08 Chiang Mai: *"the full left and right border covering … on literally all pages, as a filter you can turn off and on like a control panel, and a custom frame for each unique front door … so it literally becomes our trademark."* Built by the AI ʻohana.
- **⚙ control panel** (in the credit mark, bottom-left; `FRAMES.open('settings')`, `FRAMES.settings()`): *Frame on/off* + one switch per piece (doors, pills, theater, totem, talk line, radio, signature, tour). Remembered in this browser only (`localStorage osof:settings:v1`), nothing sent anywhere. Off leaves one small 🎻 dot at an edge that brings the frame back — the dot still carries the AGPL §7(b) credit. `?frame=off` stays the one-page-view escape hatch. Accessible: a real dialog, `role=switch` buttons, Esc, focus return.
- **per-door frames**: `frames/doors/<host>.json` = a small override that `extends` `../universe.json` (accent colour, the door's own first doors, name/emoji, `without`, slot ops `remove/replace/set/prepend/append`). `<script … data-door="auto">` resolves the file by `location.hostname` through `frames/doors/index.json` (no 404s; unknown hosts wear the universe). `build.mjs` validates every dataset and every merged door frame against `schema/frame-0.1.json` (a built-in validator) and rebuilds the index. Nine door frames shipped. Guide: `docs/DOORS.md`.
- **accent**: one hex colour per dataset recolours the gold of every piece (`--osof-accent`, applied only when set; default frames keep the exact v0.1.0 look).
- **BUTTON LAW, second half** (19 Nov 2026 law: a floating button never covers text, and always has a tiny ✕): the 🎻 sheet button steps below fixed bars *and text*; with no clear spot it folds to a dot for that page view; a tiny ✕ folds it on purpose (remembered, `osof:fold:sheet`); the dot unfolds it. On desktops, text running edge to edge under the rails folds the rails into the 🎻 sheet (`data-osof-crowded`). Rails also keep clear of a page's own fixed corner widgets (an old 🎻 corner, a chat FAB, a mini player). On phones the credit steps up above the chat/radio when they meet.
- **/trademark/**: "the frame is the mark" — plain words on what the frame means, the credit, how a fork keeps it, and the gallery of door frames (built from `frames/doors/index.json`). No legal trademark is claimed or filed.
- schema: `extends`, `host`, `accent`, `without`, slot ops; radio tracks need `artist` and/or `credit`.
- tests: `tests/e2e-settings.mjs` (panel, door resolution + fallback, accent, law pages, phone fold) · `tests/chat-guard.mjs` unchanged.

## 0.1.0 — 2026-11-19 "the holiday gift"
First release, sketched by Shaka Lei Kaumaka on 16 Nov 2026 (hand-drawn frame + signature over the Open Source Orchestra home page) and built by the AI ʻohana (Claude Opus 5.5 on Taurus):
- core: slots/layout (both rails full, overflow ⋯, mobile sheet), the one-time law, shared accessible panels, the cross-fade tour (+ "spot" targets on existing page elements), outline blueprint mode, the credit mark (AGPL §7(b)).
- pieces: door/pill, globe (ʻŌlelo bridge), theater (consent-filtered channels), totem of six agents, chat (pit-chat-protocol with the 15 Nov stale-cursor/wake/single-flight laws), radio (consent-first, LIVE link), signature (Shaka's real signature, drawn in real time once).
- datasets: universe / oso / minimal + JSON Schema (osoframes/0.1).
- site: frames.opensourceorchestra.org (assets-only Worker) + this repo works on GitHub Pages as-is.
