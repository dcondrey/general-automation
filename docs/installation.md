# Installation

Install each template once, then operate it through the workbook's **Automations** menu. Each suite gets its own workbook and permission bundle. Google consent and your organization's access policies apply.

## Requirements

- Node 24 from `.nvmrc` and npm for the initial installation.
- A Google account allowed to run Apps Script and create spreadsheets.
- The [Apps Script API enabled](https://script.google.com/home/usersettings) for that account.

```sh
git clone https://github.com/dcondrey/general-automation.git
cd general-automation
npm ci
npm run clasp -- login
npm run setup -- discovery
npm run clasp -- open-container
```

Reload the workbook. Choose **Automations → View and setup → Set up workbook**, then approve Google's runtime consent. CLI authorization and workbook consent are separate. Routine operation requires no code changes.

For another suite, use `marketplace`, `sorter`, or `handoffs` in the setup command. Setup prints the command to open that suite's workbook. Those templates use **Automations → Set up workbook**.

| Template | Guide | Google permissions |
| --- | --- | --- |
| Discovery | [Discovery Kit](operators/discovery.md) | Current spreadsheet, Forms, Docs, in-workbook dialogs. |
| Marketplace | [Marketplace Watch](operators/marketplace.md) | Current spreadsheet, external requests, connection sidebar. |
| Sorter | [AI Sorter](operators/sorter.md) | Current spreadsheet, external requests, connection sidebar. |
| Handoffs | [Team Handoffs](operators/handoffs.md) | Current spreadsheet, external requests, connection sidebar. |

No template requests Gmail access or installs scheduled triggers or a public webhook. Discovery has no external HTTP integration. Preview settings prevent actions; they do not narrow Google's consent grant.

## Updates and retries

Run `npm run setup -- <suite>` again to build and upload the current source to the same saved project. Existing workbooks and their copies do not automatically update when GitHub changes. Inspect the locally saved target before uploading.

Setup keeps the workbook ID in an ignored local checkpoint before creating its bound project. If API access fails, fix the reported problem and retry the same command. Existing bindings are reused; setup never deletes remote projects. Re-run workbook setup after an update to create missing tabs while retaining inputs and Settings values.

Public copy links are not available yet. See [compatibility and limits](compatibility.md) before distributing a copied template. Shared templates must contain only synthetic inputs and no live credentials or resource links.

## Connections and data

Start in Demo. In the three external-service templates, enter optional credentials through **Connections**, then select Live only when ready. Credentials are stored privately for the Google user and workbook that saved them. Never paste them into sheet cells. Workbook editors can inspect and run its bound script.

Discovery keeps its data in Google Workspace. In Live mode, Marketplace sends selected signals to Slack; Sorter sends selected feedback and labels to Gemini; Handoffs sends task inputs to Asana. Review each operator guide before connecting a service. The toolkit never shares a Form or Doc automatically.

## Check the source

```sh
npm run check
npm run check:browser
```

The first command checks service types, syntax, permission contracts, bundles, regression tests, and generated examples. The second runs the actual workspace HTML in headless Chrome with synthetic service adapters. Install Chrome or set `BROWSER_BIN` to its executable. Neither command uses Google credentials or sends external messages.
