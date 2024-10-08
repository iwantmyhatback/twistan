import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Navbar from './Navbar';

function App() {
	return (
		<BrowserRouter>
				<Navbar />
				<div className="application-base">
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/about" element={<About />} />
					</Routes>
				</div>
			</BrowserRouter>
	);
}

export default App;
