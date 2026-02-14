/**
 * CursorGlow component tests.
 * Tests canvas rendering and media query gating.
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
});
