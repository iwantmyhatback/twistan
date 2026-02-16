/**
 * Contact form component tests.
 * Tests form validation, CAPTCHA integration, and submission handling.
 * Uses useActionState with FormData-based uncontrolled inputs.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import Contact from '../src/pages/Contact';

// Mock fetch
global.fetch = vi.fn();

/** Render Contact within a router context. */
function renderContact() {
	const router = createMemoryRouter(
		[{ path: '*', element: <Contact /> }],
		{ initialEntries: ['/contact'] }
	);
	return render(<RouterProvider router={router} />);
}

/**
 * Fill form fields with provided values.
 */
async function fillForm(user, { name = 'Test User', email = 'test@example.com', message = 'Test message' } = {}) {
	if (name) await user.type(screen.getByLabelText(/name/i), name);
	if (email) await user.type(screen.getByLabelText(/email/i), email);
	if (message) await user.type(screen.getByLabelText(/message/i), message);
}

/** Inject a hidden turnstile response input into the form. */
function injectCaptchaToken(token = 'mock-captcha-token') {
	const form = document.querySelector('form');
	if (!form) return;
	const existing = form.querySelector('[name="cf-turnstile-response"]');
	if (existing) {
		existing.value = token;
		return;
	}
	const input = document.createElement('input');
	input.type = 'hidden';
	input.name = 'cf-turnstile-response';
	input.value = token;
	form.appendChild(input);
}

describe('Contact Turnstile Initialization', () => {
	it('polls for turnstile and renders widget when available', async () => {
		vi.useFakeTimers();
		const renderSpy = vi.fn().mockReturnValue('widget-id');

		// Remove turnstile initially
		const originalTurnstile = window.turnstile;
		delete window.turnstile;

		renderContact();

		// After 100ms polling interval, add turnstile
		window.turnstile = { render: renderSpy, reset: vi.fn(), remove: vi.fn() };
		await vi.advanceTimersByTimeAsync(200);

		expect(renderSpy).toHaveBeenCalled();

		// Restore
		window.turnstile = originalTurnstile;
		vi.useRealTimers();
	});

	it('renders widget immediately when turnstile already loaded', () => {
		const renderSpy = vi.fn().mockReturnValue('widget-id');
		const originalTurnstile = window.turnstile;
		window.turnstile = { render: renderSpy, reset: vi.fn(), remove: vi.fn() };

		renderContact();

		expect(renderSpy).toHaveBeenCalled();

		window.turnstile = originalTurnstile;
	});

	it('handles turnstile render error gracefully', () => {
		const originalTurnstile = window.turnstile;
		window.turnstile = {
			render: vi.fn(() => { throw new Error('Widget error'); }),
			reset: vi.fn(),
			remove: vi.fn(),
		};

		// Should not throw
		expect(() => renderContact()).not.toThrow();

		window.turnstile = originalTurnstile;
	});

	it('resets turnstile widget on error state', async () => {
		const resetSpy = vi.fn();
		const originalTurnstile = window.turnstile;
		window.turnstile = {
			render: vi.fn().mockReturnValue('widget-id'),
			reset: resetSpy,
			remove: vi.fn(),
		};

		global.fetch.mockResolvedValueOnce({
			ok: false,
			status: 400,
			json: async () => ({ error: 'Bad request' }),
		});

		const user = userEvent.setup();
		renderContact();

		await fillForm(user);
		injectCaptchaToken();
		await user.click(screen.getByRole('button', { name: /send message/i }));

		await waitFor(() => {
			expect(resetSpy).toHaveBeenCalled();
		});

		window.turnstile = originalTurnstile;
	});
});

describe('Contact Form', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders contact form with all fields', () => {
		renderContact();

		expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
	});

	it('validates required fields', async () => {
		const user = userEvent.setup();
		renderContact();

		await user.click(screen.getByRole('button', { name: /send message/i }));

		await waitFor(() => {
			expect(screen.getByText(/all fields are required/i)).toBeInTheDocument();
		});
	});

	it('validates email format', async () => {
		const user = userEvent.setup();
		renderContact();

		await fillForm(user, { email: 'invalid-email' });
		injectCaptchaToken();
		await user.click(screen.getByRole('button', { name: /send message/i }));

		await waitFor(() => {
			expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
		});
	});

	it('requires CAPTCHA completion', async () => {
		const user = userEvent.setup();
		renderContact();

		await fillForm(user);
		// No captcha token injected
		await user.click(screen.getByRole('button', { name: /send message/i }));

		await waitFor(() => {
			expect(screen.getByText(/complete the captcha/i)).toBeInTheDocument();
		});
	});

	it('submits form successfully with valid data and CAPTCHA', async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true, message: 'Message received.' }),
		});

		const user = userEvent.setup();
		renderContact();

		await fillForm(user);
		injectCaptchaToken();
		await user.click(screen.getByRole('button', { name: /send message/i }));

		await waitFor(() => {
			expect(screen.getByText(/message sent/i)).toBeInTheDocument();
		});

		expect(global.fetch).toHaveBeenCalledWith(
			'/api/contact',
			expect.objectContaining({
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			})
		);
	});

	it('handles API errors gracefully', async () => {
		global.fetch.mockResolvedValueOnce({
			ok: false,
			status: 500,
			json: async () => ({ error: 'Server error' }),
		});

		const user = userEvent.setup();
		renderContact();

		await fillForm(user);
		injectCaptchaToken();
		await user.click(screen.getByRole('button', { name: /send message/i }));

		await waitFor(() => {
			expect(screen.getByText(/server error/i)).toBeInTheDocument();
		});
	});

	it('handles network error with non-JSON response', async () => {
		global.fetch.mockResolvedValueOnce({
			ok: false,
			status: 500,
			json: async () => { throw new Error('not json'); },
		});

		const user = userEvent.setup();
		renderContact();

		await fillForm(user);
		injectCaptchaToken();
		await user.click(screen.getByRole('button', { name: /send message/i }));

		await waitFor(() => {
			expect(screen.getByText(/server error \(500\)/i)).toBeInTheDocument();
		});
	});

	it('handles fetch rejection (network failure)', async () => {
		global.fetch.mockRejectedValueOnce(new Error('Network failure'));

		const user = userEvent.setup();
		renderContact();

		await fillForm(user);
		injectCaptchaToken();
		await user.click(screen.getByRole('button', { name: /send message/i }));

		await waitFor(() => {
			expect(screen.getByText(/network failure/i)).toBeInTheDocument();
		});
	});

	it('resets form after successful submission', async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true }),
		});

		const resetSpy = vi.spyOn(HTMLFormElement.prototype, 'reset');
		const user = userEvent.setup();
		renderContact();

		await fillForm(user);
		injectCaptchaToken();
		await user.click(screen.getByRole('button', { name: /send message/i }));

		await waitFor(() => {
			expect(resetSpy).toHaveBeenCalled();
		});

		resetSpy.mockRestore();
	});
});
