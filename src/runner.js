/* global $dirname */
import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import ipc from './ipc'


const parent = ipc(process)

// process.on('uncaughtException', (e) => {
//   parent.emit('uncaughtException', e.stack)
// })

app.on('ready', () => {

  const win = new BrowserWindow({
    show: true,
    webPreferences: {
      preload: join($dirname, 'preload.js'),
      nodeIntegration: false,
    },
  })

  // win.webContents.loadURL('https://baidu.com')

})
