#!/usr/bin/env bash
set -euo pipefail

echo "LUCY first run"
./scripts/check-prereqs.sh

echo
echo "Installing npm dependencies..."
npm install

echo
echo "Checking Cloudflare authentication..."
npx wrangler whoami || {
  echo
  echo "Wrangler is not authenticated."
  echo "Run: npx wrangler login"
  exit 1
}

echo
echo "Infrastructure can now be created/listed with:"
echo "  ./scripts/create-infra.sh"
echo
echo "After D1 IDs are placed in wrangler.jsonc:"
echo "  npm run db:migrate:local"
echo "  npm run cf:init"
echo "  npm run dev"
