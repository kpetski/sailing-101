import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Serves files from local-assets/ (gitignored) at /__local__/* — but only
 * while running `vite dev`. `apply: 'serve'` means this plugin's
 * configureServer hook never runs during `vite build`, so local-assets/
 * content can never end up in dist/ or the deployed gh-pages site, even if
 * the folder exists on disk when you build. See README "Using your own
 * textbook photos" section.
 */
function localAssetsPlugin(): Plugin {
  const dir = path.join(dirname, 'local-assets')
  return {
    name: 'local-assets-dev-only',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__local__', (req, res, next) => {
        if (!req.url) return next()
        const url = new URL(req.url, 'http://localhost')

        if (req.method === 'POST' && url.pathname === '/save-points') {
          let body = ''
          req.on('data', (chunk) => (body += chunk))
          req.on('end', () => {
            try {
              const { file, points } = JSON.parse(body)
              if (!/^[a-zA-Z0-9_-]+\.json$/.test(file)) throw new Error('bad filename')
              fs.mkdirSync(dir, { recursive: true })
              fs.writeFileSync(path.join(dir, file), JSON.stringify(points, null, 2))
              res.statusCode = 200
              res.end('ok')
            } catch {
              res.statusCode = 400
              res.end('error')
            }
          })
          return
        }

        const requested = path.normalize(decodeURIComponent(url.pathname)).replace(/^([.][.][/\\])+/, '')
        const filePath = path.join(dir, requested)
        if (!filePath.startsWith(dir)) {
          res.statusCode = 403
          res.end()
          return
        }
        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.statusCode = 404
            res.end('not found')
            return
          }
          const ext = path.extname(filePath).toLowerCase()
          const type =
            ext === '.json' ? 'application/json'
            : ext === '.png' ? 'image/png'
            : ext === '.webp' ? 'image/webp'
            : 'image/jpeg'
          res.setHeader('Content-Type', type)
          res.end(data)
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localAssetsPlugin()],
  // Must match the GitHub repo name — the site is served from
  // https://<user>.github.io/sailing-101/, not the domain root.
  base: '/sailing-101/',
})
