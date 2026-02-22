/**
 * confetti utility tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawnConfetti } from '../../src/utils/confetti';

function makeCtx() {
	return {
		clearRect: vi.fn(),
		save: vi.fn(),
		restore: vi.fn(),
		translate: vi.fn(),
		rotate: vi.fn(),
		beginPath: vi.fn(),
		ellipse: vi.fn(),
		fill: vi.fn(),
		fillRect: vi.fn(),
		fillStyle: '',
		globalAlpha: 1,
		createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
		putImageData: vi.fn(),
	};
}

describe('spawnConfetti', () => {
	let originalRaf, originalCaf, originalMatchMedia;

	beforeEach(() => {
		originalRaf = window.requestAnimationFrame;
		originalCaf = window.cancelAnimationFrame;
		originalMatchMedia = window.matchMedia;

		// Default: not reduced motion
		window.matchMedia = vi.fn((query) => ({
			matches: false,
			media: query,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		}));

		// rAF never fires automatically — tests control it
		window.requestAnimationFrame = vi.fn(() => 1);
		window.cancelAnimationFrame = vi.fn();

		vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(makeCtx());
	});

	afterEach(() => {
		window.requestAnimationFrame = originalRaf;
		window.cancelAnimationFrame = originalCaf;
		window.matchMedia = originalMatchMedia;
		vi.restoreAllMocks();
		// Clean up any canvases left on body
		document.body.querySelectorAll('canvas').forEach((c) => c.remove());
	});

	it('does nothing when prefers-reduced-motion is set', () => {
		window.matchMedia = vi.fn(() => ({ matches: true }));
		spawnConfetti();
		expect(document.body.querySelector('canvas')).toBeNull();
	});

	it('appends a canvas to document.body', () => {
		spawnConfetti();
		expect(document.body.querySelector('canvas')).not.toBeNull();
	});

	it('canvas has fixed positioning and pointer-events-none', () => {
		spawnConfetti();
		const canvas = document.body.querySelector('canvas');
		expect(canvas.style.position).toBe('fixed');
		expect(canvas.style.pointerEvents).toBe('none');
	});

	it('canvas z-index is above other content', () => {
		spawnConfetti();
		const canvas = document.body.querySelector('canvas');
		expect(Number(canvas.style.zIndex)).toBeGreaterThan(100);
	});

	it('starts the animation loop via requestAnimationFrame', () => {
		spawnConfetti();
		expect(window.requestAnimationFrame).toHaveBeenCalled();
	});

	it('removes canvas after safety timeout', () => {
		vi.useFakeTimers();
		window.requestAnimationFrame = vi.fn(() => 1);
		spawnConfetti({ spawnDuration: 100 });

		const canvas = document.body.querySelector('canvas');
		expect(canvas).not.toBeNull();

		// Advance past spawnDuration + falloffMs (height/2 * 1000/60 ≈ large number)
		// Safety timeout = spawnDuration + falloffMs
		vi.advanceTimersByTime(30000);

		expect(document.body.querySelector('canvas')).toBeNull();
		vi.useRealTimers();
	});

	it('does not throw when called with custom options', () => {
		expect(() => spawnConfetti({ batchSize: 5, spawnDuration: 500, spawnInterval: 100 })).not.toThrow();
	});
});
