# Prior art and differentiation

Reviewed 2026-10-21. This is a bounded comparison of the linked project documentation, not an exhaustive GitHub census or a benchmark of competing implementations. No external source code was copied into this implementation. Standard Apps Script service calls and ordinary payback calculations are not claimed as inventions.

| Project | Existing contribution | Implication for this library |
| --- | --- | --- |
| [Google Workspace Apps Script samples](https://github.com/googleworkspace/apps-script-samples) | Official examples and solutions cover menus, Forms, custom functions, reports, and complete business automations; the repository also checks types. | A list of sample scripts, a menu, tests, or a Form-to-Doc flow alone would not distinguish this project. Link to the official material for API learning. |
| [Labnol's Apps Script collection](https://www.labnol.org/google-apps-script) | Tutorials and practical Workspace automation patterns across many Google products. | Breadth of snippets is already well served. Keep the initial release focused on one coherent operator task. |
| [AI Toil Tracker](https://github.com/DUBSOpenHub/ai-toil-tracker) | Captures toil through GitHub issue forms, prioritizes opportunities, exposes a dashboard, and tracks wins using GitHub and Slack workflows. | Capturing toil, visualizing it, and tracking hours saved are established product ideas. The Google-native operating surface and explicit accounting rules are the relevant differences here. |
| [Founder AI Workflow ROI OS](https://github.com/shubham1502-hue/founder-ai-workflow-roi-os) | Ranks workflows, calculates payback, considers keeping work manual, and produces a decision memo from CSV/config inputs. | ROI ranking, a memo, and declining to automate are not novel. This kit focuses on staff-operated Sheets, cross-team baseline reconciliation, and recovery at Google resource boundaries. |

The last two project READMEs were inspected at revisions `6b28dbbd96ff4a56af2b9708ef5b5c30e25ee8bd` and `447de52629b33bad1f9cd1624d730fce804e10d0`, respectively. Their runtime behavior was not benchmarked. A missing feature in a README is not evidence that the implementation lacks it.

## Claims this release can defend

| Design choice | Implementation | Reproducible evidence |
| --- | --- | --- |
| Recurring upkeep reduces benefit before prioritization | `Backlog.score` | Net-benefit tests at upkeep below, equal to, and above gross benefit. |
| Explicit cross-team overlap cannot inflate headline hours | `Backlog.evaluate` | Every row in a repeated normalized overlap group is excluded and identified by source row. |
| Copied workbooks use independent Form/Doc identities | `Book.state` | A copied workbook ID cannot read the source workbook's saved resources. Live copy testing is tracked separately. |
| Retries preserve identity and operator inputs | `Intake.create`, `Intake.plan`, `Template.setup` | Interrupted Form setup, repeated imports, repeat setup, and failed output-write tests. |
| Forecasts are separate from observed savings | `Backlog.score`, `Backlog.summarize` | Missing vs zero observations, Live/date requirements, and invalid-date boundaries. |
| Operators receive a recoverable workflow | Settings, Issues, menu, operator guide | Local workbook-boundary tests; live Google acceptance remains a separate gate. |

Run `npm run check` for the evidence above. A passing test suite proves these specified behaviors in the local harness; it does not prove global originality, superior usability, production adoption, or a measured business saving.

## Gate for the next module

Before adding a module, identify the closest maintained alternative, inspect its license and actual relevant implementation, and document a concrete unmet operator need. Reuse a suitable maintained component rather than rewriting a mature integration. An addition must demonstrate a useful improvement, a small reproducible scenario, failure recovery, and live validation. Keep comparative claims scoped to observed evidence.

## Expanded suites

Marketplace metrics, structured LLM classification, and Asana task creation are also established techniques. These suites are not claimed as first implementations. Their contribution is the operating contract: dated inbound cannot hide an earlier stockout; stale feeds do not falsely clear business exceptions; uncertain digest delivery stays held; paid LLM requests are checkpointed before generation; and uncertain Asana writes are reconciled against an exact destination marker. Regression tests exercise these failure cases. The generated examples are reproducible from the same production functions.

The integrations use documented native APIs rather than copied unofficial wrappers: [Asana task creation](https://developers.asana.com/reference/createtask), [Asana pagination](https://developers.asana.com/docs/pagination), [Slack incoming webhooks](https://api.slack.com/messaging/webhooks), and [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output). Live-account performance, provider accuracy, and production adoption have not been demonstrated by the local tests.
