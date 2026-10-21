# Marketplace Watch — operator guide

Install with `npm run setup -- marketplace` using the [developer guide](../../dev/README.md). Once installed, use **Automations → Set up workbook**. The bundle requests the current spreadsheet, external requests, and a connection sidebar; it does not request Forms, Docs, Gmail, or Drive access.

## Try the demo

Keep **Settings → Mode = Demo** and choose **Check marketplace**. **Demo signals** and **Metrics** show fictional seller, price, stock, and advertising examples. No external call runs. Your real **Signals** table stays separate. [Inspect the same deterministic examples](../../examples/README.md) without a Google account.

## Connect your data

Fill the input tables with complete snapshots from sources you are permitted to use. This release reads pasted/imported feeds; it does not scrape Amazon or claim a direct marketplace connector.

- **Products:** one row per SKU, MAP price, uppercase currency, authorized sellers separated by commas, replenishment lead days, safety days, and the owner who should review exceptions. SKUs use letters, numbers, periods, underscores, and hyphens.
- **Offers:** one row per seller offer with matching SKU, price, currency, and observation date. A below-MAP price and a seller missing from your list are review signals, not automatic enforcement decisions.
- **Inventory:** current on-hand stock, dated inbound, units sold over matching trailing 7-day and 30-day windows, and observation date. Seven-day units cannot exceed thirty-day units. Velocity weights the seven-day rate at 60% and the thirty-day rate at 40%.
- **Ads:** current and previous periods must use the same window length and attribution rules. Enter current spend, ad sales, total sales, prior spend, prior ad sales, target ACOS as a number from 0–100, and period ending. Confirm your reporting windows before comparing them.

Switch **Mode = Live** and choose **Check marketplace**. The full input set is validated before outputs change. Unknown or duplicate product keys stop the run. Stale or missing inputs raise data-quality signals. Inbound that arrives after initial depletion cannot conceal a stockout. No demand makes cover undefined; zero denominators do not become misleading ratios.

## Work the queue

In **Signals**, set **Status** to Open, Acknowledged, or Resolved. Add **Snooze until** as `YYYY-MM-DD` to defer a notification. Repeated observations update the same signal key and preserve triage. A genuinely resolved condition can reopen. Data-quality gaps preserve prior business alerts until there is enough evidence to resolve them.

Keep each signal row intact when sorting. Do not duplicate or rename its key. Use **Metrics** for inventory and advertising calculations; the current Settings mode determines which data it contains.

## Optional Slack digest

Choose **Connections**, save your Slack incoming webhook, and use **Send new-signal digest** in Live mode. It sends up to 20 unsent, unsnoozed Open signals per action. The remaining queue stays unsent. Confirmed deliveries are marked Sent and are not repeated.

Before a send, selected rows are marked **Unknown**. If acknowledgement is lost, inspect the Slack channel before clearing Digest state to authorize another attempt. A timeout is deliberately not auto-retried. A snoozed or acknowledged signal is excluded. Credentials are stored for your Google login and this workbook; other editors enter their own connection.

## If it breaks

Read the operator message and **Run log**. Fix missing SKUs, date formats, currencies, or sales windows in the source tab and run again. Keep old Signals while investigating. A Slack authorization error requires checking the webhook; an Unknown send requires checking the channel. There are no background triggers or automatic sharing operations.

Live Slack delivery and representative marketplace feeds still require account-level acceptance; see [validation](../validation.md). Primary Slack behavior: [incoming webhooks](https://api.slack.com/messaging/webhooks).
