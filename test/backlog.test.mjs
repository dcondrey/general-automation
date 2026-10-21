import test from 'node:test';
import assert from 'node:assert/strict';
import { load, plain } from './load.mjs';

const { Backlog: B, Book, Demo, WEEKLY_WORK_HOURS } = load();
const base = overrides => ({ ...B.item(Demo.rows()[1], 2), ...overrides });

test('team effort includes error rework once, and payback uses net weekly savings', () => {
  const r = B.score(base({ 'Runs/week': 10, 'Minutes/run': 30, 'People/run': 2, 'Error rate %': 20, 'Rework min/error': 15, 'Automatable %': 50, 'Build hours': 8, 'Upkeep min/week': 30 }));
  assert.equal(r.hours, 10.5);
  assert.equal(r.saved, 4.75);
  assert.equal(r.payback, 8 / 4.75);
  assert.equal(r.annual, 4.75 * 48 * 45);
  assert.equal(WEEKLY_WORK_HOURS(10, 30, 2, 20, 15), 10.5);
});

test('unnecessary work gets the full benefit with explicit deletion effort', () => {
  const r = B.score(base({ 'Needed?': 'No', 'Redesign first?': 'Unsure', 'Automatable %': 0, 'Build hours': '' }));
  assert.equal(r.action, 'Delete');
  assert.equal(r.saved, r.hours);
  assert.equal(r.build, 0.5);
  assert.match(r.assumptions, /assumed/);
});

test('uncertain purpose or redesign excludes estimated savings rather than inventing confidence', () => {
  for (const changes of [{ 'Needed?': 'Unsure' }, { 'Redesign first?': 'Unsure' }]) {
    const r = B.score(base(changes));
    assert.equal(r.action, 'Investigate');
    assert.equal(r.saved, null);
    assert.equal(r.payback, null);
    assert.equal(r.annual, null);
  }
});

test('zero and upkeep at or beyond gross benefit recommend keeping work manual', () => {
  for (const upkeep of [59, 60, 61]) {
    const r = B.score(base({ 'Runs/week': 1, 'Minutes/run': 60, 'People/run': 1, 'Error rate %': 0, 'Automatable %': 100, 'Upkeep min/week': upkeep }));
    assert.equal(r.action, upkeep < 60 ? 'Automate' : 'Keep manual');
    assert.ok(r.saved >= 0);
  }
  assert.equal(B.score(base({ 'Automatable %': 0 })).payback, null);
  assert.equal(B.score(base({ 'Runs/week': 0 })).saved, 0);
});

test('blank optional estimates are disclosed; explicit zero is retained', () => {
  const r = B.score(base({ 'Build hours': '', 'Automatable %': '', 'People/run': '', 'Error rate %': '', 'Rework min/error': '' }));
  assert.equal(r.build, 8);
  assert.match(r.assumptions, /80%/);
  assert.equal(r.hours, 3.75);
  assert.equal(B.score(base({ 'Automatable %': 0 })).saved, 0);
});

test('invalid numeric types, formats and nonfinite values fail visibly', () => {
  for (const value of [true, false, NaN, Infinity, '1e3', '10%', '1,000', '-1', {}, [], '  ']) {
    assert.throws(() => B.score(base({ 'Runs/week': value })), /Runs\/week/);
  }
});

test('percentage boundaries: limit minus one, limit, limit plus one', () => {
  for (const key of ['Automatable %', 'Error rate %']) {
    for (const value of [99, 100]) assert.doesNotThrow(() => B.score(base({ [key]: value })));
    for (const value of [-1, 101]) assert.throws(() => B.score(base({ [key]: value })), /between/);
  }
});

test('numeric upper bounds and text length bounds are enforced', () => {
  for (const [field, limit] of [['Runs/week', 100000], ['Minutes/run', 10080], ['People/run', 10000], ['Build hours', 100000], ['Upkeep min/week', 10080]]) {
    for (const value of [limit - 1, limit]) assert.doesNotThrow(() => B.score(base({ [field]: value })));
    assert.throws(() => B.score(base({ [field]: limit + 1 })), /between/);
  }
  for (const len of [159, 160]) assert.doesNotThrow(() => B.score(base({ Process: 'a'.repeat(len) })));
  assert.throws(() => B.score(base({ Process: 'a'.repeat(161) })), /160/);
  assert.throws(() => B.score(base({ 'Build hours': 0 })), /between/);
});

test('strict choices reject misspellings and ambiguous booleans', () => {
  for (const value of ['Y', 'yes', '', true, 'Never']) assert.throws(() => B.score(base({ 'Needed?': value })), /Choose/);
});

test('measurements require a live process and a real nonfuture date; unmeasured differs from zero', () => {
  assert.equal(B.score(base({})).measured, null);
  assert.equal(B.score(base({ Status: 'Live', 'Measured hours/week saved': 0, 'Measured on': '2026-01-15' })).measured, 0);
  for (const date of ['', '2026-02-30', '2026-13-01', '01/15/2026', '2999-01-01']) {
    assert.throws(() => B.score(base({ Status: 'Live', 'Measured hours/week saved': 1, 'Measured on': date })), /valid Measured on/);
  }
  assert.throws(() => B.score(base({ 'Measured hours/week saved': 1, 'Measured on': '2026-01-15' })), /Live/);
  assert.throws(() => B.score(base({ Status: 'Live', 'Measured hours/week saved': 999, 'Measured on': '2026-01-15' })), /between/);
  assert.throws(() => B.score(base({ 'Measured on': '2026-01-15' })), /clear Measured on/);
  const summary = B.summarize([B.score(base({}))]);
  assert.equal(summary.measured, null);
});

test('cross-team overlap groups withhold every colliding row from impact totals', () => {
  const rows = Demo.rows().slice(0, 3);
  rows[0][17] = ' Client Reporting ';
  rows[1][17] = 'client reporting';
  const result = B.evaluate(rows, {}, 'Backlog');
  assert.equal(result.ranked.length, 1);
  assert.equal(result.issues.length, 2);
  assert.match(result.issues[0][3], /prevent counting hours twice/);
  assert.equal(result.ranked[0].item.row, 4);
});

test('row failures are isolated, source row numbers survive blanks, duplicate IDs do not inflate impact', () => {
  const rows = [Demo.rows()[0], [], Demo.rows()[0], Demo.rows()[1]];
  rows[3][3] = 'not a number';
  const result = B.evaluate(rows, {}, 'Backlog');
  assert.equal(result.ranked.length, 1);
  assert.deepEqual(plain(result.issues.map(r => r[1])), [4, 5]);
  assert.match(result.issues[0][3], /duplicated/);
});

test('a full-size overlap group produces bounded operator messages', () => {
  const rows = Array.from({ length: 2000 }, (_, i) => { const row = Demo.rows()[0]; row[17] = 'same work'; row[18] = 'row-' + i; return row; });
  const result = B.evaluate(rows, {}, 'Backlog');
  assert.equal(result.ranked.length, 0);
  assert.equal(result.issues.length, 2000);
  assert.ok(result.issues.every(row => row[3].length < 500));
});

test('demo has each decision type and proposed next steps exclude live and paused work', () => {
  const result = B.evaluate(Demo.rows(), {}, 'Demo backlog');
  assert.deepEqual(plain(result.issues), []);
  assert.equal(result.ranked[0].action, 'Delete');
  assert.deepEqual(new Set(result.ranked.map(r => r.action)), new Set(['Delete', 'Automate', 'Redesign first', 'Keep manual', 'Investigate']));
  assert.ok(B.summarize(result.ranked).top.every(r => r.status !== 'Live' && r.status !== 'Paused'));
});

test('spreadsheet writes escape formula-like text, including whitespace and control prefixes', () => {
  for (const input of ['=IMPORTXML("https://example.invalid")', '+123', '-cmd', '@SUM(A1)', '  =1+1', '\t=1+1', '\n=1+1']) assert.equal(Book.safeCell(input), "'" + input);
  assert.equal(Book.safeCell('Process = normal text'), 'Process = normal text');
  assert.equal(Book.safeCell(-3), -3);
  assert.equal(Book.safeCell(null), '');
  for (const n of [1999, 2000]) assert.doesNotThrow(() => Book.safeCell('a'.repeat(n)));
  assert.throws(() => Book.safeCell('a'.repeat(2001)), /2,000/);
});
