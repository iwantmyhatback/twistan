# Testing Documentation

Comprehensive test suite for the Twistan portfolio application using Vitest and React Testing Library.

## Test Coverage

**Total: 89 tests across 15 test files**

| Metric | Coverage |
|--------|----------|
| Statements | 83.07% |
| Branches | 79.36% |
| Functions | 89.36% |
| Lines | 84.87% |

### Test Files

#### API Tests

1. **tests/api/contact.test.js** (21 tests)
   - **Rate Limiting** (3): Request allowance, blocking, headers
   - **CAPTCHA Verification** (5): Token requirement, Cloudflare API verification, invalid token handling, fail-closed behavior, SKIP_CAPTCHA flag
   - **Input Validation** (5): Required fields, email format, field types, name/message length limits
   - **KV Storage** (3): Submission storage, whitespace trimming, timestamp inclusion
   - **CORS** (5): Preflight handling, origin reflection, production fallback, localhost support, *.pages.dev support

2. **tests/api/health.test.js** (3 tests)
   - Status code and response body
   - JSON content type header
   - ISO timestamp validation

#### Component Tests

3. **tests/Navbar.test.jsx** (6 tests)
   - Brand link rendering
   - Desktop nav link rendering
   - Avatar image rendering
   - Hamburger aria-expanded state
   - Mobile menu toggle
   - Mobile menu close on nav link click

4. **tests/Footer.test.jsx** (3 tests)
   - Dynamic copyright year
   - Brand name rendering
   - GitHub link with security attributes

5. **tests/Layout.test.jsx** (5 tests)
   - Children content rendering
   - Navbar and footer composition
   - Skip-to-content accessibility link
   - Main content target ID

6. **tests/AnimatedSection.test.jsx** (4 tests)
   - Children rendering
   - Custom className forwarding
   - Default props handling
   - Multiple children rendering

7. **tests/CursorGlow.test.jsx** (5 tests)
   - Canvas element rendering
   - Pointer-events-none class
   - Responsive visibility classes
   - Animation loop skipped on mobile
   - Animation loop started on desktop

#### Page Tests

8. **tests/Contact.test.jsx** (7 tests)
   - Form field rendering
   - Required field validation
   - Email format validation
   - CAPTCHA requirement
   - Successful form submission
   - API error handling
   - Form clearing after submission

9. **tests/Home.test.jsx** (7 tests)
   - Wave button rendering
   - Image display with external src
   - spawnRipple called on button click
   - Button element type
   - Image accessibility (alt text)
   - Image load handler
   - Image error handler

10. **tests/About.test.jsx** (4 tests)
    - Heading rendering
    - Intro text rendering
    - All 12 skill tiles rendering
    - Easter egg link to about-you page

11. **tests/Projects.test.jsx** (6 tests)
    - Heading rendering
    - All project title rendering
    - Project description rendering
    - GitHub links with security attributes
    - Project tag rendering
    - Correct project count

12. **tests/NotFound.test.jsx** (4 tests)
    - 404 heading rendering
    - Descriptive message
    - Home link
    - Glitch-text CSS class

13. **tests/App.test.jsx** (4 tests)
    - Home page routing
    - Contact page routing
    - About page routing
    - 404 handling for unknown routes

#### Utility Tests

14. **tests/utils/ripple.test.js** (5 tests)
    - Ripple span creation
    - Size calculation from container dimensions
    - Position calculation from click coordinates
    - Cleanup after animationend event
    - Append to currentTarget

15. **tests/utils/validation.test.js** (5 tests)
    - Email validation (valid/invalid formats)
    - Rate limiting timestamp bucketing (UTC)
    - Rate limiting key uniqueness
    - KV key generation format

### Per-File Coverage

| File | Stmts | Branch | Funcs | Lines |
|------|-------|--------|-------|-------|
| contact.js | 89% | 84% | 100% | 91% |
| health.js | 100% | 100% | 100% | 100% |
| AnimatedSection.jsx | 100% | 100% | 100% | 100% |
| CursorGlow.jsx | 55% | 38% | 67% | 58% |
| Footer.jsx | 100% | 100% | 100% | 100% |
| Layout.jsx | 100% | 100% | 100% | 100% |
| Navbar.jsx | 100% | 100% | 100% | 100% |
| About.jsx | 100% | 100% | 100% | 100% |
| Contact.jsx | 86% | 80% | 70% | 89% |
| Home.jsx | 83% | 33% | 100% | 81% |
| NotFound.jsx | 100% | 100% | 100% | 100% |
| Projects.jsx | 100% | 100% | 100% | 100% |
| ripple.js | 100% | 100% | 100% | 100% |

### Known Coverage Gaps

- **CursorGlow.jsx** (55% stmts): Canvas `getContext()` not implemented in jsdom. The noise rendering loop and media query change handler can't be tested without a canvas polyfill.
- **Home.jsx** (83% stmts): Deck reshuffle boundary (lines 39-45) only triggers after exhausting all ~49 images. AnimatePresence `mode="wait"` prevents DOM assertions during animation transitions.
- **Contact.jsx** (86% stmts): Turnstile polling interval (lines 58-65) and initialization retry logic hard to test without real Turnstile SDK.
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
```

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

## CI/CD Integration

```bash
npm run test:run  # Exit code 0 = all tests passed
```
