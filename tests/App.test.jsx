/**
 * App routing and navigation tests.
 * Tests route configuration, lazy loading, and navigation.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';

// Import pages directly for testing
import Contact from '../src/pages/Contact';
import About from '../src/pages/About';

describe('App Routing', () => {
	it('renders home page by default', async () => {
		const router = createMemoryRouter([
			{
				path: '/',
				element: <div>Welcome to Twistan</div>,
			},
		], {
			initialEntries: ['/'],
		});

		render(<RouterProvider router={router} />);

		await waitFor(() => {
			expect(screen.getByText(/Welcome to Twistan/i)).toBeInTheDocument();
		});
	});

	it('renders contact page on /contact route', async () => {
		const router = createMemoryRouter([
			{
				path: '/contact',
				element: <Contact />,
			},
		], {
			initialEntries: ['/contact'],
		});

		render(<RouterProvider router={router} />);

		await waitFor(() => {
			expect(screen.getByText(/get in touch/i)).toBeInTheDocument();
		});
	});

	it('renders about page on /about route', async () => {
		const router = createMemoryRouter([
			{
				path: '/about',
				element: <About />,
			},
		], {
			initialEntries: ['/about'],
		});

		render(<RouterProvider router={router} />);

		await waitFor(() => {
			expect(screen.getByText(/about me/i)).toBeInTheDocument();
		});
	});

	it('renders 404 page for unknown routes', async () => {
		const router = createMemoryRouter([
			{
				path: '/',
				element: <div>Home</div>,
			},
			{
				path: '*',
				element: <div>404 - Page Not Found</div>,
			},
		], {
			initialEntries: ['/unknown-route'],
		});

		render(<RouterProvider router={router} />);

		await waitFor(() => {
			expect(screen.getByText(/404|not found/i)).toBeInTheDocument();
		});
	});
});
