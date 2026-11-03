// Inline local <iframe src> pages into srcdoc so Marp decks need no server.
// Converts every deck in src/marp-slide/ to src/marp-inline-slide/ (same file name).
//
//   bun src/inline-frames.ts                       build all decks once
//   bun src/inline-frames.ts option101.md          build only these decks (name or path)
//   bun src/inline-frames.ts [deck.md…] --watch    rebuild on save
//
// Guide: docs/tool-guide/inline-frames.md
import { readFileSync, writeFileSync, readdirSync, mkdirSync, watch } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const SRC = resolve(import.meta.dir, "marp-slide");
const OUT = resolve(import.meta.dir, "marp-inline-slide");

// Decks named on the command line, as bare names or paths; each must live in SRC.
const picked = process.argv.slice(2).filter(a => !a.startsWith("--")).map(a => {
  const f = basename(a);
  if (!f.endsWith(".md") || (a.includes("/") && resolve(a) !== join(SRC, f))) {
    console.error(`${a}: not a deck in ${SRC}`); process.exit(1);
  }
  return f;
});
const isLocal = (u: string) => !/^([a-z]+:|\/\/|#)/i.test(u);

// Read a page and pull its local stylesheets and scripts into the page itself.
function bundle(file: string, deps: Set<string>): string {
  deps.add(file);
  const dir = dirname(file);
  const read = (u: string) => { const f = resolve(dir, u); deps.add(f); return readFileSync(f, "utf8"); };
  return readFileSync(file, "utf8")
    .replace(/<link\b[^>]*\brel=["']?stylesheet["']?[^>]*>/gi, tag => {
      const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
      return href && isLocal(href) ? `<style>\n${read(href)}\n</style>` : tag;
    })
    .replace(/<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)><\/script>/gi, (tag, a, src, b) =>
      isLocal(src) ? `<script${a}${b}>\n${read(src)}\n</script>` : tag);
}

// srcdoc must stay one line: a blank line would end Markdown's HTML block.
const toAttr = (html: string) =>
  html.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\r?\n/g, "&#10;");

function buildDeck(deck: string, deps: Set<string>) {
  deps.add(deck);
  const md = readFileSync(deck, "utf8").replace(/<iframe\b[^>]*>/gi, tag => {
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    if (!src || !isLocal(src)) return tag;
    const page = bundle(resolve(dirname(deck), src.split(/[?#]/)[0]), deps);
    // function replacer: page text holds "$&"-like sequences that a string replacer would expand
    return tag.replace(/\bsrc=["'][^"']+["']/i, () => `srcdoc="${toAttr(page)}"`);
  });
  const out = join(OUT, deck.slice(SRC.length + 1));
  writeFileSync(out, md);
  console.log(`${deck.slice(SRC.length + 1)} => ${out}`);
}

function build(): Set<string> {
  mkdirSync(OUT, { recursive: true });
  const deps = new Set<string>();
  const decks = picked.length ? picked : readdirSync(SRC).filter(f => f.endsWith(".md"));
  for (const f of decks) {
    try { buildDeck(join(SRC, f), deps); } catch (e) { console.error(`${f}: ${(e as Error).message}`); }
  }
  return deps;
}

if (!process.argv.includes("--watch")) build();
else {
  let watchers: ReturnType<typeof watch>[] = [], timer: Timer | undefined;
  const run = () => {
    const deps = build();
    // Watch folders, not files: editors that save by replacing a file break file watchers.
    // Without picked decks, any new deck in SRC is picked up too.
    watchers.forEach(w => w.close());
    watchers = [...new Set([SRC, ...[...deps].map(f => dirname(f))])].map(dir =>
      watch(dir, (_, name) => {
        const path = name ? resolve(dir, String(name)) : "";
        if (!deps.has(path) && !(!picked.length && dir === SRC && path.endsWith(".md"))) return;
        clearTimeout(timer); timer = setTimeout(run, 100);
      }));
  };
  run();
  console.log("watching… Ctrl+C to stop");
}
