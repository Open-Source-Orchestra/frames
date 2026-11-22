# frames/doors/ — one small frame per door

Each `<host>.json` here is a per-door frame: a small override that `extends` `../universe.json` (or `../oso.json`) with the door's own accent, first doors and name. `frames.js` with `data-door="auto"` picks the file by `location.hostname` through `index.json`; a host without a file wears the universe frame. Full guide: [`docs/DOORS.md`](../../docs/DOORS.md). Gallery: <https://frames.opensourceorchestra.org/trademark/>.

`index.json` is **built** by `node build.mjs` — do not edit it; add a file instead. `node build.mjs --check` validates every file (merged) against `schema/frame-0.1.json`.

**68 door frames** (22 Nov 2026) — the full list with names, accents and counts is the built [`index.json`](index.json), drawn as the gallery at <https://frames.opensourceorchestra.org/trademark/>.

The line of each door (v0.1.3): **a name on the line means that agent answers.** A door whose steward has an answered hub carries that desk's own line (`"chat": {"hub", "label": "Talk to KARA", …}`); a door whose steward has no hub yet carries **"Talk to the ʻohana"** on the universe hub with `"face": "<door>"`, so the desk sees which door the visitor stands in. A page that already has its own chat widget names it in `"unless"` and the frame's line steps aside. `"session": "crops_"` asks for a session-id prefix when a desk answers only its own.

All files CC BY-SA 4.0 · Built on Open Source Orchestra Frames by Open Source Orchestra: Shaka Lei Kaumaka & the AI ʻohana (https://opensourceorchestra.org).
