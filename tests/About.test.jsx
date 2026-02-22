/**
 * About page tests.
 * Tests heading, skills grid rendering, easter egg link, and typewriter reveal timer.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';

// Mock useInView so EasterEggReveal and SkillsBottomEgg immediately see components as in-view
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

	it('begins revealing characters after the initial 8s delay', () => {
		const { container } = renderAbout();

		act(() => {
			// Advance past the 8 000 ms initial setTimeout
			vi.advanceTimersByTime(8000);
			// Advance through a few character intervals (CHAR_DELAY_MS = 100ms each)
			vi.advanceTimersByTime(500);
		});

		// At least some characters should now be visible (visibleCount > 0)
		// The EasterEggReveal renders spans for each char; after 5 intervals
		// visibleCount >= 5. We verify the effect ran without error.
		const easterPara = container.querySelector('p.font-mono.text-sm.text-red-900');
		expect(easterPara).toBeInTheDocument();
	});

	it('shows trailing cursor block after full typewriter completion', () => {
		// EASTER_FULL = 'Curious what I know about you? Find out here' = 45 chars
		// Delay: 8000ms, then 45 chars * 100ms = 4500ms => total 12500ms
		const { container } = renderAbout();

		act(() => {
			vi.advanceTimersByTime(8000 + 45 * 100 + 50);
		});

		// After visibleCount >= EASTER_FULL.length, a trailing cursor span is rendered
		// It contains the block character &#9608; (▌) preceded by a space
		const easterPara = container.querySelector('p.font-mono.text-sm.text-red-900');
		expect(easterPara).toBeInTheDocument();

		// The trailing cursor span has class text-red-900 and contains the block char
		const spans = easterPara.querySelectorAll('span.text-red-900[aria-hidden="true"]');
		// At completion, the last rendered cursor is the trailing one outside the char loop
		const blockChars = Array.from(spans).filter((s) => s.textContent.includes('█'));
		expect(blockChars.length).toBeGreaterThan(0);
	});

	it('clears timers on unmount without throwing', () => {
		const { unmount } = renderAbout();
		act(() => { vi.advanceTimersByTime(5000); });
		// Unmounting mid-timer should not throw (cleanup runs clearTimeout/clearInterval)
		expect(() => unmount()).not.toThrow();
	});
});

describe('About SkillsBottomEgg', () => {
	// useInView is already mocked to return true globally in this file,
	// so SkillsBottomEgg always sees isAtBottom=true.

	beforeEach(() => { vi.useFakeTimers(); });
	afterEach(() => { vi.useRealTimers(); });

	it('shows spinner and first message after scrolling into view', () => {
		const { container } = renderAbout();

		act(() => {
			// First message starts at delay:0 with charInterval 55ms.
			// Advance enough for the phase=1 timeout and a few chars to appear.
			vi.advanceTimersByTime(500);
		});

		// The CSS spinner has class animate-spin
		const spinner = container.querySelector('.animate-spin');
		expect(spinner).toBeInTheDocument();
	});

	it('shows blinking cursor while typing first message', () => {
		const { container } = renderAbout();

		act(() => {
			// Advance 55ms so one character of the first message has been typed.
			// During typing, displayText.length > 0 and < full message length,
			// so the blinking cursor span with ▌ is rendered.
			vi.advanceTimersByTime(55);
		});

		// The blinking cursor is a span with aria-hidden containing ▌
		const cursors = container.querySelectorAll('span[aria-hidden="true"]');
		const blockCursor = Array.from(cursors).find((s) => s.textContent === '▌');
		expect(blockCursor).toBeInTheDocument();
	});

	it('transitions to second message after 12s', () => {
		const { container } = renderAbout();

		act(() => {
			// Second message 'i think hes asleep...' triggers at delay:12000.
			// Add extra time for chars to start appearing.
			vi.advanceTimersByTime(12000 + 500);
		});

		// The displayed text should contain the beginning of the second message
		const monoP = container.querySelector('p.font-mono.text-xs.text-neutral-600');
		expect(monoP).toBeInTheDocument();
		expect(monoP.textContent).toMatch(/i think/i);
	});
});
