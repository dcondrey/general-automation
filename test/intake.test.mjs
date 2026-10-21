import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';
const { Intake, Demo } = load();
const answer = (title, value) => ({ getItem: () => ({ getTitle: () => title }), getResponse: () => value });
const response = (id, answers = [answer('Process', 'Check stock')]) => ({ getId: () => id, getItemResponses: () => answers });

test('imports are idempotent, including duplicate IDs in one snapshot and a retry after a write', () => {
  const rows = Intake.plan([response('a'), response('a'), response('b')], []);
  assert.equal(rows.length, 2);
  assert.equal(rows[0][18], 'form:a');
  assert.equal(rows[0][12], 'Planned');
  assert.equal(Intake.plan([response('a'), response('b')], rows).length, 0);
});

test('import count is checked before any write at 1999, 2000 and 2001 rows', () => {
  const existing = Array.from({ length: 1999 }, (_, i) => { const row = Demo.rows()[0]; row[18] = 'old-' + i; return row; });
  assert.equal(Intake.plan([], existing).length, 0);
  assert.equal(Intake.plan([response('a')], existing).length, 1);
  assert.throws(() => Intake.plan([response('a'), response('b')], existing), /2,000/);
});

test('malformed responses, question drift, duplicate answers and excessive data are rejected', () => {
  for (const value of ['', null, 'x'.repeat(181)]) assert.throws(() => Intake.plan([response(value)], []), /identifier/);
  assert.throws(() => Intake.plan([response('a', [answer('Surprise', 'x')])], []), /unexpected questions/);
  assert.throws(() => Intake.plan([response('a', [answer('Process', 'x'), answer('Process', 'y')])], []), /unexpected questions/);
  for (const value of [['x'], {}, 'x'.repeat(1001)]) assert.throws(() => Intake.plan([response('a', [answer('Notes', value)])], []), /oversized/);
});
