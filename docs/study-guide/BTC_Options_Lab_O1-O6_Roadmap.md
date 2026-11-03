# Research Handoff — BTC Options Laboratory: O1–O6 Roadmap

**Project:** Proj-AlgoTrade  
**Track:** BTC options education, risk management, and economic evaluation  
**Venue:** Bybit (contract specifications must be reverified before trading)  
**Status:** Learning roadmap; independent of P2  
**Initial strategy target:** Cash-secured puts and covered calls, combined into a wheel-style exposure policy  
**Not an initial target:** Automated trading, uncovered short options, or complex multi-leg structures

## 1. Mission and minimum end objective

The objective is not simply to learn option vocabulary or reproduce Black–Scholes formulas. It is to become capable of **independently evaluating, entering, monitoring, and exiting a BTC covered call or cash-secured put without misunderstanding the contractual, market, or account-level risks**.

**Minimum operational competence (Milestone A):** Given a real BTC option chain and current account balances, independently:

1. Identify exactly what the contract settles into, its denomination, size, expiry, exercise style, and margin treatment.
2. Calculate the option's model value and implied volatility, with assumptions stated and without treating model price as objective fair value.
3. Calculate the combined spot/cash/option payoff and the relevant Greeks.
4. Choose a strike, expiry, and position size based on a documented exposure objective and maximum tolerable loss, rather than premium yield alone.
5. Explain and quantify adverse scenarios, including sharp BTC declines, upside rallies, volatility spikes, liquidity deterioration, and liquidation risk.
6. Execute a paper-traded lifecycle: open, monitor, close or roll, settle, rebalance spot, and reconcile cash flows and fees.
7. Know when **not** to trade because the contract, collateral, quotes, or risk cannot be understood or supported.

**Economic competence (Milestone B):** Using realistic historical option quotes and executable costs, determine whether a defined wheel policy offers an attractive risk/return trade-off compared with holding BTC, holding cash, or using spot/perpetual exposure. This is a research result, **not a promise that the wheel has positive expectancy**.

### What the wheel means in this venue

The classical equity wheel often assumes physical assignment: sell a cash-secured put, receive shares if assigned, sell a covered call, and deliver shares if called away. **Cash-settled BTC options do not mechanically perform those inventory transitions.** A wheel-style BTC implementation must separately buy or sell spot BTC after cash settlement (or at an explicitly chosen rebalancing time). Confirm the exact Bybit product, settlement currency, contract multiplier, and collateral rules before any order. A spot holding does not automatically eliminate exchange margin/liquidation risk on a short call.

## 2. Dependency map: why each phase matters

| Phase | Main question | Direct wheel decision enabled | Minimum deliverable |
|---|---|---|---|
| **O1 — Contracts and combined payoffs** | What am I selling, and what happens at expiry? | Whether the proposed put/call is genuinely cash-secured/covered in economic terms | Correct lifecycle and P&L worksheet |
| **O2 — Pricing models** | What assumptions justify a model price? | Whether the quoted premium is consistent with a reference model | Reproducible pricing and IV calculator |
| **O3 — Greeks and path risk** | How can the position change before expiry? | Position sizing, monitoring, and early exit | Scenario-based risk dashboard |
| **O4 — Volatility and contract selection** | Which strike/expiry, if any, compensates for risk? | Sell, skip, and contract selection | Documented option-chain decision sheet |
| **O5 — Wheel operation and failure modes** | Can I run the entire cycle safely on Bybit? | Order, collateral, settlement, roll, and spot rebalancing | Complete paper-traded cycle and stress tests |
| **O6 — Economic validation** | Is the wheel preferable to simpler alternatives? | Whether to deploy a policy at all | Cost-aware comparative research report |

**Stop rule:** Do not advance to live short-option trading merely because O2 pricing or O3 Greeks are understood. At minimum, O1–O5 must be demonstrated in a paper/simulated workflow, including account-level margin checks.

---

## O1 — Contract mechanics, payoffs, and wheel inventory

### Minimum objective

Given a specific BTC option and a proposed BTC spot/cash holding, correctly calculate the position's **expiration payoff, net P&L, break-even, maximum loss or risk exposure, and settlement cash flows**. Explain what BTC inventory remains after settlement.

### Study topics

- Call vs put; buyer rights vs seller obligations.
- European vs American exercise; expiration, exercise, settlement, and cash vs physical delivery.
- Strike, moneyness, intrinsic vs extrinsic value, premium, multiplier, quote units, fees.
- Long and short option payoff **versus** profit after premium.
- Combined positions: covered call = long BTC + short call; cash-secured put = reserved cash + short put.
- Put–call parity and synthetic exposure as a conceptual check.
- Classical physically assigned wheel versus **cash-settled BTC wheel-style rebalancing**.
- Why “covered” or “secured” in an economic payoff diagram is not the same as exchange margin recognition.

For one BTC-equivalent exposure with expiry price $S_T$, strike $K$, call premium $c$, and put premium $p$ (all in a common currency, ignoring costs and financing):

$$
\Pi_{\mathrm{covered\ call}}=(S_T-S_0)+c-\max(S_T-K,0)
$$

$$
\Pi_{\mathrm{short\ put}}=p-\max(K-S_T,0)
$$

The second equation is the option P&L; reserved cash is a separate balance-sheet asset. In both cases, distinguish the marked-to-market position from realized settlement cash flows.

### Exercises and evidence

1. Build expiration payoff tables for BTC falling 50%, unchanged, rising 20%, and rising 100%.
2. Compare a covered call with simply holding BTC; quantify foregone upside.
3. Compare a short put with holding cash; quantify downside exposure.
4. Walk through a cash-settled put ending ITM: cash settlement first, optional spot BTC purchase second.
5. Read the actual contract specification and reconcile the exchange's displayed quantity, premium, and settlement amounts.

### Exit test

Without assistance, explain exactly what happens to cash, BTC holdings, option liability, and fees under ITM/OTM expiry. **If settlement or position size is ambiguous, O1 is not complete.**

### Why this matters

Prevents the most basic wheel error: believing premium is income detached from directional risk, or believing cash settlement automatically delivers or removes BTC.

---

## O2 — Black–Scholes, Black–76, and implied volatility inversion

### Minimum objective

Implement a numerical European call/put pricer, reproduce known benchmark prices, and infer the **implied volatility** of a real quoted option. Explain the model's assumptions and why a model price is not automatically a trading edge.

### Study topics

- No-arbitrage replication, discounting, forward price, risk-neutral valuation.
- Why the real-world expected BTC return $\mu$ does not appear in the standard no-arbitrage formula.
- Black–Scholes spot formulation versus Black–76 forward formulation; consistent underlying and settlement convention.
- Inputs $S_0$, $K$, $T$, $r$, $\sigma$, forward $F$, discount factor, and possible carry/basis.
- Standard normal CDF; volatility annualization; time-to-expiry conventions.
- Numerical inversion for IV; bid-IV and ask-IV versus mid-IV.
- Limits: jumps, stochastic volatility, smiles, funding/basis, market frictions, model/contract mismatch.

For a simple non-dividend-paying spot model:

$$
C=S_0N(d_1)-Ke^{-rT}N(d_2),\qquad
P=Ke^{-rT}N(-d_2)-S_0N(-d_1)
$$

$$
d_1=\frac{\ln(S_0/K)+(r+\sigma^2/2)T}{\sigma\sqrt{T}},\qquad d_2=d_1-\sigma\sqrt{T}
$$

For a forward-based European model with discount factor $D=e^{-rT}$:

$$
C=D\left[FN(d_1)-KN(d_2)\right],\qquad
P=D\left[KN(-d_2)-FN(-d_1)\right]
$$

$$
d_1=\frac{\ln(F/K)+\sigma^2T/2}{\sigma\sqrt{T}},\qquad d_2=d_1-\sigma\sqrt{T}
$$

### Exercises and evidence

1. Implement both models with unit tests, put–call parity checks, and boundary behavior.
2. Numerically solve for IV using a robust root-finding method; reject inconsistent prices.
3. Reprice a real bid/ask quote with correct quantity and currency conversion.
4. Vary volatility, rate, maturity, and strike independently; explain the effects.
5. Document why the chosen model matches—or fails to match—the specific Bybit product.

### Exit test

Given a market quote, produce a defensible **model price, bid/ask IV, input sheet, and limitations note**. Explain that IV is a transformation of price, not a forecast of realized volatility.

### Why this matters

Allows you to read what the market is charging for optionality. It does **not** by itself determine whether selling that option is profitable.

---

## O3 — Greeks, nonlinear risk, and pre-expiry P&L

### Minimum objective

Calculate delta, gamma, theta, and vega for a BTC option and **aggregate the sensitivities of the complete covered-call or short-put position**. Explain likely P&L under price, volatility, and time shocks before expiration.

### Study topics

- Delta as local price sensitivity, not a reliable standalone probability of expiring ITM.
- Gamma as changing delta; negative gamma of short options.
- Theta and time conventions; theta is not guaranteed daily profit.
- Vega and volatility repricing; skew and surface shifts.
- Rho and rates as a lower-priority but understood sensitivity.
- Approximation and cross-effects; Greeks change as markets move.
- Mark-to-market P&L, early close costs, and bid/ask effects.
- Expiration pin/gamma concentration, gap and jump risks.

A local approximation for option value change is:

$$
\Delta V\approx \Delta\,\Delta S+\frac{1}{2}\Gamma(\Delta S)^2+\mathrm{Vega}\,\Delta\sigma+\Theta\,\Delta t
$$

State units carefully: vega may be quoted per 1.00 volatility unit or per one volatility percentage point; theta may be per year or per day. The approximation becomes unreliable for large shocks.

### Exercises and evidence

1. Plot option value and Greeks against BTC price, maturity, and IV.
2. Compute combined covered-call delta: spot delta plus short-call delta.
3. Compare a short put's risk with an equivalent spot exposure across price scenarios.
4. Stress BTC −30%, +30%, IV +20 volatility points, and one day remaining.
5. Reconcile Greek-based estimates with full repricing, and explain the differences.

### Exit test

Given a short put or covered call, state the position's delta, gamma, theta, and vega exposure, then quantify how it can lose money **before expiration even if premium was received**.

### Why this matters

Greeks are the monitoring instruments for the wheel; they make early exit, rolling, and risk reduction more informed than simply watching premium decay.

---

## O4 — Implied volatility, strikes, expiries, and trade selection

### Minimum objective

Given a real option chain, make a documented **sell / skip** decision and, if selling, choose strike, expiry, and size based on risk and the available alternatives—not the largest quoted premium.

### Study topics

- Bid, ask, mark, IV, open interest, volume, spread, and quote freshness.
- IV smile/skew, term structure, forward/basis, and event risk.
- Realized versus implied volatility; risk-neutral versus physical distributions.
- Volatility risk premium and jump/tail compensation; why forecast volatility below IV does not prove mispricing.
- Strike selection using target BTC inventory/exposure, acceptable entry or sale level, stress losses, and Greeks.
- Expiration selection: premium versus gamma concentration, liquidity, monitoring burden, and fees.
- Conservative sizing and opportunity cost of cash/spot collateral.
- Connection to HAR/GARCH: optional *forecast input*, not an authority to sell.

### Exercises and evidence

1. Record a chain snapshot with underlying/forward, bid/ask, IV, Greeks, size, and timestamp.
2. Compare at least three strikes and two expirations on net premium, risk, and liquidity.
3. Show scenarios where selling a higher-premium option is economically worse.
4. Write an explicit skip rule for spreads, insufficient margin, or unacceptable stress loss.
5. Compare market IV with a forecast, but identify unmodeled skew, jumps, and risk premia.

### Exit test

Produce a one-page trade ticket: **why this strike, why this expiry, why this size, why sell rather than hold spot/cash, and under what conditions not to trade**.

### Why this matters

Pricing tells you what the market asks or pays; selection determines which risks you actually choose to bear.

---

## O5 — Wheel operations, collateral, rolling, and failure modes

### Minimum objective

Paper-trade a complete BTC wheel-style cycle from cash through short put, settlement, optional spot acquisition, covered call, settlement, and optional spot sale. Reconcile every cash flow and demonstrate survival under stress **without relying on an assumed margin offset**.

### Study topics

- Bybit-specific contract size, premium denomination, fees, exercise/settlement time, and payout formula.
- UTA account mode, collateral eligibility, haircut, maintenance margin, liquidation mechanics, and funding/borrowing interactions where relevant.
- Difference between economic cash security and exchange margin recognition.
- Limit orders, quote slippage, liquidity, partial fills, and emergency closure.
- Settlement and explicit spot rebalancing for a cash-settled wheel.
- Roll mechanics: closing one option and opening another; realized loss versus new premium.
- Decision rules for take-profit, expiry, close, roll, pause, and rebalancing.
- Failure modes: crash, violent rally, IV explosion, expiry gamma, thin order book, margin shock, exchange downtime, and collateral mismatch.
- Tax/accounting and jurisdictional constraints to check before live deployment.

### Exercises and evidence

1. Build a transaction ledger including spot, option, premium, fees, settlement, and collateral.
2. Simulate at least one complete cash → put → BTC → call → cash cycle with explicit spot orders.
3. Simulate a put crash scenario and a covered-call upside runaway scenario.
4. Stress account equity, available margin, and maintenance margin under adverse prices and IV changes.
5. Compare holding an ITM option, closing it, and rolling it; show total net economic cost.
6. Write an emergency runbook for margin deterioration, inability to close, and exchange disruption.

### Exit test

Complete a documented paper-trading lifecycle with **no unexplained balances, unmodeled inventory transitions, or untested margin assumptions**. Show that the strategy can be stopped safely without relying on selling another option.

### Why this matters

A mathematically covered payoff can still fail operationally. This phase turns theoretical knowledge into controlled execution.

---

## O6 — Economic validation and deployment decision

### Minimum objective

Determine whether a precisely specified BTC wheel policy offers sufficient **net risk-adjusted economic benefit** relative to simpler alternatives. Be willing to conclude **no deployable advantage**.

### Study topics

- Define policy in advance: put/call strikes, expiries, sizing, skip rules, rebalance timing, roll/close rules.
- Historical bid/ask and executable-size data; no pretending that end-of-day mid quotes were executable.
- Transaction fees, slippage, financing/borrow costs, and settlement/rebalance friction.
- Mark-to-market equity and cash flows, not merely premium collected or option win rate.
- Benchmarks: BTC buy-and-hold, cash, periodic spot allocation, and optionally perp exposure.
- Metrics: net return, drawdown, expected shortfall, volatility, turnover, capital utilization, tail exposure, and opportunity cost.
- Out-of-sample testing, regime splits, parameter sensitivity, and realistic liquidity constraints.
- Attribution: premium income versus underlying directional exposure and short-volatility exposure.
- Small samples and rare crashes; no unsupported claims of persistent edge.

### Exercises and evidence

1. Create an event-driven backtest with correct settlement and inventory transitions.
2. Compare identical capital budgets across the wheel and benchmarks.
3. Test a falling market, strong bull market, sideways market, and volatility shock.
4. Perform out-of-sample evaluation and cost/stress sensitivity.
5. Write a deployment decision: proceed to limited paper/live pilot, revise, or reject—with evidence.

### Exit test

Produce a reproducible report answering: **When, if ever, does this wheel policy beat holding BTC or cash after realistic costs and risk?** If the evidence is weak, state that explicitly.

### Why this matters

A wheel can generate frequent premium receipts while underperforming buy-and-hold or suffering large tail losses. O6 separates *operational competence* from *economic merit*.

---

## 3. Minimum viable learning path versus optional depth

| Topic | Required for Milestone A? | Depth needed initially |
|---|---|---|
| Contract payoff, cash settlement, collateral | **Yes** | Full working knowledge |
| Black–Scholes / Black–76 | **Yes** | Implement, calibrate IV, explain assumptions; formal PDE derivation optional |
| Delta, gamma, theta, vega | **Yes** | Compute and interpret for combined positions |
| Smile/skew and term structure | **Yes** | Read and compare; no need to fit advanced surface models initially |
| Strike/expiry selection | **Yes** | Explicit risk and exposure decision rules |
| Margin/liquidation/operational failures | **Yes** | Account-specific stress testing |
| HAR/GARCH option integration | No | Optional research after basic chain/IV competence |
| Stochastic volatility, jump-diffusion, local vol | No | Advanced extension, not a prerequisite |
| Automated wheel execution | No | Future engineering track |
| Cost-aware historical economic validation | Required for **Milestone B** | Reproducible benchmark study |

## 4. Research workflow and phase discipline

For every phase, keep a short evidence record with these fields:

- **Question:** What wheel decision does this knowledge support?
- **Model/contract assumptions:** What must be true for the calculation to be valid?
- **Calculation or simulation:** What did I independently compute?
- **Adverse case:** When does this reasoning break or become dangerous?
- **Decision output:** What would I do differently as a result?
- **Pass/fail:** Is the minimum objective demonstrably satisfied?

A phase is **not complete** merely because its equations are memorized. It is complete when its result can be used correctly on a real or paper-traded option quote and the important failure cases can be explained.

## 5. Recommended first session

**O1.1 — Sell one BTC put, but do not place an order.** Pick a hypothetical BTC spot price, put strike, premium, expiry, and one-BTC-equivalent contract size. Calculate short-put P&L at five expiry prices, required economic cash reserve, and the spot BTC purchase needed to imitate physical assignment after cash settlement. Then repeat for a covered call, explicitly separating option settlement from spot disposal.

**First session deliverable:** A two-position worksheet with consistent units and an accurate cash/spot/option ledger. This creates the foundation for every later pricing, Greek, and strategy question.

## 6. Boundaries and final criterion

- This track is independent of P2 forecasting and QQQ manual exposure management.
- Begin with BTC; do not assume equity option assignment conventions apply.
- No uncovered options, complex spreads, or leverage escalation are needed to pass.
- No formula, premium yield, or Greek implies positive expectancy by itself.
- Reverify live exchange contract specifications and margin treatment before any real trade.
- **Milestone A:** Can operate and risk-manage a paper BTC wheel correctly.
- **Milestone B:** Can defend or reject the wheel economically against simple alternatives.

**Handoff conclusion:** The learning destination is not “master Black–Scholes.” It is “understand exactly what BTC exposure and risks are being sold, at what price, through which contract and collateral mechanics, and whether doing so is preferable to holding BTC or cash.”
