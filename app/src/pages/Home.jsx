import { Link } from 'react-router-dom';
import { useState } from 'react';

function Home() {
  const [visits, setVisits] = useState('');
  const imageUrl = "https://c.tenor.com/Qy5sUxL5phgAAAAC/tenor.gif";
  return (
    <>
      <div className="">
        <div className="flex-col translate-y-[-10vh]">
          <div className="header-base flex items-center justify-center">
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

