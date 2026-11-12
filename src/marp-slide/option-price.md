---
marp: true
theme: ivory
---

# Option Price

---

# Black-Sholes Model

$$
C = SN(d_1)-Ke^{-rT}N(d_2) \ \ \boxed{P = Ke^{-rT}N(-d_2)-SN(-d_1)}
$$

where
$$
\begin{aligned}
d_1 &= \frac{ln(S/K)+(r+\sigma^2/2)T}{\sigma \sqrt{T}} \\
d_2 &= d_1 - \sigma \sqrt{T}
\end {aligned}
$$

---

<div>
<iframe src="../ihtml/8black_scholes_calculator.html" width="1024" height="600" style="border:0" title="black-scholes"></iframe>
</div>

--- 
## Black-Sholes PDE

$$

\frac{\partial V}{\partial t}
+\frac12\sigma^2S^2\frac{\partial^2V}{\partial S^2}
+rS\frac{\partial V}{\partial S}
-rV=0
\ \
\boxed{
\Theta=
-\frac12\sigma^2S^2\Gamma
-rS\Delta+rV
}
$$

|Greek|	Mathematical definition	|Interpretation|
|--|--|--|
|Delta $\Delta$|	$\frac{\partial V}{\partial S}$	|Price sensitivity|
|Gamma $\Gamma$|	$\frac{\partial^2 V}{\partial S^2}$	|Delta sensitivity|
Theta $\Theta$|	$\frac{\partial V}{\partial t}$	|Time sensitivity|
|Vega $\nu$	|$\frac{\partial V}{\partial \sigma}$|	Volatility sensitivity|
|Rho $\rho$	|$\frac{\partial V}{\partial r}$	|Interest-rate sensitivity|

---


