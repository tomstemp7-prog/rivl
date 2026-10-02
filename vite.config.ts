import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative base so the build works at any path (e.g. GitHub Pages' /rivl/).
  base: './',
  plugins: [react(), tailwindcss()],
})
