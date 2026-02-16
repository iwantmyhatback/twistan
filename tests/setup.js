/**
 * Test setup file - runs before all tests.
 * Configures testing environment and global mocks.
 *
 * Console output is suppressed by default for clean test output.
 * Set DEBUG_TESTS=1 to show all console.log/warn/error from application code:
 *   DEBUG_TESTS=1 npm run test:run
 */

import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Suppress console and stderr noise unless DEBUG_TESTS is set
if (!process.env.DEBUG_TESTS) {
	vi.spyOn(console, 'log').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});

	// Intercept stderr to suppress jsdom "Not implemented" messages
	const originalStderrWrite = process.stderr.write.bind(process.stderr);
	process.stderr.write = (chunk, ...args) => {
		const str = typeof chunk === 'string' ? chunk : chunk.toString();
		if (str.includes('Not implemented')) return true;
		return originalStderrWrite(chunk, ...args);
	};
}

// Cleanup after each test
afterEach(() => {
	cleanup();
});

// Mock window.matchMedia (used by Framer Motion and media queries)
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: (query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => {},
	}),
});

// Mock IntersectionObserver (used by lazy loading)
global.IntersectionObserver = class IntersectionObserver {
	constructor() {}
	disconnect() {}
	observe() {}
	takeRecords() {
		return [];
	}
	unobserve() {}
};

// Mock Turnstile widget
global.window.turnstile = {
	render: () => 'mock-widget-id',
	reset: () => {},
	remove: () => {},
};
