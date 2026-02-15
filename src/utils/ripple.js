/**
 * Spawns a realistic water-ripple effect at click position using canvas.
 * Renders concentric rings with fade, thickness variation, and highlight
 * to simulate a 3D liquid surface disturbance.
 * Requires .ripple-container parent (position: relative; overflow: hidden).
 * @param {React.MouseEvent} e
 */
export function spawnRipple(e) {
	const el = e.currentTarget;
	const rect = el.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;
	const maxRadius = Math.hypot(
		Math.max(x, rect.width - x),
		Math.max(y, rect.height - y),
	);

	const canvas = document.createElement('canvas');
	const dpr = window.devicePixelRatio || 1;
	canvas.width = rect.width * dpr;
	canvas.height = rect.height * dpr;
	canvas.className = 'ripple';
	canvas.style.cssText =
		`position:absolute;top:0;left:0;width:${rect.width}px;height:${rect.height}px;` +
		'pointer-events:none;border-radius:inherit;';
	el.appendChild(canvas);

	const ctx = canvas.getContext('2d');
	if (!ctx) {
		canvas.remove();
		return;
	}
	ctx.scale(dpr, dpr);

	const cx = x;
	const cy = y;
	const DURATION = 2000;
	const RING_COUNT = 5;
	const RING_SPACING = 44;
	const start = performance.now();

	function frame(now) {
		const elapsed = now - start;
		const t = Math.min(elapsed / DURATION, 1);

		ctx.clearRect(0, 0, rect.width, rect.height);

		for (let i = 0; i < RING_COUNT; i++) {
			const ringDelay = i * 0.12;
			const rt = Math.max(0, Math.min((t - ringDelay) / (1 - ringDelay), 1));
			if (rt <= 0) continue;

			const radius = rt * maxRadius + i * RING_SPACING;
			/* Ease-out cubic for smooth deceleration */
			const eased = 1 - Math.pow(1 - rt, 3);

			/* Fade: peak mid-animation, decay toward end */
			const fadeIn = Math.min(rt * 4, 1);
			const fadeOut = 1 - Math.pow(rt, 2);
			const alpha = fadeIn * fadeOut;

			/* Ring thickness: thick at birth, thins as it expands */
			const thickness = Math.max(1, (1 - eased) * 6 + 1.5);

			/* Outer ring — terminal green */
			ctx.beginPath();
			ctx.arc(cx, cy, Math.max(0, radius), 0, Math.PI * 2);
			ctx.strokeStyle = `rgba(51, 255, 51, ${alpha * 0.35})`;
			ctx.lineWidth = thickness;
			ctx.stroke();

			/* Inner highlight — brighter, thinner, slightly smaller */
			ctx.beginPath();
			ctx.arc(cx, cy, Math.max(0, radius - thickness * 0.6), 0, Math.PI * 2);
			ctx.strokeStyle = `rgba(120, 255, 120, ${alpha * 0.5})`;
			ctx.lineWidth = Math.max(0.5, thickness * 0.4);
			ctx.stroke();

			/* Subtle radial glow behind the ring */
			if (alpha > 0.05) {
				const grad = ctx.createRadialGradient(
					cx, cy, Math.max(0, radius - thickness * 2),
					cx, cy, radius + thickness * 2,
				);
				grad.addColorStop(0, `rgba(51, 255, 51, 0)`);
				grad.addColorStop(0.5, `rgba(51, 255, 51, ${alpha * 0.08})`);
				grad.addColorStop(1, `rgba(51, 255, 51, 0)`);
				ctx.beginPath();
				ctx.arc(cx, cy, radius + thickness * 2, 0, Math.PI * 2);
				ctx.fillStyle = grad;
				ctx.fill();
			}
		}

		if (t < 1) {
			requestAnimationFrame(frame);
		} else {
			canvas.remove();
		}
	}

	requestAnimationFrame(frame);
}
