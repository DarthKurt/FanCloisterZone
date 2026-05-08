import fs from 'fs'
import path from 'path'

import { BrowserWindow } from 'electron'

// DEV_SERVER_URL is set by the launch script as NUXT_DEV_SERVER_URL
const DEV_SERVER_URL = process.env.NUXT_DEV_SERVER_URL || process.env.DEV_SERVER_URL || 'http://localhost:3000'
const isDev = Boolean(process.env.NUXT_DEV_SERVER_URL || process.env.DEV_SERVER_URL || process.env.NODE_ENV === 'development')

function getWindowState(state, win) {
    const existingState = state.get(win)
    if (existingState)
        return existingState

    const nextState = {
        hasLocalGame: false,
        isForceClosing: false
    }

    state.set(win, nextState)
    return nextState
}

export function resolveGetAppVersion(hostApp) {
    return () => {
        if (process.env.NUXT_DEV_SERVER_URL || process.env.DEV_SERVER_URL || process.env.NODE_ENV === 'development') {
            const packageJsonPath = path.join(process.cwd(), 'package.json')
            return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).version
        }

        return hostApp.getVersion()
    }
}

export function onSetLocalGame(state) {
    return (event, value) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win) {
            return
        }

        const windowState = getWindowState(state, win)
        windowState.hasLocalGame = value
    }
}

export function onLoadGameDialog(dialog, locks) {
    return async (event, options) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win) {
            return { canceled: true }
        }

        if (locks.get(win)) {
            win.focus()
            return { canceled: true }
        }

        locks.set(win, true)

        try {
            return await dialog.showOpenDialog(win, { ...options, modal: true, parent: win })
        } finally {
            locks.set(win, false)
            if (!win.isDestroyed()) {
                win.focus()
            }
        }
    }
}

export function onAllWindowsClosed(platform, hostApp) {
    const resolvedPlatform = platform

    if (resolvedPlatform === 'win32') {
        return () => hostApp.exit(0)
    }

    return () => hostApp.quit()
}

export async function createWindow(hostApp, appModules, state, showUnfinishedGameDialog, onGetAppVersion) {
    const version = onGetAppVersion()
    const win = new BrowserWindow({
        height: 600,
        width: 1000,
        icon: path.join(__dirname, '..', 'resources', 'icon.ico'),
        webPreferences: {
            zoomFactor: 1,
            webSecurity: true,
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            additionalArguments: [
                '--user-data=' + hostApp.getPath('userData'),
                '--app-version=' + version,
                '--app-path=' + hostApp.getAppPath()
            ]
        }
    })

    if (isDev) {
        win.loadURL(DEV_SERVER_URL)
        win.webContents.openDevTools()
    } else {
        win.loadFile(path.join(__dirname, '../../.output/public/index.html'))
    }

    win.once('ready-to-show', () => {
        win.maximize()
        appModules.forEach(m => m.winCreated(win))
    })

    win.on('close', async (event) => {
        const windowState = getWindowState(state, win)

        if (windowState.hasLocalGame && !windowState.isForceClosing) {
            event.preventDefault()
            windowState.isForceClosing = true
            const choice = await showUnfinishedGameDialog()
            windowState.isForceClosing = false

            if (choice === 0) {
                windowState.hasLocalGame = false
                win.destroy()
            }
        }
    })

    win.on('closed', () => {
        appModules.forEach(m => m.winClosed(win))
    })

    return win
}