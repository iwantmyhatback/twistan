import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useInView } from 'motion/react';
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

const EASTER_FULL = 'Curious what I know about you? Find out here';
const CHAR_DELAY_MS = 100;

/**
 * Typewriter letter-by-letter reveal of "Curious what I know about you? Find out here"
 * with a blinking block cursor. Starts after a 10s delay once scrolled into view.
 */
function EasterEggReveal() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true });
	const [visibleCount, setVisibleCount] = useState(0);

	useEffect(() => {
		if (!isInView) return;
		let intervalId;
		const timeout = setTimeout(() => {
			let i = 0;
			intervalId = setInterval(() => {
				i++;
				setVisibleCount(i);
				if (i >= EASTER_FULL.length) clearInterval(intervalId);
			}, CHAR_DELAY_MS);
		}, 8000);
		return () => {
			clearTimeout(timeout);
			if (intervalId) clearInterval(intervalId);
		};
	}, [isInView]);

	const linkStart = EASTER_FULL.indexOf('Find out here');

	return (
		<p
			ref={ref}
			className="text-sm text-red-900 font-mono"
			style={{ textShadow: '0 0 8px rgba(153, 27, 27, 0.8), 0 0 20px rgba(127, 29, 29, 0.5)' }}
		>
			{EASTER_FULL.slice(0, linkStart).split('').map((char, i) => (
				<span key={i}>
					{i === visibleCount && <span className="text-red-900" style={{ animation: 'subtle-pulse 0.6s step-end infinite' }} aria-hidden="true">&#9608;</span>}
					<span style={{ visibility: i < visibleCount ? 'visible' : 'hidden' }}>{char}</span>
				</span>
			))}
			<Link
				to="/about-you"
				className="text-red-900 hover:text-red-600 transition-colors duration-200 underline underline-offset-4 font-bold"
			>
				{'Find out here'.split('').map((char, i) => {
					const idx = linkStart + i;
					return (
						<span key={i}>
							{idx === visibleCount && <span className="text-red-900" style={{ animation: 'subtle-pulse 0.6s step-end infinite' }} aria-hidden="true">&#9608;</span>}
							<span style={{ visibility: idx < visibleCount ? 'visible' : 'hidden' }}>{char}</span>
						</span>
					);
				})}
			</Link>
			{visibleCount >= EASTER_FULL.length && (
				<span
					className="text-red-900"
					style={{ animation: 'subtle-pulse 0.6s step-end infinite' }}
					aria-hidden="true"
				>
					{' '}&#9608;
				</span>
			)}
		</p>
	);
}

const BOTTOM_MESSAGES = [
	{ text: 'Loading more skills...', delay: 0 },
	{ text: 'i think hes asleep...', delay: 15000 },
	{ text: 'this might take a while...', delay: 30000 },
];

/**
 * Fake "loading more skills" indicator shown when the user scrolls to the
 * bottom of the skills grid. Displays a spinner and typewriter messages
 * that never resolve — it's an easter egg, not real loading.
 */
/**
 * Fake "loading more skills" shown when the user scrolls to the bottom
 * of the skills grid. CSS spinner + typewriter messages with 20s gaps.
 */
function SkillsBottomEgg() {
	const ref = useRef(null);
	const isAtBottom = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });
	const [phase, setPhase] = useState(0);
	const [charCount, setCharCount] = useState(0);
	const timers = useRef([]);

	const clearTimers = useCallback(() => {
		timers.current.forEach((id) => { clearTimeout(id); clearInterval(id); });
		timers.current = [];
	}, []);

	useEffect(() => {
		if (!isAtBottom) return;
		setPhase(1);

		BOTTOM_MESSAGES.forEach(({ text, delay }, idx) => {
			const t = setTimeout(() => {
				setPhase(idx + 1);
				setCharCount(0);
				let i = 0;
				const charInterval = setInterval(() => {
					i++;
					setCharCount(i);
					if (i >= text.length) clearInterval(charInterval);
				}, 55);
				timers.current.push(charInterval);
			}, delay);
			timers.current.push(t);
		});

		return clearTimers;
	}, [isAtBottom, clearTimers]);

	const currentMsg = phase >= 1 ? BOTTOM_MESSAGES[Math.min(phase - 1, BOTTOM_MESSAGES.length - 1)] : null;
	const displayText = currentMsg ? currentMsg.text.slice(0, charCount) : '';

	return (
		<div ref={ref} className="mt-10 min-h-8 flex items-center justify-center">
			{isAtBottom && (
				<p className="font-mono text-xs text-neutral-600 flex items-center gap-3">
					{/* CSS spinner */}
					<span
						aria-hidden="true"
						className="inline-block w-3 h-3 rounded-full border border-neutral-700 border-t-neutral-500 animate-spin"
					/>
					<span>{displayText}</span>
					{displayText.length > 0 && displayText.length < (currentMsg?.text.length ?? 0) && (
						<span style={{ animation: 'subtle-pulse 0.6s step-end infinite' }} aria-hidden="true">▌</span>
					)}
				</p>
			)}
		</div>
	);
}

function About() {
	return (
		<div className="section-container py-24">
			{/* Intro */}
			<AnimatedSection>
				<ExplodingText text="About Me" className="heading-xl mb-3" />
			</AnimatedSection>
			<AnimatedSection delay={0.1}>
				<p className="font-mono text-sm text-accent mb-3">
					DevOps | Automation | Software Engineer | System Admin
				</p>
				<p className="text-body max-w-2xl mb-3">
					Jack of all trades with extensive experience owning large-scale CI/CD systems for enterprise mobile application development.
					Proven track record leading process modernization, improving developer productivity, and ensuring secure, compliant release pipelines.
					Adept at cross-team collaboration, root-cause analysis, and delivering robust, auditable build systems in highly regulated environments.{/* Easter egg: invisible unless selected — blends into trailing whitespace */}<span className="about-hidden-text" aria-hidden="true"> what are you looking for?</span>
				</p>
				<p className="font-mono text-sm text-accent mb-16">
					&quot;I&rsquo;m just another man in love with his computer&quot;
				</p>
			</AnimatedSection>

			{/* Easter egg link — typewriter reveal + dramatic thump */}
			<AnimatedSection className="mt-16">
				<EasterEggReveal />
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

			{/* Easter egg: fake "loading more" sentinel at the bottom of the skills grid */}
			<SkillsBottomEgg />
		</div>
	);
}

export default About;
