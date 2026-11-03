# inline-frames — iframe decks without a server

`src/inline-frames.ts` turns Marp decks that embed charts with a short
`<iframe src>` into self-contained decks, so they preview in VS Code and export
with Marp CLI or the slide-note skill without running a server.

| Folder | Role |
|---|---|
| `src/marp-slide/` | Decks you write (source of truth) |
| `src/ihtml/` | Interactive chart pages the decks embed |
| `src/marp-inline-slide/` | Generated decks (same file names) — never edit by hand |

## Why

VS Code's Marp preview and Marp's exports can't load a local page into an
iframe. The script copies each page into its iframe's `srcdoc` attribute, so
the page travels inside the deck and nothing has to be fetched.

## Usage

Requires [Bun](https://bun.sh). Run from anywhere; paths are resolved from the
script's own folder.

```bash
bun src/inline-frames.ts                            # every deck in src/marp-slide/
bun src/inline-frames.ts option101.md               # just one deck (name or path)
bun src/inline-frames.ts option101.md intro.md      # several decks
bun src/inline-frames.ts --watch                    # keep running; rebuild on save
bun src/inline-frames.ts option101.md --watch       # watch one deck only
```

A deck can be given as a bare name (`option101.md`) or a path
(`src/marp-slide/option101.md`); it must live in `src/marp-slide/`.

`--watch` rebuilds when you save a deck, an embedded chart page, or a file the
page links (e.g. `src/theme/ivory.css`). Without deck names it also picks up
new decks added to `src/marp-slide/`. Stop it with `Ctrl+C`.

## Writing a deck

Embed a chart with a relative path from the deck:

```html
<div style="display:flex;gap:24px">
<iframe src="../ihtml/long_call.html" width="508" height="440" style="border:0" title="Long call"></iframe>
<iframe src="../ihtml/long_put.html" width="508" height="440" style="border:0" title="Long put"></iframe>
</div>
```

- Set `width` and `height` on every iframe; the slide content area is about
  1040 × 576 px.
- Keep the HTML block free of blank lines, or Markdown ends the block early.
- `http(s)://` iframes are left untouched.

## Preview and export

Use the generated deck in `src/marp-inline-slide/`:

| Goal | How |
|---|---|
| VS Code preview | Open `src/marp-inline-slide/<deck>.md` → `Cmd+K V` |
| Marp CLI | `bunx @marp-team/marp-cli --html --theme-set src/theme/ivory.css src/marp-inline-slide/<deck>.md` |
| Thariq HTML | Run the slide-note skill on `src/marp-inline-slide/<deck>.md` |

HTML exports keep the charts interactive; PDF and PPTX get a static snapshot.

One-time VS Code setup for the preview:

1. Trust the workspace.
2. Keep `"markdown.marp.html": "all"` in `.vscode/settings.json` so `<iframe>`
   isn't stripped.
3. Command Palette → **Markdown: Change Preview Security Settings** →
   **Disable**, so scripts inside the charts can run.

## What gets inlined

For each iframe with a local `src`, the page is read and:

1. local `<link rel="stylesheet">` files become `<style>` blocks;
2. local `<script src>` files become inline `<script>` blocks;
3. the result is escaped onto one line and placed in `srcdoc`, replacing `src`.

Assets the chart page loads in other ways (images, `fetch`, CSS `@import`,
fonts by relative URL) are **not** inlined; use data URIs or CDN links for those.

## Limits

- Outside iframes, the deck is copied as-is. Relative links still work only
  if they go up out of the folder (`../theme/…`, `../ihtml/…`), since
  `marp-slide/` and `marp-inline-slide/` sit side by side. A link like
  `img/a.png` relative to `marp-slide/` will break.
- Deleting a deck from `src/marp-slide/` does not delete its generated copy.
