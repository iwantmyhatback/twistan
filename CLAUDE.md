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
│   ├── hooks/
│   │   └── usePageTitle.js    # Sets document.title per page, restores on unmount
│   ├── utils/
│   │   ├── ripple.js          # Canvas water-ripple click effect
│   │   ├── imageExplosion.js  # Canvas image-shatter physics animation
│   │   ├── confetti.js        # Canvas confetti drop (birthday easter egg, DPR-scaled)
│   │   └── meltKeyframes.js   # ARCHIVED melt keyframe generators (unused, kept for reuse)
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
- **Layout**: `src/components/Layout.jsx` provides shared navbar, footer, film-grain overlay, idle detection
- **Pages**: Home, About, Projects, Contact, AboutYou, NotFound
- **Components**: Layout, Navbar, Footer, CursorGlow, AnimatedSection, ExplodingText

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
- On deck exhaustion, `spawnImageExplosion` shatters the current image before reshuffling, then reshuffles and avoids repeating the last-shown image
- Image transitions use a clip-path dot→bar→full reveal/exit animation via Motion `AnimatePresence`

### Page Transitions
Page-level transitions use React Router's `viewTransition` prop on `NavLink`/`Link` elements, combined with CSS View Transitions API rules in `src/index.css` (`::view-transition-old(root)` / `::view-transition-new(root)` cross-fade at 0.25–0.3s). Layout renders `<Outlet />` directly — no Motion `AnimatePresence` at the layout level. Individual page sections use `AnimatedSection` (Motion `motion.div` + `useInView`) for staggered entrance animations on scroll.

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
- **Animations**: fade-in, fade-out, slide-up, subtle-pulse
- **No `tailwind.config.js`** — all theme config lives in CSS via `@theme` block

### Custom CSS Utilities
Defined in `src/index.css` @layer components (and below @layer for specificity overrides):
- `.section-container`: max-width container with responsive padding
- `.heading-xl`, `.heading-lg`: responsive heading styles
- `.text-body`: body text style (neutral-400, relaxed leading)
- `.card`: bordered card with hover state
- `.link-hover`: underline-slide hover link effect
- `.nav-active-glow`: terminal-green text shadow for active nav
- `.brand-glow`: blue accent glow for navbar brand
- `.card-inner-highlight`: accent blue box-shadow on hover + child element effects (buttons, links, icons, headings, body text — all excluded from `.prose *` to avoid clashing with markdown content)
- `.github-glow`: SVG drop-shadow green glow on GitHub icon hover (uses drop-shadow not box-shadow for Safari SVG compat)
- `.prose`: GitHub-flavored markdown styles for README panels (headings, pre, code, blockquote, table, lists, hr, checkboxes)
- `.ripple-container`: anchor for canvas-based ripple effect (`position: relative; overflow: hidden`)
- `.glitch-text`: CSS glitch animation for the 404 page heading (`@keyframes glitch` at top level, not inside `@layer`)
- `.about-hidden-text`: invisible easter egg text (color matches background, revealed on selection)

### Design Theme
Dark terminal aesthetic with terminal-green (`#33ff33`) accents for interactive states. Default background is `surface` (#0a0a0a), with lighter surface tones for cards and borders. Blue `accent` used for primary actions and branding. Custom utilities use `var(--color-*)` CSS variables rather than hardcoded hex values.

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
- `Content-Security-Policy` - Single-line CSP (required by Cloudflare Pages — multi-line values are silently dropped)
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

## Easter Eggs

The site contains several hidden interactions. All respect `prefers-reduced-motion` where motion is involved.

| Egg | Trigger | Implementation |
|-----|---------|----------------|
| **Idle droop** | 60s of no user input | `Layout.jsx` `useIdleDetection` adds `body.idle-droop` → CSS `droop` keyframe leans `<main>` 4° over 10s |
| **Hacker mode** | Hold GitHub icon in footer for 5s | `Footer.jsx` `FooterGitHub` adds `body.hacker-mode` for 5s → CSS forces all elements to `#000` bg + `#33ff33` text; overlay message appears |
| **Birthday confetti** | August 5 only (Twistan's birthday) | `Navbar.jsx` detects date → renders `BirthdayCake` 🎂 button; click calls `spawnConfetti()` from `utils/confetti.js` |
| **Hidden About text** | Select text near end of bio paragraph | `.about-hidden-text` CSS — color matches background, visible only on selection |
| **Typewriter Easter egg link** | Scroll to About page, wait 8s | `EasterEggReveal` component types out link to `/about-you` with blinking cursor |
| **Fake skills loading** | Scroll to bottom of skills grid | `SkillsBottomEgg` shows spinner + escalating typewriter messages ("i think hes asleep...") that never resolve |
| **Image explosion** | Click wave button until deck is exhausted | `Home.jsx` calls `spawnImageExplosion()` on last image before reshuffling deck |
| **Footer year secret** | Click copyright year in footer | `YearEasterEgg` types out "days since last bugfix was deployed: X" |
| **ExplodingText** | Click "About Me" heading | Characters shatter with physics, wait `rematerializeDelay` seconds, then vaporize back |

**Note:** `LAST_BUGFIX_DEPLOY` in `Footer.jsx` must be manually updated after each deployment.

## Code Patterns

### Component Style
- Function components with summary JSDoc comments
- Controlled form inputs with useState
- React hooks (useEffect, useRef) for side effects and DOM access
- Destructured props in function signatures
- `usePageTitle(title)` hook in every page component for `document.title` management

### Accessibility Patterns
- All motion/animation utilities (`spawnRipple`, `spawnConfetti`, `spawnImageExplosion`, CursorGlow noise) check `prefers-reduced-motion: reduce` and bail out early
- `scroll-behavior: smooth` wrapped in `@media (prefers-reduced-motion: no-preference)` in CSS
- Mobile menu uses `@headlessui/react` `FocusTrap` + Escape key handler + outside-click dismiss
- Decorative images use `alt=""` (not descriptive alt text)
- Form inputs have `autoComplete` attributes for name/email
- Interactive elements have `aria-label` where visible text is insufficient

### Build Configuration
- `vite.config.js` uses function-style `defineConfig(({ command }) => ({...}))` — `basicSsl()` only in dev (`command === 'serve'`)
- Manual chunk splitting separates `motion/react`, `marked`, and `@fingerprintjs/fingerprintjs` into vendor chunks
- Pages are lazy-loaded via `React.lazy()` in `App.jsx`

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

### Test Suite (184 tests across 19 files)
See [docs/TESTING.md](docs/TESTING.md) for detailed documentation.

- **tests/api/contact.test.js** (24) - API endpoint, rate limiting, CAPTCHA, CORS, validation, error handling
- **tests/Projects.test.jsx** (19) - Project cards, links, tags, README fetch/display/error/toggle, markdown renderer, URL safety, scroll-into-view
- **tests/Footer.test.jsx** (14) - Copyright, GitHub link, hacker mode hold, year easter egg
- **tests/Contact.test.jsx** (13) - Turnstile init/cleanup/polling-cap, form validation, submission, error handling
- **tests/utils/ripple.test.js** (13) - Canvas ripple creation, animation loop, color parsing, cleanup, motion guard
- **tests/ExplodingText.test.jsx** (12) - Idle render, click, reduced motion, state transitions
- **tests/Home.test.jsx** (11) - Image carousel, wave button, error handling, deck reshuffle, decorative alt text
- **tests/About.test.jsx** (11) - Skills grid, easter egg link, typewriter reveal, hidden text
- **tests/api/turnstile.test.js** (10) - Turnstile dummy key matrix: pass/fail/token-spent, key pairing, network failure, SKIP_CAPTCHA
- **tests/utils/imageExplosion.test.js** (9) - Reduced motion, null guards, overlay lifecycle, rAF loop, off-screen optimization
- **tests/CursorGlow.test.jsx** (8) - Canvas rendering, noise loop, cleanup, media query change handler, motion guard
- **tests/Navbar.test.jsx** (8) - Navigation, mobile menu, focus trap, escape/outside-click, accessibility
- **tests/utils/confetti.test.js** (7) - Motion guard, canvas lifecycle, safety timeout, custom options
- **tests/Layout.test.jsx** (5) - Composition, skip-to-content
- **tests/utils/validation.test.js** (5) - Email validation, rate limiting logic
- **tests/AnimatedSection.test.jsx** (4) - Animation wrapper props
- **tests/NotFound.test.jsx** (4) - 404 page, home link
- **tests/App.test.jsx** (4) - Routing and navigation
- **tests/api/health.test.js** (3) - Health check endpoint

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
- `matchMedia` mocks must be query-aware when testing motion guards (e.g., `matches: !query.includes('prefers-reduced-motion')`)
- Canvas mock contexts need `scale: vi.fn()` for DPR-scaled utilities (confetti, CursorGlow)