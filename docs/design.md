# Discovery design decisions

The deliverable is a ranked list of manual work priced in staff hours per week, followed by a small set of validated improvements and observed results. Counting scripts shipped would encourage automating a process that should disappear.

## Decision and scoring contract

Input times use one consistent boundary: runs/week × (minutes per participating person × people + expected total team rework minutes) / 60. Error rate is a percentage of runs; rework minutes already includes the team's effort. Fractional frequency supports processes that run less than weekly.

Needed? = No removes the whole baseline. Needed? = Unsure or unresolved redesign produces no savings claim. A known process with a zero removable share or upkeep that consumes its gross benefit stays manual. Redesign comes before automation and its estimate remains conditional. Required work must not be marked unnecessary merely because it is tedious.

Net weekly benefit is gross removable hours less weekly upkeep, floored at zero. Build effort includes implementation, rollout, training, and handoff. Rank descending by net benefit per build hour, then net hours, then source row. Payback is undefined when benefit is zero. Annual capacity value assumes constant workload and cost across the configured working weeks; it does not estimate layoffs, recovered revenue, or a cash budget reduction.

Detailed portfolio potential includes live processes. The Start here potential card, Priorities list, and next-three list exclude Live and Paused entries, so delivered work does not appear as an additional opportunity. Measured savings are independent observations for Live rows with a date and cannot exceed the baseline. This release supports one current observation per process, not a longitudinal causal study.

## Operator view

Four tabs are visible by default: Start here, Priorities, Backlog, and Settings. Start here presents the selected data source, four summary cards, and three recommendations. Backlog initially exposes the seven required inputs; optional fields and their values remain intact behind the detailed-view menu. Issues appears automatically when a source row needs attention. Detailed calculations, the report preview, demo inputs, and run log are available through the menu.

The data-source actions change one setting and regenerate output; neither action deletes input rows or enables file creation. The layout migration runs once per workbook revision when opened. It rebuilds owned output and changes visibility without changing source values, settings, or saved Form and Doc identities. Its version is recorded only after the layout is complete, so an interrupted migration can be retried.

The guided workspace runs inside a bound HTML dialog, with no public endpoint. Its RPC dispatcher permits only explicit actions and uses the active workbook. The server validates every process field, request identifier, source reference, date, and measurement. User text is rendered with DOM text methods, and sheet writes use the formula-safe adapter. Browser buttons are disabled during requests; writes remain protected by the document lock and server-side checks.

Guided intake uses a client-generated cryptographic UUID as its submission identity. An unconfirmed request can be repeated without appending another process. Planning adds a stable identity to an anonymous manual row only when needed. Lookups use that identity after sorting; row revisions reject stale source edits, and separate plan revisions reject overwritten annotations. Plans whose sources disappear or become invalid remain visible as unresolved references rather than being discarded.

Measurement history records intent before updating the current source observation. It checkpoints the original request, a source identity, and both before/after content hashes. A retry or explicit resume may finish an unchanged source or acknowledge an already-applied update. Any other source revision remains held. The completion mark is written last; a completed request can never overwrite a later observation. Spreadsheet Date values are normalized to the workbook's calendar date before hashing. Current savings come from Backlog, while history is an audit trail, not an additive savings ledger.

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

Each suite is a separately bundled template. The Discovery bundle has current-spreadsheet access, an in-workbook dialog scope, and Forms and Docs scopes, because it creates and reopens those resources. It deliberately has no HTTP, trigger, Drive service, Gmail, Slack, Asana, or LLM code. The source manifest is the permission contract. Forms and Docs permissions apply to those services broadly; a settings toggle cannot narrow the consent grant.

The build explicitly lists the release files, concatenates them without third-party runtime code, and copies the explicit manifest. Generated output is checked into Git for inspection and reproducibility. A developer installs a bound script once; operators copy and use the workbook through its menu. A publicly copyable template must contain only synthetic data and must pass the live validation checklist first.

## Additional suite contracts

Marketplace Watch validates an entire snapshot before updating derived output. Dated inbound is eligible only if it arrives before initial stock depletion; missing or stale evidence cannot resolve a prior business signal. Signal keys retain acknowledgements and snoozes. A digest marks intent before sending and holds an uncertain delivery rather than retrying automatically.

AI Sorter separates the deterministic baseline from live model suggestions. A request identity covers input, labels, model, and prompt version. Intent is recorded before generation; interrupted or invalid output stays held. Generation is limited to two new items per run. The cost gate uses provider-counted prompt tokens and configured rates with a capped output allowance; it remains an estimate, not a billing guarantee. Predictions are suggestions and cannot call business tools. Evaluation compares the current classifier and baseline on the same matching human-labeled examples.

Team Handoffs validates the receiving team's inputs before any creation request. Optional source tasks must be confirmed complete. A source-derived key and payload fingerprint prevent a repeated run or changed payload from blindly creating another task. Unknown writes are reconciled through a bounded, paginated destination search for an exact marker. No match is not proof of non-delivery, so it never silently authorizes a second write.

Integration credentials use user properties namespaced by workbook ID. They are not shared with other editors or reused by copied containers. These three suites have separate current-spreadsheet, HTTP, and sidebar permission bundles; none inherits Discovery's Forms/Docs scopes. Re-running setup in Live mode does not generate AI output or create Asana tasks; operators invoke those actions explicitly.

Primary references: [bound-script copy behavior](https://developers.google.com/apps-script/guides/bound), [authorization](https://developers.google.com/apps-script/guides/services/authorization), [FormApp creation and publish state](https://developers.google.com/apps-script/reference/forms/form-app), [document properties](https://developers.google.com/apps-script/reference/properties/properties-service), and [clasp](https://developers.google.com/apps-script/guides/clasp).
