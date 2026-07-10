import fs from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import type { Connect, Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

function serveCalendarIcs(): Plugin {
  const filePath = fileURLToPath(new URL('./calendar-data/calendar.ics', import.meta.url))

  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    if (!req.url || !req.url.split('?')[0].endsWith('/calendar.ics')) {
      next()
      return
    }

    let text: string
    try {
      text = fs.readFileSync(filePath, 'utf8')
    } catch {
      res.statusCode = 404
      res.end('Not found')
      return
    }

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.end(text)
  }

  return {
    name: 'serve-calendar-ics',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    serveCalendarIcs(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
