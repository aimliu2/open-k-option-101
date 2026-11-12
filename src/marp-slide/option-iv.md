---
marp: true
theme: ivory
---

# Option Price

---

# IV implied volatility
### is an annualized volatility parameter, given option have a remaining lifetime $T$

$$
\boxed{\sigma_T=\text{IV}\sqrt{T}}
$$

---

### Example: BTC at $100,000, IV = 60%, Option expires in 30 days

The variance of the cumulative log return over those 30 days is:

$$
\begin{aligned}
\operatorname{Var}\left[\ln\left(\frac{S_{30}}{S_0}\right)\right]
&=\sigma^2T\\
&=0.60^2\times\frac{30}{365}\\
&\approx0.02959
\end{aligned}
$$

$$
\begin{aligned}
\sigma_{30}
&=\sqrt{0.02959}\\
&\approx0.172\\
&=\boxed{17.2\%}
\end{aligned}
$$

$$
\sigma_T = 60\%\sqrt{\frac{30}{365}}=17.2\%
$$

---
<!-- _class : lead -->
<div>
<iframe src="../ihtml/7btc_iv_range.html"" width="720" height="480" style="border:0" title="Long put payoff chart"></iframe>
</div>

---

# What does it mean as an option seller?
||Low IV	|High IV|
|--|--|--|
|Premium collected|	Smaller|	Larger|
|Priced-in movement risk|	Lower	|Higher|
|Short option exposure|	Less premium cushion	|More premium cushion, but greater priced-in uncertainty|
|Automatically a good time to sell?|	No|	No|

