/**
 * Layout component tests.
 * Tests composition (navbar, footer, skip-to-content) and accessibility.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import Layout from '../src/components/Layout';

/** Render Layout with a child element at the given route. */
function renderLayout(child = <div>Test Content</div>, initialPath = '/') {
	const router = createMemoryRouter(
		[
			{
				path: '*',
				element: <Layout>{child}</Layout>,
			},
		],
		{ initialEntries: [initialPath] }
	);
	return render(<RouterProvider router={router} />);
}

describe('Layout', () => {
	it('renders children content', () => {
		renderLayout(<p>Page Body</p>);
		expect(screen.getByText('Page Body')).toBeInTheDocument();
	});

	it('renders navbar brand', () => {
		renderLayout();
		expect(screen.getByText('Twistan')).toBeInTheDocument();
	});

	it('renders footer', () => {
		renderLayout();
		expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument();
	});

	it('renders skip-to-content link for accessibility', () => {
		renderLayout();
		const skipLink = screen.getByText('Skip to content');
		expect(skipLink).toBeInTheDocument();
		expect(skipLink).toHaveAttribute('href', '#main-content');
	});

	it('main content area has id for skip link target', () => {
		renderLayout(<div>Content</div>);
		const main = document.getElementById('main-content');
		expect(main).not.toBeNull();
	});
});
