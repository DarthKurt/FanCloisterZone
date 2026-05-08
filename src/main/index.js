/* globals INCLUDE_RESOURCES_PATH */
import path from 'path'

import { app, BrowserWindow, ipcMain } from 'electron'
import { dialog as dialogElectron } from 'electron'
import fs from 'fs'
import { execFile } from 'child_process'
import crypto from 'crypto'
import unzipper from 'unzipper'
import { File } from 'megajs'
import { pipeline } from 'stream/promises'
import { autoUpdater } from 'electron-updater'
import electronLogger from 'electron-log'

import settings from './settings'
import menu from './modules/menu'
import theme from './modules/theme'
import dialog, { showUnfinishedGameDialog } from './modules/dialog'
import updater from './modules/updater'
import winevents from './modules/winevents'
import settingsWatch from './modules/settingsWatch'
import localServer from './modules/localServer'
import installer from './modules/installer'
import addonDefaults from './modules/addonDefaults'

import RPC from 'discord-rpc'
import {
  resolveGetAppVersion,
  onSetLocalGame,
  onLoadGameDialog,
  onAllWindowsClosed,
  createWindow
} from './main.lib.mjs'
import { on } from 'events'

autoUpdater.logger = electronLogger
if (electronLogger.transports?.file) {
  electronLogger.transports.file.level = 'info'
}

const modules = []
const dialogLocks = new WeakMap()
const state = new WeakMap()

const onGetAppVersion = resolveGetAppVersion(app)

app.setAppUserModelId(`com.fancloisterzone.instance.${Date.now()}.${process.pid}`)

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox')
}

app.disableHardwareAcceleration()

app.whenReady().then(() => {
  ipcMain.handle('get-app-version', onGetAppVersion)
  ipcMain.on('set-local-game', onSetLocalGame(state))
  ipcMain.handle('open-load-game-dialog', onLoadGameDialog(dialogElectron, dialogLocks))

  // Expose system helpers to renderer via the preload bridge. These run in
  // the main process so they can safely use Node APIs like child_process/fs.
  ipcMain.handle('check-java-version', async (_ev, executable = 'java') => {
    return new Promise((resolve) => {
      execFile(executable, ['-version'], (error, _stdout, stderr) => {
        if (error) {
          console.error(error)
          resolve({ ok: false, error: 'not-found' })
        } else {
          const ident = (stderr || '').split('\n')[0]
          let vendor = null
          let version = null

          let m = ident.match(/^([\w-]+) version "1\.(\d)\.[^"]*"/)
          if (m) {
            vendor = m[1]
            version = parseInt(m[2])
          } else {
            m = ident.match(/^([\w-]+) version "(\d+)/)
            if (m) {
              vendor = m[1]
              version = parseInt(m[2])
            }
          }

          const outdated = !!version && version < 17
          const value = {
            version,
            vendor,
            ok: !outdated,
            error: outdated ? 'outdated' : null
          }
          resolve(value)
        }
      })
    })
  })

  ipcMain.handle('check-engine-version', async (_ev, { executable = 'java', args = [], enginePath } = {}) => {
    try {
      await fs.promises.access(enginePath, fs.constants.R_OK)
    } catch (e) {
      console.error(e)
      return { ok: false, path: enginePath, error: 'not-found' }
    }

    return new Promise((resolve) => {
      execFile(executable, [...args, '--version'], (error, stdout, stderr) => {
        if (error) {
          console.error(error)
          resolve({ ok: false, path: enginePath, error: 'exec-error', errorMessage: stderr || (error + '') })
        } else {
          const version = (stdout || '').trim()
          resolve({ ok: true, path: enginePath, version })
        }
      })
    })
  })

  // ─── fs handlers ──────────────────────────────────────────────────────────────
  ipcMain.handle('fs.readFile', async (_ev, filePath, encoding = 'utf8') => {
    try {
      const data = await fs.promises.readFile(filePath, encoding)
      // return strings or buffers (buffers will be serialized)
      return data
    } catch (e) {
      console.error('fs.readFile failed', e)
      throw e
    }
  })

  ipcMain.handle('fs.readdir', async (_ev, folder) => {
    try {
      return await fs.promises.readdir(folder)
    } catch (e) {
      console.error('fs.readdir failed', e)
      return []
    }
  })

  ipcMain.handle('fs.access', async (_ev, filePath) => {
    try {
      await fs.promises.access(filePath, fs.constants.R_OK)
      return true
    } catch (e) {
      return false
    }
  })

  ipcMain.handle('fs.writeFile', async (_ev, filePath, data) => {
    try {
      await fs.promises.writeFile(filePath, data)
      return true
    } catch (e) {
      console.error('fs.writeFile failed', e)
      throw e
    }
  })

  ipcMain.handle('fs.mkdir', async (_ev, folder, opts) => {
    try {
      await fs.promises.mkdir(folder, opts || { recursive: true })
      return true
    } catch (e) {
      console.error('fs.mkdir failed', e)
      throw e
    }
  })

  ipcMain.handle('fs.unlink', async (_ev, filePath) => {
    try {
      await fs.promises.unlink(filePath)
      return true
    } catch (e) {
      console.error('fs.unlink failed', e)
      throw e
    }
  })

  ipcMain.handle('fs.rename', async (_ev, a, b) => {
    try {
      await fs.promises.rename(a, b)
      return true
    } catch (e) {
      console.error('fs.rename failed', e)
      throw e
    }
  })

  ipcMain.handle('fs.mkdtemp', async (_ev, prefix) => {
    try {
      return await fs.promises.mkdtemp(prefix)
    } catch (e) {
      console.error('fs.mkdtemp failed', e)
      throw e
    }
  })

  ipcMain.handle('fs.sha256', async (ev, filePath) => {
    try {
      const hash = crypto.createHash('sha256')
      await new Promise((resolve, reject) => {
        const rs = fs.createReadStream(filePath)
        rs.on('error', reject)
        rs.on('data', chunk => hash.update(chunk))
        rs.on('end', resolve)
      })
      return hash.digest('hex')
    } catch (e) {
      console.error('fs.sha256 failed', e)
      throw e
    }
  })

  ipcMain.handle('unzip.extract', async (ev, zipPath, dest) => {
    try {
      await fs.promises.access(zipPath, fs.constants.R_OK)
    } catch (e) {
      console.error('unzip.extract: zip not accessible', e)
      throw e
    }
    try {
      await pipeline(fs.createReadStream(zipPath), unzipper.Extract({ path: dest }))
      return true
    } catch (e) {
      console.error('unzip.extract failed', e)
      throw e
    }
  })

  ipcMain.handle('download.mega', async (_ev, link, downloadFileName) => {
    try {
      await fs.promises.unlink(downloadFileName).catch(() => {})
      return await new Promise((resolve, reject) => {
        try {
          const megaFile = File.fromURL(link)
          megaFile.loadAttributes().then(() => {
            // proceed
          }).catch(() => {})
          megaFile
            .download()
            .pipe(fs.createWriteStream(downloadFileName))
            .on('error', err => {
              console.error('download.mega failed', err)
              reject(err)
            })
            .on('finish', () => resolve(true))
        } catch (e) {
          console.error('download.mega failed', e)
          reject(e)
        }
      })
    } catch (e) {
      console.error('download.mega top-level error', e)
      throw e
    }
  })

  settings().then(s => {
    modules.push(settingsWatch(s))
    modules.push(theme(s))
    modules.push(menu(s))
    modules.push(dialog(s))
    modules.push(winevents(s))
    modules.push(localServer(s))
    const appVersion = onGetAppVersion()
    modules.push(updater(s, appVersion))
    modules.push(installer())
    addonDefaults()
    createWindow(app, modules, state, showUnfinishedGameDialog, onGetAppVersion)
  })
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow(app, modules, state, showUnfinishedGameDialog, onGetAppVersion)
})

app.on('window-all-closed', onAllWindowsClosed(process.platform, app))

app.on('before-quit', () => {
  autoUpdater.removeAllListeners()
})

// ─── Discord RPC ──────────────────────────────────────────────────────────────
let discordClientId = null
let discordRpc = null

async function initDiscordRpc() {
  if (!discordRpc) {
    if (process.env.NODE_ENV === 'production') {
      try {
        const { DISCORD_CLIENT_ID } = await import('./config/discord.js')
        discordClientId = DISCORD_CLIENT_ID
      } catch (e) {
        console.warn('Failed to load Discord config:', e)
      }
    }
    if (!discordClientId) { console.warn('DISCORD_CLIENT_ID not set, Discord Rich Presence disabled'); return }
    try {
      discordRpc = new RPC.Client({ transport: 'ipc' })
      RPC.register(discordClientId)
      discordRpc.login({ clientId: discordClientId }).catch(console.error)
      discordRpc.on('ready', () => { console.log('Discord Rich Presence active') })
    } catch (e) {
      console.error('Discord RPC initialization failed:', e)
    }
  }
}

initDiscordRpc()
