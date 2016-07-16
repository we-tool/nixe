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

  // todo: options to turn off?
  const win = new BrowserWindow({
    show: false,
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
    win.webContents.on(key, (event, ...args) => {
      parent.emit(`win:${key}`, ...args)
    })
  })


  ipcMain.on('web', (event, ...args) => {
    parent.emit('web', ...args)
  })

  parent.on('goto', (url) => {
    // win.webContents.stop()
    win.webContents.loadURL(url)
  })

  parent.on('execute', (str) => {
    const code = `
      'use strict'
      ;(() => {
        try {
          // fixme: but performance (eval)..?
          // note: should also catch syntax error, eg. alert(123
          // $-{str}
          const result = eval(${JSON.stringify(str)})
          __nixe.ipc.send('execute:done', null, result)
        } catch (e) {
          // todo: ask for electron ipc support with error objs?
          __nixe.ipc.send('execute:done', e.stack || e.message)
        }
      })()
    `
    ipcMain.once('execute:done', (event, ...args) => {
      parent.emit('execute:done', ...args)
    })
    win.webContents.executeJavaScript(code)
  })

  parent.on('evaluate', (fnstr, ...args) => {
    // note: deal with istanbul
    // https://github.com/gotwarlost/istanbul/issues/310
    fnstr = fnstr.replace(/__cov_(.+?)\+\+;?/g, '')
    const code = `
      'use strict'
      ;(() => {
        try {
          // fixme: but performance (eval)..?
          // note: should also catch syntax error, eg. alert(123
          // note: break the $-{} in template string
          // const result = ($-{String(fnstr)})($-{args.map(JSON.stringify).join(', ')})
          // const result = ($-{fnstr})($-{JSON.stringify(args).slice(1, -1)})
          const fn = eval(${JSON.stringify(`(${fnstr})`)})
          const result = fn(${JSON.stringify(args).slice(1, -1)})
          __nixe.ipc.send('evaluate:done', null, result)
        } catch (e) {
          __nixe.ipc.send('evaluate:done', e.stack || e.message)
        }
      })()
    `
    ipcMain.once('evaluate:done', (event, ...args) => {
      parent.emit('evaluate:done', ...args)
    })
    win.webContents.executeJavaScript(code)
  })

  // note: 9e20/365/24/60/60/1000=28538812785.38813, for Infinity
  // but not `Infinity`
  parent.on('loop', (fnstr, interval = 200, timeout = 9e20) => {
    fnstr = fnstr.replace(/__cov_(.+?)\+\+;?/g, '')
    const code = `
      'use strict'
      ;(() => {
        let fn
        try {
          fn = eval(${JSON.stringify(`(${fnstr})`)})
        } catch (e) {
          __nixe.ipc.send('loop:done', e.stack || e.message)
        }
        const id1 = setInterval(exec, ${interval})
        const id2 = setTimeout(() => {
          __nixe.ipc.send('loop:done', 'loop:timeout')
          clearInterval(id1)
        }, ${timeout == null ? 9e20 : timeout})
        exec()
        function exec() {
          try {
            // const result = fn($-{JSON.stringify(args).slice(1, -1)})
            const result = fn()
            if (result) {
              __nixe.ipc.send('loop:done')
              clearInterval(id1)
              clearTimeout(id2)
            }
          } catch (e) {
            __nixe.ipc.send('loop:done', e.stack || e.message)
          }
        }
      })()
    `
    ipcMain.once('loop:done', (event, ...args) => {
      parent.emit('loop:done', ...args)
    })
    win.webContents.executeJavaScript(code)
  })

  parent.emit('app:ready')

})
