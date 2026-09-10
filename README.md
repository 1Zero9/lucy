# LUCY

**Your learning workspace.**  
Capture. Organise. Learn. Succeed.

LUCY is a small, private, Cloudflare-native learning and note-taking application.

## Start here

Coding agents and developers must read:

1. `MASTER.md`
2. `AGENTS.md`
3. `CLAUDE.md`
4. `BUILD_PLAN.md`

The project deliberately limits scope. Do not attempt to build the complete product at once.

## Quick start

```bash
chmod +x scripts/*.sh
./scripts/check-prereqs.sh
npm install
npx wrangler login
./scripts/create-infra.sh
```

Then put the D1 database IDs into `wrangler.jsonc`.

Cloudflare currently recommends vinext for new Next.js applications on Workers. After dependencies are installed:

```bash
npm run cf:check
npm run cf:init
```

Review any generated changes before committing them.

Apply the local migration:

```bash
npm run db:migrate:local
```

Run:

```bash
npm run dev
```

Health endpoint:

```text
/api/health
```

## Important

The existing production D1 database is named `lucy`.

Do not use it for ordinary development.

Create/use `lucy-dev` for remote development and local D1 for routine local development.

## Repository structure

```text
MASTER.md              project authority
AGENTS.md              generic coding-agent rules
CLAUDE.md              Claude-specific operating rules
BUILD_PLAN.md          staged work
docs/                  product, architecture, security, design
migrations/            D1 schema history
scripts/               Cloudflare bootstrap and safety scripts
src/                   application source
wrangler.jsonc         Cloudflare resource bindings
```

## Current phase

Phase 0 / Phase 1 foundation only.
