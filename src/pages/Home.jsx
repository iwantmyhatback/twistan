import { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ImageUrls from '../assets/ImageUrls';
import AnimatedSection from '../components/AnimatedSection';
import { spawnRipple } from '../utils/ripple';
import { spawnImageExplosion } from '../utils/imageExplosion';
import { usePageTitle } from '../hooks/usePageTitle';

/**
 * Fisher-Yates shuffle using crypto.getRandomValues.
 * @param {any[]} arr - Array to shuffle (mutated in place).
 * @returns {any[]}
 */
function cryptoShuffle(arr) {
	const rng = new Uint32Array(arr.length);
	window.crypto.getRandomValues(rng);
	for (let i = arr.length - 1; i > 0; i--) {
		const j = rng[i] % (i + 1);
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

/** Max image dimension used in scaling — wrapper reserves this height so the button stays put. */
const MAX_IMG = 420;

/** Always-first image shown on initial page load. */
const FIRST_IMAGE = ImageUrls[0];

/**
 * Crack paths for the wave button — each appears at its threshold and grows
 * to full length over CRACK_GROW_RANGE of total progress. Jagged line segments
 * simulate stress fractures converging on the button center (48, 48 in a 96×96 viewBox).
 */
const CRACKS = [
	// Phase 1: first hairline from top edge
	{ threshold: 0.08, d: 'M 43 8 L 45 16 L 41 22 L 44 30' },
	{ threshold: 0.14, d: 'M 45 16 L 51 20' },

	// Phase 2: crack from right edge
	{ threshold: 0.22, d: 'M 88 42 L 78 44 L 72 40 L 66 44' },
	{ threshold: 0.28, d: 'M 78 44 L 80 53' },

	// Phase 3: crack from bottom-left
	{ threshold: 0.34, d: 'M 16 80 L 22 72 L 28 74 L 33 64' },
	{ threshold: 0.38, d: 'M 22 72 L 17 65' },

	// Phase 4: top crack extends toward center
	{ threshold: 0.44, d: 'M 44 30 L 42 36 L 46 42 L 48 48' },
	{ threshold: 0.48, d: 'M 42 36 L 36 40' },

	// Phase 5: crack from top-right
	{ threshold: 0.54, d: 'M 72 10 L 67 20 L 70 28 L 64 34' },
	{ threshold: 0.58, d: 'M 67 20 L 74 25' },

	// Phase 6: crack from left edge
	{ threshold: 0.64, d: 'M 6 50 L 16 48 L 22 52 L 30 48' },
	{ threshold: 0.68, d: 'M 16 48 L 19 40' },

	// Phase 7: center radiating cracks
	{ threshold: 0.74, d: 'M 48 48 L 53 57 L 58 66 L 62 76' },
	{ threshold: 0.78, d: 'M 48 48 L 40 56 L 34 64 L 28 74' },

	// Phase 8: final connections — everything meets the center
	{ threshold: 0.84, d: 'M 66 44 L 58 46 L 52 44 L 48 48' },
	{ threshold: 0.88, d: 'M 30 48 L 37 50 L 43 46 L 48 48' },
	{ threshold: 0.85, d: 'M 48 48 L 51 38 L 55 28 L 60 20' },
	{ threshold: 0.85, d: 'M 33 64 L 38 58 L 44 53 L 48 48' },
];
/** Each crack draws from 0→1 over this fraction of total progress after its threshold. */
const CRACK_GROW_RANGE = 0.15;

/**
 * Home page — displays a shuffled carousel of wave GIFs inside an animated tile.
 * The first image is pinned; subsequent clicks cycle through a cryptographically shuffled deck.
 */
function Home() {
	usePageTitle('');
	const prefersReducedMotion = useMemo(
		() => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
		[],
	);
	const deck = useRef((() => {
		const rest = ImageUrls.filter((u) => u !== FIRST_IMAGE);
		return [FIRST_IMAGE, ...cryptoShuffle(rest)];
	})());
	const cursor = useRef(0);

	const [imgUrl, setImgUrl] = useState(deck.current[0]);
	const [imageKey, setImageKey] = useState(0);
	const [tileSize, setTileSize] = useState({ width: 350, height: 350 });
	const [glowProgress, setGlowProgress] = useState(0);
	const [empActive, setEmpActive] = useState(false);
	const imgRef = useRef(null);

	const handleNewImage = useCallback((e) => {
		spawnRipple(e);

		// Only explode on the last image in the deck; all others transition normally
		const isLastInDeck = cursor.current === deck.current.length - 1;
		if (imgRef.current && isLastInDeck) {
			spawnImageExplosion(imgRef.current);
		}

		cursor.current += 1;
		if (cursor.current >= deck.current.length) {
			setEmpActive(true);
			const last = deck.current[deck.current.length - 1];
			deck.current = cryptoShuffle([...ImageUrls]);
			// Avoid showing the same image across the reshuffle boundary
			if (deck.current[0] === last) {
				[deck.current[0], deck.current[1]] = [deck.current[1], deck.current[0]];
			}
			cursor.current = 0;
			setGlowProgress(0);
		} else {
			setGlowProgress(cursor.current / (deck.current.length - 1));
		}
		setImgUrl(deck.current[cursor.current]);
		setImageKey((k) => k + 1);
	}, []);

	/** Skip to next image on load failure. */
	const handleImageError = useCallback(() => {
		cursor.current += 1;
		if (cursor.current >= deck.current.length) {
			deck.current = cryptoShuffle([...ImageUrls]);
			cursor.current = 0;
		}
		setImgUrl(deck.current[cursor.current]);
		setImageKey((k) => k + 1);
	}, []);

	/** Measure the loaded image and update tile target size. */
	const handleImageLoad = useCallback((e) => {
		const { naturalWidth, naturalHeight } = e.target;
		const maxDim = Math.min(window.innerWidth - 80, MAX_IMG);
		const scale = Math.min(maxDim / naturalWidth, maxDim / naturalHeight, 1);
		setTileSize({
			width: Math.round(naturalWidth * scale),
			height: Math.round(naturalHeight * scale),
		});
	}, []);

	return (
		<div className="min-h-[calc(100svh-4rem)] flex flex-col items-center justify-center px-4 py-12 gap-6">
			{/* Fixed-height zone so the button never shifts when the image morphs */}
			<div className="flex items-center justify-center" style={{ height: MAX_IMG }}>
			<AnimatedSection className="flex justify-center">
				<motion.div
					animate={{
						width: tileSize.width,
						height: tileSize.height,
					}}
					transition={{
						type: 'spring',
						stiffness: 25,
						damping: 12,
						mass: 2,
					}}
					className="flex items-center justify-center overflow-hidden"
				>
					<AnimatePresence mode="wait">
						<motion.img
							ref={imgRef}
							key={imageKey}
							src={imgUrl}
							alt=""
							onLoad={handleImageLoad}
							onError={handleImageError}
							initial={{ clipPath: 'inset(49.5% 49.75% 49.5% 49.75%)' }}
							animate={{ clipPath: [
								'inset(49.5% 49.75% 49.5% 49.75%)',  // dot
								'inset(49.5% 49.75% 49.5% 49.75%)',  // hold dot
								'inset(49.5% 0% 49.5% 0%)',          // thin horizontal bar
								'inset(0% 0% 0% 0%)',                // full image
							] }}
							exit={{ clipPath: [
								'inset(0% 0% 0% 0%)',                // full image
								'inset(49.5% 0% 49.5% 0%)',          // thin horizontal bar
								'inset(49.5% 49.75% 49.5% 49.75%)',  // dot
								'inset(49.5% 49.75% 49.5% 49.75%)',  // hold dot
							] }}
							transition={{ duration: 0.585, times: [0, 0.18, 0.45, 1], ease: 'easeInOut' }}
							className="object-contain"
							style={{
								maxWidth: tileSize.width,
								maxHeight: tileSize.height,
							}}
						/>
					</AnimatePresence>
				</motion.div>
			</AnimatedSection>
			</div>

			{/* Wave button — progressive glow builds as deck depletes, EMP burst on explosion */}
			<div className="relative flex items-center justify-center">
				<motion.button
					onClick={handleNewImage}
					whileHover={{ scale: 1.02, y: -2 }}
					transition={{ type: 'spring', stiffness: 300, damping: 20 }}
					className="card card-inner-highlight ripple-container flex items-center justify-center cursor-pointer w-24 h-24 rounded-full"
					style={glowProgress > 0 ? {
						boxShadow: `0 0 ${8 + glowProgress * 30}px rgba(59, 130, 246, ${0.15 + glowProgress * 0.6}), 0 0 ${20 + glowProgress * 60}px rgba(59, 130, 246, ${0.05 + glowProgress * 0.35})`,
					} : undefined}
				>
					<span className="text-sm font-medium font-display text-neutral-200 relative z-10">Wave Back!</span>

					{/* Crack overlay — SVG paths drawn progressively, clipped to circle by ripple-container overflow:hidden */}
					{glowProgress > 0 && !prefersReducedMotion && (
						<svg
							viewBox="0 0 96 96"
							className="absolute inset-0 w-full h-full pointer-events-none"
							style={{
								filter: `drop-shadow(0 0 ${3 + glowProgress * 8}px rgba(59, 130, 246, ${0.4 + glowProgress * 0.6}))`,
							}}
						>
							{CRACKS.map((crack, i) => {
								const drawn = Math.min(1, Math.max(0, (glowProgress - crack.threshold) / CRACK_GROW_RANGE));
								if (drawn <= 0) return null;
								return (
									<motion.path
										key={i}
										d={crack.d}
										fill="none"
										stroke={`rgba(59, 130, 246, ${0.4 + glowProgress * 0.6})`}
										strokeWidth={1 + glowProgress * 1.2}
										strokeLinecap="round"
										strokeLinejoin="round"
										initial={{ pathLength: 0 }}
										animate={{ pathLength: drawn }}
										transition={{ duration: 0.4, ease: 'easeOut' }}
									/>
								);
							})}
						</svg>
					)}
				</motion.button>

				{/* EMP shockwave ring — expands outward on deck exhaustion */}
				<AnimatePresence>
					{empActive && !prefersReducedMotion && (
						<motion.div
							className="absolute rounded-full pointer-events-none"
							style={{
								width: '6rem',
								height: '6rem',
								boxShadow: '0 0 40px rgba(59, 130, 246, 0.9), 0 0 80px rgba(59, 130, 246, 0.5), 0 0 120px rgba(59, 130, 246, 0.3)',
								border: '2px solid rgba(59, 130, 246, 0.5)',
								background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
							}}
							initial={{ scale: 1, opacity: 0.9 }}
							animate={{ scale: 12, opacity: 0 }}
							transition={{ duration: 0.8, ease: 'easeOut' }}
							onAnimationComplete={() => setEmpActive(false)}
						/>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}

export default Home;
