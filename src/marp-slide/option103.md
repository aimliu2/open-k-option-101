---
marp: true
theme: ivory
---

# Option 103
## Cover called and Cash-Secure-Put

---

## Cover Called
### long spot + short called
###### You already own enough shares of the underlying asset to fulfill your delivery obligation.

<div>
<iframe src="../ihtml/4covered_call_atm.html" width="720" height="480" style="border:0" title="Long put payoff chart"></iframe>
</div>

---

## What happens at expiration?
### Traditional Stock, ETF
> Because the stock is above the strike, the call expires in the money (ITM) and is normally exercised automatically.
1. The call buyer purchases your stock for $100,000, the strike price.
2. You are obligated to deliver your share.
3. You receive $100,000 from the sale.
4. You keep the original $3,800 premium.

---

## What happens at expiration?
### Cash Settlement on Crypto
> Collateral requirement: You still need sufficient assets to support your potential payment obligation

1. Premium received when selling	+$3,800
2. Cash settlement at expiry	−$10,000
3. Net option P&L	−$6,200

---

## Cash Secure Put
### short put + cash reserve
###### You already own enough money to fulfill your delivery obligation.

<div>
<iframe src="../ihtml/6cash_secured_put_atm.html" width="720" height="480" style="border:0" title="Long put payoff chart"></iframe>
</div>

---

## What happens at expiration?
### Traditional Stock, ETF
> At expiration, if the asset falls to $90,000 The put buyer has the right to sell the stock to you for $100,000, even though it's now worth only $90,000.
1. The put buyer sell the stock for $100,000, the strike price.
2. You are obligated to pay $100,000.
3. You receive the stock.
4. Net PnL is $9,000+$3,800-$100,000 = -$6,200


---

## Both Payout chart is similar to each other
- **+ Delta** : they generally benefit from rising underlying prices
- **+ Theta**: Benefit from time decay, all else equal.
- **- Gamma**: Large directional moves can hurt, particularly sharp declines.
- **- Vega**: Rising implied volatility generally hurts before expiration.

