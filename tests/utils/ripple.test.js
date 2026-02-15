/**
 * Ripple utility tests.
 * Tests canvas element creation, positioning, and cleanup.
 * Canvas getContext is mocked since jsdom doesn't implement it.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spawnRipple } from '../../src/utils/ripple';

describe('spawnRipple', () => {
	let container;
	let mockEvent;
	let mockCtx;

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
});
