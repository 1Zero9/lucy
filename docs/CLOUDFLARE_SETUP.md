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

Both read `wrangler.jsonc`. `deploy:dev` builds with `CLOUDFLARE_ENV=dev`
(which resolves the `env.dev` block — repeated `main` / `assets` / `cache` /
`version_metadata` from the top level, since Wrangler does not inherit those
into named environments) into a fully-resolved `dist/server/wrangler.json`,
then deploys that file directly with plain `wrangler deploy` — **without**
`--env dev`. The build already named the Worker `lucy-dev`; also passing
`--env dev` to the final `wrangler deploy` call double-applies the suffix
and deploys to a stray `lucy-dev-dev` Worker instead (hit once, fixed —
`workers_dev` requires an account subdomain, which is registered now).
`deploy:vinext` (production) needs no such care since it never passes
`--env` at all.

### Secrets

`BETTER_AUTH_SECRET` must be set per environment before that environment can
authenticate:

```bash
npx wrangler secret put BETTER_AUTH_SECRET --env dev     # lucy-dev  (done)
npx wrangler secret put BETTER_AUTH_SECRET               # production lucy (done)
```

`RESEND_API_KEY` (and optionally `EMAIL_FROM`) enable outbound email
(src/lib/email/resend.ts) — without it, sending safely no-ops. Not yet set on
either deployed environment:

```bash
npx wrangler secret put RESEND_API_KEY --env dev
npx wrangler secret put RESEND_API_KEY
```

Local development reads all of these from `.dev.vars` instead (see
`.dev.vars.example`).

## Custom domains

Both environments are on the `1zero9.com` zone (Cloudflare-managed DNS +
TLS, via `routes` + `custom_domain: true` in `wrangler.jsonc`), with the
`*.workers.dev` URL kept alive alongside each (`workers_dev: true`):

| Environment | Custom domain | workers.dev |
|---|---|---|
| dev | https://lucy-dev.1zero9.com | https://lucy-dev.onezeronine.workers.dev |
| production | https://lucy.1zero9.com | https://lucy.onezeronine.workers.dev |
