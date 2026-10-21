export function googleFake() {
  const env = { docs: new Map(), forms: new Map(), props: new Map(), userProps: new Map(), alerts: [], released: 0, held: false };
  const column = text => [...text].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
  class Range {
    constructor(sheet, row, col, height = 1, width = 1) { Object.assign(this, { sheet, row, col, height, width }); }
    setValues(rows) {
      if (env.failWrite === this.sheet.name) { env.failWrite = null; throw new Error('Injected write failure'); }
      for (let r = 0; r < this.height; r++) {
        const target = this.sheet.data[this.row + r - 1] ||= [];
        for (let c = 0; c < this.width; c++) {
          const value = rows[r][c];
          target[this.col + c - 1] = typeof value === 'string' && value.startsWith("'") ? value.slice(1) : value;
        }
      }
      return this;
    }
    getValues() { return Array.from({ length: this.height }, (_, r) => Array.from({ length: this.width }, (_, c) => this.sheet.data[this.row + r - 1]?.[this.col + c - 1] ?? '')); }
    clearContent() { return this.setValues(Array.from({ length: this.height }, () => Array(this.width).fill(''))); }
    setFormula(formula) { this.sheet.formulas.set(`${this.row}:${this.col}`, formula); return this.setValues([[formula]]); }
  }
  for (const name of ['setBackground', 'setFontColor', 'setFontWeight', 'setWrap', 'setFontFamily', 'setVerticalAlignment', 'setDataValidation', 'setNote', 'setNumberFormat']) Range.prototype[name] = function () { return this; };
  class Sheet {
    constructor(name) { Object.assign(this, { name, data: [], maxRows: 1000, charts: [], protections: [], formulas: new Map() }); }
    getLastRow() { let i = this.data.length; while (i && !(this.data[i - 1] || []).some(v => v !== '' && v !== null && v !== undefined)) i--; return i; }
    getLastColumn() { return Math.max(0, ...Array.from(this.data, row => { if (!row) return 0; let i = row.length; while (i && (row[i - 1] === '' || row[i - 1] === undefined)) i--; return i; })); }
    getMaxRows() { return this.maxRows; }
    insertRowsAfter(_after, count) { this.maxRows += count; return this; }
    deleteRows(start, count) { this.data.splice(start - 1, count); this.maxRows -= count; return this; }
    getRange(row, col, height, width) {
      if (typeof row === 'string') {
        const match = /^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/.exec(row);
        if (!match) throw new Error('Unsupported fake range: ' + row);
        return new Range(this, Number(match[2]), column(match[1]), Number(match[4] || match[2]) - Number(match[2]) + 1, column(match[3] || match[1]) - column(match[1]) + 1);
      }
      return new Range(this, row, col, height, width);
    }
    getDataRange() { return this.getRange(1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); }
    getProtections() { return this.protections; }
    protect() {
      const p = { setDescription(s) { this.description = s; return this; }, setWarningOnly() { return this; }, getDescription() { return this.description; } };
      this.protections.push(p); return p;
    }
    getCharts() { return [...this.charts]; }
    removeChart(chart) { this.charts = this.charts.filter(c => c !== chart); }
    newChart() { const builder = {}; for (const name of ['setChartType', 'addRange', 'setNumHeaders', 'setPosition', 'setOption']) builder[name] = () => builder; builder.build = () => ({}); return builder; }
    insertChart(chart) { this.charts.push(chart); }
  }
  for (const name of ['setFrozenRows', 'setTabColor', 'setRowHeight', 'setColumnWidths', 'setColumnWidth']) Sheet.prototype[name] = function () { return this; };
  const ss = { id: 'original', sheets: new Map(), getId() { return this.id; }, getName() { return 'Test Discovery'; }, getSheetByName(name) { return this.sheets.get(name) || null; },
    insertSheet(name) { const sh = new Sheet(name); this.sheets.set(name, sh); return sh; }, setActiveSheet() {}, toast() {} };
  const validation = () => { const b = {}; for (const name of ['requireValueInList', 'setAllowInvalid', 'requireNumberBetween', 'requireTextLengthLessThanOrEqualTo', 'setHelpText']) b[name] = () => b; b.build = () => ({}); return b; };
  const ui = { ButtonSet: { OK: 'OK', YES_NO: 'YES_NO' }, Button: { YES: 'YES' }, alert(...args) { env.alerts.push(args); return 'YES'; } };
  class Item {
    constructor(type) { this.type = type; this.title = ''; }
    getTitle() { return this.title; }
    getType() { return this.type; }
    setTitle(title) { this.title = title; return this; }
    asTextItem() { return this; }
    asMultipleChoiceItem() { return this; }
    setChoiceValues() { return this; }
    setHelpText() { return this; }
    setRequired() { return this; }
    setValidation() { if (env.failQuestion === this.title) { env.failQuestion = null; throw new Error('Injected question failure'); } return this; }
  }
  class Form {
    constructor(id, published) { this.id = id; this.published = published; this.items = []; this.responses = []; }
    getId() { return this.id; }
    getItems() { return [...this.items]; }
    addTextItem() { const item = new Item('TEXT'); this.items.push(item); return item; }
    addMultipleChoiceItem() { const item = new Item('MULTIPLE_CHOICE'); this.items.push(item); return item; }
    getResponses() { return this.responses; }
  }
  for (const name of ['setDescription', 'setConfirmationMessage', 'setCollectEmail', 'setAllowResponseEdits', 'setPublishingSummary']) Form.prototype[name] = function () { return this; };
  const docBody = () => { const body = { paragraphs: [], clear() { this.paragraphs = []; return this; }, editAsText() { return this; }, appendParagraph(s) { this.paragraphs.push(s); return this; } };
    for (const name of ['setMarginTop', 'setMarginBottom', 'setMarginLeft', 'setMarginRight', 'setFontFamily', 'setFontSize', 'setSpacingAfter', 'setHeading']) body[name] = () => body;
    return body; };
  const services = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, getUi: () => ui, newDataValidation: validation, ProtectionType: { SHEET: 'sheet' } },
    Charts: { ChartType: { BAR: 'bar' } },
    PropertiesService: { getDocumentProperties: () => ({ getProperty: key => env.props.get(key) ?? null, setProperty: (key, val) => env.props.set(key, val) }), getUserProperties: () => ({ getProperty: key => env.userProps.get(key) ?? null, setProperty: (key, val) => env.userProps.set(key, val) }) },
    LockService: { getDocumentLock: () => ({ tryLock() { if (env.held) return false; env.held = true; return true; }, releaseLock() { env.held = false; env.released++; } }) },
    FormApp: { ItemType: { TEXT: 'TEXT', MULTIPLE_CHOICE: 'MULTIPLE_CHOICE' }, createTextValidation: validation,
      create(_title, published) { const f = new Form('form' + (env.forms.size + 1), published); env.forms.set(f.id, f); return f; },
      openById(id) { if (!env.forms.has(id)) throw new Error('Unavailable'); return env.forms.get(id); } },
    DocumentApp: { ParagraphHeading: { HEADING1: 'h1' }, create() { const id = 'doc' + (env.docs.size + 1); const body = docBody(); const doc = { getId: () => id, getBody: () => body, saveAndClose() {} }; env.docs.set(id, doc); return doc; },
      openById(id) { if (!env.docs.has(id)) throw new Error('Unavailable'); return env.docs.get(id); } },
  };
  return Object.assign(env, { services, ss, settings(key, value) { const rows = ss.sheets.get('Settings').data; const row = rows.find(r => r[0] === key); row[1] = value; } });
}
