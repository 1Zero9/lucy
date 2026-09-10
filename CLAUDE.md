# CLAUDE.md — LUCY Project Instructions

You are working on **LUCY**, a Cloudflare-native, private learning workspace.

## First action in every new session

Read:

- `MASTER.md`
- `AGENTS.md`
- `BUILD_PLAN.md`
- relevant files under `docs/`

Do not begin by rebuilding the project or replacing the architecture.

## Your job

Implement the requested phase/task with the least complexity that satisfies the acceptance criteria.

### Current product constraints

- Fewer than 5 users.
- Separate private accounts.
- No cross-user sharing in v1.
- Course/subject agnostic.
- PC, Mac, iPad and iPhone via responsive PWA.
- Cloudflare-native.
- D1 for structured data.
- R2 for files.
- Workers for server execution.
- IndexedDB for offline support when that phase is reached.
- Data safety and predictable UX matter more than feature volume.

## Strict scope controls

DO NOT add unless explicitly requested:

- AI assistants
- chat interfaces
- vector databases
- collaboration
- team workspaces
- social sharing
- real-time co-editing
- gamification
- analytics dashboards
- native apps
- microservices
- Terraform
- Durable Objects

## User experience

The product should feel:

- fast
- obvious
- safe
- quiet
- consistent

Primary navigation should remain restrained.

A first-time user should not need documentation to create a workspace/module and write a note.

## Data protection

The authenticated session owns the access decision.

Do not authorise using an owner ID provided by the browser.

Deletion of notes should be recoverable.

Versioning should protect against overwrite mistakes.

Never present a cloud save as successful before it is confirmed.

## Cloudflare

Use Wrangler and project configuration as the normal infrastructure interface.

Production D1 is named `lucy` and already exists.

Development D1 should be `lucy-dev`.

R2 buckets:
- production: `lucy-files`
- development: `lucy-files-dev`

Do not run destructive remote commands without explicitly stating the target environment.

## Response format after work

Finish with:

### Changed
What was implemented.

### Verified
Commands/tests actually run.

### Security
Any relevant security effect.

### Limitations
What remains incomplete.

### Next
One small recommended next task.

Do not continue to the next task automatically.
