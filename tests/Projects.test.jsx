/**
 * Projects page tests.
 * Tests project card rendering, external links, and tags.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import Projects from '../src/pages/Projects';

function renderProjects() {
	const router = createMemoryRouter(
		[{ path: '*', element: <Projects /> }],
		{ initialEntries: ['/projects'] }
	);
	return render(<RouterProvider router={router} />);
}

describe('Projects Page', () => {
	it('renders heading', () => {
		renderProjects();
		expect(screen.getByText('Projects')).toBeInTheDocument();
	});

	it('renders all project titles', () => {
		renderProjects();
		const titles = [
			'python-wrapper',
			'jellyfin.supplemental',
			'twistan',
			'network-monitor',
			'shell-environment',
			'ds_clean',
		];
		titles.forEach((title) => {
			expect(screen.getByText(title)).toBeInTheDocument();
		});
	});

	it('renders project descriptions', () => {
		renderProjects();
		expect(screen.getByText(/environment stability wrapper/i)).toBeInTheDocument();
		expect(screen.getByText(/recursively delete/i)).toBeInTheDocument();
	});

	it('renders external GitHub links with proper attributes', () => {
		renderProjects();
		const links = screen.getAllByRole('link');
		links.forEach((link) => {
			expect(link).toHaveAttribute('target', '_blank');
			expect(link).toHaveAttribute('rel', 'noopener noreferrer');
			expect(link.getAttribute('href')).toMatch(/^https:\/\/github\.com\//);
		});
	});

	it('renders project tags', () => {
		renderProjects();
		// Shell appears in multiple projects — use getAllByText
		expect(screen.getAllByText('Shell').length).toBeGreaterThan(0);
		expect(screen.getByText('Docker')).toBeInTheDocument();
		expect(screen.getByText('Rust')).toBeInTheDocument();
		expect(screen.getByText('React')).toBeInTheDocument();
	});

	it('renders correct number of project cards', () => {
		renderProjects();
		const titles = [
			'python-wrapper', 'jellyfin.supplemental', 'twistan',
			'network-monitor', 'shell-environment', 'ds_clean',
		];
		titles.forEach((t) => expect(screen.getByText(t)).toBeInTheDocument());
	});
});
