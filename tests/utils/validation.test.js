/**
 * Validation utility tests.
 * Tests email validation and other utility functions.
 */

import { describe, it, expect } from 'vitest';

// Email validation regex (same as used in Contact.jsx)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

describe('Email Validation', () => {
	it('accepts valid email addresses', () => {
		const validEmails = [
			'test@example.com',
			'user.name@example.com',
			'user+tag@example.co.uk',
			'user123@sub.example.com',
		];

		validEmails.forEach((email) => {
			expect(EMAIL_REGEX.test(email)).toBe(true);
		});
	});

	it('rejects invalid email addresses', () => {
		const invalidEmails = [
			'invalid',
			'@example.com',
			'user@',
			'user @example.com',
			'user@.com',
			'',
			' ',
		];

		invalidEmails.forEach((email) => {
			expect(EMAIL_REGEX.test(email)).toBe(false);
		});
	});
});

describe('Rate Limiting Logic', () => {
	it('creates correct hourly bucket timestamps', () => {
		const now = new Date('2026-02-14T15:30:45.123Z');
		const hourTimestamp = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			now.getHours()
		).getTime();

		// Should round down to start of hour
		const expected = new Date('2026-02-14T15:00:00.000Z').getTime();
		expect(hourTimestamp).toBe(expected);
	});

	it('creates unique keys for different IPs', () => {
		const timestamp = Date.now();
		const ip1 = '192.168.1.1';
		const ip2 = '192.168.1.2';

		const key1 = `ratelimit_${ip1}_${timestamp}`;
		const key2 = `ratelimit_${ip2}_${timestamp}`;

		expect(key1).not.toBe(key2);
		expect(key1).toContain(ip1);
		expect(key2).toContain(ip2);
	});
});

describe('KV Key Generation', () => {
	it('creates properly formatted contact submission keys', () => {
		const timestamp = '2026-02-14T15:30:00.000Z';
		const uuid = 'abc123-def456';
		const key = `contact_${timestamp}_${uuid}`;

		expect(key).toMatch(/^contact_\d{4}-\d{2}-\d{2}T.+_.+$/);
		expect(key).toContain(timestamp);
		expect(key).toContain(uuid);
	});
});
