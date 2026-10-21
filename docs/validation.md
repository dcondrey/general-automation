# Validation record

This file separates local verification from live Google execution. Update it with evidence when the runtime or bundle changes; do not infer Google behavior from the local fake services.

## Current state

- Source: Discovery v0.1 preview with a deterministic Apps Script bundle.
- Local: `npm run check` passed on 2026-10-21: Apps Script type checks, source syntax and scope checks, 30 regression tests, and reproducible bundle checks.
- Google: developer OAuth authorized, a bound spreadsheet project created, and the two-file bundle successfully pushed on 2026-10-21. A complete end-to-end Google run has not yet been recorded.
- Template: no verified public copy link yet.
- Assets: transparent PNG logo and supplied 1280×640 social banner are stored in `assets/`.

## Required Google acceptance

Use an owned test workbook with synthetic inputs. Record the workbook, bundle revision, date, actual result, and any relevant execution IDs below. Never put tokens or real business data in this file.

1. Install the bound bundle, reload the workbook, and run **Set up workbook** from the menu. Verify consent succeeds, all nine tabs are present, six fictional rows are seeded, and the real Backlog is empty.
2. Run setup a second time. Confirm Settings values and input rows are retained, demo rows are not doubled, and the dashboard has one chart.
3. Rank the demo. Confirm all five decision types appear, six rows are valid, and the first recommendation is deleting the duplicate metrics sheet. Check the dashboard's SUM/COUNT/QUERY results and the chart against Ranked, with no formula errors.
4. Switch to My backlog. Enter the inventory example in the README, including 30 minutes of weekly upkeep. Confirm 7.6667 current hours, 5.6333 net potential hours, and 1.4201 payback weeks before display rounding.
5. Mark two independent-looking rows with the same Overlap group. Confirm both are withheld and named in Issues. Correct the overlap and confirm both can return after independent baselines are established.
6. Paste invalid data, including a numeric-looking string with a comma and a formula-looking process name. Confirm row validation catches malformed numbers and externally imported formula-like text remains literal. Pasting an actual formula into a cell as an editor is outside the import-write protection boundary.
7. Enable Google file creation. Create the unpublished intake Form twice; confirm its identity and question count stay constant. Publish it manually with appropriate responder access, submit one fictional process, and rank twice. Confirm one Backlog row with the same submission ID.
8. Fix all Issues, generate the discovery Doc twice, and confirm the same dedicated Doc is refreshed. Confirm bad rows block a shareable report and remain visible in the preview.
9. Add a dated Live observation, then an explicit zero observation. Verify missing observations remain distinct from zero, and chart values agree with the selected processes. Future dates and impossible savings must fail.
10. Make a copy of a test workbook that already has a Form and report. Run setup and create resources in the copy. Verify the source Form, source Doc, and source input rows are untouched and the copy receives different resource IDs.
11. Execute the [formula cookbook fixture](../sheets/formulas.md). Verify measured-subset potential `7`, measured sum `4`, coverage `2/3`, and the custom function `10.5`.
12. Prepare a fresh demo-only template. Leave Demo selected, file creation disabled, the real Backlog blank, and no links to live intake or report resources. Share only the synthetic template as view-only, verify a copy includes the bound script and menu, and publish its copy link in the README and operator guide.

## Evidence

The local final gate passed with Node 26.8.1; CI targets Node 24 from `.nvmrc`. Google accepted the bound project and bundle upload. No complete live acceptance run recorded yet. Local service fakes exercise orchestration and failures but do not calculate formulas, show dialogs, authorize scopes, publish Forms, or prove Google's copy behavior.
