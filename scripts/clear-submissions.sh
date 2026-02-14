#!/bin/sh
# Clear all contact form submissions from Cloudflare KV

NAMESPACE_ID="99b1efa188d544c78cff0a633c22d6df"

printf '⚠️  WARNING: This will delete ALL contact form submissions!\n'
printf 'Press Ctrl+C to cancel, or Enter to continue...\n'
read -r

printf '\nFetching all contact submissions...\n'

# Get list of all keys
KEYS=$(npx wrangler kv key list --namespace-id="${NAMESPACE_ID}" --prefix="contact_" 2>/dev/null)

# Count keys
COUNT=$(printf '%s\n' "${KEYS}" | jq '. | length')

if [ "${COUNT}" -eq 0 ]; then
    printf 'No submissions found.\n'
    exit 0
fi

printf 'Found %s submission(s). Deleting...\n\n' "${COUNT}"

# Delete each submission
printf '%s\n' "${KEYS}" | jq -r '.[].name' | while IFS= read -r key; do
    if [ -n "${key}" ]; then
        printf 'Deleting: %s\n' "${key}"
        npx wrangler kv key delete "${key}" --namespace-id="${NAMESPACE_ID}" 2>/dev/null
    fi
done

printf '\n✅ Deleted %s submission(s)\n' "${COUNT}"
