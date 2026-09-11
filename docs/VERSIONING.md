# Versioning

LUCY is pre-1.0: a foundation build for fewer than five known users, not yet
handed to them. `package.json` `version` and `CHANGELOG.md` follow
[Semantic Versioning](https://semver.org/), adapted for that stage:

- **MAJOR (`0.x.x`)** — stays `0` until the first release the owner
  actually hands to real users. `1.0.0` means: identity, notes, and data
  safety (Phase 1 acceptance tests, MASTER.md §9) hold under real use, and
  the owner has said go.
- **MINOR (`x.Y.x`)** — a new capability: a `BUILD_PLAN.md` phase completing
  (a new primitive, a new screen, a new subsystem), or a UX change that
  touches how the product behaves across the app (e.g. the design-pass
  restyle, the mobile bottom nav).
- **PATCH (`x.x.Z`)** — fixes, infrastructure, and polish that don't change
  what the product does: bug fixes, deploy/config corrections, dependency or
  tooling changes, copy tweaks.

## Process

1. Land the change (typecheck, build, `npm run test:e2e` per
   `AGENTS.md` "Definition of done").
2. Add an entry under `## [Unreleased]` in `CHANGELOG.md` as you go, or fold
   it into the release entry directly for a single-purpose change.
3. When cutting a version: move the `Unreleased` entries under a new
   `## [x.y.z] — YYYY-MM-DD` heading, bump `version` in `package.json` to
   match, and commit both together.
4. Tag releases once deploys are routine (`git tag vX.Y.Z`) — not required
   yet while everything ships straight to `main` and nothing is deployed.

## Current version

See `CHANGELOG.md` for the full history. The version in `package.json` is
the single source of truth for "what commit is this."
