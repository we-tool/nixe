import { app, ipcMain, BrowserWindow } from 'electron'
import { join } from 'path'
import ipc from './ipc'

const distDir = __dirname
const parent = ipc(process)

process.on('uncaughtException', (e) => {
  parent.emit('uncaughtException', e.stack || e.toString())
})

app.on('ready', () => {

  const win = new BrowserWindow({
    // show: false,
    webPreferences: {
      preload: join(distDir, 'preload.js'),
      nodeIntegration: false,
    },
  })

  // http://electron.atom.io/docs/v0.36.8/api/web-contents/#events
  ;[
    'did-finish-load',
    'did-fail-load',
    'did-frame-finish-load',
    'did-start-loading',
    'did-stop-loading',
    'did-get-response-details',
    'did-get-redirect-request',
    'dom-ready',
    'page-favicon-updated',
    'new-window',
    'will-navigate',
    'crashed',
    'plugin-crashed',
    'destroyed',
  ].forEach((key) => {
    win.webContents.on(key, (...args) => {
      parent.emit(`win:${key}`, ...args)
    })
  })


  ipcMain.on('web', (event, ...args) => {
    parent.emit('web', ...args)
  })

  parent.on('goto', (url) => {
    win.webContents.loadURL(url)
  })

  parent.on('js', (code) => {
    win.webContents.executeJavaScript(code)
  })

  parent.emit('ready')

})
