const RunLog = {
  HEADERS: ['Started', 'Action', 'Status', 'Seconds', 'What happened'],

  record(name, started, status, detail) {
    const sh = Book.sheet('Run log', RunLog.HEADERS);
    if (sh.getLastRow() > 501) sh.deleteRows(2, sh.getLastRow() - 501);
    Book.append('Run log', RunLog.HEADERS, [[new Date(started), name, status, (Date.now() - started) / 1000, detail.slice(0, 500)]]);
  },

  run(name, fn) {
    const started = Date.now();
    let result;
    try {
      result = Book.locked(fn);
    } catch (error) {
      try { Book.locked(() => RunLog.record(name, started, 'Needs attention', 'Action stopped. Use Fix setup problems and check Issues.')); }
      catch (_) { console.error('Could not record the failed action. Check workbook access.'); }
      throw error;
    }
    try { Book.locked(() => RunLog.record(name, started, 'Done', result && result.summary || 'Completed.')); }
    catch (_) {
      throw new OperatorError('The action completed, but the Run log could not be updated. Check the results before retrying; restore Run log headings if they changed.');
    }
    return result;
  },
};
