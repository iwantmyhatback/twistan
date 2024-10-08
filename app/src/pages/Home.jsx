import { useState } from 'react';
import Globe from "../components/Globe"

function Home() {
	const [visits, setVisits] = useState('');
	const imageUrl = "https://c.tenor.com/Qy5sUxL5phgAAAAC/tenor.gif";
	return (
		<>
			<div className="">
				<div className="flex-col translate-y-[-10vh]">
					<div className="header-base flex justify-center">
						[ Twistan says hello ]
					</div>
					<div className=" flex justify-center">
						<img src={imageUrl} alt="Wave"></img>
					</div>
				</div>
			</div>
		</>
	);
}

export default Home;

