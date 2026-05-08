import { ipcMain, app } from 'electron'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import axios from 'axios'

export default function () {
  ipcMain.on('installer.download-file', async (event, payload) => {
    const { url, id } = payload
    const win = event.sender
    const fileName = path.basename(url.split('?')[0])
    const downloadPath = path.join(app.getPath('downloads'), fileName)

    try {
      const response = await axios({
        method: 'GET',
        url,
        responseType: 'stream',
        maxRedirects: 5
      })

      const totalBytes = parseInt(response.headers['content-length'], 10)
      let receivedBytes = 0

      const writer = fs.createWriteStream(downloadPath)

      response.data.on('data', (chunk) => {
        receivedBytes += chunk.length
        if (totalBytes) {
          win.send('download-progress', { id, percent: (receivedBytes / totalBytes) * 100 })
        }
      })

      response.data.pipe(writer)

      writer.on('finish', () => {
        win.send('download-complete', { id, filePath: downloadPath })
      })

      writer.on('error', (err) => {
        fs.unlink(downloadPath, () => {})
        win.send('download-error', { id, errorMessage: err.message })
      })
    } catch (err) {
      fs.unlink(downloadPath, () => {})
      win.send('download-error', { id, errorMessage: err.message })
    }
  })

  ipcMain.on('installer.run', async (event, filePath) => {
    if (!fs.existsSync(filePath)) {
      event.sender.send('installer.error', 'File not found: ' + filePath)
      return
    }
    event.sender.send('installer.started')
    exec(`"${filePath}"`, (error) => {
      if (error) event.sender.send('installer.error', error.message)
    })
  })

  return {
    winCreated (win) {},
    winClosed (win) {}
  }
}
