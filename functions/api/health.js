/**
 * Health check endpoint — Cloudflare Pages Function.
 */
export async function onRequestGet() {
	return new Response(
		JSON.stringify({
			status: 'ok',
			timestamp: new Date().toISOString(),
		}),
		{
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		}
	);
}
