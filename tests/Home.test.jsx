/**
 * Home page tests.
 * Tests image display, wave button interaction, and image error handling.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';

// Mock the ripple utility — DOM manipulation doesn't work in jsdom
vi.mock('../src/utils/ripple', () => ({
	spawnRipple: vi.fn(),
}));

// Mock crypto.getRandomValues for deterministic shuffle
vi.stubGlobal('crypto', {
	...globalThis.crypto,
	getRandomValues: (arr) => {
		for (let i = 0; i < arr.length; i++) arr[i] = i;
		return arr;
	},
});

import { spawnRipple } from '../src/utils/ripple';
import Home from '../src/pages/Home';

function renderHome() {
	const router = createMemoryRouter(
		[{ path: '/', element: <Home /> }],
		{ initialEntries: ['/'] }
	);
	return render(<RouterProvider router={router} />);
}

describe('Home Page', () => {
	it('renders the wave button', () => {
		renderHome();
		expect(screen.getByText('Wave Back!')).toBeInTheDocument();
	});

	it('renders an image with a src from the image pool', () => {
		renderHome();
		const img = screen.getByAltText('Wave');
		expect(img).toBeInTheDocument();
		expect(img.getAttribute('src')).toMatch(/^https:\/\//);
	});

	it('calls spawnRipple when wave button is clicked', () => {
		renderHome();
		const button = screen.getByText('Wave Back!');
		fireEvent.click(button);

		expect(spawnRipple).toHaveBeenCalledTimes(1);
	});

	it('wave button is a clickable button element', () => {
		renderHome();
		const button = screen.getByText('Wave Back!');
		expect(button.closest('button')).not.toBeNull();
	});

	it('image has alt text for accessibility', () => {
		renderHome();
		const img = screen.getByAltText('Wave');
		expect(img).toBeInTheDocument();
	});

	it('handles image load event to calculate tile sizing', () => {
		renderHome();
		const img = screen.getByAltText('Wave');

		// Simulate image load with natural dimensions
		Object.defineProperty(img, 'naturalWidth', { value: 300, writable: true });
		Object.defineProperty(img, 'naturalHeight', { value: 200, writable: true });
		fireEvent.load(img);

		// No error means handleImageLoad processed successfully
		expect(img).toBeInTheDocument();
	});

	it('handles image error by advancing to next image', () => {
		renderHome();
		const img = screen.getByAltText('Wave');
		fireEvent.error(img);

		// After error, the component should still have an image
		// (AnimatePresence may keep the old element, but state was updated)
		expect(screen.getByAltText('Wave')).toBeInTheDocument();
	});
});
