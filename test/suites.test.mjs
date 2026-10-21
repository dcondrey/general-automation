import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { googleFake } from './google-fake.mjs';

function kit(name, responder = () => { throw Error('Unexpected network request'); }) {
  const env = googleFake(), calls = [], sleeps = [];
  const context = vm.createContext({ console, Date, ...env.services,
    Utilities: { DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' }, computeDigest: (_a, text) => [...createHash('sha256').update(text).digest()], sleep: ms => sleeps.push(ms) },
    UrlFetchApp: { fetch(url, options) { calls.push({ url, ...options }); const r = responder(url, options, calls.length); return { getResponseCode: () => r.code ?? 200, getContentText: () => typeof r.body === 'string' ? r.body : JSON.stringify(r.body), getAllHeaders: () => r.headers || {} }; } },
  });
  const source = ['Book', 'RunLog', 'Operator', 'Suite', 'Connections', 'Transport', name].map(n => readFileSync(new URL('../src/' + n + '.js', import.meta.url), 'utf8')).join('\n');
  vm.runInContext(source + '\nthis.kit={Book,Suite,Connections,Transport,' + name + '};', context);
  return { ...context.kit, env, calls, sleeps };
}
const today = new Date().toISOString().slice(0, 10);

test('marketplace demo is repeatable, isolated and requires no connections', () => {
  const { Watch, Book, env, calls } = kit('Watch');
  Watch.setup(); Watch.run();
  assert.equal(calls.length, 0);
  assert.equal(Book.read('Signals', Watch.SIGNALS).length, 0);
  assert.equal(Book.read('Demo signals', Watch.SIGNALS).length, 4);
  assert.ok(Book.read('Metrics', Watch.METRICS).find(r => r[0] === 'DEMO-PET')[3] === 0);
  Watch.setup(); assert.equal(env.ss.sheets.get('Demo signals').getLastRow(), 5);
});

test('late inbound cannot hide stockout and timely inbound is included only before initial depletion', () => {
  const { Watch } = kit('Watch'), now = Date.parse(today + 'T00:00:00Z');
  const data = Watch.sample(now); data.ads = []; data.stock[0][1] = 0;
  let result = Watch.evaluate(data, 3, now);
  assert.equal(result.metrics[0][3], 0);
  assert.ok(result.signals.some(r => r[0] === 'DEMO-PET:STOCK' && r[3] === 'Critical'));
  data.stock[0][1] = 100; data.stock[0][3] = today;
  result = Watch.evaluate(data, 3, now);
  assert.equal(result.metrics[0][3], 500);
});

test('stale or missing source data preserves earlier business alerts instead of falsely resolving them', () => {
  const { Watch } = kit('Watch'), now = Date.now(), data = Watch.sample(now);
  const before = Watch.merge(Watch.evaluate(data, 3, now).signals, [], now);
  data.offers[0][4] = '2020-01-01'; data.stock = [];
  const after = Watch.merge(Watch.evaluate(data, 3, now).signals, before, now);
  assert.equal(after.find(r => r[0] === 'DEMO-PET:STOCK')[8], 'Open');
  assert.equal(after.find(r => r[0].startsWith('DEMO-PET:MAP'))[8], 'Open');
  assert.ok(after.some(r => r[1] === 'Data quality'));
});

test('signal lifecycle preserves acknowledgements and snoozes, resolves good snapshots, and reopens', () => {
  const { Watch } = kit('Watch'); const s = ['x', 'Stock', 'SKU', 'Low', 'Owner', 'detail'];
  let rows = Watch.merge([s], [], 1); rows[0][8] = 'Acknowledged'; rows[0][9] = '2099-01-01';
  rows = Watch.merge([s], rows, 2); assert.equal(rows[0][8], 'Acknowledged'); assert.equal(rows[0][9], '2099-01-01');
  rows = Watch.merge([], rows, 3); assert.equal(rows[0][8], 'Resolved');
  rows = Watch.merge([s], rows, 4); assert.equal(rows[0][8], 'Open'); assert.equal(rows[0][10], '');
});

test('currency mismatches and zero denominators do not manufacture marketplace metrics', () => {
  const { Watch } = kit('Watch'), data = Watch.sample(Date.now()); data.offers[0][3] = 'EUR'; data.ads[0][2] = 0; data.ads[0][3] = 0;
  const r = Watch.evaluate(data, 3, Date.now());
  assert.ok(r.signals.some(s => s[0] === 'DEMO-PET:CURRENCY'));
  assert.ok(!r.signals.some(s => s[0].startsWith('DEMO-PET:MAP')));
  assert.equal(r.metrics[0][5], null); assert.equal(r.metrics[0][6], null);
  data.stock[0][4] = 301; assert.throws(() => Watch.evaluate(data, 3, Date.now()), /7-day units/);
});

test('digest holds uncertain delivery and never retries it automatically', () => {
  const { Watch, Book, env, calls, Connections } = kit('Watch', () => { throw Error('connection lost'); });
  Watch.setup(); env.settings('Mode', 'Live');
  Connections.save('Slack webhook', 'https://hooks.slack.com/services/T/B/EXAMPLE');
  Book.append('Signals', Watch.SIGNALS, Watch.merge([['x', 'Stock', 'SKU', 'Low', 'Owner', 'detail']], [], Date.now()));
  assert.throws(Watch.digest, /without a confirmed/); assert.equal(calls.length, 1);
  Watch.digest(); assert.equal(calls.length, 1); assert.equal(Book.read('Signals', Watch.SIGNALS)[0][10], 'Unknown');
});

test('digest batching marks only the 20 signals actually included, leaving the rest for the next digest', () => {
  const { Watch, Book, env, Connections } = kit('Watch', () => ({ body: 'ok' }));
  Watch.setup(); env.settings('Mode', 'Live'); Connections.save('Slack webhook', 'https://hooks.slack.com/services/T/B/EXAMPLE');
  Book.append('Signals', Watch.SIGNALS, Watch.merge(Array.from({ length: 21 }, (_, i) => ['x' + i, 'Stock', 'SKU', 'Low', 'Owner', 'detail']), [], Date.now()));
  Watch.digest(); const rows = Book.read('Signals', Watch.SIGNALS); assert.equal(rows.filter(r => r[10].startsWith('Sent')).length, 20); assert.equal(rows.filter(r => r[10] === '').length, 1);
});

test('sorter demo is explicitly deterministic, cached, and cannot call an API', () => {
  const { Sorter, Book, calls } = kit('Sorter'); Sorter.setup(); Sorter.run();
  assert.equal(calls.length, 0); const rows = Book.read('Demo results', Sorter.RESULTS); assert.equal(rows.length, 4); assert.ok(rows.every(r => r[4] === 'Yes')); assert.equal(rows[3][2], 'Other');
  assert.equal(Book.read('Results', Sorter.RESULTS).length, 0);
});

test('classification schema rejects unknown labels, extra keys, bogus confidence and oversized reasons', () => {
  const { Sorter } = kit('Sorter'); const valid = { label: 'Other', confidence: 0.5, needs_review: true, reason: 'Unclear' };
  assert.doesNotThrow(() => Sorter.validate(valid, ['Other']));
  for (const changes of [{ label: 'Unknown' }, { confidence: -0.01 }, { confidence: 1.01 }, { confidence: '0.5' }, { needs_review: 'false' }, { reason: 'x'.repeat(301) }, { action: 'delete' }]) assert.throws(() => Sorter.validate({ ...valid, ...changes }, ['Other']), /invalid classification/);
});

test('live AI records intent before generating and does not pay again after an ambiguous failure', () => {
  const { Sorter, Book, env, Connections, calls } = kit('Sorter', url => url.endsWith(':countTokens') ? { body: { totalTokens: 100 } } : (() => { throw Error('timeout'); })());
  Sorter.setup(); env.settings('Mode', 'Live'); env.settings('Input USD/million tokens', 1); env.settings('Output USD/million tokens', 2); Connections.save('Gemini API key', 'test-only-placeholder');
  Book.append('Feedback', Sorter.INPUT, [['id1', 'The package arrived late.']]);
  assert.throws(Sorter.run, /without a confirmed/); assert.equal(Book.read('AI ledger', Sorter.LEDGER)[0][2], 'Unknown');
  Sorter.run(); assert.equal(calls.length, 2);
});

test('live AI validates, records usage, respects caching and evaluates matching examples against baseline', () => {
  const { Sorter, Book, env, Connections, calls } = kit('Sorter', url => url.endsWith(':countTokens') ? { body: { totalTokens: 100 } } : { body: { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ label: 'Shipping', confidence: 0.9, needs_review: false, reason: 'Delivery issue' }) }] } }], usageMetadata: { promptTokenCount: 100, totalTokenCount: 150 } } });
  Sorter.setup(); env.settings('Mode', 'Live'); env.settings('Input USD/million tokens', 1); env.settings('Output USD/million tokens', 2); Connections.save('Gemini API key', 'test-only-placeholder');
  Book.append('Feedback', Sorter.INPUT, [['id1', 'The shipment is late.']]); Sorter.run(); Sorter.run();
  assert.equal(calls.length, 2); assert.equal(Book.read('Results', Sorter.RESULTS).length, 1); assert.equal(Book.read('AI ledger', Sorter.LEDGER)[0][2], 'Completed');
  Book.append('Golden set', Sorter.GOLD, [['id1', 'The shipment is late.', 'Shipping'], ['missing', 'Other text', 'Other']]); Sorter.evaluate();
  const measures = new Map(Book.read('Evaluation', ['Measure', 'Value'])); assert.equal(measures.get('Matched examples'), 1); assert.equal(measures.get('Classifier accuracy'), 1); assert.equal(measures.get('Keyword baseline accuracy'), 1); assert.equal(measures.get('Missing/stale examples'), 1);
});

test('AI estimate limit prevents generation and leaves no held generation intent', () => {
  const { Sorter, Book, env, Connections, calls } = kit('Sorter', () => ({ body: { totalTokens: 100 } }));
  Sorter.setup(); env.settings('Mode', 'Live'); env.settings('Input USD/million tokens', 100); env.settings('Output USD/million tokens', 100); env.settings('Run estimate limit USD', 0.00001); Connections.save('Gemini API key', 'test-only-placeholder');
  Book.append('Feedback', Sorter.INPUT, [['id1', 'Hello']]); Sorter.run(); assert.equal(calls.length, 1); assert.equal(Book.read('AI ledger', Sorter.LEDGER).length, 0);
});

test('handoff demo validates the transfer without external writes', () => {
  const { Handoffs, Book, calls } = kit('Handoffs'); Handoffs.setup(); Handoffs.run(); assert.equal(calls.length, 0); assert.equal(Book.read('Preview', ['Handoff key', 'Decision', 'Task name', 'Inputs and next action'])[0][1], 'Would create');
});

test('handoff inputs reject rounded IDs, invalid ASINs, incomplete assets, and unsafe keys', () => {
  const { Handoffs } = kit('Handoffs');
  for (const [index, value] of [[5, 123456789], [9, 'invalid'], [10, 'javascript:alert(1)'], [0, 'x\nInjected']]) { const row = [...Handoffs.samples[0]]; row[index] = value; assert.throws(() => Handoffs.plan(row)); }
  for (const len of [9, 10, 11]) { const row = [...Handoffs.samples[0]]; row[9] = 'A'.repeat(len); if (len === 10) assert.doesNotThrow(() => Handoffs.plan(row)); else assert.throws(() => Handoffs.plan(row), /ASIN/); }
});

test('live handoff gates on source completion and repeated runs create one task', () => {
  let complete = false;
  const { Handoffs, Book, env, Connections, calls } = kit('Handoffs', (_url, opts) => opts.method === 'get' ? { body: { data: { completed: complete } } } : { body: { data: { gid: '987654321' } } });
  Handoffs.setup(); env.settings('Mode', 'Live'); Connections.save('Asana token', 'test-only-placeholder');
  const row = [...Handoffs.samples[0]]; row[1] = '11111'; Book.append('Handoffs', Handoffs.INPUT, [row]); Handoffs.run(); assert.equal(calls.length, 1);
  complete = true; Handoffs.run(); Handoffs.run(); assert.equal(calls.filter(r => r.method === 'post').length, 1); assert.equal(Book.read('Handoff ledger', Handoffs.LEDGER)[0][2], 'Created');
});

test('an ambiguous Asana write is held and reconciliation finds its exact marker without creating another task', () => {
  const { Handoffs, Book, env, Connections, calls } = kit('Handoffs', (_url, opts) => { if (opts.method === 'post') throw Error('Lost acknowledgement'); return { body: { data: [{ gid: '987654321', notes: 'Automation handoff key: demo-handoff-1\nnext' }], next_page: null } }; });
  Handoffs.setup(); env.settings('Mode', 'Live'); Connections.save('Asana token', 'test-only-placeholder'); Book.append('Handoffs', Handoffs.INPUT, Handoffs.samples);
  assert.throws(Handoffs.run, /without a confirmed/); Handoffs.run(); assert.equal(calls.length, 1); Handoffs.reconcile();
  assert.equal(Book.read('Handoff ledger', Handoffs.LEDGER)[0][2], 'Reconciled'); assert.equal(calls.filter(c => c.method === 'post').length, 1);
});

test('connections are scoped to the current workbook and do not return stored secrets', () => {
  const { Connections, env } = kit('Handoffs'); const msg = Connections.save('Asana token', 'test-only-placeholder'); assert.doesNotMatch(msg, /test-only/); assert.equal(Connections.get('Asana token'), 'test-only-placeholder'); env.ss.id = 'copy'; assert.throws(() => Connections.get('Asana token'), /Connections/);
  assert.throws(() => Connections.save('Slack webhook', 'https://evil.invalid/services/x'), /Slack incoming/); assert.throws(() => Connections.save('Unexpected', '1234567890'), /supported/);
});

test('changed inputs cannot redirect an uncertain handoff reconciliation to a new destination', () => {
  const { Handoffs, Book, env, Connections, calls } = kit('Handoffs', () => { throw Error('timeout'); });
  Handoffs.setup(); env.settings('Mode', 'Live'); Connections.save('Asana token', 'test-only-placeholder'); Book.append('Handoffs', Handoffs.INPUT, Handoffs.samples);
  assert.throws(Handoffs.run); env.ss.sheets.get('Handoffs').data[1][5] = '999999999'; Handoffs.reconcile(); assert.equal(calls.length, 1); assert.match(Book.read('Handoff ledger', Handoffs.LEDGER)[0][5], /Inputs changed/);
});

test('feedback length is validated before a request can incur cost at 1999, 2000 and 2001 characters', () => {
  for (const n of [1999, 2000, 2001]) {
    const { Sorter, Book } = kit('Sorter'); Sorter.setup(); Book.append('Demo feedback', Sorter.INPUT, [['boundary', 'a'.repeat(Math.min(n, 2000))]]);
    if (n === 2001) { const row = Book.open().getSheetByName('Demo feedback').data.at(-1); row[1] = 'a'.repeat(n); assert.throws(Sorter.inputs, /2000/); }
    else assert.doesNotThrow(Sorter.inputs);
  }
});

test('missing advertising snapshots preserve a previously active advertising exception', () => {
  const { Watch, Book, env } = kit('Watch'); Watch.setup(); env.settings('Mode', 'Live'); const data = Watch.sample(Date.now());
  for (const [name, headers, rows] of [['Products', Watch.PRODUCTS, data.products], ['Offers', Watch.OFFERS, data.offers], ['Inventory', Watch.STOCK, data.stock], ['Ads', Watch.ADS, data.ads]]) Book.append(name, headers, rows);
  Watch.run(); Book.replace('Ads', Watch.ADS, []); Watch.run(); const signals = Book.read('Signals', Watch.SIGNALS);
  assert.equal(signals.find(r => r[0] === 'DEMO-PET:ADS')[8], 'Open'); assert.ok(signals.some(r => r[0] === 'DEMO-PET:MISSING:Ads'));
});

test('HTTP retries only reads, respects retry delays, and excludes raw payloads and credentials from errors', () => {
  const { Transport, calls, sleeps } = kit('Watch', (_url, _opts, attempt) => attempt < 3 ? { code: 429, body: 'secret from provider', headers: { 'Retry-After': '1' } } : { body: { data: [] } });
  Transport.json('https://app.asana.com/api/1.0/tasks', 'get', undefined, {}, true); assert.equal(calls.length, 3); assert.equal(sleeps.length, 2);
  const failed = kit('Watch', () => ({ code: 500, body: 'raw-secret', headers: {} })); assert.throws(() => failed.Transport.json('https://app.asana.com/api/1.0/tasks', 'post', {}), e => !e.message.includes('raw-secret')); assert.equal(failed.calls.length, 1);
  assert.throws(() => Transport.request('http://example.com', 'get'), /not supported/);
});

test('repeating setup in Live mode cannot send tasks or incur AI generation charges', () => {
  for (const name of ['Sorter', 'Handoffs']) {
    const k = kit(name); k[name].setup(); k.env.settings('Mode', 'Live');
    assert.doesNotThrow(k[name].setup); assert.equal(k.calls.length, 0);
  }
});
