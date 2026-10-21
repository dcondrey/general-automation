# Team Handoffs — operator guide

Install with `npm run setup -- handoffs` using the [developer guide](../../dev/README.md). Choose **Automations → Set up workbook**. The bundle requests the current spreadsheet, external requests, and the connection sidebar.

## Preview the transfer

Keep **Mode = Demo** and choose **Run handoffs**. **Demo handoffs** contains a fictional supply-chain-to-catalog transfer. **Preview** shows the exact next-team inputs; nothing is posted. [Inspect the Asana payload](../../examples/handoff-preview.json).

## Prepare live handoffs

Fill **Handoffs** with one unique **Handoff key** per business transfer. Include the next team, task name, destination Project ID, SKU, ASIN, HTTPS asset link, and a useful brief. Source Asana task ID, assignee ID, and due date are optional. The installer formats ID columns as plain text; keep them that way because long numeric IDs can be rounded by Sheets.

Use **Ready? = Yes** only when the inputs are complete and the transfer is approved. If you provide a source Asana task ID, it must also be confirmed complete by Asana before the destination task is created. Without it, Ready? is the manual completion gate.

Save an Asana personal token in **Connections**, choose **Mode = Live**, and select **Run handoffs**. Up to five new tasks are created per action. The token's Asana identity needs access to the source task and destination project. Every destination task contains the stable handoff marker and the receiving team's inputs.

Successful keys are not sent again. Changing a payload after a send produces a review message; it does not overwrite the destination or create another task. Edit the existing task deliberately, or use a new key for genuinely new work.

## Recover an unconfirmed write

The ledger records **Unknown** before sending a task creation request. If the network fails after Asana accepts the task, another run will hold that key instead of duplicating the task.

Choose **Reconcile unknown handoffs**. It searches the configured destination project, up to 1,000 tasks across paginated responses, for the exact marker. One match after a complete search links the existing task as Reconciled. No matches, multiple matches, changed input fingerprints, or an incomplete search keep the write held for manual investigation. Reconciliation never creates a task or silently authorizes a second attempt.

Keep **Handoff ledger** intact. If you remove its history or start another independently configured workbook with the same business keys, it cannot provide cross-workbook deduplication. There is no claim of distributed exactly-once delivery.

## Make and Zapier

An existing Make/Zapier scenario can populate a Handoffs row from a completed upstream task, using a stable source-derived key and the required catalog inputs. The operator then runs the validated handoff. This release supplies the contract and completion check; it does not claim an imported, authenticated, production-run Make/Zapier scenario. Validate the actual scenario with your own accounts before enabling any recurring flow. Avoid a second scenario that independently creates the same destination task.

For failures, inspect **Run log**, **Preview**, and the specific ledger state. Check permissions and IDs for authorization errors. Inspect Asana before retrying an unknown write. No schedule or public webhook is installed.

Primary references: [create task](https://developers.asana.com/reference/createtask), [get a task](https://developers.asana.com/reference/gettask), [project tasks](https://developers.asana.com/reference/gettasksforproject), and [pagination](https://developers.asana.com/docs/pagination). Live-account acceptance is tracked in [validation](../validation.md).
