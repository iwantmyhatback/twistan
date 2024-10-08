import { useState } from 'react';
import { Bars3Icon, MinusIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import menuImage from "./assets/avatar.png";
	
	
function Navbar() {
	let Links = [
		{ name: 'Home', link: '/', active: false },
		{ name: 'About', link: '/about', active: false },
	]

	let [isOpen, setIsOpen] = useState(false);
	
	return (
		<div className="navbar-base">
			{/* Make the flex container full width and space between elements */}
			<div className="px-4 flex items-center justify-between w-full">
				{/* Left side - menu icon and links */}
				<div className="flex items-center">
					{/* menu icon */}
					<div onClick={() => setIsOpen(!isOpen)} className='navbar-graphic'>
						{isOpen ? <MinusIcon key="x-icon"/> : <Bars3Icon key="bars3-icon"/>}
					</div>
					{/* Links */}
					<ul className={`flex transition-opacity ease-in-out delay-100 duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
						{
							Links.map(link => (
								<li key={link.name} className={`navbar-element ${isOpen ? '' : 'hidden'}`}>
									<Link to={link.link}>{link.name}</Link>
								</li>
							))
						}
					</ul>
				</div>

				{/* Right side - logo */}
				<div className="navbar-graphic" key="foo">
					<a href="/">
						<img src={menuImage} alt="logo" />
					</a>
				</div>
			</div>
		</div>
	);
}

export default Navbar;
