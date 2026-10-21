# Inspect the library without installing anything

These outputs are generated directly from the production decision functions using fictional inputs. They are not screenshots, customer outcomes, live API responses, or performance claims.

| Open | What to inspect |
| --- | --- |
| [Discovery rankings](discovery-ranked.csv) | All five decision types, conditional estimates, payback, and a separate fictional observation. |
| [Marketplace signals](marketplace-signals.csv) | Below-MAP offer, unlisted seller, stock risk despite late inbound, and deteriorating advertising efficiency. |
| [Marketplace metrics](marketplace-metrics.csv) | Weighted sales velocity, dated-inbound eligibility, reorder point, ACOS, TACOS, and ROAS. |
| [Feedback baseline](sorter-baseline.csv) | A transparent non-LLM classifier used as the comparison baseline; no model accuracy is invented. |
| [Asana task preview](handoff-preview.json) | The precise task payload, including the replay marker and the next team's required inputs. Nothing is posted. |

Reproduce them with `npm run demo`. The observation date for marketplace fixtures is fixed at 2026-10-21 so the files stay deterministic. `npm run check` verifies that examples match the current implementation. All four workbook bundles also start in Demo mode.
