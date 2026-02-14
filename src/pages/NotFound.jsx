import { Link } from 'react-router-dom';
import AnimatedSection from '../components/AnimatedSection';

function NotFound() {
	return (
		<div className="section-container min-h-[80vh] flex flex-col items-center justify-center text-center">
			<AnimatedSection>
				<h1 className="text-[8rem] md:text-[10rem] font-bold leading-none text-white select-none glitch-text">
					404
				</h1>
			</AnimatedSection>
			<AnimatedSection delay={0.15}>
				<p className="text-body mb-8">This page wandered off</p>
			</AnimatedSection>
			<AnimatedSection delay={0.3}>
				<Link
					to="/"
					className="text-sm text-neutral-400 hover:text-white underline underline-offset-4 transition-colors duration-200"
				>
					Back to home
				</Link>
			</AnimatedSection>

			<style>{`
				.glitch-text {
					animation: glitch 3s infinite;
				}
				@keyframes glitch {
					0%, 90%, 100% { text-shadow: none; }
					92% { text-shadow: -2px 0 #3b82f6, 2px 0 #ef4444; }
					94% { text-shadow: 2px 0 #3b82f6, -2px 0 #ef4444; }
					96% { text-shadow: -1px 0 #3b82f6, 1px 0 #ef4444; }
					98% { text-shadow: 1px 0 #3b82f6, -1px 0 #ef4444; }
				}
			`}</style>
		</div>
	);
}

export default NotFound;
