import { motion } from 'framer-motion';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import AnimatedSection from '../components/AnimatedSection';

/**
 * Spawns a green ripple at click position inside a target element.
 * @param {React.MouseEvent} e
 */
function spawnRipple(e) {
	const el = e.currentTarget;
	const rect = el.getBoundingClientRect();
	const size = Math.max(rect.width, rect.height);
	const ripple = document.createElement('span');
	ripple.className = 'ripple';
	ripple.style.width = ripple.style.height = `${size}px`;
	ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
	ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
	el.appendChild(ripple);
	ripple.addEventListener('animationend', () => ripple.remove());
}

const projects = [
	{
		title: 'python-wrapper',
		description:
			'Environment stability wrapper for general Python executions, with optional Docker integration.',
		tags: ['Shell', 'Python', 'Docker'],
		url: 'https://github.com/iwantmyhatback/python-wrapper',
	},
	{
		title: 'jellyfin.supplemental',
		description:
			'Send an email with an update about new movies and shows added in the past 7 days.',
		tags: ['Shell', 'Python', 'Jellyfin API', 'Gmail API'],
		url: 'https://github.com/iwantmyhatback/jellyfin.supplemental',
	},
	{
		title: 'twistan',
		description:
			'Personal website built with React, Vite, and Tailwind CSS. Deployed on Cloudflare Pages with serverless functions.',
		tags: ['React', 'Vite', 'Tailwind', 'Cloudflare'],
		url: 'https://github.com/iwantmyhatback/twistan',
	},
	{
		title: 'network-monitor',
		description:
			'LAN monitoring tool for tracking devices and network health.',
		tags: ['Shell', 'Python', 'Mikrotik API', 'Networking'],
		url: 'https://github.com/iwantmyhatback/network-monitor',
	},
	{
		title: 'shell-environment',
		description:
			'Dotfiles and shell configuration for a reproducible development environment across machines.',
		tags: ['Shell', 'Automation', 'macOS'],
		url: 'https://github.com/iwantmyhatback/shell-environment',
	},
	{
		title: 'ds_clean',
		description:
			'Recursively delete all the pesky .DS_Store files that macOS UI generates.',
		tags: ['Rust', 'macOS', 'CLI'],
		url: 'https://github.com/iwantmyhatback/ds_clean',
	},
];

function Projects() {
	return (
		<div className="section-container py-24">
			<AnimatedSection>
				<h1 className="heading-xl mb-3">Projects</h1>
			</AnimatedSection>
			<AnimatedSection delay={0.1}>
				<p className="text-body mb-16">Things I&rsquo;ve built or broken recently in my spare time</p>
			</AnimatedSection>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{projects.map((project, i) => (
					<AnimatedSection key={project.title} delay={i * 0.08}>
						<motion.div
							whileHover={{ scale: 1.01 }}
							transition={{ type: 'spring', stiffness: 300, damping: 20 }}
							className="card card-terminal-hover ripple-container h-full flex flex-col cursor-pointer"
							onClick={spawnRipple}
						>
							<div className="flex items-start justify-between gap-3 mb-3">
								<h3 className="text-lg font-semibold text-white font-mono">
									{project.title}
								</h3>
								{project.url && (
									<a
										href={project.url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-neutral-500 hover:text-accent transition-colors duration-200 flex-shrink-0"
										aria-label={`Open ${project.title}`}
									>
										<ArrowTopRightOnSquareIcon className="w-4 h-4" />
									</a>
								)}
							</div>
							<p className="text-sm text-neutral-400 mb-4 flex-1">
								{project.description}
							</p>
							<div className="flex flex-wrap gap-2">
								{project.tags.map((tag) => (
									<span
										key={tag}
										className="px-2.5 py-0.5 text-xs font-mono text-neutral-400
										           bg-surface-200 border border-surface-300 rounded-full"
									>
										{tag}
									</span>
								))}
							</div>
						</motion.div>
					</AnimatedSection>
				))}
			</div>
		</div>
	);
}

export default Projects;
