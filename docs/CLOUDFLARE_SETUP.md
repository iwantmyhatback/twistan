# Cloudflare Setup - Complete Guide

Step-by-step guide to deploying the Twistan portfolio site to Cloudflare Pages with custom domain and KV storage.

**Related Documentation:**
- **[README.md](../README.md)** - Quick start and overview
- **[Local Development Guide](LOCAL_DEVELOPMENT.md)** - For local testing before deployment

## Prerequisites

- Cloudflare account (free tier works)
- Domain name (e.g., twistan.com)
- Wrangler CLI installed locally (`npm install` in project root)
- Project built at least once (`npm run build`)
  - **See [Local Development Guide](LOCAL_DEVELOPMENT.md#building-for-production)** for build instructions

## Part 1: Initial Cloudflare Pages Setup

### Step 1.1: Create Pages Project (First Time)

**Via Cloudflare Dashboard:**

1. Navigate to [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **Workers & Pages** in left sidebar
3. Click **Create application** button
4. Select **Pages** tab
5. Choose **Upload assets** (not Git integration)
6. Enter project name: `app`
7. Click **Create project**
8. Upload your `dist/` folder
   - Either drag & drop the folder
   - Or click "Select from computer" and choose `dist/`
9. Click **Deploy site**
10. Wait for deployment (usually 30-60 seconds)
11. Note your deployment URL (e.g., `https://app-yox.pages.dev`)

**Important:** Remember your project name (`app`) - you'll need it for CLI deployments.

### Step 1.2: Deploy via CLI (Subsequent Deployments)

After initial dashboard setup, use CLI for faster deployments:

```bash
npm run deploy
```

This runs:
1. `vite build` - Creates production build in `dist/`
2. `wrangler pages deploy ./dist` - Uploads to Cloudflare Pages

**Expected output:**
```
✨ Success! Uploaded 0 files (11 already uploaded)
✨ Uploading Functions bundle
🌎 Deploying...
✨ Deployment complete! Take a peek over at https://e207064c.app-yox.pages.dev
```

## Part 2: KV Namespace Setup

Contact form submissions require a Cloudflare KV namespace for storage.
KV is also used for rate limiting (stores per-IP submission counts).

### Step 2.1: Create KV Namespace

**Method A: Via Wrangler CLI (Recommended)**

```bash
npx wrangler kv namespace create "CONTACT_SUBMISSIONS"
```

**Output:**
```
🌀 Creating namespace with title "twistan-CONTACT_SUBMISSIONS"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "CONTACT_SUBMISSIONS", id = "99b1efa188d544c78cff0a633c22d6df" }
```

**Method B: Via Cloudflare Dashboard**

1. Go to **Workers & Pages** → **KV** (in left sidebar)
2. Click **Create namespace** button
3. Enter namespace name: `twistan-CONTACT_SUBMISSIONS`
4. Click **Add**
5. Copy the namespace ID from the list (looks like `99b1efa188d544c78cff0a633c22d6df`)

### Step 2.2: Update wrangler.toml

Add the namespace configuration to `wrangler.toml`:

```toml
name = "twistan"
compatibility_date = "2024-10-01"

[[kv_namespaces]]
binding = "CONTACT_SUBMISSIONS"
id = "99b1efa188d544c78cff0a633c22d6df"  # Use YOUR namespace ID
```

This enables KV access during local preview (`npm run preview`).

### Step 2.3: Bind KV to Pages Project

**Critical:** KV bindings for **production** must be configured in the dashboard separately.

1. Go to **Workers & Pages**
2. Click on your **app** project
3. Click **Settings** tab (top of page)
4. Scroll down to **Functions** section
5. Find **KV namespace bindings** subsection
6. Click **Add binding** button
7. Fill in the form:
   - **Variable name:** `CONTACT_SUBMISSIONS` (must match exactly)
   - **KV namespace:** Select `twistan-CONTACT_SUBMISSIONS` from dropdown
8. Click **Save** button
9. **Important:** You must redeploy for binding to take effect
   ```bash
   npm run deploy
   ```

**Verification:**

After redeployment, the binding should appear in Settings → Functions → KV namespace bindings table:

| Variable name       | KV namespace                 |
|---------------------|------------------------------|
| CONTACT_SUBMISSIONS | twistan-CONTACT_SUBMISSIONS  |

## Part 2.5: Turnstile CAPTCHA Setup (Optional but Recommended)

Add bot protection to contact form with Cloudflare Turnstile.

**See [Security Enhancements Guide](SECURITY_ENHANCEMENTS.md#4-captcha-optional) for complete setup.**

**Quick setup:**
1. Go to **Turnstile** in Cloudflare dashboard
2. Create widget with your domain
3. Add `TURNSTILE_SECRET_KEY` to Environment Variables
4. Site key already configured in code: `0x4AAAAAACciy0Z_rZz_YPMG`

**Benefits:**
- Blocks bot submissions
- Works with rate limiting for multi-layer protection
- Free unlimited usage
- Privacy-friendly (no user tracking)

## Part 3: Custom Domain Setup

### Step 3.1: Add Domain to Cloudflare (If Not Already)

**If domain is registered elsewhere:**

1. Go to **Websites** in Cloudflare dashboard
2. Click **Add a site**
3. Enter your domain: `twistan.com`
4. Select plan (Free is fine)
5. Cloudflare will scan DNS records
6. Review and confirm DNS records
7. Cloudflare provides nameservers (e.g., `ns1.cloudflare.com`, `ns2.cloudflare.com`)
8. Update nameservers at your domain registrar
9. Wait for DNS propagation (usually 1-24 hours)

**If domain already on Cloudflare:**
- Skip to Step 3.2

### Step 3.2: Add Custom Domain to Pages Project

1. Go to **Workers & Pages** → **app** project
2. Click **Custom domains** tab
3. Click **Set up a custom domain** button
4. Enter domain: `twistan.com`
5. Click **Continue**
6. Cloudflare will validate and show DNS instructions

### Step 3.3: Configure DNS Records

**If domain is on Cloudflare:**

Cloudflare automatically creates the necessary records. Verify:

1. Go to **DNS** → **Records** for `twistan.com`
2. Check for CNAME record:
   - **Type:** CNAME
   - **Name:** `@` (or `twistan.com`)
   - **Target:** `app-yox.pages.dev` (your Pages subdomain)
   - **Proxy status:** Proxied (orange cloud icon)
   - **TTL:** Auto

**Manual CNAME setup (if needed):**

1. Go to **DNS** → **Records**
2. Click **Add record**
3. Configure:
   - **Type:** CNAME
   - **Name:** `@`
   - **Target:** `app-yox.pages.dev`
   - **Proxy status:** Proxied ✓
   - **TTL:** Auto
4. Click **Save**

### Step 3.4: SSL/TLS Configuration

Cloudflare automatically provisions SSL certificates for custom domains.

**Verify SSL settings:**

1. Go to **SSL/TLS** for your domain
2. Encryption mode should be **Full** or **Full (strict)**
3. **Universal SSL** should show as **Active**
4. Certificate status: **Active** (may take 5-10 minutes on first setup)

### Step 3.5: Verify Custom Domain

**DNS propagation check:**
```bash
dig twistan.com
# Or
nslookup twistan.com
```

Should show Cloudflare IPs.

**HTTPS test:**
```bash
curl -I https://twistan.com
```

Should return `HTTP/2 200` with Cloudflare headers.

**Browser test:**
- Visit `https://twistan.com`
- Check for valid SSL certificate (lock icon)
- Site should load normally

## Part 4: Testing and Verification

### Test Contact Form

1. Visit `https://twistan.com/contact`
2. Fill out form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Message: "Testing contact form"
3. **Complete CAPTCHA** (if Turnstile configured)
4. Click **Send Message**
5. Should show: "Message sent. I'll get back to you soon."
6. Should NOT show: "Server error (500)" or CAPTCHA errors

**Security features active:**
- ✅ Rate limiting (5 per hour per IP)
- ✅ CAPTCHA verification (if configured)
- ✅ Input validation (client + server)
- ✅ Security headers applied

### Verify KV Storage

**Check submission was stored:**

```bash
npx wrangler kv key list \
  --namespace-id=99b1efa188d544c78cff0a633c22d6df \
  --prefix="contact_"
```

**Expected output:**
```json
[
  {
    "name": "contact_2026-02-14T14:56:04.460Z_ba66f2e3-df9b-4c47-a732-a7e40a4faa87"
  }
]
```

**Retrieve submission:**
```bash
npx wrangler kv key get "contact_2026-02-14T14:56:04.460Z_..." \
  --namespace-id=99b1efa188d544c78cff0a633c22d6df
```

**Expected output:**
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "message": "Testing contact form",
  "submittedAt": "2026-02-14T14:56:04.460Z"
}
```

### Test Functions Endpoints

**Health check:**
```bash
curl https://twistan.com/api/health
```

**Expected:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-14T15:30:00.000Z"
}
```

**Contact API (direct POST):**
```bash
curl -X POST https://twistan.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test",
    "email": "api@example.com",
    "message": "Direct API test"
  }'
```

**Expected:**
```json
{
  "success": true,
  "message": "Message received."
}
```

## Part 5: Ongoing Operations

### Regular Deployments

```bash
npm run deploy
```

Builds and deploys in one command.

### Retrieving Contact Submissions

**Using helper script:**
```bash
./scripts/get-submissions.sh
```

**Manual CLI retrieval:**
```bash
# List all
npx wrangler kv key list --namespace-id=99b1efa188d544c78cff0a633c22d6df --prefix="contact_"

# Get specific
npx wrangler kv key get "KEY_NAME" --namespace-id=99b1efa188d544c78cff0a633c22d6df
```

**Via dashboard:**
1. **Workers & Pages** → **KV**
2. Click `twistan-CONTACT_SUBMISSIONS`
3. Browse/search keys
4. Click key to view value

### Deleting Submissions

**Single key:**
```bash
npx wrangler kv key delete "contact_2026-02-14T..." \
  --namespace-id=99b1efa188d544c78cff0a633c22d6df
```

**Bulk delete (all contact submissions):**
```bash
# Get all keys and delete (use with caution)
npx wrangler kv key list \
  --namespace-id=99b1efa188d544c78cff0a633c22d6df \
  --prefix="contact_" \
  | jq -r '.[].name' \
  | xargs -I {} npx wrangler kv key delete "{}" --namespace-id=99b1efa188d544c78cff0a633c22d6df
```

### Monitoring Deployments

**View deployment history:**

1. Go to **Workers & Pages** → **app**
2. Click **Deployments** tab
3. See list of all deployments with:
   - Deployment ID
   - Status (Success/Failed)
   - Timestamp
   - Git commit (if using Git integration)
   - Preview URL

**View deployment logs:**

Click on any deployment → View logs to see build output and any errors.

## Troubleshooting

### Issue: Contact Form Returns 500 Error

**Symptoms:**
- Form submission shows "Server error (500)"
- Error message appears in red

**Root cause:**
- KV binding not configured in production
- `context.env.CONTACT_SUBMISSIONS` is undefined

**Fix:**
1. Go to **Workers & Pages** → **app** → **Settings** → **Functions**
2. Verify **KV namespace bindings** shows:
   - Variable: `CONTACT_SUBMISSIONS`
   - Namespace: `twistan-CONTACT_SUBMISSIONS`
3. If missing, add the binding (see Part 2, Step 2.3)
4. Redeploy: `npm run deploy`

### Issue: Custom Domain Shows "Not Found"

**Symptoms:**
- `twistan.com` shows 404 error
- `app-yox.pages.dev` works fine

**Root cause:**
- DNS not configured correctly
- Domain not added to Pages project

**Fix:**
1. Verify custom domain in **Pages** → **app** → **Custom domains**
2. Check DNS records in **DNS** → **Records**
3. Ensure CNAME points to `app-yox.pages.dev`
4. Wait for DNS propagation (5 minutes to 24 hours)

### Issue: SSL Certificate Error

**Symptoms:**
- Browser shows "Your connection is not private"
- Certificate invalid or self-signed warning

**Root cause:**
- SSL certificate still provisioning
- Wrong SSL/TLS mode

**Fix:**
1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to **Full** or **Full (strict)**
3. Check **SSL/TLS** → **Edge Certificates**
4. Verify **Universal SSL** is **Active**
5. Wait 5-15 minutes for certificate provisioning

### Issue: Functions Not Running

**Symptoms:**
- `/api/contact` returns 404
- `/api/health` returns 404

**Root cause:**
- `functions/` folder not deployed
- Functions disabled in Pages settings

**Fix:**
1. Verify `functions/api/contact.js` and `health.js` exist locally
2. Rebuild: `npm run build`
3. Redeploy: `npm run deploy`
4. Check **Settings** → **Functions** - should show "Functions: Enabled"

### Issue: Old Content Showing After Deploy

**Symptoms:**
- Changes not visible after deployment
- Old version of site still loads

**Root cause:**
- Browser cache
- CDN cache

**Fix:**
1. Hard refresh browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Purge Cloudflare cache:
   - Go to **Caching** → **Configuration**
   - Click **Purge Everything**

## Reference

### Important URLs

- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **Production Site:** https://twistan.com
- **Pages URL:** https://app-yox.pages.dev
- **API Health:** https://twistan.com/api/health
- **API Contact:** https://twistan.com/api/contact

### Important IDs

- **Pages Project Name:** `app`
- **KV Namespace ID:** `99b1efa188d544c78cff0a633c22d6df`
- **KV Namespace Name:** `twistan-CONTACT_SUBMISSIONS`
- **KV Binding Variable:** `CONTACT_SUBMISSIONS`

### Commands Quick Reference

```bash
# Build
npm run build

# Deploy
npm run deploy

# List submissions
npx wrangler kv key list --namespace-id=99b1efa188d544c78cff0a633c22d6df --prefix="contact_"

# Get submission
npx wrangler kv key get "KEY" --namespace-id=99b1efa188d544c78cff0a633c22d6df

# Delete submission
npx wrangler kv key delete "KEY" --namespace-id=99b1efa188d544c78cff0a633c22d6df

# List Pages projects
npx wrangler pages project list

# View deployments
npx wrangler pages deployment list --project-name=app
```