import { useState } from 'react';
import { NavLink, Link } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import menuImage from '../assets/avatar.png';

const navLinks = [
	{ name: 'Home', to: '/' },
	{ name: 'About', to: '/about' },
	{ name: 'Projects', to: '/projects' },
	{ name: 'Contact', to: '/contact' },
];

/**
 * Fixed glassmorphism navbar with centered "Twistan" brand.
 */
function Navbar() {
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

				{/* Center: brand */}
				<Link to="/" viewTransition className="font-display text-2xl font-bold text-white lowercase brand-glow justify-self-center leading-none">
					Twistan
				</Link>

				{/* Right: avatar */}
				<a href="https://github.com/iwantmyhatback" target="_blank" rel="noopener noreferrer" className="shrink-0 justify-self-end">
					<img
						src={menuImage}
						alt="Twistan avatar"
						className="h-9 w-9 rounded-full hover:brightness-125 transition-all duration-200"
					/>
				</a>
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
