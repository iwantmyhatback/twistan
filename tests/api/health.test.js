/**
 * Health check API endpoint tests.
 */

import { describe, it, expect } from 'vitest';

describe('Health API', () => {
	it('returns 200 with status ok', async () => {
		const { onRequestGet } = await import('../../functions/api/health.js');

		const response = await onRequestGet();
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.status).toBe('ok');
	});

	it('returns JSON content type', async () => {
		const { onRequestGet } = await import('../../functions/api/health.js');

		const response = await onRequestGet();
		const headers = Object.fromEntries(response.headers.entries());

		expect(headers['content-type']).toBe('application/json');
	});

	it('includes a valid ISO timestamp', async () => {
		const { onRequestGet } = await import('../../functions/api/health.js');

		const before = new Date().toISOString();
		const response = await onRequestGet();
		const data = await response.json();
		const after = new Date().toISOString();

		expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		expect(data.timestamp >= before).toBe(true);
		expect(data.timestamp <= after).toBe(true);
	});
});
