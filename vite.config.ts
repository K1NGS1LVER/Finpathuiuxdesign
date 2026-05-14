/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { pennyApiPlugin } from './src/server/penny-api'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  // Load env file so GROQ_API_KEY is available to server plugins
  const env = loadEnv(mode, process.cwd(), '')
  process.env.GROQ_API_KEY = env.GROQ_API_KEY

  return {
    plugins: [
      figmaAssetResolver(),
      react(),
      tailwindcss(),
      pennyApiPlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv'],

    test: {
      globals: true,
      include: ['src/**/*.test.ts'],
    },
  }
})
