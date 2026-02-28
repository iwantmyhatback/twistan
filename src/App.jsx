import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, useRouteError, Link } from 'react-router';
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

/** Catches errors thrown by child routes (renders inside Layout). */
function RouteErrorBoundary() {
	const error = useRouteError();
	const is404 = error?.status === 404;
	return (
		<div className="section-container min-h-[80vh] flex flex-col items-center justify-center text-center">
			<h1 className="text-[8rem] md:text-[10rem] font-bold leading-none text-white glitch-text">
				{is404 ? '404' : 'Error'}
			</h1>
			<p className="text-body mb-8 mt-4">
				{is404 ? 'This page wandered off' : 'Something broke'}
			</p>
			<Link
				to="/"
				className="text-sm text-neutral-400 hover:text-white underline underline-offset-4 transition-colors duration-200"
			>
				Back to home
			</Link>
		</div>
	);
}

/** Root-level fallback when even Layout fails to render. */
function RootErrorBoundary() {
	const error = useRouteError();
	return (
		<div className="min-h-screen bg-surface flex flex-col items-center justify-center text-center px-4">
			<h1 className="text-6xl font-bold text-white mb-4">Oops</h1>
			<p className="text-neutral-400 mb-8">
				{error?.message || 'Something went wrong'}
			</p>
			<a
				href="/"
				className="text-sm text-neutral-400 hover:text-white underline underline-offset-4 transition-colors duration-200"
			>
				Back to home
			</a>
		</div>
	);
}

const router = createBrowserRouter([
	{
		element: <Layout />,
		errorElement: <RootErrorBoundary />,
		children: [
			{ path: '/', element: <Suspense fallback={<PageLoader />}><Home /></Suspense>, errorElement: <RouteErrorBoundary /> },
			{ path: '/about', element: <Suspense fallback={<PageLoader />}><About /></Suspense>, errorElement: <RouteErrorBoundary /> },
			{ path: '/projects', element: <Suspense fallback={<PageLoader />}><Projects /></Suspense>, errorElement: <RouteErrorBoundary /> },
			{ path: '/contact', element: <Suspense fallback={<PageLoader />}><Contact /></Suspense>, errorElement: <RouteErrorBoundary /> },
			{ path: '/about-you', element: <Suspense fallback={<PageLoader />}><AboutYou /></Suspense>, errorElement: <RouteErrorBoundary /> },
			{ path: '*', element: <Suspense fallback={<PageLoader />}><NotFound /></Suspense> },
		],
	},
]);

function App() {
	return <RouterProvider router={router} />;
}

export default App;
