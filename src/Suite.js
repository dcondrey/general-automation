const Suite = {
  table(name, headers, seed) {
    const sh = Book.sheet(name, headers);
    Book.ensureRows(sh, Book.MAX_ROWS + 1);
    if (seed && sh.getLastRow() === 1) Book.append(name, headers, seed);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setBackground('#15213d').setFontColor('#ffffff').setFontWeight('bold').setWrap(true);
    sh.setColumnWidths(1, headers.length, 155);
    return sh;
  },
  settings(defaults) {
    Suite.table('Settings', ['Setting', 'Value', 'Help']);
    const existing = Book.read('Settings', ['Setting', 'Value', 'Help']);
    Book.append('Settings', ['Setting', 'Value', 'Help'], defaults.filter(r => !existing.some(e => e[0] === r[0])));
    const sh = Book.open().getSheetByName('Settings');
    sh.getRange(2, 2, defaults.length, 1).setBackground('#fff2cc');
    sh.setColumnWidth(3, 650);
    sh.getRange(2, 2).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Demo', 'Live'], true).setAllowInvalid(false).build());
    return Suite.options();
  },
  options() {
    const result = Object.create(null);
    Book.read('Settings', ['Setting', 'Value', 'Help']).forEach(row => {
      if (Object.prototype.hasOwnProperty.call(result, row[0])) throw new OperatorError('Settings has a duplicate label: ' + row[0]);
      result[row[0]] = row[1];
    });
    if (!['Demo', 'Live'].includes(result.Mode)) throw new OperatorError('Choose Demo or Live in Settings → Mode.');
    return result;
  },
  number(v, name, min, max) {
    if ((typeof v !== 'number' && (typeof v !== 'string' || !/^\d+(\.\d+)?$/.test(v.trim()))) || !Number.isFinite(Number(v)) || Number(v) < min || Number(v) > max) {
      throw new OperatorError(name + ' must be a number from ' + min + ' to ' + max + '.');
    }
    return Number(v);
  },
  text(v, name, max) {
    if (typeof v !== 'string' || !v.trim() || v.length > max) throw new OperatorError(name + ' is required and must be at most ' + max + ' characters.');
    return v.trim();
  },
  date(v, name) {
    if (v instanceof Date && Number.isFinite(v.getTime())) return v;
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const d = new Date(v + 'T00:00:00Z');
      if (Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v) return d;
    }
    throw new OperatorError(name + ' must be a date in YYYY-MM-DD format.');
  },
  hash(text) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8).map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
  },
  help(title, rows) {
    Suite.table('Start here', ['Step', 'What to do']);
    Book.replace('Start here', ['Step', 'What to do'], [[title, 'Start in Demo. Yellow Settings values control this workbook.'], ...rows]);
    Book.open().getSheetByName('Start here').setColumnWidth(2, 850);
  },
};
