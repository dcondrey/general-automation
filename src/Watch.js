const Watch = {
  PRODUCTS: ['SKU', 'MAP', 'Currency', 'Authorized sellers (comma separated)', 'Lead days', 'Safety days', 'Owner'],
  OFFERS: ['SKU', 'Seller', 'Price', 'Currency', 'Observed on'],
  STOCK: ['SKU', 'On hand', 'Inbound units', 'Inbound due', 'Units sold 7 days', 'Units sold 30 days', 'Observed on'],
  ADS: ['SKU', 'Spend', 'Ad sales', 'Total sales', 'Prior spend', 'Prior ad sales', 'Target ACOS %', 'Period ending'],
  SIGNALS: ['Key', 'Type', 'SKU', 'Severity', 'Owner', 'Detail', 'First seen', 'Last seen', 'Status', 'Snooze until', 'Digest state'],
  METRICS: ['SKU', 'Daily velocity', 'On-hand cover days', 'Usable inbound', 'Reorder point', 'ACOS', 'TACOS', 'ROAS'],
  defaults: [['Mode', 'Demo', 'Demo uses separate fictional inputs; Live reads your input tabs.'], ['Maximum age days', 3, 'Older observations raise a Data quality signal and do not produce business conclusions.']],
  sample(now) {
    const today = new Date(now).toISOString().slice(0, 10);
    return { products: [['DEMO-PET', 25, 'USD', 'Authorized Shop', 14, 7, 'Supply chain'], ['DEMO-BEAUTY', 30, 'USD', 'Brand Store', 21, 7, 'Brand lead']],
      offers: [['DEMO-PET', 'Unlisted Shop', 19, 'USD', today], ['DEMO-BEAUTY', 'Brand Store', 32, 'USD', today]],
      stock: [['DEMO-PET', 10, 500, '2099-01-01', 70, 300, today], ['DEMO-BEAUTY', 500, 0, '', 35, 150, today]],
      ads: [['DEMO-PET', 400, 800, 1600, 200, 800, 30, today]] };
  },
  evaluate(data, maxAge, now) {
    const signals = [], metrics = [], products = new Map(), stock = new Map(), ads = new Map(), offers = new Set();
    const raise = (key, type, sku, severity, owner, detail) => signals.push([key, type, sku, severity, owner, detail]);
    const fresh = (v, sku, owner, kind) => {
      const date = Suite.date(v, kind + ' date');
      const age = (now - date.getTime()) / 86400000;
      if (age < -1) throw new OperatorError(kind + ' date is in the future for ' + sku + '.');
      if (age > maxAge + 1) { raise(sku + ':STALE:' + kind, 'Data quality', sku, 'Review', owner, kind + ' data is stale. Refresh the feed before acting.'); return false; }
      return true;
    };
    data.products.forEach((r, i) => {
      const sku = Suite.text(r[0], 'Products row ' + (i + 2) + ' SKU', 64);
      if (!/^[A-Za-z0-9._-]+$/.test(sku)) throw new OperatorError('SKU must use letters, digits, periods, underscores, or hyphens.');
      if (products.has(sku)) throw new OperatorError('Duplicate product SKU: ' + sku);
      if (typeof r[2] !== 'string' || !/^[A-Z]{3}$/.test(r[2])) throw new OperatorError('Currency must be a three-letter uppercase code.');
      products.set(sku, { map: Suite.number(r[1], sku + ' MAP', 0, 1000000), currency: Suite.text(r[2], 'Currency', 3), sellers: Suite.text(r[3], 'Authorized sellers', 1000).split(',').map(s => s.trim().toLowerCase()), lead: Suite.number(r[4], 'Lead days', 0, 365), safety: Suite.number(r[5], 'Safety days', 0, 365), owner: Suite.text(r[6], 'Owner', 100) });
    });
    const product = sku => { if (!products.has(sku)) throw new OperatorError('Unknown SKU ' + sku + '. Add it to Products first.'); return products.get(sku); };
    data.offers.forEach(r => {
      const p = product(r[0]), seller = Suite.text(r[1], 'Seller', 100), price = Suite.number(r[2], 'Offer price', 0, 1000000);
      offers.add(r[0]);
      if (!fresh(r[4], r[0], p.owner, 'Offers')) return;
      if (r[3] !== p.currency) { raise(r[0] + ':CURRENCY', 'Data quality', r[0], 'Review', p.owner, 'Offer and MAP currencies differ; no price comparison was made.'); return; }
      if (p.map > 0 && price < p.map) raise(r[0] + ':MAP:' + seller.toLowerCase(), 'Below MAP', r[0], 'Review', p.owner, seller + ' offers ' + price + ' ' + p.currency + ' against MAP ' + p.map + '. Verify the offer before taking action.');
      if (!p.sellers.includes(seller.toLowerCase())) raise(r[0] + ':SELLER:' + seller.toLowerCase(), 'Seller review', r[0], 'Review', p.owner, seller + ' is absent from your authorized-seller list.');
    });
    data.stock.forEach(r => {
      const p = product(r[0]);
      if (stock.has(r[0])) throw new OperatorError('Duplicate inventory SKU: ' + r[0]);
      stock.set(r[0], true);
      if (!fresh(r[6], r[0], p.owner, 'Inventory')) return;
      const hand = Suite.number(r[1], 'On hand', 0, 100000000), inbound = Suite.number(r[2], 'Inbound units', 0, 100000000);
      const seven = Suite.number(r[4], '7-day units', 0, 100000000), thirty = Suite.number(r[5], '30-day units', 0, 100000000);
      if (seven > thirty) throw new OperatorError('7-day units exceed 30-day units for ' + r[0] + '. Check matching windows.');
      const velocity = 0.6 * seven / 7 + 0.4 * thirty / 30;
      const cover = velocity > 0 ? hand / velocity : null;
      let usable = 0;
      if (inbound > 0) {
        const due = Suite.date(r[3], 'Inbound due');
        const untilDue = Math.max(0, (due.getTime() - now) / 86400000);
        if (due.getTime() < now - 86400000) raise(r[0] + ':INBOUND', 'Inbound overdue', r[0], 'Review', p.owner, 'Inbound arrival date passed; verify receipt before including it in stock.');
        else if (cover !== null && untilDue <= cover) usable = inbound;
      }
      const effectiveCover = velocity > 0 ? (hand + usable) / velocity : null;
      if (hand === 0) raise(r[0] + ':STOCK', 'Stock', r[0], 'Critical', p.owner, 'No on-hand inventory. Future inbound does not remove the current stockout.');
      else if (effectiveCover !== null && effectiveCover <= p.lead + p.safety) raise(r[0] + ':STOCK', 'Stock', r[0], effectiveCover <= p.lead ? 'Critical' : 'Low', p.owner, effectiveCover.toFixed(1) + ' days of cover. Only inbound due before initial stockout is counted.');
      else if (velocity === 0) raise(r[0] + ':DEMAND', 'Data quality', r[0], 'Review', p.owner, 'No observed demand; days of cover is undefined, not infinite healthy stock.');
      metrics.push([r[0], velocity, cover, usable, Math.ceil(velocity * (p.lead + p.safety)), '', '', '']);
    });
    data.ads.forEach(r => {
      const p = product(r[0]);
      if (ads.has(r[0])) throw new OperatorError('Duplicate advertising SKU: ' + r[0]);
      ads.set(r[0], true);
      if (!fresh(r[7], r[0], p.owner, 'Ads')) return;
      const spend = Suite.number(r[1], 'Spend', 0, 100000000), sales = Suite.number(r[2], 'Ad sales', 0, 100000000), revenue = Suite.number(r[3], 'Total sales', 0, 100000000), priorSpend = Suite.number(r[4], 'Prior spend', 0, 100000000), priorSales = Suite.number(r[5], 'Prior ad sales', 0, 100000000), target = Suite.number(r[6], 'Target ACOS %', 0, 100) / 100;
      const acos = sales > 0 ? spend / sales : null, prior = priorSales > 0 ? priorSpend / priorSales : null;
      if (spend > 0 && sales === 0) raise(r[0] + ':ADS', 'Advertising', r[0], 'Review', p.owner, 'Advertising spend has no attributed sales. Verify attribution timing and the reporting window.');
      else if (acos !== null && acos > target && (prior === null || acos > prior * 1.25)) raise(r[0] + ':ADS', 'Advertising', r[0], 'Review', p.owner, 'ACOS is ' + (acos * 100).toFixed(1) + '%, above target and materially worse than the supplied comparison.');
      const row = metrics.find(m => m[0] === r[0]) || [r[0], '', '', '', '', '', '', ''];
      if (!metrics.includes(row)) metrics.push(row);
      row[5] = acos; row[6] = revenue > 0 ? spend / revenue : null; row[7] = spend > 0 ? sales / spend : null;
    });
    products.forEach((p, sku) => {
      if (!stock.has(sku)) raise(sku + ':MISSING:Inventory', 'Data quality', sku, 'Review', p.owner, 'Inventory snapshot is missing for this SKU.');
      if (!offers.has(sku)) raise(sku + ':MISSING:Offers', 'Data quality', sku, 'Review', p.owner, 'Offer snapshot is missing for this SKU.');
    });
    const unique = new Map(); signals.forEach(s => unique.set(s[0], s));
    return { signals: [...unique.values()], metrics };
  },
  merge(incoming, previous, now) {
    const active = new Map(incoming.map(r => [r[0], r]));
    const uncertain = new Set(incoming.filter(r => r[1] === 'Data quality').map(r => r[2]));
    const seen = new Set();
    const rows = previous.map(old => {
      if (seen.has(old[0])) throw new OperatorError('Duplicate signal key. Restore one row per key before checking again.');
      seen.add(old[0]);
      if (!['Open', 'Acknowledged', 'Resolved'].includes(old[8])) throw new OperatorError('Signals Status must be Open, Acknowledged, or Resolved.');
      if (old[9] !== '') Suite.date(old[9], 'Snooze until');
      const signal = active.get(old[0]);
      if (!signal) return uncertain.has(old[2]) ? old : old.slice(0, 8).concat(['Resolved', old[9], old[10]]);
      active.delete(old[0]);
      const reopened = old[8] === 'Resolved' || old[3] !== signal[3];
      return signal.concat([old[6], new Date(now), reopened ? 'Open' : old[8], old[9], reopened ? '' : old[10]]);
    });
    active.forEach(s => rows.push(s.concat([new Date(now), new Date(now), 'Open', '', ''])));
    return rows;
  },
  setup() {
    Suite.settings(Watch.defaults);
    [['Products', Watch.PRODUCTS], ['Offers', Watch.OFFERS], ['Inventory', Watch.STOCK], ['Ads', Watch.ADS], ['Signals', Watch.SIGNALS], ['Metrics', Watch.METRICS], ['Demo signals', Watch.SIGNALS]].forEach(([name, headers]) => Suite.table(name, headers));
    const signalSheet = Book.open().getSheetByName('Signals');
    signalSheet.getRange(2, 9, Book.MAX_ROWS, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Open', 'Acknowledged', 'Resolved'], true).setAllowInvalid(false).build());
    Suite.help('Marketplace Watch', [['1. Check demo', 'Automations → Check marketplace. Demo signals and Metrics use fictional inputs; Live Signals stay separate.'], ['2. Add feeds', 'Fill Products, Offers, Inventory, and Ads with matching SKUs and observation dates. Use complete snapshots from permitted sources.'], ['3. Use live inputs', 'Settings → Mode = Live. Check marketplace again; stale feeds produce data-quality signals.'], ['4. Triage', 'Edit Signals Status or Snooze until. Repeated checks update the same keys. Resolved signals reopen when observed again.'], ['5. Optional digest', 'Save your Slack webhook in Connections, then Send new-signal digest. An ambiguous delivery is held as Unknown and is not retried automatically.']]);
    return Watch.run();
  },
  run() {
    const opts = Suite.options(), demo = opts.Mode === 'Demo';
    const data = demo ? Watch.sample(Date.now()) : { products: Book.read('Products', Watch.PRODUCTS), offers: Book.read('Offers', Watch.OFFERS), stock: Book.read('Inventory', Watch.STOCK), ads: Book.read('Ads', Watch.ADS) };
    if (!data.products.length) throw new OperatorError('Add at least one product before checking live feeds.');
    const result = Watch.evaluate(data, Suite.number(opts['Maximum age days'], 'Maximum age days', 0, 90), Date.now());
    const name = demo ? 'Demo signals' : 'Signals';
    const previous = Book.read(name, Watch.SIGNALS);
    previous.filter(r => r[1] === 'Advertising' && !data.ads.some(a => a[0] === r[2])).forEach(r => result.signals.push([r[2] + ':MISSING:Ads', 'Data quality', r[2], 'Review', r[4], 'Previously monitored advertising data is missing; existing alerts stay open.']));
    Book.replace(name, Watch.SIGNALS, Watch.merge(result.signals, previous, Date.now()));
    Book.replace('Metrics', Watch.METRICS, result.metrics);
    return { summary: (demo ? 'DEMO: ' : '') + result.signals.length + ' active signals. Review owners, status, and snoozes before acting.' };
  },
  digest() {
    if (Suite.options().Mode !== 'Live') throw new OperatorError('Demo mode never posts to Slack. Switch to Live after checking your feeds.');
    const rows = Book.read('Signals', Watch.SIGNALS);
    const selected = rows.filter(r => r[8] === 'Open' && r[10] === '' && (r[9] === '' || Suite.date(r[9], 'Snooze until').getTime() < Date.now())).slice(0, 20);
    if (!selected.length) return { summary: 'No unsent, unsnoozed open signals.' };
    const url = Connections.get('Slack webhook');
    selected.forEach(r => { r[10] = 'Unknown'; });
    Book.replace('Signals', Watch.SIGNALS, rows);
    const text = selected.slice(0, 20).map(r => r[3] + ' | ' + r[2] + ' | ' + r[4] + ': ' + r[5]).join('\n');
    const response = Transport.request(url, 'post', { text: 'Marketplace signals (' + selected.length + ')\n' + text, mrkdwn: false });
    if (response.trim() !== 'ok') throw new OperatorError('Slack did not confirm delivery. Inspect the channel before clearing Unknown in Digest state.');
    selected.forEach(r => { r[10] = 'Sent ' + new Date().toISOString(); });
    Book.replace('Signals', Watch.SIGNALS, rows);
    return { summary: selected.length + ' signals included in the digest; additional detail remains in Signals.' };
  },
  menu() { SpreadsheetApp.getUi().createMenu('Automations').addItem('Set up workbook', 'watchSetup').addItem('Check marketplace', 'watchRun').addItem('Send new-signal digest', 'watchDigest').addItem('Connections', 'showConnections').addToUi(); },
};
function watchSetup() { return operatorAction_('Set up Marketplace Watch', Watch.setup); }
function watchRun() { return operatorAction_('Check marketplace', Watch.run); }
function watchDigest() { return operatorAction_('Send signal digest', Watch.digest); }
