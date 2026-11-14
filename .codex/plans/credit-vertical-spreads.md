# BTC credit vertical spread charts

Updated: 2026-11-13
Status: Complete; implemented and verified 2026-11-13.

## Outcome

Create two standalone offline HTML explainers combining daily BTC candles and a
sideways two-leg expiry P&L plot, following the completed debit-spread pages:

- `src/ihtml/ch1-v-spread/btcusdt-ohlc-credit-call-spread.html`
- `src/ihtml/ch1-v-spread/btcusdt-ohlc-credit-put-spread.html`

The **whole HTML presentation** is capped at 1024×576 pixels: header, candles,
both strike controls, combined P&L plot, risk summary and hover readout. At that
viewport neither the document nor chart scrolls. Larger viewports retain the
cap; narrow viewports may scroll horizontally within the chart as on debit pages.

This plan covers new credit-spread pages and the shared code required for them.
Do not add deck references or publish exports automatically. Compacting the
existing credit comparison is a separate, completed page-layout task, not the
implementation of these two planned pages.

## References

- [Completed debit plan](debit-vertical-spreads.md)
- [Credit comparison](../../src/ihtml/11credit_spreads_vs_short_options.html)
- [Debit call spread](../../src/ihtml/ch1-v-spread/btcusdt-ohlc-debit-call-spread.html)
- [Debit put spread](../../src/ihtml/ch1-v-spread/btcusdt-ohlc-debit-put-spread.html)
- [Current pure debit model](../../src/libs/debit-spread-model.js)
- [Shared spread renderer](../../src/libs/ohlc-spread-chart.js)
- [Spread styles](../../src/libs/ohlc-spread-chart.css)
- [Base chart styles](../../src/libs/ohlc-chart.css)
- [Snapshot generator](../../src/libs/build-btc-ohlc.mjs)
- [Chart conventions](../../docs/tool-guide/btc-option-charts.md)
- [Offline bundling workflow](../../docs/tool-guide/inline-frames.md)

## Scope and agreed interaction conventions

- Equal quantities: sell one option and buy one protective option, same type,
  underlying and expiry; 1 BTC exposure per leg. Show expiry P&L only.
- Call page: **bear call credit spread**; sell the lower strike, buy the higher.
- Put page: **bull put credit spread**; buy the lower strike, sell the higher.
- Keep two separate vertical slider lanes, permanently labeled Buy and Sell.
  Both map to the common BTC price axis; do not swap identities automatically.
- Minimum width is one 1,000-USDT step. Block equal and crossed strikes. Clamp
  only the active control one step before the other; the other stays stationary.
- Keep full ladder bounds on both native ranges so thumb position stays aligned
  with the actual strike. Enforce strategy-specific pair constraints in handlers
  and expose each usable interval through accessible descriptions.
- Drag, wheel, arrows, Page Up/Down, Home/End and Reset behave like the debit pages.
  Continuous wheel bursts produce one step; pauses or reversals permit another.
- Show the minimum-width hint when that constraint applies; distinguish a ladder
  endpoint from a minimum-width block.
- No debit/credit mode switch in the page UI. Each page teaches one strategy.
  No straddles, unequal ratios, live quotes, expiry controls or pre-expiry valuation.

## Strike ladder, defaults and pricing

Use the existing 128-bar snapshot and latest close as fixed spot. Define
`B = round(spot / 1,000) × 1,000`, with 11 strikes from `B − 5,000` through
`B + 5,000`. Current spot is 77,368.77 and the ladder is 72,000–82,000 USDT.

Defaults have 3,000-USDT width and an ATM-near short leg:

| Page | Sell strike | Buy strike |
| --- | --- | --- |
| Call | B | B + 3,000 |
| Put | B | B − 3,000 |

Reset restores both defaults. Keep spot independent from strike choices.

Use the same illustrative premium chain for long and short legs as on the debit
and single-option pages. For strike `K`, let `d = K − B` for calls and `d = B − K`
for puts:

```text
p(K) = 3,000 − 0.70 × d    when d <= 0
p(K) = 3,000 − 0.30 × d    when d >= 0
```

Premiums are per 1 BTC, without bid/ask differences, fees or margin costs. Do not
reuse the comparison page's $100k strikes or executable bid/ask assumptions in
this different illustrative chain. Every valid pair must satisfy `0 < credit < width`.
Defaults currently give credit 900 USDT and maximum loss 2,100 USDT.

## Calculations

Let `P` be expiry BTC price, `Ks` the sell strike, `Kb` the buy strike, `ps` the
premium received, and `pb` the premium paid:

```text
C = ps − pb
W = abs(Kb − Ks)

Call short leg = ps − max(P − Ks, 0)
Call long leg  = max(P − Kb, 0) − pb
Call spread    = Call short leg + Call long leg
Call breakeven = Ks + C

Put short leg  = ps − max(Ks − P, 0)
Put long leg   = max(Kb − P, 0) − pb
Put spread     = Put short leg + Put long leg
Put breakeven  = Ks − C

Maximum profit = C
Maximum loss = W − C
```

Display maximum loss as a positive risk magnitude; hypothetical losses in the
P&L readout carry their negative sign. With current defaults, breakevens are
77,900 for calls and 76,100 for puts.

The call spread has its profit plateau below both strikes and loss plateau above
both. The put spread has its loss plateau below both and profit plateau above.
The initial credit is a cash inflow, not immediate realized profit; explain the
remaining liability until closing or expiration in the info tooltip.

## Visual design and state

- Follow the existing debit pages: candles left, payoff right, Buy/Sell lanes on
  the far right, five compact risk metrics and a centered P&L readout.
- Keep Buy blue, Sell amber, and combined P&L a thick solid curve. Show legs is
  off initially and reveals thin dashed individual **net** P&L curves. Do not add
  gross-payoff curves to the same plot.
- Retain profit-left/loss-right orientation, combined profit/loss shading, a
  width bracket, distinct strike lines, spot and breakeven markers. Keep the
  underlying levels correct while separating nearby labels with leader lines.
- Summary metrics: **Net credit**, Width, Max profit, Max loss and Breakeven.
  Methodology and longer explanations belong in accessible info tooltips.
- Shared hover/tap price updates the combined dot and optional leg dots. Show
  signed Buy P&L + Sell P&L = Spread P&L, explicitly at hypothetical expiration.
- Below/between/above-strike regions explain which legs have intrinsic value.
  Avoid assigning one ITM/ATM/OTM label to the entire spread.
- Preserve historical candle OHLC inspection and chart keyboard navigation.
  Touch inspection must persist when the finger lifts; mouse exit may clear it.
- Keep price and P&L domains fixed across all valid pairs and leg visibility at
  a given viewport. Include all allowed strikes, breakevens and both leg curves
  in the domain calculation, even while legs are hidden.
- Preserve strike selection, leg visibility and any active hypothetical price
  through redraws and resize. Reprice the retained price when either leg moves.
- Keep native slider DOM nodes stable through SVG updates so dragging, pointer
  capture and keyboard focus continue working.
- Maintain the 1024×576 whole-page cap and existing narrow-screen behavior.
  Confirm visible candle count rather than assuming it must remain 69.

## Implementation milestones

1. **Generalize the spread model and renderer without changing debit behavior.**
   Extend the current pure model to express credit/debit orientation, premiums,
   defaults, bounds and risk formulas. Prefer one shared calculation core rather
   than duplicated premium functions. If renamed to `vertical-spread-model.js`,
   preserve the existing debit entry point or migrate its two consumers together
   and verify their behavior. Add a renderer strategy attribute such as
   `data-spread-type="credit|debit"`, defaulting to debit for existing pages.
   Remove assumptions that all spreads have a debit, debit risk formulas or
   buy-anchored breakeven; make titles, labels and accessible names strategy aware.
2. **Create the two credit HTML pages and controls.** Use the embedded snapshot
   with identical source/hash provenance, shared model/renderer/styles and fixed
   credit strategy metadata. Implement the reversed strike constraints and the
   credit defaults. Reuse the tested compact layout and tooltip pattern.
3. **Update snapshot regeneration and documentation.** Extend the generator's
   explicit output list from six to eight pages, retaining validation of all
   outputs before writing any. Update the chart guide with page links, credit
   conventions, strategy attributes, defaults, pricing and regeneration behavior.
4. **Verify the full implementation.** Check models, real input interactions,
   geometry and actual offline frames. Regress both existing debit pages after
   shared-code changes and smoke-check the four single-option pages after the
   generator update. Record evidence and any deviations here before completion.

## Validation and acceptance

- Verify all 55 valid pairs for calls and all 55 for puts: positive width/credit,
  credit below width, breakeven strictly between strikes, and correct risk limits.
- For every pair, test below both strikes, at both strikes, between strikes, at
  breakeven and above both. Verify continuity, plateau signs, zero P&L at breakeven
  and exact equality between combined P&L and the sum of the two legs.
- For identical contracts with reversed Buy/Sell roles and the same premiums,
  credit-spread P&L must equal the negative of the corresponding debit-spread P&L.
- Verify defaults/reset, minimum/full width, ladder endpoints and blocked
  equality/crossing through drag, wheel and keyboard. The opposite leg must not
  move. Check repeated input, wheel normalization, focus and drag continuity.
- Confirm thumb/strike alignment, fixed axes and spot, accurate hover repricing,
  optional leg curves, signed readout and clear below/between/above explanations.
- Inspect both normal and leg views at default, minimum and maximum widths.
  At 1024×576, all content and tooltips must fit without clipping, collisions or
  scrolling; larger viewports retain the cap. Verify narrow horizontal scrolling.
- Check pointer, touch release, OHLC navigation, tooltip focus/Escape, resize
  state and accessible labels. No browser runtime errors are acceptable.
- Build actual srcdoc frames with `src/inline-frames.ts`; verify both pages work
  offline with local scripts/styles inlined and info icons embedded. Only rebuild
  existing consumer decks if they reference the new pages; do not add references.
- Verify all eight snapshots still match the source CSV hash. Regeneration with
  unchanged inputs must leave page contents unchanged. Preserve the source data.
- Recheck every debit pair and core debit interactions if the model/renderer is
  generalized; changing credit behavior must not alter the existing debit pages.
- Follow existing ignored/temporary verification conventions; do not modify
  ignore rules solely to track tests. Use temporary implementation state when
  executing this multi-milestone plan, then remove it after successful verification.

## Work state

- [x] Record two-page credit scope, output paths and whole-page frame limit.
- [x] Generalize the shared spread model and renderer with debit compatibility.
- [x] Create the two credit HTML pages with constrained controls.
- [x] Extend snapshot generation and update the chart guide.
- [x] Verify calculations, interactions, compact layout and offline bundling.
- [x] Record completion evidence and remove temporary implementation state.

## Completion evidence

- Added both credit pages in `src/ihtml/ch1-v-spread/`. Bear calls sell the lower
  strike and buy the higher; bull puts sell the higher and buy the lower. Sell
  defaults to 77,000 and Buy to 80,000/74,000 respectively. Both receive 900 USDT,
  with maximum profit 900 and maximum loss 2,100. Breakevens are 77,900/76,100.
- The whole presentation fits 1024×576 without document or chart scrolling,
  showing 69 recent candles plus 15 bars of padding. Larger viewports retain the
  cap; narrow viewports keep the existing internal horizontal scrolling.
- Independent model checks cover all valid debit and credit pairs, risk
  plateaus, breakevens, constraints and the identity that reversed positions
  negate expiry P&L. Every original debit numeric result matches the pre-change
  model; the compatibility entry point still selects debit.
- Browser checks pass all 55 pairs on each of the four spread pages: 220 pairs
  and 1,320 sampled expiry values. Checks include credit/debit summaries, risk
  signs, zero P&L at breakeven, fixed axes, thumb alignment, leg toggles, hover
  repricing, stationary opposite leg, level-label separation and full-frame bounds.
- Native keyboard, drag and wheel checks cover both Buy and Sell on all four
  pages, including crossing blocks, ladder ends, burst/pause/reversal, focus,
  historical OHLC navigation, tooltip/Escape and resize state. Normal, leg,
  minimum-width, maximum-width and narrow credit views were inspected visually.
- Actual srcdoc frames built by `src/inline-frames.ts` render all four spread
  pages offline with no external local assets. Minimum/full width, breakeven,
  leg curves and real touch release all pass. The four original single-option
  pages still fit 1024×576, show 93 bars and update strikes correctly.
- The generator validates eight explicit paths before writing. Regeneration
  leaves all eight HTML files unchanged, with 128-bar snapshots matching the
  source CSV SHA-256. No source data or existing user decks were changed.
- No browser runtime errors occurred. JavaScript syntax, scoped whitespace and
  local asset-link checks pass. Temporary verification decks and implementation
  state are removed after final verification; no published exports are changed.

## Implementation decisions

- Kept the historical `debit-spread-model.js` path to preserve existing script
  references. The shared calculation core now exposes the neutral
  `BtcVerticalSpread.create(optionType, spot, spreadType='debit')` API, alongside
  the original debit-only `BtcDebitSpread.create(optionType, spot)` wrapper.
  This avoids duplicated pricing logic and a needless filename migration.
- Credit pages explicitly set `data-spread-type="credit"`. Existing debit pages
  omit it and retain debit behavior. The shared renderer selects credit labels,
  amount metadata, strategy names, strike constraints and credit risk formulas
  from the model; no strategy switch was added to either page UI.
- Reused the existing compact stylesheet without changes. New pages have
  credit-specific copy and show Net credit, Width, Max profit, Max loss and
  Breakeven in that order.
