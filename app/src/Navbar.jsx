import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid'
import { Link } from 'react-router-dom'
import menuImage from "./assets/avatar.png";
	
	
export default function Navbar() {
	let Links = [
		{ name: 'Home', link: '/', active: false },
		{ name: 'About', link: '/about', active: false },
	]

	let [isOpen, setIsOpen] = useState(false);
	
	return (
		<div className="font-display sticky w-full py-2 text-slate-300 bg-zinc-900 shadow-md drop-shadow-lg">
			<div className="px-4 md:flex">
				{/* logo */}
				<div className="flex cursor-pointer items-center pr-4 h-10 w-10">
					<img className="hover:brightness-90" src={menuImage}/>
				</div>
				{/* menu icon */}
				<div onClick={() => setIsOpen(!isOpen)} className='h-10 w-10 cursor-pointer'>
					{isOpen ? <XMarkIcon/> : <Bars3Icon/>}
				</div>
				<ul className={`flex md:items-center ${isOpen ? '' : 'hidden'}`}>
					{
						Links.map(link => (
							<li key={link.name} className="text-s p-2 font-semibold md:ml-8">
								<Link to={link.link}>{link.name}</Link>
							</li>
						))
					}
				</ul>
			</div>
		</div>
	);
}