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

Development and production deployment details should be added only after account/domain configuration is known. Do not make production the default deploy command.
