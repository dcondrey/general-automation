const Intake = {
  FIELDS: [
    { title: 'Department', max: 100 },
    { title: 'Process', max: 160, help: 'Describe one process, with a clear start and finish.' },
    { title: 'Owner', max: 100, help: 'Who can verify the steps and baseline? A team role is fine.' },
    { title: 'Runs/week', min: 0, max: 100000 },
    { title: 'Minutes/run', min: 0, max: 10080, help: 'Minutes per person per run, excluding rework.' },
    { title: 'People/run', min: 1, max: 10000, optional: true, help: 'Blank means one person.' },
    { title: 'Error rate %', min: 0, max: 100, optional: true, help: 'Enter 10 for 10%. Blank means zero.' },
    { title: 'Rework min/error', min: 0, max: 10080, optional: true, help: 'Total team minutes per failed run. Blank means zero.' },
    { title: 'Needed?', choices: ['Yes', 'No', 'Unsure'], help: 'Does anyone use or require the output?' },
    { title: 'Redesign first?', choices: ['Yes', 'No', 'Unsure'], help: 'Could the steps be simplified before automating?' },
    { title: 'Automatable %', min: 0, max: 100, optional: true, help: 'Estimated share removable. Blank assumes 80%; use zero to keep manual.' },
    { title: 'Build hours', min: 0.01, max: 100000, optional: true, help: 'Include rollout and training. Blank uses the workbook default.' },
    { title: 'Notes', max: 1000, optional: true, help: 'Dependencies, current tools, or why the work might be unnecessary. Do not include credentials or customer data.' },
    { title: 'Upkeep min/week', min: 0, max: 10080, optional: true, help: 'Expected weekly monitoring and maintenance after launch. Blank means zero; this is deducted from potential savings.' },
    { title: 'Overlap group', max: 100, optional: true, help: 'Use the same short name for processes that count the same staff time, including across teams. The owner must reconcile them before their savings are counted.' },
  ],

  open() {
    const id = Book.state('formId');
    if (!id) return null;
    try { return FormApp.openById(id); }
    catch (_) { throw new OperatorError('The intake Form is unavailable. Ask its creator to restore it or grant you access. Setup will not create a duplicate.'); }
  },

  validate(form) {
    const items = form.getItems();
    if (items.length > Intake.FIELDS.length || items.some((item, i) => (item.getTitle() !== Intake.FIELDS[i].title && !(Book.state('formReady') !== 'yes' && item.getTitle() === '')) ||
      item.getType() !== (Intake.FIELDS[i].choices ? FormApp.ItemType.MULTIPLE_CHOICE : FormApp.ItemType.TEXT))) {
      throw new OperatorError('The intake Form questions changed. Restore the original question titles, order, and types before importing. Existing submissions have been kept.');
    }
    return items.length;
  },

  create() {
    Settings.requireFiles();
    let form = Intake.open();
    if (!form) {
      form = FormApp.create('Automation Discovery — ' + Book.open().getName(), false);
      Book.state('formId', form.getId());
    }
    Intake.validate(form);
    if (Book.state('formReady') !== 'yes') Intake.FIELDS.forEach((field, index) => {
      const existing = form.getItems()[index];
      const item = existing ? (field.choices ? existing.asMultipleChoiceItem() : existing.asTextItem()) : field.choices ? form.addMultipleChoiceItem() : form.addTextItem();
      if (field.choices) /** @type {GoogleAppsScript.Forms.MultipleChoiceItem} */ (item).setChoiceValues(field.choices);
      item.setTitle(field.title).setRequired(!field.optional).setHelpText(field.help || '');
      if (!field.choices) {
        const validation = FormApp.createTextValidation();
        if (field.min !== undefined) validation.requireNumberBetween(field.min, field.max);
        else validation.requireTextLengthLessThanOrEqualTo(field.max);
        /** @type {GoogleAppsScript.Forms.TextItem} */ (item).setValidation(validation.setHelpText(field.min !== undefined ? 'Enter a number from ' + field.min + ' to ' + field.max + '.' : 'Use at most ' + field.max + ' characters.').build());
      }
    });
    form.setDescription('Tell us about repetitive work. Submit one process at a time. Estimates are fine; choose Unsure when the purpose or design needs discovery. Never enter passwords, tokens, or customer records.')
      .setConfirmationMessage('Saved. The workbook owner will import submissions when they choose Refresh priorities.')
      .setCollectEmail(false).setAllowResponseEdits(false).setPublishingSummary(false);
    Book.state('formReady', 'yes');
    Template.refresh(false);
    return { summary: 'Intake Form is ready. Open its link in Start here, review access, and publish it in Google Forms. Re-running this action reuses the same Form.' };
  },

  plan(responses, existingRows) {
    const ids = new Set(existingRows.map(row => row[18]).filter(Boolean));
    const rows = [];
    responses.forEach(response => {
      const id = response.getId();
      if (typeof id !== 'string' || !id || id.length > 180) throw new OperatorError('A Form submission has an invalid identifier. Open the Form responses before retrying.');
      const source = 'form:' + id;
      if (ids.has(source)) return;
      const answers = {};
      response.getItemResponses().forEach(answer => {
        const title = answer.getItem().getTitle();
        if (!Intake.FIELDS.some(field => field.title === title) || Object.prototype.hasOwnProperty.call(answers, title)) {
          throw new OperatorError('A submission uses unexpected questions. Restore the Form questions before importing.');
        }
        const value = answer.getResponse();
        if (typeof value !== 'string' || value.length > 1000) throw new OperatorError('A submission contains unexpected or oversized data. Review it in Google Forms.');
        answers[title] = value;
      });
      answers.Status = 'Planned';
      answers['Source ID'] = source;
      rows.push(Backlog.HEADERS.map(title => answers[title] === undefined ? '' : answers[title]));
      ids.add(source);
    });
    if (existingRows.length + rows.length > Book.MAX_ROWS) throw new OperatorError('Import would exceed 2,000 Backlog rows. Archive older submissions first; none were imported.');
    return rows;
  },

  sync() {
    Settings.requireFiles();
    const form = Intake.open();
    if (!form) return 0;
    if (Book.state('formReady') !== 'yes' || Intake.validate(form) !== Intake.FIELDS.length) throw new OperatorError('Intake setup is incomplete. Run Create intake form again.');
    const responses = form.getResponses();
    if (responses.length > Book.MAX_ROWS) throw new OperatorError('The intake Form exceeds 2,000 submissions. Start a fresh Discovery workbook and Form for the next intake period.');
    const rows = Intake.plan(responses, Book.read('Backlog', Backlog.HEADERS));
    Book.append('Backlog', Backlog.HEADERS, rows);
    return rows.length;
  },
};
