class OperatorError extends Error {}

const Book = {
  MAX_ROWS: 2000,
  MAX_TEXT: 2000,

  hash(text) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8).map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
  },

  open() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new OperatorError('Open the Discovery workbook and use its Automations menu.');
    return ss;
  },

  sheet(name, headers) {
    const ss = Book.open();
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (headers) {
      if (sh.getLastRow() === 0) {
        Book.put(sh.getRange(1, 1, 1, headers.length), [headers]);
      } else {
        const actual = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), headers.length)).getValues()[0];
        if (actual.length !== headers.length || actual.some((h, i) => h !== headers[i])) {
          throw new OperatorError('The column headings in "' + name + '" changed. Restore them from the operator guide before continuing; your rows have been kept.');
        }
      }
    }
    return sh;
  },

  safeCell(value) {
    if (typeof value === 'string') {
      if (value.length > Book.MAX_TEXT) throw new OperatorError('A text value exceeds 2,000 characters. Shorten it before continuing.');
      return /^[\s\u0000-\u001f]*[=+@\-]/.test(value) ? "'" + value : value;
    }
    return value === undefined || value === null ? '' : value;
  },

  put(range, rows) {
    range.setValues(rows.map(row => row.map(Book.safeCell)));
  },

  read(name, headers) {
    const sh = Book.sheet(name, headers);
    if (sh.getLastRow() > Book.MAX_ROWS + 1) throw new OperatorError('"' + name + '" exceeds 2,000 rows. Archive older rows in a separate workbook first.');
    return sh.getLastRow() < 2 ? [] : sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues();
  },

  replace(name, headers, rows) {
    if (rows.length > Book.MAX_ROWS) throw new OperatorError('This operation exceeds the 2,000-row limit.');
    const sh = Book.sheet(name, headers);
    const values = [headers].concat(rows).map(row => row.map(Book.safeCell));
    Book.ensureRows(sh, values.length);
    const previous = sh.getLastRow();
    sh.getRange(1, 1, values.length, headers.length).setValues(values);
    if (previous > values.length) sh.getRange(values.length + 1, 1, previous - values.length, headers.length).clearContent();
    return sh;
  },

  ensureRows(sh, count) {
    if (count > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), count - sh.getMaxRows());
  },

  append(name, headers, rows) {
    if (!rows.length) return;
    const sh = Book.sheet(name, headers);
    const end = sh.getLastRow() + rows.length;
    if (end > Book.MAX_ROWS + 1) throw new OperatorError('"' + name + '" would exceed 2,000 rows. Archive older rows first.');
    Book.ensureRows(sh, end);
    Book.put(sh.getRange(sh.getLastRow() + 1, 1, rows.length, headers.length), rows);
  },

  state(key, value) {
    const props = PropertiesService.getDocumentProperties();
    if (!props) throw new OperatorError('Install this script inside a Google spreadsheet.');
    // Copied containers must never reuse the original workbook's Form or Doc.
    const scoped = Book.open().getId() + ':' + key;
    if (value !== undefined) props.setProperty(scoped, String(value));
    return props.getProperty(scoped);
  },

  locked(fn) {
    const lock = LockService.getDocumentLock();
    if (!lock || !lock.tryLock(1000)) throw new OperatorError('Another automation is running. Wait a moment, then try again.');
    try { return fn(); } finally { lock.releaseLock(); }
  },
};
