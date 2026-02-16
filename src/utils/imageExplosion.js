/**
 * Spawns a canvas-based image explosion effect — shatters an <img> into a grid
 * of fragments that fly off-screen with physics (gravity, rotation, velocity).
 * Self-cleans when animation completes.
 *
 * @param {HTMLImageElement} imgElement - The image element to explode
 * @returns {Promise<void>} Resolves when the animation finishes (or immediately if reduced motion)
 */
export function spawnImageExplosion(imgElement) {
	// Skip for reduced motion preference
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return Promise.resolve();
	}

	if (!imgElement || !imgElement.complete) {
		return Promise.resolve();
	}

	return new Promise((resolve) => {
		const imgRect = imgElement.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;

		// Capture the image onto an offscreen canvas
		const srcCanvas = document.createElement('canvas');
		srcCanvas.width = imgRect.width * dpr;
		srcCanvas.height = imgRect.height * dpr;
		const srcCtx = srcCanvas.getContext('2d');
		if (!srcCtx) { resolve(); return; }
		srcCtx.scale(dpr, dpr);
		srcCtx.drawImage(imgElement, 0, 0, imgRect.width, imgRect.height);

		// Create visible overlay canvas positioned over the image
		const overlay = document.createElement('canvas');
		overlay.width = window.innerWidth * dpr;
		overlay.height = window.innerHeight * dpr;
		overlay.style.cssText =
			`position:fixed;top:0;left:0;width:${window.innerWidth}px;height:${window.innerHeight}px;` +
			'pointer-events:none;z-index:9999;';
		document.body.appendChild(overlay);

		const ctx = overlay.getContext('2d');
		if (!ctx) { overlay.remove(); resolve(); return; }
		ctx.scale(dpr, dpr);

		// Fragment grid dimensions
		const COLS = 12;
		const ROWS = 12;
		const fragW = imgRect.width / COLS;
		const fragH = imgRect.height / ROWS;
		const centerX = imgRect.left + imgRect.width / 2;
		const centerY = imgRect.top + imgRect.height / 2;

		// Pre-extract fragment image data from source canvas
		const fragImages = [];
		const fragSrcCanvas = document.createElement('canvas');
		const fragSrcCtx = fragSrcCanvas.getContext('2d');
		fragSrcCanvas.width = Math.ceil(fragW * dpr);
		fragSrcCanvas.height = Math.ceil(fragH * dpr);

		// Build fragment list with physics properties
		const fragments = [];
		for (let row = 0; row < ROWS; row++) {
			for (let col = 0; col < COLS; col++) {
				const sx = col * fragW;
				const sy = row * fragH;

				// Extract this fragment's pixels
				fragSrcCtx.clearRect(0, 0, fragSrcCanvas.width, fragSrcCanvas.height);
				fragSrcCtx.drawImage(
					srcCanvas,
					sx * dpr, sy * dpr, fragW * dpr, fragH * dpr,
					0, 0, fragSrcCanvas.width, fragSrcCanvas.height,
				);

				// Cache as ImageBitmap if available, otherwise as a canvas copy
				const fragCanvas = document.createElement('canvas');
				fragCanvas.width = fragSrcCanvas.width;
				fragCanvas.height = fragSrcCanvas.height;
				const fc = fragCanvas.getContext('2d');
				fc.drawImage(fragSrcCanvas, 0, 0);
				fragImages.push(fragCanvas);

				// Screen position of this fragment's center
				const worldX = imgRect.left + sx + fragW / 2;
				const worldY = imgRect.top + sy + fragH / 2;

				// Direction from image center — fragments near edges fly outward
				const dx = worldX - centerX;
				const dy = worldY - centerY;
				const dist = Math.hypot(dx, dy) || 1;
				const nx = dx / dist;
				const ny = dy / dist;

				// 70% upward bias, 30% pure outward
				const upward = Math.random() < 0.7;
				const speed = 300 + Math.random() * 600;
				let vx, vy;
				if (upward) {
					const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.7;
					vx = Math.cos(angle) * speed + nx * 120;
					vy = Math.sin(angle) * speed;
				} else {
					vx = nx * speed;
					vy = ny * speed - 100; // slight upward nudge
				}

				fragments.push({
					// Screen position (top-left of fragment)
					x: worldX - fragW / 2,
					y: worldY - fragH / 2,
					vx,
					vy,
					rotation: 0,
					rotVel: (Math.random() - 0.5) * 1080, // deg/s, ±540
					opacity: 1,
					imgIdx: row * COLS + col,
				});
			}
		}

		const DURATION = 1.8; // seconds
		const GRAVITY = 1400; // px/s²
		const BOUNCE_DAMPING = 0.6; // velocity retained on wall bounce
		const viewW = window.innerWidth;
		const start = performance.now();
		let lastTime = start;

		function frame(now) {
			const dt = (now - lastTime) / 1000;
			lastTime = now;
			const elapsed = (now - start) / 1000;
			const t = Math.min(elapsed / DURATION, 1);

			ctx.clearRect(0, 0, viewW, window.innerHeight);

			for (const frag of fragments) {
				// Integrate velocity → position with gravity
				frag.vy += GRAVITY * dt;
				frag.x += frag.vx * dt;
				frag.y += frag.vy * dt;
				frag.rotation += frag.rotVel * dt;

				// Bounce off left/right viewport edges
				if (frag.x < 0) {
					frag.x = 0;
					frag.vx = Math.abs(frag.vx) * BOUNCE_DAMPING;
				} else if (frag.x + fragW > viewW) {
					frag.x = viewW - fragW;
					frag.vx = -Math.abs(frag.vx) * BOUNCE_DAMPING;
				}

				// Opacity: hold full for first 40%, then fade to 0
				const opacity = t < 0.4 ? 1 : Math.max(0, 1 - (t - 0.4) / 0.6);
				if (opacity <= 0) continue;

				ctx.save();
				ctx.globalAlpha = opacity;
				ctx.translate(frag.x + fragW / 2, frag.y + fragH / 2);
				ctx.rotate((frag.rotation * Math.PI) / 180);
				ctx.drawImage(
					fragImages[frag.imgIdx],
					0, 0, fragImages[frag.imgIdx].width, fragImages[frag.imgIdx].height,
					-fragW / 2, -fragH / 2, fragW, fragH,
				);
				ctx.restore();
			}

			if (t < 1) {
				requestAnimationFrame(frame);
			} else {
				overlay.remove();
				resolve();
			}
		}

		requestAnimationFrame(frame);
	});
}
