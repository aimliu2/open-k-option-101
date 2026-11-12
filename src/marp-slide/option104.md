---
marp: true
theme: ivory
---

# Option 104
## Debit and Credit Spread

---

## Debit Spread
### Bull call<u>buy ATM call + sell OTM call</u> · Bear put<u> buy ATM put + sell OTM put</u>


<div>
<iframe src="../ihtml/10debit_spreads_vs_long_options.html" width="720" height="480" style="border:0" title="Long put payoff chart"></iframe>
</div>

---

## Advantage over long call/put
The Bull Call Debit Spread has three main advantages over a regular long call:
1. Lower upfront premium — you spend less to enter the position.
2. Lower maximum loss — if BTC crashes or stays flat, you lose less money.
3. Lower breakeven price — BTC doesn't need to rise as much for you to make a profit.
4. Theta and Gamma shape changed
$$
\Theta_{\text{spread}}=\Theta_{\text{long call}}-\Theta_{\text{short call}}
\quad
\Gamma_{\text{spread}}=\Gamma_{\text{long call}}-\Gamma_{\text{short call}}
$$

---

## Disadvantage over long call/put
Pricing risk: BTC moves correctly, but the spread doesn't appreciate as much as expected.
###### open postion - Net debit $1,700
|Leg|	Strike|	Entry|
|--|--|--|
|Long call	|$100,000	|Pay $4,000|
|Short call	|$103,000	|Receive $2,300|
###### exit postion - Net received $1,300
|Leg|	Bid	|Ask|
|--|--|--|
|$100k call|	$4,600|	$4,900|
|$103k call|	$3,000	|$3,300|
---

## Credit Spread
### Bull Put<u>short ATM call + long OTM call</u> · Bear Call <u>short ATM put + long OTM put</u>

<div>
<iframe src="../ihtml/11credit_spreads_vs_short_options.html" width="720" height="480" style="border:0" title="Long put payoff chart"></iframe>
</div>

---

## Advantage over short call/put
1. Maximum loss is capped
2. Reduced exposure to extreme moves and gamma squeezes
$$
\Delta_{\text{spread}}
=
-\Delta_{\text{short call}}
+\Delta_{\text{long call}}
$$



