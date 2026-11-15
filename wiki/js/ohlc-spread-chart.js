/* Daily candles + two-leg vertical spread, with a common vertical price axis. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const { bars, source, sha256 } = JSON.parse($('ohlc-data').textContent);
  const spot = bars.at(-1).close;
  let model = BtcVerticalSpread.create(document.body.dataset.optionType, spot, document.body.dataset.spreadType || 'debit');
  let buyIndex = model.defaults.buy, sellIndex = model.defaults.sell;
  const modeButtons = document.body.dataset.modeSwitcher === 'true'
    ? [...document.querySelectorAll('[data-spread-mode]')] : [];
  const modes = {
    'call-debit': { optionType: 'call', spreadType: 'debit', heading: 'Bull call · debit spread' },
    'put-debit': { optionType: 'put', spreadType: 'debit', heading: 'Bear put · debit spread' },
    'call-credit': { optionType: 'call', spreadType: 'credit', heading: 'Bear call · credit spread' },
    'put-credit': { optionType: 'put', spreadType: 'credit', heading: 'Bull put · credit spread' }
  };
  let activeMode = `${model.isCall ? 'call' : 'put'}-${model.spreadType}`;
  const savedPairs = new Map();
  const wheelState = { buy: { lastAt: -Infinity, lastDirection: 0 }, sell: { lastAt: -Infinity, lastDirection: 0 } };
  let selected = bars.length - 1, visibleStart = 0, hoverPrice = null;
  let selectBar = () => {}, showHover = () => {}, hideHover = () => {};
  const chart = $('chart'), controls = $('strike-controls');
  const profit = '#16766a', loss = '#b34d40', buyColor = '#366b94', sellColor = '#a06b27';
  const price = n => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const integer = n => n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  const money = n => '$' + integer(n);
  const signed = n => (n < -.005 ? '−' : n > .005 ? '+' : '') + price(Math.abs(n) < .005 ? 0 : Math.abs(n));
  const ns = 'http://www.w3.org/2000/svg';
  function make(tag, attrs, parent, text) {
    const n = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (text !== undefined) n.textContent = text;
    parent.appendChild(n);
    return n;
  }

  function updateStrikeNote(pos) {
    const type = model.isCall ? 'call' : 'put', otmSide = model.isCall ? 'above' : 'below';
    const itm = strike => model.isCall ? strike < spot : strike > spot;
    const allItm = itm(pos.buy.strike) && itm(pos.sell.strike);
    $('date-range').textContent = allItm
      ? `Both strikes ITM: opposite trade at a worse cost. Move them ${otmSide} spot ${integer(spot)}.`
      : `Pick ATM or slightly OTM: for ${type}s that is at or just ${otmSide} spot ${integer(spot)}.`;
    $('date-range').classList.toggle('itm-warning', allItm);
  }
  $('date-range').title = `Source: ${source} · CSV SHA-256: ${sha256} · ${bars.length} embedded daily bars (${bars[0].date} — ${bars.at(-1).date} UTC). Spot ${price(spot)} USDT.`;
  function draw() {
    const pos = model.position(buyIndex, sellIndex), showLegs = $('show-legs').checked;
    const width = Math.max(760, chart.clientWidth), height = Math.max(240, chart.clientHeight);
    const top = 24, bottom = height - 40, left = 8;
    const payoffRight = width - 180, payoffLeft = payoffRight - 290;
    const rightEdge = payoffLeft - 64, candleWidth = rightEdge - left;
    const paddingBars = 15;
    const count = Math.min(bars.length, Math.max(30, Math.floor(candleWidth / 5.5) - paddingBars));
    visibleStart = bars.length - count;
    const visible = bars.slice(visibleStart), barWidth = candleWidth / (count + paddingBars);
    const divider = left + count * barWidth;
    const x = i => left + (i - visibleStart + .5) * barWidth;
    // All available strikes and spread breakevens contribute, regardless of selection.
    const low = Math.min(...visible.map(b => b.low), ...model.contracts.map(c => c.strike), ...model.pairs.map(p => p.breakeven));
    const high = Math.max(...visible.map(b => b.high), ...model.contracts.map(c => c.strike), ...model.pairs.map(p => p.breakeven));
    const pad = (high - low) * .08, min = low - pad, max = high + pad;
    const y = p => bottom - (p - min) / (max - min) * (bottom - top);
    // Include both legs even when hidden: toggling never changes the axis.
    const extrema = model.pairs.flatMap(p => [min, max].flatMap(v => [p.longPnl(v), p.shortPnl(v), p.net(v)]));
    const domain = Math.ceil(Math.max(1, ...extrema.map(Math.abs)) / 1000) * 1000 * 1.08;
    const pnlX = pnl => payoffRight - (pnl + domain) / (domain * 2) * (payoffRight - payoffLeft);
    const zeroX = pnlX(0);
    $('chart-layout').style.width = `${width}px`;
    $('chart-layout').style.height = `${height}px`;
    controls.style.left = `${payoffRight + 12}px`;
    for (const leg of ['buy', 'sell']) {
      const c = pos[leg], slider = $(leg + '-strike');
      slider.value = c.index;
      slider.style.top = `${y(model.contract(5).strike) - 9}px`;
      slider.style.height = `${y(model.contract(-5).strike) - y(model.contract(5).strike) + 18}px`;
      $(leg + '-value').textContent = integer(c.strike);
      $(leg + '-premium').textContent = `${leg === 'buy' ? 'Pay' : 'Receive'} ${money(c.premium)}`;
      const [lo, hi] = model.bounds(leg, buyIndex, sellIndex);
      const validRange = `Valid strikes ${integer(model.contract(lo).strike)} to ${integer(model.contract(hi).strike)} USDT. Minimum spread width 1,000 USDT. The other leg stays fixed.`;
      $(leg + '-valid-range').textContent = validRange;
      slider.title = validRange + ' Drag, scroll, or use arrow keys.';
      slider.setAttribute('aria-valuetext', `${integer(c.strike)} USDT, ${leg} ${model.isCall ? 'call' : 'put'}, premium ${integer(c.premium)} USDT. ${validRange}`);
    }
    $('constraint-message').textContent = pos.width === model.step ? 'Minimum spread width: 1,000 USDT' : '';
    for (const [id, value] of [[$('net-amount') ? 'net-amount' : model.isCredit ? 'net-credit' : 'net-debit', pos.amount], ['spread-width', pos.width], ['max-loss', pos.maxLoss], ['max-profit', pos.maxProfit], ['breakeven', pos.breakeven]]) $(id).textContent = money(value);
    $('chart-mode').textContent = `1 BTC / leg · Spot ${integer(spot)}`;
    updateStrikeNote(pos);

    $('chart-plot').replaceChildren();
    const svg = make('svg', { width, height, viewBox: `0 0 ${width} ${height}`, role: 'img',
      'aria-label': `Daily BTC candles and ${model.strategy} at expiry. Buy strike ${pos.buy.strike}, sell strike ${pos.sell.strike}. Profit left; loss right.` }, $('chart-plot'));
    make('title', {}, svg, `BTC daily candles and ${model.strategy} expiry P&L`);
    make('desc', {}, svg, 'Both plots share a BTC price axis. Hover or tap to inspect hypothetical expiry P&L. The Buy and Sell controls select distinct strikes.');
    const rawStep = (max - min) / 5, magnitude = 10 ** Math.floor(Math.log10(rawStep));
    const step = [1, 2, 2.5, 5, 10].map(v => v * magnitude).find(v => v >= rawStep);
    for (let p = Math.ceil(min / step) * step; p <= max; p += step) {
      for (const [a, b] of [[left, rightEdge], [payoffLeft, payoffRight]])
        make('line', { x1: a, x2: b, y1: y(p), y2: y(p), stroke: '#ddd9d0' }, svg);
      make('text', { x: rightEdge + 7, y: y(p) + 4 }, svg, integer(p));
    }
    make('text', { x: rightEdge + 7, y: 13 }, svg, 'USDT');
    const tickCount = candleWidth < 300 ? 3 : 4;
    for (let j = 0; j < tickCount; j++) {
      const i = visibleStart + Math.round(j * (count - 1) / (tickCount - 1));
      make('text', { x: x(i), y: bottom + 19, 'text-anchor': j === 0 ? 'start' : j === tickCount - 1 ? 'end' : 'middle' }, svg, bars[i].date.slice(5));
    }
    visible.forEach((bar, j) => {
      const i = visibleStart + j, color = bar.close >= bar.open ? profit : loss;
      const g = make('g', { class: 'price-bar', 'data-date': bar.date }, svg);
      make('title', {}, g, `${bar.date} UTC | O ${price(bar.open)} | H ${price(bar.high)} | L ${price(bar.low)} | C ${price(bar.close)}`);
      make('line', { x1: x(i), x2: x(i), y1: y(bar.high), y2: y(bar.low), stroke: color, 'stroke-width': 1.2 }, g);
      make('rect', { x: x(i) - barWidth * .32, y: Math.min(y(bar.open), y(bar.close)), width: barWidth * .64, height: Math.max(1, Math.abs(y(bar.open) - y(bar.close))), fill: color }, g);
    });
    const lo = Math.min(pos.buy.strike, pos.sell.strike), hi = Math.max(pos.buy.strike, pos.sell.strike);
    const panel = make('g', { class: 'spread-panel', 'data-buy-strike': pos.buy.strike, 'data-sell-strike': pos.sell.strike,
      ...(model.isCredit ? { 'data-credit': pos.credit } : { 'data-debit': pos.debit }), 'data-width': pos.width, 'data-breakeven': pos.breakeven,
      'data-pnl-min': -domain, 'data-pnl-max': domain, 'data-price-min': min, 'data-price-max': max }, svg);
    make('text', { x: payoffLeft, y: 13, class: 'panel-title' }, panel, 'Combined P&L · at expiry');
    const path = (prices, fn) => prices.map((p, i) => `${i ? 'L' : 'M'} ${pnlX(fn(p))} ${y(p)}`).join(' ');
    make('line', { class: 'pnl-zero', x1: zeroX, x2: zeroX, y1: top, y2: bottom, stroke: '#99968d' }, panel);
    const knots = [...new Set([min, lo, hi, pos.breakeven, max])].sort((a, b) => a - b);
    for (let i = 1; i < knots.length; i++) {
      const a = knots[i - 1], b = knots[i], color = pos.net((a + b) / 2) >= 0 ? profit : loss;
      make('path', { class: 'spread-area', d: `${path([a, b], pos.net)} L ${zeroX} ${y(b)} L ${zeroX} ${y(a)} Z`, fill: color, 'fill-opacity': .15 }, panel);
    }
    if (showLegs) {
      for (const [leg, fn, color] of [['buy', pos.longPnl, buyColor], ['sell', pos.shortPnl, sellColor]])
        make('path', { class: `leg-curve ${leg}-curve`, d: path([min, pos[leg].strike, max], fn), fill: 'none', stroke: color, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, panel);
    }
    make('path', { class: 'spread-curve', d: path([min, lo, hi, max], pos.net), fill: 'none', stroke: '#262722', 'stroke-width': 3, 'stroke-linejoin': 'round' }, panel);
    make('line', { class: 'breakeven-line', x1: left, x2: payoffRight, y1: y(pos.breakeven), y2: y(pos.breakeven), stroke: profit, 'stroke-dasharray': '2 5', opacity: .6 }, panel);
    make('circle', { class: 'breakeven-dot', cx: zeroX, cy: y(pos.breakeven), r: 3.5, fill: profit }, panel);
    const levels = [
      { value: spot, text: `Spot ${integer(spot)}`, color: '#99968d', name: 'spot', dash: '2 5' },
      { value: pos.buy.strike, text: `Buy ${integer(pos.buy.strike)}`, color: buyColor, name: 'buy', dash: '5 4' },
      { value: pos.sell.strike, text: `Sell ${integer(pos.sell.strike)}`, color: sellColor, name: 'sell', dash: '5 4' },
      { value: pos.breakeven, text: `BE ${integer(pos.breakeven)}`, color: profit, name: 'be', dash: null }
    ];
    // Label positions may separate; the underlying price lines never move.
    levels.sort((a, b) => b.value - a.value);
    let lastY = top;
    for (const level of levels) {
      level.labelY = Math.max(y(level.value) - 5, lastY + 14);
      lastY = level.labelY;
    }
    const overflow = Math.max(0, lastY - (bottom - 4));
    for (const level of levels) {
      const ly = level.labelY - overflow;
      if (level.dash) make('line', { class: `${level.name}-line`, x1: left, x2: payoffRight, y1: y(level.value), y2: y(level.value), stroke: level.color, 'stroke-dasharray': level.dash, 'stroke-width': level.name === 'spot' ? 1 : 1.2, opacity: .8 }, svg);
      make('line', { x1: rightEdge - 6, x2: rightEdge, y1: ly - 3, y2: y(level.value), stroke: level.color, 'stroke-width': .7 }, svg);
      make('text', { class: `level-label ${level.name}-label`, x: rightEdge - 8, y: ly, 'text-anchor': 'end', fill: level.color }, svg, level.text);
    }
    const bracketX = payoffRight - 5;
    make('path', { class: 'width-bracket', d: `M ${bracketX - 5} ${y(hi)} H ${bracketX} V ${y(lo)} H ${bracketX - 5}`, fill: 'none', stroke: '#726d63' }, svg);
    make('text', { class: 'width-label level-label', x: bracketX - 8, y: (y(hi) + y(lo)) / 2 + 3, 'text-anchor': 'end' }, svg, `W ${integer(pos.width)}`);
    const tick = Math.floor(domain / 1000) * 1000;
    for (const v of [tick, 0, -tick]) {
      make('line', { x1: pnlX(v), x2: pnlX(v), y1: bottom, y2: bottom + 4, stroke: '#99968d' }, panel);
      make('text', { x: pnlX(v), y: bottom + 19, 'text-anchor': 'middle' }, panel, v === 0 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v) / 1000}k`);
    }
    make('text', { x: (payoffLeft + payoffRight) / 2, y: height - 4, 'text-anchor': 'middle' }, panel, '← Profit · USDT · Loss →');
    const crosshair = make('line', { class: 'candle-crosshair', y1: top, y2: bottom, stroke: '#726d63', 'stroke-dasharray': '3 4', 'pointer-events': 'none' }, svg);
    const guide = make('line', { class: 'price-guide', x1: left, x2: payoffRight, stroke: '#726d63', 'stroke-dasharray': '3 4', 'pointer-events': 'none', visibility: 'hidden' }, svg);
    const dots = [['net', pos.net, '#262722'], ...(showLegs ? [['buy', pos.longPnl, buyColor], ['sell', pos.shortPnl, sellColor]] : [])].map(([name, fn, color]) => ({ fn,
      node: make('circle', { class: `${name}-dot`, r: name === 'net' ? 4 : 3, fill: color, 'pointer-events': 'none', visibility: 'hidden' }, svg) }));
    selectBar = index => {
      selected = Math.max(visibleStart, Math.min(bars.length - 1, index));
      const bar = bars[selected];
      $('readout').textContent = `${bar.date} UTC   O ${price(bar.open)}   H ${price(bar.high)}   L ${price(bar.low)}   C ${price(bar.close)}`;
      crosshair.setAttribute('x1', x(selected)); crosshair.setAttribute('x2', x(selected));
    };
    showHover = p => {
      hoverPrice = Math.max(min, Math.min(max, p));
      const a = pos.longPnl(hoverPrice), b = pos.shortPnl(hoverPrice), total = a + b;
      const longActive = model.intrinsic(hoverPrice, pos.buy.strike) > 0;
      const shortActive = model.intrinsic(hoverPrice, pos.sell.strike) > 0;
      const active = longActive && shortActive ? 'both legs have intrinsic value' : longActive ? 'only Buy has intrinsic value' : shortActive ? 'only Sell has intrinsic value' : 'neither leg has intrinsic value';
      guide.setAttribute('y1', y(hoverPrice)); guide.setAttribute('y2', y(hoverPrice)); guide.setAttribute('visibility', 'visible');
      for (const dot of dots) {
        dot.node.setAttribute('cx', pnlX(dot.fn(hoverPrice))); dot.node.setAttribute('cy', y(hoverPrice)); dot.node.setAttribute('visibility', 'visible');
      }
      const displayed = Math.abs(total) < .005 ? 0 : total;
      $('option-readout').dataset.state = displayed > 0 ? 'profit' : displayed < 0 ? 'loss' : 'neutral';
      $('option-pnl').textContent = `Spread P&L ${signed(displayed)} USDT`;
      const location = hoverPrice === lo || hoverPrice === hi ? 'At a strike'
        : hoverPrice < lo ? 'Below both strikes' : hoverPrice > hi ? 'Above both strikes' : 'Between strikes';
      $('option-details').textContent = `At expiry BTC ${price(hoverPrice)} · ${location}: ${active}`;
      const equation = $('leg-equation'); equation.replaceChildren();
      for (const [text, className] of [[`Buy ${signed(a)}`, 'buy-text'], [' + ', ''], [`Sell (${signed(b)})`, 'sell-text'], [` = Spread ${signed(total)} USDT`, '']]) {
        const span = document.createElement('span'); span.className = className; span.textContent = text; equation.appendChild(span);
      }
      $('option-readout').dataset.expiryPrice = hoverPrice;
    };
    hideHover = () => {
      hoverPrice = null;
      guide.setAttribute('visibility', 'hidden');
      for (const dot of dots) dot.node.setAttribute('visibility', 'hidden');
      $('option-readout').dataset.state = 'neutral'; delete $('option-readout').dataset.expiryPrice;
      $('option-pnl').textContent = 'Spread P&L —';
      $('option-details').textContent = 'Hover or tap either plot to inspect a hypothetical expiry price.';
      $('leg-equation').textContent = '1 BTC per leg · same expiry · illustrative premiums · USDT';
    };
    const pointer = event => {
      const r = svg.getBoundingClientRect(), px = (event.clientX - r.x) * width / r.width, py = (event.clientY - r.y) * height / r.height;
      if (px >= left && px <= payoffRight && py >= top && py <= bottom) {
        showHover(min + (bottom - py) / (bottom - top) * (max - min));
        if (px < divider) selectBar(visibleStart + Math.floor((px - left) / barWidth));
      } else hideHover();
    };
    svg.addEventListener('pointermove', pointer); svg.addEventListener('pointerdown', pointer);
    if (hoverPrice === null) hideHover(); else showHover(hoverPrice);
    selectBar(selected);
  }

  function change(leg, requested) {
    const next = model.constrain(leg, requested, buyIndex, sellIndex);
    $(leg + '-strike').value = next;
    const previous = leg === 'buy' ? buyIndex : sellIndex;
    if (leg === 'buy') buyIndex = next; else sellIndex = next;
    if (next !== previous) draw();
    // Announce an attempted crossing even if the current pair cannot move.
    if (Number.isFinite(requested) && next !== Math.round(requested)) {
      const onLadder = Math.max(-model.limit, Math.min(model.limit, Math.round(requested)));
      $('constraint-message').textContent = next !== onLadder
        ? 'Minimum spread width: 1,000 USDT' : 'Strike ladder limit reached';
    }
  }
  for (const leg of ['buy', 'sell']) {
    const slider = $(leg + '-strike');
    slider.addEventListener('input', () => change(leg, Number(slider.value)));
    slider.addEventListener('keydown', event => {
      const index = leg === 'buy' ? buyIndex : sellIndex;
      const moves = { ArrowUp: index + 1, ArrowRight: index + 1, ArrowDown: index - 1, ArrowLeft: index - 1, PageUp: index + 2, PageDown: index - 2, Home: -5, End: 5 };
      if (event.key in moves) { event.preventDefault(); change(leg, moves[event.key]); }
    });
    const gesture = wheelState[leg];
    slider.addEventListener('wheel', event => {
      if (event.ctrlKey || !event.deltaY) return;
      event.preventDefault();
      const direction = event.deltaY < 0 ? 1 : -1;
      if (event.timeStamp - gesture.lastAt > 180 || direction !== gesture.lastDirection)
        change(leg, (leg === 'buy' ? buyIndex : sellIndex) + direction);
      gesture.lastAt = event.timeStamp; gesture.lastDirection = direction;
    }, { passive: false });
  }
  $('reset-spread').addEventListener('click', () => { buyIndex = model.defaults.buy; sellIndex = model.defaults.sell; draw(); });
  $('show-legs').addEventListener('change', draw);
  chart.addEventListener('pointerleave', event => {
    // Touch sends pointerleave when the finger lifts; retain the tapped price.
    const withinPage = modeButtons.length && event.relatedTarget instanceof Element && event.relatedTarget.closest('.spread-page');
    if (event.pointerType !== 'touch' && !withinPage) hideHover();
  });
  chart.addEventListener('keydown', event => {
    if (event.target !== chart) return;
    const moves = { ArrowLeft: selected - 1, ArrowRight: selected + 1, Home: visibleStart, End: bars.length - 1 };
    if (event.key in moves) { event.preventDefault(); selectBar(moves[event.key]); showHover(bars[selected].close); }
    if (event.key === 'Escape') hideHover();
  });
  for (const info of document.querySelectorAll('.info')) {
    info.addEventListener('keydown', event => { if (event.key === 'Escape') info.classList.add('dismissed'); });
    for (const event of ['pointerenter', 'focusin', 'click']) info.addEventListener(event, () => info.classList.remove('dismissed'));
  }
  function updateModeText() {
    const optionType = model.isCall ? 'call' : 'put';
    const heading = modes[activeMode].heading;
    document.querySelector('h1').textContent = heading;
    document.title = `BTCUSDT · ${heading}`;
    document.body.dataset.optionType = optionType;
    document.body.dataset.spreadType = model.spreadType;
    for (const leg of ['buy', 'sell'])
      document.querySelector(`label[for="${leg}-strike"]`).textContent = `${leg === 'buy' ? 'Buy' : 'Sell'} ${optionType}`;
    $('net-amount-label').textContent = model.isCredit ? 'Net credit' : 'Net debit';
    chart.setAttribute('aria-label', `Daily BTCUSDT and ${model.strategy} chart. Use left and right arrows to inspect bars; Home and End jump to the first and last visible bar.`);
    controls.setAttribute('aria-label', `${model.strategy} strikes`);
    document.querySelector('.info button').setAttribute('aria-label', `About this ${model.strategy}`);
    $('model-info').textContent = `Buy one ${optionType} and sell one ${optionType}, same expiry and 1 BTC per leg. `
      + (model.isCredit ? 'Net credit is received initially; liability remains until closing or expiry. ' : 'Net debit is paid initially. ')
      + 'Illustrative premiums follow the same chain as the single-option charts; they exclude bid/ask differences, fees and margin costs. '
      + 'These curves show expiration P&L, not option prices before expiry. Candles are historical context; the hover price is a hypothetical expiry price. '
      + 'Use the Buy and Sell sliders to move strikes in 1,000-USDT steps. Equal or crossed strikes are blocked. Show legs reveals each leg’s net P&L.';
    document.querySelector('.info').classList.add('dismissed');
    for (const button of modeButtons)
      button.setAttribute('aria-pressed', String(button.dataset.spreadMode === activeMode));
  }
  for (const button of modeButtons) {
    button.addEventListener('click', () => {
      const nextMode = button.dataset.spreadMode;
      if (nextMode === activeMode) return;
      savedPairs.set(activeMode, { buy: buyIndex, sell: sellIndex });
      const config = modes[nextMode];
      model = BtcVerticalSpread.create(config.optionType, spot, config.spreadType);
      activeMode = nextMode;
      const pair = savedPairs.get(activeMode) || model.defaults;
      buyIndex = pair.buy; sellIndex = pair.sell;
      for (const gesture of Object.values(wheelState)) {
        gesture.lastAt = -Infinity; gesture.lastDirection = 0;
      }
      updateModeText();
      draw();
    });
  }
  if (modeButtons.length) updateModeText();
  new ResizeObserver(draw).observe(chart);
  draw();
})();
