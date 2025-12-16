import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/2048/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
