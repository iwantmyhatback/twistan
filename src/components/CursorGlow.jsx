import { useEffect, useRef } from 'react';

/**
 * Subtle animated film grain/noise overlay on desktop.
 * Uses a canvas to render a faint noise texture that updates slowly.
 * Guarded by media query — animation loop only runs on lg+ screens.
 */
function CursorGlow() {
	const canvasRef = useRef(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const mq = window.matchMedia('(min-width: 1024px)');
		if (!mq.matches) return;

		const ctx = canvas.getContext('2d');
		let animId;
		let lastFrame = 0;
		const FPS_INTERVAL = 1000 / 8; // Low framerate for subtle effect

		const resize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};
		resize();
		window.addEventListener('resize', resize);

		const renderNoise = (timestamp) => {
			animId = requestAnimationFrame(renderNoise);
			if (timestamp - lastFrame < FPS_INTERVAL) return;
			lastFrame = timestamp;

			const w = canvas.width;
			const h = canvas.height;
			const imageData = ctx.createImageData(w, h);
			const data = imageData.data;

			for (let i = 0; i < data.length; i += 4) {
				const v = Math.random() * 255;
				data[i] = v;
				data[i + 1] = v;
				data[i + 2] = v;
				data[i + 3] = 8; // Very faint opacity
			}

			ctx.putImageData(imageData, 0, 0);
		};

		animId = requestAnimationFrame(renderNoise);

		const handleChange = (e) => {
			if (!e.matches) {
				cancelAnimationFrame(animId);
				window.removeEventListener('resize', resize);
			}
		};
		mq.addEventListener('change', handleChange);

		return () => {
			cancelAnimationFrame(animId);
			window.removeEventListener('resize', resize);
			mq.removeEventListener('change', handleChange);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="hidden lg:block fixed inset-0 pointer-events-none z-30"
			style={{ mixBlendMode: 'overlay' }}
		/>
	);
}

export default CursorGlow;
