import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  // Use relative asset URLs so the app works when served from a subpath.
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/isomorphic-git/') || id.includes('/node_modules/lightning-fs/')) {
            return 'git-engine'
          }
          if (id.includes('/node_modules/framer-motion/')) return 'motion-vendor'
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/scheduler/') ||
            id.includes('/node_modules/zustand/')
          ) {
            return 'react-vendor'
          }
          if (id.includes('/src/lib/lessons/') || id.includes('/src/lib/help/')) {
            return 'learning-content'
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
