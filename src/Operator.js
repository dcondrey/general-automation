function operatorAction_(name, fn) {
  try {
    const result = RunLog.run(name, fn);
    Book.open().toast(result.summary, 'Automations', 10);
    return result;
  } catch (error) {
    const message = error instanceof OperatorError ? error.message :
      'This action could not finish. Check Settings, Run log, Google permissions, and workbook access. If it persists, ask the workbook owner to inspect Apps Script → Executions.';
    SpreadsheetApp.getUi().alert('Automations needs attention', message, SpreadsheetApp.getUi().ButtonSet.OK);
    return { error: message };
  }
}
