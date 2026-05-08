/* eslint-disable */
import { app, protocol } from 'electron'
import * as path from 'path'
import { URL } from 'url'

const PRODUCTION_APP_PROTOCOL = 'app'
const PRODUCTION_APP_PATH = path.join(__dirname, '..', 'renderer')


// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: PRODUCTION_APP_PROTOCOL, privileges: { secure: true, standard: true } }
]);


app.once('ready', () => {
  registerProtocol(PRODUCTION_APP_PROTOCOL)
})

// Use protocol.handle (Electron 25+) — protocol.registerFileProtocol is removed.
function registerProtocol(scheme) {
  protocol.handle(scheme, (request) => {
    const relativePath = path.normalize(new URL(request.url).pathname)
    const absolutePath = path.join(PRODUCTION_APP_PATH, relativePath)
    return new Response(
      require('fs').readFileSync(absolutePath),
      { headers: { 'Content-Type': getMimeType(absolutePath) } }
    )
  })
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const types = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.ogg': 'audio/ogg',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.webp': 'image/webp'
  }
  return types[ext] || 'application/octet-stream'
}

// Require `main` process to boot app
require('../index')
