import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/mahjong_calc/', // Add this line for GitHub Pages deployment
  plugins: [react()],
})
