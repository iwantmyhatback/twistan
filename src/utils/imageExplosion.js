/**
 * Spawns a canvas-based image explosion effect — shatters an <img> into a grid
 * of fragments that fly off-screen with physics (gravity, rotation, velocity).
 * Fragments bounce off viewport edges and visible DOM elements.
 * Self-cleans when all fragments leave the viewport.
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

		const centerX = imgRect.left + imgRect.width / 2;
		const centerY = imgRect.top + imgRect.height / 2;
		const viewW = window.innerWidth;
		const viewH = window.innerHeight;

		// Snapshot bounding rects of visible DOM elements to bounce off
		const obstacles = [];
		const candidateEls = document.querySelectorAll(
			'button, a, h1, h2, h3, h4, p, nav, footer, input, textarea, label, li',
		);
		for (const el of candidateEls) {
			if (el === overlay) continue;
			const r = el.getBoundingClientRect();
			// Only include elements with meaningful size that are in the viewport
			if (r.width < 10 || r.height < 10) continue;
			if (r.bottom < 0 || r.top > viewH || r.right < 0 || r.left > viewW) continue;
			obstacles.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
		}

		/**
		 * Splits `total` into `count` segments with randomised sizes.
		 * Each segment is between 40%–180% of the average, then normalised.
		 *
		 * @param {number} total
		 * @param {number} count
		 * @returns {number[]}
		 */
		function randomPartition(total, count) {
			const avg = total / count;
			const sizes = Array.from({ length: count }, () =>
				avg * (0.4 + Math.random() * 1.4),
			);
			const sum = sizes.reduce((a, b) => a + b, 0);
			return sizes.map(s => (s / sum) * total);
		}

		/**
		 * Generates a jagged polygon clip for one fragment.
		 * Corners are jittered; each edge gets 1–2 displaced midpoints.
		 *
		 * @param {number} hw - half-width
		 * @param {number} hh - half-height
		 * @returns {Array<[number,number]>}
		 */
		function makeClipPoly(hw, hh) {
			const cornerJitter = Math.min(hw, hh) * 0.45;
			const edgeJitter   = Math.min(hw, hh) * 0.7;

			function jitterCorner(cx, cy) {
				const diag = Math.hypot(cx, cy) || 1;
				const t = (Math.random() - 0.5) * 2 * cornerJitter;
				return [cx + (cx / diag) * t, cy + (cy / diag) * t];
			}

			const corners = [
				jitterCorner(-hw, -hh),
				jitterCorner( hw, -hh),
				jitterCorner( hw,  hh),
				jitterCorner(-hw,  hh),
			];

			const poly = [];
			for (let i = 0; i < corners.length; i++) {
				poly.push(corners[i]);
				const [x1, y1] = corners[i];
				const [x2, y2] = corners[(i + 1) % corners.length];
				const edgeLen = Math.hypot(x2 - x1, y2 - y1) || 1;
				const px = -(y2 - y1) / edgeLen;
				const py =  (x2 - x1) / edgeLen;
				const subdivisions = Math.random() < 0.5 ? 1 : 2;
				for (let s = 1; s <= subdivisions; s++) {
					const frac = s / (subdivisions + 1);
					const mx = x1 + (x2 - x1) * frac;
					const my = y1 + (y2 - y1) * frac;
					const offset = (Math.random() - 0.5) * 2 * edgeJitter;
					poly.push([mx + px * offset, my + py * offset]);
				}
			}
			return poly;
		}

		// Non-uniform grid: each column/row has a randomly sized extent
		const COLS = 18;
		const ROWS = 18;
		const colWidths  = randomPartition(imgRect.width,  COLS);
		const rowHeights = randomPartition(imgRect.height, ROWS);

		const colX = [0];
		for (const w of colWidths)  colX.push(colX[colX.length - 1] + w);
		const rowY = [0];
		for (const h of rowHeights) rowY.push(rowY[rowY.length - 1] + h);

		const fragments = [];

		for (let row = 0; row < ROWS; row++) {
			for (let col = 0; col < COLS; col++) {
				const sx = colX[col];
				const sy = rowY[row];
				const fw = colWidths[col];
				const fh = rowHeights[row];

				const fragCanvas = document.createElement('canvas');
				fragCanvas.width  = Math.ceil(fw * dpr);
				fragCanvas.height = Math.ceil(fh * dpr);
				const fc = fragCanvas.getContext('2d');
				fc.drawImage(
					srcCanvas,
					sx * dpr, sy * dpr, fw * dpr, fh * dpr,
					0, 0, fragCanvas.width, fragCanvas.height,
				);

				const worldX = imgRect.left + sx + fw / 2;
				const worldY = imgRect.top  + sy + fh / 2;

				const dx = worldX - centerX;
				const dy = worldY - centerY;
				const dist = Math.hypot(dx, dy) || 1;
				const nx = dx / dist;
				const ny = dy / dist;

				const upward = Math.random() < 0.7;
				const speed = 300 + Math.random() * 600;
				let vx, vy;
				if (upward) {
					const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.7;
					vx = Math.cos(angle) * speed + nx * 120;
					vy = Math.sin(angle) * speed;
				} else {
					vx = nx * speed;
					vy = ny * speed - 100;
				}

				fragments.push({
					x: worldX - fw / 2,
					y: worldY - fh / 2,
					fw,
					fh,
					vx,
					vy,
					rotation: 0,
					rotVel: (Math.random() - 0.5) * 1080,
					imgCanvas: fragCanvas,
					clipPoly: makeClipPoly(fw / 2, fh / 2),
					offScreen: false,
				});
			}
		}

		const GRAVITY       = 1400; // px/s²
		const BOUNCE_DAMPING = 0.55; // velocity retained on bounce
		const MAX_DURATION  = 6;    // hard-stop safety valve (seconds)
		const start = performance.now();
		let lastTime = start;

		/**
		 * Resolves AABB collision between a fragment and all obstacle rects.
		 * Pushes the fragment out on the minimum-penetration axis, reflects and
		 * amplifies the velocity (no damping), and adds a random horizontal kick
		 * to prevent fragments getting stuck or bouncing straight up/down.
		 *
		 * @param {object} frag
		 */
		function resolveObstacles(frag) {
			const { fw, fh } = frag;
			for (const obs of obstacles) {
				const fl = frag.x;
				const ft = frag.y;
				const fr = frag.x + fw;
				const fb = frag.y + fh;

				if (fr <= obs.left || fl >= obs.right || fb <= obs.top || ft >= obs.bottom) continue;

				// Penetration on each axis
				const dLeft  = fr - obs.left;
				const dRight = obs.right - fl;
				const dTop   = fb - obs.top;
				const dBot   = obs.bottom - ft;
				const minD   = Math.min(dLeft, dRight, dTop, dBot);

				// Random lateral kick to prevent sticking / pure vertical bounces
				const kick = (Math.random() - 0.5) * 800;

				if (minD === dLeft) {
					frag.x -= dLeft;
					frag.vx = -Math.abs(frag.vx) * BOUNCE_DAMPING;
					frag.vy += kick;
				} else if (minD === dRight) {
					frag.x += dRight;
					frag.vx =  Math.abs(frag.vx) * BOUNCE_DAMPING;
					frag.vy += kick;
				} else if (minD === dTop) {
					frag.y -= dTop;
					frag.vy = -Math.abs(frag.vy) * BOUNCE_DAMPING;
					frag.vx += kick;
				} else {
					frag.y += dBot;
					frag.vy =  Math.abs(frag.vy) * BOUNCE_DAMPING;
					frag.vx += kick;
				}
			}
		}

		function frame(now) {
			const dt      = Math.min((now - lastTime) / 1000, 0.05); // cap dt to avoid tunnelling
			lastTime = now;
			const elapsed = (now - start) / 1000;

			ctx.clearRect(0, 0, viewW, viewH);

			let anyVisible = false;

			for (const frag of fragments) {
				const { fw, fh } = frag;

				frag.vy       += GRAVITY * dt;
				frag.x        += frag.vx * dt;
				frag.y        += frag.vy * dt;
				frag.rotation += frag.rotVel * dt;

				// Bounce off left/right viewport edges
				if (frag.x < 0) {
					frag.x = 0;
					frag.vx = Math.abs(frag.vx) * BOUNCE_DAMPING;
				} else if (frag.x + fw > viewW) {
					frag.x = viewW - fw;
					frag.vx = -Math.abs(frag.vx) * BOUNCE_DAMPING;
				}

				// Bounce off DOM elements
				resolveObstacles(frag);

				// Skip rendering once fully off-screen (below viewport is enough — top/sides bounce)
				if (frag.y > viewH) {
					frag.offScreen = true;
					continue;
				}

				anyVisible = true;

				ctx.save();
				ctx.globalAlpha = 1;
				ctx.translate(frag.x + fw / 2, frag.y + fh / 2);
				ctx.rotate((frag.rotation * Math.PI) / 180);

				ctx.beginPath();
				ctx.moveTo(frag.clipPoly[0][0], frag.clipPoly[0][1]);
				for (let i = 1; i < frag.clipPoly.length; i++) {
					ctx.lineTo(frag.clipPoly[i][0], frag.clipPoly[i][1]);
				}
				ctx.closePath();
				ctx.clip();

				ctx.drawImage(
					frag.imgCanvas,
					0, 0, frag.imgCanvas.width, frag.imgCanvas.height,
					-fw / 2, -fh / 2, fw, fh,
				);
				ctx.restore();
			}

			// Stop when all fragments are gone or safety timer expires
			if (anyVisible && elapsed < MAX_DURATION) {
				requestAnimationFrame(frame);
			} else {
				overlay.remove();
				resolve();
			}
		}

		requestAnimationFrame(frame);
	});
}
