# Automation Discovery Kit — operator guide

Use this workbook to collect repetitive work, decide what should be removed or redesigned, and agree on the next three improvements. All demo entries are fictional.

## Install once

Template availability and live checks are recorded in [validation](../validation.md). Until a verified copy link is available, ask the person installing the template to follow the [developer setup](../../dev/README.md). After installation, all routine work happens in Sheets.

1. Open your own copy of the workbook. Reload it if the **Automations** menu is missing.
2. Choose **Automations → View and setup → Set up workbook**. Review Google's consent request when shown. Your organization may require an administrator's approval.
3. Read **Start here**. It opens with six fictional examples, four summary cards, and the next three opportunities. No Form, Doc, notification, or shared file is created in this mode.
4. Open **Priorities** for the complete list. The demo is selected until you choose **Automations → Use my own data**.

Setup may be run again. It creates missing tabs and refreshes generated output while retaining your input rows and Settings values. Do not rename the column headings.

## Use your own work

Choose **Automations → Use my own data**. In **Backlog**, fill one row per process using the seven visible columns:

| Column | What to enter |
| --- | --- |
| Department | The team doing the work. |
| Process | One repetitive task, with a clear start and finish. |
| Owner | Someone who can verify the process and estimate. |
| Runs/week | How often it happens. |
| Minutes/run | Minutes one person spends each time. |
| Needed? | Whether someone needs the output: Yes, No, or Unsure. |
| Redesign first? | Whether the steps should be simplified: Yes, No, or Unsure. |

Choose **Automations → Refresh priorities** to see your results on **Start here**. Open **Priorities** for all recommendations. **Issues** appears automatically when rows need correcting. Changing cells does not refresh results until you run this action. **Return to the demo** switches back without deleting your work.

The normal view has four tabs: **Start here**, **Priorities**, **Backlog**, and **Settings**. Priorities lists work still under consideration; Live and Paused processes remain in the detailed Ranked tab. Settings holds the hourly cost, working weeks, default effort, and optional file-creation switch. Leave these defaults alone while trying your first process.

## Add detail when you need it

Choose **Automations → View and setup → Show detailed tabs and fields** to reveal the optional inputs and calculation tabs. **Simplify the view** hides them again; it keeps their values.

The seven-column view assumes one person per run, no rework or upkeep, and 80% removable effort when those optional fields are blank. Default implementation effort comes from Settings. These are starting estimates, not measured results. When multiple people participate or upkeep matters, enter those details before deciding what to build. Hover over column headings for guidance.

Use **No** under Needed? only after checking whether the output is required. Use **Unsure** when its purpose or design needs investigation. Enter `10` for ten percent, without `%`; enter decimals with a period and no thousands separators. **Rework min/error** is the entire team's extra minutes per failed run. **Upkeep min/week** is the expected ongoing monitoring and maintenance effort after launch.

If two departments report the same staff time, give those rows the same **Overlap group**. All colliding rows are withheld from totals. Reconcile the source records into a single baseline before clearing the group or giving genuinely independent processes different groups.

Choose **Refresh priorities**. Read **Issues**, fix the named source rows, and refresh again. Invalid rows are excluded; the output says how many.

## Optional department intake

1. Choose **Settings → Create Google files = Yes** and keep **Data source = My backlog**.
2. Choose **Automations → More tools → Create intake form** and confirm. The Form is created unpublished, once per workbook.
3. Open its editor link at the bottom of **Start here**. Review the wording, publish it, choose the allowed responders, and distribute its responder link yourself. Do not rename, reorder, add, or remove questions.
4. Leads submit one process per response. Choose **Refresh priorities** to import new submissions. No schedule or trigger is installed.

Submission IDs prevent duplicate imports. Keep **Source ID** attached to its row when sorting; leave it blank for manual entries. Imported values can be corrected in Backlog. Response edits are disabled. If you delete an imported Backlog row, its Form response will return on the next import. Start a fresh kit and Form for the next intake period rather than clearing an old intake.

## Share the brief and measure results

Choose **Automations → More tools → Preview discovery brief** first. With file creation enabled, **More tools → Make discovery report** creates or replaces one dedicated Doc, linked at the bottom of Start here. It refuses to generate a shareable report while rows need fixing. Keep your own notes in another Doc; the generated document's contents are replaced on refresh. The kit never shares it for you.

Reveal the detailed fields. After an improvement launches, set **Status = Live**, record **Measured hours/week saved**, and enter **Measured on** as `YYYY-MM-DD`. Measure the same process boundary as the original baseline, including new upkeep. A blank value means no measurement; zero is a real result. Keep evidence and the measurement window in Notes. Start here's **Potential to reclaim** excludes Live and Paused processes; **Measured so far** shows observations separately. The detailed Dashboard retains total portfolio potential, including work already live.

## If something breaks

| What you see | What to do |
| --- | --- |
| No menu | Reload the workbook in a desktop browser; confirm you have edit access and the script was installed. |
| Google blocks authorization | Ask your Workspace administrator to review the requested Sheets, Forms, and Docs permissions. |
| A row appears in Issues | Fix that row in Backlog or Demo backlog; do not edit the generated Issues row. Rank again. |
| Another automation is running | Wait a moment and retry. Each workbook serializes its script mutations. |
| A column heading changed | Undo the heading edit or restore it from the canonical list below. Input rows are retained. |
| A Form or Doc is unavailable | Ask its creator to restore it or share it with you. Setup refuses to silently replace it. |
| Form setup was interrupted | Run Create intake form again. Existing questions and the saved Form identity are reused. |
| Output stopped halfway | Check the source data, then rank again. Rankings, dashboard, and preview can be regenerated. |
| Action completed but logging failed | Inspect the result before retrying. Restore Run log headings; do not assume the business action failed. |

**Automations → View and setup → Fix setup problems** checks configuration and source rows. Reveal detailed tabs to see **Run log**, which records recent actions without copying submitted text or raw service errors into failure entries. For a persistent Google service error, the workbook owner can inspect **Extensions → Apps Script → Executions**. Keep that diagnostic information private.

Each tab supports 2,000 input rows; each linked Form supports 2,000 submissions for this kit. The log retains roughly 500 recent actions. Sheet protections show a warning on generated tabs; they do not remove editor permissions.

## Canonical Backlog headings

```text
Department | Process | Owner | Runs/week | Minutes/run | People/run | Error rate % | Rework min/error | Needed? | Redesign first? | Automatable % | Build hours | Status | Measured hours/week saved | Measured on | Notes | Upkeep min/week | Overlap group | Source ID
```

Settings labels: **Data source**, **Create Google files**, **Hourly cost**, **Working weeks/year**, **Default build hours**, **Default deletion hours**. Other generated tab headings are defined in [the source](../../src/Template.js); restore them with help from the installer instead of deleting a tab containing your own data.
