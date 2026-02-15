import { Outlet } from 'react-router';
import Navbar from './Navbar';
import Footer from './Footer';
import CursorGlow from './CursorGlow';

/**
 * Shared layout shell: navbar, page content via Outlet, footer.
 * Page transitions handled by View Transitions API via router viewTransition prop.
 */
function Layout() {
	return (
		<div className="min-h-screen flex flex-col">
			<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded">
				Skip to content
			</a>
			<Navbar />
			<CursorGlow />
			<main id="main-content" className="flex-1 pt-16">
				<Outlet />
			</main>
			<Footer />
		</div>
	);
}

export default Layout;
