# BTC candlesticks and option payoff charts

Nine offline source pages share the same daily BTCUSDT snapshot. The four single-leg
pages use one renderer; the four fixed vertical spreads and combined explorer use
a separate shared renderer.

| Position | Page |
| --- | --- |
| Long call | [btcusdt-ohlc-lcall.html](../../src/ihtml/ch0-intro/btcusdt-ohlc-lcall.html) |
| Long put | [btcusdt-ohlc-lput.html](../../src/ihtml/ch0-intro/btcusdt-ohlc-lput.html) |
| Short call | [btcusdt-ohlc-scall.html](../../src/ihtml/ch0-intro/btcusdt-ohlc-scall.html) |
| Short put | [btcusdt-ohlc-sput.html](../../src/ihtml/ch0-intro/btcusdt-ohlc-sput.html) |
| Bull call debit spread | [btcusdt-ohlc-debit-call-spread.html](../../src/ihtml/ch1-v-spread/btcusdt-ohlc-debit-call-spread.html) |
| Bear put debit spread | [btcusdt-ohlc-debit-put-spread.html](../../src/ihtml/ch1-v-spread/btcusdt-ohlc-debit-put-spread.html) |
| Bear call credit spread | [btcusdt-ohlc-credit-call-spread.html](../../src/ihtml/ch1-v-spread/btcusdt-ohlc-credit-call-spread.html) |
| Bull put credit spread | [btcusdt-ohlc-credit-put-spread.html](../../src/ihtml/ch1-v-spread/btcusdt-ohlc-credit-put-spread.html) |

Each single-leg page embeds its 128-bar dataset and loads the shared
[JavaScript](../../src/libs/ohlc-chart.js) and
[stylesheet](../../src/libs/ohlc-chart.css). The body attributes
`data-option-type="call|put"` and `data-position="long|short"` select the behavior.
The renderer defaults to long call when those attributes are absent.

## Slide frame layout

All four single-leg pages fit a 1024×576 iframe without page or chart scrolling. A viewport
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

## Debit spread pages

The two pages in `src/ihtml/ch1-v-spread/` combine equal quantities of a long and
short option, same underlying and expiry. They share
[debit-spread-model.js](../../src/libs/debit-spread-model.js),
[ohlc-spread-chart.js](../../src/libs/ohlc-spread-chart.js), and the
[spread stylesheet](../../src/libs/ohlc-spread-chart.css) layered over the base
chart stylesheet. `data-option-type="call|put"` selects the strategy. The existing
single-leg renderer and styles are unchanged.

Both debit and credit pages use this same model, renderer and stylesheet. The
model exposes `BtcVerticalSpread.create(optionType, spot, spreadType)`, with
`spreadType` defaulting to `debit`. Its historical filename is retained so existing
script references keep working; `BtcDebitSpread.create(optionType, spot)` remains
a debit-only compatibility entry point. The renderer reads the body attribute
`data-spread-type="credit|debit"`, defaulting to debit when absent.

The **whole presentation** is at most 1024×576, including header, plots, controls,
risk summary and centered P&L readout. At that viewport neither the page nor chart
scrolls. Larger viewports retain the cap. At this size the chart shows 69 recent
candles with 15 empty bars of right padding. Narrow screens scroll horizontally
inside the chart to reach the payoff and controls; the full snapshot remains
embedded. Source CSV and hash are available in the date-range tooltip.

### Two strike controls

Buy and Sell occupy separate vertical lanes aligned with the BTC price axis.
They use the same 11 strikes and illustrative premium chain described above.
Call spreads require `buy < sell`; put spreads require `sell < buy`. Minimum
width is 1,000 USDT. Moving into equality or crossing clamps the active leg one
step before the other; the other leg stays fixed and labels never swap. Full
slider rail bounds stay fixed so the thumb remains at the correct price. Each
control's accessible value describes its valid strike interval.

Dragging, wheel input, arrow keys, Page Up/Down and Home/End select strikes.
Continuous wheel bursts produce one step; a pause or direction change starts
another. Reset restores Buy at the ladder center and Sell 3,000 above for calls
or 3,000 below for puts. Both legs use identical illustrative prices for a given
contract, with no bid/ask differences or fees. They do not reuse the $100k strikes
or bid/ask examples in the older debit-spread comparison page.

### Combined expiry P&L

For buy strike `Kb`, sell strike `Ks`, paid premium `pb`, and received premium
`ps`, the debit is `D = pb − ps` and width is `W = abs(Ks − Kb)`:

| Strategy | Combined net P&L at expiry price P | Breakeven |
| --- | --- | --- |
| Bull call debit spread | `max(P − Kb, 0) − max(P − Ks, 0) − D` | `Kb + D` |
| Bear put debit spread | `max(Kb − P, 0) − max(Ks − P, 0) − D` | `Kb − D` |

Maximum loss is `D`; maximum profit is `W − D`. Every allowed pair has
`0 < D < W`. Defaults currently have a 900-USDT debit, 2,100-USDT maximum profit
and 3,000-USDT width, with breakeven 77,900 for calls or 76,100 for puts.

The thick solid curve is combined **net** P&L, with profit/loss shading. Show legs
adds thin dashed Buy/Sell **net** P&L curves; there is no additional gross-payoff
curve. Both axes stay fixed across all valid pairs and leg visibility changes.
Profit still points left and loss right. Distinct Buy/Sell strike lines, a width
bracket, spot and breakeven share the candles' vertical scale; close level labels
separate with leader lines without moving the actual price levels.

Hover or tap either plot to inspect a hypothetical expiry price and the signed
sum of both legs in the P&L card. Readout text distinguishes below, between and
above strikes and explains which legs have intrinsic value. The vertical-spread
plots omit moneyness labels and region highlighting. Moving a strike
reprices the retained hover price. Focus the chart and use Left/Right or Home/End
to inspect visible candle OHLC and hypothetical expiry P&L at its closing price;
Escape clears this inspection. The info icon supports hover, tap, keyboard focus
and Escape dismissal.

## Credit spread pages

The credit pages use the same capped 1024×576 whole-page layout, snapshot, pricing
chain, native controls, leg toggle, shared axes and hover behavior as debit pages.
At the target size they also show 69 recent candles and 15 bars of right padding.
Their body specifies `data-spread-type="credit"`; they have no strategy selector.

| Strategy | Required strike order | Default Sell | Default Buy |
| --- | --- | --- | --- |
| Bear call credit spread | Sell lower, Buy higher | B | B + 3,000 |
| Bull put credit spread | Buy lower, Sell higher | B | B − 3,000 |

Here `B` is the rounded ladder center (currently 77,000). Minimum width remains
1,000 USDT; equality/crossing clamps only the active leg. The Buy/Sell labels and
colors never swap. Reset restores the credit defaults with Sell at the center.

For received premium `ps`, paid premium `pb`, Sell strike `Ks`, and Buy strike
`Kb`, credit is `C = ps − pb` and width is `W = abs(Kb − Ks)`:

| Strategy | Combined net P&L at expiry price P | Breakeven |
| --- | --- | --- |
| Bear call credit spread | `C − max(P − Ks, 0) + max(P − Kb, 0)` | `Ks + C` |
| Bull put credit spread | `C − max(Ks − P, 0) + max(Kb − P, 0)` | `Ks − C` |

**Maximum profit is C; maximum loss is W − C.** Every valid pair has `0 < C < W`.
Current defaults receive 900 USDT, have 2,100-USDT maximum loss and 3,000-USDT
width. Breakevens are 77,900 for calls and 76,100 for puts. The call spread profits
below both strikes and loses above both; the put spread loses below both and
profits above both. Reversing both legs of a debit spread with identical premiums
negates its net expiry P&L.

The summary explicitly shows Net credit, Width, Max profit, Max loss and
Breakeven. The readout adds signed Buy and Sell net P&L; it does not treat the
initial credit as realized profit. The info tooltip explains the retained
liability until closing or expiry and that illustrative premiums exclude bid/ask
differences, fees and margin costs. Touch inspection persists on finger release.

## Combined vertical spread explorer

The [editable explorer](../../src/ihtml/ch1-v-spread/btcusdt-ohlc-vertical-spreads.html)
combines all four spread strategies in one chart. Its top bar has four visible
buttons: Call debit, Put debit, Call credit and Put credit. The active button is
highlighted and exposes its pressed state to assistive technology. Tab reaches
each button; Enter or Space selects a mode without reloading the page.

Each mode remembers its own Buy/Sell strikes for the current page session.
First visits use that strategy's existing defaults; Reset strikes resets only
the current mode. Show legs is shared across modes. Historical inspection and
an active hypothetical expiry price are retained and repriced when switching.
Refresh starts a new session. The four original pages remain fixed-strategy pages.

The explorer retains the 1024×576 cap and fits all four buttons at that size.
On narrow screens the navigation wraps and the page can scroll vertically;
the chart retains horizontal scrolling to reach both strike controls.

Export a single offline HTML file, with CSS, scripts and snapshot embedded:

```sh
node src/libs/build-vertical-spreads.mjs
```

The result is [wiki/refpages/btcusdt-vertical-spreads.html](../../wiki/refpages/btcusdt-vertical-spreads.html),
linked from the wiki index. Edit the source shell or shared assets, then rebuild;
do not edit the generated export. Export uses the embedded snapshot and needs
no access to the external CSV. The page works directly from disk or when only
the `wiki/` directory is hosted, without runtime asset requests.

## Regenerating the snapshot

Run from the repository root:

```sh
node src/libs/build-btc-ohlc.mjs
node src/libs/build-vertical-spreads.mjs
```

The generator reads the CSV identified in its source, validates the last 128 daily
bars, and updates the embedded data and CSV SHA-256 in all nine source pages. It
validates every page before writing any. Then rebuild the combined reference export
so its snapshot and assets stay current. No dependency installation is required.

For offline slide embedding, use the existing
[iframe bundling workflow](inline-frames.md); it inlines the local chart script
and stylesheet into each page's iframe `srcdoc`.
