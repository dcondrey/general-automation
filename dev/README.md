# Developer guide

Operators use a copied workbook and its menu. These steps are for the person installing or extending a template.

## Local checks

```sh
npm ci
npm run check
```

Use Node 24 from `.nvmrc`. The gate runs TypeScript's JavaScript checks against Apps Script service declarations, source syntax and scope checks, Node regression tests, and the deterministic build. The documented two-argument FormApp.create overload has a small local type augmentation because the pinned community types have not yet added it.

Edit `src/`; regenerate `dist/discovery/` with `npm run build`. Runtime source uses V8-compatible JavaScript and native Google services. No transpiler or npm runtime is uploaded. `test/google-fake.mjs` models service boundaries and intentionally does not calculate Sheet formulas or verify Google authorization.

The pinned clasp development dependency currently inherits [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) through `micromatch`/`braces`; the advisory lists no patched release as of 2026-10-21. It concerns deeply nested glob patterns in the developer CLI. This project's build uses an explicit source list and no user-supplied glob patterns, and no clasp dependency is uploaded to Apps Script. Do not run developer tooling against untrusted project configurations. `npm audit --omit=dev` reports no runtime dependency advisories; the full audit still reports the clasp chain.

## Install a workbook

1. Enable the [Apps Script API in your Google account](https://script.google.com/home/usersettings). Use the same account for the next command.
2. Authorize Google's CLI:

   ```sh
   npm run clasp -- login
   ```

3. Create the chosen bound workbook and push its generated bundle:

   ```sh
   npm run setup -- discovery
   npm run clasp -- open-container
   ```

4. Reload the workbook. In Discovery, choose **Automations → View and setup → Set up workbook**; in the other suites, choose **Automations → Set up workbook**. Approve Google's runtime consent. Google service permissions are separate from the developer CLI login.
5. Follow [the live acceptance checklist](../docs/validation.md). Publish a template copy link only after these checks pass.

Use `marketplace`, `sorter`, or `handoffs` instead of `discovery` for the other templates. Each has a separate `dist/<suite>/` bundle and `.clasp.<suite>.json` binding; Discovery keeps `.clasp.json` for compatibility. Setup prints the correct command to open that suite's container.

An existing binding is reused. Before the script is created, a local `.google-setup[.<suite>].json` checkpoints the workbook ID so an API-access failure can be retried without creating another workbook. Both binding and checkpoint files are ignored. Inspect the saved target before updating any remote project. Setup uses the official Drive and Apps Script APIs for creation and clasp for source upload; it never deletes a remote project. Subsequent updates use `npm run setup -- <suite>` to build and push that suite. A running workbook does not automatically receive source changes from GitHub. Copies also remain independent.

The root `.clasp.json` is ignored, as are credential files. Never commit OAuth tokens, client secrets, live Backlog exports, or real responses. `assets/social-banner.png` is the supplied 1280×640 GitHub social preview image; upload it in repository Settings → General → Social preview if desired. GitHub does not set the repository social image from a README image.

## Extend the library

Run `npm run check:browser` with Chrome installed to exercise guided intake, an unconfirmed-save retry, action planning, and a measured result through the real HTML interface and synthetic server adapters. Set `BROWSER_BIN` if Chrome is elsewhere. It opens a temporary isolated profile, binds its test server to loopback, and removes the profile afterward; it uses no Google login or live data. Generate the README screenshot with `node dev/check-workspace.mjs --preview assets/workspace-preview.png`. These checks do not establish Google consent or HTML-service runtime acceptance.

Start with the [prior-art gate](../docs/prior-art.md). Prefer an independent small template over adding scopes to Discovery. Define required inputs, ownership, output, retry semantics, and the action an operator can take when it fails. Add meaningful logic and failure-boundary tests, synthetic data, an operator guide, and a separate live verification record. Do not claim a Make blueprint, external integration, or formula works until its real runtime was exercised.
