# Related projects

Menus, Forms, custom functions, reporting, ROI ranking, and toil tracking are established techniques. This toolkit focuses on one operating experience: nontechnical staff can identify unnecessary work, account for upkeep and overlap, and track observed results in Google Workspace.

| Resource | Useful for | This toolkit's focus |
| --- | --- | --- |
| [Google Workspace Apps Script samples](https://github.com/googleworkspace/apps-script-samples) | Official examples and complete Workspace solutions. | Connected operator journeys and explicit accounting and recovery rules. |
| [Labnol's Apps Script collection](https://www.labnol.org/google-apps-script) | Tutorials and practical automation patterns across Google products. | Guided workbooks with synthetic examples and operator instructions. |
| [AI Toil Tracker](https://github.com/DUBSOpenHub/ai-toil-tracker) | Capturing toil, prioritizing opportunities, and tracking wins through GitHub and Slack. | A Google-native interface, upkeep deductions, and overlap reconciliation. |
| [Founder AI Workflow ROI OS](https://github.com/shubham1502-hue/founder-ai-workflow-roi-os) | Workflow ranking, payback, manual-work decisions, and decision memos. | Staff-operated Sheets with stable process identities and recoverable Google actions. |

These comparisons describe published documentation, not measured runtime superiority or an exhaustive feature audit. No external source code was copied into this implementation. A feature absent from another project's README may still exist in its code.

## Concrete operating rules

- Upkeep reduces estimated benefit before ranking.
- Repeated overlap groups withhold every shared baseline.
- Delete, redesign, investigate, and keep manual are valid recommendations.
- Stable identities preserve plans when rows move; stale edits cannot overwrite changed source data.
- Dated observations remain separate from estimates and repeated measurements are not additive.
- Uncertain external writes remain held instead of being blindly repeated.

The regression suite exercises these rules. [Compatibility](compatibility.md) distinguishes local checks from live-account acceptance. No measured business saving or universal superiority is claimed.
