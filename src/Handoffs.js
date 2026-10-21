const Handoffs = {
  INPUT: ['Handoff key', 'Source Asana task ID', 'Ready? (Yes/No)', 'Next team', 'Task name', 'Project ID', 'Assignee ID', 'Due on', 'SKU', 'ASIN', 'Asset URL', 'Brief'],
  LEDGER: ['Handoff key', 'Fingerprint', 'State', 'Asana task ID', 'Started', 'What to do'],
  defaults: [['Mode', 'Demo', 'Demo validates fictional rows without contacting Asana. Live requires your Asana token.']],
  samples: [['demo-handoff-1', '', 'Yes', 'Catalog', 'Prepare updated product listing', '123456789', '', '', 'DEMO-PET', 'B000000001', 'https://example.com/demo-assets', 'Fictional package dimensions are ready.']],
  gid(v, name, optional) {
    if (optional && v === '') return '';
    if (typeof v !== 'string' || !/^\d{1,40}$/.test(v)) throw new OperatorError(name + ' must be a numeric ID stored as plain text, not a rounded spreadsheet number.');
    return v;
  },
  plan(row) {
    const key = Suite.text(row[0], 'Handoff key', 100);
    if (!/^[A-Za-z0-9_.:-]+$/.test(key)) throw new OperatorError('Handoff key may contain letters, digits, underscores, periods, colons, and hyphens.');
    const source = Handoffs.gid(row[1], 'Source task ID', true);
    if (!['Yes', 'No'].includes(row[2])) throw new OperatorError('Ready? must be Yes or No.');
    const team = Suite.text(row[3], 'Next team', 80), name = Suite.text(row[4], 'Task name', 160), project = Handoffs.gid(row[5], 'Project ID'), assignee = Handoffs.gid(row[6], 'Assignee ID', true);
    const due = row[7] === '' ? '' : Suite.date(row[7], 'Due on').toISOString().slice(0, 10);
    const sku = Suite.text(row[8], 'SKU', 64), asin = Suite.text(row[9], 'ASIN', 10), asset = Suite.text(row[10], 'Asset URL', 500), brief = Suite.text(row[11], 'Brief', 1000);
    if (!/^[A-Z0-9]{10}$/.test(asin)) throw new OperatorError('ASIN must contain exactly 10 uppercase letters or digits.');
    if (!/^https:\/\/[^\s/]+\//.test(asset)) throw new OperatorError('Asset URL must be a complete HTTPS link.');
    const notes = 'Automation handoff key: ' + key + '\nNext team: ' + team + '\nSKU: ' + sku + '\nASIN: ' + asin + '\nAssets: ' + asset + '\n\n' + brief;
    const payload = { data: { name, notes, projects: [project] } };
    if (assignee) payload.data['assignee'] = assignee;
    if (due) payload.data['due_on'] = due;
    return { key, source, ready: row[2] === 'Yes', project, payload };
  },
  setup() {
    Suite.settings(Handoffs.defaults);
    Suite.table('Handoffs', Handoffs.INPUT);
    Suite.table('Demo handoffs', Handoffs.INPUT, Handoffs.samples);
    Suite.table('Handoff ledger', Handoffs.LEDGER);
    Suite.table('Preview', ['Handoff key', 'Decision', 'Task name', 'Inputs and next action']);
    [1, 2, 6, 7].forEach(c => Book.open().getSheetByName('Handoffs').getRange(2, c, Book.MAX_ROWS, 1).setNumberFormat('@'));
    Book.open().getSheetByName('Handoffs').getRange(2, 3, Book.MAX_ROWS, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Yes', 'No'], true).setAllowInvalid(false).build());
    Suite.help('Team Handoffs', [['1. Try demo', 'Run handoffs validates the fictional handoff and fills Preview. Demo never calls Asana.'], ['2. Define a handoff', 'Complete one Handoffs row, including key, destination project, owner inputs, SKU, ASIN, assets, and brief. Project/task/assignee IDs are plain text.'], ['3. Gate the transfer', 'Ready? must be Yes. If a source Asana task ID is present, the task must also be complete in Asana.'], ['4. Run live', 'Save an Asana personal token in Connections, choose Live, and Run handoffs. At most five new destination tasks are created per run.'], ['5. Recover safely', 'A started request is recorded as Unknown before sending. Unknown never retries automatically. Reconcile checks the destination project for the exact handoff marker.'], ['6. Change a task', 'A completed handoff key is immutable. Edit the existing Asana task deliberately or create a new unique handoff key for a genuinely new transfer.']]);
    return Suite.options().Mode === 'Demo' ? Handoffs.run() : { summary: 'Setup is ready. Choose Run handoffs explicitly when ready to create destination tasks.' };
  },
  run() {
    const demo = Suite.options().Mode === 'Demo';
    const plans = Book.read(demo ? 'Demo handoffs' : 'Handoffs', Handoffs.INPUT).map(Handoffs.plan);
    if (new Set(plans.map(p => p.key)).size !== plans.length) throw new OperatorError('Each handoff key must be unique.');
    const ledger = Book.read('Handoff ledger', Handoffs.LEDGER), byKey = new Map();
    ledger.forEach(r => { if (byKey.has(r[0])) throw new OperatorError('Handoff ledger contains a duplicate key. Restore one ledger row per handoff.'); byKey.set(r[0], r); });
    const previews = [], token = demo ? '' : Connections.get('Asana token');
    let created = 0;
    for (const plan of plans) {
      const fingerprint = Suite.hash(JSON.stringify([plan.source, plan.payload]));
      const prior = byKey.get(plan.key);
      if (prior) {
        previews.push([plan.key, prior[1] !== fingerprint ? 'Changed after send — review' : prior[2], plan.payload.data.name, prior[1] !== fingerprint ? 'The same key has different inputs. Edit the existing Asana task or use a new key for new work.' : prior[5]]);
        continue;
      }
      if (!plan.ready) { previews.push([plan.key, 'Waiting', plan.payload.data.name, 'Ready? is No.']); continue; }
      if (demo) { previews.push([plan.key, 'Would create', plan.payload.data.name, plan.payload.data.notes]); continue; }
      if (created >= 5) { previews.push([plan.key, 'Next run', plan.payload.data.name, 'Five new tasks per run limit.']); continue; }
      const headers = { Authorization: 'Bearer ' + token };
      if (plan.source) {
        const source = Transport.json('https://app.asana.com/api/1.0/tasks/' + plan.source + '?opt_fields=completed', 'get', undefined, headers, true);
        if (source.data?.completed !== true) { previews.push([plan.key, 'Waiting', plan.payload.data.name, 'Source Asana task is not confirmed complete.']); continue; }
      }
      const row = [plan.key, fingerprint, 'Unknown', '', new Date(), 'Check destination before retrying; use Reconcile unknown handoffs.'];
      Book.append('Handoff ledger', Handoffs.LEDGER, [row]); ledger.push(row); byKey.set(plan.key, row);
      const response = Transport.json('https://app.asana.com/api/1.0/tasks', 'post', plan.payload, headers);
      const id = Handoffs.gid(response.data?.gid, 'Created task ID');
      row[2] = 'Created'; row[3] = id; row[5] = 'https://app.asana.com/0/' + plan.project + '/' + id;
      Book.replace('Handoff ledger', Handoffs.LEDGER, ledger);
      previews.push([plan.key, 'Created', plan.payload.data.name, row[5]]); created++;
    }
    Book.replace('Preview', ['Handoff key', 'Decision', 'Task name', 'Inputs and next action'], previews);
    return { summary: (demo ? 'DEMO: ' : '') + previews.length + ' handoffs checked; ' + created + ' tasks created. Unknown writes remain held for reconciliation.' };
  },
  reconcile() {
    if (Suite.options().Mode !== 'Live') throw new OperatorError('Reconciliation runs only in Live mode.');
    const plans = Book.read('Handoffs', Handoffs.INPUT).map(Handoffs.plan), ledger = Book.read('Handoff ledger', Handoffs.LEDGER);
    const headers = { Authorization: 'Bearer ' + Connections.get('Asana token') };
    for (const row of ledger.filter(r => r[2] === 'Unknown')) {
      const plan = plans.find(p => p.key === row[0]);
      if (!plan) continue;
      if (Suite.hash(JSON.stringify([plan.source, plan.payload])) !== row[1]) { row[5] = 'Inputs changed after an uncertain send. Restore the original inputs before reconciliation; write remains held.'; continue; }
      let url = 'https://app.asana.com/api/1.0/projects/' + plan.project + '/tasks?limit=100&opt_fields=gid,notes', matches = [], complete = false;
      for (let page = 0; page < 10; page++) {
        const response = Transport.json(url, 'get', undefined, headers, true);
        if (!Array.isArray(response.data)) throw new OperatorError('Asana returned an invalid task list. Reconciliation stopped without releasing the held write.');
        matches = matches.concat(response.data.filter(t => typeof t.notes === 'string' && t.notes.split('\n').includes('Automation handoff key: ' + plan.key)));
        const offset = response.next_page?.offset;
        if (!offset) { complete = true; break; }
        if (typeof offset !== 'string' || offset.length > 500) throw new OperatorError('Asana returned an invalid pagination cursor.');
        url = 'https://app.asana.com/api/1.0/projects/' + plan.project + '/tasks?limit=100&opt_fields=gid,notes&offset=' + encodeURIComponent(offset);
      }
      if (matches.length === 1 && complete) { row[2] = 'Reconciled'; row[3] = Handoffs.gid(matches[0].gid, 'Reconciled task ID'); row[5] = 'https://app.asana.com/0/' + plan.project + '/' + row[3]; }
      else row[5] = !complete ? 'Search exceeded 1,000 tasks. Inspect the destination manually; write remains held.' : matches.length > 1 ? 'Multiple matching tasks. Resolve duplicates manually; write remains held.' : 'No matching task found. Confirm eventual visibility and permissions manually before deciding whether a new transfer is needed.';
    }
    Book.replace('Handoff ledger', Handoffs.LEDGER, ledger);
    return { summary: 'Unknown handoffs checked. No task was created or automatically released for retry.' };
  },
  menu() { SpreadsheetApp.getUi().createMenu('Automations').addItem('Set up workbook', 'handoffSetup').addItem('Run handoffs', 'handoffRun').addItem('Reconcile unknown handoffs', 'handoffReconcile').addItem('Connections', 'showConnections').addToUi(); },
};
function handoffSetup() { return operatorAction_('Set up Team Handoffs', Handoffs.setup); }
function handoffRun() { return operatorAction_('Run handoffs', Handoffs.run); }
function handoffReconcile() { return operatorAction_('Reconcile handoffs', Handoffs.reconcile); }
