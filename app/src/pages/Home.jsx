import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageUrls from '../assets/ImageUrls';
import AnimatedSection from '../components/AnimatedSection';

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

/**
 * Spawns a green ripple at click position inside a target element.
 * @param {React.MouseEvent} e
 */
function spawnRipple(e) {
	const el = e.currentTarget;
	const rect = el.getBoundingClientRect();
	const size = Math.max(rect.width, rect.height);
	const ripple = document.createElement('span');
	ripple.className = 'ripple';
	ripple.style.width = ripple.style.height = `${size}px`;
	ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
	ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
	el.appendChild(ripple);
	ripple.addEventListener('animationend', () => ripple.remove());
}

/** Padding inside the gel tile (p-6 = 24px per side). */
const TILE_PAD = 48;
/** Max image dimension used in scaling — tile wrapper reserves this height so the button stays put. */
const MAX_IMG = 420;

function Home() {
	const deck = useRef(cryptoShuffle([...ImageUrls]));
	const cursor = useRef(0);

	const [imgUrl, setImgUrl] = useState(deck.current[0]);
	const [imageKey, setImageKey] = useState(0);
	const [tileSize, setTileSize] = useState({ width: 350, height: 350 });

	const handleNewImage = useCallback((e) => {
		spawnRipple(e);
		cursor.current += 1;
		if (cursor.current >= deck.current.length) {
			const last = deck.current[deck.current.length - 1];
			deck.current = cryptoShuffle([...ImageUrls]);
			// Avoid showing the same image across the reshuffle boundary
			if (deck.current[0] === last) {
				[deck.current[0], deck.current[1]] = [deck.current[1], deck.current[0]];
			}
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
			{/* Fixed-height zone so the button never shifts when the tile morphs */}
			<div className="flex items-center justify-center" style={{ height: MAX_IMG + TILE_PAD }}>
			<AnimatedSection className="flex justify-center">
				<motion.div
					animate={{
						width: tileSize.width + TILE_PAD,
						height: tileSize.height + TILE_PAD,
					}}
					transition={{
						type: 'spring',
						stiffness: 25,
						damping: 12,
						mass: 2,
					}}
					className="bg-surface-100 border border-surface-300 rounded-xl flex items-center justify-center overflow-hidden"
				>
					<AnimatePresence mode="wait">
						<motion.img
							key={imageKey}
							src={imgUrl}
							alt="Wave"
							onLoad={handleImageLoad}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.3 }}
							className="rounded-lg object-contain"
							style={{
								maxWidth: tileSize.width,
								maxHeight: tileSize.height,
							}}
						/>
					</AnimatePresence>
				</motion.div>
			</AnimatedSection>
			</div>

			{/* Wave button — outside tile, styled like About skill tiles */}
			<motion.button
				onClick={handleNewImage}
				whileHover={{ scale: 1.02, y: -2 }}
				transition={{ type: 'spring', stiffness: 300, damping: 20 }}
				className="card card-terminal-hover ripple-container flex items-center justify-center cursor-pointer px-12"
			>
				<span className="text-sm font-medium text-neutral-200">Wave Back!</span>
			</motion.button>
		</div>
	);
}

export default Home;
