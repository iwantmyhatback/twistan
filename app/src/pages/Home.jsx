import { useState } from 'react';
import ImageUrls from '../assets/ImageUrls';

function Home() {
  const [imgUrl, setImgUrl] = useState(ImageUrls[0]);
  const [fade, setFade] = useState(false);

  
  const handleNewImage = () => {
	setFade(true);
	setTimeout(() => {
	let newImg = getRandomElementSecure(ImageUrls);
		
	while (imgUrl === newImg) {
		newImg = getRandomElementSecure(ImageUrls);
	}
	setImgUrl(newImg);
	setFade(false); 
	}, 300); 
  };

  return (
	<div className="flex flex-col items-center h-screen">
		<div className="w-[600px] h-[600px]">
			<div className="text-center">
				<div className="header-base">
				[ Twistan says hello ]
				</div>
			</div>
			
			{/* Image Container */}
			<div className="flex items-center justify-center mb-4">
				<img
				src={imgUrl}
				alt="Wave"
				className={`transition-opacity duration-300 object-contain max-h-full max-w-full ${fade ? 'opacity-0' : 'opacity-100'}`} 
				/>
			</div>
		</div>

		{/* Button */}
		<div className="fixed bottom-10">
			<button
			className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
			onClick={handleNewImage}
			>
			Wave Back!
			</button>
		</div>
	</div>
  );
}


function getRandomElementSecure(arr) {
  const randomArray = new Uint32Array(1);
  window.crypto.getRandomValues(randomArray);
  const randomIndex = randomArray[0] % arr.length;
  return arr[randomIndex];
}

export default Home;
