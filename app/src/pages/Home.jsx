import { useState } from 'react';

function Home() {
	const images = [
		"https://c.tenor.com/Qy5sUxL5phgAAAAC/tenor.gif",
		"https://i.giphy.com/3bc9YL28QWi3pYzi1p.webp",
		"https://i.giphy.com/WpIPS0DWNpMm4kfMVr.webp",
		"https://i.giphy.com/Xev2JdopBxGj1LuGvt.webp",
		"https://i.giphy.com/IThjAlJnD9WNO.webp",
		"https://i.giphy.com/ASd0Ukj0y3qMM.webp",
		"https://i.giphy.com/PK1YQhAoBOpP2.webp",
		"https://i.giphy.com/8vc2rMUDjhy6Y.webp",
		"https://i.giphy.com/W3keANaGsQLC5Ri8DM.webp",
		"https://i.giphy.com/13TXV4kfn7r2iA.webp",
		"https://i.giphy.com/8LDHJbotKQyp99YZCQ.webp",
		"https://i.giphy.com/8JQOSCa7aJSbtVke4X.webp",
		"https://i.giphy.com/JRgtgsZQSNYA5wEA6d.webp",
		"https://c.tenor.com/59_-QOhxOcIAAAAC/tenor.gif",
		"https://media.tenor.com/Feqwt9mkzq0AAAAM/2pac-waves.gif",
		"https://media.tenor.com/neqnFd4CHWAAAAAM/up-wave.gif"
	];

	const [imgUrl, setImgUrl] = useState(images[0]);
	const [fade, setFade] = useState(false);

	const handleNewImage = () => {
		setFade(true);
		setTimeout(() => {
			let newImg = getRandomElementSecure(images)
			while(imgUrl == newImg){
				newImg = getRandomElementSecure(images)
			}
			setImgUrl(newImg);
			setFade(false); 
		}, 300); 
	};

	return (
		<div className="">
			<div className="flex-col translate-y-[-10vh]">
				<div className="header-base flex justify-center">
					[ Twistan says hello ]
				</div>
				<div className='flex justify-center'>
					<img
						src={imgUrl}
						alt="Wave"
						className={`transition-opacity duration-300 ${fade ? 'opacity-0' : 'opacity-100'}`} 
					/>
				</div>
			</div>
			<div className="flex justify-center mt-4">
				<button
					className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
					onClick={handleNewImage}
				>
					Change Image
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