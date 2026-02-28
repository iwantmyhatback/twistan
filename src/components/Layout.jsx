import { Outlet } from 'react-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import CursorGlow from './CursorGlow';

const IDLE_TIMEOUT_MS = 60_000;
const IDLE_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart'];
const SCROLL_THROTTLE_MS = 200;

/**
 * Detects user inactivity. Returns true after `timeout` ms of no interaction.
 * Resets on any mouse, keyboard, scroll, or touch event.
 * Scroll events are throttled to avoid excessive reset calls.
 *
 * @param {number} timeout - ms of inactivity before idle state triggers
 * @returns {boolean} isIdle
 */
function useIdleDetection(timeout) {
	const [isIdle, setIsIdle] = useState(false);
	const timerRef = useRef(null);
	const scrollThrottleRef = useRef(0);

	const reset = useCallback(() => {
		setIsIdle(false);
		clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => setIsIdle(true), timeout);
	}, [timeout]);

	useEffect(() => {
		const throttledScrollReset = () => {
			const now = Date.now();
			if (now - scrollThrottleRef.current < SCROLL_THROTTLE_MS) return;
			scrollThrottleRef.current = now;
			reset();
		};

		reset(); // start timer on mount
		IDLE_EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));
		window.addEventListener('scroll', throttledScrollReset, { passive: true });
		return () => {
			clearTimeout(timerRef.current);
			IDLE_EVENTS.forEach((e) => window.removeEventListener(e, reset));
			window.removeEventListener('scroll', throttledScrollReset);
		};
	}, [reset]);

	return isIdle;
}

/**
 * Shared layout shell: navbar, page content via Outlet, footer.
 * Page transitions handled by View Transitions API via router viewTransition prop.
 * Idle detection applies a drooping CSS animation after 60s of inactivity.
 */
function Layout() {
	const isIdle = useIdleDetection(IDLE_TIMEOUT_MS);

	useEffect(() => {
		document.body.classList.toggle('idle-droop', isIdle);
		return () => document.body.classList.remove('idle-droop');
	}, [isIdle]);

	return (
		<div className="min-h-screen flex flex-col">
			<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-60 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded">
				Skip to content
			</a>
			<Navbar isIdle={isIdle} />
			<CursorGlow />
			<main id="main-content" className="flex-1 pt-16">
				<Outlet />
			</main>
			<Footer />
		</div>
	);
}

export default Layout;
