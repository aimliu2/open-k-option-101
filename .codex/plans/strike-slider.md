# BTC long-call strike slider

Updated: 2026-11-13
Status: Complete; implemented and verified on 2026-11-13.

## Outcome and scope

Add a vertical strike slider on the right of the existing candlestick and
sideways long-call chart. Selecting a strike mimics a simplified option chain:
lower-strike calls cost more, higher-strike calls cost less, and the payoff
chart updates immediately. Use illustrative premiums, without live data or
an option pricing model.

Relevant files:

- [Chart HTML](../../src/ihtml/ch0-intro/btcusdt-ohlc-lcall.html)
- [Chart JavaScript](../../src/libs/ohlc-chart.js)
- [CSV snapshot generator](../../src/libs/build-btc-ohlc.mjs)
- [Original long-call example](../../src/ihtml/fundamental/1long_call_atm.html)

## Preserve existing behavior

- Embed the latest 128 daily candles, display the newest bars that fit, and keep
  15 bars of right padding (updated by the compact-frame request below).
- Fixed candlestick mode, with no mode selector.
- Identical vertical price coordinates for candles and the sideways payoff.
- Mirrored payoff orientation: profit left, loss right.
- Gray moneyness highlights and centered labels triggered over the candle area.
- Shared hover price guide and option dot across both plots.
- Centered P&L card with a large H2 and profit/loss coloring.
- Local JavaScript in `src/libs`, with no new external dependencies.

## Agreed strike ladder

- Fixed spot `S` is the latest close, currently 77,368.77 USDT.
- Slider index ranges from -5 through +5, defaulting to 0.
- Ladder center `B = round(S / 1,000) * 1,000`, currently 77,000 USDT.
- Selected strike `K = B + index * 1,000` USDT.
- Eleven strikes; cap the range at `B ± 5,000` USDT.
- Current bounds: 72,000 to 82,000 USDT.
- Increasing the slider upward increases strike, matching the price axis.
- Display selected strike, bounds and step size clearly.
- Use round exchange-style strikes while retaining the exact latest close as spot.
- Reset returns to 77,000 and is labeled accordingly. At the current spot this
  nearest strike is slightly ITM; classify using actual strike versus spot rather
  than treating the center index as exactly ATM.

## Illustrative premiums

Use piecewise linear interpolation between the approved examples:

| Strike | Premium, USDT per 1 BTC |
| --- | ---: |
| `B - 5,000` | 6,500 |
| `B` | 3,000 |
| `B + 5,000` | 1,500 |

For `d = K - B`:

```text
d <= 0: premium = 3,000 - 0.70 * d
d >= 0: premium = 3,000 - 0.30 * d
```

These premiums are positive, decrease with increasing strike, and exceed current
intrinsic value throughout the capped range. Display two decimal places and
identify the values as illustrative. Replace the existing fixed 4% assumption.

## Linked updates

- Keep spot fixed and distinguish its marker from the selected-strike marker.
- Selected-contract moneyness at current spot: ITM if `K < S`, ATM if `K = S`,
  OTM if `K > S`.
- For hypothetical expiry price `P`, hover regions follow the selected strike:
  ITM above `K`, ATM on `K`, OTM below `K`. Preserve a small pixel hit tolerance
  around ATM for pointer usability; it does not represent a price interval.
- Gross expiry payoff is `max(P - K, 0)`.
- Net P&L is `max(P - K, 0) - premium`.
- Maximum loss is the premium; breakeven is `K + premium`.
- Update the strike line, kink, premium, maximum loss, breakeven line, payoff
  curves, profit/loss fills, summary and readout together on slider input.
- Make panel titles reflect ITM/ATM/OTM selection rather than always saying ATM.
- Preserve the distinction between ITM and net profit: prices between strike
  and breakeven still generate a loss after premium.

## Interaction and geometry

- Provide dragging and keyboard stepping on the vertical slider.
- Support mouse-wheel stepping over the slider, clamping at the limits; leave
  wheel input elsewhere alone. Normalize trackpad bursts to avoid skipping
  multiple strikes unintentionally in one gesture.
- Align slider position with strike on the shared price axis.
- Keep the slider DOM stable during chart updates to retain focus and pointer
  capture while dragging.
- Keep the vertical price scale fixed during strike selection.
- Calculate a fixed horizontal P&L domain across all eleven strikes and the
  visible price range. Do not rescale per strike; maintain profit-left orientation.
- Separate selected-strike state from historical candle selection and hover price.
- On strike changes, refresh the card for the last active hovered expiry price;
  otherwise keep the neutral instruction.
- Preserve strike selection during resize and the existing narrow-screen scrolling.

## Implementation sequence

1. Add strike state, capped ladder and illustrative premium calculation.
2. Calculate a stable P&L domain over the complete ladder.
3. Add a labeled, accessible right-side vertical slider and its input handlers.
4. Connect slider input to strike-dependent chart geometry and readouts.
5. Separate spot/strike markers and update hover-region bounds and explanatory text.
6. Validate calculations and interactions, then update this plan with results.

## Validation

- Verify all eleven steps, default/reset at the rounded center and clamping at both limits.
- Match the three premium examples; check monotonicity, positivity and intrinsic
  value bounds at every strike.
- Verify maximum loss below strike, zero net P&L at breakeven and positive P&L
  above breakeven for every selected contract.
- Verify candle/option Y coordinates agree, scales stay fixed and profit stays left.
- Verify spot stays fixed while strike, selected-contract moneyness and hover
  highlights move together.
- Verify dragging, keyboard and wheel behavior, focus retention and resize state.
- Verify candle OHLC inspection, synchronized option hover, card colors and reset.
- Check wide and narrow layouts, label placement and numerical geometry.
- Preserve the source CSV, embedded bar snapshot and original fundamental chart.

## Work state

- [x] Record agreed design before implementation.
- [x] Implement strike ladder and illustrative premiums.
- [x] Add slider and link chart updates.
- [x] Validate calculations, interactions and layouts.

## Completion evidence

- Implemented in the chart HTML and its existing local JavaScript; no additional
  packages or network requests are required.
- The native vertical range remains outside the rebuilt SVG. Its thumb center
  aligns with the shared price coordinates; actual dragging across successive
  redraws retained focus and reached both capped endpoints.
- Isolated headless Chrome verified all eleven strikes, premium values and
  monotonicity, fixed spot/axes/candle geometry, payoff kink and shared Y mapping,
  and selected-contract titles and accessible value descriptions.
- Checked 55 strike/expiry-price combinations: below strike, at strike, between
  strike and breakeven, at breakeven, and above breakeven. Net P&L and card colors
  matched the contract calculations, and ATM hover bounds followed strike.
- Checked keyboard steps and caps, Page Up/Down, ATM reset, wheel burst/pause/
  reversal behavior, retained-price hover repricing, resize state, and usable
  controls after horizontal scrolling at a 390px viewport.
- Wide and narrow screenshots were inspected. No browser runtime errors occurred.
- Verified offline iframe `srcdoc` bundling: candles render and strike input
  updates the payoff after the local JavaScript is inlined.
- Confirmed all 128 embedded bars still match the CSV, its SHA-256 is unchanged,
  and the original fundamental chart is unchanged. No existing deck references
  this page, so no generated deck needed rebuilding.
- Temporary implementation state was removed after final verification.

No functional deviations from the agreed plan. The in-app browser execution tool
was unavailable, so browser verification used an isolated local Chrome session,
which was closed after testing.

### Round-strike update

User requested a 77,000 starting strike on 2026-11-13. Recentered the ladder on
the nearest 1,000 instead of the exact close. Kept illustrative premiums anchored
to ladder offsets and kept true spot unchanged. Updated marker labels, slider
alignment, accessible values and reset text; nearby spot/strike labels are spaced
apart to remain readable. Verified all eleven round strikes, default/reset,
premium monotonicity/intrinsic bounds, actual ITM/OTM classification, slider thumb
alignment and preservation of all 128 candles with the chart renderer.

### Additional option positions

The user renamed the reference page to `btcusdt-ohlc-lcall.html` and requested
long-put, short-call and short-put equivalents. Added `lput`, `scall` and `sput`
pages alongside it, with strategy attributes configuring the shared renderer.
Put premiums rise with strike, put ITM regions are below strike, and short-position
P&L reverses the corresponding long position. Summaries identify premium received
and correct profit/loss caps. The snapshot generator now refreshes all four pages.
See the [chart guide](../../docs/tool-guide/btc-option-charts.md) for conventions.

Verified all 44 selected contracts and 220 expiry-price samples, including
breakeven, premium monotonicity, signed P&L, matching long/short pairs, shared
coordinates, fixed scales, moneyness, reset and slider limits. Browser checks
passed for all four pages, including keyboard focus/steps and narrow-screen
scrolling; screenshots were inspected with no runtime errors. Snapshot refresh
is idempotent across all four pages.

### Compact 1024×576 frame update

User authorized hiding older bars, halving right padding, and omitting text below
the P&L card. Added a shared stylesheet and a viewport-height grid layout, removed
the footer/legends below the card, and made chart geometry follow its available
width and height. At 1024×576 all four pages show the latest 93 candles and 15 bars
of padding with no scrolling; full 128-bar snapshots remain unchanged. Wide frames
restore all 128 candles. Visible bar counts, dates, hover and keyboard coordinates
follow the visible slice. Source provenance remains in the date-range tooltip.

Verified in local Chrome: no page/chart overflow for all eleven strikes in all
four pages; card, slider and reset remain in frame; 220 expiry P&L cases pass;
native drag/wheel and historical keyboard limits work; viewport resize preserves
strike selection; and an actual offline bundled 1024×576 iframe renders without
scrolling and updates its strike. Shared price axes and payoff signs remain
correct, with no browser runtime errors. Screenshots were visually inspected.
