function onOpen() {
  SpreadsheetApp.getUi().createMenu('Automations')
    .addItem('Set up workbook', 'setupWorkbook')
    .addItem('Rank my backlog', 'rankBacklog')
    .addSeparator()
    .addItem('Create intake form', 'createIntakeForm')
    .addItem('Make discovery report', 'makeDiscoveryReport')
    .addSeparator()
    .addItem('Fix setup problems', 'checkSetup')
    .addToUi();
}

function setupWorkbook() { return operatorAction_('Set up workbook', Template.setup); }
function rankBacklog() { return operatorAction_('Rank my backlog', () => Template.refresh(true)); }
function checkSetup() { return operatorAction_('Fix setup problems', Template.doctor); }

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
