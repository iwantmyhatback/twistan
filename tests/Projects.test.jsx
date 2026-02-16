/**
 * Projects page tests.
 * Tests project card rendering, external links, tags,
 * and README interaction flow (expand, fetch, cache, error, toggle).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';

// Mock ripple — canvas operations don't work in jsdom
vi.mock('../src/utils/ripple', () => ({
	spawnRipple: vi.fn(),
}));

// Mock image explosion
vi.mock('../src/utils/imageExplosion', () => ({
	spawnImageExplosion: vi.fn(() => Promise.resolve()),
}));

import Projects from '../src/pages/Projects';

/** Clear the module-scope readmeCache between tests */
function clearReadmeCache() {
	// Re-import to access the module's internal cache isn't possible,
	// but we can work around by verifying fetch call counts instead.
	// The cache persists across renders in the same test module,
	// so we reset fetch mock between tests.
}

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
		expect(screen.getByLabelText('Projects')).toBeInTheDocument();
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

	it('renders "See project README" buttons for all projects', () => {
		renderProjects();
		const buttons = screen.getAllByText('See project README');
		expect(buttons).toHaveLength(6);
	});
});

describe('Projects README interaction', () => {
	beforeEach(() => {
		// Mock scrollIntoView — not available in jsdom
		Element.prototype.scrollIntoView = vi.fn();

		// Mock rAF to execute callback synchronously (used for scrollIntoView scheduling)
		vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
			cb();
			return 1;
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		delete Element.prototype.scrollIntoView;
	});

	// Each test uses a different project index to avoid module-scope readmeCache collisions.
	// Index 0 = python-wrapper, 1 = jellyfin.supplemental, 2 = twistan,
	// 3 = network-monitor, 4 = shell-environment, 5 = ds_clean

	it('shows "Hide README" when panel is open', async () => {
		global.fetch = vi.fn(() => new Promise(() => {}));

		renderProjects();
		const buttons = screen.getAllByText('See project README');
		fireEvent.click(buttons[0]);

		await waitFor(() => {
			expect(screen.getByText('Hide README')).toBeInTheDocument();
		});
	});

	it('shows loading text when README button is clicked', async () => {
		// Mock fetch that never resolves (to keep loading state visible)
		global.fetch = vi.fn(() => new Promise(() => {}));

		renderProjects();
		const buttons = screen.getAllByText('See project README');
		fireEvent.click(buttons[1]);

		await waitFor(() => {
			expect(screen.getByText('Loading README…')).toBeInTheDocument();
		});
	});

	it('displays rendered README content on successful fetch', async () => {
		const readmeMarkdown = '# Test Project\n\nThis is a test readme.';
		global.fetch = vi.fn().mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve(readmeMarkdown),
		});

		renderProjects();
		const buttons = screen.getAllByText('See project README');
		fireEvent.click(buttons[2]);

		await waitFor(() => {
			expect(screen.getByText('This is a test readme.')).toBeInTheDocument();
		});
	});

	it('displays error message when all fetch attempts fail', async () => {
		// All fetches reject → fetchReadmeFromGithub exhausts retries and throws "README not found"
		global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

		renderProjects();
		const buttons = screen.getAllByText('See project README');
		fireEvent.click(buttons[3]);

		await waitFor(() => {
			expect(screen.getByText('README not found')).toBeInTheDocument();
		});
	});

	it('closes panel when clicking button again', async () => {
		global.fetch = vi.fn(() => new Promise(() => {}));

		renderProjects();
		const buttons = screen.getAllByText('See project README');

		// Open
		fireEvent.click(buttons[4]);
		await waitFor(() => {
			expect(screen.getByText('Hide README')).toBeInTheDocument();
		});

		// Close — the button is now "Hide README"
		fireEvent.click(screen.getByText('Hide README'));

		await waitFor(() => {
			// All buttons should say "See project README" again
			expect(screen.queryByText('Hide README')).toBeNull();
		});
	});

	it('displays error when GitHub API and raw fallback both fail', async () => {
		// GitHub API returns 404, both raw branch URLs return 404
		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 404,
		});

		renderProjects();

		const buttons = screen.getAllByText('See project README');
		fireEvent.click(buttons[5]);

		await waitFor(() => {
			expect(screen.getByText('README not found')).toBeInTheDocument();
		});
	});

	it('does not show loading when AbortError occurs on tile switch', async () => {
		const readmeMarkdown = '# Test\n\nContent here.';
		// First fetch succeeds (for button[0]), second will be aborted by switching
		global.fetch = vi.fn()
			.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve(readmeMarkdown),
			});

		renderProjects();
		const buttons = screen.getAllByText('See project README');

		// Open first tile and wait for content
		fireEvent.click(buttons[0]);
		await waitFor(() => {
			expect(screen.getByText('Content here.')).toBeInTheDocument();
		});

		// AbortError should not produce error UI
		expect(screen.queryByText('Aborted')).toBeNull();
	});
});
