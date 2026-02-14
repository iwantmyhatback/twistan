import { motion } from 'framer-motion';

/**
 * Scroll-triggered fade-in-up animation wrapper.
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 * @param {number} [props.delay] - Animation delay in seconds
 */
function AnimatedSection({ children, className = '', delay = 0 }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 24 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: '-50px' }}
			transition={{ duration: 0.5, delay, ease: 'easeOut' }}
			className={className}
		>
			{children}
		</motion.div>
	);
}

export default AnimatedSection;
