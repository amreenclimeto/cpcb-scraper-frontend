import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const scraperTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5054'
  const climetoTarget = env.VITE_AUTH_PROXY_TARGET || 'http://localhost:5000'

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
    ],
    server: {
      proxy: {
        // CPCB scraper data routes (when VITE_API_BASE_URL=/api)
        '/api': {
          target: scraperTarget,
          changeOrigin: true,
        },
        // Climeto auth routes (when VITE_AUTH_API_BASE_URL=/climeto-api)
        '/climeto-api': {
          target: climetoTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/climeto-api/, '/api'),
        },
      },
    },
  }
})
