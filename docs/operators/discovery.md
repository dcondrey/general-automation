# Automation Discovery Kit — operator guide

Use this workbook to collect repetitive work, decide what should be removed or redesigned, and agree on the next three improvements. All demo entries are fictional.

## Install once

Template availability and live checks are recorded in [validation](../validation.md). Until a verified copy link is available, ask the person installing the template to follow the [developer setup](../../dev/README.md). After installation, all routine work happens in Sheets.

1. Open your own copy of the workbook. Reload it if the **Automations** menu is missing.
2. Choose **Automations → Set up workbook**. Review Google's consent request when shown. Your organization may require an administrator's approval.
3. Keep **Settings → Data source = Demo** and **Create Google files = No** for the first run.
4. Choose **Rank my backlog**, then read **Ranked**, **Dashboard**, and **Report preview**. No Form, Doc, notification, or shared file is created in this mode.

Setup may be run again. It creates missing tabs and refreshes generated output while retaining your input rows and Settings values. Do not rename the column headings.

## Use your own work

In **Settings**, choose **My backlog**. Adjust your hourly cost and working weeks. In **Backlog**, fill one row per process using the yellow cells and dropdowns. Notes on the heading cells explain each input. Required inputs are department, process, owner, runs/week, minutes/run, Needed?, and Redesign first?. Blank optional values have documented defaults.

Use **No** under Needed? only after checking whether the output is required. Use **Unsure** when its purpose or design needs investigation. Enter `10` for ten percent, without `%`; enter decimals with a period and no thousands separators. **Rework min/error** is the entire team's extra minutes per failed run. **Upkeep min/week** is the expected ongoing monitoring and maintenance effort after launch.

If two departments report the same staff time, give those rows the same **Overlap group**. All colliding rows are withheld from totals. Reconcile the source records into a single baseline before clearing the group or giving genuinely independent processes different groups.

Choose **Rank my backlog**. Read **Issues**, fix the named source rows, and rank again. Invalid rows are excluded; the output says how many. Changing source inputs does not refresh outputs until you run the menu action.

## Optional department intake

1. Choose **Settings → Create Google files = Yes** and keep **Data source = My backlog**.
2. Choose **Create intake form** and confirm. The Form is created unpublished, once per workbook.
3. Open its editor link in **Start here**. Review the wording, publish it, choose the allowed responders, and distribute its responder link yourself. Do not rename, reorder, add, or remove questions.
4. Leads submit one process per response. Choose **Rank my backlog** to import new submissions. No schedule or trigger is installed.

Submission IDs prevent duplicate imports. Keep **Source ID** attached to its row when sorting; leave it blank for manual entries. Imported values can be corrected in Backlog. Response edits are disabled. If you delete an imported Backlog row, its Form response will return on the next import. Start a fresh kit and Form for the next intake period rather than clearing an old intake.

## Share the brief and measure results

Read **Report preview** first. With file creation enabled, **Make discovery report** creates or replaces one dedicated Doc. It refuses to generate a shareable report while rows need fixing. Keep your own notes in another Doc; the generated document's contents are replaced on refresh. The kit never shares it for you.

After an improvement launches, set **Status = Live**, record **Measured hours/week saved**, and enter **Measured on** as `YYYY-MM-DD`. Measure the same process boundary as the original baseline, including new upkeep. A blank value means no measurement; zero is a real result. Keep evidence and the measurement window in Notes. The dashboard shows measured results separately from potential.

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

**Fix setup problems** checks configuration and source rows. **Run log** records recent actions without copying submitted text or raw service errors into failure entries. For a persistent Google service error, the workbook owner can inspect **Extensions → Apps Script → Executions**. Keep that diagnostic information private.

Each tab supports 2,000 input rows; each linked Form supports 2,000 submissions for this kit. The log retains roughly 500 recent actions. Sheet protections show a warning on generated tabs; they do not remove editor permissions.

## Canonical Backlog headings

```text
Department | Process | Owner | Runs/week | Minutes/run | People/run | Error rate % | Rework min/error | Needed? | Redesign first? | Automatable % | Build hours | Status | Measured hours/week saved | Measured on | Notes | Upkeep min/week | Overlap group | Source ID
```

Settings labels: **Data source**, **Create Google files**, **Hourly cost**, **Working weeks/year**, **Default build hours**, **Default deletion hours**. Other generated tab headings are defined in [the source](../../src/Template.js); restore them with help from the installer instead of deleting a tab containing your own data.
