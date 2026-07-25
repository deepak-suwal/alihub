#!/usr/bin/env bash
# Pushes every var from apps/web/.env.local into the linked Vercel project,
# for all environments (production, preview, development).
#
# Run AFTER `vercel link` (from apps/web):
#   cd apps/web && ./push-vercel-env.sh
set -euo pipefail

ENV_FILE="$(dirname "$0")/.env.local"
[ -f "$ENV_FILE" ] || { echo "No .env.local found at $ENV_FILE"; exit 1; }

while IFS= read -r line; do
  # skip comments and blanks
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line// }" ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  [ -z "$key" ] && continue
  for target in production preview development; do
    # remove any existing value first (ignore error if absent), then add
    printf '%s' "$val" | vercel env rm "$key" "$target" --yes >/dev/null 2>&1 || true
    printf '%s' "$val" | vercel env add "$key" "$target" >/dev/null 2>&1 \
      && echo "  set $key ($target)" || echo "  FAILED $key ($target)"
  done
done < "$ENV_FILE"

echo "Done. Re-deploy to apply: vercel --prod"
