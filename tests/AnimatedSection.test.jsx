/**
 * AnimatedSection component tests.
 * Tests rendering, prop forwarding, and className handling.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnimatedSection from '../src/components/AnimatedSection';

describe('AnimatedSection', () => {
	it('renders children', () => {
		render(<AnimatedSection><p>Hello</p></AnimatedSection>);
		expect(screen.getByText('Hello')).toBeInTheDocument();
	});

	it('applies custom className', () => {
		const { container } = render(
			<AnimatedSection className="test-class">
				<span>Content</span>
			</AnimatedSection>
		);
		// Framer Motion wraps in a div — check our className is present
		expect(container.querySelector('.test-class')).not.toBeNull();
	});

	it('renders without className prop', () => {
		render(<AnimatedSection><span>No class</span></AnimatedSection>);
		expect(screen.getByText('No class')).toBeInTheDocument();
	});

	it('renders multiple children', () => {
		render(
			<AnimatedSection>
				<p>First</p>
				<p>Second</p>
			</AnimatedSection>
		);
		expect(screen.getByText('First')).toBeInTheDocument();
		expect(screen.getByText('Second')).toBeInTheDocument();
	});
});
