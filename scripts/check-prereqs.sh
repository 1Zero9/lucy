#!/usr/bin/env bash
set -euo pipefail

echo "LUCY prerequisite check"

command -v node >/dev/null || { echo "ERROR: Node.js is required."; exit 1; }
command -v npm >/dev/null || { echo "ERROR: npm is required."; exit 1; }

echo "Node: $(node --version)"
echo "npm:  $(npm --version)"

if command -v jq >/dev/null; then
  echo "jq:   $(jq --version)"
else
  echo "NOTE: jq is not installed. It is useful but not mandatory."
fi

echo
echo "Next:"
echo "  npm install"
echo "  npx wrangler login"
echo "  ./scripts/create-infra.sh"
