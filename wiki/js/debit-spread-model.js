/* Shared 1:1 same-expiry vertical spreads; historical filename retained for debit pages. */
(() => {
  'use strict';
  function create(optionType, spot, spreadType = 'debit') {
    if (!['call', 'put'].includes(optionType) || !['debit', 'credit'].includes(spreadType) || !Number.isFinite(spot) || spot <= 0)
      throw new Error('A call or put, positive spot and debit or credit spread type are required');
    const isCall = optionType === 'call', isCredit = spreadType === 'credit';
    const buyLower = isCall !== isCredit;
    const strategy = `${isCredit ? (isCall ? 'bear call' : 'bull put') : (isCall ? 'bull call' : 'bear put')} ${spreadType} spread`;
    const step = 1000, limit = 5, base = Math.round(spot / step) * step;
    const contracts = Object.freeze(Array.from({ length: 11 }, (_, i) => {
      const index = i - limit, strike = base + index * step;
      const d = (isCall ? 1 : -1) * index * step;
      return Object.freeze({ index, strike, premium: 3000 - d * (d <= 0 ? .70 : .30) });
    }));
    const contract = index => contracts[index + limit];
    const intrinsic = (p, k) => Math.max(0, isCall ? p - k : k - p);
    const valid = (buy, sell) => Number.isInteger(buy) && Number.isInteger(sell)
      && buy >= -limit && buy <= limit && sell >= -limit && sell <= limit
      && (buyLower ? buy < sell : buy > sell);
    function bounds(leg, buy, sell) {
      if (leg !== 'buy' && leg !== 'sell') throw new Error('Unknown spread leg');
      if (leg === 'buy') return buyLower ? [-limit, sell - 1] : [sell + 1, limit];
      return buyLower ? [buy + 1, limit] : [-limit, buy - 1];
    }
    function constrain(leg, requested, buy, sell) {
      const [lo, hi] = bounds(leg, buy, sell);
      return Number.isFinite(requested)
        ? Math.max(lo, Math.min(hi, Math.round(requested))) : (leg === 'buy' ? buy : sell);
    }
    function position(buyIndex, sellIndex) {
      if (!valid(buyIndex, sellIndex)) throw new Error(`Strikes must preserve the ${strategy} order and positive width`);
      const buy = contract(buyIndex), sell = contract(sellIndex);
      const amount = isCredit ? sell.premium - buy.premium : buy.premium - sell.premium;
      const width = Math.abs(buy.strike - sell.strike);
      const longPnl = p => intrinsic(p, buy.strike) - buy.premium;
      const shortPnl = p => sell.premium - intrinsic(p, sell.strike);
      return { buy, sell, amount, ...(isCredit ? { credit: amount } : { debit: amount }), width,
        maxLoss: isCredit ? width - amount : amount, maxProfit: isCredit ? amount : width - amount,
        breakeven: (isCredit ? sell.strike : buy.strike) + (isCall ? amount : -amount),
        longPnl, shortPnl, net: p => longPnl(p) + shortPnl(p) };
    }
    const pairs = [];
    for (let buy = -limit; buy <= limit; buy++)
      for (let sell = -limit; sell <= limit; sell++)
        if (valid(buy, sell)) pairs.push(position(buy, sell));
    return Object.freeze({ isCall, isCredit, spreadType, strategy, step, limit, base, contracts, contract, intrinsic,
      valid, bounds, constrain, position, pairs: Object.freeze(pairs),
      defaults: Object.freeze(isCredit ? { buy: isCall ? 3 : -3, sell: 0 } : { buy: 0, sell: isCall ? 3 : -3 }) });
  }
  globalThis.BtcVerticalSpread = Object.freeze({ create });
  // Preserve the original debit-only entry point for existing consumers.
  globalThis.BtcDebitSpread = Object.freeze({ create: (optionType, spot) => create(optionType, spot) });
})();
