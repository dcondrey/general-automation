const Report = {
  lines(result, opts) {
    const s = Backlog.summarize(result.ranked);
    const n = value => value.toFixed(1);
    const lines = [
      ['Automation Discovery Brief', opts.source === 'Demo' ? 'DEMO — entirely fictional data' : 'Operational discovery — ' + Book.open().getName()],
      ['Baseline', s.count + ' valid processes; ' + n(s.current) + ' staff hours/week including rework.'],
      ['Potential', n(s.potential) + ' hours/week removable; annual capacity value ' + Math.round(s.annual).toLocaleString('en-US') + ' in your configured currency. Includes work already live.'],
      ['Observed', s.measured === null ? 'Not measured yet.' : n(s.measured) + ' hours/week measured across ' + s.measuredCount + ' live processes; all other processes remain unmeasured.'],
      ['Coverage', result.issues.length + ' invalid rows excluded. Check Issues before acting on this brief. Confirm that process baselines do not overlap.'],
      ['Assumptions', opts.weeksPerYear + ' working weeks/year; cost ' + opts.hourlyCost + '/hour; blank effort uses ' + opts.defaultBuildHours + 'h (' + opts.deleteHours + 'h to delete). Capacity value is not cash savings.'],
    ];
    s.top.forEach((r, i) => lines.push(['Next ' + (i + 1), r.action + ': ' + r.process + ' [' + r.department + ']. Owner: ' + r.owner + '. Potential ' + n(r.saved) + 'h/week; effort ' + n(r.build) + 'h; payback ' + n(r.payback) + ' weeks.' + (r.assumptions ? ' ' + r.assumptions + '.' : '')]));
    if (!s.top.length) lines.push(['Next steps', 'No unlaunched positive-saving candidates. Review unclear processes and collect a baseline.']);
    lines.push(['Before building', 'Verify the baseline with each owner. Group overlapping work and reconcile it; simplify inputs and handoffs before writing scripts. Weekly upkeep is deducted when supplied; blank upkeep assumes zero.']);
    return lines;
  },

  preview(result, opts) {
    return Book.replace('Report preview', Template.PREVIEW, Report.lines(result, opts));
  },

  create() {
    const opts = Settings.requireFiles();
    const result = Template.refresh(true);
    if (result.issues.length) throw new OperatorError('Fix the rows listed in Issues before creating a shareable report. The preview has been refreshed.');
    if (!result.ranked.length) throw new OperatorError('Add at least one valid process to Backlog before creating a report.');
    const id = Book.state('reportId');
    let doc;
    if (id) {
      try { doc = DocumentApp.openById(id); }
      catch (_) { throw new OperatorError('The discovery report is unavailable. Ask its creator to restore it or grant access. A second report was not created.'); }
    } else {
      doc = DocumentApp.create('Automation Discovery Brief — ' + Book.open().getName());
      Book.state('reportId', doc.getId());
    }
    const lines = Report.lines(result, opts);
    const body = doc.getBody();
    // This dedicated generated Doc is rebuilt after interruptions; the preview remains intact.
    body.clear();
    body.setMarginTop(36).setMarginBottom(36).setMarginLeft(42).setMarginRight(42);
    body.editAsText().setFontFamily('Arial').setFontSize(10);
    lines.forEach((row, i) => {
      const p = body.appendParagraph(row[0] + (i === 0 ? '\n' : ': ') + row[1]);
      p.setSpacingAfter(7);
      if (i === 0) p.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    });
    doc.saveAndClose();
    Template.start(result, opts);
    return { summary: 'Discovery report refreshed. Open its link in Start here. Re-running refreshes the same dedicated Doc.' };
  },
};
