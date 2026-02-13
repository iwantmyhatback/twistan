/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./index.html",
		"./src/**/*.{js,jsx}",
	],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				surface: {
					DEFAULT: '#0a0a0a',
					50: '#111111',
					100: '#1a1a1a',
					200: '#222222',
					300: '#2a2a2a',
					400: '#333333',
				},
				accent: {
					DEFAULT: '#3b82f6',
					light: '#60a5fa',
					dark: '#2563eb',
				},
				terminal: {
					DEFAULT: '#33ff33',
					light: '#66ff66',
					dark: '#22cc22',
				},
			},
			fontFamily: {
				sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
				display: ['Ubuntu', 'Inter', 'system-ui', 'sans-serif'],
			},
			animation: {
				'fade-in': 'fade-in 0.6s ease-out',
				'slide-up': 'slide-up 0.6s ease-out',
				'subtle-pulse': 'subtle-pulse 3s ease-in-out infinite',
			},
			keyframes: {
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				'slide-up': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				'subtle-pulse': {
					'0%, 100%': { opacity: '0.4' },
					'50%': { opacity: '1' },
				},
			},
		},
	},
	plugins: [],
}
