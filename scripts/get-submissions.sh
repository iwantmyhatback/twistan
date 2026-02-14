#!/bin/sh
# Retrieve all contact form submissions from Cloudflare KV

NAMESPACE_ID="99b1efa188d544c78cff0a633c22d6df"

printf 'Fetching all contact submissions...\n'
printf '\n'

# Get list of all keys
KEYS=$(npx wrangler kv key list --namespace-id="${NAMESPACE_ID}" --prefix="contact_" 2>/dev/null)

# Parse and fetch each submission
printf '%s\n' "${KEYS}" | jq -r '.[].name' | while IFS= read -r key; do
    if [ -n "${key}" ]; then
        printf '─────────────────────────────────────────\n'
        printf 'Key: %s\n' "${key}"
        npx wrangler kv key get "${key}" --namespace-id="${NAMESPACE_ID}" 2>/dev/null | jq .
        printf '\n'
    fi
done

printf '─────────────────────────────────────────\n'
printf 'Done!\n'
