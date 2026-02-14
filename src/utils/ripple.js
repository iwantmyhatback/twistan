/**
 * Spawns a green ripple at click position inside a target element.
 * Requires .ripple-container parent and .ripple CSS from index.css.
 * @param {React.MouseEvent} e
 */
export function spawnRipple(e) {
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
