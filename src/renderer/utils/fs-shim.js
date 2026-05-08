// Minimal fs shim for renderer that proxies to `window.electronAPI` when available.
// Methods return promises to match Node's `fs.promises` API where possible.
const fs = {
  promises: {
    async readFile (p, encoding = 'utf8') {
      if (typeof window !== 'undefined' && window.electronAPI?.invoke) {
        return await window.electronAPI.invoke('fs.readFile', p, encoding)
      }
      if (encoding === 'utf8') {
        const res = await fetch(p)
        if (!res.ok) throw new Error('fetch readFile failed: ' + res.status)
        return await res.text()
      }
      const res = await fetch(p)
      const buf = await res.arrayBuffer()
      return new Uint8Array(buf)
    },

    async readdir (p) {
      if (typeof window !== 'undefined' && window.electronAPI?.invoke) {
        return await window.electronAPI.invoke('fs.readdir', p)
      }
      return []
    },

    async access (p, mode) {
      if (typeof window !== 'undefined' && window.electronAPI?.invoke) {
        return await window.electronAPI.invoke('fs.access', p, mode)
      }
      throw new Error('fs.access not available in renderer')
    },

    async writeFile (p, data) {
      if (typeof window !== 'undefined' && window.electronAPI?.invoke) {
        return await window.electronAPI.invoke('fs.writeFile', p, data)
      }
      throw new Error('fs.writeFile not available in renderer')
    },

    async mkdir (p, opts) {
      if (typeof window !== 'undefined' && window.electronAPI?.invoke) {
        return await window.electronAPI.invoke('fs.mkdir', p, opts)
      }
      throw new Error('fs.mkdir not available in renderer')
    },

    async unlink (p) {
      if (typeof window !== 'undefined' && window.electronAPI?.invoke) {
        return await window.electronAPI.invoke('fs.unlink', p)
      }
      throw new Error('fs.unlink not available in renderer')
    },

    async rename (a, b) {
      if (typeof window !== 'undefined' && window.electronAPI?.invoke) {
        return await window.electronAPI.invoke('fs.rename', a, b)
      }
      throw new Error('fs.rename not available in renderer')
    },

    async mkdtemp (prefix) {
      if (typeof window !== 'undefined' && window.electronAPI?.invoke) {
        return await window.electronAPI.invoke('fs.mkdtemp', prefix)
      }
      throw new Error('fs.mkdtemp not available in renderer')
    }
  },

  createReadStream () {
    throw new Error('createReadStream is not available in renderer; use main process APIs')
  }
}

export default fs
