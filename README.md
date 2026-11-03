# open-k-option-101
Open knowledge. Intro to options and what it is

## Quick start — preview and export the Marp slides

1. Write decks in `src/marp-slide/`; embed charts from `src/ihtml/` with
   `<iframe src="../ihtml/long_call.html" …>`.
2. Build the self-contained decks (requires [Bun](https://bun.sh)):

   ```bash
   bun src/inline-frames.ts --watch    # src/marp-slide/ → src/marp-inline-slide/
   ```

3. Preview or export the deck in `src/marp-inline-slide/` (VS Code Marp
   preview, Marp CLI with `--html`, or the slide-note skill).

> **Remark:** VS Code and Marp exports can't load a local page into an iframe,
> so `src/inline-frames.ts` copies each chart page into its iframe. Usage,
> one-time VS Code setup, export commands and limits:
> [docs/tool-guide/inline-frames.md](docs/tool-guide/inline-frames.md).
