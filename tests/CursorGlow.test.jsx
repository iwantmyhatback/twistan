/**
 * CursorGlow component tests.
 * Tests canvas rendering, media query gating, noise rendering loop,
 * and media query change handler for cleanup.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import CursorGlow from '../src/components/CursorGlow';

describe('CursorGlow', () => {
	let originalMatchMedia;

	beforeEach(() => {
		originalMatchMedia = window.matchMedia;
	});

	afterEach(() => {
		window.matchMedia = originalMatchMedia;
	});

	it('renders a canvas element', () => {
		const { container } = render(<CursorGlow />);
		expect(container.querySelector('canvas')).not.toBeNull();
	});

	it('canvas has pointer-events-none class', () => {
		const { container } = render(<CursorGlow />);
		const canvas = container.querySelector('canvas');
		expect(canvas.className).toContain('pointer-events-none');
	});

	it('canvas is hidden on small screens via CSS class', () => {
		const { container } = render(<CursorGlow />);
		const canvas = container.querySelector('canvas');
		expect(canvas.className).toContain('hidden');
		expect(canvas.className).toContain('lg:block');
	});

	it('does not start animation loop when matchMedia returns false', () => {
		// The default setup.js mock returns matches: false
		const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

		render(<CursorGlow />);

		// With matches: false, requestAnimationFrame should not be called
		expect(rafSpy).not.toHaveBeenCalled();
		rafSpy.mockRestore();
	});

	it('starts animation loop when matchMedia returns true', () => {
		window.matchMedia = vi.fn(() => ({
			matches: true,
			media: '',
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		}));

		const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);

		render(<CursorGlow />);

		expect(rafSpy).toHaveBeenCalled();
		rafSpy.mockRestore();
	});

	it('calls createImageData and putImageData when noise renders', () => {
		const mockImageData = { data: new Uint8ClampedArray(16) };
		const mockCtx = {
			createImageData: vi.fn(() => mockImageData),
			putImageData: vi.fn(),
		};
		HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx);

		let changeHandler;
		window.matchMedia = vi.fn(() => ({
			matches: true,
			media: '',
			addEventListener: vi.fn((event, handler) => {
				if (event === 'change') changeHandler = handler;
			}),
			removeEventListener: vi.fn(),
		}));

		let rafCallback;
		const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
			rafCallback = cb;
			return 1;
		});

		render(<CursorGlow />);

		// The first rAF callback is renderNoise — invoke it with a timestamp
		// that exceeds the FPS_INTERVAL (1000/8 = 125ms)
		expect(rafCallback).toBeDefined();
		rafCallback(200);

		expect(mockCtx.createImageData).toHaveBeenCalled();
		expect(mockCtx.putImageData).toHaveBeenCalledWith(mockImageData, 0, 0);

		rafSpy.mockRestore();
	});

	it('cancels animation when media query changes to non-matching', () => {
		let changeHandler;
		window.matchMedia = vi.fn(() => ({
			matches: true,
			media: '',
			addEventListener: vi.fn((event, handler) => {
				if (event === 'change') changeHandler = handler;
			}),
			removeEventListener: vi.fn(),
		}));

		const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(42);
		const cafSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

		render(<CursorGlow />);

		// Simulate media query changing to non-matching
		expect(changeHandler).toBeDefined();
		changeHandler({ matches: false });

		expect(cafSpy).toHaveBeenCalled();

		rafSpy.mockRestore();
		cafSpy.mockRestore();
	});
});
