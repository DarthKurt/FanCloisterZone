import path from '@/utils/path-shim'

// compute SHA-1 hex using Web Crypto when available; fallback to a small
// pure-JS SHA-1 implementation to avoid requiring Node's `crypto` in renderer.
async function computeSha1Hex (str) {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const enc = new TextEncoder()
    const buf = await window.crypto.subtle.digest('SHA-1', enc.encode(str))
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Pure JS SHA-1 fallback
  function rotl (n, s) { return (n << s) | (n >>> (32 - s)) }
  function sha1 (msg) {
    const msgUtf8 = unescape(encodeURIComponent(msg))
    const words = []
    for (let i = 0; i < msgUtf8.length; i++) {
      words[i >> 2] |= (msgUtf8.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8)
    }
    const l = msgUtf8.length * 8
    words[l >> 5] |= 0x80 << (24 - (l % 32))
    words[(((l + 64) >> 9) << 4) + 15] = l
    let H0 = 0x67452301, H1 = 0xEFCDAB89, H2 = 0x98BADCFE, H3 = 0x10325476, H4 = 0xC3D2E1F0
    for (let i = 0; i < words.length; i += 16) {
      let a = H0, b = H1, c = H2, d = H3, e = H4
      for (let t = 0; t < 80; t++) {
        let w = (t < 16) ? (words[i + t] | 0) : rotl(words[i + t - 3] ^ words[i + t - 8] ^ words[i + t - 14] ^ words[i + t - 16], 1)
        words[i + t] = w
        const s = Math.floor(t / 20)
        const K = [0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xCA62C1D6][s]
        const F = s === 0 ? (b & c) | (~b & d) : s === 1 ? b ^ c ^ d : s === 2 ? (b & c) | (b & d) | (c & d) : b ^ c ^ d
        const temp = (rotl(a, 5) + F + e + K + (w >>> 0)) >>> 0
        e = d; d = c; c = rotl(b, 30) >>> 0; b = a; a = temp
      }
      H0 = (H0 + a) >>> 0
      H1 = (H1 + b) >>> 0
      H2 = (H2 + c) >>> 0
      H3 = (H3 + d) >>> 0
      H4 = (H4 + e) >>> 0
    }
    return [H0, H1, H2, H3, H4].map(h => ('00000000' + (h >>> 0).toString(16)).slice(-8)).join('')
  }

  return sha1(str)
}

// child_process is required at runtime only. Use dynamic require inside
// `spawn()` to avoid Vite externalizing the module into the browser bundle.
import debounce from 'lodash/debounce'

class BaseEngine {
  async enableBulkMode () {
    this.bulkMode = true
    await this._write('%bulk on')
  }

  async disableBulkMode () {
    this.bulkMode = false
    return new Promise((resolve, reject) => {
      this.onMessage = { resolve, reject }
      this._write('%bulk off')
    })
  }

  async write (cmd) {
    await this._write(cmd)
  }

  writeMessage (message) {
    if (this.loggingEnabled) {
      console.groupCollapsed(message.type)
      console.log(message.payload)
      console.groupEnd()
    }

    if (this.bulkMode) {
      return this._write(JSON.stringify(message)).then(() => null)
    }
    return new Promise((resolve, reject) => {
      if (this.onMessage) {
        console.error('unresolved onMessage')
      }
      this.onMessage = { resolve, reject }
      this._write(JSON.stringify(message))
    })
  }
}

class Engine extends BaseEngine {
  constructor (engineProcess, loggingEnabled) {
    super()
    this.engineProcess = engineProcess
    this.loggingEnabled = loggingEnabled
    this.onMessage = null
    this.bulkMode = false

    let stdoutData = []
    let stderrData = []

    const emitError = debounce(() => {
      if (stderrData.length) {
        const data = stderrData.join('\n')
        this.errHandler && this.errHandler(data)
        stderrData = []
      }
    }, 100)

    console.log(`Engine started ${engineProcess.pid}`)

    this.engineProcess.stderr.on('data', data => {
      data = data.toString().trim() // convert buffer to string
      console.error(data)
      if (!data.startsWith('#')) {
        stderrData.push(data)
        emitError()
      }
    })

    this.engineProcess.stdout.on('data', data => {
      data = data.toString()
      if (!data) {
        return
      }

      if (!data.endsWith('\n')) {
        stdoutData.push(data)
        return
      } else if (stdoutData.length) {
        stdoutData.push(data)
        data = stdoutData.join('')
        stdoutData = []
      }

      try {
        const response = JSON.parse(data)
        computeSha1Hex(data).then(hash => {
          if (loggingEnabled) {
            console.debug(response)
          }
          if (this.onMessage) {
            const { resolve } = this.onMessage
            this.onMessage = null
            resolve({ response, hash })
          }
        }).catch(err => {
          console.error('Hashing error', err)
          if (this.onMessage) {
            const { reject } = this.onMessage
            this.onMessage = null
            reject(err)
          }
        })
      } catch (e) {
        console.error('Received invalid json: ' + data)
        console.error(e)
        if (this.onMessage) {
          const { reject } = this.onMessage
          this.onMessage = null
          reject(e)
        }
      }
    })
  }

  on (type, cb) {
    if (type === 'exit') {
      this.engineProcess.on('exit', cb)
    } else if (type === 'error') {
      this.errHandler = cb
    }
  }

  _write (cmd) {
    return new Promise(resolve => {
      this.engineProcess.stdin.write(cmd + '\n', 'utf-8', resolve)
    })
  }

  kill () {
    console.log('Sending TERM to game engine.')
    this.engineProcess.kill()
  }
}

class SocketEngine extends BaseEngine {
  constructor (socket, loggingEnabled) {
    super()
    this.socket = socket
    this.loggingEnabled = loggingEnabled
    this.onMessage = null
    this.bulkMode = false

    let stdoutData = []

    console.log('SocketEngine connected')

    this.socket.on('error', data => {
      this.errHandler && this.errHandler(data)
    })

    this.socket.on('data', data => {
      data = data.toString()
      if (!data) {
        return
      }

      if (!data.endsWith('\n')) {
        stdoutData.push(data)
        return
      } else if (stdoutData.length) {
        stdoutData.push(data)
        data = stdoutData.join('')
        stdoutData = []
      }

      try {
        const response = JSON.parse(data)
        computeSha1Hex(data).then(hash => {
          if (loggingEnabled) {
            console.debug(response)
          }
          if (this.onMessage) {
            const { resolve } = this.onMessage
            this.onMessage = null
            resolve({ response, hash })
          }
        }).catch(err => {
          console.error('Hashing error', err)
          if (this.onMessage) {
            const { reject } = this.onMessage
            this.onMessage = null
            reject(err)
          }
        })
      } catch (e) {
        console.error('Received invalid json: ' + data)
        console.error(e)
        if (this.onMessage) {
          const { reject } = this.onMessage
          this.onMessage = null
          reject(e)
        }
      }
    })
  }

  on (type, cb) {
    if (type === 'exit') {
      this.socket.on('close', cb)
    } else if (type === 'error') {
      this.errHandler = cb
    }
  }

  _write (cmd) {
    return new Promise(resolve => {
      this.socket.write(cmd + '\n', 'utf-8', resolve)
    })
  }

  kill () {
    console.log('Closing socket')
    this.socket.destroy()
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  let spawnedEngine = null

  // --app-path is passed via additionalArguments by the main process.
  // Use process.argv directly (nodeIntegration: true); fall back to the
  // electronAPI resourcesPath so the app still starts if the arg is absent.
  const argv = (typeof process !== 'undefined' && process.argv) || []
  const appPathArg = argv.find(arg => arg.startsWith('--app-path='))
  const appPath = appPathArg
    ? appPathArg.replace('--app-path=', '')
    : (window.electronAPI?.resourcesPath ?? '')
  const basePath = path.dirname(appPath)

  const engine = {
    getJavaExecutable () {
      const { settings } = nuxtApp.$store.state
      return settings.javaPath || 'java'
    },

    getJavaArgs () {
      const { settings } = nuxtApp.$store.state
      if (settings.enginePath) {
        return ['-jar', settings.enginePath]
      }
      // Run against local engine
      if (process.env.NODE_ENV === 'development') {
        return ['-jar', 'Engine.jar']
      }

      return ['-jar', path.join(basePath, 'Engine.jar')]
    },

    isRemote () {
      const { settings } = nuxtApp.$store.state
      const m = /^([.\w]+):(\d+)$/.exec(settings.enginePath)
      if (m) {
        return { port: parseInt(m[2]), host: m[1] }
      }
      return null
    },

    spawn ({ loggingEnabled }) {
        const remote = this.isRemote()
        // Spawning or connecting to local/remote engine requires Node APIs
        // (net/child_process). Those operations must run in the main process.
        // For now, do not attempt to spawn from the renderer; return null.
        if (remote) {
          console.warn('Remote engine connections are not supported from the renderer in this build')
          return null
        }
        console.warn('Local engine spawn is not supported from the renderer; spawn in main instead')
        return null
      spawnedEngine.on('exit', () => {
        spawnedEngine = null
      })
      return spawnedEngine
    },

    kill () {
      if (spawnedEngine) {
        spawnedEngine.kill()
        spawnedEngine = null
      }
    },

    get () {
      return spawnedEngine
    }
  }

  return { provide: { engine } }
})
