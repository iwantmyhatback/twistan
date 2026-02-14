/**
 * Contact API endpoint tests.
 * Tests rate limiting, CAPTCHA verification, validation, and KV storage.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Cloudflare environment
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
		context.env.CONTACT_SUBMISSIONS.get.mockResolvedValue('0');

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
		context.env.CONTACT_SUBMISSIONS.get.mockResolvedValue('0');

		// Mock Turnstile API returning failure
		global.fetch.mockResolvedValue({
			json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
		});

		const response = await onRequestPost(context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toContain('CAPTCHA verification failed');
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
		context.env.CONTACT_SUBMISSIONS.get.mockResolvedValue('0');
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
		context.env.CONTACT_SUBMISSIONS.get.mockResolvedValue('0');
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
		context.env.CONTACT_SUBMISSIONS.get.mockResolvedValue('0');
		context.request.json.mockResolvedValue({
			name: 123, // Should be string
			email: 'test@example.com',
			message: 'Test',
			'cf-turnstile-response': 'token',
		});

		const response = await onRequestPost(context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toContain('Invalid field types');
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

		const response = await onRequestOptions();

		expect(response.status).toBe(204);
		const headers = Object.fromEntries(response.headers.entries());
		expect(headers['access-control-allow-origin']).toBe('*');
		expect(headers['access-control-allow-methods']).toContain('POST');
	});

	it('includes CORS headers in all responses', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createMockContext();
		context.env.CONTACT_SUBMISSIONS.get.mockResolvedValue('0');
		global.fetch.mockResolvedValue({
			json: async () => ({ success: true }),
		});

		const response = await onRequestPost(context);
		const headers = Object.fromEntries(response.headers.entries());

		expect(headers['access-control-allow-origin']).toBe('*');
		expect(headers['content-type']).toBe('application/json');
	});
});
