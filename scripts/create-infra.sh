#!/usr/bin/env bash
set -euo pipefail

echo "LUCY Cloudflare infrastructure bootstrap"
echo "This script creates missing DEVELOPMENT/storage resources."
echo "It does not delete resources and does not recreate the existing production D1."
echo

echo "1) Current D1 databases:"
npx wrangler d1 list || true

echo
read -r -p "Create lucy-dev D1 if it does not already exist? [y/N] " answer
if [[ "${answer:-}" =~ ^[Yy]$ ]]; then
  npx wrangler d1 create lucy-dev --location weur || {
    echo "D1 create returned an error. If lucy-dev already exists, this is expected."
  }
fi

echo
read -r -p "Create lucy-files R2 bucket if missing? [y/N] " answer
if [[ "${answer:-}" =~ ^[Yy]$ ]]; then
  npx wrangler r2 bucket create lucy-files || {
    echo "R2 create returned an error. If the bucket already exists, this is expected."
  }
fi

echo
read -r -p "Create lucy-files-dev R2 bucket if missing? [y/N] " answer
if [[ "${answer:-}" =~ ^[Yy]$ ]]; then
  npx wrangler r2 bucket create lucy-files-dev || {
    echo "R2 create returned an error. If the bucket already exists, this is expected."
  }
fi

echo
echo "Resources after bootstrap:"
npx wrangler d1 list || true
npx wrangler r2 bucket list || true

echo
echo "IMPORTANT:"
echo "Copy the production lucy and development lucy-dev D1 IDs into wrangler.jsonc."
echo "Do not apply production migrations until the configuration has been reviewed."
