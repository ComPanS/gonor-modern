import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { basename, extname } from 'node:path'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

function localBasePath() {
  const folderName = basename(process.cwd())
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return folderName ? `/${folderName}/` : '/'
}

function localPathPlugin(base: string) {
  const prefix = base.replace(/\/$/, '')

  return {
    name: 'local-path-prefix',
    enforce: 'pre' as const,
    async configureServer(server: { middlewares: { use: (handler: (request: any, response: any, next: () => void) => void) => void }, transformIndexHtml: (url: string, html: string) => Promise<string> }) {
      server.middlewares.use(async (request, response, next) => {
        if (prefix && request.url?.startsWith(prefix)) {
          const path = request.url.slice(prefix.length)
          if (path === '' || path === '/' || !path.includes('.')) {
            const html = await server.transformIndexHtml(request.url, await readFile(resolve('index.html'), 'utf8'))
            response.statusCode = 200
            response.setHeader('Content-Type', 'text/html')
            response.end(html)
            return
          }
          request.url = path.startsWith('/') ? path : `/${path}`
        }
        next()
      })
    },
    configurePreviewServer(server: { middlewares: { use: (handler: (request: any, response: any, next: () => void) => void) => void } }) {
      server.middlewares.use(async (request, response, next) => {
        if (prefix && request.url?.startsWith(prefix)) {
          const path = request.url.slice(prefix.length)
          if (path === '' || path === '/' || !path.includes('.')) {
            response.statusCode = 200
            response.setHeader('Content-Type', 'text/html')
            response.end(await readFile(resolve('dist/index.html'), 'utf8'))
            return
          }
          const assetPath = path.split('?')[0].replace(/^\/+/, '')
          if (assetPath.includes('..')) {
            response.statusCode = 400
            response.end('Invalid asset path')
            return
          }
          const contentTypes: Record<string, string> = {
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.svg': 'image/svg+xml',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp',
          }
          response.setHeader('Content-Type', contentTypes[extname(assetPath)] || 'application/octet-stream')
          response.end(await readFile(resolve('dist', assetPath)))
          return
        }
        next()
      })
    },
  }
}

export default defineConfig(() => ({
  base: process.env.VITE_BASE_PATH || localBasePath(),
  plugins: [react(), localPathPlugin(process.env.VITE_BASE_PATH || localBasePath())],
}))
