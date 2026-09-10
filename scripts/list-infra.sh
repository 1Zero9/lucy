#!/usr/bin/env bash
set -euo pipefail
echo "=== D1 ==="
npx wrangler d1 list
echo
echo "=== R2 ==="
npx wrangler r2 bucket list
