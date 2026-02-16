import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * Exploding text component — click to shatter heading into physics-driven fragments.
 * Characters fly off screen with gravity and rotation, then vaporize back into place.
 *
 * Layout stability: an invisible h1 placeholder always occupies space so the page
 * never shifts when characters are animating.
 *
 * @param {object} props
 * @param {string} props.text - The heading text to display
 * @param {string} [props.className] - CSS classes for the h1 element
 * @param {number} [props.rematerializeDelay=10] - Seconds before characters reappear
 * @param {number} [props.explosionForce=1] - Velocity multiplier for explosion
 */
function ExplodingText({ text, className = '', rematerializeDelay = 15, explosionForce = 1 }) {
	// idle | exploding | waiting | rematerializing
	const [state, setState] = useState('idle');
	const [charPositions, setCharPositions] = useState([]);
	const containerRef = useRef(null);
	const charRefs = useRef([]);
	const timerRef = useRef(null);

	// Cleanup timeout on unmount or route change
	useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

	// Check reduced motion preference
	const prefersReducedMotion = useRef(
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);

	/**
	 * Generate pre-computed keyframes for a character's parabolic explosion arc.
	 * 70% biased upward, 30% random direction. Includes rotation and opacity fade.
	 */
	const computeExplosionKeyframes = useCallback((charRect, containerRect) => {
		const steps = 30;
		const duration = 2; // seconds
		const dt = duration / steps;
		const gravity = 1200; // px/s^2

		// 70% chance upward bias
		const upward = Math.random() < 0.7;
		const angle = upward
			? -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.6
			: Math.random() * Math.PI * 2;

		const speed = (350 + Math.random() * 450) * explosionForce;
		const vx = Math.cos(angle) * speed;
		const vy = Math.sin(angle) * speed;
		const rotSpeed = (Math.random() - 0.5) * 720;

		// Starting position relative to container
		const startX = charRect.left - containerRect.left;
		const startY = charRect.top - containerRect.top;

		const keyframes = { x: [], y: [], rotate: [], opacity: [] };
		for (let i = 0; i <= steps; i++) {
			const t = i * dt;
			keyframes.x.push(startX + vx * t);
			keyframes.y.push(startY + vy * t + 0.5 * gravity * t * t);
			keyframes.rotate.push(rotSpeed * t);
			keyframes.opacity.push(i < steps * 0.75 ? 1 : 1 - (i - steps * 0.75) / (steps * 0.25));
		}

		return { keyframes, startX, startY, width: charRect.width, height: charRect.height };
	}, [explosionForce]);

	const handleClick = useCallback(() => {
		if (state !== 'idle') return;
		if (prefersReducedMotion.current) return;

		const container = containerRef.current;
		if (!container) return;
		const containerRect = container.getBoundingClientRect();

		// Measure each character position
		const positions = charRefs.current.map((el) => {
			if (!el) return null;
			const rect = el.getBoundingClientRect();
			return computeExplosionKeyframes(rect, containerRect);
		});

		setCharPositions(positions);
		setState('exploding');

		// After explosion flight (2s), enter waiting state, then schedule rematerialization
		timerRef.current = setTimeout(() => {
			setState('waiting');
			timerRef.current = setTimeout(() => {
				setState('rematerializing');
			}, (rematerializeDelay - 2) * 1000);
		}, 2000);
	}, [state, computeExplosionKeyframes, rematerializeDelay]);

	const characters = useMemo(() => text.split(''), [text]);
	const lastCharIndex = characters.length - 1;

	// Invisible placeholder h1 — always present to hold layout space
	const placeholder = (
		<h1
			className={`${className} ${state === 'idle' ? '' : 'invisible'}`}
			aria-hidden={state !== 'idle'}
			style={{ pointerEvents: 'none' }}
		>
			{characters.map((char, i) => (
				<span key={i} style={{ display: 'inline-block' }}>
					{char === ' ' ? '\u00A0' : char}
				</span>
			))}
		</h1>
	);

	// Idle state — clickable h1 with individual character spans
	if (state === 'idle') {
		return (
			<h1
				ref={containerRef}
				className={`${className} cursor-pointer select-none`}
				onClick={handleClick}
				aria-label={text}
			>
				{characters.map((char, i) => (
					<span
						key={i}
						ref={(el) => { charRefs.current[i] = el; }}
						style={{ display: 'inline-block' }}
					>
						{char === ' ' ? '\u00A0' : char}
					</span>
				))}
			</h1>
		);
	}

	// Exploding — characters fly off with parabolic arcs
	if (state === 'exploding') {
		return (
			<div
				ref={containerRef}
				className="relative"
				style={{ overflow: 'visible' }}
				aria-label={text}
				role="heading"
				aria-level="1"
			>
				{placeholder}
				{characters.map((char, i) => {
					const pos = charPositions[i];
					if (!pos) return null;
					return (
						<motion.span
							key={`explode-${i}`}
							className={className}
							style={{
								position: 'absolute',
								left: 0,
								top: 0,
								display: 'inline-block',
								lineHeight: 1,
								margin: 0,
								padding: 0,
							}}
							initial={{ x: pos.startX, y: pos.startY, rotate: 0, opacity: 1 }}
							animate={{
								x: pos.keyframes.x,
								y: pos.keyframes.y,
								rotate: pos.keyframes.rotate,
								opacity: pos.keyframes.opacity,
							}}
							transition={{ duration: 2, ease: 'linear' }}
						>
							{char === ' ' ? '\u00A0' : char}
						</motion.span>
					);
				})}
			</div>
		);
	}

	// Waiting — placeholder holds space, nothing visible
	if (state === 'waiting') {
		return (
			<div
				ref={containerRef}
				className="relative"
				aria-label={text}
				role="heading"
				aria-level="1"
			>
				{placeholder}
			</div>
		);
	}

	// Rematerializing — characters vaporize into place with staggered blur + fade
	return (
		<div
			ref={containerRef}
			className="relative"
			style={{ overflow: 'visible' }}
			aria-label={text}
			role="heading"
			aria-level="1"
		>
			{placeholder}
			{characters.map((char, i) => {
				const pos = charPositions[i];
				if (!pos) return null;
				return (
					<motion.span
						key={`vaporize-${i}`}
						className={className}
						style={{
							position: 'absolute',
							left: 0,
							top: 0,
							display: 'inline-block',
							lineHeight: 1,
							margin: 0,
							padding: 0,
						}}
						initial={{
							x: pos.startX,
							y: pos.startY - 40,
							opacity: 0,
							filter: 'blur(18px)',
							scale: 1.3,
						}}
						animate={{
							x: pos.startX,
							y: pos.startY,
							opacity: 1,
							filter: 'blur(0px)',
							scale: 1,
						}}
						transition={{
							duration: 2.4,
							ease: [0.25, 0.1, 0.25, 1],
							delay: i * 0.045,
							opacity: { duration: 1.6, delay: i * 0.045 },
						}}
						onAnimationComplete={() => {
							if (i === lastCharIndex) {
								setState('idle');
							}
						}}
					>
						{char === ' ' ? '\u00A0' : char}
					</motion.span>
				);
			})}
		</div>
	);
}

export default ExplodingText;
