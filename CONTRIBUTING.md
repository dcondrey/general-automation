# Contributing

Discuss a concrete operator problem before adding another integration or framework. Check [prior art](docs/prior-art.md) and [the roadmap](docs/roadmap.md) first.

Keep each change scoped and reversible. Preserve source rows and existing behavior, validate external inputs, and document resource ownership and retry behavior. Use the minimum scopes for the template; do not widen the Discovery manifest to support another suite.

Add a regression test for meaningful logic, data-integrity, or security changes. Test relevant boundaries below, at, and above the limit. Exercise interrupted actions and retries where writes occur. A local service fake is not a substitute for the [Google acceptance checks](docs/validation.md).

Run `npm run check`, include regenerated `dist/discovery/` files, and record verification limits honestly. Use single-line commit messages in the form `type: Imperative description`. Keep credentials, real business data, and generated setup bindings out of commits.
