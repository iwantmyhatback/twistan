/**
 * Contact form handler — Cloudflare Pages Function.
 * Validates input and stores submissions in KV.
 */

/** CORS preflight handler. */
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

/** POST handler — validate and store contact submission. */
export async function onRequestPost(context) {
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/json',
	};

	try {
		const body = await context.request.json();
		const { name, email, message } = body;

		// Validate required fields
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

		// Basic email format check
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return new Response(
				JSON.stringify({ success: false, error: 'Invalid email format.' }),
				{ status: 400, headers: corsHeaders }
			);
		}

		// Store in KV with timestamped key
		const timestamp = new Date().toISOString();
		const key = `contact_${timestamp}_${crypto.randomUUID()}`;
		const value = JSON.stringify({
			name: name.trim(),
			email: email.trim(),
			message: message.trim(),
			submittedAt: timestamp,
		});

		await context.env.CONTACT_SUBMISSIONS.put(key, value);

		return new Response(
			JSON.stringify({ success: true, message: 'Message received.' }),
			{ status: 200, headers: corsHeaders }
		);
	} catch (err) {
		console.error('Contact form error:', err);
		return new Response(
			JSON.stringify({ success: false, error: 'Internal server error.' }),
			{ status: 500, headers: corsHeaders }
		);
	}
}
