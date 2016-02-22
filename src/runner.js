import { app, ipcMain, BrowserWindow } from 'electron'
import { join } from 'path'
import ipc from './ipc'

const distDir = __dirname
const parent = ipc(process)

console.log = (...args) => {
  parent.emit('runner:log', ...args)
}

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

  parent.on('execute', (str) => {
    const code = `
      'use strict'
      ;(() => {
        try {
          ${str}
          __nixe.ipc.send('execute:res')
        } catch (e) {
          // todo: ask for electron ipc support with error objs?
          __nixe.ipc.send('execute:res', e.stack || e.message)
        }
      })()
    `
    ipcMain.once('execute:res', (event, errm) => {
      parent.emit('execute:res', errm)
    })
    win.webContents.executeJavaScript(code)
  })

  parent.on('evaluate', (fnstr, ...args) => {
    const code = `
      'use strict'
      ;(() => {
        try {
          // note: break the $-{} in template string
          // const res = ($-{String(fnstr)})($-{args.map(JSON.stringify).join(', ')})
          const res = (${fnstr})(${JSON.stringify(args).slice(1, -1)})
          __nixe.ipc.send('evaluate:res', null, res)
        } catch (e) {
          __nixe.ipc.send('evaluate:res', e.stack || e.message)
        }
      })()
    `
    parent.emit('runner:log', 'code', code)
    ipcMain.once('evaluate:res', (event, errm, res) => {
      parent.emit('evaluate:res', errm, res)
    })
    win.webContents.executeJavaScript(code)
  })

  parent.emit('ready')

})
