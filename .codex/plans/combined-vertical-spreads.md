# Combined BTC vertical spread explorer

Updated: 2026-11-14
Status: Complete; implemented and verified on 2026-11-14.

## Requested outcome

Combine the four pages in [ch1-v-spread](../../src/ihtml/ch1-v-spread/)
into one interactive HTML page. Four explicit, always-visible buttons in the top
navigation bar select the four strategies, with no dropdown. Export the finished, self-contained HTML to
`wiki/refpages/btcusdt-vertical-spreads.html`.

Implemented following user authorization. The editable source and generated
reference page are complete; no commit, push or deployment was performed.

## Architecture at planning time

- All four pages use the same [model](../../src/libs/debit-spread-model.js),
  [renderer](../../src/libs/ohlc-spread-chart.js),
  [base styles](../../src/libs/ohlc-chart.css) and
  [spread styles](../../src/libs/ohlc-spread-chart.css).
- Body attributes select call/put and debit/credit at startup. The renderer
  currently creates one immutable model and installs its handlers once; changing
  attributes alone will not switch strategy.
- Each page embeds the same 128-bar snapshot and provenance. The renderer draws
  one chart with two strike sliders, optional leg curves, risk metrics and an
  expiry P&L readout.
- Existing pages cap the whole presentation at 1024×576. The header occupies
  42px, so navigation must fit deliberately rather than displace the readout.
- [inline-frames.ts](../../src/inline-frames.ts) already inlines local CSS and
  classic scripts, but its command-line interface exports Marp decks, not standalone
  reference pages. GitHub Pages deploys only `wiki/`, so links back into `src/`
  would break on the published page.

References: [chart guide](../../docs/tool-guide/btc-option-charts.md),
[debit plan](debit-vertical-spreads.md),
[credit plan](credit-vertical-spreads.md).

## Navigation and behavior

Use four compact buttons in the top navigation bar, one per mode:
`Call debit`, `Put debit`, `Call credit`, and `Put credit`. Keep all four visible
and visually highlight the active button.

| Mode | Full strategy | First-visit Buy / Sell offsets from ladder center |
| --- | --- | --- |
| Call debit | Bull call debit spread | 0 / +3,000 |
| Put debit | Bear put debit spread | 0 / −3,000 |
| Call credit | Bear call credit spread | +3,000 / 0 |
| Put credit | Bull put credit spread | −3,000 / 0 |

The default is Call debit, matching the existing debit-call page. Show the full
strategy in the heading and mark the corresponding button as active. Selecting a mode
updates the existing chart immediately without navigation or page reload.

Implemented interaction details:

- Group four native buttons under an accessible label such as `Spread mode`.
  Each uses `aria-pressed`, with exactly one active at a time. Tab reaches each
  button and Enter/Space selects its mode. Keep focus on the selected button
  through redraws. Active styling must remain distinguishable without color alone.
- Remember Buy/Sell selections separately for each mode during the current page
  session. First visits use the defaults above. Never carry a strike pair into
  a mode with a different required order.
- Keep Show legs as a shared preference. Preserve the selected historical bar
  and active hypothetical expiry price when switching; recalculate the P&L under
  the new mode. If no price was active, keep the neutral instruction.
- Reset strikes resets only the active mode to its existing defaults. Resize
  retains all mode state. Refresh starts a fresh session; URL and persistent
  storage features are outside this first version.
- Keep the same snapshot, spot, premium chain, 1 BTC per leg, profit-left
  orientation, strike constraints and existing controls. Axes remain fixed across
  strike changes and leg toggling within each mode, as today. Cross-mode scale
  equality is not required; a mode change may recompute its scale.
- Keep the 1024×576 cap. Fit all four buttons into the top bar alongside the
  heading and compact existing header actions; adjust spacing and text sizes as
  needed without clipping the chart or readout. On narrow screens wrap the buttons
  while keeping all four visible; allow a taller header and vertical page scrolling if needed,
  while retaining the existing chart's horizontal scrolling and reachable controls.

## Source and renderer design

Create an editable shell at
`src/ihtml/ch1-v-spread/btcusdt-ohlc-vertical-spreads.html`, with one copy of the
embedded snapshot and the same local asset links as the existing pages. Add an
opt-in attribute such as `data-mode-switcher="true"`; the original four pages
remain fixed-strategy pages.

Extend the shared renderer with an explicit strategy transition:

1. Keep a four-entry strategy configuration table and per-mode strike state.
2. Replace the startup-only model binding with the active model reference.
3. On selection, save the previous pair, select/create the new model, restore
   its saved pair or defaults, and update all strategy-dependent text before
   drawing. Reset wheel gesture bookkeeping so a previous mode's wheel burst
   cannot suppress the first input in the new mode.
4. Update heading, document title, Buy/Sell call-or-put labels, credit/debit metric
   label and value target, tooltip copy, chart and strike-control accessible names,
   slider values/bounds, summary, SVG description and retained hover arithmetic.
   Audit these against all four existing shells; several are currently static HTML.
5. Use a stable metric target on the combined shell, with compatibility for the
   existing `net-credit` / `net-debit` elements on fixed pages.
6. Install listeners and ResizeObserver once. Keep native slider nodes and the
   navigation controls stable through redraws. Do not rerun the whole renderer
   or append duplicate handlers on each switch.

Reuse the existing pure model unchanged unless implementation exposes a concrete
need. Scope new navigation styles to the combined shell so the original pages
retain their layout.

## Standalone export and snapshot maintenance

Add `src/libs/build-vertical-spreads.mjs`, runnable from the repository root with:

```sh
node src/libs/build-vertical-spreads.mjs
```

It reads the new shell, resolves and inlines its two local stylesheets and its
model/renderer scripts in document order, and writes
`wiki/refpages/btcusdt-vertical-spreads.html`. Preserve the JSON snapshot,
source path and SHA-256 metadata. Escape inline-script end markers correctly,
use function replacement callbacks so JavaScript `$` sequences survive, and
validate all required inputs before replacing the output. Produce deterministic
HTML with a generated-file comment naming the source and rebuild command.
No runtime requests, external fonts, remote scripts or source-relative assets
should be needed.

Follow the existing inlining behavior; prefer a small dedicated exporter over
changing the Marp export interface. Extract a common bundling helper only if it
keeps the existing Bun workflow intact and meaningfully avoids duplication.

Extend [snapshot regeneration](../../src/libs/build-btc-ohlc.mjs) to cover the
new shell, preserving its validate-all-before-writing behavior. Document the
order: refresh snapshots, then rebuild the standalone reference page. Export
uses embedded data and should not require the external CSV to be available.

Update the chart guide with the combined-page link, mode/state behavior and
both regeneration commands. Add a reference-page link to [wiki/index.html](../../wiki/index.html)
so visitors can discover the export. Generating the file and link is within the
implementation scope; committing, pushing and triggering deployment are separate.

## Implementation sequence

1. Build the combined source shell and compact navigation markup.
2. Add opt-in strategy switching, per-mode state and complete text updates.
3. Fit and verify navigation within the existing presentation geometry.
4. Add deterministic standalone export and snapshot-generator coverage.
5. Generate the reference HTML, add its index link and update the chart guide.
6. Validate the source, exported page and original fixed pages; record evidence here.

## Acceptance and validation

- Switch through every directed transition between distinct modes, including
  repeated switches. Check correct strategy, strike order, premium direction,
  credit/debit label, risk limits, breakeven, tooltip and accessible text.
- Compare each mode's defaults with its existing standalone page. Check all
  55 valid pairs per mode and expiry values below/at/between/above strikes and
  at breakeven. Require the combined P&L to equal both leg P&Ls summed, positive
  width and amount below width, correct plateaus and zero P&L at breakeven.
- Change strikes in each mode, leave and return, and confirm independent state.
  Verify active-mode reset, retained hover repricing, Show legs, historical
  inspection and resize. Exercise pointer, keyboard and wheel after repeated
  switching to catch stale model closures and duplicate listeners.
- Verify native slider focus, dragging and constraints, fixed scales within
  each mode, minimum-width labels and unchanged spot/snapshot provenance.
- Inspect at 1024×576, 1440×900 and a narrow phone viewport. At the target size
  require no document/chart scrolling, clipped controls or overlapping labels;
  require all four mode buttons to remain visible and inspect each active state. Record actual
  visible candle count rather than assuming it remains 69.
- Verify all four buttons with keyboard, pointer and touch; confirm exactly one
  pressed-state announcement, visible focus and focus retention after selection.
- Open the exported HTML with networking disabled and from a server exposing
  only `wiki/`; all modes must render and work with no missing assets or console
  errors. Confirm it also works opened directly as a local file.
- Rebuild twice and require identical output. Confirm the export snapshot matches
  its source and all nine chart shells agree after snapshot regeneration.
- Regression-check all four fixed spread pages after shared-renderer changes;
  check the four single-leg snapshots if the generator changes. Preserve existing
  temporary/ignored validation conventions and unrelated user work.

## Work state

- [x] Inspect existing pages, shared assets, export conventions and deployment scope.
- [x] Record proposed interaction, source/output paths and implementation plan.
- [x] Implement source shell, navigation and strategy switching.
- [x] Implement export, regenerate output and update documentation/index.
- [x] Validate behavior, layout, offline export and fixed-page compatibility.
- [x] Record completion evidence and any deviations in this plan.

## Completion evidence

- Added the editable combined shell and generated standalone export at the planned
  paths. Four explicit mode buttons use native keyboard behavior, pressed states
  and persistent DOM nodes; the model and original four shells are unchanged.
- Browser verification covered all 220 valid strike pairs and 1,320 expiry-price
  samples on the source, then repeated the same checks on the export with
  networking disabled. Risk metrics, strike bounds, breakevens, summed leg P&L,
  slider alignment and scales within each mode passed.
- All 12 directed mode transitions retain independent pairs, leg visibility,
  selected historical candle and inspected expiry price. Reset affects only the
  active mode. Repeated switching retains slider/button nodes and native focus.
- Actual Chrome input checks passed for mouse selection, Tab/Enter/Space, strike
  arrows/Home/End and crossing clamps, dragging, wheel input, and touch selection
  and inspection. Additional checks cover wheel-burst throttling across mode
  changes, tooltip focus/Escape and state retention after resize.
- Visually inspected 1024×576, 1440×900 and 390×844 layouts. Target and wider
  viewports retain the 1024×576 presentation cap and 69 visible candles, without
  document or chart scrolling at the target size. Narrow screens show 30 candles;
  all four mode buttons remain visible and horizontal chart scrolling reaches
  both strike controls. Narrow control access was also visually inspected.
- The exported page renders directly from disk while offline and when a local
  server exposes only `wiki/`. All modes work without runtime asset requests.
  Both export rebuilds were byte-identical. Snapshot regeneration leaves all nine
  source pages byte-identical, with identical 128-bar snapshots and provenance in
  every shell and the standalone export.
- Regression-checked all four fixed spread pages: default metrics, controls,
  resets, 69 candles and no overflow at 1024×576. No browser runtime exceptions
  occurred. Syntax and whitespace checks passed. Updated chart guide and wiki index.

## Implementation decisions

- Explorer-only pointer exits into another part of the presentation retain the
  inspected expiry price. This lets mouse users reach a mode button and compare
  the new strategy at that price. Existing fixed pages retain their original
  pointer-leave behavior; Escape still clears chart inspection.
- Used a dedicated dependency-free Node exporter with validated inputs and atomic
  output replacement. The existing Bun/Marp bundler remains unchanged.
- The in-app browser execution tool was unavailable; verification used an isolated
  local headless Chrome session, which was closed afterward. Temporary verification
  scripts and screenshots stayed outside the repository.
- No remaining implementation deviations or unresolved issues.
