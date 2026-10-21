const DiscoveryHome = {
  VERSION: 'home-v4',
  PRIORITIES: ['Rank', 'Opportunity', 'Next step', 'Potential hours/week', 'Effort hours', 'Owner'],
  DETAILS: ['Demo backlog', 'Ranked', 'Dashboard', 'Report preview', 'Run log', 'Action plan', 'Savings history'],

  link(sh, range, label, target) {
    const url = Book.open().getUrl().split('#')[0] + '#gid=' + target.getSheetId();
    DiscoveryHome.urlLink(sh, range, label, url);
  },

  urlLink(sh, range, label, url) {
    sh.getRange(range).merge().setRichTextValue(SpreadsheetApp.newRichTextValue().setText(label).setLinkUrl(url).build())
      .setFontColor('#ffffff').setBackground('#176b62').setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
  },

  render(result, opts) {
    const ss = Book.open(), summary = Backlog.summarize(result.ranked), demo = opts.source === 'Demo';
    const pending = result.ranked.filter(r => r.status !== 'Live' && r.status !== 'Paused');
    const priorities = Book.replace('Priorities', DiscoveryHome.PRIORITIES, pending.map((r, i) =>
      [i + 1, r.process, r.action, r.saved, r.build, r.owner]));
    Template.style(priorities, false);
    priorities.setHiddenGridlines(true);
    priorities.setFrozenColumns(2);
    [55, 320, 150, 125, 100, 150].forEach((width, i) => priorities.setColumnWidth(i + 1, width));
    if (pending.length) {
      priorities.getRange(2, 1, pending.length, 6).setWrap(true);
      priorities.setRowHeights(2, pending.length, 54);
      priorities.getRange(2, 4, pending.length, 2).setNumberFormat('0.0');
    }

    const sh = Book.sheet('Start here');
    sh.getRange('A1:H34').breakApart().clear();
    sh.setHiddenGridlines(true);
    sh.setFrozenRows(0);
    sh.setFrozenColumns(0);
    sh.setTabColor('#176b62');
    sh.setColumnWidths(1, 8, 105).setRowHeights(1, 34, 24);
    sh.getRange('A1:H34').setFontFamily('Arial').setFontSize(11).setFontColor('#18263e').setBackground('#f7f9fc').setVerticalAlignment('middle').setHorizontalAlignment('left');
    sh.getRange('A1:H2').merge().setValue('Find your next three time savers').setFontSize(25).setFontWeight('bold').setFontColor('#ffffff').setBackground('#15213d');
    sh.getRange('A3:H3').merge().setValue(demo ? 'DEMO  ·  ' + summary.count + ' fictional workflows. Your own work is kept separately.' : 'YOUR WORK  ·  Results from your Backlog. Refresh after changing inputs.')
      .setBackground('#dff3ed').setFontColor('#145047').setFontWeight('bold');
    sh.getRange('A4:H5').merge().setValue('Choose Automations → Open guided workspace to add a process, understand its recommendation, plan the next step, and record an observed result.').setWrap(true).setFontColor('#526079');

    const remaining = pending.reduce((total, r) => total + (r.saved || 0), 0);
    const cards = [
      ['A7:B7', 'A8:B9', 'Recorded baseline', summary.current.toFixed(1) + ' h/week'],
      ['C7:D7', 'C8:D9', 'Potential to reclaim', remaining.toFixed(1) + ' h/week'],
      ['E7:F7', 'E8:F9', 'Measured so far', summary.measured === null ? 'Not measured' : summary.measured.toFixed(1) + ' h/week'],
      ['G7:H7', 'G8:H9', 'Rows to fix', String(result.issues.length)],
    ];
    cards.forEach(([labelRange, numberRange, label, value]) => {
      sh.getRange(labelRange).merge().setValue(label).setFontColor('#526079').setBackground('#ffffff');
      sh.getRange(numberRange).merge().setValue(value).setFontSize(19).setFontWeight('bold').setBackground('#ffffff');
    });
    sh.getRange('A10:H10').merge().setValue(demo ? 'All demo numbers, including the measurement, are fictional.' : 'Potential is an estimate after upkeep. Blank measurement means not measured.').setFontSize(10).setFontColor('#526079');
    sh.getRange('A12:H12').merge().setValue(summary.top.length ? 'Start with these opportunities' : 'Your next opportunity starts here').setFontSize(15).setFontWeight('bold');
    for (let i = 0; i < 3; i++) {
      const row = 14 + i * 3, item = summary.top[i];
      if (!item) continue;
      sh.getRange(row, 1, 2, 2).merge().setValue(item.action).setFontWeight('bold').setFontColor('#145047').setBackground('#dff3ed').setWrap(true);
      sh.getRange(row, 3, 1, 4).merge();
      sh.getRange(row, 3).setValue(Book.safeCell(item.process));
      sh.getRange(row, 3, 1, 4).setFontWeight('bold').setFontSize(12).setWrap(true).setBackground('#ffffff');
      sh.getRange(row, 7, 2, 2).merge().setValue(item.saved.toFixed(1) + ' h/week').setFontWeight('bold').setFontSize(15).setBackground('#ffffff').setHorizontalAlignment('center');
      sh.getRange(row + 1, 3, 1, 4).merge().setValue(Book.safeCell(item.owner + '  ·  ' + item.build + ' hours to implement')).setFontColor('#526079').setFontSize(10).setBackground('#ffffff').setWrap(true);
      sh.setRowHeight(row, 36).setRowHeight(row + 1, 24);
    }
    if (!summary.top.length) sh.getRange('A14:H18').merge().setValue('Choose Automations → Use my own data, then describe one repetitive process in Backlog. You can start with the seven visible columns.').setWrap(true).setBackground('#ffffff').setFontSize(13);

    DiscoveryHome.link(sh, 'A24:D25', 'Review all priorities →', priorities);
    DiscoveryHome.link(sh, 'E24:H25', demo ? 'Choose my data in Settings →' : 'Edit my work list →', ss.getSheetByName(demo ? 'Settings' : 'Backlog'));
    const guidance = demo ? 'Ready for your own process? Choose Automations → Use my own data. The demo will stay available.' : 'After editing Backlog, choose Automations → Refresh priorities. Live and Paused processes stay in the detailed view.';
    sh.getRange('A27:H28').merge().setValue(result.issues.length ? result.issues.length + ' rows need attention. Open the Issues tab, correct the source rows, then refresh.' : guidance).setWrap(true).setFontColor(result.issues.length ? '#a33f1d' : '#526079');
    sh.getRange('A30:H31').merge().setValue('More tools are in the Automations menu: preview a brief, collect responses with a Form, or reveal detailed calculations. Nothing creates or shares files until you explicitly enable it.').setWrap(true).setFontSize(10).setFontColor('#526079');
    const formId = Book.state('formId'), reportId = Book.state('reportId');
    if (formId) DiscoveryHome.urlLink(sh, 'A33:D34', 'Open intake Form editor →', 'https://docs.google.com/forms/d/' + encodeURIComponent(formId) + '/edit');
    if (reportId) DiscoveryHome.urlLink(sh, 'E33:H34', 'Open discovery report →', 'https://docs.google.com/document/d/' + encodeURIComponent(reportId) + '/edit');
    DiscoveryHome.visibility(result.issues.length > 0);
    if (Book.state('layoutVersion') !== DiscoveryHome.VERSION) {
      const previous = ss.getActiveSheet();
      ['Start here', 'Priorities', 'Backlog', 'Settings'].forEach((name, i) => { ss.setActiveSheet(ss.getSheetByName(name)); ss.moveActiveSheet(i + 1); });
      ss.setActiveSheet(previous);
    }
    Book.state('layoutVersion', DiscoveryHome.VERSION);
  },

  visibility(hasIssues) {
    const ss = Book.open(), detailed = Book.state('showDetails') === 'yes';
    ['Start here', 'Priorities', 'Backlog', 'Settings'].forEach(name => ss.getSheetByName(name)?.showSheet());
    DiscoveryHome.DETAILS.forEach(name => {
      const sh = ss.getSheetByName(name);
      if (sh) detailed ? sh.showSheet() : sh.hideSheet();
    });
    const issues = ss.getSheetByName('Issues');
    if (issues) detailed || hasIssues ? issues.showSheet() : issues.hideSheet();
    const blank = ss.getSheetByName('Sheet1');
    if (blank && blank.getLastRow() === 0) blank.hideSheet();
    const input = ss.getSheetByName('Backlog');
    if (input) {
      input.showColumns(1, Backlog.HEADERS.length);
      if (!detailed) { input.hideColumns(6, 3); input.hideColumns(11, 9); }
      input.setFrozenColumns(2);
      input.setHiddenGridlines(true);
      [120, 300, 145, 95, 110].forEach((width, i) => input.setColumnWidth(i + 1, width));
      input.setColumnWidth(9, 105).setColumnWidth(10, 120);
    }
  },

  open() {
    const sh = Book.sheet('Start here');
    sh.showSheet(); Book.open().setActiveSheet(sh); sh.setActiveSelection('A1');
    return { summary: 'Start here shows your next three opportunities.' };
  },

  upgrade() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss || !ss.getSheetByName('Settings') || Book.state('layoutVersion') === DiscoveryHome.VERSION) return;
    Book.locked(() => {
      const opts = Settings.read(), source = opts.source === 'Demo' ? 'Demo backlog' : 'Backlog';
      const result = Backlog.evaluate(Book.read(source, Backlog.HEADERS), opts, source);
      Book.replace('Issues', Backlog.ISSUES, result.issues);
      DiscoveryHome.render(result, opts);
      DiscoveryHome.open();
    });
  },
};
