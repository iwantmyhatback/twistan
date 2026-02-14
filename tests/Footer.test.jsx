/**
 * Footer component tests.
 * Tests rendering, GitHub link, and dynamic copyright year.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '../src/components/Footer';

describe('Footer', () => {
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
