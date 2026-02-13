import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Projects = lazy(() => import('./pages/Projects'));
const Contact = lazy(() => import('./pages/Contact'));
const AboutYou = lazy(() => import('./pages/AboutYou'));
const NotFound = lazy(() => import('./pages/NotFound'));

/** Minimal loading spinner shown during lazy load. */
function PageLoader() {
	return (
		<div className="flex items-center justify-center min-h-[60vh]">
			<div className="w-6 h-6 border-2 border-surface-300 border-t-accent rounded-full animate-spin" />
		</div>
	);
}

/** Inner routing component — needs useLocation inside BrowserRouter. */
function AppRoutes() {
	const location = useLocation();

	return (
		<Layout>
			<Suspense fallback={<PageLoader />}>
				<Routes location={location} key={location.pathname}>
					<Route path="/" element={<Home />} />
					<Route path="/about" element={<About />} />
					<Route path="/projects" element={<Projects />} />
					<Route path="/contact" element={<Contact />} />
					<Route path="/about-you" element={<AboutYou />} />
					<Route path="*" element={<NotFound />} />
				</Routes>
			</Suspense>
		</Layout>
	);
}

function App() {
	return (
		<BrowserRouter>
			<AppRoutes />
		</BrowserRouter>
	);
}

export default App;
