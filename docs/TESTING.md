# Testing Documentation

Comprehensive test suite for the Twistan portfolio application using Vitest and React Testing Library.

## Test Coverage

**Total: 153 tests across 18 test files**

| Metric | Coverage |
|--------|----------|
| Statements | 95.10% |
| Branches | 82.29% |
| Functions | 94.50% |
| Lines | 98.05% |

### Test Files

#### API Tests

1. **tests/api/contact.test.js** (24 tests)
   - **Rate Limiting** (3): Request allowance, blocking, headers
   - **CAPTCHA Verification** (5): Token requirement, Cloudflare API verification, invalid token handling, fail-closed behavior, SKIP_CAPTCHA flag
   - **Input Validation** (5): Required fields, email format, field types, name/message length limits
   - **KV Storage** (3): Submission storage, whitespace trimming, timestamp inclusion
   - **Error Handling** (2): Malformed JSON request, missing KV binding fallback
   - **CORS** (6): Preflight handling, origin reflection, production fallback, localhost support, *.pages.dev support, malformed origin URL handling

2. **tests/api/turnstile.test.js** (10 tests)
   - **Always-Pass Secret Key** (2): Dummy token acceptance, siteverify payload verification
   - **Always-Fail Secret Key** (1): Dummy token rejection with fail key
   - **Token-Already-Spent** (1): Duplicate/expired token rejection
   - **Key Pairing Mismatches** (2): Dummy token + real secret, real token + dummy secret
   - **Missing Token** (1): Request rejected before network call when no token provided
   - **Siteverify Network Failure** (1): 503 response when Cloudflare API unreachable
   - **SKIP_CAPTCHA Dev Mode** (2): Bypass with `true` flag, rejection with other values

3. **tests/api/health.test.js** (3 tests)
   - Status code and response body
   - JSON content type header
   - ISO timestamp validation

#### Component Tests

4. **tests/Navbar.test.jsx** (6 tests)
   - Brand link rendering
   - Desktop nav link rendering
   - Avatar image rendering
   - Hamburger aria-expanded state
   - Mobile menu toggle
   - Mobile menu close on nav link click

5. **tests/Footer.test.jsx** (3 tests)
   - Dynamic copyright year
   - Brand name rendering
   - GitHub link with security attributes

6. **tests/Layout.test.jsx** (5 tests)
   - Children content rendering
   - Navbar and footer composition
   - Skip-to-content accessibility link
   - Main content target ID

7. **tests/AnimatedSection.test.jsx** (4 tests)
   - Children rendering
   - Custom className forwarding
   - Default props handling
   - Multiple children rendering

8. **tests/CursorGlow.test.jsx** (8 tests)
   - Canvas element rendering
   - Pointer-events-none class
   - Responsive visibility classes
   - Animation loop skipped on mobile
   - Animation loop started on desktop
   - Noise rendering (createImageData/putImageData)
   - Media query change handler cancels animation

9. **tests/ExplodingText.test.jsx** (12 tests)
   - Idle render, click, reduced motion, cleanup (9 tests)
   - Timer-driven state transitions: exploding → waiting → rematerializing (3 tests)

#### Page Tests

10. **tests/Contact.test.jsx** (13 tests)
   - **Turnstile Initialization** (4): Polling for widget, immediate render, render error handling, widget reset on error
   - **Form Validation** (3): Required fields, email format, CAPTCHA requirement
   - **Submission** (4): Successful submission, API error, non-JSON error response, network failure
   - **Reset** (2): Form clearing after success, Turnstile widget reset

11. **tests/Home.test.jsx** (9 tests)
    - Wave button rendering
    - Image display with external src
    - spawnRipple called on button click
    - Button element type
    - Image accessibility (alt text)
    - Image load handler
    - Image error handler
    - Deck reshuffle via click exhaustion
    - Deck reshuffle via error exhaustion

12. **tests/About.test.jsx** (4 tests)
    - Heading rendering
    - Intro text rendering
    - All 12 skill tiles rendering
    - Easter egg link to about-you page

13. **tests/Projects.test.jsx** (18 tests)
    - **Page Rendering** (7): Heading, project titles, descriptions, GitHub links, tags, card count, README buttons
    - **README Interaction** (7): Panel toggle, loading state, content display, error on failure, close/reopen, API+raw fallback failure, AbortError handling
    - **Markdown Renderer** (2): Heading levels with Tailwind classes, links/images/hr/XSS stripping, URL safety (javascript:/vbscript:/data: blocked, relative/anchor allowed)
    - **Fetch Pipeline** (2): raw.githubusercontent fallback, master branch fallback

14. **tests/NotFound.test.jsx** (4 tests)
    - 404 heading rendering
    - Descriptive message
    - Home link
    - Glitch-text CSS class

15. **tests/App.test.jsx** (4 tests)
    - Home page routing
    - Contact page routing
    - About page routing
    - 404 handling for unknown routes

#### Utility Tests

16. **tests/utils/ripple.test.js** (13 tests)
    - Ripple canvas element creation
    - Canvas sizing to container dimensions
    - Canvas positioning to fill container
    - Pointer-events-none style
    - Append to currentTarget
    - Null context fallback (canvas removed, no rAF)
    - requestAnimationFrame invocation
    - Ring and gradient drawing on animation frame
    - Radial gradient glow effect
    - Frame scheduling during animation
    - Canvas removal on animation complete
    - RGB CSS variable color parsing
    - Hex CSS variable color parsing

17. **tests/utils/validation.test.js** (5 tests)
    - Email validation (valid/invalid formats)
    - Rate limiting timestamp bucketing (UTC)
    - Rate limiting key uniqueness
    - KV key generation format

18. **tests/utils/imageExplosion.test.js** (8 tests)
    - Reduced motion bailout (immediate resolve)
    - Null imgElement bailout
    - Incomplete image bailout
    - Overlay canvas appended to document.body
    - Animation lifecycle (rAF → overlay removal → promise resolve)
    - Null overlay context graceful handling
    - Null srcCanvas context graceful handling
    - Frame scheduling during animation

### Per-File Coverage

| File | Stmts | Branch | Funcs | Lines |
|------|-------|--------|-------|-------|
| contact.js | 99% | 89% | 100% | 100% |
| health.js | 100% | 100% | 100% | 100% |
| AnimatedSection.jsx | 100% | 75% | 100% | 100% |
| CursorGlow.jsx | 95% | 63% | 100% | 100%  |
| ExplodingText.jsx | 91% | 78% | 93% | 97% |
| Footer.jsx | 100% | 100% | 100% | 100% |
| Layout.jsx | 100% | 100% | 100% | 100% |
| Navbar.jsx | 100% | 100% | 100% | 100% |
| About.jsx | 100% | 100% | 100% | 100% |
| Contact.jsx | 100% | 86% | 100% | 100% |
| Home.jsx | 98% | 75% | 100% | 98% |
| NotFound.jsx | 100% | 100% | 100% | 100% |
| Projects.jsx | 87% | 77% | 88% | 92% |
| imageExplosion.js | 100% | 91% | 100% | 100% |
| ripple.js | 95% | 74% | 80% | 99% |

### Known Coverage Gaps

- **Projects.jsx** (87% stmts): Remaining uncovered lines are the `marked.parse` error fallback (line 236), `scrollIntoView` scheduling within `requestAnimationFrame`, and some JSX branch paths in the tile rendering. The module-scope `readmeCache` makes full isolation between tests challenging.
- **ExplodingText.jsx** (92% stmts): `onAnimationComplete` callback on the last rematerializing character (resets to idle) requires Motion to actually fire animation events, which jsdom doesn't support.
- **CursorGlow.jsx** (63% branch): The noise rendering loop and resize handler branches are exercised but v8 reports partial branch coverage due to jsdom canvas limitations.
- **AboutYou.jsx**: Not tested — complex fingerprinting page with many browser API dependencies (WebRTC, WebGL, Battery API, Geolocation). Would require extensive mocking for limited value.

## Running Tests

```bash
# Run tests in watch mode (interactive)
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run tests with verbose console output (shows all console.log/warn/error and jsdom stderr)
DEBUG_TESTS=1 npm run test:run
```

Console output (`console.log`, `console.warn`, `console.error`) and jsdom stderr messages (e.g., `Not implemented: HTMLCanvasElement`) are suppressed by default for clean output. Set `DEBUG_TESTS=1` to restore them when debugging test failures.

## Test Configuration

- **Framework**: Vitest v4.0.18
- **Environment**: jsdom (simulates browser environment)
- **Testing Library**: @testing-library/react v16.3.2
- **Coverage Provider**: v8 (via @vitest/coverage-v8)
- **Setup File**: `tests/setup.js` (global mocks and cleanup)

### Global Mocks (tests/setup.js)

- `window.matchMedia` — Media query matching (returns `matches: false` by default)
- `window.IntersectionObserver` — Intersection observation (no-op)
- `window.turnstile` — Cloudflare Turnstile CAPTCHA widget (mock render/reset/remove)
- `console.log/warn/error` — Suppressed unless `DEBUG_TESTS=1` (keeps test output clean)
- `process.stderr.write` — Filters jsdom `Not implemented` messages unless `DEBUG_TESTS=1`

### Key Testing Patterns

**Component tests** wrap in router context:
```javascript
import { createMemoryRouter, RouterProvider } from 'react-router';

const router = createMemoryRouter(
  [{ path: '*', element: <Component /> }],
  { initialEntries: ['/'] }
);
render(<RouterProvider router={router} />);
```

**API tests** mock the Cloudflare Pages Function context:
```javascript
const createMockContext = (overrides = {}) => ({
  request: {
    json: vi.fn().mockResolvedValue({ /* body */ }),
    headers: { get: vi.fn((h) => { /* headers */ }) },
  },
  env: {
    CONTACT_SUBMISSIONS: { get: vi.fn(), put: vi.fn() },
    TURNSTILE_SECRET_KEY: 'mock-secret-key',
  },
});
```

**DOM utility tests** create real DOM elements:
```javascript
const container = document.createElement('div');
container.getBoundingClientRect = vi.fn(() => ({ width: 200, height: 100, ... }));
```

**Canvas animation tests** mock rAF and manually invoke callbacks:
```javascript
let rafCallbacks = [];
vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
  rafCallbacks.push(cb);
  return rafCallbacks.length;
});
vi.spyOn(performance, 'now').mockReturnValue(0);

// Invoke frame at specific time
performance.now.mockReturnValue(500);
rafCallbacks[0](500);
```

## CI/CD Integration

```bash
npm run test:run  # Exit code 0 = all tests passed
```
