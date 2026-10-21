# Candidate map

v0.1 implements Discovery only. The other entries are candidates, not supported modules or implied production integrations. [Prior-art review](prior-art.md) is required before extending the library.

| Original idea | Disposition | Useful extension or acceptance requirement |
| --- | --- | --- |
| 1. Automation backlog ranker | Implemented in Discovery | Net benefit after upkeep, cross-team overlap reconciliation, delete/redesign/keep-manual/investigate decisions. |
| 2. Run log and alerts | Local Run log implemented | Add external alerts only in the relevant suite; prove deduplication and secret-free diagnostics. |
| 3. Runbook/SOP generator | Operator guide shipped; generator deferred | A useful runbook needs actual ownership and recovery evidence, not a template claiming completeness. |
| 4. Trigger manager and menu | Menu implemented; triggers deferred | Discovery works on demand. Add scheduling only where it saves work and document trigger ownership after copies. |
| 5. Asana handoff | Team Handoffs candidate | Validate the next team's required inputs; replay without duplicate tasks. |
| 6. Brand onboarding kit | Handoff configuration candidate | A checklist and owned intake may be sufficient. Reuse a verified handoff before provisioning more resources. |
| 7. Zapier/Make webhook | Handoff boundary candidate | Prefer the platform's authenticated webhook and established signing mechanisms; no anonymous endpoint in Discovery. |
| 8. HubSpot sync | Deferred | Search for maintained connectors first; implement only a measured unmet reconciliation need. |
| 9. MAP monitor | Marketplace Watch candidate | Accept authorized data feeds, reconcile authorized sellers, preserve evidence, review alerts with a person. |
| 10. Inventory cover | Marketplace Watch candidate | Model dated inbound stock and missing demand instead of adding all future inbound to present availability. |
| 11. Ads metrics | Marketplace Watch candidate | Make denominators, attribution windows, and missing data explicit; benchmark against existing reporting. |
| 12. Catalog guardrails | Marketplace data-quality candidate | Batch validation before alerts; distinguish malformed identifiers and stale feeds from genuine business exceptions. |
| 13. Listing change audit | Deferred | Require a permitted feed and stable snapshots; avoid unverified scraping. |
| 14. Report ingestion | Deferred | Identify a report format and provenance contract; make duplicate attachments and partial imports recoverable. |
| 15. LLM categorizer | AI Sorter candidate | Evaluate against a deterministic baseline; validate schema, contain untrusted input, track cost, and route uncertain rows to review. |
| 16. Transcript actions | Deferred | Require owner/date confirmation before creating tasks; reuse the handoff contract. |
| 17. Claims screener | Deferred | Needs a labeled evaluation set and qualified review; a risk label is not a legal determination. |
| 18. Document parser | Deferred | Verify exact source fields and uncertainty; do not silently convert an extraction guess into a trusted record. |
| 19. Formula cookbook | Included | Worked fixtures and honest runtime-verification status. |
| 20. Brand health dashboard | Discovery impact dashboard included | Marketplace health is separate; do not combine incomparable or incomplete signals into an unsupported score. |

The next release is selected by observed operator need and a comparison with maintained alternatives. A smaller library with demonstrated recovery and adoption is more useful than twenty thin wrappers.
