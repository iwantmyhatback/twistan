/**
 * Footer component tests.
 * Tests rendering, GitHub link, YearEasterEgg typewriter, and
 * FooterGitHub hacker-mode hold interaction.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Footer from '../src/components/Footer';

describe('Footer - static rendering', () => {
	it('renders copyright with current year', () => {
		render(<Footer />);
		const year = new Date().getFullYear().toString();
		expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
	});

	it('renders brand name', () => {
		render(<Footer />);
		expect(screen.getByText(/twistan/i)).toBeInTheDocument();
	});

	it('renders GitHub link with correct attributes', () => {
		render(<Footer />);
		const link = screen.getByRole('link', { name: /github/i });
		expect(link).toHaveAttribute('href', 'https://github.com/iwantmyhatback');
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('rel', 'noopener noreferrer');
	});
});

describe('Footer - YearEasterEgg', () => {
	beforeEach(() => { vi.useFakeTimers(); });
	afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

	it('year button is clickable and shows no typewriter text initially', () => {
		render(<Footer />);
		const year = new Date().getFullYear().toString();
		const btn = screen.getByRole('button', { name: /click for a secret/i });
		expect(btn).toHaveTextContent(year);
		expect(screen.queryByText(/days since/i)).not.toBeInTheDocument();
	});

	it('clicking year button starts typewriter reveal', () => {
		render(<Footer />);
		const btn = screen.getByRole('button', { name: /click for a secret/i });
		fireEvent.click(btn);

		// Advance enough for a few characters to appear
		act(() => { vi.advanceTimersByTime(200); });

		// Some text should have appeared
		const mono = document.querySelector('.text-terminal');
		expect(mono).not.toBeNull();
	});

	it('typewriter eventually shows full message', () => {
		render(<Footer />);
		const btn = screen.getByRole('button', { name: /click for a secret/i });
		fireEvent.click(btn);

		// Full message: "days since last bugfix was deployed: X" — 55ms per char, max ~45 chars ≈ 2500ms
		act(() => { vi.advanceTimersByTime(5000); });

		expect(screen.getByText(/days since last bugfix was deployed/i)).toBeInTheDocument();
	});

	it('second click on year button after reveal is a no-op', () => {
		render(<Footer />);
		const btn = screen.getByRole('button', { name: /click for a secret/i });
		fireEvent.click(btn);
		act(() => { vi.advanceTimersByTime(5000); });

		// Click again — should not throw or reset
		fireEvent.click(btn);
		expect(screen.getByText(/days since last bugfix was deployed/i)).toBeInTheDocument();
	});
});

describe('Footer - FooterGitHub hacker mode', () => {
	beforeEach(() => { vi.useFakeTimers(); });
	afterEach(() => {
		vi.clearAllTimers();
		vi.useRealTimers();
		document.body.classList.remove('hacker-mode');
	});

	it('mousedown shows ping ring (holding indicator)', () => {
		render(<Footer />);
		const link = screen.getByRole('link', { name: /github/i });
		fireEvent.mouseDown(link);

		// Ping ring span should appear
		const ring = document.querySelector('.animate-ping');
		expect(ring).not.toBeNull();
	});

	it('mouseup before 5s cancels hold — no hacker mode', () => {
		render(<Footer />);
		const link = screen.getByRole('link', { name: /github/i });
		fireEvent.mouseDown(link);
		act(() => { vi.advanceTimersByTime(1000); });
		fireEvent.mouseUp(link);
		act(() => { vi.advanceTimersByTime(5000); });

		expect(document.body.classList.contains('hacker-mode')).toBe(false);
	});

	it('mouseleave before 5s cancels hold — no hacker mode', () => {
		render(<Footer />);
		const link = screen.getByRole('link', { name: /github/i });
		fireEvent.mouseDown(link);
		act(() => { vi.advanceTimersByTime(2000); });
		fireEvent.mouseLeave(link);
		act(() => { vi.advanceTimersByTime(5000); });

		expect(document.body.classList.contains('hacker-mode')).toBe(false);
	});

	it('5s hold adds hacker-mode class to body', () => {
		render(<Footer />);
		const link = screen.getByRole('link', { name: /github/i });
		fireEvent.mouseDown(link);
		act(() => { vi.advanceTimersByTime(5000); });

		expect(document.body.classList.contains('hacker-mode')).toBe(true);
	});

	it('hacker mode deactivates after 5s and removes body class', () => {
		render(<Footer />);
		const link = screen.getByRole('link', { name: /github/i });
		fireEvent.mouseDown(link);
		act(() => { vi.advanceTimersByTime(5000); }); // activate
		act(() => { vi.advanceTimersByTime(5000); }); // deactivate

		expect(document.body.classList.contains('hacker-mode')).toBe(false);
	});

	it('unmounting cleans up body class', () => {
		const { unmount } = render(<Footer />);
		const link = screen.getByRole('link', { name: /github/i });
		fireEvent.mouseDown(link);
		act(() => { vi.advanceTimersByTime(5000); });
		expect(document.body.classList.contains('hacker-mode')).toBe(true);

		unmount();
		expect(document.body.classList.contains('hacker-mode')).toBe(false);
	});

	it('click prevents navigation during hold', () => {
		render(<Footer />);
		const link = screen.getByRole('link', { name: /github/i });
		// onClick calls e.preventDefault() — no JS error should be thrown
		expect(() => fireEvent.click(link)).not.toThrow();
	});
});
