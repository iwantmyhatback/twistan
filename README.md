# Twistan Portfolio Site

React SPA portfolio site deployed to Cloudflare Pages with serverless contact form API.

## Quick Links

- **[Local Development Guide](docs/LOCAL_DEVELOPMENT.md)** - Setup, workflow, debugging
- **[Cloudflare Deployment Guide](docs/CLOUDFLARE_SETUP.md)** - Production setup, DNS, KV configuration
- **[Testing Guide](docs/TESTING.md)** - Test suite documentation, coverage, and patterns

## Tech Stack

- **Frontend**: React 19, React Router 7, Vite 7
- **Styling**: Tailwind CSS 4 (dark terminal theme, CSS-first config)
- **Animations**: Framer Motion
- **Deployment**: Cloudflare Pages
- **API**: Cloudflare Pages Functions
- **Storage**: Cloudflare KV (contact submissions)
- **Security**: Cloudflare Turnstile (CAPTCHA), rate limiting, security headers

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account (for deployment and KV storage)

### Install and Run

```bash
# Install dependencies
npm install

# Start development server (Vite with HMR)
npm run dev
# → http://localhost:5173

# Or preview with Cloudflare Pages Functions
npm run preview
# → http://localhost:8788 (requires KV setup)
```

**See [Local Development Guide](docs/LOCAL_DEVELOPMENT.md) for detailed setup and workflow.**

## Essential Commands

```bash
npm run dev       # Vite dev server (fast, no KV)
npm run preview   # Wrangler preview (with KV and Functions)
npm run build     # Production build → dist/
npm run lint      # ESLint check
npm test          # Run test suite (watch mode)
npm run test:run  # Run tests once (CI mode)
npm run deploy    # Build and deploy to Cloudflare Pages
```

## Deployment

**See [Cloudflare Setup Guide](docs/CLOUDFLARE_SETUP.md) for complete deployment instructions.**

Quick deploy (after initial setup):
```bash
npm run deploy
```

## Contact Form Submissions

Contact form submissions are stored in Cloudflare KV.

**Retrieve submissions:**
```bash
./scripts/get-submissions.sh
```

**Clear submissions:**
```bash
./scripts/clear-submissions.sh
```

**See [Scripts README](scripts/README.md) for complete script documentation and [Cloudflare Setup Guide](docs/CLOUDFLARE_SETUP.md#part-5-ongoing-operations) for detailed KV operations.**

## Configuration Files

### wrangler.toml

This configures KV for **local development** (`npm run preview`). Production bindings must be set in Cloudflare dashboard.

### package.json Scripts

- `dev` - Vite dev server (HMR, no KV)
- `build` - Production build to `dist/`
- `lint` - ESLint check
- `preview` - Wrangler local preview with KV
- `deploy` - Build and deploy to Cloudflare Pages

## Styling System

### Design System

Dark terminal aesthetic with custom Tailwind theme:
- **Colors:** `surface` (dark grays), `accent` (blue), `terminal` (green #33ff33)
- **Fonts:** Inter (sans), JetBrains Mono (mono), Ubuntu (display)
- **Custom utilities:** Defined in `src/index.css` (@layer components)

**See `src/index.css` for complete theme configuration (Tailwind v4 CSS-first config with `@theme` block).**

## Security Features

Multi-layer protection for contact form and site security:

### Contact Form Protection
- ✅ **Rate Limiting** - 5 submissions per IP per hour (KV-based)
- ✅ **CAPTCHA** - Cloudflare Turnstile bot protection
- ✅ **Input Validation** - Client and server-side validation
- ✅ **CORS** - Proper cross-origin headers

### Security Headers
Applied to all routes via `public/_headers`:
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Referrer-Policy**: Controls referrer information leakage
- **Permissions-Policy**: Restricts browser features
- **X-XSS-Protection**: Legacy XSS protection for older browsers

### Privacy
- **AboutYou Page**: Prominent disclosure of data collection practices
- **Client-side Processing**: Fingerprinting data never sent to server
- **Transparent**: Clear explanation of external API usage

## Testing

Comprehensive test suite with 89 tests across 15 files covering components, API endpoints, routing, and utilities.

**Framework:** Vitest 4 + React Testing Library

**Coverage:**
- ✅ Contact form validation and submission
- ✅ API rate limiting, CAPTCHA verification, KV storage
- ✅ Route navigation and 404 handling
- ✅ Email validation and utility functions

**Run tests:**
```bash
npm test           # Watch mode
npm run test:run   # CI mode
npm run test:ui    # Interactive UI
```

**See [Testing Guide](docs/TESTING.md) for detailed documentation.**

## Troubleshooting

**Contact form 500 error:** KV binding not configured in production → See [Cloudflare Setup Guide](docs/CLOUDFLARE_SETUP.md#troubleshooting)

**Local preview won't start:** KV namespace missing or wrong ID → See [Local Development Guide](docs/LOCAL_DEVELOPMENT.md#troubleshooting)

**Build fails:** Try clean install:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**For detailed troubleshooting:** See [Cloudflare Setup](docs/CLOUDFLARE_SETUP.md#troubleshooting) and [Local Development](docs/LOCAL_DEVELOPMENT.md#troubleshooting) guides.


