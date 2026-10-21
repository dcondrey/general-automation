const Workspace = {
  PLANS: ['Process', 'Owner', 'Due date', 'Next step', 'Source', 'Source ID', 'Updated', 'Request ID', 'Request hash'],
  HISTORY: ['Recorded', 'Source', 'Source ID', 'Process', 'Measured on', 'Hours saved/week', 'Evidence', 'Request ID', 'Request hash', 'Before hash', 'After hash', 'State', 'Request ref'],

  object(value, keys) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !keys.includes(k))) throw new OperatorError('This request is incomplete. Refresh the workspace and try again.');
    return value;
  },

  requestId(value) {
    if (typeof value !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value)) throw new OperatorError('Refresh the workspace before saving.');
    return value;
  },

  rowHash(row) {
    return Book.hash(JSON.stringify(row.map((value, i) => i === 14 && value instanceof Date ? Workspace.day(value) : value)));
  },

  reference(ref) {
    Workspace.object(ref, ['source', 'row', 'id', 'revision']);
    Backlog.choice(ref.source, 'Process source', ['Backlog', 'Demo backlog']);
    if (!Number.isInteger(ref.row) || ref.row < 2 || ref.row > Book.MAX_ROWS + 1 || typeof ref.id !== 'string' || ref.id.length > 200 || typeof ref.revision !== 'string' || !/^[a-f0-9]{64}$/.test(ref.revision)) throw new OperatorError('Refresh the workspace and select the process again.');
    return ref;
  },

  day(value, optional) {
    if (optional && value === '') return '';
    if (value instanceof Date && Number.isFinite(value.getTime())) value = Utilities.formatDate(value, Book.open().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new OperatorError('Choose a valid date in YYYY-MM-DD format.');
    const date = new Date(value + 'T12:00:00Z');
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new OperatorError('Choose a real calendar date.');
    return value;
  },

  table(name, headers) {
    const sh = Book.sheet(name, headers);
    sh.setFrozenRows(1);
    sh.setHiddenGridlines(true);
    sh.getRange(1, 1, 1, headers.length).setBackground('#15213d').setFontColor('#ffffff').setFontWeight('bold').setWrap(true);
    sh.setRowHeight(1, 42);
    sh.setColumnWidths(1, headers.length, 150);
    sh.setColumnWidth(name === 'Action plan' ? 1 : 4, 320);
    sh.hideSheet();
    return sh;
  },

  plans() {
    if (!Book.open().getSheetByName('Action plan')) return [];
    const rows = Book.read('Action plan', Workspace.PLANS), keys = new Set(), requests = new Set();
    rows.forEach(row => {
      const key = JSON.stringify([row[4], row[5]]);
      if (!['Backlog', 'Demo backlog'].includes(row[4]) || !row[5] || keys.has(key)) throw new OperatorError('Action plan contains a missing or duplicate process identity. Ask the workbook owner to restore its Source and Source ID columns.');
      keys.add(key);
      Backlog.text(row[0], 'Process in Action plan', 160);
      Backlog.text(row[1], 'Owner in Action plan', 100);
      Backlog.text(row[5], 'Source ID in Action plan', 200);
      Workspace.requestId(row[7]);
      if (requests.has(row[7]) || typeof row[8] !== 'string' || !/^[a-f0-9]{64}$/.test(row[8])) throw new OperatorError('Action plan has a duplicate request or changed request hash. Ask the workbook owner to restore those columns.');
      requests.add(row[7]);
      Workspace.day(row[2], true);
      Backlog.text(row[3], 'Next step in Action plan', 500);
    });
    return rows;
  },

  history() {
    if (!Book.open().getSheetByName('Savings history')) return [];
    const rows = Book.read('Savings history', Workspace.HISTORY), ids = new Set();
    rows.forEach(row => {
      Workspace.requestId(row[7]);
      Backlog.choice(row[1], 'Source in Savings history', ['Backlog', 'Demo backlog']);
      Backlog.text(row[2], 'Source ID in Savings history', 200);
      Backlog.text(row[3], 'Process in Savings history', 160);
      Backlog.text(row[6], 'Evidence in Savings history', 1000);
      Backlog.number(row[5], 'Hours saved/week in Savings history', 0, Number.MAX_SAFE_INTEGER);
      Workspace.day(row[4]);
      Backlog.text(row[12], 'Request ref in Savings history', 1000);
      if ([8, 9, 10].some(i => typeof row[i] !== 'string' || !/^[a-f0-9]{64}$/.test(row[i]))) throw new OperatorError('Savings history has a changed request or source hash. Ask the workbook owner to restore it before retrying.');
      if (ids.has(row[7]) || !['Done', 'Pending'].includes(row[11])) throw new OperatorError('Savings history has a duplicate request or changed state. Ask the workbook owner to restore it before recording another result.');
      ids.add(row[7]);
    });
    return rows;
  },

  ref(source, row, index) {
    return { source, row: index + 2, id: String(row[18] || ''), revision: Workspace.rowHash(row) };
  },

  locate(ref, requestId) {
    Workspace.reference(ref);
    const rows = Book.read(ref.source, Backlog.HEADERS), id = ref.id || 'manual:' + Workspace.requestId(requestId);
    const matches = rows.map((r, i) => r[18] === id ? i : -1).filter(i => i >= 0);
    if (matches.length > 1) throw new OperatorError('This process has a duplicate Source ID. Fix the duplicate before continuing.');
    const index = matches.length ? matches[0] : ref.id ? -1 : ref.row - 2;
    if (index < 0 || !rows[index] || (!ref.id && !matches.length && rows[index][18])) throw new OperatorError('This process moved or was removed. Refresh the workspace before saving.');
    const row = rows[index].slice(), original = row.slice();
    if (!ref.id) original[18] = '';
    row[18] = id;
    return { source: ref.source, index, row, id, revision: Workspace.rowHash(original) };
  },

  resolve(ref, requestId) {
    const target = Workspace.locate(ref, requestId);
    if (target.revision !== ref.revision) throw new OperatorError('This process changed since you opened it. Refresh the workspace and review the new values before saving.');
    return target;
  },

  identify(target) {
    Book.put(Book.open().getSheetByName(target.source).getRange(target.index + 2, 19), [[target.id]]);
  },

  reason(item) {
    const reasons = {
      Delete: 'The output is marked unnecessary. Confirm that with its owner, then retire the duplicate work.',
      'Redesign first': 'Simplify the steps and required inputs before deciding what to automate.',
      Automate: 'The output is needed and the estimated removable work exceeds ongoing upkeep.',
      'Keep manual': 'The supplied estimates do not support a positive net saving. Keep the judgment with a person.',
      Investigate: 'The purpose or process design is unclear. Resolve that before claiming savings.',
    };
    return reasons[item.action];
  },

  snapshot() {
    const opts = Settings.read(), source = opts.source === 'Demo' ? 'Demo backlog' : 'Backlog';
    const rows = Book.read(source, Backlog.HEADERS), result = Backlog.evaluate(rows, opts, source), summary = Backlog.summarize(result.ranked);
    const plans = Workspace.plans(), history = Workspace.history(), departments = new Map();
    const items = result.ranked.map(r => {
      const ref = Workspace.ref(source, rows[r.item.row - 2], r.item.row - 2);
      const plan = plans.find(p => p[4] === source && p[5] === ref.id);
      const dept = departments.get(r.department) || { name: r.department, count: 0, baseline: 0, potential: 0 };
      dept.count++; dept.baseline += r.hours;
      if (!['Live', 'Paused'].includes(r.status)) dept.potential += r.saved || 0;
      departments.set(r.department, dept);
      return { ref, process: r.process, department: r.department, owner: r.owner, status: r.status, action: r.action, baseline: r.hours, potential: r.saved, effort: r.build, payback: r.payback, measured: r.measured, reason: Workspace.reason(r), assumptions: r.assumptions,
        plan: plan ? { due: Workspace.day(plan[2], true), next: plan[3], revision: Book.hash(JSON.stringify(plan)) } : { due: '', next: '', revision: '' } };
    });
    const processes = rows.map((row, index) => ({ row, index })).filter(({ row }) => row.some(v => v !== '' && v !== null)).map(({ row, index }) => ({
      ref: Workspace.ref(source, row, index), process: String(row[1] || 'Untitled process').slice(0, 160), department: String(row[0] || '').slice(0, 100), owner: String(row[2] || '').slice(0, 100),
      status: String(row[12] || 'Planned'), issue: result.issues.find(issue => issue[1] === index + 2)?.[3] || '',
    }));
    const unresolved = plans.filter(p => p[4] === source && !items.some(item => item.ref.id === p[5])).length;
    return { source, demo: source === 'Demo backlog', today: new Date().toISOString().slice(0, 10), total: items.length, items, departments: [...departments.values()],
      baseline: summary.current, potential: items.filter(i => !['Live', 'Paused'].includes(i.status)).reduce((sum, i) => sum + (i.potential || 0), 0), measured: summary.measured,
      processes, issues: result.issues.map(r => ({ row: r[1], process: r[2], fix: r[3] })).slice(0, 20), issueCount: result.issues.length, unresolvedPlans: unresolved,
      history: history.filter(h => h[1] === source && h[11] === 'Done').slice(-10).reverse().map(h => ({ process: h[3], date: Workspace.day(h[4]), saved: Number(h[5]), evidence: h[6] })),
      pendingMeasurements: history.filter(h => h[1] === source && h[11] === 'Pending').length,
      pending: history.filter(h => h[1] === source && h[11] === 'Pending').slice(0, 20).map(h => ({ requestId: h[7], process: h[3], date: Workspace.day(h[4]), saved: Number(h[5]) })) };
  },

  input(value) {
    Workspace.object(value, ['department', 'process', 'owner', 'runs', 'minutes', 'needed', 'redesign', 'people', 'share', 'effort', 'upkeep', 'notes', 'errorRate', 'rework', 'overlap']);
    const row = [value.department, value.process, value.owner, value.runs, value.minutes, value.people ?? '', value.errorRate ?? '', value.rework ?? '', value.needed, value.redesign, value.share ?? '', value.effort ?? '', 'Planned', '', '', value.notes ?? '', value.upkeep ?? '', value.overlap ?? '', ''];
    Backlog.score(Backlog.item(row, 2), Settings.read());
    [3, 4, 5, 6, 7, 10, 11, 16].forEach(i => { if (row[i] !== '') row[i] = Number(row[i]); });
    [0, 1, 2, 15, 17].forEach(i => { row[i] = row[i].trim(); });
    return row;
  },

  preview(value) {
    const r = Backlog.score(Backlog.item(Workspace.input(value), 2), Settings.read());
    return { action: r.action, baseline: r.hours, potential: r.saved, effort: r.build, payback: r.payback, reason: Workspace.reason(r), assumptions: r.assumptions };
  },

  process(payload) {
    Workspace.object(payload, ['requestId', 'ref']);
    Workspace.requestId(payload.requestId);
    const target = Workspace.resolve(payload.ref, payload.requestId), row = target.row;
    Workspace.editable(target);
    const keys = ['department', 'process', 'owner', 'runs', 'minutes', 'people', 'errorRate', 'rework', 'needed', 'redesign', 'share', 'effort'];
    const input = {};
    keys.forEach((key, i) => { input[key] = String(row[i]); });
    Object.assign(input, { notes: String(row[15]), upkeep: String(row[16]), overlap: String(row[17]) });
    return { input, status: String(row[12] || 'Planned'), measured: row[13] !== '' || row[14] !== '' };
  },

  editable(target) {
    const range = Book.open().getSheetByName(target.source).getRange(target.index + 2, 1, 1, Backlog.HEADERS.length);
    if (range.getFormulas()[0].some(Boolean)) throw new OperatorError('This process uses spreadsheet formulas. Edit its source row directly so its formulas are kept.');
    if (target.row.some(value => typeof value === 'string' && value.length > Book.MAX_TEXT)) throw new OperatorError('This process has a cell longer than 2,000 characters. Shorten it in the source workbook before opening the editor.');
  },

  editCandidate(payload) {
    Workspace.object(payload, ['requestId', 'ref', 'input', 'status']);
    const requestId = Workspace.requestId(payload.requestId), target = Workspace.locate(payload.ref, requestId);
    Workspace.editable(target);
    const row = Workspace.input(payload.input);
    row[12] = Backlog.choice(payload.status, 'Status', ['Planned', 'In progress', 'Live', 'Paused']);
    row[13] = target.row[13]; row[14] = target.row[14]; row[18] = target.id;
    Backlog.score(Backlog.item(row, target.index + 2), Settings.read());
    if (Workspace.history().some(h => h[1] === target.source && h[2] === target.id && h[11] === 'Pending')) throw new OperatorError('Finish this process’s interrupted measurement before changing its details.');
    return { target, row };
  },

  previewEdit(payload) {
    const { target, row } = Workspace.editCandidate(payload);
    if (target.revision !== payload.ref.revision) throw new OperatorError('This process changed since you opened it. Refresh the workspace and review the new values before saving.');
    const result = Workspace.preview(payload.input), rows = Book.read(target.source, Backlog.HEADERS);
    rows[target.index] = row;
    result.warning = Backlog.evaluate(rows, Settings.read(), target.source).issues.find(issue => issue[1] === target.index + 2)?.[3] || '';
    return result;
  },

  edit(payload) {
    const { target, row } = Workspace.editCandidate(payload);
    if (Workspace.rowHash(target.row) === Workspace.rowHash(row) && target.revision !== payload.ref.revision) return Workspace.finish('These process changes were already saved.');
    if (target.revision !== payload.ref.revision) throw new OperatorError('This process changed since you opened it. Refresh the workspace and review the new values before saving.');
    Book.put(Book.open().getSheetByName(target.source).getRange(target.index + 2, 1, 1, Backlog.HEADERS.length), [row]);
    return Workspace.finish('Process updated. Its identity, plan, and measurement history were kept.');
  },

  finish(message) {
    let warning = '';
    try { Template.refresh(false); } catch (_) { warning = 'Your change was saved. The sheet summaries could not refresh; use Refresh priorities after checking Settings and output headings.'; }
    try { RunLog.record('Workspace', Date.now(), 'Done', message); } catch (_) { warning += ' Your change was saved, but the run log needs attention.'; }
    let state = null;
    try { state = Workspace.snapshot(); } catch (_) { warning += ' Reload the workspace after fixing its source or history headings.'; }
    return { message, warning, state };
  },

  add(payload) {
    Workspace.object(payload, ['requestId', 'input']);
    const id = 'manual:' + Workspace.requestId(payload.requestId), row = Workspace.input(payload.input);
    const rows = Book.read('Backlog', Backlog.HEADERS), matches = rows.filter(r => r[18] === id);
    if (matches.length > 1) throw new OperatorError('The saved process has a duplicate Source ID. Fix it before continuing.');
    if (matches.length && row.some((value, i) => ![12, 13, 14, 18].includes(i) && value !== matches[0][i])) throw new OperatorError('This process was already saved with different details. Refresh the workspace and edit its existing Backlog row.');
    if (!matches.length) { row[18] = id; Book.append('Backlog', Backlog.HEADERS, [row]); }
    Settings.chooseSource('My backlog');
    return Workspace.finish(matches.length ? 'This process was already saved; a second row was not added.' : 'Process saved to your Backlog. Your own priorities are now selected.');
  },

  plan(payload) {
    Workspace.object(payload, ['requestId', 'ref', 'due', 'next', 'revision']);
    Workspace.reference(payload.ref);
    const requestId = Workspace.requestId(payload.requestId), due = Workspace.day(payload.due, true), next = Backlog.text(payload.next, 'Next step', 500);
    if (typeof payload.revision !== 'string' || (payload.revision && !/^[a-f0-9]{64}$/.test(payload.revision))) throw new OperatorError('Refresh the workspace before updating the plan.');
    const refKey = [payload.ref.source, payload.ref.row, payload.ref.id, payload.ref.revision];
    const hash = Book.hash(JSON.stringify([refKey, due, next, payload.revision])), plans = Workspace.plans();
    const receipt = plans.find(p => p[7] === requestId);
    if (receipt) {
      if (receipt[8] !== hash) throw new OperatorError('This save was already used for different plan details. Refresh the workspace.');
      return Workspace.finish('This next step was already saved.');
    }
    const target = Workspace.resolve(payload.ref, requestId);
    Backlog.score(Backlog.item(target.row, target.index + 2), Settings.read());
    const index = plans.findIndex(p => p[4] === target.source && p[5] === target.id), current = index < 0 ? '' : Book.hash(JSON.stringify(plans[index]));
    if (payload.revision !== current) throw new OperatorError('Someone updated this plan. Refresh the workspace before replacing it.');
    if (index < 0 && plans.length >= Book.MAX_ROWS) throw new OperatorError('Action plan is full. Archive the previous intake period first.');
    const sh = Workspace.table('Action plan', Workspace.PLANS), entry = [target.row[1], target.row[2], due, next, target.source, target.id, new Date().toISOString(), requestId, hash];
    Workspace.identify(target);
    Book.ensureRows(sh, (index < 0 ? plans.length : index) + 2);
    Book.put(sh.getRange((index < 0 ? plans.length : index) + 2, 1, 1, entry.length), [entry]);
    return Workspace.finish('Next step saved. Its date and owner stay attached to the process when rows are sorted.');
  },

  measure(payload) {
    Workspace.object(payload, ['requestId', 'ref', 'date', 'saved', 'evidence', 'confirmed']);
    Workspace.reference(payload.ref);
    const requestId = Workspace.requestId(payload.requestId), date = Workspace.day(payload.date), evidence = Backlog.text(payload.evidence, 'Measurement evidence', 1000);
    const requestedSaving = Backlog.number(payload.saved, 'Observed hours saved/week', 0, Number.MAX_SAFE_INTEGER);
    Backlog.date(date);
    if (payload.confirmed !== true) throw new OperatorError('Confirm that the change is live and these are observed savings.');
    const refKey = [payload.ref.source, payload.ref.row, payload.ref.id, payload.ref.revision];
    const hash = Book.hash(JSON.stringify([refKey, date, requestedSaving, evidence])), history = Workspace.history();
    let index = history.findIndex(h => h[7] === requestId), entry, target;
    if (index >= 0) {
      entry = history[index];
      if (entry[8] !== hash) throw new OperatorError('This save was already used for a different measurement. Refresh the workspace.');
      if (entry[11] === 'Done') return Workspace.finish('This measurement was already recorded; history was not duplicated.');
      const matches = Book.read(entry[1], Backlog.HEADERS).map((r, i) => ({ row: r, index: i })).filter(r => r.row[18] === entry[2]);
      if (matches.length !== 1) throw new OperatorError('An interrupted measurement cannot find exactly one source process. Review Savings history and Backlog before retrying.');
      target = { source: entry[1], id: entry[2], ...matches[0] };
      const current = Workspace.rowHash(target.row);
      if (current !== entry[9] && current !== entry[10]) throw new OperatorError('The process changed after an interrupted measurement. Review the Pending entry in Savings history before continuing.');
    } else {
      target = Workspace.resolve(payload.ref, requestId);
      const scored = Backlog.score(Backlog.item(target.row, target.index + 2), Settings.read());
      const saved = Backlog.number(requestedSaving, 'Observed hours saved/week', 0, scored.hours);
      if (history.length >= Book.MAX_ROWS) throw new OperatorError('Savings history is full. Archive the previous intake period first.');
      if (history.some(h => h[1] === target.source && h[2] === target.id && h[11] === 'Pending')) throw new OperatorError('This process has a Pending measurement. Finish or review it before recording another.');
      const after = target.row.slice(); after[12] = 'Live'; after[13] = saved; after[14] = date;
      entry = [new Date().toISOString(), target.source, target.id, target.row[1], date, saved, evidence, requestId, hash, Workspace.rowHash(target.row), Workspace.rowHash(after), 'Pending', JSON.stringify(payload.ref)];
      Workspace.table('Savings history', Workspace.HISTORY);
      Workspace.identify(target);
      Book.append('Savings history', Workspace.HISTORY, [entry]); index = history.length;
    }
    Book.put(Book.open().getSheetByName(target.source).getRange(target.index + 2, 13, 1, 3), [['Live', Number(entry[5]), date]]);
    Book.put(Book.open().getSheetByName('Savings history').getRange(index + 2, 12), [['Done']]);
    return Workspace.finish('Observed savings recorded with evidence. The process is Live; earlier measurements remain in history.');
  },

  resume(payload) {
    Workspace.object(payload, ['requestId']);
    const id = Workspace.requestId(payload.requestId), entry = Workspace.history().find(row => row[7] === id);
    if (!entry) throw new OperatorError('This measurement is no longer in Savings history. Refresh the workspace.');
    let ref;
    try { ref = JSON.parse(entry[12]); } catch (_) { throw new OperatorError('The saved measurement reference changed. Ask the owner to restore its Request ref in Savings history.'); }
    return Workspace.measure({ requestId: id, ref, date: Workspace.day(entry[4]), saved: entry[5], evidence: entry[6], confirmed: true });
  },
};

function openAutomationWorkspace() {
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutputFromFile('Workspace').setWidth(980).setHeight(720), 'Automation workspace');
}

function workspaceRequest(action, payload) {
  try {
    const handlers = { load: Workspace.snapshot, preview: Workspace.preview, add: Workspace.add, process: Workspace.process, previewEdit: Workspace.previewEdit, edit: Workspace.edit, plan: Workspace.plan, measure: Workspace.measure, resume: Workspace.resume,
      source: value => { Workspace.object(value, ['source']); Settings.chooseSource(Backlog.choice(value.source, 'Data source', ['Demo', 'My backlog'])); return Workspace.finish('Data source changed. Both input lists were kept.'); } };
    if (typeof action !== 'string' || !Object.prototype.hasOwnProperty.call(handlers, action)) throw new OperatorError('Choose a supported workspace action.');
    return { ok: true, data: Book.locked(() => handlers[action](payload)) };
  } catch (error) {
    return { ok: false, error: error instanceof OperatorError ? error.message : 'The workspace could not finish. Your inputs are kept. Refresh and retry the same save; if it persists, ask the owner to check Apps Script executions.' };
  }
}
