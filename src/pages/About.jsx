import { motion } from 'framer-motion';
import {
	CodeBracketIcon,
	ArrowPathIcon,
	CommandLineIcon,
	RocketLaunchIcon,
	WrenchScrewdriverIcon,
	CpuChipIcon,
	BeakerIcon,
	ServerStackIcon,
	BoltIcon,
	DevicePhoneMobileIcon,
	ComputerDesktopIcon,
	GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router';
import AnimatedSection from '../components/AnimatedSection';
import ExplodingText from '../components/ExplodingText';
import { spawnRipple } from '../utils/ripple';

const skills = [
	{ label: 'Development', icon: CodeBracketIcon },
	{ label: 'CI/CD', icon: ArrowPathIcon },
	{ label: 'Automation', icon: BoltIcon },
	{ label: 'Dev Productivity', icon: RocketLaunchIcon },
	{ label: 'DevOps', icon: WrenchScrewdriverIcon },
	{ label: 'Scripting', icon: CommandLineIcon },
	{ label: 'Deployment', icon: ServerStackIcon },
	{ label: 'Testing', icon: BeakerIcon },
	{ label: 'SysOps', icon: CpuChipIcon },
	{ label: 'Device Management', icon: DevicePhoneMobileIcon },
	{ label: 'macOS', icon: ComputerDesktopIcon },
	{ label: 'Cross-Platform Mobile', icon: GlobeAltIcon },
];

function About() {
	return (
		<div className="section-container py-24">
			{/* Intro */}
			<AnimatedSection>
				<ExplodingText text="About Me" className="heading-xl mb-6" />
			</AnimatedSection>
			<AnimatedSection delay={0.1}>
				<p className="text-body max-w-2xl mb-3">
					Engineer with a focus on developer tooling, automation, and making
					systems work reliably at scale. I enjoy building infrastructure
					that gets out of the way and lets people ship... when its supposed to
				</p>
				<p className="font-mono text-sm text-accent mb-16">
					&quot;I&rsquo;m just another man in love with his computer&quot;
				</p>
			</AnimatedSection>

			{/* Easter egg link */}
			<AnimatedSection delay={0.8} className="mt-16">
				<p className="text-sm text-red-400/50">
					Curious what I know about you?{' '}
					<Link
						to="/about-you"
						className="text-red-400/60 hover:text-red-400 transition-colors duration-200 underline underline-offset-4"
					>
						Find out
					</Link>
				</p>
				<br/>
				<br/>
				<br/>
			</AnimatedSection>

			{/* Skill grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{skills.map((skill, i) => (
					<AnimatedSection key={skill.label} delay={i * 0.06}>
						<motion.div
							whileHover={{ scale: 1.02, y: -2 }}
							transition={{ type: 'spring', stiffness: 300, damping: 20 }}
							className="card card-inner-highlight ripple-container flex items-center gap-4 cursor-pointer"
							onClick={spawnRipple}
						>
							<skill.icon className="w-6 h-6 text-accent shrink-0" />
							<span className="text-sm font-medium font-display text-neutral-200">
								{skill.label}
							</span>
						</motion.div>
					</AnimatedSection>
				))}
			</div>

		</div>
	);
}

export default About;
