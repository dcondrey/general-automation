# Candidate map

Four preview suites are implemented: Discovery, Marketplace Watch, AI Sorter, and Team Handoffs. Live external-service acceptance is separate from source implementation. The remaining entries are candidates, not implied production integrations. [Prior-art review](prior-art.md) is required before extending the library.

| Original idea | Disposition | Useful extension or acceptance requirement |
| --- | --- | --- |
| 1. Automation backlog ranker | Implemented in Discovery | Net benefit after upkeep, cross-team overlap reconciliation, delete/redesign/keep-manual/investigate decisions. |
| 2. Run log and alerts | Run log in all suites; Slack digest in Marketplace Watch | Unknown deliveries stay held instead of blindly repeating. |
| 3. Runbook/SOP generator | Operator guide shipped; generator deferred | A useful runbook needs actual ownership and recovery evidence, not a template claiming completeness. |
| 4. Trigger manager and menu | Menu implemented; triggers deferred | Discovery works on demand. Add scheduling only where it saves work and document trigger ownership after copies. |
| 5. Asana handoff | Implemented preview | Validated receiving-team inputs, completion gate, intent ledger, and paginated reconciliation. |
| 6. Brand onboarding kit | Handoff configuration candidate | A checklist and owned intake may be sufficient. Reuse a verified handoff before provisioning more resources. |
| 7. Zapier/Make webhook | Handoff boundary candidate | Prefer the platform's authenticated webhook and established signing mechanisms; no anonymous endpoint in Discovery. |
| 8. HubSpot sync | Deferred | Search for maintained connectors first; implement only a measured unmet reconciliation need. |
| 9. MAP monitor | Implemented in Marketplace Watch | Approved input feeds, currency guards, authorized-seller comparison, and review queue. |
| 10. Inventory cover | Implemented in Marketplace Watch | Dated inbound, overdue exceptions, undefined zero-demand cover, and reorder point. |
| 11. Ads metrics | Implemented in Marketplace Watch | ACOS, TACOS, ROAS, guarded denominators, and a supplied comparison window. |
| 12. Catalog guardrails | Marketplace data-quality candidate | Batch validation before alerts; distinguish malformed identifiers and stale feeds from genuine business exceptions. |
| 13. Listing change audit | Deferred | Require a permitted feed and stable snapshots; avoid unverified scraping. |
| 14. Report ingestion | Deferred | Identify a report format and provenance contract; make duplicate attachments and partial imports recoverable. |
| 15. LLM categorizer | Implemented AI Sorter preview | Strict output schema, token preflight, held paid requests, prompt version, human review, and matched-set evaluation against a baseline. |
| 16. Transcript actions | Deferred | Require owner/date confirmation before creating tasks; reuse the handoff contract. |
| 17. Claims screener | Deferred | Needs a labeled evaluation set and qualified review; a risk label is not a legal determination. |
| 18. Document parser | Deferred | Verify exact source fields and uncertainty; do not silently convert an extraction guess into a trusted record. |
| 19. Formula cookbook | Included | Worked fixtures and honest runtime-verification status. |
| 20. Brand health dashboard | Discovery impact dashboard included | Marketplace health is separate; do not combine incomparable or incomplete signals into an unsupported score. |

The next release is selected by observed operator need and a comparison with maintained alternatives. A smaller library with demonstrated recovery and adoption is more useful than twenty thin wrappers.
