import { useState, useEffect, useRef } from 'react';
import AnimatedSection from '../components/AnimatedSection';

const INITIAL_FORM = { name: '', email: '', message: '' };
const TURNSTILE_SITE_KEY = '0x4AAAAAACciy0Z_rZz_YPMG';

/**
 * Validates email format using RFC-compliant regex.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Contact form component with Cloudflare Turnstile CAPTCHA integration.
 *
 * Features:
 * - Client-side validation (required fields, email format)
 * - Cloudflare Turnstile CAPTCHA (dark theme, explicit rendering)
 * - Form state management with error handling
 * - Automatic widget reset on success/error
 *
 * Security: Form submission requires CAPTCHA completion.
 * Backend enforces rate limiting and server-side validation.
 */
function Contact() {
	const [form, setForm] = useState(INITIAL_FORM);
	const [status, setStatus] = useState('idle'); // idle | sending | success | error
	const [errorMsg, setErrorMsg] = useState('');
	const turnstileRef = useRef(null);
	const widgetIdRef = useRef(null);

	/**
	 * Initialize Turnstile widget after script loads.
	 * Uses explicit rendering for reliability over automatic mode.
	 * Polls for window.turnstile availability if script not yet loaded.
	 */
	useEffect(() => {
		const initTurnstile = () => {
			if (window.turnstile && turnstileRef.current && !widgetIdRef.current) {
				try {
					widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
						sitekey: TURNSTILE_SITE_KEY,
						theme: 'dark',
					});
				} catch (error) {
					console.error('Turnstile initialization error:', error);
				}
			}
		};

		if (window.turnstile) {
			initTurnstile();
		} else {
			const checkInterval = setInterval(() => {
				if (window.turnstile) {
					initTurnstile();
					clearInterval(checkInterval);
				}
			}, 100);

			return () => clearInterval(checkInterval);
		}
	}, []);

	const handleChange = (e) => {
		setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	/**
	 * Handle form submission with validation and CAPTCHA verification.
	 * Validates fields client-side, checks for CAPTCHA token, submits to API.
	 * Resets form and widget on success, resets widget on error for retry.
	 */
	const handleSubmit = async (e) => {
		e.preventDefault();
		setErrorMsg('');

		/* Client-side Validation */
		if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
			setErrorMsg('All fields are required.');
			setStatus('error');
			return;
		}
		if (!isValidEmail(form.email)) {
			setErrorMsg('Please enter a valid email address.');
			setStatus('error');
			return;
		}

		const turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value;
		if (!turnstileToken) {
			setErrorMsg('Please complete the CAPTCHA verification.');
			setStatus('error');
			return;
		}

		setStatus('sending');

		try {
			const res = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...form,
					'cf-turnstile-response': turnstileToken
				}),
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.error || `Server error (${res.status})`);
			}

			setStatus('success');
			setForm(INITIAL_FORM);
			if (window.turnstile && widgetIdRef.current) {
				window.turnstile.reset(widgetIdRef.current);
			}
		} catch (err) {
			setErrorMsg(err.message || 'Something went wrong. Please try again.');
			setStatus('error');
			if (window.turnstile && widgetIdRef.current) {
				window.turnstile.reset(widgetIdRef.current);
			}
		}
	};

	const inputBase =
		'w-full bg-surface-100 border border-surface-300 rounded-lg px-4 py-3 text-sm text-neutral-200 ' +
		'placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent ' +
		'transition-all duration-200';

	return (
		<div className="section-container py-24">
			<AnimatedSection>
				<h1 className="heading-xl mb-3">Get in Touch</h1>
			</AnimatedSection>
			<AnimatedSection delay={0.1}>
				<p className="text-body mb-12">
					Have a question or want to work together? Drop me a message.
				</p>
			</AnimatedSection>

			<AnimatedSection delay={0.2}>
				<form
					onSubmit={handleSubmit}
					className="max-w-lg flex flex-col gap-5"
					noValidate
				>
					<div>
						<label htmlFor="name" className="block text-xs font-medium text-neutral-500 mb-1.5">
							Name
						</label>
						<input
							id="name"
							name="name"
							type="text"
							value={form.name}
							onChange={handleChange}
							placeholder="Your name"
							className={inputBase}
							required
						/>
					</div>

					<div>
						<label htmlFor="email" className="block text-xs font-medium text-neutral-500 mb-1.5">
							Email
						</label>
						<input
							id="email"
							name="email"
							type="email"
							value={form.email}
							onChange={handleChange}
							placeholder="you@example.com"
							className={inputBase}
							required
						/>
					</div>

					<div>
						<label htmlFor="message" className="block text-xs font-medium text-neutral-500 mb-1.5">
							Message
						</label>
						<textarea
							id="message"
							name="message"
							rows={5}
							value={form.message}
							onChange={handleChange}
							placeholder="What's on your mind?"
							className={`${inputBase} resize-none`}
							required
						/>
					</div>

					<div ref={turnstileRef} id="turnstile-widget"></div>

					<button
						type="submit"
						disabled={status === 'sending'}
						className="w-full py-3 rounded-lg text-sm font-medium bg-accent hover:bg-accent-dark
						           text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{status === 'sending' ? 'Sending...' : 'Send Message'}
					</button>

					{status === 'success' && (
						<p className="text-sm text-green-400">
							Message sent. I&rsquo;ll get back to you soon.
						</p>
					)}
					{status === 'error' && errorMsg && (
						<p className="text-sm text-red-400">{errorMsg}</p>
					)}
				</form>
			</AnimatedSection>
		</div>
	);
}

export default Contact;
