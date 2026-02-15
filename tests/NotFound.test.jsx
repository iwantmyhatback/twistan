/**
 * NotFound (404) page tests.
 * Tests rendering and navigation link back to home.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import NotFound from '../src/pages/NotFound';

function renderNotFound() {
	const router = createMemoryRouter(
		[{ path: '*', element: <NotFound /> }],
		{ initialEntries: ['/nonexistent'] }
	);
	return render(<RouterProvider router={router} />);
}

describe('NotFound Page', () => {
	it('renders 404 heading', () => {
		renderNotFound();
		expect(screen.getByText('404')).toBeInTheDocument();
	});

	it('renders descriptive message', () => {
		renderNotFound();
		expect(screen.getByText(/wandered off/i)).toBeInTheDocument();
	});

	it('renders link back to home', () => {
		renderNotFound();
		const link = screen.getByRole('link', { name: /back to home/i });
		expect(link).toHaveAttribute('href', '/');
	});

	it('applies glitch-text class to heading', () => {
		renderNotFound();
		const heading = screen.getByText('404');
		expect(heading.className).toContain('glitch-text');
	});
});
