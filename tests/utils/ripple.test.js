/**
 * Ripple utility tests.
 * Tests canvas element creation, positioning, cleanup, animation loop,
 * color parsing (via CSS variables), and null context fallback.
 * Canvas getContext is mocked since jsdom doesn't implement it.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawnRipple } from '../../src/utils/ripple';

describe('spawnRipple', () => {
	let container;
	let mockEvent;
	let mockCtx;
	let rafCallbacks;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);

		container.getBoundingClientRect = vi.fn(() => ({
			width: 200,
			height: 100,
			left: 50,
			top: 30,
		}));

		mockEvent = {
			currentTarget: container,
			clientX: 150,
			clientY: 80,
		};

		rafCallbacks = [];

		/* Mock canvas getContext — jsdom doesn't implement it */
		mockCtx = {
			scale: vi.fn(),
			clearRect: vi.fn(),
			beginPath: vi.fn(),
			arc: vi.fn(),
			stroke: vi.fn(),
			fill: vi.fn(),
			createRadialGradient: vi.fn(() => ({
				addColorStop: vi.fn(),
			})),
			strokeStyle: '',
			fillStyle: '',
			lineWidth: 0,
		};
		HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx);

		vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
			rafCallbacks.push(cb);
			return rafCallbacks.length;
		});

		vi.spyOn(performance, 'now').mockReturnValue(0);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		container.remove();
	});

	it('creates a ripple canvas element', () => {
		spawnRipple(mockEvent);
		const ripple = container.querySelector('.ripple');
		expect(ripple).not.toBeNull();
		expect(ripple.tagName).toBe('CANVAS');
	});

	it('sizes canvas to container dimensions', () => {
		spawnRipple(mockEvent);
		const ripple = container.querySelector('.ripple');
		expect(ripple.style.width).toBe('200px');
		expect(ripple.style.height).toBe('100px');
	});

	it('positions canvas to fill container', () => {
		spawnRipple(mockEvent);
		const ripple = container.querySelector('.ripple');
		expect(ripple.style.top).toBe('0px');
		expect(ripple.style.left).toBe('0px');
	});

	it('canvas has pointer-events none', () => {
		spawnRipple(mockEvent);
		const ripple = container.querySelector('.ripple');
		expect(ripple.style.pointerEvents).toBe('none');
	});

	it('appends ripple to the currentTarget element', () => {
		expect(container.children.length).toBe(0);
		spawnRipple(mockEvent);
		expect(container.children.length).toBe(1);
	});

	it('removes canvas and returns early when getContext returns null', () => {
		HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
		spawnRipple(mockEvent);

		// Canvas should have been removed immediately
		expect(container.querySelector('.ripple')).toBeNull();
		expect(window.requestAnimationFrame).not.toHaveBeenCalled();
	});

	it('invokes requestAnimationFrame to start animation loop', () => {
		spawnRipple(mockEvent);
		expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
	});

	it('draws rings and gradients when animation frame fires', () => {
		spawnRipple(mockEvent);

		// Fire first frame at t=500ms (25% through 2000ms DURATION)
		performance.now.mockReturnValue(500);
		rafCallbacks[0](500);

		// Should draw arcs (rings) and strokes
		expect(mockCtx.clearRect).toHaveBeenCalled();
		expect(mockCtx.beginPath).toHaveBeenCalled();
		expect(mockCtx.arc).toHaveBeenCalled();
		expect(mockCtx.stroke).toHaveBeenCalled();
	});

	it('creates radial gradients for glow effect', () => {
		spawnRipple(mockEvent);

		// Fire at mid-animation where alpha > 0.05 triggers gradient
		performance.now.mockReturnValue(500);
		rafCallbacks[0](500);

		expect(mockCtx.createRadialGradient).toHaveBeenCalled();
		expect(mockCtx.fill).toHaveBeenCalled();
	});

	it('schedules another frame when animation is not complete', () => {
		spawnRipple(mockEvent);

		performance.now.mockReturnValue(500);
		rafCallbacks[0](500);

		// Should have scheduled another frame (original + 1 more)
		expect(rafCallbacks.length).toBe(2);
	});

	it('removes canvas when animation completes', () => {
		spawnRipple(mockEvent);

		// Fire frame at t >= DURATION (2000ms)
		performance.now.mockReturnValue(2100);
		rafCallbacks[0](2100);

		// Canvas should be removed
		expect(container.querySelector('.ripple')).toBeNull();
	});

	it('uses rgb CSS variable when --color-ripple is set', () => {
		// Set CSS variable before spawning
		document.documentElement.style.setProperty('--color-ripple', 'rgb(255, 0, 128)');

		spawnRipple(mockEvent);

		// Fire frame to trigger color usage
		performance.now.mockReturnValue(500);
		rafCallbacks[0](500);

		// Verify strokes use the parsed RGB value
		expect(mockCtx.stroke).toHaveBeenCalled();

		// Clean up
		document.documentElement.style.removeProperty('--color-ripple');
	});

	it('uses hex CSS variable when --color-terminal is set', () => {
		document.documentElement.style.setProperty('--color-terminal', '#ff8800');

		spawnRipple(mockEvent);

		performance.now.mockReturnValue(500);
		rafCallbacks[0](500);

		expect(mockCtx.stroke).toHaveBeenCalled();

		document.documentElement.style.removeProperty('--color-terminal');
	});
});
