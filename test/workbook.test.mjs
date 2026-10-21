import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';
import { googleFake } from './google-fake.mjs';

function ready() {
  const env = googleFake();
  const kit = load(env.services);
  kit.Template.setup();
  return { env, ...kit };
}
function live(env) { env.settings('Data source', 'My backlog'); env.settings('Create Google files', 'Yes'); }

test('repeatable setup preserves manual inputs, settings and one dashboard chart', () => {
  const { env, Template, Book, Backlog, Demo } = ready();
  Book.append('Backlog', Backlog.HEADERS, [Demo.rows()[1]]);
  env.settings('Hourly cost', 72);
  Template.setup();
  assert.equal(Book.read('Backlog', Backlog.HEADERS).length, 1);
  assert.equal(Book.read('Demo backlog', Backlog.HEADERS).length, 6);
  assert.equal(Book.read('Settings', ['Setting', 'Value', 'What this means']).find(r => r[0] === 'Hourly cost')[1], 72);
  assert.equal(env.ss.sheets.get('Dashboard').charts.length, 1);
  assert.equal(env.forms.size, 0);
  assert.equal(env.docs.size, 0);
});

test('preview mode forbids Form and Doc creation; demo and live never share an input source', () => {
  const { env, Intake, Report, Template } = ready();
  assert.throws(Intake.create, /Preview mode/);
  assert.throws(Report.create, /Preview mode/);
  env.settings('Create Google files', 'Yes');
  assert.throws(Intake.create, /My backlog/);
  env.settings('Data source', 'My backlog');
  assert.equal(Template.refresh(false).ranked.length, 0);
  assert.equal(env.forms.size, 0);
});

test('copied workbook never opens or updates the original Form or report', () => {
  const { env, Intake, Report, Book, Backlog, Demo } = ready();
  live(env);
  Book.append('Backlog', Backlog.HEADERS, [Demo.rows()[1]]);
  Intake.create(); Report.create();
  assert.equal(Book.state('formId'), 'form1');
  assert.equal(Book.state('reportId'), 'doc1');
  env.ss.id = 'copied';
  assert.equal(Book.state('formId'), null);
  assert.equal(Book.state('reportId'), null);
  Intake.create(); Report.create();
  assert.equal(Book.state('formId'), 'form2');
  assert.equal(Book.state('reportId'), 'doc2');
  assert.equal(env.forms.size, 2);
  assert.equal(env.docs.size, 2);
});

test('partial Form setup resumes in the same unpublished Form without duplicate questions', () => {
  const { env, Intake, Book } = ready();
  live(env);
  env.failQuestion = 'Minutes/run';
  assert.throws(Intake.create, /Injected/);
  assert.equal(Book.state('formId'), 'form1');
  assert.equal(Book.state('formReady'), null);
  Intake.create(); Intake.create();
  assert.equal(env.forms.size, 1);
  assert.equal(env.forms.get('form1').published, false);
  assert.equal(env.forms.get('form1').items.length, Intake.FIELDS.length);
  assert.equal(Book.state('formReady'), 'yes');
});

test('missing or changed Google resources stop instead of silently generating replacements', () => {
  const { env, Intake, Report, Book, Backlog, Demo } = ready();
  live(env);
  Book.append('Backlog', Backlog.HEADERS, [Demo.rows()[1]]);
  Intake.create();
  env.forms.get('form1').items[0].title = 'Changed';
  assert.throws(Intake.sync, /questions changed/);
  env.forms.clear();
  assert.throws(Intake.create, /unavailable/);
  Book.state('formId', '');
  Report.create();
  env.docs.clear();
  assert.throws(Report.create, /unavailable/);
});

test('ranking errors identify source rows, and a corrected row returns on the next run', () => {
  const { env, Book, Backlog, Demo, Template, Report } = ready();
  live(env);
  const row = Demo.rows()[1]; row[3] = 'oops';
  Book.append('Backlog', Backlog.HEADERS, [row]);
  const bad = Template.refresh(false);
  assert.equal(bad.issues.length, 1);
  assert.equal(bad.issues[0][1], 2);
  assert.throws(Report.create, /Fix the rows/);
  Book.open().getSheetByName('Backlog').getRange(2, 4).setValues([[5]]);
  assert.equal(Template.refresh(false).ranked.length, 1);
  assert.equal(Book.read('Issues', Backlog.ISSUES).length, 0);
});

test('failed derived write leaves source data intact, and a retry repairs the output', () => {
  const { env, Template, Book, Backlog } = ready();
  const before = JSON.stringify(Book.read('Demo backlog', Backlog.HEADERS));
  env.failWrite = 'Ranked';
  assert.throws(() => Book.locked(() => Template.refresh(false)), /Injected/);
  assert.equal(env.held, false);
  assert.equal(JSON.stringify(Book.read('Demo backlog', Backlog.HEADERS)), before);
  assert.equal(Template.refresh(false).ranked.length, 6);
});

test('locks prevent concurrent mutation and always release on errors', () => {
  const { env, Book } = ready();
  assert.throws(() => Book.locked(() => { throw new Error('stop'); }), /stop/);
  assert.equal(env.held, false);
  env.held = true;
  assert.throws(() => Book.locked(() => assert.fail('must not mutate')), /Another automation/);
  env.held = false;
});

test('changed headings halt without erasing operator rows', () => {
  const { env, Book, Backlog, Demo, Template } = ready();
  Book.append('Backlog', Backlog.HEADERS, [Demo.rows()[0]]);
  const sh = env.ss.sheets.get('Backlog');
  sh.data[0][0] = 'Renamed';
  assert.throws(Template.setup, /column headings/);
  assert.equal(sh.data[1][1], Demo.rows()[0][1]);
});

test('report is reused, current data is rendered, and formula-like input stays literal', () => {
  const { env, Book, Backlog, Demo, Report } = ready();
  live(env);
  const row = Demo.rows()[1]; row[1] = '=HYPERLINK("https://example.invalid")';
  Book.append('Backlog', Backlog.HEADERS, [row]);
  Report.create(); Report.create();
  assert.equal(env.docs.size, 1);
  assert.ok(env.docs.get('doc1').getBody().paragraphs.some(p => p.includes('=HYPERLINK')));
});

test('Settings validation rejects missing, duplicate and out-of-range settings', () => {
  for (const change of [env => env.settings('Hourly cost', -1), env => env.settings('Working weeks/year', 53), env => env.ss.sheets.get('Settings').data.push(['Hourly cost', 45, 'duplicate'])]) {
    const { env, Settings } = ready(); change(env); assert.throws(Settings.read);
  }
});

test('operators see actionable validation errors while raw service failures are withheld', () => {
  const { env, rankBacklog } = ready();
  env.settings('Hourly cost', -1);
  assert.match(rankBacklog().error, /Hourly cost.*between/);
  env.settings('Hourly cost', 45);
  env.failWrite = 'Ranked';
  const failure = rankBacklog().error;
  assert.match(failure, /could not finish/);
  assert.doesNotMatch(failure, /Injected/);
});

test('default view contains four useful tabs and keeps calculations and sample inputs out of the way', () => {
  const { env } = ready();
  assert.deepEqual([...env.ss.sheets.values()].filter(s => !s.hidden).map(s => s.name).sort(), ['Backlog', 'Priorities', 'Settings', 'Start here']);
  assert.deepEqual([...env.ss.sheets.keys()].slice(0, 4), ['Start here', 'Priorities', 'Backlog', 'Settings']);
  const home = env.ss.sheets.get('Start here');
  assert.equal(home.data[0][0], 'Find your next three time savers');
  assert.match(home.data[2][0], /DEMO/);
  assert.equal(home.data[7][2], '14.0 h/week');
  assert.equal(env.ss.sheets.get('Priorities').getLastRow(), 6);
  assert.ok(!env.ss.sheets.get('Priorities').data.some(row => row[1] === 'Assemble weekly client reports'));
  assert.ok(env.ss.sheets.get('Backlog').hiddenColumns.has(19));
  assert.ok(!env.ss.sheets.get('Backlog').hiddenColumns.has(9));
});

test('own-data and demo actions preserve both datasets and never enable file creation', () => {
  const { env, useOwnBacklog, useDemoBacklog, Book, Backlog, Demo } = ready();
  Book.append('Backlog', Backlog.HEADERS, [Demo.rows()[1]]);
  useOwnBacklog();
  assert.match(env.ss.sheets.get('Start here').data[2][0], /YOUR WORK/);
  assert.equal(Book.read('Priorities', ['Rank', 'Opportunity', 'Next step', 'Potential hours/week', 'Effort hours', 'Owner']).length, 1);
  useDemoBacklog();
  assert.equal(Book.read('Backlog', Backlog.HEADERS).length, 1);
  assert.equal(Book.read('Demo backlog', Backlog.HEADERS).length, 6);
  assert.equal(env.forms.size, 0); assert.equal(env.docs.size, 0);
});

test('detailed view is reversible and row errors surface an actionable Issues tab', () => {
  const { env, showDiscoveryDetails, hideDiscoveryDetails, Template } = ready();
  showDiscoveryDetails(); assert.equal(env.ss.sheets.get('Ranked').hidden, false); assert.equal(env.ss.sheets.get('Backlog').hiddenColumns.size, 0);
  hideDiscoveryDetails(); assert.equal(env.ss.sheets.get('Ranked').hidden, true);
  env.ss.sheets.get('Demo backlog').data[1][3] = 'invalid';
  Template.refresh(false); assert.equal(env.ss.sheets.get('Issues').hidden, false);
  assert.match(env.ss.sheets.get('Start here').data[26][0], /1 rows need attention/);
});

test('upgrading an existing workbook preserves inputs, observations and Google resource identity', () => {
  const { env, DiscoveryHome, Book, Backlog, Demo } = ready();
  Book.append('Backlog', Backlog.HEADERS, [Demo.rows()[3]]);
  Book.state('layoutVersion', 'old'); Book.state('formId', 'keep-form'); Book.state('reportId', 'keep-doc');
  const before = JSON.stringify(Book.read('Backlog', Backlog.HEADERS));
  DiscoveryHome.upgrade();
  assert.equal(JSON.stringify(Book.read('Backlog', Backlog.HEADERS)), before);
  assert.equal(Book.state('formId'), 'keep-form'); assert.equal(Book.state('reportId'), 'keep-doc');
  assert.equal(Book.state('layoutVersion'), DiscoveryHome.VERSION);
  assert.equal(env.ss.sheets.get('Start here').data[32][0], 'Open intake Form editor →');
  assert.equal(env.ss.sheets.get('Start here').data[32][4], 'Open discovery report →');
});
