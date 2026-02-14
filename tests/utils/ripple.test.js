/**
 * Ripple utility tests.
 * Tests DOM element creation, positioning, and cleanup.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spawnRipple } from '../../src/utils/ripple';

describe('spawnRipple', () => {
	let container;
	let mockEvent;

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
	});

	it('creates a ripple span element', () => {
		spawnRipple(mockEvent);
		const ripple = container.querySelector('.ripple');
		expect(ripple).not.toBeNull();
		expect(ripple.tagName).toBe('SPAN');
	});

	it('sizes ripple to max dimension of container', () => {
		spawnRipple(mockEvent);
		const ripple = container.querySelector('.ripple');
		// max(200, 100) = 200
		expect(ripple.style.width).toBe('200px');
		expect(ripple.style.height).toBe('200px');
	});

	it('positions ripple at click coordinates relative to container', () => {
		spawnRipple(mockEvent);
		const ripple = container.querySelector('.ripple');
		// left: clientX(150) - rect.left(50) - size/2(100) = 0
		// top: clientY(80) - rect.top(30) - size/2(100) = -50
		expect(ripple.style.left).toBe('0px');
		expect(ripple.style.top).toBe('-50px');
	});

	it('removes ripple after animationend event', () => {
		spawnRipple(mockEvent);
		const ripple = container.querySelector('.ripple');
		expect(ripple).not.toBeNull();

		// Fire the animationend event
		ripple.dispatchEvent(new Event('animationend'));
		expect(container.querySelector('.ripple')).toBeNull();
	});

	it('appends ripple to the currentTarget element', () => {
		expect(container.children.length).toBe(0);
		spawnRipple(mockEvent);
		expect(container.children.length).toBe(1);
	});
});
