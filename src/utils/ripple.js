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

	// Read CSS variable --color-ripple (falls back to --color-terminal and then hardcoded)
	function parseColorToRgb(s) {
		if (!s) return { r: 51, g: 255, b: 51 };
		s = s.trim();
		if (s.startsWith('rgb')) {
			const m = s.match(/rgba?\s*\(([^)]+)\)/i);
			if (m) {
				const parts = m[1].split(',').map(p => parseInt(p, 10));
				return { r: parts[0] || 0, g: parts[1] || 0, b: parts[2] || 0 };
			}
		}
		if (s.startsWith('#')) {
			let h = s.slice(1);
			if (h.length === 3) h = h.split('').map(c => c + c).join('');
			if (h.length === 6) {
				return {
					r: parseInt(h.slice(0, 2), 16),
					g: parseInt(h.slice(2, 4), 16),
					b: parseInt(h.slice(4, 6), 16),
				};
			}
		}
		// fallback
		return { r: 51, g: 255, b: 51 };
	}

	const cssColor = (
		getComputedStyle(document.documentElement).getPropertyValue('--color-ripple') ||
		getComputedStyle(document.documentElement).getPropertyValue('--color-terminal') ||
		'#33ff33'
	).trim();

	const baseRgb = parseColorToRgb(cssColor);
	const base = `${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}`;
	const highlightRgb = {
		r: Math.min(255, baseRgb.r + 70),
		g: Math.min(255, baseRgb.g + 70),
		b: Math.min(255, baseRgb.b + 70),
	};
	const highlight = `${highlightRgb.r}, ${highlightRgb.g}, ${highlightRgb.b}`;

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

			/* Outer ring — use configured ripple color */
			ctx.beginPath();
			ctx.arc(cx, cy, Math.max(0, radius), 0, Math.PI * 2);
			ctx.strokeStyle = `rgba(${base}, ${alpha * 0.15})`;
			ctx.lineWidth = thickness;
			ctx.stroke();

			/* Inner highlight — brighter, thinner, slightly smaller */
			ctx.beginPath();
			ctx.arc(cx, cy, Math.max(0, radius - thickness * 0.6), 0, Math.PI * 2);
			ctx.strokeStyle = `rgba(${highlight}, ${alpha * 0.2})`;
			ctx.lineWidth = Math.max(0.5, thickness * 0.4);
			ctx.stroke();

			/* Subtle radial glow behind the ring */
			if (alpha > 0.05) {
				const grad = ctx.createRadialGradient(
					cx, cy, Math.max(0, radius - thickness * 2),
					cx, cy, radius + thickness * 2,
				);
				grad.addColorStop(0, `rgba(${base}, 0)`);
				grad.addColorStop(0.5, `rgba(${base}, ${alpha * 0.04})`);
				grad.addColorStop(1, `rgba(${base}, 0)`);
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
