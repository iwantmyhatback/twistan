import { Link } from 'react-router-dom';
import { useState } from 'react';

function Home() {
  const [visits, setVisits] = useState('');
  const imageUrl = "https://c.tenor.com/Qy5sUxL5phgAAAAC/tenor.gif";
  return (
    <>
      <div>
        <div className="flex flex-col translate-y-[-10vh]">
          <div className="text-5xl font-extrabold tracking-wide m-10 flex items-center justify-center text-slate-300">
            [ Tristan says hello ]
          </div>
          <div className="m-10 flex items-center justify-center">
            <img src={imageUrl} alt="Image"></img>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;

