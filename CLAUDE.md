# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL DIRECTIVE: Documentation Maintenance

**ALWAYS update or create documentation files when completing tasks:**
- Update relevant docs in `docs/` when modifying features or architecture
- Update README.md when adding new commands, setup steps, or high-level changes
- Create new documentation files in `docs/` for new features or complex implementations
- Mark in-progress work clearly (e.g., "🚧 IN PROGRESS") in documentation
- Remove or update outdated information
- Cross-reference related documentation files instead of duplicating content

## Project Overview

React SPA portfolio site built with Vite, deployed to Cloudflare Pages with serverless API endpoints. Uses Tailwind CSS with a dark terminal-inspired theme and Framer Motion for page transitions.

## Documentation Index

- **[README.md](README.md)** - Quick start, essential commands, tech stack overview
- **[docs/CLOUDFLARE_SETUP.md](docs/CLOUDFLARE_SETUP.md)** - Complete Cloudflare Pages + DNS + KV deployment guide
- **[docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md)** - Local environment setup and development workflow
- **[docs/TESTING.md](docs/TESTING.md)** - Test suite documentation, coverage, and testing patterns
- **[docs/EMAIL_NOTIFICATIONS_PLAN.md](docs/EMAIL_NOTIFICATIONS_PLAN.md)** - 🚧 Email notification implementation plan (in progress)

**For setup/deployment questions:** Refer to documentation files above rather than duplicating content here.

## Architecture

### Project Structure

```
twistan/
├── src/
│   ├── pages/          # Route components (Home, About, Projects, Contact, etc.)
│   ├── components/     # Reusable UI components (Layout, Navbar, Footer, etc.)
│   ├── assets/         # Images and static assets
│   ├── main.jsx        # React app entry point
│   ├── App.jsx         # Router configuration with lazy loading
│   └── index.css       # Tailwind base + custom utilities
├── functions/
│   └── api/
│       ├── contact.js  # POST /api/contact - Contact form handler
│       └── health.js   # GET /api/health - Health check endpoint
├── scripts/
│   └── get-submissions.sh  # Retrieve contact form submissions from KV
├── dist/               # Build output (generated)
├── wrangler.toml       # Cloudflare configuration
├── vite.config.js      # Vite build configuration
├── tailwind.config.js  # Tailwind theme customization
└── package.json
```

### Frontend Structure
- **Entry**: `src/main.jsx` → `src/App.jsx`
- **Routing**: React Router with lazy-loaded pages in `src/pages/`
- **Layout**: `src/components/Layout.jsx` provides shared navbar, footer, page transitions
- **Pages**: Home, About, Projects, Contact, AboutYou, NotFound
- **Components**: Reusable UI in `src/components/`

### Page Transitions
Uses Framer Motion with `AnimatePresence` and `motion.main` in Layout component. Each route transition animates with 0.3s fade + vertical slide. Individual page sections use `AnimatedSection` component for staggered entrance animations.

### Cloudflare Pages Functions
API endpoints are Cloudflare Pages Functions in `functions/api/`:
- `contact.js`: POST handler for contact form with rate limiting, CAPTCHA verification, validation, and KV storage
- `health.js`: GET endpoint returning status and timestamp

Functions export HTTP method handlers (`onRequestGet`, `onRequestPost`, `onRequestOptions`). Access Cloudflare bindings via `context.env.*` (e.g., `context.env.CONTACT_SUBMISSIONS` for KV, `context.env.TURNSTILE_SECRET_KEY` for CAPTCHA).

### KV Storage
Binding: `CONTACT_SUBMISSIONS` (configured in wrangler.toml)
- Contact form submissions stored with timestamped UUID keys
- Format: `contact_{ISO_timestamp}_{uuid}`

## Styling System

### Tailwind Configuration
Custom theme extends defaults in `tailwind.config.js`:
- **Colors**: `surface` (dark grays), `accent` (blue), `terminal` (green)
- **Fonts**: Inter (sans), JetBrains Mono (mono), Ubuntu (display)
- **Animations**: fade-in, slide-up, subtle-pulse

### Custom CSS Utilities
Defined in `src/index.css` @layer components:
- `.section-container`: max-width container with responsive padding
- `.heading-xl`, `.heading-lg`: responsive heading styles
- `.card`: bordered card with hover state
- `.nav-active-glow`: terminal-green text shadow for active nav
- `.brand-glow`: blue accent glow for navbar brand
- `.card-terminal-hover`: green border glow on card hover
- `.github-glow`: green drop-shadow on GitHub icon hover

### Design Theme
Dark terminal aesthetic with terminal-green (`#33ff33`) accents for interactive states. Default background is `surface` (#0a0a0a), with lighter surface tones for cards and borders. Blue `accent` used for primary actions and branding.

## Deployment

See [docs/CLOUDFLARE_SETUP.md](docs/CLOUDFLARE_SETUP.md) for complete deployment guide.

**Quick reference:**
- Deploy: `npm run deploy` (builds and deploys to Cloudflare Pages)
- Build output: `dist/`
- Config: `wrangler.toml`
- KV binding: `CONTACT_SUBMISSIONS` (must be configured in Cloudflare dashboard for production)

## Security Features

### Contact Form Protection (Multi-Layer)
1. **Rate Limiting** - KV-based, 5 submissions per IP per hour
2. **CAPTCHA** - Cloudflare Turnstile bot protection (Managed mode)
3. **Input Validation** - Client and server-side (required fields, email format, type checking)
4. **CORS** - Proper headers on all API responses

### Security Headers
Applied via `public/_headers` to all routes:
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` - Restricts browser features (geolocation allowed for AboutYou page)
- `X-XSS-Protection: 1; mode=block`

### Privacy Disclosure
AboutYou page includes prominent warning banner explaining:
- Data collection purposes (educational)
- Types of data collected (device info, browser fingerprinting, IP geolocation)
- Client-side only processing (no server storage)
- External API usage (ipapi.co, ipify.org)

## Code Patterns

### Component Style
- Function components with summary JSDoc comments
- Controlled form inputs with useState
- React hooks (useEffect, useRef) for side effects and DOM access
- Destructured props in function signatures

### Commenting Style
- **Summary comments** at top of functions/components describing purpose, parameters, return values
- **Minimal inline comments** - only for antipatterns, exceptions, or non-obvious logic
- **Section headers** for major code blocks
- Avoid redundant comments explaining obvious code

### API Error Handling
Contact form implements comprehensive validation and security:
- Client-side: required fields, email format, CAPTCHA completion
- Server-side: Turnstile verification, rate limit check, field validation, type checking
- CORS headers on all responses
- Structured error responses with `{ success, error }` format
- Rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`)

## Testing

### Test Framework
- **Vitest** v4.0.18 with jsdom environment
- **@testing-library/react** for component testing
- **@testing-library/jest-dom** for DOM assertions

### Test Suite (30 tests)
See [docs/TESTING.md](docs/TESTING.md) for detailed documentation.

- **tests/Contact.test.jsx** - Form validation, submission, error handling
- **tests/api/contact.test.js** - API endpoint, rate limiting, CAPTCHA, KV storage
- **tests/App.test.jsx** - Routing and navigation
- **tests/utils/validation.test.js** - Email validation, rate limiting logic

### Running Tests
```bash
npm test           # Watch mode
npm run test:run   # CI mode (single run)
npm run test:ui    # Interactive UI
npm run test:coverage  # Coverage report
```

### Key Testing Patterns
- Component tests wrap in `BrowserRouter` for routing context
- API tests mock Cloudflare context with KV and environment bindings
- Global mocks in `tests/setup.js` for browser APIs
- Route tests use `createMemoryRouter` to avoid router nesting issues