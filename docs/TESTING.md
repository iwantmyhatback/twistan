# Testing Documentation

Comprehensive test suite for the Twistan portfolio application using Vitest and React Testing Library.

## Test Coverage

**Total: 30 tests across 4 test files**

### Test Files

1. **tests/Contact.test.jsx** (7 tests)
   - Form rendering with all fields
   - Required field validation
   - Email format validation
   - CAPTCHA requirement enforcement
   - Successful form submission
   - API error handling
   - Form clearing after submission

2. **tests/api/contact.test.js** (14 tests)
   - **Rate Limiting**: Request allowance, blocking, headers
   - **CAPTCHA Verification**: Token requirement, Cloudflare API verification, invalid token handling
   - **Input Validation**: Required fields, email format, field types
   - **KV Storage**: Submission storage, whitespace trimming, timestamp inclusion
   - **CORS**: Preflight handling, header inclusion

3. **tests/App.test.jsx** (4 tests)
   - Home page routing
   - Contact page routing
   - About page routing
   - 404 handling for unknown routes

4. **tests/utils/validation.test.js** (5 tests)
   - Email validation (valid and invalid formats)
   - Rate limiting timestamp bucketing
   - Rate limiting key uniqueness
   - KV key generation format

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
- **Setup File**: `tests/setup.js` (global mocks and cleanup)

### Global Mocks

Located in `tests/setup.js`:
- `window.matchMedia` - Media query matching
- `window.IntersectionObserver` - Intersection observation
- `window.turnstile` - Cloudflare Turnstile CAPTCHA widget

## Key Testing Patterns

### Component Testing
```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

render(
  <BrowserRouter>
    <Contact />
  </BrowserRouter>
);
```

### API Testing
```javascript
const createMockContext = (overrides = {}) => ({
  request: {
    json: vi.fn().mockResolvedValue({ /* data */ }),
    headers: { get: vi.fn((header) => { /* ... */ }) }
  },
  env: {
    CONTACT_SUBMISSIONS: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined)
    },
    TURNSTILE_SECRET_KEY: 'mock-secret-key'
  }
});
```

### Router Testing
```javascript
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

const router = createMemoryRouter([
  { path: '/contact', element: <Contact /> }
], {
  initialEntries: ['/contact']
});

render(<RouterProvider router={router} />);
```

## Bug Fixes During Testing

### Issue: Whitespace Trimming
**Problem**: Contact form validation rejected emails with leading/trailing whitespace, even though they were trimmed before storage.

**Root Cause**: Validation occurred before trimming in `functions/api/contact.js`

**Fix**: Moved trimming to happen immediately after extracting fields from request body, before any validation:

```javascript
// Before
const { name, email, message } = body;
// ... validation ...
// ... later in storage section:
name: name.trim()

// After
const name = typeof body.name === 'string' ? body.name.trim() : body.name;
const email = typeof body.email === 'string' ? body.email.trim() : body.email;
const message = typeof body.message === 'string' ? body.message.trim() : body.message;
// ... validation now works with trimmed values ...
```

**Impact**: Improved user experience - form accepts fields with accidental whitespace

## Test Results

All 30 tests passing:
- ✓ tests/utils/validation.test.js (5 tests)
- ✓ tests/api/contact.test.js (14 tests)
- ✓ tests/App.test.jsx (4 tests)
- ✓ tests/Contact.test.jsx (7 tests)

Build verification: ✓ Successful

## CI/CD Integration

Tests can be integrated into CI/CD pipeline:

```bash
npm run test:run
```

Exit code 0 indicates all tests passed.

## Future Test Coverage

Potential areas for expansion:
- AboutYou.jsx fingerprinting functionality
- Layout.jsx page transitions
- AnimatedSection.jsx animation behavior
- Projects.jsx component rendering
- Error boundary testing
- Network failure scenarios
