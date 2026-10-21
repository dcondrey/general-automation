# Discovery design decisions

The deliverable is a ranked list of manual work priced in staff hours per week, followed by a small set of validated improvements and observed results. Counting scripts shipped would encourage automating a process that should disappear.

## Decision and scoring contract

Input times use one consistent boundary: runs/week × (minutes per participating person × people + expected total team rework minutes) / 60. Error rate is a percentage of runs; rework minutes already includes the team's effort. Fractional frequency supports processes that run less than weekly.

Needed? = No removes the whole baseline. Needed? = Unsure or unresolved redesign produces no savings claim. A known process with a zero removable share or upkeep that consumes its gross benefit stays manual. Redesign comes before automation and its estimate remains conditional. Required work must not be marked unnecessary merely because it is tedious.

Net weekly benefit is gross removable hours less weekly upkeep, floored at zero. Build effort includes implementation, rollout, training, and handoff. Rank descending by net benefit per build hour, then net hours, then source row. Payback is undefined when benefit is zero. Annual capacity value assumes constant workload and cost across the configured working weeks; it does not estimate layoffs, recovered revenue, or a cash budget reduction.

Potential includes live processes. The next-three list excludes Live and Paused entries. Measured savings are independent observations for Live rows with a date and cannot exceed the baseline. This release supports one current observation per process, not a longitudinal causal study.

## Overlap and missing evidence

An explicit normalized Overlap group appearing more than once blocks every otherwise-valid row in that group. The tool does not silently choose a winner or sum the rows. Operators must merge shared work into a defensible baseline or establish that the rows measure independent effort. Unmarked overlap cannot be detected reliably from short descriptions. Estimates and measurement evidence still require owner review.

Invalid rows are isolated in Issues with source row numbers and excluded from outputs. The report preview states the excluded count. Generating a shareable report requires no outstanding row issues and at least one valid row. Every default effort or removable-share assumption is disclosed in Ranked.

## Resource ownership and recovery

- The active container is the only spreadsheet the runtime opens. No spreadsheet IDs or secrets are entered in cells.
- Saved Form and report IDs are namespaced by the current workbook ID in document properties. Copying a workbook therefore starts a separate resource namespace even if properties were copied.
- A document lock serializes script mutations. A failed acquisition gives a short retry message. There are no async calls or waits while holding the lock; Apps Script service I/O is synchronous and stays inside the critical section to protect read-modify-write sequences. Manual edits are not locked by this mechanism; operators should finish entering rows before running a menu action.
- A created Form ID is checkpointed before questions are configured. Incomplete setup reuses and reconfigures the expected question prefix, including a partially initialized item. A ready Form's question structure is validated before import.
- Submissions are identified by immutable Form response ID in the source row. A repeated import or a retry after a successful append cannot create another row with that ID. Deleting the source row removes that deduplication record and makes it eligible again; start a fresh workbook at the next intake period.
- Derived sheets are rebuildable. Input sheets are never cleared by ranking or setup. Input headers are validated before writes. A missing linked Google resource produces an error rather than a silent replacement.
- The dedicated report Doc is generated content and is replaced on refresh. Its identity is checkpointed before writing so a failed write can be retried. Content replacement is recoverable, not an atomic Google Docs transaction. Keep human notes outside that Doc.
- Routine failure log entries contain fixed operator instructions, not submitted text, raw Google errors, or HTTP payloads. Log-write failure after a successful action is reported as such.
- External strings written through the sheet adapter are escaped when they could be interpreted as formulas. Only fixed formulas authored in this repository use `setFormula`.

## Scope and distribution

Each suite will be a separately bundled template. The Discovery bundle has current-spreadsheet access plus Forms and Docs scopes, because it creates and reopens those resources. It deliberately has no HTTP, trigger, Drive service, Gmail, Slack, Asana, or LLM code. The source manifest is the permission contract. Forms and Docs permissions apply to those services broadly; a settings toggle cannot narrow the consent grant.

The build explicitly lists the release files, concatenates them without third-party runtime code, and copies the explicit manifest. Generated output is checked into Git for inspection and reproducibility. A developer installs a bound script once; operators copy and use the workbook through its menu. A publicly copyable template must contain only synthetic data and must pass the live validation checklist first.

Primary references: [bound-script copy behavior](https://developers.google.com/apps-script/guides/bound), [authorization](https://developers.google.com/apps-script/guides/services/authorization), [FormApp creation and publish state](https://developers.google.com/apps-script/reference/forms/form-app), [document properties](https://developers.google.com/apps-script/reference/properties/properties-service), and [clasp](https://developers.google.com/apps-script/guides/clasp).
