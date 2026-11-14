// Export the editable explorer as one offline reference page. No packages needed.
// Run: node src/libs/build-vertical-spreads.mjs
import { readFileSync, writeFileSync, mkdirSync, renameSync, rmSync } from 'node:fs';

const input = new URL('../ihtml/ch1-v-spread/btcusdt-ohlc-vertical-spreads.html', import.meta.url);
const output = new URL('../../wiki/refpages/btcusdt-vertical-spreads.html', import.meta.url);
const local = url => !/^([a-z]+:|\/\/|#)/i.test(url);
const read = url => {
  if (!local(url)) throw new Error(`Expected a local asset: ${url}`);
  return readFileSync(new URL(url, input), 'utf8');
};

let styles = 0, scripts = 0;
const html = readFileSync(input, 'utf8')
  .replace(/<link\b[^>]*\brel="stylesheet"[^>]*>/gi, tag => {
    const href = tag.match(/\bhref="([^"]+)"/i)?.[1];
    if (!href) throw new Error('Stylesheet is missing its href');
    styles++;
    return `<style>\n${read(href).replace(/<\/style/gi, '<\\/style')}\n</style>`;
  })
  .replace(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/gi, (_, src) => {
    scripts++;
    return `<script>\n${read(src).replace(/<\/script/gi, '<\\/script')}\n</script>`;
  });

if (styles !== 2 || scripts !== 2) throw new Error('Expected two stylesheets and two classic scripts');
if (/<script\b[^>]*\bsrc=|<link\b|\b(?:src|href)="(?:\.\.\/|https?:)/i.test(html))
  throw new Error('Export still contains an external asset reference');
const snapshot = html.match(/<script id="ohlc-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
const data = JSON.parse(snapshot || 'null');
if (data?.bars?.length !== 128 || !/^[a-f0-9]{64}$/.test(data.sha256) || !data.source)
  throw new Error('Expected the complete embedded snapshot and provenance');
if ((html.match(/data-spread-mode=/g) || []).length !== 4)
  throw new Error('Expected four explicit mode buttons');

const comment = '<!-- Generated from src/ihtml/ch1-v-spread/btcusdt-ohlc-vertical-spreads.html; rebuild: node src/libs/build-vertical-spreads.mjs. -->';
const result = html.replace(/<!doctype html>/i, match => `${match}\n${comment}`);
mkdirSync(new URL('./', output), { recursive: true });
const temporary = new URL(`${output.href}.tmp-${process.pid}`);
try {
  writeFileSync(temporary, result);
  renameSync(temporary, output);
} finally {
  rmSync(temporary, { force: true });
}
console.log(`Exported ${output.pathname}: four modes, ${data.bars.length} embedded bars`);
