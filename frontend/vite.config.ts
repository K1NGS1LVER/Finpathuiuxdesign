/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(() => {
  const backendTarget = process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv'],

    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Heavy third-party libs kept in their own long-cacheable chunks.
            react: ['react', 'react-dom', 'react-router'],
            charts: ['recharts'],
            motion: ['motion'],
            pdf: ['pdfjs-dist'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
    },

    test: {
      globals: true,
      include: ['src/**/*.test.{ts,tsx}'],
    },
  }
})
