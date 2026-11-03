---
marp: true
theme: ivory
---

# Option 102
## Write(short) option

---

## Ex1 : BTC price was at 100k$ (ATM)
### Option Chain · Bid $3,800 : Ask $4,000 · Strike price = $100k
###### Payoff at expiry is locked after purchase · K = $100k · premium = $4k

<div style="display:flex;gap:24px">
<iframe src="../ihtml/fundamental/5short_call_atm.html" width="508" height="440" style="border:0" title="Long call payoff chart"></iframe>
<iframe src="../ihtml/fundamental/5short_put_atm.html" width="508" height="440" style="border:0" title="Long put payoff chart"></iframe>
</div>

---

## Ex2 : BTC price was at 100k$ (OTM)
### Call Option Chain · Bid $2,300 : Ask $2,500 · Strike price = $103k
### Put Option Chain · Bid $1,600 : Ask $1,800 · Strike price = $97k

<div style="display:flex;gap:24px">
<iframe src="../ihtml/fundamental/5short_call_otm.html" width="508" height="440" style="border:0" title="Long call payoff chart"></iframe>
<iframe src="../ihtml/fundamental/5short_put_otm.html" width="508" height="440" style="border:0" title="Long put payoff chart"></iframe>
</div>

---

## Ex3 : BTC price was at 100k$ (ITM)
### Call Option Chain · Bid $5,300 : Ask $5,500 · Strike price = $97k
### Put Option Chain · Bid $5,800 : Ask $6,000 · Strike price = $103k

<div style="display:flex;gap:24px">
<iframe src="../ihtml/fundamental/5short_call_itm.html" width="508" height="440" style="border:0" title="Long call payoff chart"></iframe>
<iframe src="../ihtml/fundamental/5short_put_itm.html" width="508" height="440" style="border:0" title="Long put payoff chart"></iframe>
</div>

###### The intrinsic value has already added into option Bid Ask

---

## Cash Settlement on Crypto
> Collateral requirement: ~5-15% of notional value

For ATM short call example, with BTC at $100,000, premium and mark price both $3,800, and quantity 1 BTC: i.e. on ByBit exchange at 10% nomial rate
$$
IM \approx 0.10 \cdot 100,000 + 3,800 = $13,800/ 1 \ contract
$$
###### Crypto options can be traded in fractional BTC quantities i.e. 0.01 contract