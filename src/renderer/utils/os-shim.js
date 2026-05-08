const os = {
  userInfo () {
    // Best-effort: return a simple username for renderer use.
    if (typeof navigator !== 'undefined') {
      return { username: (navigator.userAgent || 'user').split(' ')[0] }
    }
    return { username: 'user' }
  },
  platform () {
    if (typeof process !== 'undefined' && process.platform) return process.platform
    return 'browser'
  },
  release () { return '' }
}

export default os
