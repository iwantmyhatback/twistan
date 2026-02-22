import { useState, useRef, useCallback, useEffect } from 'react';
import { NavLink, Link } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import menuImage from '../assets/avatar.png';
import { spawnConfetti } from '../utils/confetti';

const navLinks = [
	{ name: 'Home', to: '/' },
	{ name: 'About', to: '/about' },
	{ name: 'Projects', to: '/projects' },
	{ name: 'Contact', to: '/contact' },
];

/** August 5 — Twistan's birthday. Month is 0-indexed. */
const today = new Date();
const IS_BIRTHDAY = today.getMonth() === 7 && today.getDate() === 5;

/**
 * Cake button shown only on August 5.
 * Clicking drops a confetti shower across the viewport.
 */
function BirthdayCake() {
	return (
		<button
			onClick={() => spawnConfetti()}
			className="text-xl leading-none cursor-pointer hover:scale-125 transition-transform duration-200"
			aria-label="It's Twistan's birthday!"
		>
			🎂
		</button>
	);
}

/**
 * Avatar link to GitHub with a speech bubble to the left.
 * Shows "it's twistan's birthday!" by default on birthdays,
 * otherwise shows "zZzZzZ" when idle.
 * Bubble tail points right toward the avatar.
 *
 * @param {{ isIdle: boolean, isBirthday: boolean }} props
 */
function AvatarGitHub({ isIdle, isBirthday }) {
	const showBubble = isBirthday || isIdle;
	const bubbleText = isBirthday ? "it's my birthday!" : 'zZzZzZ';

	return (
		<div className="flex items-center justify-end gap-2 shrink-0 justify-self-end overflow-hidden">
			<AnimatePresence>
				{showBubble && (
					<motion.div
						key={bubbleText}
						initial={{ opacity: 0, x: 12 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: 12 }}
						transition={{ duration: 0.4 }}
						className="pointer-events-none select-none relative"
					>
						<div className="relative bg-surface-200 border border-surface-400 rounded-lg px-2 py-1 text-xs font-mono text-neutral-400 whitespace-nowrap">
							{bubbleText}
							{/* Tail pointing right toward avatar */}
							<span className="absolute top-1/2 -right-[5px] -translate-y-1/2 w-2 h-2 bg-surface-200 border-t border-r border-surface-400 rotate-45" />
						</div>
					</motion.div>
				)}
			</AnimatePresence>
			<a
				href="https://github.com/iwantmyhatback"
				target="_blank"
				rel="noopener noreferrer"
			>
				<img
					src={menuImage}
					alt="Twistan avatar"
					className="h-9 w-9 rounded-full hover:brightness-125 transition-all duration-200"
				/>
			</a>
		</div>
	);
}

/**
 * Fixed glassmorphism navbar with centered "Twistan" brand.
 *
 * @param {{ isIdle: boolean }} props
 */
function Navbar({ isIdle = false }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<nav className="fixed top-0 left-0 right-0 w-full z-50 bg-surface/80 backdrop-blur-lg border-b border-surface-300">
			<div className="w-full px-4 sm:px-6 lg:px-10 grid grid-cols-3 items-center h-16">
				{/* Left: hamburger + links */}
				<div className="flex items-center gap-6">
					{/* Hamburger (mobile) */}
					<button
						onClick={() => setIsOpen(!isOpen)}
						className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
						aria-label="Toggle menu"
						aria-expanded={isOpen}
					>
						<span
							className={`block w-5 h-px bg-neutral-300 transition-all duration-300 ${
								isOpen ? 'rotate-45 translate-y-[3.5px]' : ''
							}`}
						/>
						<span
							className={`block w-5 h-px bg-neutral-300 transition-all duration-300 ${
								isOpen ? '-rotate-45 -translate-y-[3.5px]' : ''
							}`}
						/>
					</button>

					{/* Desktop links */}
					<ul className="hidden md:flex items-center gap-6">
						{navLinks.map((link) => (
							<li key={link.name}>
								<NavLink
									to={link.to}
									viewTransition
									className={({ isActive }) =>
										`text-sm font-medium transition-all duration-200 ${
											isActive
												? 'text-white nav-active-glow'
												: 'text-neutral-400 hover:text-white'
										}`
									}
								>
									{link.name}
								</NavLink>
							</li>
						))}
					</ul>
				</div>

				{/* Center: brand + birthday discoball */}
				<div className="flex items-center gap-2 justify-self-center">
					<Link to="/" viewTransition className="font-display text-2xl font-bold text-white lowercase brand-glow leading-none">
						Twistan
					</Link>
					{IS_BIRTHDAY && <BirthdayCake />}
				</div>

				{/* Right: avatar (GitHub link + speech bubble) */}
				<AvatarGitHub isIdle={isIdle} isBirthday={IS_BIRTHDAY} />
			</div>

			{/* Mobile menu */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.25, ease: 'easeInOut' }}
						className="md:hidden overflow-hidden bg-surface/95 backdrop-blur-lg border-b border-surface-300"
					>
						<ul className="px-4 sm:px-6 py-4 flex flex-col gap-3">
							{navLinks.map((link) => (
								<li key={link.name}>
									<NavLink
										to={link.to}
										viewTransition
										onClick={() => setIsOpen(false)}
										className={({ isActive }) =>
											`block py-2 text-sm font-medium transition-all duration-200 ${
												isActive
													? 'text-white nav-active-glow'
													: 'text-neutral-400 hover:text-white'
											}`
										}
									>
										{link.name}
									</NavLink>
								</li>
							))}
						</ul>
					</motion.div>
				)}
			</AnimatePresence>
		</nav>
	);
}

export default Navbar;
