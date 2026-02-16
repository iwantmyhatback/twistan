import { useActionState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import AnimatedSection from '../components/AnimatedSection';
import ExplodingText from '../components/ExplodingText';
import { spawnRipple } from '../utils/ripple';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const MAX_LENGTHS = { name: 100, email: 254, message: 5000 };

/**
 * Validates email format using RFC-compliant regex.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Form action for contact submission.
 * Validates fields, checks CAPTCHA, submits to API.
 * @param {object} prevState - Previous form state
 * @param {FormData} formData - Submitted form data
 * @returns {Promise<{status: string, error: string}>}
 */
async function submitContact(prevState, formData) {
	const name = formData.get('name')?.trim() ?? '';
	const email = formData.get('email')?.trim() ?? '';
	const message = formData.get('message')?.trim() ?? '';

	/* Client-side validation */
	if (!name || !email || !message) {
		return { status: 'error', error: 'All fields are required.' };
	}
	if (!isValidEmail(email)) {
		return { status: 'error', error: 'Please enter a valid email address.' };
	}

	const turnstileToken = formData.get('cf-turnstile-response');
	if (!turnstileToken) {
		return { status: 'error', error: 'Please complete the CAPTCHA verification.' };
	}

	try {
		const res = await fetch('/api/contact', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, email, message, 'cf-turnstile-response': turnstileToken }),
		});

		if (!res.ok) {
			const data = await res.json().catch(() => ({}));
			throw new Error(data.error || `Server error (${res.status})`);
		}

		return { status: 'success', error: '' };
	} catch (err) {
		return { status: 'error', error: err.message || 'Something went wrong. Please try again.' };
	}
}

/**
 * Contact form component with Cloudflare Turnstile CAPTCHA integration.
 *
 * Uses React 19 useActionState for form state management.
 * Uncontrolled inputs with FormData-based submission.
 * Automatic form/widget reset on success, widget reset on error.
 */
function Contact() {
	const [state, formAction, isPending] = useActionState(submitContact, { status: 'idle', error: '' });
	const formRef = useRef(null);
	const turnstileRef = useRef(null);
	const widgetIdRef = useRef(null);

	/* Reset form + turnstile on success, reset turnstile on error */
	useEffect(() => {
		if (state.status === 'success') {
			formRef.current?.reset();
			if (window.turnstile && widgetIdRef.current) {
				window.turnstile.reset(widgetIdRef.current);
			}
		}
		if (state.status === 'error' && window.turnstile && widgetIdRef.current) {
			window.turnstile.reset(widgetIdRef.current);
		}
	}, [state]);

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

	const inputBase =
		'w-full bg-surface-100 border border-surface-300 rounded-lg px-4 py-3 text-sm text-neutral-200 ' +
		'placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent ' +
		'transition-all duration-200';

	return (
		<div className="section-container py-24">
			<AnimatedSection>
				<ExplodingText text="Get in Touch" className="heading-xl mb-3" />
			</AnimatedSection>
			<AnimatedSection delay={0.1}>
				<p className="text-body mb-12">
					Have a question or want to work together? Drop me a message.
				</p>
			</AnimatedSection>

			<AnimatedSection delay={0.2}>
				<form
					ref={formRef}
					action={formAction}
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
							placeholder="Your name"
							maxLength={MAX_LENGTHS.name}
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
							placeholder="you@example.com"
							maxLength={MAX_LENGTHS.email}
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
							placeholder="What's on your mind?"
							maxLength={MAX_LENGTHS.message}
							className={`${inputBase} resize-none`}
							required
						/>
					</div>

					<div ref={turnstileRef} id="turnstile-widget"></div>

					<motion.button
						type="submit"
						disabled={isPending}
						onClick={spawnRipple}
						whileHover={isPending ? {} : { scale: 1.02, y: -2 }}
						transition={{ type: 'spring', stiffness: 300, damping: 20 }}
						className="card card-inner-highlight ripple-container flex items-center justify-center cursor-pointer w-full
						           disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<span className="text-sm font-medium font-display text-neutral-200">
							{isPending ? 'Sending...' : 'Send Message'}
						</span>
					</motion.button>

					{state.status === 'success' && (
						<p className="text-sm text-green-400" role="status">
							Message sent. I&rsquo;ll get back to you soon.
						</p>
					)}
					{state.status === 'error' && state.error && (
						<p className="text-sm text-red-400" role="alert">{state.error}</p>
					)}
				</form>
			</AnimatedSection>
		</div>
	);
}

export default Contact;
