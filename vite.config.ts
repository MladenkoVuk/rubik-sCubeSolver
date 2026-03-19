import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // This ensures your assets (images/css) load correctly on GitHub Pages
  base: '/rubik-sCubeSolver/', 
  plugins: [react()],
})