const path = {
  join (...parts) {
    return parts.filter(Boolean).join('/').replace(/\\/g, '/').replace(/\/\/+/g, '/')
  },

  basename (p) {
    if (!p) return ''
    const s = String(p).replace(/\\/g, '/')
    const ps = s.split('/')
    return ps[ps.length - 1] || ''
  },

  extname (p) {
    if (!p) return ''
    const base = String(p).replace(/\\/g, '/').split('/').pop()
    const i = base.lastIndexOf('.')
    return i >= 0 ? base.slice(i) : ''
  },

  dirname (p) {
    if (!p) return '.'
    const s = String(p).replace(/\\/g, '/')
    const i = s.lastIndexOf('/')
    return i === -1 ? '.' : s.slice(0, i)
  },

  parse (p) {
    const base = String(p).replace(/\\/g, '/').split('/').pop()
    const i = base.lastIndexOf('.')
    return {
      root: '',
      dir: '',
      base,
      ext: i >= 0 ? base.slice(i) : '',
      name: i >= 0 ? base.slice(0, i) : base
    }
  }
}

export default path
