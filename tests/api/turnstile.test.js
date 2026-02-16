/**
 * Turnstile CAPTCHA verification tests.
 * Tests the dummy/test key matrix provided by Cloudflare for development:
 *   - Always-pass site key + always-pass secret key
 *   - Always-block site key + always-fail secret key
 *   - Token-already-spent secret key
 *   - Mismatched key pairing (dummy token + real secret, real token + dummy secret)
 *
 * Dummy keys reference:
 *   Site keys:  1x00000000000000000000AA (pass), 2x00000000000000000000AB (block)
 *   Secret keys: 1x0000000000000000000000000000000AA (pass),
 *                2x0000000000000000000000000000000AA (fail),
 *                3x0000000000000000000000000000000AA (token-spent)
 *
 * See: https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

/** Dummy token produced by Cloudflare's test site keys */
const DUMMY_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';

/** Cloudflare's official test secret keys */
const TEST_SECRETS = {
	ALWAYS_PASS: '1x0000000000000000000000000000000AA',
	ALWAYS_FAIL: '2x0000000000000000000000000000000AA',
	TOKEN_SPENT: '3x0000000000000000000000000000000AA',
};

/**
 * Create a mock Cloudflare Pages Function context with a given secret key and token.
 * @param {object} opts
 * @param {string} opts.secretKey - Turnstile secret key
 * @param {string} opts.token - Turnstile response token from client
 */
function createTurnstileContext({ secretKey, token = DUMMY_TOKEN } = {}) {
	return {
		request: {
			json: vi.fn().mockResolvedValue({
				name: 'Test User',
				email: 'test@example.com',
				message: 'Test message',
				'cf-turnstile-response': token,
			}),
			headers: {
				get: vi.fn((header) => {
					if (header === 'CF-Connecting-IP') return '127.0.0.1';
					if (header === 'Origin') return 'http://localhost:5173';
					return null;
				}),
			},
		},
		env: {
			CONTACT_SUBMISSIONS: {
				get: vi.fn().mockResolvedValue('0'),
				put: vi.fn().mockResolvedValue(undefined),
			},
			TURNSTILE_SECRET_KEY: secretKey,
		},
	};
}

// Mock global fetch for Turnstile siteverify calls
global.fetch = vi.fn();

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
	...global.crypto,
	randomUUID: () => 'mock-uuid-1234',
});

describe('Turnstile - Always-Pass Secret Key', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Simulate Cloudflare siteverify returning success
		global.fetch.mockResolvedValue({
			json: async () => ({ success: true }),
		});
	});

	it('accepts dummy token with always-pass secret key', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createTurnstileContext({
			secretKey: TEST_SECRETS.ALWAYS_PASS,
			token: DUMMY_TOKEN,
		});

		const response = await onRequestPost(context);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
	});

	it('sends correct payload to siteverify endpoint', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createTurnstileContext({
			secretKey: TEST_SECRETS.ALWAYS_PASS,
			token: DUMMY_TOKEN,
		});

		await onRequestPost(context);

		expect(global.fetch).toHaveBeenCalledWith(
			'https://challenges.cloudflare.com/turnstile/v0/siteverify',
			expect.objectContaining({
				method: 'POST',
				body: expect.stringContaining(TEST_SECRETS.ALWAYS_PASS),
			})
		);

		// Verify token is also included in the request body
		const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
		expect(callBody.response).toBe(DUMMY_TOKEN);
		expect(callBody.secret).toBe(TEST_SECRETS.ALWAYS_PASS);
	});
});

describe('Turnstile - Always-Fail Secret Key', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Simulate Cloudflare siteverify returning failure
		global.fetch.mockResolvedValue({
			json: async () => ({
				success: false,
				'error-codes': ['invalid-input-response'],
			}),
		});
	});

	it('rejects dummy token with always-fail secret key', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createTurnstileContext({
			secretKey: TEST_SECRETS.ALWAYS_FAIL,
			token: DUMMY_TOKEN,
		});

		const response = await onRequestPost(context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.success).toBe(false);
		expect(data.error).toContain('CAPTCHA verification failed');
	});
});

describe('Turnstile - Token-Already-Spent Secret Key', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Simulate Cloudflare siteverify returning token-already-spent
		global.fetch.mockResolvedValue({
			json: async () => ({
				success: false,
				'error-codes': ['timeout-or-duplicate'],
			}),
		});
	});

	it('rejects already-spent tokens', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createTurnstileContext({
			secretKey: TEST_SECRETS.TOKEN_SPENT,
			token: DUMMY_TOKEN,
		});

		const response = await onRequestPost(context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.success).toBe(false);
		expect(data.error).toContain('CAPTCHA verification failed');
	});
});

describe('Turnstile - Key Pairing Mismatches', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('rejects dummy token when using a real/production secret key', async () => {
		// Real secret keys reject the dummy token XXXX.DUMMY.TOKEN.XXXX
		global.fetch.mockResolvedValue({
			json: async () => ({
				success: false,
				'error-codes': ['invalid-input-response'],
			}),
		});

		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createTurnstileContext({
			secretKey: 'real-production-secret-key',
			token: DUMMY_TOKEN,
		});

		const response = await onRequestPost(context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toContain('CAPTCHA verification failed');
	});

	it('rejects real token when using a dummy secret key', async () => {
		// Dummy secret keys only accept the dummy token
		global.fetch.mockResolvedValue({
			json: async () => ({
				success: false,
				'error-codes': ['invalid-input-response'],
			}),
		});

		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createTurnstileContext({
			secretKey: TEST_SECRETS.ALWAYS_PASS,
			token: 'real-token-from-production-widget',
		});

		const response = await onRequestPost(context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toContain('CAPTCHA verification failed');
	});
});

describe('Turnstile - Missing Token', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('rejects request when no turnstile token is provided', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createTurnstileContext({ secretKey: TEST_SECRETS.ALWAYS_PASS });
		context.request.json.mockResolvedValue({
			name: 'Test User',
			email: 'test@example.com',
			message: 'Test message',
			// No cf-turnstile-response
		});

		const response = await onRequestPost(context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toContain('CAPTCHA');
		// Should NOT have called siteverify — rejected before network call
		expect(global.fetch).not.toHaveBeenCalled();
	});
});

describe('Turnstile - Siteverify Network Failure', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns 503 when siteverify endpoint is unreachable', async () => {
		global.fetch.mockRejectedValue(new Error('Network error'));

		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createTurnstileContext({ secretKey: TEST_SECRETS.ALWAYS_PASS });

		const response = await onRequestPost(context);
		const data = await response.json();

		expect(response.status).toBe(503);
		expect(data.error).toContain('Unable to verify CAPTCHA');
	});
});

describe('Turnstile - SKIP_CAPTCHA Dev Mode', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('bypasses verification when SKIP_CAPTCHA=true and no secret key', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createTurnstileContext({ secretKey: undefined });
		context.env.SKIP_CAPTCHA = 'true';
		// Remove secret key
		delete context.env.TURNSTILE_SECRET_KEY;

		const response = await onRequestPost(context);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('does not bypass when SKIP_CAPTCHA is any value other than true', async () => {
		const { onRequestPost } = await import('../../functions/api/contact.js');
		const context = createTurnstileContext({ secretKey: undefined });
		context.env.SKIP_CAPTCHA = 'yes';
		delete context.env.TURNSTILE_SECRET_KEY;

		const response = await onRequestPost(context);
		const data = await response.json();

		// Should fail-closed: no secret key and no valid skip flag
		expect(response.status).toBe(503);
		expect(data.error).toContain('Server configuration error');
	});
});
