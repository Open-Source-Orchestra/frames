# frames/doors/ — one small frame per door

Each `<host>.json` here is a per-door frame: a small override that `extends` `../universe.json` (or `../oso.json`) with the door's own accent, first doors and name. `frames.js` with `data-door="auto"` picks the file by `location.hostname` through `index.json`; a host without a file wears the universe frame. Full guide: [`docs/DOORS.md`](../../docs/DOORS.md). Gallery: <https://frames.opensourceorchestra.org/trademark/>.

`index.json` is **built** by `node build.mjs` — do not edit it; add a file instead. `node build.mjs --check` validates every file (merged) against `schema/frame-0.1.json`.

| host | frame id | accent | extends | first doors |
|---|---|---|---|---|
| opensourceorchestra.org | oso-flagship-door | (gold) | ../oso.json | the flagship frame on every subpage |
| shakaleikaumaka.com | shaka-home | #ffb443 | ../universe.json | Home · Radio page · Blessing pool; 🎁 Gifts |
| publicinform.com | pit-protocol | #7fe0ff | ../universe.json | Public Inform · Spec v2 · All PITs · Whitepaper |
| myagentohana.com | my-agent-ohana | #f7d794 | ../universe.json | My Agent ʻOhana · Atlas of doors · Built on Taurus |
| blessingpool.com | blessing-pool | #4fc3f7 | ../universe.json | The pool · Tip an artist · Public goods |
| devconpit.com | devcon-pit | #c792ea | ../universe.json | Devcon PIT · The gift · Join the circle |
| zuchiangmai.app | zu-chiangmai | #2f9e6f | ../universe.json | Agenda · The PIT · LIVE PIT (unofficial companion) |
| piscisagents.org | piscis-agents | #c792ea | ../universe.json | Piscis · Zodiac agents |
| osodaomeet.opensourceorchestra.org | oso-theater | #ff7eb6 | ../universe.json | Theater home · Watch (the frame's own theater yields to the page's) |

All files CC BY-SA 4.0 · Built on Open Source Orchestra Frames by Open Source Orchestra: Shaka Lei Kaumaka & the AI ʻohana (https://opensourceorchestra.org).
