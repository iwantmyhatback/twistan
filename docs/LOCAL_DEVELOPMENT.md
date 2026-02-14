# Local Development Guide

Complete guide for setting up and running the Twistan portfolio site locally.

**Related Documentation:**
- **[README.md](../README.md)** - Quick start and project overview
- **[Cloudflare Setup Guide](CLOUDFLARE_SETUP.md)** - For production deployment

## Initial Setup

### Prerequisites

- **Node.js:** 18.x or higher
- **npm:** Comes with Node.js
- **Git:** For version control
- **Code editor:** VS Code, Sublime, etc.

**Verify installation:**
```bash
node --version  # Should be v18.x or higher
npm --version   # Should be 8.x or higher
```

### Clone and Install

```bash
# Clone repository (if not already)
git clone <repository-url> twistan
cd twistan

# Install dependencies
npm install
```

This installs:
- React 18 + React Router
- Vite (build tool)
- Tailwind CSS
- Framer Motion (animations)
- Wrangler (Cloudflare CLI)
- ESLint and plugins

## Development Modes

### Mode 1: Vite Dev Server (Quick Development)

**When to use:**
- Rapid UI development
- Testing component changes
- Styling with Tailwind
- No need to test contact form submissions

**Start server:**
```bash
npm run dev
```

**Expected output:**
```
VITE v5.4.8  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**Features:**
- Runs on `http://localhost:5173`
- Hot Module Replacement (HMR) - instant updates
- Fast refresh for React components
- Contact form logs to browser console instead of KV

**Behavior:**
- Contact form submissions return success but don't store in KV
- Check browser console for submission data:
  ```
  [DEV] Contact submission (no KV): {
    key: "contact_2026-02-14T...",
    value: "{\"name\":\"...\",\"email\":\"...\",\"message\":\"...\"}"
  }
  ```

**Stop server:** `Ctrl+C`

### Mode 2: Wrangler Preview (Production-like Testing)

**When to use:**
- Testing Cloudflare Pages Functions
- Testing contact form with real KV storage
- Debugging API endpoints
- Pre-deployment verification

**Prerequisites:**
- KV namespace created (see setup below)
- `wrangler.toml` configured with namespace ID

**Start preview:**
```bash
npm run preview
```

**Process:**
1. Runs `npm run build` (creates production build)
2. Runs `wrangler pages dev ./dist --kv CONTACT_SUBMISSIONS`
3. Starts local server with Functions support

**Expected output:**
```
✨ Compiled Worker successfully
⎔ Starting local server...
▲ [wrangler:inf] Ready on http://localhost:8788
╭──────────────────────────────────────────────────╮
│ [b] open a browser, [d] open Devtools, [l] turn  │
│ off local mode, [c] clear console, [x] to exit   │
╰──────────────────────────────────────────────────╯
```

**Features:**
- Runs on `http://localhost:8788`
- Contact form stores submissions in KV
- `/api/contact` and `/api/health` endpoints work
- Simulates production environment

**Verify KV storage:**
```bash
# In another terminal
npx wrangler kv key list --namespace-id=99b1efa188d544c78cff0a633c22d6df --prefix="contact_"
```

**Stop server:** `Ctrl+C`

## KV Namespace Setup for Local Development

Contact form requires a Cloudflare KV namespace for storage.

### Create KV Namespace

```bash
npx wrangler kv namespace create "CONTACT_SUBMISSIONS"
```

This creates a namespace for local development. **For production KV setup, see [Cloudflare Setup Guide](CLOUDFLARE_SETUP.md#part-2-kv-namespace-setup).**

**Output:**
```
🌀 Creating namespace with title "twistan-CONTACT_SUBMISSIONS"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "CONTACT_SUBMISSIONS", id = "99b1efa188d544c78cff0a633c22d6df" }
```

### Update wrangler.toml

Add the namespace ID to `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "CONTACT_SUBMISSIONS"
id = "YOUR_NAMESPACE_ID_HERE"  # Use the ID from the command above
```

## Project Structure Overview

```
twistan/
├── src/
│   ├── pages/              # Page components (routes)
│   │   ├── Home.jsx        # Landing page
│   │   ├── About.jsx       # About page
│   │   ├── Projects.jsx    # Projects showcase
│   │   ├── Contact.jsx     # Contact form
│   │   ├── AboutYou.jsx    # "About You" page (uses FingerprintJS)
│   │   └── NotFound.jsx    # 404 page
│   ├── components/         # Reusable components
│   │   ├── Layout.jsx      # Page wrapper with navbar/footer
│   │   ├── Navbar.jsx      # Top navigation
│   │   ├── Footer.jsx      # Site footer
│   │   ├── CursorGlow.jsx  # Custom cursor effect
│   │   ├── AnimatedSection.jsx  # Framer Motion wrapper
│   │   └── BrowserInfo.jsx # Browser detection utility
│   ├── assets/             # Static files
│   │   ├── avatar.png      # Profile image
│   │   └── ImageUrls.js    # External image references
│   ├── App.jsx             # Router setup
│   ├── main.jsx            # React entry point
│   └── index.css           # Tailwind + custom styles
├── functions/              # Cloudflare Pages Functions
│   └── api/
│       ├── contact.js      # POST /api/contact
│       └── health.js       # GET /api/health
├── public/                 # Static assets (copied to dist/)
├── dist/                   # Build output (generated)
└── [config files]
```

## Common Development Tasks

### Adding a New Page

1. **Create page component:**
   ```bash
   touch src/pages/NewPage.jsx
   ```

2. **Component template:**
   ```jsx
   import AnimatedSection from '../components/AnimatedSection';

   function NewPage() {
       return (
           <div className="section-container py-24">
               <AnimatedSection>
                   <h1 className="heading-xl mb-3">New Page</h1>
               </AnimatedSection>
               <AnimatedSection delay={0.1}>
                   <p className="text-body">
                       Page content here...
                   </p>
               </AnimatedSection>
           </div>
       );
   }

   export default NewPage;
   ```

3. **Add route in App.jsx:**
   ```jsx
   // At top
   const NewPage = lazy(() => import('./pages/NewPage'));

   // In Routes component
   <Route path="/new-page" element={<NewPage />} />
   ```

4. **Add to navbar (if needed):**
   Edit `src/components/Navbar.jsx` and add link to navigation array.

### Adding a New API Endpoint

1. **Create function file:**
   ```bash
   touch functions/api/myendpoint.js
   ```

2. **Function template:**
   ```javascript
   /**
    * My new endpoint - Cloudflare Pages Function.
    */
   export async function onRequestGet(context) {
       return new Response(
           JSON.stringify({ message: 'Hello from my endpoint' }),
           {
               status: 200,
               headers: { 'Content-Type': 'application/json' }
           }
       );
   }
   ```

3. **Test locally:**
   ```bash
   npm run preview
   curl http://localhost:8788/api/myendpoint
   ```

4. **Deploy:**
   ```bash
   npm run deploy
   ```

   Endpoint will be available at `https://twistan.com/api/myendpoint`

### Modifying Styles

**Tailwind utility classes:**
- Edit component JSX directly with Tailwind classes
- See `tailwind.config.js` for custom theme values

**Custom CSS:**
- Global styles: `src/index.css`
- Component-scoped: Define in same file or use CSS modules

**Custom Tailwind utilities:**

Edit `src/index.css`:
```css
@layer components {
  .my-custom-class {
    @apply bg-surface-100 border border-accent p-4 rounded-lg;
  }
}
```

### Testing Contact Form Locally

**With Vite dev server (logs only):**
```bash
npm run dev
# Visit http://localhost:5173/contact
# Submit form
# Check browser console for logged data
```

**With Wrangler preview (real KV):**
```bash
npm run preview
# Visit http://localhost:8788/contact
# Submit form
# Verify storage:
npx wrangler kv key list --namespace-id=99b1efa188d544c78cff0a633c22d6df --prefix="contact_"
```

## Linting and Code Quality

### Run ESLint

```bash
npm run lint
```

**Expected output (if no errors):**
```
✔ No ESLint warnings or errors
```

**Common errors and fixes:**

**Unused variable:**
```
error  'useState' is defined but never used  no-unused-vars
```
Fix: Remove unused import or use the variable

**Missing prop validation:**
```
error  'children' is missing in props validation  react/prop-types
```
Fix: Add PropTypes:
```jsx
import PropTypes from 'prop-types';

MyComponent.propTypes = {
  children: PropTypes.node.isRequired,
};
```

### ESLint Configuration

Located in `.eslintrc.cjs`:
- Extends React recommended rules
- React Hooks rules enabled
- React Refresh plugin for HMR

**Disable specific rule:**
```jsx
// eslint-disable-next-line react/prop-types
```

## Building for Production

### Create Production Build

```bash
npm run build
```

Outputs optimized build to `dist/` directory.

**To deploy to production, see [Cloudflare Setup Guide](CLOUDFLARE_SETUP.md).**

### Preview Production Build Locally

```bash
npm run preview
```

Serves the `dist/` folder with Wrangler Pages dev server (simulates production environment).

### Build Optimization

**Code splitting:**
- Pages are lazy-loaded (see `App.jsx`)
- Each page is a separate chunk
- Improves initial load time

**Asset optimization:**
- Images should be optimized before adding
- Use WebP format when possible
- Consider using Cloudflare Images for external hosting

**Bundle analysis:**

To analyze bundle size:
```bash
npx vite-bundle-visualizer
```

## Debugging

### React DevTools

Install browser extension:
- Chrome: [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- Firefox: [React DevTools](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

**Usage:**
1. Open browser DevTools (F12)
2. Switch to "Components" tab
3. Inspect React component tree

### Browser Console

**View contact form debug logs:**
```javascript
// Browser console will show:
[DEV] Contact submission (no KV): { key: "...", value: "..." }
```

**Check for errors:**
- Open DevTools → Console tab
- Look for red errors
- Click error to see stack trace

### Wrangler Logs

When using `npm run preview`:

**Enable verbose logging:**
```bash
WRANGLER_LOG=debug npm run preview
```

**View function execution:**
- Console.log in `functions/api/*.js` appears in terminal
- Errors show stack traces

### Network Debugging

**View API requests:**
1. Open DevTools → Network tab
2. Submit contact form
3. Find `/api/contact` request
4. Check:
   - Status code (should be 200)
   - Request payload
   - Response body

**Common status codes:**
- `200` - Success
- `400` - Validation error (check request body)
- `500` - Server error (check KV binding)

## Environment-Specific Behavior

### Development (npm run dev)
- Vite dev server
- Port: 5173
- HMR enabled
- Contact form logs to console
- No KV storage

### Preview (npm run preview)
- Wrangler dev server
- Port: 8788
- Production build served
- Contact form writes to KV
- Functions fully operational

### Production (deployed)
- Cloudflare Pages CDN
- Custom domain: twistan.com
- Global edge network
- KV storage persisted
- SSL/TLS enabled

## Troubleshooting

### Port Already in Use

**Error:**
```
Port 5173 is in use, trying another one...
```

**Fix:**
- Vite will auto-increment to 5174
- Or kill process using port:
  ```bash
  lsof -ti:5173 | xargs kill -9
  ```

### Module Not Found

**Error:**
```
Cannot find module './NonExistent.jsx'
```

**Fix:**
- Check file path is correct
- Verify file extension (.jsx not .js)
- Ensure import path starts with './' or '../'

### Tailwind Classes Not Working

**Symptoms:**
- Classes have no effect
- Styles not applied

**Fix:**
1. Verify file is in Tailwind content paths (see `tailwind.config.js`)
2. Check class name spelling
3. Restart dev server (`Ctrl+C` then `npm run dev`)

### HMR Not Working

**Symptoms:**
- Changes don't reflect in browser
- Need to manually refresh

**Fix:**
1. Check console for HMR errors
2. Verify file is saved
3. Restart dev server
4. Clear browser cache

### Wrangler Auth Issues

**Error:**
```
Error: Not authenticated
```

**Fix:**
```bash
npx wrangler login
```

Opens browser to authenticate with Cloudflare account.

## Tips and Best Practices

### Performance

- Use lazy loading for routes (already implemented in `App.jsx`)
- Optimize images before adding to `src/assets/`
- Minimize use of heavy animations
- Keep component tree shallow

### Accessibility

- Use semantic HTML (`<nav>`, `<main>`, `<footer>`)
- Include alt text for images
- Ensure sufficient color contrast
- Test with keyboard navigation

### Code Organization

- Keep components focused (single responsibility)
- Extract reusable logic into hooks
- Use PropTypes for component props
- Document complex logic with comments

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "Add my feature"

# Push and create PR
git push origin feature/my-feature
```

## Quick Reference

### Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server
npm run preview      # Start Wrangler preview
npm run build        # Build for production
npm run lint         # Run ESLint
npm run deploy       # Build and deploy
```

### Useful Wrangler Commands

```bash
npx wrangler login                          # Authenticate
npx wrangler whoami                         # Check auth status
npx wrangler kv namespace list              # List KV namespaces
npx wrangler pages project list             # List Pages projects
npx wrangler pages deployment list --project-name=app  # List deployments
```

### File Paths

- **Pages:** `src/pages/*.jsx`
- **Components:** `src/components/*.jsx`
- **Styles:** `src/index.css`
- **API:** `functions/api/*.js`
- **Config:** `vite.config.js`, `tailwind.config.js`, `wrangler.toml`

### Ports

- **Vite dev:** `http://localhost:5173`
- **Wrangler preview:** `http://localhost:8788`

### Key Files to Edit

- **Add page:** `src/pages/YourPage.jsx` + `src/App.jsx`
- **Modify layout:** `src/components/Layout.jsx`
- **Edit navigation:** `src/components/Navbar.jsx`
- **Change theme:** `tailwind.config.js`
- **Add API endpoint:** `functions/api/yourfile.js`
