import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
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

const router = createBrowserRouter([
	{
		element: <Layout />,
		children: [
			{ path: '/', element: <Suspense fallback={<PageLoader />}><Home /></Suspense> },
			{ path: '/about', element: <Suspense fallback={<PageLoader />}><About /></Suspense> },
			{ path: '/projects', element: <Suspense fallback={<PageLoader />}><Projects /></Suspense> },
			{ path: '/contact', element: <Suspense fallback={<PageLoader />}><Contact /></Suspense> },
			{ path: '/about-you', element: <Suspense fallback={<PageLoader />}><AboutYou /></Suspense> },
			{ path: '*', element: <Suspense fallback={<PageLoader />}><NotFound /></Suspense> },
		],
	},
]);

function App() {
	return <RouterProvider router={router} />;
}

export default App;
