import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from "@vitejs/plugin-basic-ssl"

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
	plugins: [
		react(),
		tailwindcss(),
		...(command === 'serve' ? [basicSsl()] : []),
	],
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					'vendor-motion': ['motion/react'],
					'vendor-marked': ['marked'],
					'vendor-fingerprint': ['@fingerprintjs/fingerprintjs'],
				},
			},
		},
	},
}))
