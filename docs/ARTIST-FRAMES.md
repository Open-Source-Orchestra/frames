# Artist frames — a third layer on top of a door's frame (v0.1.1)

*CC BY-SA 4.0 · Open Source Orchestra Frames · the AI ʻohana, 22 Nov 2026 · Shaka: "every artist will have the option to customize their ʻohana frame with all the emoji buttons, talk-to-your-agent bridges, radio player and file downloader."*

Datasets **layer**. The frame a visitor sees is:

```
frames/universe.json            the universe (or frames/oso.json)
  ← frames/doors/<host>.json    the door: accent, first doors, name          (data-door="auto")
    ← an overlay                 the page, or the person: an artist's frame   (this document)
```

Every layer is the same schema (`schema/frame-0.1.json`), validated the same way (`normalize()` in the browser; `node build.mjs --check` for files in the repo). An overlay is **merged by piece id**: an item with the same `id` as one already in the frame replaces it; a new `id` is appended; slot ops (`remove`, `set`, `prepend`, `append`) work as in door frames; `accent`, `name`, `emoji`, `id`, `strings`, `credit.add`, `without` work as in door frames. The credit line of the ʻohana is never removed (AGPL §7(b)); `credit.add` puts the artist's name next to it.

## Where the overlay comes from (first match wins)

| source | who sets it | allowed origins |
|---|---|---|
| `data-frame-overlay="<url>"` on the script tag | the site author, in the HTML | any `https:` URL |
| `?frame-overlay=<url>` in the address | a link, a share, a preview | the page's own origin, or the frames host |
| `window.__framesOverlay = "<url>"` or `= { …dataset… }` | the page's own script, **before** `frames.js` runs (it is `defer`) | URL: same rule as the address · object: always |

A link cannot dress our door in a stranger's frame: an address or window URL on another origin is ignored (one `console.info`, the door frame is worn alone). The site author's tag attribute is trusted because the site author wrote it.

## The artist page (artist.opensourceorchestra.org/?who=ben)

The page already knows who `?who=` is. In its own script, before the frames tag:

```html
<script>
  // whatever the page knows about the artist → an overlay object (no fetch needed)
  window.__framesOverlay = {
    "frame": "osoframes/0.1",
    "id": "artist-ben",
    "name": "Ben · Open Source Orchestra",
    "emoji": "🎸",
    "accent": "#2f9e6f",
    "credit": { "add": ["Ben"] },
    "slots": {
      "left": [
        { "kind": "door", "id": "home", "emoji": "🎸", "label": "Ben", "href": "/?who=ben", "tip": "Ben's page in the orchestra." },
        { "kind": "door", "id": "artist-tip", "emoji": "💸", "label": "Tip Ben", "href": "/tip/?artist=ben", "tip": "Tip Ben by name — agents can too, over x402." },
        { "kind": "door", "id": "artist-files", "emoji": "📥", "label": "Downloads", "href": "/files/?who=ben", "tip": "Ben's songs, lyrics and chords — CC BY-SA 4.0." }
      ],
      "right": { "set": { "totem": { "label": "Talk to Ben's agent" } } },
      "bottom-right": [
        { "kind": "chat", "id": "chat", "label": "Talk to Ben's agent", "name": "Ben's agent", "emoji": "🎸", "hub": "https://chat.opensourceorchestra.org", "storage": "artist-ben", "greeting": "Aloha — I am Ben's AI agent (a machine). Ask me about his songs." },
        { "kind": "radio", "id": "radio", "label": "Ben's radio", "tracks": [ { "title": "First song", "artist": "Ben", "src": "https://…/first-song.mp3", "license": "CC BY-SA 4.0" } ] }
      ]
    }
  };
</script>
<script src="https://frames.opensourceorchestra.org/frames.js" data-door="auto" defer></script>
```

Or the same object as a file, `/artists/ben/frame.json`, and `window.__framesOverlay = '/artists/ben/frame.json'` (same origin). Or a share link: `https://artist.opensourceorchestra.org/?who=ben&frame-overlay=/artists/ben/frame.json`.

Notes for a page that already has its own chat button or player: keep the universe items' `unless` selectors (`#oso-fab`, `#miniplayer`) on the overlay's chat/radio items, or `remove` them — never two bells for one page.

## What the browser tells you

- `OSOFrames.overlay` → `{ from: 'tag' | 'query' | 'window', url }` or `null`.
- `OSOFrames.data` → the merged frame actually worn (`id`, `accent`, `slots`, …).
- `document.addEventListener('osoframes:frame:ready', e => e.detail.overlay)`.

## Keep it simple

One overlay per page. An overlay may itself `extends` another file (resolved against its own URL), but a page rarely needs that. Per-browser preferences (⚙: frame off, pieces off) are keyed by the frame's `id` for once-flags and dismissals, and shared across frames for the on/off switch — an artist overlay with its own `id` therefore gets its own first-visit signature and tour.
