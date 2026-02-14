/**
 * Contact form handler — Cloudflare Pages Function.
 *
 * Security layers (in execution order):
 * 1. CORS: Origin-restricted cross-origin headers
 * 2. Body parsing: Reject malformed requests without side effects
 * 3. CAPTCHA: Cloudflare Turnstile verification (fail-closed)
 * 4. Input validation: Required fields, types, lengths, email format
 * 5. Rate limiting: 5 submissions per IP per hour (KV-based)
 *    Placed last so invalid/bot requests don't consume rate limit slots.
 *
 * Storage: Submissions stored in KV with timestamped UUID keys
 *
 * Known limitation: KV rate limiting is not atomic (TOCTOU race).
 * Mitigated by placing rate limit after CAPTCHA — concurrent abuse
 * requires solving multiple CAPTCHAs simultaneously.
 */

const RATE_LIMIT = {
	MAX_REQUESTS: 5,
	WINDOW_HOURS: 1
};

const MAX_LENGTHS = {
	name: 100,
	email: 254,
	message: 5000
};

const DEFAULT_ORIGIN = 'https://twistan.com';

/**
 * Check whether an Origin header value is allowed.
 * Permits:
 *   - http://localhost (any port)
 *   - https://twistan.com
 *   - https://*.pages.dev  (Cloudflare Pages previews + production)
 *
 * @param {string|null} origin
 * @returns {boolean}
 */
function isAllowedOrigin(origin) {
	if (!origin) return false;
	try {
		const url = new URL(origin);
		if (url.hostname === 'localhost') return true;
		if (url.protocol === 'https:' && url.hostname.endsWith('twistan.com')) return true;
		if (url.protocol === 'https:' && url.hostname.endsWith('.pages.dev')) return true;
		return false;
	} catch {
		return false;
	}
}

/**
 * Build CORS headers based on the request Origin.
 * Reflects the origin if it passes the allow-list, otherwise returns
 * the default production origin. Always includes Vary: Origin so
 * CDN caches don't mix up responses for different origins.
 *
 * @param {Request} request
 * @returns {object} CORS + content-type headers
 */
function getCorsHeaders(request) {
	const origin = request.headers.get('Origin');
	return {
		'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : DEFAULT_ORIGIN,
		'Content-Type': 'application/json',
		'Vary': 'Origin',
	};
}

/**
 * CORS preflight handler for contact form endpoint.
 */
export async function onRequestOptions(context) {
	const origin = context.request.headers.get('Origin');
	const allowedOrigin = isAllowedOrigin(origin) ? origin : DEFAULT_ORIGIN;

	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': allowedOrigin,
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Access-Control-Max-Age': '86400',
			'Vary': 'Origin',
		},
	});
}

/**
 * Check rate limit for given IP address using KV-based hourly buckets.
 * Creates keys with format: ratelimit_{ip}_{hour_timestamp}
 * Keys auto-expire after 1 hour via KV TTL.
 *
 * @param {object} kv - KV namespace binding
 * @param {string} ip - Client IP address
 * @returns {Promise<{allowed: boolean, remaining: number}>}
 */
async function checkRateLimit(kv, ip) {
	if (!kv) return { allowed: true, remaining: RATE_LIMIT.MAX_REQUESTS };

	const now = new Date();
	const hourTimestamp = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
		now.getHours()
	).getTime();
	const key = `ratelimit_${ip}_${hourTimestamp}`;

	const currentCount = parseInt(await kv.get(key) || '0', 10);

	if (currentCount >= RATE_LIMIT.MAX_REQUESTS) {
		return { allowed: false, remaining: 0 };
	}

	await kv.put(key, String(currentCount + 1), {
		expirationTtl: RATE_LIMIT.WINDOW_HOURS * 3600
	});

	return { allowed: true, remaining: RATE_LIMIT.MAX_REQUESTS - currentCount - 1 };
}

/**
 * POST handler for contact form submissions.
 *
 * Flow:
 * 1. Parse request body (reject malformed JSON early, no side effects)
 * 2. Verify Turnstile CAPTCHA (fail-closed if secret key missing)
 * 3. Validate form fields (required, types, lengths, email format)
 * 4. Check rate limit (only for validated, human-verified requests)
 * 5. Store submission in KV with timestamped UUID key
 * 6. Return success with rate limit headers
 *
 * Error responses:
 * - 429: Rate limit exceeded
 * - 400: CAPTCHA failed or validation error
 * - 503: CAPTCHA verification service unavailable or misconfigured
 * - 500: Internal server error
 */
export async function onRequestPost(context) {
	const corsHeaders = getCorsHeaders(context.request);

	try {
		const clientIP =
			context.request.headers.get('CF-Connecting-IP') ||
			context.request.headers.get('X-Forwarded-For')?.split(',')[0] ||
			'unknown';

		/* 1. Parse Body — before any side effects (rate limit writes) */
		const body = await context.request.json();
		const name = typeof body.name === 'string' ? body.name.trim() : body.name;
		const email = typeof body.email === 'string' ? body.email.trim() : body.email;
		const message = typeof body.message === 'string' ? body.message.trim() : body.message;

		/* 2. Turnstile CAPTCHA Verification — fail closed */
		const turnstileToken = body['cf-turnstile-response'];
		if (!turnstileToken) {
			return new Response(
				JSON.stringify({ success: false, error: 'Please complete the CAPTCHA verification.' }),
				{ status: 400, headers: corsHeaders }
			);
		}

		if (context.env?.TURNSTILE_SECRET_KEY) {
			try {
				const verifyResponse = await fetch(
					'https://challenges.cloudflare.com/turnstile/v0/siteverify',
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							secret: context.env.TURNSTILE_SECRET_KEY,
							response: turnstileToken,
							remoteip: context.request.headers.get('CF-Connecting-IP')
						})
					}
				);

				const verifyResult = await verifyResponse.json();

				if (!verifyResult.success) {
					console.error('Turnstile verification failed:', verifyResult['error-codes']);
					return new Response(
						JSON.stringify({ success: false, error: 'CAPTCHA verification failed. Please try again.' }),
						{ status: 400, headers: corsHeaders }
					);
				}
			} catch (turnstileError) {
				console.error('Turnstile verification error:', turnstileError);
				return new Response(
					JSON.stringify({ success: false, error: 'Unable to verify CAPTCHA. Please try again later.' }),
					{ status: 503, headers: corsHeaders }
				);
			}
		} else if (context.env?.SKIP_CAPTCHA === 'true') {
			console.warn('[DEV] Turnstile verification skipped — SKIP_CAPTCHA=true');
		} else {
			// Fail closed: no secret key and no explicit skip flag = reject
			console.error('TURNSTILE_SECRET_KEY not configured — rejecting request');
			return new Response(
				JSON.stringify({ success: false, error: 'Server configuration error.' }),
				{ status: 503, headers: corsHeaders }
			);
		}

		/* 3. Form Field Validation */
		if (!name || !email || !message) {
			return new Response(
				JSON.stringify({ success: false, error: 'All fields are required (name, email, message).' }),
				{ status: 400, headers: corsHeaders }
			);
		}

		if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
			return new Response(
				JSON.stringify({ success: false, error: 'Invalid field types.' }),
				{ status: 400, headers: corsHeaders }
			);
		}

		// Length validation
		for (const [field, max] of Object.entries(MAX_LENGTHS)) {
			const val = { name, email, message }[field];
			if (val.length > max) {
				return new Response(
					JSON.stringify({ success: false, error: `${field} exceeds ${max} characters.` }),
					{ status: 400, headers: corsHeaders }
				);
			}
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return new Response(
				JSON.stringify({ success: false, error: 'Invalid email format.' }),
				{ status: 400, headers: corsHeaders }
			);
		}

		/* 4. Rate Limiting — only for validated, CAPTCHA-verified requests */
		const rateLimitCheck = await checkRateLimit(context.env?.CONTACT_SUBMISSIONS, clientIP);
		if (!rateLimitCheck.allowed) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Rate limit exceeded. Please try again later.',
					retryAfter: RATE_LIMIT.WINDOW_HOURS * 3600
				}),
				{
					status: 429,
					headers: {
						...corsHeaders,
						'Retry-After': String(RATE_LIMIT.WINDOW_HOURS * 3600),
						'X-RateLimit-Limit': String(RATE_LIMIT.MAX_REQUESTS),
						'X-RateLimit-Remaining': '0'
					}
				}
			);
		}

		/* 5. Store Submission in KV */
		const timestamp = new Date().toISOString();
		const key = `contact_${timestamp}_${crypto.randomUUID()}`;
		const value = JSON.stringify({
			name,
			email,
			message,
			submittedAt: timestamp,
		});

		if (context.env?.CONTACT_SUBMISSIONS) {
			await context.env.CONTACT_SUBMISSIONS.put(key, value);
		} else {
			console.log('[DEV] Contact submission (no KV):', { key, value });
		}

		return new Response(
			JSON.stringify({ success: true, message: 'Message received.' }),
			{
				status: 200,
				headers: {
					...corsHeaders,
					'X-RateLimit-Limit': String(RATE_LIMIT.MAX_REQUESTS),
					'X-RateLimit-Remaining': String(rateLimitCheck.remaining)
				}
			}
		);
	} catch (err) {
		console.error('Contact form error:', err);
		return new Response(
			JSON.stringify({ success: false, error: 'Internal server error.' }),
			{ status: 500, headers: corsHeaders }
		);
	}
}
