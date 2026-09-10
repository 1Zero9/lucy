#!/usr/bin/env bash
set -euo pipefail

echo "PRODUCTION DATABASE MIGRATION"
echo "Target: D1 database bound as DB in the production Wrangler environment."
echo
read -r -p 'Type MIGRATE LUCY PRODUCTION to continue: ' confirmation

if [[ "$confirmation" != "MIGRATE LUCY PRODUCTION" ]]; then
  echo "Cancelled."
  exit 1
fi

npx wrangler d1 migrations apply DB --remote
