import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import CursorGlow from './CursorGlow';

const pageVariants = {
	initial: { opacity: 0, y: 12 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -12 },
};

const pageTransition = {
	duration: 0.3,
	ease: 'easeInOut',
};

/**
 * Shared layout shell: navbar, animated page content, footer.
 * @param {object} props
 * @param {React.ReactNode} props.children - Route element to render
 */
function Layout({ children }) {
	const location = useLocation();

	return (
		<div className="min-h-screen flex flex-col">
			<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded">
				Skip to content
			</a>
			<Navbar />
			<CursorGlow />
			<AnimatePresence mode="wait">
				<motion.main
					id="main-content"
					key={location.pathname}
					variants={pageVariants}
					initial="initial"
					animate="animate"
					exit="exit"
					transition={pageTransition}
					className="flex-1 pt-16"
				>
					{children}
				</motion.main>
			</AnimatePresence>
			<Footer />
		</div>
	);
}

export default Layout;
