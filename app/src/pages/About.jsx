

function About() {
	return (
		<div>
			<AboutText/>
			<AboutGrid/>
		</div>
	);
}


const AboutText = () => {
	return (
		<div className="flex flex-col text-center">
			<div className="header-base">[ About Me ]</div>
			<div className="paragraph-txt-size">I&lsquo;m just another man in love with his computer</div>
			<br/>
		</div>
	);
};

function AboutGrid() {
	return (
		<div className="about-grid-container">
			<div className="about-grid-element">Development</div>
			<div className="about-grid-element">Continuous Integration</div>
			<div className="about-grid-element">Automation</div>
			<div className="about-grid-element">Developer Productivity</div>
			<div className="about-grid-element">DevOps</div>
			<div className="about-grid-element">Scripting</div>
			<div className="about-grid-element">Deployment</div>
			<div className="about-grid-element">Testing</div>
			<div className="about-grid-element">SysOps</div>
		</div>
	);
}

export default About;