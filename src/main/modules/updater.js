import { app, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import electronLogger from 'electron-log'
import { compareVersions } from 'compare-versions'
import { marked } from 'marked'

marked.setOptions({ gfm: true, breaks: true })

let win = null
let updateInfo = null

async function getLatestReleaseByChannel (channel, currentVersion) {
  const isCurrentAlpha = /-alpha/i.test(currentVersion)
  const isCurrentBeta = /-beta/i.test(currentVersion)
  const isCurrentRc = /-rc/i.test(currentVersion)

  const res = await fetch('https://api.github.com/repos/fancarpedia/FanCloisterZone/releases')
  const releases = await res.json()

  const parsed = releases
    .filter(r => !r.draft)
    .map(r => {
      function getAsset (ext) {
        if (!r.assets || !Array.isArray(r.assets)) return null
        const found = r.assets.find(a => a.name && a.name.endsWith(ext))
        return found ? found.browser_download_url : null
      }
      return {
        version: r.tag_name.replace(/^v/, ''),
        prerelease: /-/.test(r.tag_name),
        alpha: /-alpha/i.test(r.tag_name),
        beta: /-beta/i.test(r.tag_name),
        rc: /-rc/i.test(r.tag_name),
        assetUrl: { exe: getAsset('.exe'), dmg: getAsset('.dmg'), appImage: getAsset('.AppImage') },
        releaseNotes: r.body ? marked.parse(r.body || '') : r.tag_name
      }
    })

  parsed.sort((a, b) => compareVersions(b.version, a.version))

  if (isCurrentAlpha) channel = 'dev'
  if ((isCurrentBeta || isCurrentRc) && channel === 'stable') channel = 'beta'

  switch (channel) {
    case 'dev':
      return parsed.find(v => compareVersions(v.version, currentVersion) > 0) || null
    case 'beta':
      return parsed.find(v => compareVersions(v.version, currentVersion) > 0 && (!v.prerelease || v.beta)) || null
    case 'stable':
    default:
      return parsed.find(v => compareVersions(v.version, currentVersion) > 0 && !v.prerelease) || null
  }
}

export default function (settings, appVersion) {
  autoUpdater.autoDownload = false
  autoUpdater.setFeedURL({ provider: 'github', owner: 'fancarpedia', repo: 'FanCloisterZone' })

  ipcMain.on('do-update', async () => {
    await autoUpdater.downloadUpdate()
    if (win) win.webContents.send('update-progress', { percent: 100 })
    autoUpdater.quitAndInstall()
  })

  const channel = settings && settings.devChannel ? settings.devChannel : 'stable'

  function trySendUpdate () {
    if (win && updateInfo) {
      win.webContents.once('did-finish-load', () => win.webContents.send('app-update', updateInfo))
    }
  }

  getLatestReleaseByChannel(channel, appVersion)
    .then(result => { if (!result) return; updateInfo = result; trySendUpdate() })
    .catch(err => console.error(err))

  return {
    winCreated (_win) { win = _win; trySendUpdate() },
    winClosed (_win) { win = null }
  }
}
