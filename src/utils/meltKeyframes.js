/**
 * Preserved melt keyframe generators — ALL UNUSED.
 *
 * Prior melt implementations kept for potential reuse. Import whichever you
 * want in ExplodingText.jsx (or any component) and pass the returned
 * keyframes to a Framer Motion `animate` prop.
 *
 * Common signature (v1 & v2 & v3 share this):
 *   @param {DOMRect} charRect      - Bounding rect of the character span
 *   @param {DOMRect} containerRect - Bounding rect of the parent container
 *   @param {number}  charIndex     - Index of the character in the string
 *   @param {number}  totalChars    - Total number of characters
 *   @param {number}  [explosionForce=1] - Intensity multiplier
 *   @returns {{ keyframes, startX, startY, staggerDelay, width, height }}
 */

// ---------------------------------------------------------------------------
// 1. Stretch Melt (v1)
//
// UNUSED — preserved for reuse. Produces a uniform scaleY stretch + skewX
// wobble. Looks like taffy-pull. Duration: 2s. Single element per character.
// ---------------------------------------------------------------------------
export function computeStretchMeltKeyframes(
	charRect,
	containerRect,
	charIndex,
	totalChars,
	explosionForce = 1
) {
	const steps = 40;

	const startX = charRect.left - containerRect.left;
	const startY = charRect.top - containerRect.top;

	const positionRatio = charIndex / Math.max(totalChars - 1, 1);
	const staggerDelay = positionRatio * 0.3 + Math.random() * 0.15;

	const dripSpeed = (200 + Math.random() * 300) * explosionForce;
	const wobbleAmount = (3 + Math.random() * 8) * explosionForce;
	const wobbleFreq = 2 + Math.random() * 3;
	const maxScaleY = 1.8 + Math.random() * 1.2;
	const skewAmount = (Math.random() - 0.5) * 25;

	const keyframes = { x: [], y: [], scaleY: [], scaleX: [], skewX: [], opacity: [] };
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const dripT = t * t * t;
		const wobble = Math.sin(t * Math.PI * wobbleFreq) * wobbleAmount * t;

		keyframes.x.push(startX + wobble);
		keyframes.y.push(startY + dripSpeed * dripT);

		const stretch = 1 + (maxScaleY - 1) * Math.min(t * 2, 1);
		keyframes.scaleY.push(stretch);
		keyframes.scaleX.push(1 - t * 0.4);
		keyframes.skewX.push(skewAmount * t);
		keyframes.opacity.push(t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4);
	}

	return { keyframes, startX, startY, staggerDelay, width: charRect.width, height: charRect.height };
}

// ---------------------------------------------------------------------------
// 2. Dali Melt (v2)
//
// UNUSED — preserved for reuse. Three-phase surreal melt with SVG
// feTurbulence displacement filters for organic warping. Pair with SVG
// filter JSX (see comment block at bottom of file). Duration: 2.5s.
// Single element per character, `rotate` instead of `skewX`.
// ---------------------------------------------------------------------------
export function computeDaliMeltKeyframes(
	charRect,
	containerRect,
	charIndex,
	totalChars,
	explosionForce = 1
) {
	const steps = 50;

	const startX = charRect.left - containerRect.left;
	const startY = charRect.top - containerRect.top;

	const centerDist = Math.abs(charIndex - (totalChars - 1) / 2) / Math.max(totalChars - 1, 1);
	const staggerDelay = centerDist * 0.25 + Math.random() * 0.2;

	const maxScaleY = (4 + Math.random() * 2) * explosionForce;
	const dripDistance = (350 + Math.random() * 250) * explosionForce;
	const leanAngle = (Math.random() - 0.5) * 6;
	const wobbleAmp = (1 + Math.random() * 2) * explosionForce;

	const keyframes = { x: [], y: [], scaleY: [], scaleX: [], rotate: [], opacity: [] };

	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		let yOffset, sy, sx, rot, op, xWobble;

		if (t <= 0.08) {
			const ht = t / 0.08;
			xWobble = Math.sin(ht * Math.PI * 6) * wobbleAmp * 0.3;
			yOffset = ht * 4;
			sy = 1 + ht * 0.08;
			sx = 1;
			rot = Math.sin(ht * Math.PI * 4) * 0.5;
			op = 1;
		} else if (t <= 0.50) {
			const st = (t - 0.08) / 0.42;
			const viscous = st * st * (3 - 2 * st);
			xWobble = Math.sin(st * Math.PI * 2) * wobbleAmp;
			yOffset = 4 + viscous * dripDistance * 0.35;
			sy = 1.08 + viscous * (2.8 - 1.08);
			sx = 1 - viscous * 0.15;
			rot = leanAngle * viscous;
			op = 1;
		} else {
			const dt = (t - 0.50) / 0.50;
			const accel = dt * dt;
			xWobble = Math.sin(dt * Math.PI) * wobbleAmp * 0.5;
			yOffset = 4 + dripDistance * 0.35 + accel * dripDistance * 0.65;
			sy = 2.8 + accel * (maxScaleY - 2.8);
			sx = 0.85 - accel * 0.35;
			rot = leanAngle;
			op = dt < 0.7 ? 1 : 1 - (dt - 0.7) / 0.3;
		}

		keyframes.x.push(startX + xWobble);
		keyframes.y.push(startY + yOffset);
		keyframes.scaleY.push(sy);
		keyframes.scaleX.push(sx);
		keyframes.rotate.push(rot);
		keyframes.opacity.push(Math.max(0, op));
	}

	return { keyframes, startX, startY, staggerDelay, width: charRect.width, height: charRect.height };
}

// ---------------------------------------------------------------------------
// 3. Lava Melt (v3)
//
// UNUSED — preserved for reuse. Four-phase heat→soften→deform→drip with
// progressive CSS blur dissolution. Single element per character. Duration: 3s.
// Keyframes include a `blur` array — render as filter: `blur(Npx)` strings.
// ---------------------------------------------------------------------------
export function computeLavaMeltKeyframes(
	charRect,
	containerRect,
	charIndex,
	totalChars,
	explosionForce = 1
) {
	const steps = 60;

	const startX = charRect.left - containerRect.left;
	const startY = charRect.top - containerRect.top;

	const posRatio = charIndex / Math.max(totalChars - 1, 1);
	const staggerDelay = posRatio * 0.4 + Math.random() * 0.15;

	const dripDistance = (200 + Math.random() * 150) * explosionForce;
	const tiltAngle = (Math.random() - 0.5) * 8;
	const shiverAmp = 0.5 + Math.random() * 0.8;
	const maxBlur = 3 + Math.random() * 2;

	const keyframes = {
		x: [], y: [], scaleY: [], scaleX: [], rotate: [], opacity: [], blur: [],
	};

	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		let yOff, sy, sx, rot, op, xOff, blur;

		if (t <= 0.12) {
			const ht = t / 0.12;
			xOff = Math.sin(ht * Math.PI * 8) * shiverAmp;
			yOff = 0;
			sy = 1; sx = 1;
			rot = Math.sin(ht * Math.PI * 6) * 0.3;
			op = 1; blur = 0;
		} else if (t <= 0.35) {
			const st = (t - 0.12) / 0.23;
			const ease = st * st;
			xOff = Math.sin(st * Math.PI * 3) * shiverAmp * (1 - st * 0.5);
			yOff = ease * 15 * explosionForce;
			sy = 1 + ease * 0.15;
			sx = 1 + ease * 0.08;
			rot = tiltAngle * ease * 0.3;
			op = 1; blur = ease * 0.5;
		} else if (t <= 0.65) {
			const dt = (t - 0.35) / 0.3;
			const viscous = dt * dt * (3 - 2 * dt);
			xOff = Math.sin(dt * Math.PI) * shiverAmp * 0.3;
			yOff = 15 * explosionForce + viscous * dripDistance * 0.4;
			sy = 1.15 + viscous * 0.6;
			sx = 1.08 - viscous * 0.15;
			rot = tiltAngle * (0.3 + viscous * 0.7);
			op = 1; blur = 0.5 + viscous * 1.5;
		} else {
			const ft = (t - 0.65) / 0.35;
			const gravity = ft * ft;
			xOff = 0;
			yOff = 15 * explosionForce + dripDistance * 0.4 + gravity * dripDistance * 0.6;
			sy = 1.75 + gravity * 1.2;
			sx = 0.93 - gravity * 0.35;
			rot = tiltAngle;
			op = ft < 0.6 ? 1 : 1 - (ft - 0.6) / 0.4;
			blur = 2 + gravity * maxBlur;
		}

		keyframes.x.push(startX + xOff);
		keyframes.y.push(startY + yOff);
		keyframes.scaleY.push(sy);
		keyframes.scaleX.push(sx);
		keyframes.rotate.push(rot);
		keyframes.opacity.push(Math.max(0, op));
		keyframes.blur.push(blur);
	}

	return { keyframes, startX, startY, staggerDelay, width: charRect.width, height: charRect.height };
}

// ---------------------------------------------------------------------------
// SVG filter recipe for Dali melt (v2)
//
// Paste into your component render when using computeDaliMeltKeyframes:
//
//   <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
//     <defs>
//       {characters.map((_, i) => (
//         <filter key={i} id={`dali-melt-${i}`} x="-50%" y="-50%" width="200%" height="200%">
//           <feTurbulence type="fractalNoise" baseFrequency="0.03 0.06"
//             numOctaves="3" seed={seeds[i]} result="noise" />
//           <feDisplacementMap in="SourceGraphic" in2="noise" scale="0"
//             xChannelSelector="R" yChannelSelector="G">
//             <animate attributeName="scale" from="0" to={25 + (i % 3) * 5}
//               dur="2.5s" fill="freeze" />
//           </feDisplacementMap>
//         </filter>
//       ))}
//     </defs>
//   </svg>
//
// Apply via style={{ filter: `url(#dali-melt-${i})` }} on each motion.span.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 4. Wax Drip Melt (v4)
//
// UNUSED — preserved for reuse. Multi-fragment decomposition: each character
// dissolves while spawning 3-6 pear-shaped wax drops that stretch and fall
// with gravity. Different return shape from v1-v3 — returns { charDissolve,
// fragments[], startX, startY, charW, charH } instead of a flat keyframes
// object. Duration: ~3.5s total.
//
// Render pattern: for each character, render one motion.span (dissolving letter)
// plus N motion.div fragments (drops with borderRadius: '40% 40% 50% 50%',
// background: 'currentColor', transformOrigin: 'top center').
// ---------------------------------------------------------------------------

/**
 * Generate candle-wax drip data for a character.
 *
 * @param {DOMRect} charRect
 * @param {DOMRect} containerRect
 * @param {number}  charIndex
 * @param {number}  totalChars
 * @param {number}  [explosionForce=1]
 * @returns {{ charDissolve, fragments: Array, startX, startY, charW, charH }}
 */
export function computeWaxMeltData(
	charRect,
	containerRect,
	charIndex,
	totalChars,
	explosionForce = 1
) {
	const startX = charRect.left - containerRect.left;
	const startY = charRect.top - containerRect.top;
	const charW = charRect.width;
	const charH = charRect.height;

	const posRatio = charIndex / Math.max(totalChars - 1, 1);
	const charDelay = posRatio * 0.3 + Math.random() * 0.12;

	const charDissolve = {
		startX,
		startY,
		endY: startY + charH * 0.3,
		delay: charDelay,
	};

	const numFragments = 3 + Math.floor(Math.random() * 4);
	const fragments = [];

	for (let f = 0; f < numFragments; f++) {
		const spawnX = startX + Math.random() * charW;
		const spawnY = startY + Math.random() * charH * 0.6 + charH * 0.3;

		const dropHeight = charH * (0.15 + Math.random() * 0.25);
		const dropWidth = dropHeight * (0.3 + Math.random() * 0.3);

		const fallDistance = (150 + Math.random() * 250) * explosionForce;
		const fallSpeed = 0.7 + Math.random() * 0.6;
		const drift = (Math.random() - 0.5) * 20 * explosionForce;

		const fragDelay = charDelay + 0.15 + f * 0.08 + Math.random() * 0.06;

		const steps = 40;
		const keyframes = { x: [], y: [], scaleY: [], scaleX: [], opacity: [] };

		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			const gravity = Math.pow(t, 1.5 + fallSpeed * 0.5);
			const xOff = drift * Math.sin(t * Math.PI * 0.8) * t;
			const stretchY = 1 + t * 2.5;
			const stretchX = 1 - t * 0.4;
			const op = t < 0.65 ? 1 : 1 - (t - 0.65) / 0.35;

			keyframes.x.push(spawnX + xOff);
			keyframes.y.push(spawnY + gravity * fallDistance);
			keyframes.scaleY.push(stretchY);
			keyframes.scaleX.push(stretchX);
			keyframes.opacity.push(Math.max(0, op));
		}

		fragments.push({ keyframes, delay: fragDelay, width: dropWidth, height: dropHeight });
	}

	return { charDissolve, fragments, startX, startY, charW, charH };
}
