import { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import AnimatedSection from '../components/AnimatedSection';

/**
 * AboutYou page - Browser fingerprinting demonstration.
 *
 * Collects comprehensive device/browser data for educational purposes:
 * - Visitor ID (FingerprintJS)
 * - IP geolocation (ipapi.co, ipify.org)
 * - Browser capabilities and installed fonts
 * - Hardware specs (CPU, GPU, memory, screen)
 * - Network info (connection type, local IPs via WebRTC)
 * - Audio/canvas/WebGL fingerprints
 *
 * Privacy: All data is client-side only, not stored or transmitted except
 * to external IP geolocation APIs. Includes prominent privacy disclosure.
 */

const categories = [
	{
		title: 'Visitor ID',
		keys: ['visitorId', 'confidence'],
	},
	{
		title: 'IP & Location',
		keys: ['ipAddress', 'ipLocation', 'isp', 'vpnProxy'],
	},
	{
		title: 'Browser',
		keys: [
			'browser', 'referrer', 'sessionHistory', 'doNotTrack',
			'cookiesEnabled', 'pdfViewer', 'adBlocker', 'incognito',
			'installedPlugins',
		],
	},
	{
		title: 'Hardware',
		keys: [
			'os', 'cpu', 'cpuCores', 'memory', 'screen', 'viewport',
			'devicePixelRatio', 'touchScreen', 'maxTouchPoints', 'gpu',
			'colorGamut', 'hdr',
		],
	},
	{
		title: 'Network',
		keys: ['network', 'onlineStatus', 'localIPs'],
	},
	{
		title: 'Locale & Preferences',
		keys: [
			'timeZone', 'language', 'dateFormat', 'colorScheme',
			'reducedMotion', 'reducedTransparency', 'contrast',
			'forcedColors', 'mathML',
		],
	},
	{
		title: 'Storage & Permissions',
		keys: [
			'cookies', 'localStorage', 'sessionStorage', 'indexedDB',
			'storageEstimate', 'notifications', 'clipboard',
		],
	},
	{
		title: 'Battery',
		keys: ['battery'],
	},
	{
		title: 'Audio',
		keys: ['audioFingerprint', 'audioDevices'],
	},
	{
		title: 'Fonts',
		keys: ['detectedFonts'],
	},
	{
		title: 'Features & APIs',
		keys: [
			'serviceWorker', 'webRTC', 'bluetooth', 'usb', 'midi',
			'gamepads', 'speechSynthesis', 'webGPU', 'webTransport',
			'sharedArrayBuffer', 'webAssembly', 'webShare',
			'persistentStorage', 'webAuthn',
		],
	},
	{
		title: 'Performance',
		keys: ['pageLoadTiming', 'performanceMemory'],
	},
];

/**
 * Format fingerprint data values for display.
 * Handles objects, arrays, booleans, and primitives recursively.
 *
 * @param {any} value
 * @returns {string}
 */
function formatValue(value) {
	if (value === null || value === undefined) return 'N/A';
	if (typeof value === 'boolean') return value ? 'Yes' : 'No';
	if (typeof value === 'object') {
		if (Array.isArray(value)) return value.join(', ') || 'None';
		return Object.entries(value)
			.map(([k, v]) => `${k}: ${formatValue(v)}`)
			.join('\n');
	}
	return String(value);
}

function AboutYou() {
	const [info, setInfo] = useState(null);

	useEffect(() => {
		gatherAllInfo().then(setInfo);
	}, []);

	if (!info) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="w-6 h-6 border-2 border-surface-300 border-t-accent rounded-full animate-spin" />
			</div>
		);
	}

	return (
		<div className="section-container py-24">
			<AnimatedSection>
				<h1 className="heading-xl mb-3">About You</h1>
			</AnimatedSection>
			<AnimatedSection delay={0.1}>
				<p className="text-body mb-4">
					Here&rsquo;s what your browser told me about you
				</p>
			</AnimatedSection>

			<AnimatedSection delay={0.15}>
				<div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4 mb-12">
					<h2 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
						Privacy Notice
					</h2>
					<div className="text-xs text-neutral-300 space-y-2">
						<p>
							This page demonstrates browser fingerprinting for <strong>educational purposes only</strong>.
							The following data is collected entirely <strong>client-side</strong> (in your browser):
						</p>
						<ul className="list-disc list-inside space-y-1 text-neutral-400">
							<li>Device information (CPU, memory, screen, GPU)</li>
							<li>Browser capabilities and installed fonts</li>
							<li>Network details (connection type, local IPs via WebRTC)</li>
							<li>IP geolocation via external APIs (ipapi.co, ipify.org)</li>
							<li>Audio/canvas fingerprints and system preferences</li>
						</ul>
						<p className="pt-2 text-neutral-400">
							<strong>No data is stored or transmitted</strong> to any server except the external
							IP geolocation services mentioned above. All information remains in your browser.
						</p>
					</div>
				</div>
			</AnimatedSection>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{categories.map((cat, i) => {
					const hasData = cat.keys.some((key) => info[key] !== undefined);
					if (!hasData) return null;
					return (
						<AnimatedSection key={cat.title} delay={i * 0.06}>
							<div className="card h-full">
								<h2 className="text-sm font-semibold text-white mb-4">
									{cat.title}
								</h2>
								<div className="space-y-2">
									{cat.keys.map((key) => {
										const value = info[key];
										if (value === undefined) return null;
										return (
											<div key={key}>
												<span className="text-xs text-neutral-500 uppercase tracking-wider">
													{key}
												</span>
												<pre className="font-mono text-xs text-neutral-300 whitespace-pre-wrap break-all mt-0.5">
													{formatValue(value)}
												</pre>
											</div>
										);
									})}
								</div>
							</div>
						</AnimatedSection>
					);
				})}
			</div>

			{info.mediaDevices && info.mediaDevices.length > 0 && (
				<AnimatedSection delay={0.7} className="mt-4">
					<div className="card">
						<h2 className="text-sm font-semibold text-white mb-4">
							Media Devices
						</h2>
						<div className="space-y-1">
							{info.mediaDevices.map((device, idx) => (
								<pre key={idx} className="font-mono text-xs text-neutral-300">
									{device.kind}: {device.label || 'unnamed'}{' '}
									<span className="text-neutral-600">({device.deviceId.slice(0, 8)}...)</span>
								</pre>
							))}
						</div>
					</div>
				</AnimatedSection>
			)}

			{info.canvasFP && (
				<AnimatedSection delay={0.75} className="mt-4">
					<div className="card">
						<h2 className="text-sm font-semibold text-white mb-4">
							Canvas Fingerprint
						</h2>
						<pre className="font-mono text-xs text-neutral-300 whitespace-pre-wrap break-all">
							{info.canvasFP}
						</pre>
					</div>
				</AnimatedSection>
			)}

			{info.webglFP && (
				<AnimatedSection delay={0.8} className="mt-4">
					<div className="card">
						<h2 className="text-sm font-semibold text-white mb-4">
							WebGL Fingerprint
						</h2>
						<pre className="font-mono text-xs text-neutral-300 whitespace-pre-wrap break-all">
							{info.webglFP}
						</pre>
					</div>
				</AnimatedSection>
			)}
		</div>
	);
}

/**
 * Detect installed fonts by measuring canvas text rendering differences.
 * Compares font rendering against baseline fonts to identify available fonts.
 *
 * @returns {string[]} Array of detected font names
 */
function detectFonts() {
	const testFonts = [
		'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Georgia',
		'Impact', 'Lucida Console', 'Lucida Sans Unicode', 'Palatino Linotype',
		'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana',
		'Helvetica', 'Helvetica Neue', 'Futura', 'Avenir',
		'Menlo', 'Monaco', 'Consolas', 'SF Pro', 'SF Mono',
		'Segoe UI', 'Roboto', 'Open Sans', 'Lato', 'Ubuntu',
		'Fira Code', 'JetBrains Mono', 'Source Code Pro',
		'Gill Sans', 'Optima', 'Baskerville', 'Didot', 'Garamond',
		'American Typewriter', 'Copperplate', 'Papyrus', 'Brush Script MT',
	];

	const baseFonts = ['monospace', 'sans-serif', 'serif'];
	const testString = 'mmmmmmmmmmlli';
	const testSize = '72px';

	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	const getWidth = (fontFamily) => {
		ctx.font = `${testSize} ${fontFamily}`;
		return ctx.measureText(testString).width;
	};

	const baseWidths = baseFonts.map(getWidth);

	return testFonts.filter((font) => {
		return baseFonts.some((base, i) => {
			const width = getWidth(`'${font}', ${base}`);
			return width !== baseWidths[i];
		});
	});
}

/**
 * Generate audio fingerprint using AudioContext with oscillator and compressor.
 * Creates unique hash from frequency data for device identification.
 *
 * @returns {Promise<string>} Hex hash of audio fingerprint
 */
async function getAudioFingerprint() {
	try {
		const ctx = new (window.AudioContext || window.webkitAudioContext)();
		const oscillator = ctx.createOscillator();
		const analyser = ctx.createAnalyser();
		const gain = ctx.createGain();
		const compressor = ctx.createDynamicsCompressor();

		compressor.threshold.value = -50;
		compressor.knee.value = 40;
		compressor.ratio.value = 12;
		compressor.attack.value = 0;
		compressor.release.value = 0.25;

		oscillator.type = 'triangle';
		oscillator.frequency.value = 10000;

		oscillator.connect(compressor);
		compressor.connect(analyser);
		analyser.connect(gain);
		gain.gain.value = 0; // muted
		gain.connect(ctx.destination);

		oscillator.start(0);

		await new Promise((resolve) => setTimeout(resolve, 100));

		const freqData = new Float32Array(analyser.frequencyBinCount);
		analyser.getFloatFrequencyData(freqData);

		oscillator.stop();
		await ctx.close();

		let hash = 0;
		for (let i = 0; i < freqData.length; i++) {
			if (freqData[i] !== -Infinity) {
				hash = ((hash << 5) - hash) + Math.round(freqData[i] * 1000);
				hash |= 0;
			}
		}
		return hash.toString(16);
	} catch {
		return 'Not supported';
	}
}

/**
 * Discover local network IP addresses using WebRTC ICE candidates.
 * Creates peer connection and extracts IPs from connection candidates.
 *
 * @returns {Promise<string[]>} Array of local IP addresses
 */
async function getLocalIPs() {
	try {
		const ips = new Set();
		const pc = new RTCPeerConnection({ iceServers: [] });
		pc.createDataChannel('');
		const offer = await pc.createOffer();
		await pc.setLocalDescription(offer);

		return new Promise((resolve) => {
			const timeout = setTimeout(() => {
				pc.close();
				resolve([...ips]);
			}, 3000);

			pc.onicecandidate = (e) => {
				if (!e.candidate) {
					clearTimeout(timeout);
					pc.close();
					resolve([...ips]);
					return;
				}
				const parts = e.candidate.candidate.split(' ');
				const ip = parts[4];
				if (ip && !ip.includes(':') && ip !== '0.0.0.0') {
					ips.add(ip);
				}
			};
		});
	} catch {
		return [];
	}
}

/**
 * Fetch IP geolocation data from external APIs.
 * Tries ipapi.co first (full geolocation), falls back to ipify.org (IP only).
 *
 * @returns {Promise<object>} IP and geolocation data
 */
async function getIPGeolocation() {
	try {
		const resp = await fetch('https://ipapi.co/json/');
		if (!resp.ok) throw new Error('IP API failed');
		const data = await resp.json();
		return {
			ip: data.ip,
			city: data.city,
			region: data.region,
			country: data.country_name,
			countryCode: data.country_code,
			postal: data.postal,
			latitude: data.latitude,
			longitude: data.longitude,
			org: data.org,
			asn: data.asn,
		};
	} catch {
		try {
			const resp = await fetch('https://api.ipify.org?format=json');
			if (!resp.ok) return null;
			const data = await resp.json();
			return { ip: data.ip };
		} catch {
			return null;
		}
	}
}

/**
 * Generate WebGL fingerprint from GPU parameters and supported extensions.
 * Queries WebGL context for hardware capabilities and extension support.
 *
 * @returns {string|null} Fingerprint string or null if WebGL unavailable
 */
function getWebGLFingerprint() {
	try {
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl');
		if (!gl) return null;

		const params = [
			gl.ALIASED_LINE_WIDTH_RANGE,
			gl.ALIASED_POINT_SIZE_RANGE,
			gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS,
			gl.MAX_CUBE_MAP_TEXTURE_SIZE,
			gl.MAX_FRAGMENT_UNIFORM_VECTORS,
			gl.MAX_RENDERBUFFER_SIZE,
			gl.MAX_TEXTURE_IMAGE_UNITS,
			gl.MAX_TEXTURE_SIZE,
			gl.MAX_VARYING_VECTORS,
			gl.MAX_VERTEX_ATTRIBS,
			gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS,
			gl.MAX_VERTEX_UNIFORM_VECTORS,
			gl.MAX_VIEWPORT_DIMS,
		];

		const values = params.map((p) => {
			const v = gl.getParameter(p);
			if (v instanceof Float32Array || v instanceof Int32Array) {
				return Array.from(v).join(',');
			}
			return String(v);
		});

		const extensions = gl.getSupportedExtensions() || [];
		return `params:[${values.join('|')}] extensions:${extensions.length}`;
	} catch {
		return null;
	}
}

/**
 * Gather all browser, device, and network fingerprinting data.
 * Runs async operations in parallel for performance, then assembles results.
 *
 * @returns {Promise<object>} Complete fingerprinting data object
 */
async function gatherAllInfo() {
	const [
		fpResult,
		batteryInfo,
		mediaDevices,
		geolocationInfo,
		storageEstimate,
		audioFP,
		localIPs,
		ipGeo,
	] = await Promise.all([
		FingerprintJS.load().then((fp) => fp.get()).catch(() => null),
		getBatteryInfo(),
		getMediaDevices(),
		getGeolocation(),
		getStorageEstimate(),
		getAudioFingerprint(),
		getLocalIPs(),
		getIPGeolocation(),
	]);

	const detectedFonts = detectFonts();
	const webglFP = getWebGLFingerprint();

	const ua = navigator.userAgent;
	const browserName = (() => {
		if (/edg/i.test(ua)) return 'Edge';
		if (/chrome|crios|crmo/i.test(ua)) return 'Chrome';
		if (/firefox|fxios/i.test(ua)) return 'Firefox';
		if (/safari/i.test(ua)) return 'Safari';
		if (/msie|trident/i.test(ua)) return 'IE';
		return 'Unknown';
	})();

	const platform = navigator.platform;
	const osName = (() => {
		if (/win/i.test(platform)) return 'Windows';
		if (/mac/i.test(platform)) return 'macOS';
		if (/linux/i.test(platform)) return 'Linux';
		if (/android/i.test(ua)) return 'Android';
		if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
		return platform;
	})();

	const connection = navigator.connection || {};
	const mqMatch = (q) => window.matchMedia(q).matches;

	const getPageTiming = () => {
		const perf = performance.getEntriesByType('navigation')[0];
		if (!perf) return null;
		return {
			DNS: `${Math.round(perf.domainLookupEnd - perf.domainLookupStart)}ms`,
			TCP: `${Math.round(perf.connectEnd - perf.connectStart)}ms`,
			TTFB: `${Math.round(perf.responseStart - perf.requestStart)}ms`,
			DOMLoad: `${Math.round(perf.domContentLoadedEventEnd - perf.startTime)}ms`,
			FullLoad: `${Math.round(perf.loadEventEnd - perf.startTime)}ms`,
		};
	};

	const getPerfMemory = () => {
		const mem = performance.memory;
		if (!mem) return null;
		const fmt = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
		return {
			jsHeapLimit: fmt(mem.jsHeapSizeLimit),
			jsHeapUsed: fmt(mem.usedJSHeapSize),
			jsHeapTotal: fmt(mem.totalJSHeapSize),
		};
	};

	const getPlugins = () => {
		const plugins = [];
		for (let i = 0; i < navigator.plugins.length; i++) {
			plugins.push(navigator.plugins[i].name);
		}
		return plugins.length > 0 ? plugins : null;
	};

	const result = {
		visitorId: fpResult?.visitorId || 'Unavailable',
		confidence: fpResult?.confidence?.score
			? `${(fpResult.confidence.score * 100).toFixed(1)}%`
			: 'N/A',

		// IP & Location
		ipAddress: ipGeo?.ip || 'Unavailable',
		ipLocation: ipGeo
			? [ipGeo.city, ipGeo.region, ipGeo.country].filter(Boolean).join(', ') || 'Unknown'
			: 'Unavailable',
		isp: ipGeo?.org || 'Unknown',
		vpnProxy: ipGeo?.asn ? `ASN: ${ipGeo.asn}` : 'Unknown',

		// Browser
		browser: { name: browserName, userAgent: ua },
		referrer: document.referrer || 'Direct',
		sessionHistory: window.history.length,
		doNotTrack: navigator.doNotTrack === '1',
		cookiesEnabled: navigator.cookieEnabled,
		pdfViewer: navigator.pdfViewerEnabled ?? 'Unknown',
		adBlocker: fpResult?.components?.adBlock?.value ?? 'Unknown',
		incognito: fpResult?.components?.privateClickMeasurement?.value != null ? 'Possible' : 'No',
		installedPlugins: getPlugins(),

		// Hardware
		os: { name: osName, platform },
		cpu: {
			architecture: /x64|x86_64|amd64/i.test(ua) ? 'x86-64' :
				/arm64|aarch64/i.test(ua) ? 'ARM64' : navigator.platform,
		},
		cpuCores: navigator.hardwareConcurrency || 'Unknown',
		memory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'Unknown',
		screen: {
			resolution: `${screen.width}x${screen.height}`,
			available: `${screen.availWidth}x${screen.availHeight}`,
			colorDepth: `${screen.colorDepth}-bit`,
			orientation: screen.orientation?.type || 'Unknown',
		},
		viewport: {
			inner: `${window.innerWidth}x${window.innerHeight}`,
			outer: `${window.outerWidth}x${window.outerHeight}`,
		},
		devicePixelRatio: window.devicePixelRatio,
		touchScreen: navigator.maxTouchPoints > 0,
		maxTouchPoints: navigator.maxTouchPoints,
		gpu: (() => {
			try {
				const c = document.createElement('canvas');
				const gl = c.getContext('webgl');
				if (!gl) return 'Not available';
				const dbg = gl.getExtension('WEBGL_debug_renderer_info');
				if (!dbg) return 'No debug info';
				return {
					vendor: gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL),
					renderer: gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL),
				};
			} catch {
				return 'Error';
			}
		})(),
		colorGamut: mqMatch('(color-gamut: p3)') ? 'P3 (wide)' :
			mqMatch('(color-gamut: srgb)') ? 'sRGB' : 'Unknown',
		hdr: mqMatch('(dynamic-range: high)'),

		// Network
		network: {
			effectiveType: connection.effectiveType || 'Unknown',
			downlink: connection.downlink ? `${connection.downlink} Mbps` : 'Unknown',
			rtt: connection.rtt ? `${connection.rtt} ms` : 'Unknown',
			saveData: connection.saveData || false,
		},
		onlineStatus: navigator.onLine,
		localIPs: localIPs.length > 0 ? localIPs : 'Hidden or unavailable',

		// Locale & Preferences
		timeZone: {
			zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			offset: `UTC${new Date().getTimezoneOffset() > 0 ? '-' : '+'}${Math.abs(new Date().getTimezoneOffset() / 60)}`,
		},
		language: { primary: navigator.language, all: navigator.languages?.join(', ') },
		dateFormat: new Intl.DateTimeFormat().resolvedOptions().locale,
		colorScheme: mqMatch('(prefers-color-scheme: dark)') ? 'Dark' : 'Light',
		reducedMotion: mqMatch('(prefers-reduced-motion: reduce)'),
		reducedTransparency: mqMatch('(prefers-reduced-transparency: reduce)'),
		contrast: mqMatch('(prefers-contrast: more)') ? 'High' :
			mqMatch('(prefers-contrast: less)') ? 'Low' : 'Normal',
		forcedColors: mqMatch('(forced-colors: active)'),
		mathML: (() => {
			try {
				const el = document.createElement('math');
				return typeof el.namespaceURI !== 'undefined' && el.namespaceURI.includes('MathML');
			} catch {
				return false;
			}
		})(),

		// Storage & Permissions
		cookies: document.cookie || 'None',
		localStorage: { keys: Object.keys(localStorage).length },
		sessionStorage: { keys: Object.keys(sessionStorage).length },
		indexedDB: 'indexedDB' in window ? 'Supported' : 'Not supported',
		storageEstimate,
		notifications: 'Notification' in window ? Notification.permission : 'Not supported',
		clipboard: 'clipboard' in navigator ? 'Supported' : 'Not supported',

		// Battery
		battery: batteryInfo,

		// Audio
		audioFingerprint: audioFP,
		audioDevices: mediaDevices
			?.filter((d) => d.kind.includes('audio'))
			.map((d) => `${d.kind}: ${d.label || 'unnamed'}`) || [],

		// Fonts
		detectedFonts,

		// Features & APIs
		serviceWorker: 'serviceWorker' in navigator,
		webRTC: !!window.RTCPeerConnection,
		bluetooth: 'bluetooth' in navigator,
		usb: 'usb' in navigator,
		midi: 'requestMIDIAccess' in navigator,
		gamepads: 'getGamepads' in navigator,
		speechSynthesis: 'speechSynthesis' in window,
		webGPU: 'gpu' in navigator,
		webTransport: 'WebTransport' in window,
		sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
		webAssembly: typeof WebAssembly !== 'undefined',
		webShare: 'share' in navigator,
		persistentStorage: 'storage' in navigator && 'persist' in navigator.storage,
		webAuthn: 'credentials' in navigator,

		// Performance
		pageLoadTiming: getPageTiming(),
		performanceMemory: getPerfMemory(),

		// Fingerprints (full-width cards below)
		mediaDevices,
		canvasFP: (() => {
			try {
				const canvas = document.createElement('canvas');
				canvas.width = 200;
				canvas.height = 50;
				const ctx = canvas.getContext('2d');
				ctx.textBaseline = 'top';
				ctx.font = '14px Arial';
				ctx.fillStyle = '#f60';
				ctx.fillRect(125, 1, 62, 20);
				ctx.fillStyle = '#069';
				ctx.fillText('fingerprint', 2, 15);
				ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
				ctx.fillText('fingerprint', 4, 17);
				return canvas.toDataURL().slice(-32);
			} catch {
				return null;
			}
		})(),
		webglFP,

		// Geolocation (browser-based, separate from IP)
		geolocation: geolocationInfo,
	};

	return result;
}

/**
 * Get battery status.
 * @returns {Promise<object>}
 */
async function getBatteryInfo() {
	if (typeof navigator.getBattery !== 'undefined') {
		try {
			const battery = await navigator.getBattery();
			return {
				charging: battery.charging,
				level: `${Math.round(battery.level * 100)}%`,
				chargingTime: battery.chargingTime === Infinity ? 'N/A' : `${battery.chargingTime}s`,
				dischargingTime: battery.dischargingTime === Infinity ? 'N/A' : `${battery.dischargingTime}s`,
			};
		} catch {
			return { status: 'Not supported' };
		}
	}
	return { status: 'Not supported' };
}

/**
 * Get browser geolocation (requires permission).
 * @returns {Promise<object>}
 */
function getGeolocation() {
	return new Promise((resolve) => {
		if (!('geolocation' in navigator)) {
			resolve({ status: 'Not supported' });
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(pos) =>
				resolve({
					latitude: pos.coords.latitude,
					longitude: pos.coords.longitude,
					accuracy: `${Math.round(pos.coords.accuracy)} meters`,
					altitude: pos.coords.altitude ?? 'Unavailable',
					speed: pos.coords.speed ?? 'Unavailable',
				}),
			() => resolve({ status: 'Permission Denied' }),
			{ enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
		);
	});
}

/**
 * Enumerate media devices.
 * @returns {Promise<Array>}
 */
async function getMediaDevices() {
	try {
		const devices = await navigator.mediaDevices.enumerateDevices();
		return devices.map((d) => ({
			kind: d.kind,
			label: d.label,
			deviceId: d.deviceId,
		}));
	} catch {
		return [];
	}
}

/**
 * Get storage quota estimate.
 * @returns {Promise<object|string>}
 */
async function getStorageEstimate() {
	if (navigator.storage && navigator.storage.estimate) {
		try {
			const est = await navigator.storage.estimate();
			const fmt = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
			return { quota: fmt(est.quota), usage: fmt(est.usage) };
		} catch {
			return 'Error';
		}
	}
	return 'Not supported';
}

export default AboutYou;
