# Scripts Directory

Utility scripts for managing the Twistan portfolio site.

## 📋 Available Scripts

### Contact Form Management

| Script | Purpose | Usage |
|--------|---------|-------|
| `get-submissions.sh` | Retrieve all contact form submissions from KV | `./scripts/get-submissions.sh` |
| `clear-submissions.sh` | Delete all contact form submissions from KV | `./scripts/clear-submissions.sh` |

---

## 📄 Script Documentation

### `get-submissions.sh`

**Purpose:** Fetches and displays all contact form submissions stored in Cloudflare KV.

**Usage:**
```bash
./scripts/get-submissions.sh
```

**Output:**
```
Fetching all contact submissions...

─────────────────────────────────────────
Key: contact_2026-02-14T15:30:00.000Z_abc123...
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello from the contact form!",
  "submittedAt": "2026-02-14T15:30:00.000Z"
}

─────────────────────────────────────────
Done!
```

**Use Cases:**
- Check recent contact form submissions
- Verify form is working correctly
- Export submission data
- Monitor for spam/abuse

**Save to file:**
```bash
./scripts/get-submissions.sh > submissions-backup.json
```

**Count submissions:**
```bash
./scripts/get-submissions.sh | grep "Key:" | wc -l
```

---

### `clear-submissions.sh`

**Purpose:** Deletes all contact form submissions from Cloudflare KV.

**⚠️ WARNING:** This permanently deletes all submission data. Cannot be undone.

**Usage:**
```bash
./scripts/clear-submissions.sh
```

**Interactive Flow:**
```
⚠️  WARNING: This will delete ALL contact form submissions!
Press Ctrl+C to cancel, or Enter to continue...

Fetching all contact submissions...
Found 5 submission(s). Deleting...

Deleting: contact_2026-02-14T15:30:00.000Z_abc123...
Deleting: contact_2026-02-14T15:31:00.000Z_def456...
...

✅ Deleted 5 submission(s)
```

**Use Cases:**
- Clean up test submissions before going live
- Remove spam submissions
- Reset KV storage
- Regular maintenance

**Safety:** Script requires confirmation before deletion.

---

## 🔧 Prerequisites

### Required Tools

**Wrangler CLI:**
```bash
npm install  # Installs wrangler (already in package.json)
```

**jq (JSON processor):**

- **macOS:** `brew install jq`
- **Linux:** `sudo apt-get install jq` or `sudo yum install jq`
- **Windows (WSL):** `sudo apt-get install jq`

**Verify installation:**
```bash
npx wrangler --version
jq --version
```

### Authentication

**Login to Cloudflare:**
```bash
npx wrangler login
```

Opens browser to authenticate. Required before running scripts.

**Check auth status:**
```bash
npx wrangler whoami
```

---

## 🎯 Common Workflows

### Workflow 1: Check Recent Submissions

```bash
# View all submissions
./scripts/get-submissions.sh

# View only the latest submission
./scripts/get-submissions.sh | head -20
```

### Workflow 2: Backup Before Clearing

```bash
# Create timestamped backup
./scripts/get-submissions.sh > backups/submissions-$(date +%Y%m%d-%H%M%S).json

# Clear submissions
./scripts/clear-submissions.sh
```

### Workflow 3: Export Submissions

```bash
# Export as JSON
./scripts/get-submissions.sh > all-submissions.json

# Export as text (readable format)
./scripts/get-submissions.sh | tee submissions.txt
```

### Workflow 4: Filter Submissions

```bash
# Find submissions from specific email
./scripts/get-submissions.sh | grep "example@email.com"

# Count submissions from today
./scripts/get-submissions.sh | grep "$(date +%Y-%m-%d)" | grep "Key:" | wc -l
```

---

## 🗂️ KV Structure Reference

### Contact Submission Keys

**Format:** `contact_{ISO_timestamp}_{uuid}`

**Example:** `contact_2026-02-14T15:30:00.000Z_ba66f2e3-df9b-4c47-a732-a7e40a4faa87`

**Value (JSON):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Message content here",
  "submittedAt": "2026-02-14T15:30:00.000Z"
}
```

### Rate Limit Keys

**Format:** `ratelimit_{ip}_{hour_timestamp}`

**Example:** `ratelimit_192.168.1.1_1708012800000`

**Value:** String count (e.g., `"3"`)

**Auto-expires:** After 1 hour (via KV TTL)

**Note:** Rate limit keys are managed automatically and don't need manual cleanup.

---

## 🔍 Manual KV Operations

### List All Keys

```bash
# Contact submissions
npx wrangler kv key list \
  --namespace-id=99b1efa188d544c78cff0a633c22d6df \
  --prefix="contact_"

# Rate limit keys
npx wrangler kv key list \
  --namespace-id=99b1efa188d544c78cff0a633c22d6df \
  --prefix="ratelimit_"
```

### Get Specific Key

```bash
npx wrangler kv key get "contact_2026-02-14T..." \
  --namespace-id=99b1efa188d544c78cff0a633c22d6df
```

### Delete Specific Key

```bash
npx wrangler kv key delete "contact_2026-02-14T..." \
  --namespace-id=99b1efa188d544c78cff0a633c22d6df
```

### Count Submissions

```bash
npx wrangler kv key list \
  --namespace-id=99b1efa188d544c78cff0a633c22d6df \
  --prefix="contact_" | jq '. | length'
```

---

## 🚨 Troubleshooting

### Issue: "command not found: wrangler"

**Solution:**
```bash
# Install dependencies
npm install

# Use npx to run wrangler
npx wrangler --version
```

### Issue: "command not found: jq"

**Solution:**
```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq
```

### Issue: "Not authenticated"

**Solution:**
```bash
npx wrangler login
```

Opens browser for authentication.

### Issue: "Error: Unknown namespace"

**Cause:** Wrong namespace ID or namespace doesn't exist.

**Solution:**
```bash
# List all namespaces
npx wrangler kv namespace list

# Verify ID matches wrangler.toml
cat ../wrangler.toml
```

### Issue: Script shows "No submissions found" but there are submissions

**Possible causes:**
1. Looking at wrong namespace
2. Wrong prefix filter
3. Not authenticated

**Debug:**
```bash
# List all keys (no prefix filter)
npx wrangler kv key list --namespace-id=99b1efa188d544c78cff0a633c22d6df

# Check authentication
npx wrangler whoami
```

---

## 📝 Environment Variables

Scripts use the following hardcoded values:

| Variable | Value | Location |
|----------|-------|----------|
| `NAMESPACE_ID` | `99b1efa188d544c78cff0a633c22d6df` | Hardcoded in scripts |
| Prefix (submissions) | `contact_` | Hardcoded in scripts |
| Prefix (rate limits) | `ratelimit_` | API code only |

**To modify:** Edit the `NAMESPACE_ID` variable at the top of each script.

---

## 🔐 Security Notes

### Data Privacy

- Contact submissions contain PII (names, emails, messages)
- Handle exported data securely
- Don't commit submission backups to git
- Delete old backups when no longer needed

### Rate Limiting

- Rate limit keys auto-expire (no manual cleanup needed)
- Keys contain IP addresses (PII)
- Cleared automatically after 1 hour

### Best Practices

- Backup before bulk deletion
- Review submissions regularly
- Don't share namespace ID publicly (already in this repo, but good practice)
- Use `.gitignore` for backup files

---

## 📚 Additional Resources

### Documentation

- **[Cloudflare Setup Guide](../docs/CLOUDFLARE_SETUP.md)** - Complete KV and deployment guide
- **[Security Enhancements](../docs/SECURITY_ENHANCEMENTS.md)** - Rate limiting and security features
- **[Main README](../README.md)** - Project overview

### Cloudflare Wrangler Docs

- [KV Commands](https://developers.cloudflare.com/workers/wrangler/commands/#kv)
- [Wrangler Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [KV Storage](https://developers.cloudflare.com/kv/)

---

## 🛠️ Script Maintenance

### Adding New Scripts

1. Create script in `scripts/` directory
2. Make executable: `chmod +x scripts/your-script.sh`
3. Use POSIX shell (#!/bin/sh)
4. Add to this README
5. Test locally before committing

### Script Standards

- Use POSIX shell for compatibility
- Include error handling
- Confirm destructive operations
- Use clear output messages
- Document in this README

---

## 📞 Support

**Issues with scripts:**
- Check troubleshooting section above
- Verify prerequisites are installed
- Check authentication with `npx wrangler whoami`

**Issues with KV/Cloudflare:**
- See [Cloudflare Setup Guide](../docs/CLOUDFLARE_SETUP.md#troubleshooting)
- Check Cloudflare dashboard for namespace status
- Verify namespace ID matches `wrangler.toml`

---

**Quick Reference:**
```bash
# View submissions
./scripts/get-submissions.sh

# Clear submissions
./scripts/clear-submissions.sh

# Backup submissions
./scripts/get-submissions.sh > backup.json
```
