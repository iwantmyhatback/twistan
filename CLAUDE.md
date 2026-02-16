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

React SPA portfolio site built with Vite, deployed to Cloudflare Pages with serverless API endpoints. Uses Tailwind CSS with a dark terminal-inspired theme and Motion for page transitions.

## Documentation Index

- **[README.md](README.md)** - Quick start, essential commands, tech stack overview
- **[docs/CLOUDFLARE_SETUP.md](docs/CLOUDFLARE_SETUP.md)** - Complete Cloudflare Pages + DNS + KV deployment guide
- **[docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md)** - Local environment setup and development workflow
- **[docs/TESTING.md](docs/TESTING.md)** - Test suite documentation, coverage, and testing patterns

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
│   └── index.css       # Tailwind v4 @import + @theme + custom utilities
├── functions/
│   └── api/
│       ├── contact.js  # POST /api/contact - Contact form handler
│       └── health.js   # GET /api/health - Health check endpoint
├── scripts/
│   ├── get-submissions.sh    # Retrieve contact form submissions from KV
│   └── clear-submissions.sh  # Clear all stored contact form submissions
├── dist/               # Build output (generated)
├── wrangler.toml       # Cloudflare configuration
├── vite.config.js      # Vite build configuration
├── eslint.config.js    # ESLint 9 flat config
└── package.json
```

### Frontend Structure
- **Entry**: `src/main.jsx` → `src/App.jsx`
- **Routing**: React Router 7 (`react-router` package) with lazy-loaded pages in `src/pages/`
- **Layout**: `src/components/Layout.jsx` provides shared navbar, footer, page transitions
- **Pages**: Home, About, Projects, Contact, AboutYou, NotFound
- **Components**: Reusable UI in `src/components/`

### Projects README Rendering
Project tiles on the Projects page have expandable README panels fetched from GitHub at runtime:
- **Markdown parsing**: `marked` library with a custom renderer (headings get Tailwind classes, links open in new tabs, images validated, raw HTML stripped for XSS prevention)
- **URL sanitization**: `isSafeUrl()` whitelists http(s)/relative/anchor URLs, blocks `javascript:`, `data:`, `vbscript:` schemes
- **Caching**: Module-scope `Map` persists parsed HTML across navigations (survives component unmount)
- **Fetch lifecycle**: `AbortController` cancels in-flight requests on panel close, tile switch, or unmount
- **Ripple effect**: Tile-level `onClick` triggers `spawnRipple()` on the `.ripple-container` div; the README button uses `stopPropagation` and calls `handleTileClick` separately

### Home Image Carousel
The Home page displays a shuffled deck of wave GIF/WebP images from `src/assets/ImageUrls.js`:
- A pinned first image is always shown on initial load
- Remaining images are Fisher-Yates shuffled using `crypto.getRandomValues`
- On deck exhaustion, reshuffles and avoids repeating the last-shown image

### Page Transitions
Uses Motion with `AnimatePresence` and `motion.main` in Layout component. Each route transition animates with 0.3s fade + vertical slide. Individual page sections use `AnimatedSection` component for staggered entrance animations.

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
Tailwind v4 CSS-first config in `src/index.css` using `@import "tailwindcss"` and `@theme` block:
- **Colors**: `surface` (dark grays), `accent` (blue), `terminal` (green)
- **Fonts**: Inter (sans), JetBrains Mono (mono), Ubuntu (display)
- **Animations**: fade-in, slide-up, subtle-pulse
- **No `tailwind.config.js`** — all theme config lives in CSS via `@theme` block

### Custom CSS Utilities
Defined in `src/index.css` @layer components:
- `.section-container`: max-width container with responsive padding
- `.heading-xl`, `.heading-lg`: responsive heading styles
- `.card`: bordered card with hover state
- `.nav-active-glow`: terminal-green text shadow for active nav
- `.brand-glow`: blue accent glow for navbar brand
- `.card-inner-highlight`: accent blue glow on card hover with child element effects (buttons, links, icons, text)
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

### Test Suite (153 tests across 18 files)
See [docs/TESTING.md](docs/TESTING.md) for detailed documentation.

- **tests/api/contact.test.js** (24) - API endpoint, rate limiting, CAPTCHA, CORS, validation, error handling
- **tests/Projects.test.jsx** (18) - Project cards, links, tags, README fetch/display/error/toggle, markdown renderer, URL safety
- **tests/Contact.test.jsx** (13) - Turnstile init, form validation, submission, error handling
- **tests/utils/ripple.test.js** (13) - Canvas ripple creation, animation loop, color parsing, cleanup
- **tests/ExplodingText.test.jsx** (12) - Idle render, click, reduced motion, state transitions
- **tests/Home.test.jsx** (9) - Image carousel, wave button, error handling, deck reshuffle
- **tests/utils/imageExplosion.test.js** (8) - Reduced motion, null guards, overlay lifecycle, rAF loop
- **tests/CursorGlow.test.jsx** (8) - Canvas rendering, noise loop, cleanup, media query change handler
- **tests/Navbar.test.jsx** (6) - Navigation, mobile menu, accessibility
- **tests/Layout.test.jsx** (5) - Composition, skip-to-content
- **tests/utils/validation.test.js** (5) - Email validation, rate limiting logic
- **tests/AnimatedSection.test.jsx** (4) - Animation wrapper props
- **tests/About.test.jsx** (4) - Skills grid, easter egg link
- **tests/NotFound.test.jsx** (4) - 404 page, home link
- **tests/App.test.jsx** (4) - Routing and navigation
- **tests/api/turnstile.test.js** (10) - Turnstile dummy key matrix: pass/fail/token-spent, key pairing, network failure, SKIP_CAPTCHA
- **tests/api/health.test.js** (3) - Health check endpoint
- **tests/Footer.test.jsx** (3) - Copyright, GitHub link

### Running Tests
```bash
npm test           # Watch mode
npm run test:run   # CI mode (single run)
npm run test:ui    # Interactive UI
npm run test:coverage  # Coverage report
DEBUG_TESTS=1 npm run test:run  # Show suppressed console/stderr output
```

### Key Testing Patterns
- Component tests use `createMemoryRouter` + `RouterProvider` for routing context
- API tests mock Cloudflare context with KV and environment bindings
- Global mocks in `tests/setup.js` for browser APIs (matchMedia, IntersectionObserver, Turnstile)
- DOM utility tests create real elements for verifying manipulation