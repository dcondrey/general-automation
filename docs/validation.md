# Validation record

This file separates local verification from live Google execution. Update it with evidence when the runtime or bundle changes; do not infer Google behavior from the local fake services.

## Current state

- Source: four independent preview suites, each with an explicit OAuth manifest and deterministic bundle.
- Local: `npm run check` passed on 2026-10-21 with 57 tests, Apps Script service type checks, generated-bundle entry-point/scope checks, reproducible bundles, and generated examples verified across three time zones.
- Google: all four bound workbook projects were created and their complete bundles uploaded successfully on 2026-10-21. A complete end-to-end Google run has not yet been recorded.
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

Local checks run on Node 26.8.1; CI uses Node 24 from `.nvmrc`. Both the initial Discovery commit and expanded four-suite commit `295c6ae` passed hosted CI; [expanded run](https://github.com/dcondrey/general-automation/actions/runs/39584249547). All four Google uploads were confirmed: Discovery (2 files), Marketplace Watch (3), AI Sorter (3), and Team Handoffs (3). Source upload is not a runtime acceptance test. Local service fakes exercise orchestration and failures but do not calculate formulas, show dialogs, authorize scopes, publish Forms, or prove Google's copy behavior. Public template publication awaits runtime consent and the acceptance checks above. An export of the owned Discovery container still showed only its original Sheet1 before owner setup; the uploaded script has not yet initialized that workbook.

## Additional suite acceptance

| Suite | Local evidence | Required account-level acceptance |
| --- | --- | --- |
| Marketplace Watch | Demo isolation; late vs timely inbound; missing/stale data; currency and denominator guards; triage/reopen lifecycle; uncertain digest delivery; 20-item batching | Run setup and demo in Google, import a representative approved feed, exercise snoozes, and confirm one real Slack digest plus a no-repeat run. |
| AI Sorter | Strict schema; deterministic baseline; held paid request after ambiguous failure; token/rate estimate gate; usage recording; cache behavior; same-subset labeled evaluation; text-size boundary | Run setup/demo in Google, authorize a real provider key, confirm one paid classification and usage record, test representative review cases, and verify provider pricing for the account. |
| Team Handoffs | Validated payload; rounded-ID rejection; source-completion gate; replay protection; uncertain-write reconciliation; changed-input hold | Run setup/demo in Google; create a task in an owned Asana test project, verify the marker and inputs, repeat without creating another task, and reconcile a deliberately interrupted acknowledgement. |

The keyword demo is not an LLM benchmark. The Asana tests are protocol simulations, not a claim of production workflow usage. The Make/Zapier contract has not been imported or executed as a platform scenario. No paid provider requests or real Slack/Asana messages are sent by local checks.
