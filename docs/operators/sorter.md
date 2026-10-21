# AI Sorter — operator guide

Install with `npm run setup -- sorter` using the [installation guide](../installation.md). Then choose **Automations → Set up workbook**. The bundle requests only the current spreadsheet, external requests, and the connection sidebar.

## Try the baseline first

Leave **Mode = Demo** and use **Sort feedback**. Fictional examples are classified by the visible keyword rules in **Labels**. This is a real deterministic baseline, not made-up model output. **Demo results** remains separate from **Results**. Every baseline example is flagged for review. [Inspect the generated fixture](../../examples/sorter-baseline.csv).

Edit **Labels** to define 2–20 unique categories, including **Other**. Keywords support the comparison baseline. Use your own examples in **Feedback**, one unique Source ID per row, with up to 2,000 characters of text. Remove customer secrets and sensitive material before deciding to send anything to a provider.

## Run Gemini deliberately

1. Enter your account's input and output prices per million tokens in Settings. Zero prices prevent Live calls. The repository does not hard-code a current provider price.
2. Set a **Run estimate limit USD** and review threshold. The threshold uses the model's self-reported confidence, which is not calibrated accuracy.
3. Save your **Gemini API key** in **Connections**. It is scoped to your Google login and workbook, not written into cells.
4. Choose **Live**, then **Preview cost**. This is a character-based approximation for the first 20 rows. The Live run separately asks the provider to count prompt tokens before generation.
5. Choose **Sort feedback**. Each run processes at most two new rows. Re-run to continue. Matching successful or held request keys are skipped.

The implementation targets the documented `gemini-2.5-flash` Generate Content API, requests structured JSON, caps output at 512 tokens, and disables thinking for this model. Account availability, provider policy, pricing, and actual billing must be checked for your own account. The configured estimate limit is not a billing guarantee: schema overhead, account pricing rules, and provider usage accounting can differ from an estimate.

Results contain the suggested label, review flag, reason, prompt version, token usage, operator-rate cost estimate, and request key. Sorter never creates tasks or executes instructions from feedback. Review consequential output even when the model reports high confidence.

## Interrupted requests

**AI ledger** records intent as **Unknown** before a generation request is sent. An ambiguous failure, invalid response, or interrupted result write stays held, preventing an automatic second paid call. Check the provider usage and existing results before making a conscious retry decision. Keep ledger and result rows; deleting request history can remove deduplication evidence. Start a fresh workbook for a new operating period.

Changing source text, labels, or the prompt version creates a new request identity and may incur another charge. Demo keyword changes also invalidate the baseline cache.

## Evaluate before trusting

Fill **Golden set** with Source ID, exact feedback text, and a human-labeled expected category. Run the same examples through Feedback, then choose **Evaluate accuracy**. The evaluator uses matching current predictions only and reports missing/stale coverage. Classifier and keyword accuracy are calculated on the same matched examples. A tiny or unrepresentative set is not evidence of general quality. Review load and actual cost matter alongside accuracy.

Live provider calls have not been claimed as production tested. See [compatibility and limits](../compatibility.md). Primary references: [structured output](https://ai.google.dev/gemini-api/docs/structured-output), [token counting](https://ai.google.dev/gemini-api/docs/tokens), and [thinking controls](https://ai.google.dev/gemini-api/docs/thinking).
