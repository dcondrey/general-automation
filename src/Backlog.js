const Backlog = {
  HEADERS: ['Department', 'Process', 'Owner', 'Runs/week', 'Minutes/run', 'People/run', 'Error rate %', 'Rework min/error', 'Needed?', 'Redesign first?', 'Automatable %', 'Build hours', 'Status', 'Measured hours/week saved', 'Measured on', 'Notes', 'Upkeep min/week', 'Overlap group', 'Source ID'],
  OUTPUT: ['Rank', 'Department', 'Process', 'Owner', 'Recommendation', 'Current hours/week', 'Potential hours/week', 'Implementation hours', 'Payback weeks', 'Annual capacity value', 'Measured hours/week saved', 'Measured on', 'Assumptions', 'Backlog row', 'Source ID'],
  ISSUES: ['Sheet', 'Row', 'Process', 'What to fix'],

  number(value, label, min, max, fallback) {
    if (value === '' || value === null || value === undefined) {
      if (fallback !== undefined) return fallback;
      throw new OperatorError('Fill in ' + label + '.');
    }
    if ((typeof value !== 'number' && (typeof value !== 'string' || !/^\d+(\.\d+)?$/.test(value.trim()))) || !Number.isFinite(Number(value))) {
      throw new OperatorError(label + ' must be a number using a decimal point, without commas, units, or a % sign.');
    }
    const n = Number(value);
    if (n < min || n > max) throw new OperatorError(label + ' must be between ' + min + ' and ' + max + '.');
    return n;
  },

  text(value, label, max, optional) {
    if (typeof value !== 'string' || (!optional && !value.trim())) throw new OperatorError('Fill in ' + label + ' as text.');
    if (value.length > max) throw new OperatorError(label + ' must be at most ' + max + ' characters.');
    return value.trim();
  },

  choice(value, label, choices, fallback) {
    if ((value === '' || value === undefined) && fallback !== undefined) return fallback;
    if (!choices.includes(value)) throw new OperatorError('Choose ' + label + ' from: ' + choices.join(', ') + '.');
    return value;
  },

  item(row, rowNumber) {
    const item = {};
    Backlog.HEADERS.forEach((h, i) => { item[h] = row[i] === undefined ? '' : row[i]; });
    item.row = rowNumber;
    return item;
  },

  score(item, options) {
    const opts = Object.assign({ weeksPerYear: 48, hourlyCost: 45, defaultBuildHours: 8, deleteHours: 0.5 }, options);
    const department = Backlog.text(item.Department, 'Department', 100);
    const process = Backlog.text(item.Process, 'Process', 160);
    const owner = Backlog.text(item.Owner, 'Owner', 100);
    Backlog.text(item.Notes || '', 'Notes', 1000, true);
    const runs = Backlog.number(item['Runs/week'], 'Runs/week', 0, 100000);
    const minutes = Backlog.number(item['Minutes/run'], 'Minutes/run', 0, 10080);
    const people = Backlog.number(item['People/run'], 'People/run', 1, 10000, 1);
    const errors = Backlog.number(item['Error rate %'], 'Error rate %', 0, 100, 0) / 100;
    const rework = Backlog.number(item['Rework min/error'], 'Rework min/error', 0, 10080, 0);
    const needed = Backlog.choice(item['Needed?'], 'Needed?', ['Yes', 'No', 'Unsure']);
    const redesign = Backlog.choice(item['Redesign first?'], 'Redesign first?', ['Yes', 'No', 'Unsure']);
    const share = Backlog.number(item['Automatable %'], 'Automatable %', 0, 100, 80) / 100;
    const build = Backlog.number(item['Build hours'], 'Build hours', 0.01, 100000, needed === 'No' ? opts.deleteHours : opts.defaultBuildHours);
    const status = Backlog.choice(item.Status, 'Status', ['Planned', 'In progress', 'Live', 'Paused'], 'Planned');
    const upkeep = Backlog.number(item['Upkeep min/week'], 'Upkeep min/week', 0, 10080, 0) / 60;
    const overlap = Backlog.text(item['Overlap group'] || '', 'Overlap group', 100, true).toLowerCase();
    const hours = runs * (minutes * people + errors * rework) / 60;
    const unresolved = needed === 'Unsure' || (needed !== 'No' && redesign === 'Unsure');
    const gross = hours * (needed === 'No' ? 1 : share);
    const saved = unresolved ? null : Math.max(0, gross - upkeep);
    const action = needed === 'No' ? 'Delete' : unresolved ? 'Investigate' : saved === 0 ? 'Keep manual' : redesign === 'Yes' ? 'Redesign first' : 'Automate';
    let measured = null;
    let measuredOn = '';
    if (item['Measured hours/week saved'] !== '') {
      measured = Backlog.number(item['Measured hours/week saved'], 'Measured hours/week saved', 0, hours);
      if (status !== 'Live') throw new OperatorError('Set Status to Live before recording measured savings.');
      measuredOn = Backlog.date(item['Measured on']);
    } else if (item['Measured on'] !== '') {
      throw new OperatorError('Fill in Measured hours/week saved, or clear Measured on.');
    }
    const assumptions = [];
    if (item['Build hours'] === '') assumptions.push('Effort assumed: ' + build + 'h');
    if (needed !== 'No' && item['Automatable %'] === '') assumptions.push('Automatable assumed: 80%');
    if (unresolved) assumptions.push('Discovery needed; savings excluded');
    if (redesign === 'Yes' && needed !== 'No') assumptions.push('Potential only; validate after redesign');
    if (upkeep) assumptions.push('Upkeep deducted: ' + upkeep.toFixed(2) + 'h/week');
    if (upkeep >= gross && upkeep > 0) assumptions.push('No positive net saving');
    return { item, department, process, owner, hours, saved, build, action, status, measured, measuredOn, overlap,
      leverage: saved === null ? null : saved / build,
      payback: saved > 0 ? build / saved : null,
      annual: saved === null ? null : saved * opts.weeksPerYear * opts.hourlyCost,
      assumptions: assumptions.join('; ') };
  },

  date(value) {
    let d;
    if (value instanceof Date && Number.isFinite(value.getTime())) d = value;
    else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      d = new Date(value + 'T12:00:00Z');
      if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== value) d = null;
    }
    if (!d || d.toISOString().slice(0, 10) > new Date().toISOString().slice(0, 10)) throw new OperatorError('Enter a valid Measured on date (YYYY-MM-DD), no later than today.');
    return d;
  },

  evaluate(rows, options, sheet) {
    const ranked = [];
    const issues = [];
    const ids = new Set();
    rows.forEach((row, index) => {
      if (row.every(v => v === '' || v === null)) return;
      const item = Backlog.item(row, index + 2);
      try {
        const id = Backlog.text(item['Source ID'], 'Source ID', 200, true);
        if (id && ids.has(id)) throw new OperatorError('Source ID is duplicated. Keep one row per submission.');
        if (id) ids.add(id);
        ranked.push(Backlog.score(item, options));
      } catch (error) {
        issues.push([sheet, index + 2, String(item.Process).slice(0, 160), error.message]);
      }
    });
    const groups = new Map();
    ranked.filter(r => r.overlap).forEach(r => {
      const group = groups.get(r.overlap) || [];
      group.push(r);
      groups.set(r.overlap, group);
    });
    const collisions = new Set();
    groups.forEach(group => {
      if (group.length < 2) return;
      group.forEach(r => {
        collisions.add(r);
        issues.push([sheet, r.item.row, r.process, 'Overlap group "' + r.overlap + '" appears in rows ' + group.slice(0, 10).map(other => other.item.row).join(', ') + (group.length > 10 ? ' and ' + (group.length - 10) + ' more' : '') + '. Merge shared effort into one process, or use separate groups only if the baselines are independent. All rows in this group are excluded to prevent counting hours twice.']);
      });
    });
    const eligible = ranked.filter(r => !collisions.has(r));
    eligible.sort((a, b) => (b.leverage === null ? -1 : b.leverage) - (a.leverage === null ? -1 : a.leverage) || (b.saved || 0) - (a.saved || 0) || a.item.row - b.item.row);
    eligible.forEach((r, i) => { r.rank = i + 1; });
    return { ranked: eligible, issues, source: sheet, summary: '' };
  },

  toRow(r) {
    return [r.rank, r.department, r.process, r.owner, r.action, r.hours, r.saved, r.build, r.payback, r.annual, r.measured, r.measuredOn, r.assumptions, r.item.row, r.item['Source ID']];
  },

  summarize(ranked) {
    const sum = key => ranked.reduce((n, r) => n + (r[key] || 0), 0);
    return { count: ranked.length, current: sum('hours'), potential: sum('saved'), annual: sum('annual'),
      measured: ranked.some(r => r.measured !== null) ? sum('measured') : null,
      measuredCount: ranked.filter(r => r.measured !== null).length,
      top: ranked.filter(r => r.saved > 0 && r.status !== 'Live' && r.status !== 'Paused').slice(0, 3) };
  },
};

/** @customfunction */
function WEEKLY_WORK_HOURS(runs, minutes, people, errorRate, reworkMinutes) {
  return Backlog.number(runs, 'Runs/week', 0, 100000) *
    (Backlog.number(minutes, 'Minutes/run', 0, 10080) * Backlog.number(people, 'People/run', 1, 10000, 1) +
    Backlog.number(errorRate, 'Error rate %', 0, 100, 0) / 100 * Backlog.number(reworkMinutes, 'Rework min/error', 0, 10080, 0)) / 60;
}
