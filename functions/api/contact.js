/**
 * Contact form handler — Cloudflare Pages Function.
 *
 * Security layers:
 * - Rate limiting: 5 submissions per IP per hour (KV-based)
 * - CAPTCHA: Cloudflare Turnstile verification
 * - Input validation: Client and server-side
 * - CORS: Proper cross-origin headers
 *
 * Storage: Submissions stored in KV with timestamped UUID keys
 */

const RATE_LIMIT = {
	MAX_REQUESTS: 5,
	WINDOW_HOURS: 1
};

/**
 * CORS preflight handler for contact form endpoint.
 */
export async function onRequestOptions() {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Access-Control-Max-Age': '86400',
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
 * 1. Extract client IP from Cloudflare headers
 * 2. Check rate limit (KV-based, per-IP hourly buckets)
 * 3. Verify Turnstile CAPTCHA token with Cloudflare API
 * 4. Validate form fields (required, types, email format)
 * 5. Store submission in KV with timestamped UUID key
 * 6. Return success with rate limit headers
 *
 * Error responses:
 * - 429: Rate limit exceeded
 * - 400: CAPTCHA failed or validation error
 * - 503: CAPTCHA verification service unavailable
 * - 500: Internal server error
 */
export async function onRequestPost(context) {
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/json',
	};

	try {
		const clientIP = context.request.headers.get('CF-Connecting-IP') ||
		                 context.request.headers.get('X-Forwarded-For')?.split(',')[0] ||
		                 'unknown';

		/* Rate Limiting */
		const rateLimitCheck = await checkRateLimit(context.env?.CONTACT_SUBMISSIONS, clientIP);
		if (!rateLimitCheck.allowed) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Rate limit exceeded. Please try again later.',
					retryAfter: RATE_LIMIT.WINDOW_HOURS * 3600 // seconds
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

		const body = await context.request.json();
		const { name, email, message } = body;

		/* Turnstile CAPTCHA Verification */
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
				// Fail closed - reject if verification service is down
				return new Response(
					JSON.stringify({ success: false, error: 'Unable to verify CAPTCHA. Please try again later.' }),
					{ status: 503, headers: corsHeaders }
				);
			}
		} else {
			console.warn('[DEV] Turnstile verification skipped - no secret key configured');
		}

		/* Form Field Validation */
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

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return new Response(
				JSON.stringify({ success: false, error: 'Invalid email format.' }),
				{ status: 400, headers: corsHeaders }
			);
		}

		/* Store Submission in KV */
		const timestamp = new Date().toISOString();
		const key = `contact_${timestamp}_${crypto.randomUUID()}`;
		const value = JSON.stringify({
			name: name.trim(),
			email: email.trim(),
			message: message.trim(),
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
