// Generate a random hex string in renderer without statically importing
// Node's `crypto` (avoids Vite externalization). Use Web Crypto when
// available, fall back to Node `crypto` via dynamic require, then Math.
function randomHex (bytes) {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint8Array(bytes)
    window.crypto.getRandomValues(arr)
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
  }
  // No Node `crypto` here; fall back to Math.random if Web Crypto isn't available.
  const arr = new Uint8Array(bytes)
  for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256)
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}

export const state = () => ({
  loaded: {
    settings: false,
    addons: false,
    tiles: false,
    artworks: false
  },
  hasClassicAddon: false,
  gameDialog: null,
  gameChatEdit: null,
  showJoinDialog: false,
  showSettings: false,
  showGameFarmHints: false,
  showGameHistory: true,
  showGameTiles: false,
  showGameSetup: false,
  java: null,
  engine: null,
  appSessionId: randomHex(16),
  download: null,
  updateInfo: null,
  updateProgress: null,
  errorMessage: null,
  runningTests: false
})

export const mutations = {
  tilesLoaded (state) { state.loaded.tiles = true },
  addonsLoaded (state) { state.loaded.addons = true },
  artworksLoaded (state) { state.loaded.artworks = true },
  settingsLoaded (state) { state.loaded.settings = true },
  hasClassicAddon (state, value) { state.hasClassicAddon = value },
  gameDialog (state, gameDialog) { state.gameDialog = gameDialog },
  gameChatEdit (state, gameChatEdit) { state.gameChatEdit = gameChatEdit },
  showJoinDialog (state, value) { state.showJoinDialog = value },
  showSettings (state, value) { state.showSettings = value },
  toggleGameHistory (state) { state.showGameHistory = !state.showGameHistory },
  showGameTiles (state, value) { state.showGameTiles = value },
  showGameSetup (state, value) { state.showGameSetup = value },
  java (state, value) { state.java = value },
  engine (state, value) { state.engine = value },
  download (state, value) { state.download = value },
  downloadProgress (state, value) { if (state.download) state.download.progress = value },
  downloadSize (state, value) { if (state.download) state.download.size = value },
  updateInfo (state, value) { state.updateInfo = value },
  updateProgress (state, value) { state.updateProgress = value },
  errorMessage (state, value) { state.errorMessage = value },
  runningTests (state, value) { state.runningTests = value }
}

export const getters = {
  loaded: state => state.loaded.addons && state.loaded.tiles
}

export const actions = {
  async checkJavaVersion ({ state, commit, rootState }, forceCheck = false) {
    if (state.java !== null && !forceCheck) {
      return state.java
    }
    const executable = rootState.settings.javaPath || 'java'
    console.log(`Checking ${executable}`)

    try {
      const value = await window.electronAPI.invoke('check-java-version', executable)
      commit('java', value)
      if (value.ok) return value
      throw value
    } catch (err) {
      const value = err && typeof err === 'object' ? err : { ok: false, error: 'not-found' }
      commit('java', value)
      throw value
    }
  },

  async checkEngineVersion ({ state, commit, rootState }) {
    const { $engine } = this._vm
    const remote = $engine.isRemote()

    if (remote) {
      const value = {
        ok: true,
        path: `Remote engine on ${remote.host}:${remote.port}`,
        version: ''
      }
      commit('engine', value)
      return value.version
    }

    const executable = rootState.settings.javaPath || 'java'
    const args = $engine.getJavaArgs()
    const enginePath = args[args.length - 1]

    try {
      const value = await window.electronAPI.invoke('check-engine-version', { executable, args, enginePath })
      commit('engine', value)
      if (value.ok) return value.version
      throw value
    } catch (err) {
      const value = err && typeof err === 'object' ? err : { ok: false, path: enginePath, error: 'not-found' }
      commit('engine', value)
      throw value
    }
  }
}