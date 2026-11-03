---
marp: true
theme: ivory
---

# Option 101
## buyer rights vs seller obligations.

---

## Ex1 : BTC price was at 100k$ (ATM)
### Option Chain · Bid $3,800 : Ask $4,000 · Strike price = $100k
###### Payoff at expiry is locked after purchase · K = $100k · premium = $4k

<div style="display:flex;gap:24px">
<iframe src="../ihtml/fundamental/1long_call_atm.html" width="508" height="440" style="border:0" title="Long call payoff chart"></iframe>
<iframe src="../ihtml/fundamental/1long_put_atm.html" width="508" height="440" style="border:0" title="Long put payoff chart"></iframe>
</div>

---

## Mathematical payoff at expiry
- long call : $\Pi_{\text{call}}=\max(S_T-100,000,0)-4,000$
- long put : $\Pi_{\text{put}}=\max(100,000-S_T,0)-4,000$

---

<!-- _class : lead -->
## OTM and ATM
###### Moneyness (ITM / ATM / OTM) is defined from the perspective of the option buyer — the one who pays the premium to acquire the right to exercise.

<div>
<iframe src="../ihtml/2option_moneyness.html" width="720" height="480" style="border:0" title="Long put payoff chart"></iframe>
</div>

---

## Ex2 : BTC price was at 100k$ (OTM)
### Call Option Chain · Bid $2,300 : Ask $2,500 · Strike price = $103k
### Put Option Chain · Bid $1,600 : Ask $1,800 · Strike price = $97k

<div style="display:flex;gap:24px">
<iframe src="../ihtml/fundamental/1long_call_otm.html" width="508" height="440" style="border:0" title="Long call payoff chart"></iframe>
<iframe src="../ihtml/fundamental/1long_put_otm.html" width="508" height="440" style="border:0" title="Long put payoff chart"></iframe>
</div>

---

## Ex3 : BTC price was at 100k$ (ITM)
### Call Option Chain · Bid $5,300 : Ask $5,500 · Strike price = $97k
### Put Option Chain · Bid $5,800 : Ask $6,000 · Strike price = $103k

<div style="display:flex;gap:24px">
<iframe src="../ihtml/fundamental/1long_call_itm.html" width="508" height="440" style="border:0" title="Long call payoff chart"></iframe>
<iframe src="../ihtml/fundamental/1long_put_itm.html" width="508" height="440" style="border:0" title="Long put payoff chart"></iframe>
</div>

###### The intrinsic value has already added into option Bid Ask

---
## Why would someone buy ITM option ?
###### with Delta ~ 1 the ITM option behave like leverage
<div>
<iframe src="../ihtml/3itm_call_vs_spot.html" width="720" height="480" style="border:0" title="Long put payoff chart"></iframe>
</div>

---
# Implied Volatility (IV)
### Higher implied volatility (IV) generally means higher option premiums
|Annualized IV|	Fair premium|	Illustrative bid|	Illustrative ask|
|--|--|--|--|
|20%|	_$2,287_|	$2,237|	$2,337|
|40%|	_$4,570_|	$4,520|	$4,620|
|60%|	_$6,846_| $6,796|	$6,896|
|80%|	_$9,113_|	$9,063|	$9,163|
|100%|	_$11,364_|	$11,314|	$11,414|

---

|Feature|	European|	American|
|--|--|--|
|Buy before expiry|	Yes	|Yes|
|Sell before expiry	|Yes|	Yes|
|Exercise before expiry	|**No**|	Yes|
|Exercise at expiry	|Yes|	Yes|
|Writer can be assigned early|	**No**|	Yes|
|Settlement|	Cash or physical|	Cash or physical|


