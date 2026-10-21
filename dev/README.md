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

3. Create the bound workbook and push its generated bundle:

   ```sh
   npm run setup
   npm run clasp -- open-container
   ```

4. Reload the workbook. Choose **Automations → Set up workbook** and approve Google's runtime consent. Google service permissions are separate from the developer CLI login.
5. Follow [the live acceptance checklist](../docs/validation.md). Publish a template copy link only after these checks pass.

An existing `.clasp.json` is reused. Before the script is created, `.google-setup.json` checkpoints the workbook ID so an API-access failure can be retried without creating another workbook. Both files are local and ignored. Inspect the saved target before updating any remote project. Subsequent source updates use `npm run build` and `npm run clasp -- push`; a running workbook does not automatically receive source changes from GitHub. Copies also remain independent.

The root `.clasp.json` is ignored, as are credential files. Never commit OAuth tokens, client secrets, live Backlog exports, or real responses. `assets/social-banner.png` is the supplied 1280×640 GitHub social preview image; upload it in repository Settings → General → Social preview if desired. GitHub does not set the repository social image from a README image.

## Extend the library

Start with the [prior-art gate](../docs/prior-art.md). Prefer an independent small template over adding scopes to Discovery. Define required inputs, ownership, output, retry semantics, and the action an operator can take when it fails. Add meaningful logic and failure-boundary tests, synthetic data, an operator guide, and a separate live verification record. Do not claim a Make blueprint, external integration, or formula works until its real runtime was exercised.
