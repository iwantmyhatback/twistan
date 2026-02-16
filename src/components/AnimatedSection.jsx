import { useRef } from 'react';
import { motion, useInView } from 'motion/react';

/**
 * Scroll-triggered fade-in-up animation wrapper.
 * Uses useInView hook for reliable React 19 compatibility
 * (whileInView prop has issues with React 19's ref handling).
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 * @param {number} [props.delay] - Animation delay in seconds
 */
function AnimatedSection({ children, className = '', delay = 0 }) {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, margin: '-50px' });

	return (
		<motion.div
			ref={ref}
			initial={{ opacity: 0, y: 24 }}
			animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
			transition={{ duration: 0.5, delay, ease: 'easeOut' }}
			className={className}
		>
			{children}
		</motion.div>
	);
}

export default AnimatedSection;
