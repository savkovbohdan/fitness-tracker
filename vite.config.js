import { defineConfig } from 'vite'

export default defineConfig({
  root: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
      output: {
        chunkFileNames: 'assets/[name].[hash]',
        entryFileNames: 'assets/[name].[hash]',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },
  server: {
    port: 3000,
    host: true
  },
  base: './'
})
