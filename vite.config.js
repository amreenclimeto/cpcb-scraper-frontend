import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

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
      port: Number(env.VITE_DEV_PORT) || 5177,
      strictPort: true,
      proxy: {
        '/api': {
          target: scraperTarget,
          changeOrigin: true,
        },
        '/climeto-api': {
          target: climetoTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/climeto-api/, '/api'),
        },
      },
    },
  }
})
