# Contributing

Contributions should solve a concrete operator problem. Review [related projects](docs/comparison.md) and the published [best practices](best-practices.json) before proposing another integration.

Keep each change scoped and reversible. Preserve source rows and existing behavior, validate external inputs, and document resource ownership and retry behavior. Use the minimum scopes for the template; do not widen the Discovery manifest to support another suite.

Add a regression test for meaningful logic, data-integrity, or security changes. Test relevant boundaries below, at, and above the limit. Exercise interrupted actions and retries where writes occur. A local service fake is not a substitute for the [Google installation checks](docs/compatibility.md).

Run `npm run check`, include regenerated `dist/` files, and describe any remaining account-level verification limits. Keep credentials, real business data, and generated setup bindings out of commits.
