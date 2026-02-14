import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss';
import basicSsl from "@vitejs/plugin-basic-ssl"

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		basicSsl()
	],
	css: {
		postcss: {
			plugins: [tailwindcss()],
		},
	},
	server: {
		https: true
	}
})