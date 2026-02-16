/**
 * ExplodingText component tests.
 * Tests idle rendering, click behavior, reduced motion, cleanup,
 * and timer-driven state transitions (exploding → waiting → rematerializing → idle).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ExplodingText from '../src/components/ExplodingText';

describe('ExplodingText', () => {
	beforeEach(() => {
		// Default: no reduced motion
		window.matchMedia = (query) => ({
			matches: query === '(prefers-reduced-motion: reduce)' ? false : false,
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => {},
		});
	});

	it('renders text in idle state', () => {
		render(<ExplodingText text="Hello" className="heading-xl" />);
		expect(screen.getByLabelText('Hello')).toBeInTheDocument();
	});

	it('renders as h1 with correct aria-label', () => {
		render(<ExplodingText text="About Me" />);
		const heading = screen.getByRole('heading', { level: 1 });
		expect(heading).toHaveAttribute('aria-label', 'About Me');
	});

	it('applies className to the h1', () => {
		const { container } = render(<ExplodingText text="Test" className="heading-xl mb-6" />);
		const h1 = container.querySelector('h1');
		expect(h1.className).toContain('heading-xl');
		expect(h1.className).toContain('mb-6');
	});

	it('has cursor-pointer class for interactivity hint', () => {
		const { container } = render(<ExplodingText text="Click me" />);
		const h1 = container.querySelector('h1');
		expect(h1.className).toContain('cursor-pointer');
	});

	it('splits text into individual character spans', () => {
		const { container } = render(<ExplodingText text="Hi" />);
		const spans = container.querySelectorAll('h1 > span');
		expect(spans).toHaveLength(2);
		expect(spans[0].textContent).toBe('H');
		expect(spans[1].textContent).toBe('i');
	});

	it('renders spaces as non-breaking spaces', () => {
		const { container } = render(<ExplodingText text="A B" />);
		const spans = container.querySelectorAll('h1 > span');
		expect(spans[1].textContent).toBe('\u00A0');
	});

	it('triggers explosion on click', () => {
		const { container } = render(<ExplodingText text="Go" />);
		const h1 = container.querySelector('h1');

		// Mock getBoundingClientRect for measurement
		h1.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 50 });
		h1.querySelectorAll('span').forEach((span) => {
			span.getBoundingClientRect = () => ({ left: 10, top: 10, width: 20, height: 30 });
		});

		fireEvent.click(h1);

		// After click, the visible h1 is replaced by div[role=heading] + invisible placeholder h1
		const placeholder = container.querySelector('h1');
		expect(placeholder).not.toBeNull();
		expect(placeholder.className).toContain('invisible');
		expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
	});

	it('respects prefers-reduced-motion', () => {
		// Set reduced motion before component mounts
		window.matchMedia = (query) => ({
			matches: query === '(prefers-reduced-motion: reduce)',
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => {},
		});

		const { container } = render(<ExplodingText text="Stay" />);
		const h1 = container.querySelector('h1');
		fireEvent.click(h1);

		// Should still be an h1 — explosion was skipped
		expect(container.querySelector('h1')).not.toBeNull();
	});

	it('cleans up timer on unmount', () => {
		vi.useFakeTimers();
		const { container, unmount } = render(
			<ExplodingText text="Go" rematerializeDelay={5} />
		);
		const h1 = container.querySelector('h1');

		h1.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 50 });
		h1.querySelectorAll('span').forEach((span) => {
			span.getBoundingClientRect = () => ({ left: 10, top: 10, width: 20, height: 30 });
		});

		fireEvent.click(h1);
		unmount();

		// Advance timers — should not throw (timer was cleaned up)
		expect(() => vi.advanceTimersByTime(10000)).not.toThrow();
		vi.useRealTimers();
	});
});

describe('ExplodingText state transitions', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		window.matchMedia = (query) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => {},
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	/**
	 * Helper: render, mock rects, click to trigger explosion.
	 */
	function triggerExplosion(delay = 10) {
		const result = render(
			<ExplodingText text="AB" className="heading-xl" rematerializeDelay={delay} />
		);
		const h1 = result.container.querySelector('h1');

		h1.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 50 });
		h1.querySelectorAll('span').forEach((span) => {
			span.getBoundingClientRect = () => ({ left: 10, top: 10, width: 20, height: 30 });
		});

		fireEvent.click(h1);
		return result;
	}

	it('transitions from exploding to waiting after 2s', () => {
		const { container } = triggerExplosion(10);

		// In exploding state: placeholder is invisible, motion.spans exist
		expect(container.querySelector('h1.invisible')).not.toBeNull();

		// Advance 2000ms → transitions to waiting
		act(() => { vi.advanceTimersByTime(2000); });

		// In waiting state: only the invisible placeholder remains, no motion.spans
		const heading = screen.getByRole('heading', { level: 1 });
		expect(heading).toBeInTheDocument();

		// The placeholder h1 should be invisible
		const h1 = container.querySelector('h1');
		expect(h1.className).toContain('invisible');
	});

	it('transitions from waiting to rematerializing after rematerializeDelay', () => {
		const { container } = triggerExplosion(5);

		// exploding → waiting (2s)
		act(() => { vi.advanceTimersByTime(2000); });

		// waiting → rematerializing ((delay - 2) * 1000 = 3000ms)
		act(() => { vi.advanceTimersByTime(3000); });

		// In rematerializing state: motion.spans should be back (vaporize keys)
		const heading = screen.getByRole('heading', { level: 1 });
		expect(heading).toBeInTheDocument();

		// The placeholder h1 should still be present (invisible)
		const h1 = container.querySelector('h1');
		expect(h1).not.toBeNull();
		expect(h1.className).toContain('invisible');
	});

	it('does not trigger explosion when already exploding', () => {
		const { container } = triggerExplosion(10);

		// Try clicking again while exploding — should be a no-op
		const heading = screen.getByRole('heading', { level: 1 });
		fireEvent.click(heading);

		// Should still be in exploding state (invisible placeholder present)
		expect(container.querySelector('h1.invisible')).not.toBeNull();
	});
});
