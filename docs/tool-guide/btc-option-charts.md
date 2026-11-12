# BTC candlesticks and option payoff charts

Four offline pages share the same daily BTCUSDT snapshot and chart renderer:

| Position | Page |
| --- | --- |
| Long call | [btcusdt-ohlc-lcall.html](../../src/ihtml/ch0-intro/btcusdt-ohlc-lcall.html) |
| Long put | [btcusdt-ohlc-lput.html](../../src/ihtml/ch0-intro/btcusdt-ohlc-lput.html) |
| Short call | [btcusdt-ohlc-scall.html](../../src/ihtml/ch0-intro/btcusdt-ohlc-scall.html) |
| Short put | [btcusdt-ohlc-sput.html](../../src/ihtml/ch0-intro/btcusdt-ohlc-sput.html) |

Each page embeds its 128-bar dataset and loads the shared
[JavaScript](../../src/libs/ohlc-chart.js) and
[stylesheet](../../src/libs/ohlc-chart.css). The body attributes
`data-option-type="call|put"` and `data-position="long|short"` select the behavior.
The renderer defaults to long call when those attributes are absent.

## Slide frame layout

All four pages fit a 1024×576 iframe without page or chart scrolling. A viewport
grid keeps the header, OHLC readout, paired plots, contract summary and centered
P&L card within the frame. Captions and source text below the card are omitted;
the date-range tooltip retains the source CSV path and hash.

The renderer shows the most recent candles that fit with readable bodies, plus
15 bars of empty space on the right. At 1024×576 this displays 93 candles;
at 1440px wide it displays all 128. The full snapshot stays embedded. The visible
date range, bar count, hover mapping and keyboard limits follow the visible slice.
Price bounds include the visible candles and every available strike/breakeven,
and remain fixed while changing the selected strike.

The chart follows the available frame height. Below a 760px chart width, horizontal
scrolling provides access to the payoff and strike control. The slider retains
its selection through viewport changes.

## Strike and premiums

The strike ladder is centered on the latest close rounded to the nearest 1,000,
with eleven strikes at 1,000-USDT intervals and limits of ±5,000 around that center.
The current ladder is 72,000–82,000 and starts at 77,000. Spot remains 77,368.77.
Dragging, wheel input and keyboard input update the selected contract immediately.

Premiums are illustrative, per 1 BTC, without bid/ask spreads or fees. At the
lowest, middle and highest strikes, calls cost 6,500 / 3,000 / 1,500 USDT; puts
cost 1,500 / 3,000 / 6,500. Long and short versions use the same premium.

## Payoff conventions

| Position | Net P&L at expiry price `P`, strike `K`, premium `p` | Breakeven |
| --- | --- | --- |
| Long call | `max(P - K, 0) - p` | `K + p` |
| Long put | `max(K - P, 0) - p` | `K - p` |
| Short call | `p - max(P - K, 0)` | `K + p` |
| Short put | `p - max(K - P, 0)` | `K - p` |

Positive P&L extends left; negative P&L extends right. Candles and payoff curves
share one vertical price scale. Both axes stay fixed while selecting strikes.
The dashed curve shows gross payoff for a long position and negative settlement
outflow for a short position. The solid curve and the readout show net P&L.

Call ITM regions are above strike; put ITM regions are below strike. Shorting
does not change the option's moneyness. Moneyness and net profitability differ
because of premium. The short-call summary shows uncapped loss; the short-put
summary shows maximum loss at BTC price zero.

## Regenerating the snapshot

Run from the repository root:

```sh
node src/libs/build-btc-ohlc.mjs
```

The generator reads the CSV identified in its source, validates the last 128 daily
bars, and updates the embedded data and CSV SHA-256 in all four pages. It validates
every page before writing any. No dependency installation is required.

For offline slide embedding, use the existing
[iframe bundling workflow](inline-frames.md); it inlines the local chart script
and stylesheet into each page's iframe `srcdoc`.
