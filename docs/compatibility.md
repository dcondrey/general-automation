# Compatibility and limits

The four templates are implemented previews. Local checks exercise the source and simulated service boundaries; they do not prove Google authorization, external account access, or production adoption.

| Surface | Checked | Still requires account-level verification |
| --- | --- | --- |
| Discovery workbook | Google setup, simplified layout, source switching, formula outputs, guided workspace loading. | Guided edits and writes, Forms submissions, generated Docs, and copied-resource isolation. |
| Guided workspace | Chrome intake, editing, status filters, retry behavior, safe text rendering, action plans, and interrupted measurements with synthetic adapters. | Complete the same actions in the owned Google workbook. |
| Marketplace Watch | Input validation, inbound timing, stale feeds, signal lifecycle, digest batching, uncertain delivery. | Approved representative feeds and a real Slack delivery with a no-repeat check. |
| AI Sorter | Output schemas, deterministic baseline, token controls, held requests, usage records, matched-set evaluation. | An authorized provider request, account pricing, and representative labeled feedback. |
| Team Handoffs | Required inputs, completion gate, replay protection, uncertain-write reconciliation. | Create and repeat a task in an owned Asana test project; reconcile an interrupted acknowledgement. |

No public copy link is available yet. The Make/Zapier contract is an integration example, not an executed platform scenario. The keyword fixture is not an LLM benchmark. Example capacity values are estimates, not demonstrated business savings.

## Runtime limits

- Each input or history table supports **2,000 rows**. Action plan and Savings history limits include both demo and own-data records. Start a new workbook for another intake period rather than deleting audit rows.
- Each imported text cell supports **2,000 characters**; individual fields may have smaller limits.
- The workspace searches all processes and shows up to **100 matching cards** at once. Narrow the search to find another process.
- Imports run on demand. A Form supports **2,000 submissions per intake period**. Deleting an imported row makes that response eligible for import again.
- Current source rows determine current results. Invalid and overlapping baselines are excluded and remain visible for correction.
- Document locks serialize script writes. Manual sheet edits do not participate in that lock; finish cell edits before running an action.
- Forms and report Docs have their own Google sharing permissions. Their owner must share access with other operators when needed.

## Retry behavior

| Action | Recovery |
| --- | --- |
| New process | Retry the same save to keep one source row. |
| Edit process | An already-applied change is acknowledged; a changed source is held for refresh. |
| Record measurement | Intent is saved before the source observation. Use **Finish interrupted save**; changed source data stays held. |
| Refresh outputs | Inputs survive a derived-output failure; refresh again after correcting headings or Settings. |
| Slack, Gemini, Asana | Unknown delivery stays held for human review or reconciliation; a timeout never authorizes a blind repeat. |

## Verify a Google installation

Use synthetic inputs in an owned workbook before distributing a template:

1. Run setup twice; confirm four Discovery tabs, six demo rows, one chart, and unchanged Settings and real inputs.
2. Add the [inventory example](calculations.md) through the workspace; confirm **7.6667** baseline hours and **5.6333** net hours before rounding.
3. Edit its owner and inputs, preview the result, save, reload, and confirm the existing row and plan remain attached. Pause and resume its status without deleting it.
4. Give two rows the same overlap group; confirm both are excluded. Correct their baselines and confirm the Issues count clears.
5. Save a next step, then a dated observed saving with evidence. Record zero as a second observation; confirm history retains both while the total uses only the current result.
6. Enable file creation, create the unpublished Form twice, and verify one identity. Publish with suitable responder access, submit once, refresh twice, and confirm one imported row. Generate the report twice and verify the same dedicated Doc.
7. Copy a synthetic workbook with saved resources; verify the copy creates different Form and Doc identities without updating the source files.
8. Execute the [formula fixtures](../sheets/formulas.md); verify measured-subset potential `7`, observed sum `4`, coverage `2/3`, and custom-function output `10.5`.

Share only a demo-only template with an empty real Backlog, file creation disabled, no live links, and no credentials. Confirm its copy includes the bound script and menu before publishing a copy link.
