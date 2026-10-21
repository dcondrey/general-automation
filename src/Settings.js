const Settings = {
  HEADERS: ['Setting', 'Value', 'What this means'],
  DEFAULTS: [
    ['Data source', 'Demo', 'Demo uses fictional rows. My backlog uses your Backlog tab and imports your Form submissions when you rank.'],
    ['Create Google files', 'No', 'No previews everything inside this workbook. Yes lets menu actions create an intake Form and report Doc.'],
    ['Hourly cost', 45, 'Blended cost per staff hour, in your own currency. This estimates capacity value, not cash savings.'],
    ['Working weeks/year', 48, 'Working weeks used to annualize potential savings.'],
    ['Default build hours', 8, 'Used only when a Backlog row has no Build hours estimate.'],
    ['Default deletion hours', 0.5, 'Time to retire an unnecessary process, used when Build hours is blank.'],
  ],

  read() {
    const rows = Book.read('Settings', Settings.HEADERS);
    const values = {};
    rows.forEach(row => {
      if (!row[0] && !row[1]) return;
      if (!Settings.DEFAULTS.some(r => r[0] === row[0])) throw new OperatorError('Settings has an unknown setting. Restore its labels using the operator guide.');
      if (Object.prototype.hasOwnProperty.call(values, row[0])) throw new OperatorError('Settings has a duplicate setting: ' + row[0] + '. Keep one of each.');
      values[row[0]] = row[1];
    });
    const source = Backlog.choice(values['Data source'], 'Data source in Settings', ['Demo', 'My backlog']);
    const files = Backlog.choice(values['Create Google files'], 'Create Google files in Settings', ['No', 'Yes']);
    return { source, files: files === 'Yes', hourlyCost: Backlog.number(values['Hourly cost'], 'Hourly cost in Settings', 0, 100000),
      weeksPerYear: Backlog.number(values['Working weeks/year'], 'Working weeks/year in Settings', 1, 52),
      defaultBuildHours: Backlog.number(values['Default build hours'], 'Default build hours in Settings', 0.01, 100000),
      deleteHours: Backlog.number(values['Default deletion hours'], 'Default deletion hours in Settings', 0.01, 100000) };
  },

  initialize() {
    const sh = Book.sheet('Settings', Settings.HEADERS);
    const rows = Book.read('Settings', Settings.HEADERS);
    const missing = Settings.DEFAULTS.filter(def => !rows.some(row => row[0] === def[0]));
    Book.append('Settings', Settings.HEADERS, missing);
    const all = Book.read('Settings', Settings.HEADERS);
    all.forEach((row, i) => {
      const cell = sh.getRange(i + 2, 2);
      cell.setBackground('#fff2cc');
      const choices = row[0] === 'Data source' ? ['Demo', 'My backlog'] : row[0] === 'Create Google files' ? ['No', 'Yes'] : null;
      cell.setDataValidation(choices ? SpreadsheetApp.newDataValidation().requireValueInList(choices, true).setAllowInvalid(false).build() :
        SpreadsheetApp.newDataValidation().requireNumberBetween(row[0] === 'Hourly cost' ? 0 : row[0] === 'Working weeks/year' ? 1 : 0.01, row[0] === 'Working weeks/year' ? 52 : 100000).setAllowInvalid(false).build());
      cell.setNote(String(row[2]));
    });
    return sh;
  },

  requireFiles() {
    const opts = Settings.read();
    if (!opts.files) throw new OperatorError('Preview mode is on. To create a Form or Doc, set Settings → Create Google files to Yes, then run this action again.');
    if (opts.source === 'Demo') throw new OperatorError('Choose My backlog in Settings before creating files. The demo stays inside this workbook.');
    return opts;
  },

  chooseSource(value) {
    Backlog.choice(value, 'Data source', ['Demo', 'My backlog']);
    const rows = Book.read('Settings', Settings.HEADERS);
    const index = rows.findIndex(row => row[0] === 'Data source');
    if (index < 0) throw new OperatorError('Run Set up workbook before choosing a data source.');
    Book.open().getSheetByName('Settings').getRange(index + 2, 2).setValue(value);
  },
};
