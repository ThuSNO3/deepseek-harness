# Agent Note: Demote the browser fixture to test support

Status: proposed

English | [中文](2026-09-03-demote-browser-fixture-to-test-support.zh.md)

## Problem

`packages/client/connection/src/client/fixture.ts` is a 3,600-line in-memory imitation of the Host RPC surface. The published Connection Client imports it statically and selects it whenever the page query contains `fixture`, so every `lib/client.js` carries the fake Host and any served product page can replace its real transport with that fake by adding `?fixture`. Its fixed sessions, settings, credentials, workspaces, directory tree, prompts, stream timing, search ranking, projections, and failure switches mirror behavior owned by production Host packages without exercising those owners.

The fixed repository consumers are tests and development diagnostics: Connection fixture specs, jsdom assembled-boot tests, browser expected-output cases, and the opt-in 100,000-chunk stress lane. The Web snapshot corpus now boots the shipped profile against recorded sessions for product behavior, while the remaining fixture consumers need a deterministic test double rather than a production query switch. The [Web browser testing decision](../../implemented/testing/2026-07-24-web-gui-browser-e2e-lane.md) already describes `?fixture` as a client-shell fake that leaves everything below the Client API untested; the [recorded-session corpus](../../implemented/testing/2026-08-24-session-log-snapshot-corpus.md) owns the real assembled-product path.

## Proposal

Remove `fixture.ts` from `@deepseek-ai/dsh-client-connection`'s Client program and published bundle. The production plugin always constructs its RPC channels from the page's physical transport and treats `fixture` as an ordinary, semantically inert query key. Remove “browser fixture” from the package description and delete product-source branches whose only purpose is interpreting fixture query parameters.

Move the deterministic state graph and its switches to a test-support Client plugin or an `apps/web/tests` build entry that provides the same `ctx.connection` service only in test and explicit development compositions. Assembled jsdom, expected-output, and stress tests load that entry through their own boot graph instead of selecting it through a product URL. Keep the raw event samples that cover presentation states, but do not preserve Host algorithms such as ranking, validation, or lifecycle timing merely because the fake currently restates them; use narrow scripted responses where the test only needs one frame, and use the real Web profile plus recorded sessions where the Host behavior matters.

The change must reduce the shipped Connection Client artifact and its runtime dependency closure. Moving the complete file unchanged to a published product package does not satisfy the proposal; test-only placement and deletion of mirrors made redundant by recorded-session scenarios are part of the acceptance bar.

## Alternatives considered

**Keep `?fixture` as a convenient development mode.** A zero-server page is convenient for presentation work and the stress lane needs a deterministic high-rate producer. Those uses remain available through an explicit test/development entry; they do not require every production artifact to carry a fake Host or a public URL switch that bypasses the real transport.

**Delete the fixture and rewrite every case as a real-profile browser scenario.** Rejected because component assembly and the 100,000-chunk stress producer need cheap, deterministic inputs, and making a real Host manufacture extreme streams would couple performance diagnostics to model and persistence setup. The split is by test subject: product behavior uses the real profile; Client-only assembly and stress use test support.

**Expose a generic production hook accepting `ClientConnectionRpc`.** Rejected because that turns a test escape into a supported product injection API. The existing physical-transport hook remains for shells that actually own a Host carrier; test compositions can replace the Connection plugin itself.

## Acceptance criteria

- `@deepseek-ai/dsh-client-connection` has no fixture implementation, `?fixture` branch, fixture query parsing, or static import that retains test data in `lib/client.js`.
- A built served page always uses its configured physical transport regardless of a `fixture` query key.
- The deterministic Client-only assembled tests and opt-in stress lane load an explicit test-support entry and retain their external assertions.
- Product-visible Web journeys continue through the shipped profile and recorded-session snapshot harness; no real Host contract is asserted only through the fake.
- Bundle inspection demonstrates a net reduction in the shipped Connection artifact, and GUI, Web replay, build, package, and documentation checks pass.

## Risks

Manual UI development must start the explicit test entry instead of adding a query parameter to any product page. Tests that accidentally depended on the fixture's imitation of Host behavior may need to move to a recorded-session scenario or script a narrower response. The test entry still carries maintained sample data, but its drift can no longer ship as dormant production code.
