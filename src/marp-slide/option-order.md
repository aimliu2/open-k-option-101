---
marp: true
theme: ivory
---

# Option placing order 

---

# Common order-duration choices
|Order type	|Behavior|	Typical use|
|--|--|--|
|GTC (Good Till Cancelled)|	Remains open until filled, cancelled, or removed under exchange rules|	Waiting for your desired premium|
|IOC (Immediate or Cancel)|	Fills immediately as much as possible; cancels the rest|	Quick execution without leaving an order|
|FOK (Fill or Kill)|	Must fill the entire quantity immediately or cancel	|Avoiding partial fills|
|GTD / Day|	Expires at a specified time or end of day	|Time-limited quotes, where supported|