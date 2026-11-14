// Regenerate all nine option pages' embedded 128-bar snapshots. No packages needed.
// Run: node src/libs/build-btc-ohlc.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const source = 'data-spot/BTCUSDT/BTCUSDT_agg_1d_2021-04-26_2026-10-30.csv';
const input = readFileSync(new URL(`../../${source}`, import.meta.url), 'utf8');
const [header, ...lines] = input.trim().split(/\r?\n/);
const fields = header.split(',');
const rows = lines.map(line => Object.fromEntries(line.split(',').map((value, i) => [fields[i], value])));
rows.sort((a, b) => Number(a.timestamp_ms) - Number(b.timestamp_ms));
const selected = rows.slice(-128);
if (selected.length !== 128) throw new Error('Need at least 128 daily bars');
const bars = selected.map((row, index) => {
  const bar = { date: row.datetime_utc.slice(0, 10) };
  for (const field of ['open', 'high', 'low', 'close']) {
    bar[field] = Number(row[field]);
    if (!Number.isFinite(bar[field]) || bar[field] <= 0) throw new Error(`Invalid ${field} at ${bar.date}`);
  }
  if (bar.low > Math.min(bar.open, bar.close) || bar.high < Math.max(bar.open, bar.close)) throw new Error(`Invalid OHLC at ${bar.date}`);
  if (index && Number(row.timestamp_ms) - Number(selected[index - 1].timestamp_ms) !== 86400000) throw new Error('Expected consecutive daily bars');
  return bar;
});
const pattern = /(<script id="ohlc-data" type="application\/json">)[\s\S]*?(<\/script>)/;
const data = JSON.stringify({ source, sha256: createHash('sha256').update(input).digest('hex'), bars });
// Validate every page before writing any, so a missing page cannot cause a partial update.
const pages = [
  ...['lcall', 'lput', 'scall', 'sput'].map(strategy => `ch0-intro/btcusdt-ohlc-${strategy}.html`),
  ...['call', 'put'].map(type => `ch1-v-spread/btcusdt-ohlc-debit-${type}-spread.html`),
  ...['call', 'put'].map(type => `ch1-v-spread/btcusdt-ohlc-credit-${type}-spread.html`),
  'ch1-v-spread/btcusdt-ohlc-vertical-spreads.html',
];
const outputs = pages.map(page => {
  const output = new URL(`../ihtml/${page}`, import.meta.url);
  const html = readFileSync(output, 'utf8');
  if (!pattern.test(html)) throw new Error(`Embedded data placeholder missing: ${output.pathname}`);
  return { output, html: html.replace(pattern, (_, start, end) => `${start}\n${data}\n${end}`) };
});
for (const { output, html } of outputs) {
  writeFileSync(output, html);
  console.log(`Updated ${output.pathname}: ${bars.length} bars, ${bars[0].date} to ${bars.at(-1).date}`);
}
