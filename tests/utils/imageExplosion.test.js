/**
 * Image explosion utility tests.
 * Tests canvas overlay creation, reduced motion bailout, null guards,
 * and animation lifecycle (rAF loop → overlay removal → promise resolution).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawnImageExplosion } from '../../src/utils/imageExplosion';

describe('spawnImageExplosion', () => {
	let mockCtx;
	let originalMatchMedia;
	let rafCallbacks;

	beforeEach(() => {
		originalMatchMedia = window.matchMedia;
		rafCallbacks = [];

		// Default: no reduced motion
		window.matchMedia = vi.fn((query) => ({
			matches: false,
			media: query,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		}));

		mockCtx = {
			scale: vi.fn(),
			clearRect: vi.fn(),
			save: vi.fn(),
			restore: vi.fn(),
			translate: vi.fn(),
			rotate: vi.fn(),
			drawImage: vi.fn(),
			beginPath: vi.fn(),
			moveTo: vi.fn(),
			lineTo: vi.fn(),
			closePath: vi.fn(),
			clip: vi.fn(),
			globalAlpha: 1,
			createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(16) })),
			putImageData: vi.fn(),
		};

		HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx);

		// Capture rAF callbacks for manual invocation
		vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
			rafCallbacks.push(cb);
			return rafCallbacks.length;
		});

		// Mock performance.now
		vi.spyOn(performance, 'now').mockReturnValue(0);
	});

	afterEach(() => {
		window.matchMedia = originalMatchMedia;
		vi.restoreAllMocks();
		// Clean up any canvases appended to body during tests
		document.body.querySelectorAll('canvas').forEach((c) => c.remove());
	});

	/**
	 * Creates a fake <img> element with mocked dimensions.
	 */
	function createMockImg(complete = true) {
		const img = document.createElement('img');
		Object.defineProperty(img, 'complete', { value: complete, writable: true });
		img.getBoundingClientRect = vi.fn(() => ({
			left: 100, top: 50, width: 200, height: 150,
		}));
		return img;
	}

	it('resolves immediately when prefers-reduced-motion is set', async () => {
		window.matchMedia = vi.fn(() => ({
			matches: true,
			media: '(prefers-reduced-motion: reduce)',
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		}));

		const result = spawnImageExplosion(createMockImg());
		await expect(result).resolves.toBeUndefined();
		expect(window.requestAnimationFrame).not.toHaveBeenCalled();
	});

	it('resolves immediately when imgElement is null', async () => {
		await expect(spawnImageExplosion(null)).resolves.toBeUndefined();
		expect(window.requestAnimationFrame).not.toHaveBeenCalled();
	});

	it('resolves immediately when imgElement.complete is false', async () => {
		const img = createMockImg(false);
		await expect(spawnImageExplosion(img)).resolves.toBeUndefined();
		expect(window.requestAnimationFrame).not.toHaveBeenCalled();
	});

	it('creates an overlay canvas appended to document.body', () => {
		const img = createMockImg();
		const bodyChildrenBefore = document.body.querySelectorAll('canvas').length;
		spawnImageExplosion(img);
		const bodyChildrenAfter = document.body.querySelectorAll('canvas').length;

		expect(bodyChildrenAfter).toBeGreaterThan(bodyChildrenBefore);
		expect(window.requestAnimationFrame).toHaveBeenCalled();
	});

	it('resolves and removes overlay after animation completes', async () => {
		const img = createMockImg();
		const promise = spawnImageExplosion(img);

		// There are two getContext calls — one for srcCanvas and one for overlay
		// Plus fragment canvases. The first rAF callback is the animation frame.
		expect(rafCallbacks.length).toBe(1);

		// Simulate time past MAX_DURATION (6s = 6000ms)
		performance.now.mockReturnValue(7000);
		rafCallbacks[0](7000);

		await promise;

		// Overlay should be removed after animation completes — verify body has no leftover canvases
		// (the overlay calls .remove() on itself)
		const bodyCanvases = document.body.querySelectorAll('canvas');
		expect(bodyCanvases.length).toBe(0);
	});

	it('handles null overlay canvas context gracefully', async () => {
		let callCount = 0;
		HTMLCanvasElement.prototype.getContext = vi.fn(() => {
			callCount++;
			// Return valid ctx for srcCanvas (call 1) and fragment canvases,
			// but null for overlay canvas (call 2)
			if (callCount === 2) return null;
			return mockCtx;
		});

		const img = createMockImg();
		const promise = spawnImageExplosion(img);
		await expect(promise).resolves.toBeUndefined();
	});

	it('handles null srcCanvas context gracefully', async () => {
		// First getContext call (srcCanvas) returns null
		HTMLCanvasElement.prototype.getContext = vi.fn(() => null);

		const img = createMockImg();
		const promise = spawnImageExplosion(img);
		await expect(promise).resolves.toBeUndefined();
	});

	it('calls resolveObstacles path when DOM elements are present in viewport', () => {
		// Provide a mock obstacle element whose bounding rect overlaps the image area
		const mockEl = {
			getBoundingClientRect: vi.fn(() => ({
				left: 80, top: 30, right: 320, bottom: 220,
				width: 240, height: 190,
			})),
		};
		vi.spyOn(document, 'querySelectorAll').mockReturnValue([mockEl]);

		const img = createMockImg();
		spawnImageExplosion(img);

		performance.now.mockReturnValue(100);
		rafCallbacks[0](100);

		// Animation continued — another rAF was queued
		expect(rafCallbacks.length).toBe(2);

		document.querySelectorAll.mockRestore();
	});

	it('schedules another rAF when animation is not complete', () => {
		const img = createMockImg();
		spawnImageExplosion(img);

		// First frame — time is 0, well within DURATION (1.8s)
		performance.now.mockReturnValue(100);
		rafCallbacks[0](100);

		// Should have scheduled another frame
		expect(rafCallbacks.length).toBe(2);
	});
});
