import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';

/** Date of the last bugfix deployment — update this when deploying fixes. */
const LAST_BUGFIX_DEPLOY = new Date('2026-02-21');
const CHAR_DELAY_MS = 55;
const HOLD_DURATION_MS = 5000;

/**
 * Typewriter reveal of "days since last bugfix was deployed: X".
 * Triggered by clicking the copyright year.
 */
function YearEasterEgg() {
	const [revealed, setRevealed] = useState(false);
	const [charCount, setCharCount] = useState(0);
	const intervalRef = useRef(null);

	const days = Math.floor((Date.now() - LAST_BUGFIX_DEPLOY.getTime()) / 86_400_000);
	const message = `days since last bugfix was deployed: ${days}`;

	useEffect(() => {
		if (!revealed) return;
		let i = 0;
		intervalRef.current = setInterval(() => {
			i++;
			setCharCount(i);
			if (i >= message.length) clearInterval(intervalRef.current);
		}, CHAR_DELAY_MS);
		return () => clearInterval(intervalRef.current);
	}, [revealed, message.length]);

	return (
		<div className="flex flex-col items-center gap-1">
			<span className="font-mono text-xs text-neutral-600">
				Twistan &copy;{' '}
				<button
					onClick={() => { if (!revealed) setRevealed(true); }}
					className={`font-mono text-xs transition-colors duration-200 ${
						revealed ? 'text-neutral-600 cursor-default' : 'text-neutral-600 hover:text-terminal cursor-pointer'
					}`}
					aria-label="Click for a secret"
				>
					{new Date().getFullYear()}
				</button>
			</span>
			{revealed && (
				<span className="font-mono text-xs text-terminal">
					{message.slice(0, charCount)}
					{charCount < message.length && (
						<span style={{ animation: 'subtle-pulse 0.6s step-end infinite' }} aria-hidden="true">▌</span>
					)}
				</span>
			)}
		</div>
	);
}

/**
 * GitHub icon in the footer.
 * Hold for 5 seconds to activate "hacker mode" — green-on-black aesthetic for 5s.
 */
function FooterGitHub() {
	const holdTimer = useRef(null);
	const deactivateTimer = useRef(null);
	const [hackerMode, setHackerMode] = useState(false);
	const [holding, setHolding] = useState(false);

	const deactivate = useCallback(() => {
		setHackerMode(false);
		document.body.classList.remove('hacker-mode');
	}, []);

	const startHold = useCallback(() => {
		setHolding(true);
		holdTimer.current = setTimeout(() => {
			setHolding(false);
			setHackerMode(true);
			document.body.classList.add('hacker-mode');
			clearTimeout(deactivateTimer.current);
			deactivateTimer.current = setTimeout(deactivate, 5000);
		}, HOLD_DURATION_MS);
	}, [deactivate]);

	const cancelHold = useCallback(() => {
		setHolding(false);
		clearTimeout(holdTimer.current);
	}, []);

	useEffect(() => () => {
		clearTimeout(holdTimer.current);
		clearTimeout(deactivateTimer.current);
		document.body.classList.remove('hacker-mode');
	}, []);

	return (
		<>
			<a
				href="https://github.com/iwantmyhatback"
				target="_blank"
				rel="noopener noreferrer"
				className="relative text-neutral-500 hover:text-white transition-all duration-200 github-glow select-none"
				aria-label="GitHub"
				onMouseDown={startHold}
				onMouseUp={cancelHold}
				onMouseLeave={cancelHold}
				onTouchStart={startHold}
				onTouchEnd={cancelHold}
				onClick={(e) => e.preventDefault()} // prevent navigation during hold
			>
				<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
				</svg>
				{/* Hold progress ring */}
				{holding && (
					<span className="absolute inset-0 rounded-full border-2 border-terminal animate-ping opacity-60 pointer-events-none" />
				)}
			</a>
			<AnimatePresence>
				{hackerMode && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-55 flex items-center justify-center pointer-events-none"
					>
						<span
							className="font-mono text-terminal text-4xl font-bold tracking-widest"
							style={{ textShadow: '0 0 20px #33ff33, 0 0 40px #33ff33' }}
						>
							WHAT YOU&rsquo;RE LOOKING FOR IS NOT HERE
						</span>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}

/**
 * Minimal footer — GitHub link, brand + copyright.
 */
function Footer() {
	return (
		<footer className="mt-auto relative z-40">
			<div className="section-container py-8 flex flex-col items-center gap-4">
				<FooterGitHub />
				<YearEasterEgg />
			</div>
		</footer>
	);
}

export default Footer;
