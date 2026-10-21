function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Automations')
    .addItem('Start here', 'openDiscoveryHome')
    .addItem('Refresh priorities', 'rankBacklog')
    .addItem('Use my own data', 'useOwnBacklog')
    .addItem('Return to the demo', 'useDemoBacklog')
    .addSeparator()
    .addSubMenu(ui.createMenu('More tools')
      .addItem('Preview discovery brief', 'previewDiscoveryBrief')
      .addItem('Create intake form', 'createIntakeForm')
      .addItem('Make discovery report', 'makeDiscoveryReport'))
    .addSubMenu(ui.createMenu('View and setup')
      .addItem('Show detailed tabs and fields', 'showDiscoveryDetails')
      .addItem('Simplify the view', 'hideDiscoveryDetails')
      .addItem('Set up workbook', 'setupWorkbook')
      .addItem('Fix setup problems', 'checkSetup'))
    .addToUi();
  try { DiscoveryHome.upgrade(); }
  catch (_) { console.error('Workbook layout update failed. Run Set up workbook from the Automations menu.'); }
}

function setupWorkbook() { return operatorAction_('Set up workbook', Template.setup); }
function rankBacklog() { return operatorAction_('Refresh priorities', () => { const result = Template.refresh(true); DiscoveryHome.open(); return result; }); }
function checkSetup() { return operatorAction_('Fix setup problems', Template.doctor); }
function openDiscoveryHome() { return operatorAction_('Open start page', DiscoveryHome.open); }
function useOwnBacklog() {
  return operatorAction_('Use my own data', () => {
    Settings.chooseSource('My backlog');
    const result = Template.refresh(false), sh = Book.open().getSheetByName('Backlog');
    Book.open().setActiveSheet(sh); sh.setActiveSelection('A2');
    return result;
  });
}
function useDemoBacklog() {
  return operatorAction_('Return to demo', () => { Settings.chooseSource('Demo'); const result = Template.refresh(false); DiscoveryHome.open(); return result; });
}
function showDiscoveryDetails() {
  return operatorAction_('Show details', () => { Book.state('showDetails', 'yes'); DiscoveryHome.visibility(false); return { summary: 'Detailed inputs, calculations, and support tabs are visible.' }; });
}
function hideDiscoveryDetails() {
  return operatorAction_('Simplify view', () => { Book.state('showDetails', 'no'); const result = Template.refresh(false); DiscoveryHome.open(); return result; });
}
function previewDiscoveryBrief() {
  return operatorAction_('Preview discovery brief', () => { const result = Template.refresh(false); const sh = Book.open().getSheetByName('Report preview'); sh.showSheet(); Book.open().setActiveSheet(sh); return result; });
}

function createIntakeForm() {
  const ui = SpreadsheetApp.getUi();
  if (ui.alert('Create intake form', 'This creates or finishes one Form in your Google account. It stays unpublished until you publish it yourself. Continue?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  return operatorAction_('Create intake form', Intake.create);
}

function makeDiscoveryReport() {
  const ui = SpreadsheetApp.getUi();
  if (ui.alert('Refresh discovery report', 'This creates or replaces the contents of the dedicated report Doc linked in Start here. Keep your own notes in a different Doc. Continue?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  return operatorAction_('Make discovery report', Report.create);
}
