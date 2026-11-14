# BTC debit vertical spread charts

Updated: 2026-11-13
Status: Complete; implemented and verified 2026-11-13.

## Outcome

Create two standalone, offline HTML explainers combining the daily BTC candles
and sideways option chart used in `ch0-intro` with a two-leg debit spread:

- `src/ihtml/ch1-v-spread/btcusdt-ohlc-debit-call-spread.html`
- `src/ihtml/ch1-v-spread/btcusdt-ohlc-debit-put-spread.html`

The whole HTML presentation is capped at 1024×576 pixels, including the header,
candles, both strike controls, combined P&L chart, risk summary and hover readout.
At 1024×576 there must be no page or chart scrolling; larger viewports retain
the presentation cap instead of enlarging the chart. This task adds new pages; it does not
replace the existing long-option comparison page or automatically change decks.

## References

- [Debit spread comparison](../../src/ihtml/10debit_spreads_vs_long_options.html)
- [Long call page](../../src/ihtml/ch0-intro/btcusdt-ohlc-lcall.html)
- [Short call page](../../src/ihtml/ch0-intro/btcusdt-ohlc-scall.html)
- [Long put page](../../src/ihtml/ch0-intro/btcusdt-ohlc-lput.html)
- [Short put page](../../src/ihtml/ch0-intro/btcusdt-ohlc-sput.html)
- [Existing renderer](../../src/libs/ohlc-chart.js)
- [Existing styles](../../src/libs/ohlc-chart.css)
- [Chart conventions and snapshot workflow](../../docs/tool-guide/btc-option-charts.md)
- [Offline iframe bundling](../../docs/tool-guide/inline-frames.md)
- [Completed single-leg plan](strike-slider.md)

## Scope and agreed behavior

- Same underlying, same expiry and equal quantities: buy one option and sell one
  option of the same type, per 1 BTC exposure. All curves show expiry P&L.
- Call page: bull call debit spread; buy the lower strike, sell the higher strike.
- Put page: bear put debit spread; buy the higher strike, sell the lower strike.
- Two separate vertical slider lanes, permanently labeled **Buy** and **Sell**.
  Both lanes align with the same vertical BTC price axis.
- Minimum width is one 1,000-USDT strike step. Equal strikes and crossed strikes
  are unavailable. Keep both labels and leg identities fixed.
- At the limit, clamp only the control being moved; do not push the other leg or
  swap identities. Show “Minimum spread width: 1,000 USDT” when applicable.
- Support drag, wheel and keyboard stepping, with the existing wheel-burst
  handling and accessible native range controls.
- No straddles, credit spreads, leg-type selectors, unequal ratios, live quotes,
  pre-expiry valuation, or expiry controls in this version.

## Strike ladder and illustrative pricing

Use the existing snapshot's latest close as fixed spot. Center the eleven-strike
ladder on `B = round(spot / 1,000) × 1,000`, from `B − 5,000` to `B + 5,000`.
The current snapshot gives spot 77,368.77 and strikes 72,000–82,000 USDT.

Default to a 3,000-USDT width:

| Page | Buy strike | Sell strike |
| --- | --- | --- |
| Call | B | B + 3,000 |
| Put | B | B − 3,000 |

Reset restores both defaults. These are implementation defaults, rather than
additional user-approved controls or new strategy modes.

Use the same illustrative premium function as the single-leg charts for both
legs. Let `d = K − B` for calls and `d = B − K` for puts:

```text
p(K) = 3,000 − 0.70 × d    when d <= 0
p(K) = 3,000 − 0.30 × d    when d >= 0
```

Premiums are per 1 BTC, without bid/ask differences or fees. State this clearly
in an info tooltip. The comparison page's $100k examples explain the strategy;
do not transplant their strikes or executable bid/ask assumptions into this
different illustrative chain. Verify `0 < debit < width` for every allowed pair.

## Calculations

Let `P` be expiry BTC price, `Kb` the buy strike, `Ks` the sell strike, `pb` the
premium paid and `ps` the premium received:

```text
D = pb − ps
W = abs(Ks − Kb)

Call long leg  = max(P − Kb, 0) − pb
Call short leg = ps − max(P − Ks, 0)
Call spread   = Call long leg + Call short leg
Call breakeven = Kb + D

Put long leg   = max(Kb − P, 0) − pb
Put short leg  = ps − max(Ks − P, 0)
Put spread    = Put long leg + Put short leg
Put breakeven = Kb − D

Maximum loss = D
Maximum profit = W − D
```

Derive displayed values from this shared calculation model. Moving either leg
updates premiums, debit, width, breakeven, both legs and the combined curve.

## Visual and interaction design

- Retain candles on the left, payoff on the right, and a shared vertical price
  scale. Positive P&L extends left; negative P&L extends right.
- Place the Buy and Sell lanes to the right of the payoff. Reserve their space
  explicitly so they do not cover candles, curve labels or one another.
- Keep each lane's full ladder geometry fixed. Enforce pair-specific limits in
  the input handler rather than shortening a slider's price mapping; its thumb
  must remain level with its strike line. Explain the valid range accessibly.
- Use distinct leg colors and text labels for Buy/Sell strike lines. Include a
  bracket between the two levels labeled with the spread width. Prevent nearby
  labels from colliding at minimum width.
- Make combined net P&L a thick solid curve. Default “Show legs” to off; enabling
  it overlays two thinner dashed leg net-P&L curves with a clear legend. Do not
  mix these with additional gross-payoff curves in this first version.
- Use profit/loss shading for combined P&L. Replace the single-leg ITM/ATM/OTM
  overlay with below/between/above-strike regions and explain which legs have
  intrinsic value; never label the whole spread with one leg's moneyness.
- A shared hover price guide updates the combined dot and, when shown, leg dots.
  The centered card emphasizes combined P&L and shows the signed arithmetic:
  long-leg P&L + short-leg P&L = combined P&L. Identify this as hypothetical expiry
  P&L at the inspected price, even when the guide crosses a historical candle.
- Keep spot, both strikes, breakeven and the three price regions distinguishable.
  Preserve candle OHLC inspection and historical keyboard navigation.
- Display debit, width, maximum loss/profit and breakeven in a compact summary.
  Move methodology and longer explanations into accessible info tooltips.
- Keep price and P&L scales fixed across valid strike selections and the leg
  visibility toggle at a given viewport. Include all selectable strikes,
  breakevens and curves in domain calculations; choose sufficient P&L width so
  the combined shape remains legible with optional legs. Validate this visually
  before finalizing panel proportions.
- Preserve both strikes, leg visibility and the active hover price across redraws
  and viewport changes. Reprice the existing hover readout after either leg moves.
- Keep native slider DOM nodes stable during SVG redraws for focus and dragging.
- Follow existing narrow-screen horizontal scrolling when the full chart cannot
  fit; 1024×576 must require no scrolling. Larger frames retain the presentation cap.

## Implementation approach

1. Add the two HTML shells with embedded copies of the existing 128-bar snapshot,
   preserving its source path and SHA-256 metadata.
2. Add one shared spread renderer, `src/libs/ohlc-spread-chart.js`, selected
   by `data-option-type="call|put"`, plus the pure `src/libs/debit-spread-model.js`
   calculation model. Reuse existing OHLC behavior and styling;
   extract a small shared helper only where it avoids substantial duplication
   without changing the four existing single-leg pages' behavior.
3. Add spread-specific styles, `src/libs/ohlc-spread-chart.css`, alongside
   the base stylesheet. Keep the compact layout and two-slider rules scoped.
4. Implement the calculation model, pair constraints and stable slider mapping.
5. Draw the combined curve, optional legs, strike lines, width bracket, summary
   and synchronized hover interactions.
6. Extend the snapshot generator's explicit output list to include both new pages,
   preserving its validate-all-before-writing behavior. Do not alter source data.
7. Update the chart guide with page links, two-leg conventions, controls, pricing
   assumptions and regeneration instructions.
8. Validate standalone pages and an actual bundled offline iframe. Rebuild any
   existing consumer decks only if they reference the new pages; do not add deck
   references or overwrite unrelated user work as part of this scope.

## Validation and acceptance

- Check all 55 valid strike pairs for each page. Require positive width/debit,
  debit below width, and breakeven strictly between the two strikes.
- For every pair, verify expiry P&L below both strikes, at each strike, between
  strikes, at breakeven, and above both strikes. Check continuity, both plateaus,
  maximum loss/profit and the equality between the combined and summed leg P&Ls.
- Confirm the 3,000-wide defaults, reset, 1,000-wide minimum, full-width pair and
  bounds. Reject equality/crossing through drag, wheel and keyboard input while
  keeping the other leg stationary. Verify rapid consecutive updates as well.
- Confirm thumb/strike alignment, stable axes, fixed spot, retained focus and
  pointer capture, hover repricing, leg toggling and readable close strike labels.
- Inspect both pages at 1024×576, a wider viewport and a narrow viewport. Ensure
  all controls, summary and readout fit at the target size, with no clipped curves
  or overlapping labels. Record the visible candle count rather than assuming
  it stays 93 after allocating space for a second lane.
- Verify keyboard and pointer OHLC inspection, touch/tap access, tooltip focus
  and Escape behavior, and slider state retention after resize.
- Verify each offline bundled iframe renders both curves/controls and updates
  P&L without local fetches or missing assets. Inline info SVGs as in the compact
  comparison page so the existing bundler can keep them self-contained.
- Confirm both snapshots match the existing source/hash and that regeneration
  covers all six pages. Run suitable regression checks on the four single-leg
  charts if shared code, base styles or generator logic changes.
- Keep verification scripts/artifacts temporary or within existing ignored test
  conventions; do not change ignore rules solely to track tests.

## Work state

- [x] Record the agreed two-page scope and strike constraints.
- [x] Implement shared model, controls and renderer.
- [x] Create both standalone HTML explainers.
- [x] Extend snapshot regeneration and update the chart guide.
- [x] Validate calculations, interactions, compact layout and offline embedding.
- [x] Record completion evidence and any material deviations in this plan.

## Completion evidence

- Added both pages under `src/ihtml/ch1-v-spread/`, per the implementation request.
  The whole presentation measures exactly 1024×576 at the target viewport with
  no document or chart scrolling. A 1440×900 viewport retains that cap. The chart
  shows 69 recent candles plus 15 empty bars; the full 128-bar snapshot is intact.
- Shared model checks cover every valid pair (55 call and 55 put), positive debit
  below width, breakeven, expiry values and constrained inputs for either leg.
  Browser checks cover all 110 pairs and 660 expiry samples, fixed axes,
  thumb/strike alignment, non-overlapping level labels, hover repricing,
  optional leg curves, stable native slider nodes and whole-frame bounds.
- Real Chrome drag, keyboard and wheel checks verify crossing/equality clamps,
  stationary opposite leg, focus, wheel burst/pause/reversal, chart Home/End
  inspection, tooltip/Escape and state retention after resize. Both normal and
  leg views, minimum width and narrow layouts were visually inspected.
- Actual frames built with `src/inline-frames.ts` render and update offline at
  1024×576, with local model/renderer/styles and inline icons bundled. Both show
  zero P&L at breakeven, and real touch inspection remains visible on finger lift.
  The touch pointerleave fix is confined to the spread renderer.
- Snapshot regeneration covers all six pages. Regenerating leaves all six HTML
  files byte-identical; each 128-bar snapshot matches the source CSV SHA-256.
  The four existing single-leg pages retain 93 visible candles at 1024×576 and
  update strikes correctly. Their renderer, stylesheet and HTML are unchanged.
- No browser runtime errors occurred. New JavaScript syntax checks and scoped
  whitespace checks pass. The chart guide documents the new pages and behavior.

## Implementation decisions and scope adjustments

- The latest user request supersedes the original `ch0-intro` output location and
  expanding wide-frame behavior: new pages use `ch1-v-spread`, with the entire
  presentation capped at 1024×576.
- Kept a separate spread renderer rather than refactoring the single-leg code.
  Their one-strike assumptions are extensive; isolated spread code avoids
  unnecessary regressions while sharing the base stylesheet and snapshot workflow.
- The pure calculation model uses a separate classic script so it can be checked
  independently and inlined by the existing offline bundler without imports.
- No existing decks reference the new pages. Only a temporary verification deck
  was built and removed; no user deck references or published exports were changed.
