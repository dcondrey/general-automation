const Connections = {
  NAMES: ['Slack webhook', 'Gemini API key', 'Asana token'],
  get(name, optional) {
    const value = PropertiesService.getUserProperties().getProperty(Book.open().getId() + ':' + name);
    if (!value && !optional) throw new OperatorError('Choose Automations → Connections and save your ' + name + '.');
    return value || '';
  },
  save(name, value) {
    if (!Connections.NAMES.includes(name) || typeof value !== 'string' || value.length < 10 || value.length > 1000 || /[\r\n\u0000]/.test(value)) throw new OperatorError('Select a supported connection and enter a valid credential.');
    if (name === 'Slack webhook' && !/^https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9_\/-]+$/.test(value)) throw new OperatorError('Use a Slack incoming webhook URL beginning https://hooks.slack.com/services/.');
    PropertiesService.getUserProperties().setProperty(Book.open().getId() + ':' + name, value);
    return 'Saved for your Google login and this workbook. Other editors enter their own credentials.';
  },
};
function showConnections() { SpreadsheetApp.getUi().showSidebar(HtmlService.createHtmlOutputFromFile('Connections').setTitle('Connections')); }
function saveConnection(name, value) { return Connections.save(name, value); }
