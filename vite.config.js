import { defineConfig } from 'vite'

export default defineConfig({
  base: '/2048/',
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    port: 3000,
    open: true
  }
})
