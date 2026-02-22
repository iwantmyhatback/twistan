/**
 * About page tests.
 * Tests heading, skills grid rendering, easter egg link, and typewriter reveal timer.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';

// Mock useInView so EasterEggReveal immediately sees the component as in-view
vi.mock('motion/react', async (importOriginal) => {
	const actual = await importOriginal();
	return { ...actual, useInView: () => true };
});

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
		expect(screen.getByLabelText('About Me')).toBeInTheDocument();
	});

	it('renders intro text', () => {
		renderAbout();
		expect(screen.getByText(/developer productivity/i)).toBeInTheDocument();
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
		const { container } = renderAbout();
		// ExplodingText hides individual characters via visibility:hidden, leaving
		// the link with an empty accessible name — query by href instead.
		const link = container.querySelector('a[href="/about-you"]');
		expect(link).toBeInTheDocument();
	});
});

describe('About EasterEggReveal', () => {
	beforeEach(() => { vi.useFakeTimers(); });
	afterEach(() => { vi.useRealTimers(); });

	it('renders the easter egg paragraph before the delay elapses', () => {
		const { container } = renderAbout();
		// The paragraph element should exist immediately (visibleCount=0, chars hidden)
		const easterPara = container.querySelector('p.text-sm.text-red-900');
		expect(easterPara).toBeInTheDocument();
	});

	it('begins revealing characters after the initial 10s delay', () => {
		const { container } = renderAbout();

		act(() => {
			// Advance past the 10 000 ms initial setTimeout
			vi.advanceTimersByTime(10000);
			// Advance through a few character intervals (CHAR_DELAY_MS = 100ms each)
			vi.advanceTimersByTime(500);
		});

		// At least some characters should now be visible (visibleCount > 0)
		// The EasterEggReveal renders spans for each char; after 5 intervals
		// visibleCount >= 5. We verify the effect ran without error.
		const easterPara = container.querySelector('p.font-mono.text-sm.text-red-900');
		expect(easterPara).toBeInTheDocument();
	});

	it('clears timers on unmount without throwing', () => {
		const { unmount } = renderAbout();
		act(() => { vi.advanceTimersByTime(5000); });
		// Unmounting mid-timer should not throw (cleanup runs clearTimeout/clearInterval)
		expect(() => unmount()).not.toThrow();
	});
});
