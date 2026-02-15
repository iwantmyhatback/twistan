/**
 * Contact form component tests.
 * Tests form validation, CAPTCHA integration, and submission handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import Contact from '../src/pages/Contact';

// Mock fetch
global.fetch = vi.fn();

describe('Contact Form', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Mock successful CAPTCHA token
		document.querySelector = vi.fn((selector) => {
			if (selector === '[name="cf-turnstile-response"]') {
				return { value: 'mock-captcha-token' };
			}
			return null;
		});
	});

	it('renders contact form with all fields', () => {
		render(
			<BrowserRouter>
				<Contact />
			</BrowserRouter>
		);

		expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
	});

	it('validates required fields', async () => {
		render(
			<BrowserRouter>
				<Contact />
			</BrowserRouter>
		);

		const submitButton = screen.getByRole('button', { name: /send message/i });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText(/all fields are required/i)).toBeInTheDocument();
		});
	});

	it('validates email format', async () => {
		render(
			<BrowserRouter>
				<Contact />
			</BrowserRouter>
		);

		const nameInput = screen.getByLabelText(/name/i);
		const emailInput = screen.getByLabelText(/email/i);
		const messageInput = screen.getByLabelText(/message/i);
		const submitButton = screen.getByRole('button', { name: /send message/i });

		fireEvent.change(nameInput, { target: { value: 'Test User' } });
		fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
		fireEvent.change(messageInput, { target: { value: 'Test message' } });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
		});
	});

	it('requires CAPTCHA completion', async () => {
		// Mock no CAPTCHA token
		document.querySelector = vi.fn(() => ({ value: '' }));

		render(
			<BrowserRouter>
				<Contact />
			</BrowserRouter>
		);

		const nameInput = screen.getByLabelText(/name/i);
		const emailInput = screen.getByLabelText(/email/i);
		const messageInput = screen.getByLabelText(/message/i);
		const submitButton = screen.getByRole('button', { name: /send message/i });

		fireEvent.change(nameInput, { target: { value: 'Test User' } });
		fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
		fireEvent.change(messageInput, { target: { value: 'Test message' } });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText(/complete the captcha/i)).toBeInTheDocument();
		});
	});

	it('submits form successfully with valid data and CAPTCHA', async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true, message: 'Message received.' }),
		});

		render(
			<BrowserRouter>
				<Contact />
			</BrowserRouter>
		);

		const nameInput = screen.getByLabelText(/name/i);
		const emailInput = screen.getByLabelText(/email/i);
		const messageInput = screen.getByLabelText(/message/i);
		const submitButton = screen.getByRole('button', { name: /send message/i });

		fireEvent.change(nameInput, { target: { value: 'Test User' } });
		fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
		fireEvent.change(messageInput, { target: { value: 'Test message' } });
		fireEvent.click(submitButton);

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

		render(
			<BrowserRouter>
				<Contact />
			</BrowserRouter>
		);

		const nameInput = screen.getByLabelText(/name/i);
		const emailInput = screen.getByLabelText(/email/i);
		const messageInput = screen.getByLabelText(/message/i);
		const submitButton = screen.getByRole('button', { name: /send message/i });

		fireEvent.change(nameInput, { target: { value: 'Test User' } });
		fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
		fireEvent.change(messageInput, { target: { value: 'Test message' } });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText(/server error/i)).toBeInTheDocument();
		});
	});

	it('clears form after successful submission', async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true, message: 'Message received.' }),
		});

		render(
			<BrowserRouter>
				<Contact />
			</BrowserRouter>
		);

		const nameInput = screen.getByLabelText(/name/i);
		const emailInput = screen.getByLabelText(/email/i);
		const messageInput = screen.getByLabelText(/message/i);
		const submitButton = screen.getByRole('button', { name: /send message/i });

		fireEvent.change(nameInput, { target: { value: 'Test User' } });
		fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
		fireEvent.change(messageInput, { target: { value: 'Test message' } });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(nameInput.value).toBe('');
			expect(emailInput.value).toBe('');
			expect(messageInput.value).toBe('');
		});
	});
});
