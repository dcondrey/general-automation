import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';
import { googleFake } from './google-fake.mjs';

const id = n => '12345678-1234-4abc-8abc-' + String(n).padStart(12, '0');
const input = () => ({ department: 'Supply Chain', process: 'Reconcile exports', owner: 'Operations owner', runs: '5', minutes: '45', needed: 'Yes', redesign: 'No', people: '2', share: '80', effort: '8', upkeep: '30', notes: 'Two-week baseline.' });
function ready() {
  const env = googleFake(), kit = load(env.services);
  kit.Template.setup();
  return { env, ...kit };
}
function added(kit) { kit.Workspace.add({ requestId: id(1), input: input() }); return kit.Workspace.snapshot().items[0]; }
function plan(item, n = 2) { return { requestId: id(n), ref: item.ref, due: '2099-01-31', next: 'Verify the baseline with the owner.', revision: item.plan.revision }; }
function measurement(item, n = 3) { return { requestId: id(n), ref: item.ref, date: '2026-01-15', saved: '4', evidence: 'Owner compared the same workload for two weeks, including upkeep.', confirmed: true }; }

test('workspace preview uses the production scoring contract without changing any inputs', () => {
  const kit = ready(), before = JSON.stringify(kit.Book.read('Backlog', kit.Backlog.HEADERS));
  const result = kit.Workspace.preview(input());
  assert.ok(Math.abs(result.baseline - 7.5) < 1e-9);
  assert.ok(Math.abs(result.potential - 5.5) < 1e-9);
  assert.ok(Math.abs(result.payback - 8 / 5.5) < 1e-9);
  assert.equal(JSON.stringify(kit.Book.read('Backlog', kit.Backlog.HEADERS)), before);
  assert.equal(kit.Workspace.snapshot().demo, true);
});

test('guided intake is idempotent, selects own data, escapes formulas, and never enables files', () => {
  const kit = ready(), payload = { requestId: id(1), input: { ...input(), process: '=HYPERLINK("https://example.invalid")' } };
  kit.Workspace.add(payload); kit.Workspace.add(payload);
  assert.equal(kit.Book.read('Backlog', kit.Backlog.HEADERS).length, 1);
  assert.equal(kit.Workspace.snapshot().demo, false);
  assert.equal(kit.env.forms.size + kit.env.docs.size, 0);
  assert.equal(kit.Settings.read().files, false);
  assert.equal(kit.Book.read('Backlog', kit.Backlog.HEADERS)[0][1], payload.input.process);
  assert.throws(() => kit.Workspace.add({ ...payload, input: { ...payload.input, owner: 'Changed' } }), /already saved with different/);
});

test('input boundaries reject oversized text, malformed choices, and identity forgery before mutation', () => {
  const kit = ready();
  for (const length of [159, 160]) assert.doesNotThrow(() => kit.Workspace.preview({ ...input(), process: 'x'.repeat(length) }));
  assert.throws(() => kit.Workspace.preview({ ...input(), process: 'x'.repeat(161) }));
  for (const value of [{ ...input(), needed: 'Maybe' }, { ...input(), people: '0' }, { ...input(), notes: 'x'.repeat(1001) }, { ...input(), extra: 'no' }]) assert.throws(() => kit.Workspace.preview(value));
  assert.throws(() => kit.Workspace.add({ requestId: 'forged', input: input() }));
  const item = kit.Workspace.snapshot().items[0];
  assert.throws(() => kit.Workspace.plan({ ...plan(item), ref: { ...item.ref, source: 'Settings' } }));
  assert.equal(kit.Book.read('Backlog', kit.Backlog.HEADERS).length, 0);
});

test('plans follow stable identities across sorting and reject stale edits and concurrent plan changes', () => {
  const kit = ready(), first = added(kit);
  kit.Workspace.plan(plan(first));
  kit.Workspace.add({ requestId: id(4), input: { ...input(), process: 'Another process' } });
  const rows = kit.env.ss.sheets.get('Backlog').data; [rows[1], rows[2]] = [rows[2], rows[1]];
  const oldRef = kit.Workspace.snapshot().items.find(i => i.ref.id === first.ref.id);
  const changedPlan = plan(oldRef, 5); changedPlan.next = 'Validate the new checklist.';
  kit.Workspace.plan(changedPlan);
  assert.throws(() => kit.Workspace.plan({ ...plan(oldRef, 6), next: 'Overwrite someone else.' }), /Someone updated/);
  assert.equal(kit.Book.read('Action plan', kit.Workspace.PLANS).length, 1);
  const fresh = kit.Workspace.snapshot().items.find(i => i.ref.id === first.ref.id);
  kit.env.ss.sheets.get('Backlog').data[fresh.ref.row - 1][4] = 99;
  assert.throws(() => kit.Workspace.plan(plan(fresh, 7)), /changed since/);
});

test('a plan retry resumes after identity assignment and a failed metadata write', () => {
  const kit = ready();
  kit.Book.append('Backlog', kit.Backlog.HEADERS, [[...kit.Demo.rows()[0].slice(0, 18), '']]);
  kit.env.settings('Data source', 'My backlog');
  const item = kit.Workspace.snapshot().items[0], payload = plan(item);
  kit.env.failWrite = 'Action plan';
  assert.throws(() => kit.Workspace.plan(payload), /Injected/);
  kit.Workspace.plan(payload); kit.Workspace.plan(payload);
  assert.equal(kit.Book.read('Action plan', kit.Workspace.PLANS).length, 1);
  assert.equal(kit.Book.read('Backlog', kit.Backlog.HEADERS)[0][18], 'manual:' + payload.requestId);
});

test('deleted or invalid processes retain their plan as an explicit unresolved item', () => {
  const kit = ready(), item = added(kit); kit.Workspace.plan(plan(item));
  kit.env.ss.sheets.get('Backlog').data.splice(1, 1);
  assert.equal(kit.Workspace.snapshot().unresolvedPlans, 1);
  assert.throws(() => kit.Workspace.plan({ ...plan(item, 5), revision: kit.Workspace.snapshot().items[0]?.plan.revision || '' }), /moved or was removed/);
  assert.equal(kit.Book.read('Action plan', kit.Workspace.PLANS).length, 1);
});

test('measurement requires evidence and live confirmation, retains history, and never adds repeated observations', () => {
  const kit = ready(), item = added(kit), payload = measurement(item);
  assert.throws(() => kit.Workspace.measure({ ...payload, evidence: '' }), /Measurement evidence/);
  assert.throws(() => kit.Workspace.measure({ ...payload, confirmed: false }), /Confirm/);
  assert.throws(() => kit.Workspace.measure({ ...payload, date: '2099-01-01' }), /no later than today/);
  assert.throws(() => kit.Workspace.measure({ ...payload, saved: '7.51' }), /between/);
  kit.Workspace.measure(payload);
  kit.Workspace.measure({ ...payload, ref: { revision: item.ref.revision, id: item.ref.id, source: item.ref.source, row: item.ref.row } });
  assert.equal(kit.Book.read('Savings history', kit.Workspace.HISTORY).length, 1);
  assert.equal(kit.Workspace.snapshot().measured, 4);
  const latest = kit.Workspace.snapshot().items[0];
  kit.Workspace.measure({ ...measurement(latest, 8), saved: '0' });
  const state = kit.Workspace.snapshot();
  assert.equal(state.measured, 0); assert.equal(state.potential, 0);
  assert.equal(state.history.length, 2); assert.equal(state.items[0].status, 'Live');
  kit.Workspace.measure(payload);
  assert.equal(kit.Workspace.snapshot().measured, 0);
});

test('measurement resumes an interrupted source write exactly once and holds changed source data', () => {
  const kit = ready(), item = added(kit), payload = measurement(item);
  // The first write only checkpoints the identity; fail the following source update.
  const sheet = kit.env.ss.sheets.get('Backlog'), original = sheet.getRange.bind(sheet);
  let fail = true;
  sheet.getRange = (...args) => { const range = original(...args); if (args[1] === 13 && fail) { range.setValues = () => { fail = false; throw Error('Interrupted source update'); }; } return range; };
  assert.throws(() => kit.Workspace.measure(payload), /Interrupted/);
  assert.equal(kit.Workspace.snapshot().pendingMeasurements, 1);
  kit.Workspace.resume({ requestId: payload.requestId });
  assert.equal(kit.Workspace.snapshot().pendingMeasurements, 0);
  assert.equal(kit.Book.read('Savings history', kit.Workspace.HISTORY).length, 1);
  assert.equal(kit.Workspace.snapshot().measured, 4);
});

test('an interrupted history acknowledgement recovers when Sheets returns a measured date as a Date', () => {
  const kit = ready(), item = added(kit), payload = measurement(item);
  kit.Workspace.table('Savings history', kit.Workspace.HISTORY);
  const sheet = kit.env.ss.sheets.get('Savings history'), original = sheet.getRange.bind(sheet);
  let fail = true;
  sheet.getRange = (...args) => { const range = original(...args); if (args[1] === 12 && fail) { range.setValues = () => { fail = false; throw Error('Interrupted acknowledgement'); }; } return range; };
  assert.throws(() => kit.Workspace.measure(payload), /Interrupted acknowledgement/);
  kit.env.ss.sheets.get('Backlog').data[1][14] = new Date('2026-01-15T08:00:00Z');
  kit.Workspace.measure(payload);
  assert.equal(kit.Workspace.history().length, 1);
  assert.equal(kit.Workspace.snapshot().pendingMeasurements, 0);
});

test('observed savings accepts the baseline boundary and rejects values above it', () => {
  for (const saved of [7.49, 7.5, 7.51]) {
    const kit = ready(), item = added(kit), run = () => kit.Workspace.measure({ ...measurement(item), saved });
    if (saved <= 7.5) assert.doesNotThrow(run); else assert.throws(run, /between/);
  }
});

test('source revisions normalize date cells using the workbook calendar across UTC boundaries', () => {
  const kit = ready(), item = added(kit);
  kit.env.ss.timeZone = 'Asia/Tokyo';
  const row = kit.Book.read('Backlog', kit.Backlog.HEADERS)[0]; row[12] = 'Live'; row[13] = 4; row[14] = '2026-01-15';
  const expected = kit.Workspace.rowHash(row);
  row[14] = new Date('2026-01-14T15:00:00Z');
  assert.equal(kit.Workspace.day(row[14]), '2026-01-15');
  assert.equal(kit.Workspace.rowHash(row), expected);
});

test('a pending receipt cannot overwrite a changed process or be reused for a different result', () => {
  const kit = ready(), item = added(kit), payload = measurement(item);
  const history = kit.Workspace.history;
  kit.Workspace.measure(payload);
  const rows = kit.env.ss.sheets.get('Savings history').data;
  rows[1][11] = 'Pending';
  kit.env.ss.sheets.get('Backlog').data[1][4] = 90;
  assert.throws(() => kit.Workspace.measure(payload), /changed after an interrupted/);
  assert.throws(() => kit.Workspace.measure({ ...payload, saved: '3' }), /different measurement/);
  assert.equal(kit.Workspace.history().length, history().length);
});

test('a saved input survives a derived-output failure and its retry repairs the summary', () => {
  const kit = ready(); kit.env.failWrite = 'Ranked';
  const payload = { requestId: id(1), input: input() }, result = kit.Workspace.add(payload);
  assert.match(result.warning, /was saved/);
  assert.equal(kit.Book.read('Backlog', kit.Backlog.HEADERS).length, 1);
  assert.equal(kit.Workspace.add(payload).warning, '');
  assert.equal(kit.Book.read('Backlog', kit.Backlog.HEADERS).length, 1);
  assert.deepEqual([...kit.env.ss.sheets.values()].filter(s => !s.hidden).map(s => s.name), ['Start here', 'Priorities', 'Backlog', 'Settings']);
});

test('damaged history identities and receipt hashes stop new measurements without changing source observations', () => {
  const kit = ready(), item = added(kit); kit.Workspace.measure(measurement(item));
  const source = JSON.stringify(kit.Book.read('Backlog', kit.Backlog.HEADERS));
  const row = kit.env.ss.sheets.get('Savings history').data[1], hash = row[9];
  row[9] = 'broken'; assert.throws(() => kit.Workspace.snapshot(), /changed request or source hash/);
  row[9] = hash; row[1] = 'Settings'; assert.throws(() => kit.Workspace.snapshot(), /Source in Savings history/);
  assert.equal(JSON.stringify(kit.Book.read('Backlog', kit.Backlog.HEADERS)), source);
});

test('RPC responses use serializable values and reject unsupported actions or lock contention safely', () => {
  const kit = ready(); assert.equal(kit.workspaceRequest('load', {}).ok, true);
  assert.equal(kit.workspaceRequest('__proto__', {}).ok, false);
  const state = kit.workspaceRequest('load', {}).data;
  const serializable = value => {
    assert.ok(value === null || ['string', 'number', 'boolean', 'object'].includes(typeof value));
    if (typeof value === 'number') assert.ok(Number.isFinite(value));
    if (value !== null && typeof value === 'object') {
      assert.ok(Array.isArray(value) || Object.prototype.toString.call(value) === '[object Object]');
      Object.values(value).forEach(serializable);
    }
  };
  serializable(state);
  kit.env.held = true;
  assert.match(kit.workspaceRequest('add', { requestId: id(1), input: input() }).error, /Another automation/);
  assert.equal(kit.Book.read('Backlog', kit.Backlog.HEADERS).length, 0);
});

test('guided edits preserve stable identity, plans, and measurement history across sorting and retries', () => {
  const kit = ready(), first = added(kit);
  kit.Workspace.plan(plan(first)); kit.Workspace.measure(measurement(first));
  kit.Workspace.add({ requestId: id(4), input: { ...input(), process: 'Another process' } });
  const current = kit.Workspace.snapshot().items.find(item => item.ref.id === first.ref.id);
  const payload = { requestId: id(5), ref: current.ref, input: { ...input(), owner: 'New owner', process: '=Literal process title' }, status: 'Live' };
  const sourceRows = kit.env.ss.sheets.get('Backlog').data; [sourceRows[1], sourceRows[2]] = [sourceRows[2], sourceRows[1]];
  const preview = kit.Workspace.previewEdit(payload);
  assert.equal(preview.baseline, 7.5);
  kit.Workspace.edit(payload); kit.Workspace.edit(payload);
  const state = kit.Workspace.snapshot(), edited = state.items.find(item => item.ref.id === first.ref.id);
  assert.equal(edited.owner, 'New owner'); assert.equal(edited.process, '=Literal process title');
  assert.equal(edited.measured, 4); assert.equal(edited.plan.next, plan(first).next);
  assert.equal(state.history.length, 1); assert.equal(state.history[0].process, first.process);
  assert.equal(kit.Workspace.history().length, 1);
  assert.equal(kit.Book.read('Backlog', kit.Backlog.HEADERS).length, 2);
  assert.equal(kit.env.forms.size + kit.env.docs.size, 0);
  assert.equal(kit.Settings.read().files, false);
});

test('invalid source rows can be corrected without touching another source or counting overlapping baselines', () => {
  const kit = ready();
  kit.Book.append('Backlog', kit.Backlog.HEADERS, [[...kit.Demo.rows()[0].slice(0, 18), '']]);
  kit.env.ss.sheets.get('Backlog').data[1][3] = '1,000'; kit.env.settings('Data source', 'My backlog');
  const state = kit.Workspace.snapshot(); assert.equal(state.items.length, 0); assert.equal(state.processes.length, 1);
  assert.match(state.processes[0].issue, /without commas/);
  const ref = state.processes[0].ref, details = kit.Workspace.process({ requestId: id(8), ref });
  assert.equal(details.input.runs, '1,000');
  const payload = { requestId: id(8), ref, input: { ...details.input, runs: '5' }, status: 'Planned' };
  const demoBefore = JSON.stringify(kit.Book.read('Demo backlog', kit.Backlog.HEADERS));
  kit.env.failWrite = 'Backlog'; assert.throws(() => kit.Workspace.edit(payload), /Injected/);
  kit.Workspace.edit(payload); kit.Workspace.edit(payload);
  assert.equal(kit.Workspace.snapshot().issueCount, 0);
  assert.equal(kit.Book.read('Backlog', kit.Backlog.HEADERS)[0][18], 'manual:' + id(8));
  assert.equal(JSON.stringify(kit.Book.read('Demo backlog', kit.Backlog.HEADERS)), demoBefore);
  const existing = kit.Workspace.snapshot().processes[0];
  kit.Workspace.add({ requestId: id(9), input: { ...input(), overlap: 'Shared time' } });
  const overlapPayload = { requestId: id(10), ref: existing.ref, input: { ...details.input, runs: '5', overlap: 'shared time' }, status: 'Planned' };
  assert.match(kit.Workspace.previewEdit(overlapPayload).warning, /excluded to prevent counting hours twice/);
  kit.Workspace.edit(overlapPayload);
  assert.equal(kit.Workspace.snapshot().items.length, 0); assert.equal(kit.Workspace.snapshot().processes.length, 2);
  assert.equal(kit.Workspace.snapshot().baseline, 0);
});

test('edits reject stale or forged references, preserve blank defaults, and cannot overwrite later changes on replay', () => {
  const kit = ready(), item = added(kit), payload = { requestId: id(6), ref: item.ref, input: { ...input(), people: '', effort: '', notes: '' }, status: 'Paused' };
  const before = JSON.stringify(kit.Book.read('Backlog', kit.Backlog.HEADERS));
  for (const status of ['Done', '', true]) assert.throws(() => kit.Workspace.edit({ ...payload, status }), /Status/);
  assert.throws(() => kit.Workspace.edit({ ...payload, ref: { ...item.ref, source: 'Settings' } }), /Process source/);
  assert.throws(() => kit.Workspace.edit({ ...payload, input: { ...input(), extra: 'injected' } }), /incomplete/);
  assert.equal(JSON.stringify(kit.Book.read('Backlog', kit.Backlog.HEADERS)), before);
  kit.Workspace.edit(payload); assert.equal(kit.Workspace.snapshot().potential, 0);
  const row = kit.env.ss.sheets.get('Backlog').data[1];
  assert.equal(row[5], ''); assert.equal(row[11], ''); assert.equal(row[15], '');
  row[2] = 'Concurrent owner';
  assert.throws(() => kit.Workspace.edit(payload), /changed since/);
  assert.throws(() => kit.Workspace.previewEdit(payload), /changed since/);
  assert.equal(row[2], 'Concurrent owner');
});

test('edits cannot invalidate recorded savings or race an interrupted measurement', () => {
  const kit = ready(), item = added(kit); kit.Workspace.measure(measurement(item));
  const live = kit.Workspace.snapshot().items[0], payload = { requestId: id(4), ref: live.ref, input: input(), status: 'Live' };
  assert.throws(() => kit.Workspace.edit({ ...payload, status: 'Paused' }), /Set Status to Live/);
  for (const minutes of [23.99, 24, 24.01]) {
    const preview = () => kit.Workspace.previewEdit({ ...payload, input: { ...input(), minutes } });
    if (minutes < 24) assert.throws(preview, /between 0 and/); else assert.doesNotThrow(preview);
  }
  kit.env.ss.sheets.get('Savings history').data[1][11] = 'Pending';
  assert.throws(() => kit.Workspace.edit({ ...payload, input: { ...input(), owner: 'Changed' } }), /interrupted measurement/);
  assert.equal(kit.Book.read('Backlog', kit.Backlog.HEADERS)[0][2], item.owner);
});

test('demo edits stay in the demo and saved changes survive a summary failure', () => {
  const kit = ready(), process = kit.Workspace.snapshot().processes[0];
  const { input } = kit.Workspace.process({ requestId: id(5), ref: process.ref });
  const payload = { requestId: id(5), ref: process.ref, input: { ...input, owner: 'Demo owner' }, status: 'In progress' };
  const before = JSON.stringify(kit.Book.read('Backlog', kit.Backlog.HEADERS));
  kit.env.failWrite = 'Ranked'; assert.match(kit.Workspace.edit(payload).warning, /was saved/);
  assert.equal(kit.Workspace.edit(payload).warning, '');
  assert.equal(kit.Workspace.snapshot().demo, true);
  assert.equal(JSON.stringify(kit.Book.read('Backlog', kit.Backlog.HEADERS)), before);
  assert.equal(kit.Workspace.snapshot().processes[0].owner, 'Demo owner');
});

test('guided edits never replace spreadsheet formulas or transfer oversized source cells', () => {
  const kit = ready(), item = added(kit), payload = { requestId: id(5), ref: item.ref, input: { ...input(), owner: 'Changed' }, status: 'Planned' };
  const sh = kit.env.ss.sheets.get('Backlog'), before = JSON.stringify(sh.data);
  sh.formulas.set('2:4', '=5');
  assert.throws(() => kit.Workspace.process({ requestId: id(5), ref: item.ref }), /uses spreadsheet formulas/);
  assert.throws(() => kit.Workspace.edit(payload), /uses spreadsheet formulas/);
  assert.equal(JSON.stringify(sh.data), before); assert.equal(sh.formulas.get('2:4'), '=5');
  sh.formulas.clear();
  for (const length of [1999, 2000, 2001]) {
    sh.data[1][15] = 'x'.repeat(length);
    const ref = kit.Workspace.snapshot().processes[0].ref;
    const read = () => kit.Workspace.process({ requestId: id(5), ref });
    if (length <= 2000) assert.doesNotThrow(read); else assert.throws(read, /longer than 2,000/);
  }
});
