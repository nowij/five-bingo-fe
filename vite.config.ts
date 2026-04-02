import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        // target: 'http://localhost:8080',
        target: 'https://five-bingo.onrender.com',
        changeOrigin: true,
      },
      '/ws': {
        // target: 'http://localhost:8080',
        target: 'https://five-bingo.onrender.com',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  define: {
    global: 'globalThis',
  },
})