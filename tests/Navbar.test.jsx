/**
 * Navbar component tests.
 * Tests navigation links, mobile menu toggle, and accessibility.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import Navbar from '../src/components/Navbar';

/** Render Navbar within a router at the given path. */
function renderNavbar(initialPath = '/') {
	const router = createMemoryRouter(
		[
			{ path: '*', element: <Navbar /> },
		],
		{ initialEntries: [initialPath] }
	);
	return render(<RouterProvider router={router} />);
}

describe('Navbar', () => {
	it('renders brand link', () => {
		renderNavbar();
		expect(screen.getByText('Twistan')).toBeInTheDocument();
	});

	it('renders all desktop nav links', () => {
		renderNavbar();
		expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /projects/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /contact/i })).toBeInTheDocument();
	});

	it('renders avatar image', () => {
		renderNavbar();
		expect(screen.getByAltText('Twistan avatar')).toBeInTheDocument();
	});
});

describe('Navbar - Mobile Menu', () => {
	it('hamburger button has correct initial aria-expanded', () => {
		renderNavbar();
		const toggle = screen.getByRole('button', { name: /toggle menu/i });
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
	});

	it('toggles mobile menu on hamburger click', () => {
		renderNavbar();
		const toggle = screen.getByRole('button', { name: /toggle menu/i });

		fireEvent.click(toggle);
		expect(toggle).toHaveAttribute('aria-expanded', 'true');

		fireEvent.click(toggle);
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
	});

	it('closes mobile menu when a nav link is clicked', () => {
		renderNavbar();
		const toggle = screen.getByRole('button', { name: /toggle menu/i });

		// Open menu
		fireEvent.click(toggle);
		expect(toggle).toHaveAttribute('aria-expanded', 'true');

		// Click a link in the mobile menu — there will be duplicate links
		// (desktop + mobile), so get all and click the last one (mobile version)
		const contactLinks = screen.getAllByText(/contact/i);
		fireEvent.click(contactLinks[contactLinks.length - 1]);

		expect(toggle).toHaveAttribute('aria-expanded', 'false');
	});
});
