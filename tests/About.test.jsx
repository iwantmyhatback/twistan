/**
 * About page tests.
 * Tests heading, skills grid rendering, and easter egg link.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import About from '../src/pages/About';

function renderAbout() {
	const router = createMemoryRouter(
		[{ path: '*', element: <About /> }],
		{ initialEntries: ['/about'] }
	);
	return render(<RouterProvider router={router} />);
}

describe('About Page', () => {
	it('renders heading', () => {
		renderAbout();
		expect(screen.getByText('About Me')).toBeInTheDocument();
	});

	it('renders intro text', () => {
		renderAbout();
		expect(screen.getByText(/developer tooling/i)).toBeInTheDocument();
	});

	it('renders all skill tiles', () => {
		renderAbout();
		const expectedSkills = [
			'Development', 'CI/CD', 'Automation', 'Dev Productivity',
			'DevOps', 'Scripting', 'Deployment', 'Testing',
			'SysOps', 'Device Management', 'macOS', 'Cross-Platform Mobile',
		];
		expectedSkills.forEach((skill) => {
			expect(screen.getByText(skill)).toBeInTheDocument();
		});
	});

	it('renders easter egg link to about-you page', () => {
		renderAbout();
		const link = screen.getByRole('link', { name: /find out/i });
		expect(link).toHaveAttribute('href', '/about-you');
	});
});
