import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid'
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
			<div className="px-4 flex">
				{/* logo */}
				<div className="navbar-graphic">
					<img className="" src={menuImage}/>
				</div>
				{/* menu icon */}
				<div onClick={() => setIsOpen(!isOpen)} className='navbar-graphic'>
					{isOpen ? <XMarkIcon/> : <Bars3Icon/>}
				</div>
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
		</div>
	);
}

export default Navbar