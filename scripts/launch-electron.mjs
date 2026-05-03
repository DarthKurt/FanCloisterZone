import { existsSync } from 'fs'
import { spawn } from 'child_process'
import { createConnection } from 'net'

const DEV_URL = 'http://localhost:3000'
const DIST = 'dist/main/main.js'
const ELECTRON = './node_modules/.bin/electron'
const HOST = 'localhost'
const PORT = 3000

function isPortOpen() {
    return new Promise((resolve) => {
        const socket = createConnection({ host: HOST, port: PORT })
        socket.once('connect', () => { socket.destroy(); resolve(true) })
        socket.once('error', () => { socket.destroy(); resolve(false) })
        socket.setTimeout(500)
        socket.once('timeout', () => { socket.destroy(); resolve(false) })
    })
}

async function poll() {
    process.stdout.write('Waiting for Nuxt + dist')
    while (true) {
        await new Promise(r => setTimeout(r, 800))
        const distReady = existsSync(DIST)
        const portReady = await isPortOpen()
        if (distReady && portReady) break
        process.stdout.write('.')
    }
    console.log(' ✔ ready!')
}

await poll()

spawn(ELECTRON, ['.'], {
    stdio: 'inherit',
    env: { ...process.env, NUXT_DEV_SERVER_URL: DEV_URL },
}).on('exit', code => process.exit(code ?? 0))