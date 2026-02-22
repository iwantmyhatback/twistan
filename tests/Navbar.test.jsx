/**
 * Navbar component tests.
 * Tests navigation links, mobile menu toggle, accessibility,
 * DiscoBall birthday easter egg, and idle zzz bubble.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import Navbar from '../src/components/Navbar';

/** Render Navbar within a router at the given path. */
function renderNavbar(props = {}, initialPath = '/') {
	const router = createMemoryRouter(
		[{ path: '*', element: <Navbar {...props} /> }],
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

		fireEvent.click(toggle);
		expect(toggle).toHaveAttribute('aria-expanded', 'true');

		// Desktop + mobile links — click the last one (mobile version)
		const contactLinks = screen.getAllByText(/contact/i);
		fireEvent.click(contactLinks[contactLinks.length - 1]);

		expect(toggle).toHaveAttribute('aria-expanded', 'false');
	});
});

describe('Navbar - idle zzz bubble', () => {
	it('zzz bubble is absent when not idle', () => {
		renderNavbar({ isIdle: false });
		expect(screen.queryByText(/zzz/i)).not.toBeInTheDocument();
	});

	it('zzz bubble appears when isIdle is true', () => {
		renderNavbar({ isIdle: true });
		expect(screen.getByText(/zzz/i)).toBeInTheDocument();
	});
});

// Note: IS_BIRTHDAY is a module-level constant evaluated at import time.
// BirthdayCake and the birthday speech bubble are covered at runtime on Aug 5.
// The spawnConfetti utility it calls is independently covered in confetti.test.js.
