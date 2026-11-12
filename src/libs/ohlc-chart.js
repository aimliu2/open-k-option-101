/* Dependency-free SVG OHLC chart. Data is embedded in the hosting HTML. */
(() => {
  'use strict';
  const optionType = document.body.dataset.optionType || 'call';
  const position = document.body.dataset.position || 'long';
  const isCall = optionType === 'call';
  const isLong = position === 'long';
  const direction = isLong ? 1 : -1;
  const strategy = `${position} ${optionType}`;
  const intrinsic = (settlement, strike) => Math.max(0, isCall ? settlement - strike : strike - settlement);
  const { bars, source, sha256 } = JSON.parse(document.getElementById('ohlc-data').textContent);
  const chart = document.getElementById('chart');
  const layout = document.getElementById('chart-layout');
  const plot = document.getElementById('chart-plot');
  const controls = document.getElementById('strike-controls');
  const slider = document.getElementById('strike-slider');
  const readout = document.getElementById('readout');
  const spot = bars.at(-1).close;
  const strikeStep = 1000;
  const strikeLimit = 5;
  const baseStrike = Math.round(spot / strikeStep) * strikeStep;
  const contracts = Array.from({ length: strikeLimit * 2 + 1 }, (_, i) => {
    const index = i - strikeLimit;
    const offset = index * strikeStep;
    const strike = baseStrike + offset;
    // Illustrative premiums rise for lower call strikes and higher put strikes.
    const callOffset = isCall ? offset : -offset;
    const premium = 3000 - callOffset * (callOffset <= 0 ? .70 : .30);
    const inTheMoney = isCall ? strike < spot : strike > spot;
    return { index, strike, premium, breakeven: strike + (isCall ? premium : -premium),
      moneyness: strike === spot ? 'ATM' : inTheMoney ? 'ITM' : 'OTM' };
  });
  let strikeIndex = 0;
  let hoverPrice = null;
  let clearHover = () => {};
  const ns = 'http://www.w3.org/2000/svg';
  const price = value => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const strikePrice = value => value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  document.getElementById('reset-strike').textContent = `Reset ${strikePrice(baseStrike)}`;
  const make = (tag, attributes, parent, text) => {
    const node = document.createElementNS(ns, tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    if (text !== undefined) node.textContent = text;
    parent.appendChild(node);
    return node;
  };
  let selected = bars.length - 1;
  let visibleStart = 0;
  let crosshair;
  let x;

  function select(index) {
    selected = Math.max(visibleStart, Math.min(bars.length - 1, index));
    const bar = bars[selected];
    readout.textContent = `${bar.date} UTC   O ${price(bar.open)}   H ${price(bar.high)}   L ${price(bar.low)}   C ${price(bar.close)}`;
    crosshair.setAttribute('x1', x(selected));
    crosshair.setAttribute('x2', x(selected));
  }

  function draw() {
    plot.replaceChildren();
    // Keep candle bodies readable by showing the latest bars that fit the frame.
    const width = Math.max(760, chart.clientWidth);
    const height = Math.max(240, chart.clientHeight);
    const margin = { top: 24, right: 142, bottom: 52, left: 8 };
    layout.style.width = `${width}px`;
    layout.style.height = `${height}px`;
    const bottom = height - margin.bottom;
    const payoffWidth = width < 1100 ? 200 : 260;
    const axisGap = 64;
    const plotWidth = width - margin.left - margin.right - payoffWidth - axisGap;
    const rightPaddingBars = 15;
    const visibleCount = Math.min(bars.length, Math.max(40, Math.floor(plotWidth / 5.5) - rightPaddingBars));
    visibleStart = bars.length - visibleCount;
    const visibleBars = bars.slice(visibleStart);
    const low = Math.min(...visibleBars.map(bar => bar.low), ...contracts.map(contract => Math.min(contract.strike, contract.breakeven)));
    const high = Math.max(...visibleBars.map(bar => bar.high), ...contracts.map(contract => Math.max(contract.strike, contract.breakeven)));
    const padding = (high - low || high * .01) * .08;
    const min = low - padding, max = high + padding;
    const barWidth = plotWidth / (visibleCount + rightPaddingBars);
    const dividerX = margin.left + visibleCount * barWidth;
    const rightEdge = margin.left + plotWidth;
    const payoffLeft = rightEdge + axisGap;
    const payoffRight = width - margin.right;
    x = index => margin.left + (index - visibleStart + .5) * barWidth;
    const y = value => bottom - (value - min) / (max - min) * (bottom - margin.top);
    const contract = contracts[strikeIndex + strikeLimit];
    const { strike, premium, breakeven, moneyness } = contract;
    controls.style.left = `${payoffRight + 16}px`;
    slider.style.top = `${y(baseStrike + strikeLimit * strikeStep) - 9}px`;
    slider.style.height = `${y(baseStrike - strikeLimit * strikeStep) - y(baseStrike + strikeLimit * strikeStep) + 18}px`;
    slider.value = String(strikeIndex);
    slider.setAttribute('aria-valuetext', `${strikePrice(strike)} USDT strike, ${moneyness} ${strategy}, illustrative premium ${isLong ? 'paid' : 'received'} ${price(premium)} USDT`);
    document.getElementById('strike-value').textContent = strikePrice(strike);
    document.getElementById('contract-moneyness').textContent = `${moneyness} ${optionType} · 1 BTC`;
    for (const [id, value] of [['strike-max', baseStrike + strikeLimit * strikeStep], ['strike-min', baseStrike - strikeLimit * strikeStep]]) {
      document.getElementById(id).textContent = strikePrice(value);
      document.getElementById(id).style.top = `${y(value) - 5}px`;
    }
    document.getElementById('chart-mode').textContent = `${strategy.replace(/\b\w/g, letter => letter.toUpperCase())} · ${visibleCount} bars`;
    document.getElementById('date-range').textContent = `${visibleBars[0].date} — ${visibleBars.at(-1).date} · UTC`;
    const svg = make('svg', {
      viewBox: `0 0 ${width} ${height}`, width, height,
      role: 'img', 'aria-label': `${visibleCount} daily BTCUSDT candlestick bars, ${visibleBars[0].date} to ${bars.at(-1).date}. Prices in USDT. A sideways ${moneyness} ${strategy} payoff chart shares the same vertical price scale. Selected strike ${price(strike)}. Hover over either plot to highlight moneyness and inspect expiry profit or loss.`
    }, plot);
    make('title', {}, svg, `BTCUSDT · ${visibleCount} daily bars`);
    make('desc', {}, svg, 'Each bar shows the daily open, high, low and close. Hover or tap a bar, or focus the chart and use the arrow keys, to inspect prices.');
    const rawStep = (max - min) / 6;
    const magnitude = 10 ** Math.floor(Math.log10(rawStep));
    const step = [1, 2, 2.5, 5, 10].map(value => value * magnitude).find(value => value >= rawStep);
    for (let value = Math.ceil(min / step) * step; value <= max; value += step) {
      make('line', { x1: margin.left, x2: rightEdge, y1: y(value), y2: y(value), stroke: '#ddd9d0' }, svg);
      make('line', { x1: payoffLeft, x2: payoffRight, y1: y(value), y2: y(value), stroke: '#ddd9d0' }, svg);
      make('text', { x: rightEdge + 8, y: y(value) + 4 }, svg, Math.round(value).toLocaleString('en-US'));
    }
    make('text', { x: rightEdge + 8, y: 13 }, svg, 'USDT');
    const ticks = Array.from({ length: 5 }, (_, i) => visibleStart + Math.round(i * (visibleCount - 1) / 4));
    for (const index of ticks) {
      make('text', { x: x(index), y: bottom + 22, 'text-anchor': index === visibleStart ? 'start' : index === bars.length - 1 ? 'end' : 'middle' }, svg, bars[index].date.slice(5));
    }
    const half = barWidth * .32;
    visibleBars.forEach((bar, visibleIndex) => {
      const index = visibleStart + visibleIndex;
      const color = bar.close >= bar.open ? '#16766a' : '#b34d40';
      const group = make('g', { class: 'price-bar', 'data-date': bar.date }, svg);
      make('title', {}, group, `${bar.date} UTC | O ${price(bar.open)} | H ${price(bar.high)} | L ${price(bar.low)} | C ${price(bar.close)} USDT`);
      make('line', { x1: x(index), x2: x(index), y1: y(bar.high), y2: y(bar.low), stroke: color, 'stroke-width': 1.2 }, group);
      make('rect', { x: x(index) - half, y: Math.min(y(bar.open), y(bar.close)), width: half * 2, height: Math.max(1, Math.abs(y(bar.open) - y(bar.close))), fill: color }, group);
    });
    const strikeY = y(strike);
    const gross = settlement => direction * intrinsic(settlement, strike);
    const net = settlement => direction * (intrinsic(settlement, strike) - premium);
    // Fixed bounds include signed settlement and net P&L for every strike.
    const extrema = contracts.flatMap(contract => [min, max].flatMap(settlement => {
      const value = intrinsic(settlement, contract.strike);
      return [direction * value, direction * (value - contract.premium)];
    }));
    const pnlMin = Math.min(-1, ...extrema) * (isLong ? 1.2 : 1.12);
    const pnlMax = Math.max(1, ...extrema) * (isLong ? 1.12 : 1.2);
    // Mirror the sideways payoff: profit points left, loss points right.
    const pnlX = value => payoffRight - (value - pnlMin) / (pnlMax - pnlMin) * payoffWidth;
    const zeroX = pnlX(0);
    const path = (prices, value) => prices.map((settlement, i) => `${i ? 'L' : 'M'} ${pnlX(value(settlement))} ${y(settlement)}`).join(' ');
    const loss = '#b34d40', profit = '#16766a';
    const panel = make('g', { class: `option-panel ${position}-${optionType}-panel`, 'data-strike': strike, 'data-premium': premium, 'data-breakeven': breakeven, 'data-pnl-min': pnlMin, 'data-pnl-max': pnlMax }, svg);
    make('text', { x: payoffLeft, y: 13, class: 'panel-title' }, panel, `${moneyness} ${strategy} · at expiry`);
    // Split at strike and breakeven so every segment has one P&L sign.
    const knots = [...new Set([min, strike, breakeven, max].filter(value => value >= min && value <= max))].sort((a, b) => a - b);
    for (let i = 1; i < knots.length; i++) {
      const lo = knots[i - 1], hi = knots[i];
      const positive = net((lo + hi) / 2) >= 0;
      const name = positive ? 'profit' : 'loss', color = positive ? profit : loss;
      make('path', { class: `${optionType}-${name}-area`, d: `${path([lo, hi], net)} L ${zeroX} ${y(hi)} L ${zeroX} ${y(lo)} Z`, fill: color, 'fill-opacity': .13 }, panel);
      make('path', { class: `net-${name} ${optionType}-net-${name}`, d: path([lo, hi], net), fill: 'none', stroke: color, 'stroke-width': 2.4 }, panel);
    }
    make('line', { class: 'pnl-zero', x1: zeroX, x2: zeroX, y1: margin.top, y2: bottom, stroke: '#99968d' }, panel);
    make('path', { class: 'option-payoff', d: path([min, strike, max], gross), fill: 'none', stroke: '#8d8a80', 'stroke-width': 1.6, 'stroke-dasharray': '5 4' }, panel);
    make('line', { class: 'breakeven-line', x1: margin.left, x2: payoffRight, y1: y(breakeven), y2: y(breakeven), stroke: profit, 'stroke-dasharray': '2 5', 'stroke-opacity': .55 }, panel);
    make('circle', { class: 'breakeven-dot', cx: zeroX, cy: y(breakeven), r: 4, fill: profit }, panel);
    make('text', { x: zeroX + (isLong ? -8 : 8), y: y(breakeven) - 8, 'text-anchor': isLong ? 'end' : 'start', class: 'profit-text' }, panel, `BE ${price(breakeven)}`);
    make('text', { x: isLong ? payoffRight - 6 : payoffLeft + 6, y: isCall ? bottom - 12 : margin.top + 16, 'text-anchor': isLong ? 'end' : 'start', class: isLong ? 'loss-text' : 'profit-text' }, panel, `Max ${isLong ? 'loss' : 'profit'} ${price(premium)}`);
    for (const value of [Math.round(pnlMin / 2000) * 1000, 0, Math.round(pnlMax / 2000) * 1000]) {
      make('line', { x1: pnlX(value), x2: pnlX(value), y1: bottom, y2: bottom + 5, stroke: '#99968d' }, panel);
      make('text', { x: pnlX(value), y: bottom + 22, 'text-anchor': 'middle' }, panel, value === 0 ? '0' : `${value < 0 ? '−' : '+'}${(Math.abs(value) / 1000).toFixed(1)}k`);
    }
    make('text', { x: payoffLeft, y: height - 6 }, panel, '← Profit · P&L (USDT) · Loss →');
    const risk = isLong
      ? `Max loss ${price(premium)}; ${isCall ? 'profit uncapped' : `max profit ${price(strike - premium)} at BTC = 0`}. ITM does not guarantee net profit.`
      : `Max profit ${price(premium)}; ${isCall ? 'loss uncapped' : `max loss ${price(strike - premium)} at BTC = 0`}. Moneyness describes the option, not the seller's profit.`;
    document.getElementById('option-summary').textContent = `Illustrative ${moneyness} ${strategy} · 1 BTC · Spot ${price(spot)} · Strike ${price(strike)} · Premium ${isLong ? 'paid' : 'received'} ${price(premium)} USDT · Breakeven ${price(breakeven)}. ${risk}`;
    // ATM is a single price; the 20px band only makes that line easy to hover.
    const atmTolerance = 10;
    const zones = [
      { name: isCall ? 'ITM' : 'OTM', top: margin.top, bottom: strikeY - atmTolerance },
      { name: 'ATM', top: strikeY - atmTolerance, bottom: strikeY + atmTolerance },
      { name: isCall ? 'OTM' : 'ITM', top: strikeY + atmTolerance, bottom }
    ];
    const highlight = make('g', { 'pointer-events': 'none', 'aria-hidden': 'true' }, svg);
    for (const zone of zones) {
      zone.shade = make('rect', { class: 'moneyness-shade', x: margin.left, y: zone.top, width: payoffRight - margin.left, height: zone.bottom - zone.top, fill: '#777', opacity: 0 }, highlight);
      zone.annotation = make('text', { class: 'moneyness-annotation', x: margin.left + plotWidth / 2, y: (zone.top + zone.bottom) / 2, 'text-anchor': 'middle', 'dominant-baseline': 'middle', opacity: 0 }, highlight, zone.name);
    }
    const activateZone = name => {
      for (const zone of zones) {
        const active = name === zone.name;
        zone.shade.setAttribute('opacity', active ? .18 : 0);
        zone.annotation.setAttribute('opacity', active ? 1 : 0);
      }
    };
    make('line', { class: 'spot-line', x1: margin.left, x2: payoffRight, y1: y(spot), y2: y(spot), stroke: '#99968d', 'stroke-width': 1, 'stroke-dasharray': '2 5', 'pointer-events': 'none' }, svg);
    if (strike !== spot) {
      make('text', { class: 'spot-label', x: dividerX + 6, y: y(spot) + (strike > spot ? 15 : -7), 'pointer-events': 'none' }, svg, `Spot ${price(spot)}`);
    }
    make('line', { class: 'strike-line', x1: margin.left, x2: payoffRight, y1: strikeY, y2: strikeY, stroke: '#4e635e', 'stroke-width': 1.4, 'stroke-dasharray': '5 4', 'pointer-events': 'none' }, svg);
    const strikeLabelOffset = strike < spot && Math.abs(strikeY - y(spot)) < 20 ? 15 : -7;
    make('text', { class: 'strike-label', x: dividerX + 6, y: strikeY + strikeLabelOffset, 'pointer-events': 'none' }, svg, `${strike === spot ? 'Spot = K' : 'K'} ${strikePrice(strike)}`);
    crosshair = make('line', { y1: margin.top, y2: bottom, stroke: '#726d63', 'stroke-dasharray': '3 4', 'pointer-events': 'none' }, svg);
    const priceGuide = make('line', { class: 'price-guide', x1: margin.left, x2: payoffRight, stroke: '#726d63', 'stroke-dasharray': '3 4', 'pointer-events': 'none', visibility: 'hidden' }, svg);
    const netDot = make('circle', { class: 'net-dot', r: 4, 'pointer-events': 'none', visibility: 'hidden' }, svg);
    function showPayoffHover(settlement) {
        const vertical = y(settlement);
        const zone = zones.find(zone => vertical >= zone.top && vertical <= zone.bottom);
        activateZone(zone?.name);
        const pnl = net(settlement);
        priceGuide.setAttribute('y1', vertical);
        priceGuide.setAttribute('y2', vertical);
        priceGuide.setAttribute('visibility', 'visible');
        netDot.setAttribute('cx', pnlX(pnl));
        netDot.setAttribute('cy', vertical);
        netDot.setAttribute('fill', pnl >= 0 ? profit : loss);
        netDot.setAttribute('visibility', 'visible');
        const displayedPnl = Math.abs(pnl) < .005 ? 0 : pnl;
        document.getElementById('option-readout').setAttribute('data-state', displayedPnl > 0 ? 'profit' : displayedPnl < 0 ? 'loss' : 'neutral');
        document.getElementById('option-pnl').textContent = `Net P&L ${displayedPnl > 0 ? '+' : ''}${price(displayedPnl)} USDT`;
        document.getElementById('option-details').textContent = `Expiry price ${price(settlement)} USDT · ${isLong ? 'Payoff' : 'Settlement paid'} ${price(intrinsic(settlement, strike))} USDT`;
    }
    const showPointer = event => {
      const bounds = svg.getBoundingClientRect();
      const position = (event.clientX - bounds.left) * width / bounds.width;
      const vertical = (event.clientY - bounds.top) * height / bounds.height;
      if (position >= margin.left && position <= payoffRight && vertical >= margin.top && vertical <= bottom) {
        hoverPrice = min + (bottom - vertical) / (bottom - margin.top) * (max - min);
        showPayoffHover(hoverPrice);
        if (position < dividerX) select(visibleStart + Math.floor((position - margin.left) / barWidth));
      } else if (position <= payoffRight) {
        hidePayoffHover();
      }
    };
    svg.addEventListener('pointermove', showPointer);
    svg.addEventListener('pointerdown', showPointer);
    function hidePayoffHover() {
      hoverPrice = null;
      activateZone(null);
      priceGuide.setAttribute('visibility', 'hidden');
      netDot.setAttribute('visibility', 'hidden');
      document.getElementById('option-readout').setAttribute('data-state', 'neutral');
      document.getElementById('option-pnl').textContent = 'Net P&L —';
      document.getElementById('option-details').textContent = 'Hover over either plot to compare price, payoff and net P&L at expiry.';
    }
    clearHover = hidePayoffHover;
    if (hoverPrice === null) hidePayoffHover();
    else showPayoffHover(hoverPrice);
    select(selected);
  }

  document.getElementById('date-range').title = `Source: ${source} · CSV SHA-256: ${sha256} · Showing the latest bars that fit from ${bars.length} embedded daily bars.`;
  function changeStrike(value) {
    const next = Math.max(-strikeLimit, Math.min(strikeLimit, Math.round(value)));
    if (!Number.isFinite(next)) return;
    slider.value = String(next);
    if (next === strikeIndex) return;
    strikeIndex = next;
    draw();
  }
  slider.addEventListener('input', () => changeStrike(Number(slider.value)));
  slider.addEventListener('keydown', event => {
    const moves = { ArrowUp: strikeIndex + 1, ArrowRight: strikeIndex + 1,
      ArrowDown: strikeIndex - 1, ArrowLeft: strikeIndex - 1,
      PageUp: strikeIndex + 2, PageDown: strikeIndex - 2, Home: -strikeLimit, End: strikeLimit };
    if (event.key in moves) {
      event.preventDefault();
      changeStrike(moves[event.key]);
    }
  });
  let lastWheelAt = -Infinity;
  let lastWheelDirection = 0;
  slider.addEventListener('wheel', event => {
    if (event.ctrlKey || event.deltaY === 0) return;
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    // A continuous trackpad burst is one step; a pause or reversal starts another.
    if (event.timeStamp - lastWheelAt > 180 || direction !== lastWheelDirection) {
      changeStrike(strikeIndex + direction);
    }
    lastWheelAt = event.timeStamp;
    lastWheelDirection = direction;
  }, { passive: false });
  document.getElementById('reset-strike').addEventListener('click', () => changeStrike(0));
  chart.addEventListener('pointerleave', () => clearHover());
  chart.addEventListener('keydown', event => {
    if (event.target !== chart) return;
    const moves = { ArrowLeft: selected - 1, ArrowRight: selected + 1, Home: visibleStart, End: bars.length - 1 };
    if (event.key in moves) {
      event.preventDefault();
      select(moves[event.key]);
    }
  });
  new ResizeObserver(draw).observe(chart);
  draw();
})();
