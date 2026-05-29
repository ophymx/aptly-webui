import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env.local etc. into a typed object (in addition to process.env).
  const env = loadEnv(mode, process.cwd(), ['APTLY_', 'VITE_'])
  const target = env.APTLY_API ?? process.env.APTLY_API ?? 'http://localhost:8080'
  const token = env.APTLY_TOKEN ?? process.env.APTLY_TOKEN
  // Set APTLY_INSECURE=1 to disable TLS verification on the dev proxy
  // (use when the upstream is on a private CA that isn't installed locally).
  const secure = (env.APTLY_INSECURE ?? process.env.APTLY_INSECURE) !== '1'

  return {
    // Relative asset paths so the built bundle can be mounted at any URL
    // prefix without rebuilding. The mount point is discovered at runtime
    // from the bundle's own URL (src/lib/base.ts); see README "Subpath mount".
    base: './',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure,
          configure: (proxy) => {
            if (token) {
              proxy.on('proxyReq', (proxyReq) => {
                proxyReq.setHeader('Authorization', `Bearer ${token}`)
              })
            }
          },
        },
      },
    },
  }
})
