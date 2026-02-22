import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ImageUrls from '../assets/ImageUrls';
import AnimatedSection from '../components/AnimatedSection';
import { spawnRipple } from '../utils/ripple';
import { spawnImageExplosion } from '../utils/imageExplosion';

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

/** Padding inside the gel tile (p-6 = 24px per side). */
const TILE_PAD = 48;
/** Max image dimension used in scaling — tile wrapper reserves this height so the button stays put. */
const MAX_IMG = 420;

/** Always-first image shown on initial page load. */
const FIRST_IMAGE = 'https://c.tenor.com/Qy5sUxL5phgAAAAC/tenor.gif';

/**
 * Home page — displays a shuffled carousel of wave GIFs inside an animated tile.
 * The first image is pinned; subsequent clicks cycle through a cryptographically shuffled deck.
 */
function Home() {
	const deck = useRef((() => {
		const rest = ImageUrls.filter((u) => u !== FIRST_IMAGE);
		return [FIRST_IMAGE, ...cryptoShuffle(rest)];
	})());
	const cursor = useRef(0);

	const [imgUrl, setImgUrl] = useState(deck.current[0]);
	const [imageKey, setImageKey] = useState(0);
	const [tileSize, setTileSize] = useState({ width: 350, height: 350 });
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
							ref={imgRef}
							key={imageKey}
							src={imgUrl}
							alt="Wave"
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
				className="card card-inner-highlight ripple-container flex items-center justify-center cursor-pointer w-24 h-24 rounded-full"
			>
				<span className="text-sm font-medium font-display text-neutral-200">Wave Back!</span>
			</motion.button>
		</div>
	);
}

export default Home;
