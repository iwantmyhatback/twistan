/**
 * Contact API endpoint tests.
 * Tests rate limiting, CAPTCHA verification, validation, CORS, and KV storage.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Create a mock Cloudflare Pages Function context.
 * Defaults: valid form body, CAPTCHA token, Turnstile secret, KV binding.
 * Override any part via the overrides parameter.
 */
const createMockContext = (overrides = {}) => ({
	request: {
		json: vi.fn().mockResolvedValue({
			name: 'Test User',
			email: 'test@example.com',
			message: 'Test message',
			'cf-turnstile-response': 'mock-token',
		}),
		headers: {
			get: vi.fn((header) => {
				if (header === 'CF-Connecting-IP') return '127.0.0.1';
				if (header === 'Origin') return 'https://twistan.com';
				return null;
			}),
		},
		...overrides.request,
	},
	env: {
		CONTACT_SUBMISSIONS: {
			get: vi.fn().mockResolvedValue(null),
			put: vi.fn().mockResolvedValue(undefined),
		},
		TURNSTILE_SECRET_KEY: 'mock-secret-key',
		...overrides.env,
	},
});

// Mock global fetch for Turnstile verification
global.fetch = vi.fn();

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
	...global.crypto,
	randomUUID: () => 'mock-uuid-1234',
});

describe('Contact API - Rate Limiting', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch.mockResolvedValue({
			json: async () => ({ success: true }),
		});
	});

	it('allows requests within rate limit', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createMockContext();

		// Mock KV to show 2 previous requests (under limit of 5)
		context.env.CONTACT_SUBMISSIONS.get.mockResolvedValue('2');

		const response = await onRequestPost(context);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
	});

	it('blocks requests exceeding rate limit', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createMockContext();

		// Mock KV to show 5 previous requests (at limit)
		context.env.CONTACT_SUBMISSIONS.get.mockResolvedValue('5');

		const response = await onRequestPost(context);
		const data = await response.json();

		expect(response.status).toBe(429);
		expect(data.success).toBe(false);
		expect(data.error).toContain('Rate limit');
	});

	it('includes rate limit headers in response', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createMockContext();
		context.env.CONTACT_SUBMISSIONS.get.mockResolvedValue('2');

		const response = await onRequestPost(context);
		const headers = Object.fromEntries(response.headers.entries());

		expect(headers['x-ratelimit-limit']).toBe('5');
		expect(headers['x-ratelimit-remaining']).toBeDefined();
	});
});

describe('Contact API - CAPTCHA Verification', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch.mockResolvedValue({
			json: async () => ({ success: true }),
		});
	});

	it('rejects requests without CAPTCHA token', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createMockContext();
		context.request.json.mockResolvedValue({
			name: 'Test User',
			email: 'test@example.com',
			message: 'Test message',
			// No CAPTCHA token
		});

		const response = await onRequestPost(context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toContain('CAPTCHA');
	});

	it('verifies CAPTCHA token with Cloudflare API', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createMockContext();
		context.env.CONTACT_SUBMISSIONS.get.mockResolvedValue('0');

		await onRequestPost(context);

		expect(global.fetch).toHaveBeenCalledWith(
			'https://challenges.cloudflare.com/turnstile/v0/siteverify',
			expect.objectContaining({
				method: 'POST',
				body: expect.stringContaining('mock-token'),
			})
		);
	});

	it('rejects invalid CAPTCHA tokens', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createMockContext();

		// Mock Turnstile API returning failure
		global.fetch.mockResolvedValue({
			json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
		});

		const response = await onRequestPost(context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toContain('CAPTCHA verification failed');
	});

	it('fails closed when TURNSTILE_SECRET_KEY is missing', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createMockContext({
			env: { TURNSTILE_SECRET_KEY: undefined },
		});

		const response = await onRequestPost(context);
		const data = await response.json();

		expect(response.status).toBe(503);
		expect(data.error).toContain('Server configuration error');
	});

	it('skips CAPTCHA when SKIP_CAPTCHA is explicitly true', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createMockContext({
			env: { TURNSTILE_SECRET_KEY: undefined, SKIP_CAPTCHA: 'true' },
		});
		context.env.CONTACT_SUBMISSIONS.get.mockResolvedValue('0');

		const response = await onRequestPost(context);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		// Turnstile API should NOT have been called
		expect(global.fetch).not.toHaveBeenCalled();
	});
});

describe('Contact API - Input Validation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch.mockResolvedValue({
			json: async () => ({ success: true }),
		});
	});

	it('validates required fields', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createMockContext();
		context.request.json.mockResolvedValue({
			name: '',
			email: 'test@example.com',
			message: 'Test',
			'cf-turnstile-response': 'token',
		});

		const response = await onRequestPost(context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toContain('required');
	});

	it('validates email format', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createMockContext();
		context.request.json.mockResolvedValue({
			name: 'Test',
			email: 'invalid-email',
			message: 'Test',
			'cf-turnstile-response': 'token',
		});

		const response = await onRequestPost(context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toContain('email');
	});

	it('validates field types', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createMockContext();
		context.request.json.mockResolvedValue({
			name: 123, // Should be string
			email: 'test@example.com',
			message: 'Test',
			'cf-turnstile-response': 'token',
		});

		const response = await onRequestPost(context);

		expect(response.status).toBe(400);
	});

	it('rejects fields exceeding max length', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createMockContext();
		context.request.json.mockResolvedValue({
			name: 'A'.repeat(101), // MAX_LENGTHS.name = 100
			email: 'test@example.com',
			message: 'Test',
			'cf-turnstile-response': 'token',
		});

		const response = await onRequestPost(context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toContain('exceeds');
	});

	it('rejects messages exceeding max length', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createMockContext();
		context.request.json.mockResolvedValue({
			name: 'Test',
			email: 'test@example.com',
			message: 'A'.repeat(5001), // MAX_LENGTHS.message = 5000
			'cf-turnstile-response': 'token',
		});

		const response = await onRequestPost(context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toContain('exceeds');
	});
});

describe('Contact API - KV Storage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch.mockResolvedValue({
			json: async () => ({ success: true }),
		});
	});

	it('stores valid submissions in KV', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createMockContext();
		context.env.CONTACT_SUBMISSIONS.get.mockResolvedValue('0');

		await onRequestPost(context);

		expect(context.env.CONTACT_SUBMISSIONS.put).toHaveBeenCalledWith(
			expect.stringMatching(/^contact_\d{4}-\d{2}-\d{2}T.+_mock-uuid-1234$/),
			expect.stringContaining('"name":"Test User"')
		);
	});

	it('trims whitespace from fields before storage', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createMockContext();
		context.env.CONTACT_SUBMISSIONS.get.mockResolvedValue('0');
		context.request.json.mockResolvedValue({
			name: '  Test User  ',
			email: '  test@example.com  ',
			message: '  Test message  ',
			'cf-turnstile-response': 'token',
		});

		const response = await onRequestPost(context);
		const data = await response.json();

		// Should succeed (whitespace is trimmed before validation)
		expect(response.status).toBe(200);
		expect(data.success).toBe(true);

		// Verify KV put was called (submission was stored)
		expect(context.env.CONTACT_SUBMISSIONS.put).toHaveBeenCalled();
	});

	it('includes timestamp in stored data', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createMockContext();
		context.env.CONTACT_SUBMISSIONS.get.mockResolvedValue('0');

		await onRequestPost(context);

		// Find the submission storage call (starts with "contact_", not "ratelimit_")
		const putCalls = context.env.CONTACT_SUBMISSIONS.put.mock.calls;
		const submissionCall = putCalls.find(call => call[0].startsWith('contact_'));

		expect(submissionCall).toBeDefined();
		const [, value] = submissionCall;
		const storedData = JSON.parse(value);

		expect(storedData.submittedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
	});
});

describe('Contact API - CORS', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('handles OPTIONS preflight requests', async () => {
		const { onRequestOptions } = await import('../../functions/api/contact.js');

		const context = {
			request: {
				headers: {
					get: vi.fn((h) => h === 'Origin' ? 'https://twistan.com' : null),
				},
			},
		};

		const response = await onRequestOptions(context);

		expect(response.status).toBe(204);
		const headers = Object.fromEntries(response.headers.entries());
		expect(headers['access-control-allow-origin']).toBe('https://twistan.com');
		expect(headers['access-control-allow-methods']).toContain('POST');
		expect(headers['vary']).toBe('Origin');
	});

	it('reflects allowed origins in CORS headers', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createMockContext();
		context.env.CONTACT_SUBMISSIONS.get.mockResolvedValue('0');
		global.fetch.mockResolvedValue({
			json: async () => ({ success: true }),
		});

		const response = await onRequestPost(context);
		const headers = Object.fromEntries(response.headers.entries());

		expect(headers['access-control-allow-origin']).toBe('https://twistan.com');
		expect(headers['content-type']).toBe('application/json');
		expect(headers['vary']).toBe('Origin');
	});

	it('defaults to production origin for unknown origins', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createMockContext();
		// Override Origin header to an unknown domain
		context.request.headers.get = vi.fn((h) => {
			if (h === 'CF-Connecting-IP') return '127.0.0.1';
			if (h === 'Origin') return 'https://evil.com';
			return null;
		});
		context.env.CONTACT_SUBMISSIONS.get.mockResolvedValue('0');
		global.fetch.mockResolvedValue({
			json: async () => ({ success: true }),
		});

		const response = await onRequestPost(context);
		const headers = Object.fromEntries(response.headers.entries());

		expect(headers['access-control-allow-origin']).toBe('https://twistan.com');
	});

	it('allows localhost origins', async () => {
		const { onRequestOptions } = await import('../../functions/api/contact.js');

		const context = {
			request: {
				headers: {
					get: vi.fn((h) => h === 'Origin' ? 'http://localhost:5173' : null),
				},
			},
		};

		const response = await onRequestOptions(context);
		const headers = Object.fromEntries(response.headers.entries());

		expect(headers['access-control-allow-origin']).toBe('http://localhost:5173');
	});

	it('allows *.pages.dev origins', async () => {
		const { onRequestOptions } = await import('../../functions/api/contact.js');

		const context = {
			request: {
				headers: {
					get: vi.fn((h) => h === 'Origin' ? 'https://abc123.pages.dev' : null),
				},
			},
		};

		const response = await onRequestOptions(context);
		const headers = Object.fromEntries(response.headers.entries());

		expect(headers['access-control-allow-origin']).toBe('https://abc123.pages.dev');
	});
});
