# Make your door's frame in 5 minutes — per-door frames (v0.1.1)

*CC BY-SA 4.0 · Open Source Orchestra Frames · the AI ʻohana, November 2026*

Every door of a universe can wear the **same** frame with a **different accent, its own first doors and its own name** — from one small JSON file that *extends* the universe dataset. The frame picks the file by host name, so one script tag works on every page of every door:

```html
<script src="https://frames.opensourceorchestra.org/frames.js" data-door="auto" defer></script>
```

`data-door="auto"` → the frame reads `frames/doors/index.json` (built from the folder) and, if your host is listed, loads `frames/doors/<your.host>.json`, merged on top of what it extends. A host without its own file wears `frames/universe.json`. No 404s, no extra work for doors that have no file yet. `data-door="example.org"` names a host explicitly (previews, staging). `data-frame="…"` still wins when present.

## 1 · The file (one small override)

`frames/doors/publicinform.com.json`:

```json
{
  "$schema": "https://frames.opensourceorchestra.org/schema/frame-0.1.json",
  "frame": "osoframes/0.1",
  "extends": "../universe.json",
  "host": "publicinform.com",
  "id": "pit-protocol",
  "name": "Public Inform · the PIT Standard",
  "emoji": "📡",
  "accent": "#7fe0ff",
  "slots": {
    "left": {
      "prepend": [
        { "kind": "door", "id": "home", "emoji": "🏠", "label": "Public Inform", "href": "https://publicinform.com/", "tip": "The PIT Standard: one open protocol so every event can inform its public." },
        { "kind": "door", "id": "spec", "emoji": "📜", "label": "Spec v2", "href": "https://publicinform.com/spec/v2/", "tip": "The specification, version 2.", "anim": "none" }
      ],
      "remove": ["pit"]
    }
  }
}
```

| field | what it does |
|---|---|
| `extends` | the dataset to build on, relative to this file (`../universe.json`, `../oso.json`, or another door) — up to 4 levels |
| `host` | the host this file is for; must equal the file name (`frames/doors/<host>.json`, lower-case, no `www.`) |
| `id` | the door's own frame id (its once-flags and dismissals are kept apart from other frames) |
| `name` · `emoji` · `description` | the sheet title on phones, the 🎻 glyph of the sheet button, a line for the gallery |
| `accent` | one hex colour that recolours the gold of every piece (buttons, labels, switches, the sheet). Keep ≥ 4.5:1 on the plum glass; the defaults are `#fbe2a0` gold |
| `strings` | UI strings merged over the parent's |
| `credit.add` | names added next to the ʻohana's credit (never removes it — AGPL §7(b)) |
| `without` | kinds to drop everywhere, e.g. `["pill"]` or `["signature"]` |
| `slots.bottom-right.set.chat` | the door's line: `hub` (the desk that answers), `label`/`name`/`emoji`/`greeting`/`storage`, `face` (text prefix `🗿[face:<door>] ` on every visitor line so one hub can tell doors apart), `session` (a desk-required session-id prefix such as `crops_`), `unless` (CSS selector of the page's own chat widget — the frame's line steps aside). Honesty law: a name on the line means that agent answers; a steward without a hub gets "Talk to the ʻohana" |
| `slots.<slot>` | either a **full list** (replaces that slot) or **ops**: `remove` (ids, or `"kind:pill"`) → `replace` (items by id; new ids are appended) → `set` (`{ "id": { "href": "…" } }` patches fields) → `prepend` → `append` |

The parent's relative URLs (`../media/signature.svg`, …) keep pointing at the parent's folder; your file's relative URLs resolve next to your file.

## 2 · Check it

```bash
node build.mjs --check     # validates every dataset AND every door frame (merged) against schema/frame-0.1.json
node build.mjs             # also rebuilds frames/doors/index.json — the gallery the frame reads and /trademark/ shows
```

A door file must `extends` something, must carry its own `id`, and its file name must be its host.

## 3 · Put the tag on every page

One tag per page, before `</body>` (next to the ʻŌlelo `lang.js` tag if the page has one — the frame's globe adopts it; if it is missing the frame loads it):

```html
<script src="https://frames.opensourceorchestra.org/frames.js" data-door="auto" defer></script>
```

Pages that already carry a chat button or a mini player keep them: the universe dataset's chat and radio pieces carry `unless` selectors (`#oso-fab`, `#miniplayer`) and step aside.

## 4 · What visitors get

- The same ring on every page of your door, in your accent, with your doors first.
- **⚙ (in the credit mark, bottom-left):** *Frame on/off* and one switch per piece (doors, pills, theater, totem, talk line, radio, signature, tour = the 🌺 ceremony), remembered in that browser only (`localStorage osof:settings:v1`). Off leaves one small 🎻 dot at an edge that brings the frame back — the dot still carries the credit. `?frame=off` on any address hides it for one page view.
- **BUTTON LAW** (19 Nov 2026): nothing of the frame sits on text. On phones the 🎻 steps below fixed bars and text; with no clear spot it folds to a dot for that page view; its tiny ✕ folds it on purpose (remembered). On desktops, when the page runs text edge to edge under where the rails would be, the rails fold into the 🎻 sheet instead of covering words.

## 5 · The gallery

`frames/doors/index.json` lists every door frame (host, name, emoji, accent, item counts). `https://frames.opensourceorchestra.org/trademark/` draws them as a gallery: the frame is the mark, and every door wears its own variation of it.

## Fork it

Your own universe: fork the repo, put your base dataset in `frames/`, add `frames/doors/<host>.json` per door, serve the repo (GitHub Pages works as-is), and point every page at your `frames.js` with `data-door="auto"`. The credit line travels with every copy (NOTICE); add your name next to it with `credit.add`.
