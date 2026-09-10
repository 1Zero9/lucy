# Cloudflare Setup

Cloudflare's current recommended path for a new Next.js Workers project is vinext / create-cloudflare.

This repository intentionally keeps resource creation and schema changes reproducible with Wrangler.

## Requirements

- Node.js 20+ recommended
- npm
- Cloudflare account
- Wrangler authentication
- `jq` recommended for helper scripts

## Resource names

Production:
- D1: `lucy` (already exists)
- R2: `lucy-files`

Development:
- D1: `lucy-dev`
- R2: `lucy-files-dev`

## First run

```bash
chmod +x scripts/*.sh
./scripts/check-prereqs.sh
npx wrangler login
./scripts/create-infra.sh
```

The script does **not** delete or overwrite existing resources.

After resource creation/listing, copy the appropriate D1 database IDs into:
- `wrangler.jsonc`

Never point local/test code to production by default.

## Database migration commands

Local:

```bash
npm run db:migrate:local
```

Remote development:

```bash
npm run db:migrate:dev
```

Production:

```bash
npm run db:migrate:prod
```

The production script requires an explicit confirmation string.

## Development

```bash
npm install
npm run dev
```

## Cloudflare type generation

After bindings are configured:

```bash
npm run cf:typegen
```

## Deploy

vinext builds the Worker and hands it to Wrangler. Each command rebuilds first.

Development (Worker `lucy-dev`, bindings `lucy-dev` / `lucy-files-dev`):

```bash
npm run deploy:dev
```

Production (Worker `lucy`, bindings `lucy` / `lucy-files`) — never the default:

```bash
npm run deploy:vinext
```

Both read `wrangler.jsonc`; `deploy:dev` selects the `env.dev` block, which
repeats `main` / `assets` / `cache` / `version_metadata` from the top level
because Wrangler does not inherit those into named environments.

### Secrets

`BETTER_AUTH_SECRET` must be set per environment before that environment can
authenticate:

```bash
npx wrangler secret put BETTER_AUTH_SECRET --env dev     # lucy-dev  (done)
npx wrangler secret put BETTER_AUTH_SECRET               # production lucy
```

Local development reads it from `.dev.vars` instead.
