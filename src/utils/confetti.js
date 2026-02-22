/**
 * Canvas-based confetti drop.
 * Spawns a full-viewport canvas and continuously injects new particle waves
 * for `spawnDuration` ms, then lets the last wave fall off screen before cleanup.
 *
 * @param {{ batchSize?: number, spawnDuration?: number, spawnInterval?: number }} [opts]
 *   batchSize     - particles added per wave (default 25)
 *   spawnDuration - how long new waves keep being added in ms (default 4000)
 *   spawnInterval - ms between each wave (default 200)
 */
export function spawnConfetti({ batchSize = 25, spawnDuration = 4000, spawnInterval = 200 } = {}) {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	const canvas = document.createElement('canvas');
	canvas.style.cssText =
		'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	document.body.appendChild(canvas);

	const ctx = canvas.getContext('2d');

	const COLORS = [
		'#33ff33', // terminal green
		'#3b82f6', // accent blue
		'#f59e0b', // amber
		'#ec4899', // pink
		'#a855f7', // purple
		'#ffffff', // white
	];

	/** @type {Array<{x,y,vx,vy,rot,rotV,w,h,color,shape}>} */
	const particles = [];

	function makeParticle() {
		return {
			x: Math.random() * canvas.width,
			y: -10 - Math.random() * 20,
			vx: (Math.random() - 0.5) * 3,
			vy: 1.5 + Math.random() * 2,
			rot: Math.random() * Math.PI * 2,
			rotV: (Math.random() - 0.5) * 0.2,
			w: 6 + Math.random() * 6,
			h: 8 + Math.random() * 6,
			color: COLORS[Math.floor(Math.random() * COLORS.length)],
			shape: Math.random() < 0.4 ? 'circle' : 'rect',
		};
	}

	// Seed the first wave immediately so there's no blank frame on click
	for (let i = 0; i < batchSize; i++) particles.push(makeParticle());

	// Keep injecting waves until spawnDuration elapses
	const spawnEnd = Date.now() + spawnDuration;
	const spawnTimer = setInterval(() => {
		if (Date.now() >= spawnEnd) {
			clearInterval(spawnTimer);
			return;
		}
		for (let i = 0; i < batchSize; i++) particles.push(makeParticle());
	}, spawnInterval);

	let rafId;

	function draw() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		let alive = false;
		for (const p of particles) {
			p.x += p.vx;
			p.y += p.vy;
			p.vy += 0.06; // gravity
			p.rot += p.rotV;

			if (p.y < canvas.height + 20) alive = true;

			ctx.save();
			ctx.translate(p.x, p.y);
			ctx.rotate(p.rot);
			ctx.fillStyle = p.color;
			ctx.globalAlpha = Math.max(0, 1 - p.y / (canvas.height * 1.1));

			if (p.shape === 'circle') {
				ctx.beginPath();
				ctx.ellipse(0, 0, p.w / 2, p.h / 3, 0, 0, Math.PI * 2);
				ctx.fill();
			} else {
				ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
			}
			ctx.restore();
		}

		// Keep animating while spawning or while particles are still on screen
		if (alive || Date.now() < spawnEnd) {
			rafId = requestAnimationFrame(draw);
		} else {
			canvas.remove();
		}
	}

	rafId = requestAnimationFrame(draw);

	// Safety cleanup: spawnDuration + enough time for last wave to fall off screen
	const falloffMs = (canvas.height / 2) * (1000 / 60);
	setTimeout(() => {
		clearInterval(spawnTimer);
		cancelAnimationFrame(rafId);
		canvas.remove();
	}, spawnDuration + falloffMs);
}
