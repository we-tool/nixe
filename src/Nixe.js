import { spawn } from 'child_process'
import { join } from 'path'
import ipc from './ipc'

const distDir = __dirname


export default class Nixe {

  constructor(options = {}) {
    const { electronPath } = options
    const runner = join(distDir, 'runner.js')
    const electronArgs = {}
    this.proc = spawn(
      electronPath || require('electron-prebuilt'),
      [runner].concat(JSON.stringify(electronArgs)),
      { stdio: [null, null, null, 'ipc'] }
    )
    this.child = ipc(this.proc)

    // process.setMaxListeners(Infinity)
    const end = () => this.end()
    process.on('uncaughtException', (e) => {
      console.error(e.stack || e)
      end()
    })
    process.on('exit', end)
    process.on('SIGINT', end)
    process.on('SIGTERM', end)
    process.on('SIGQUIT', end)
    process.on('SIGHUP', end)
    process.on('SIGBREAK', end)

    this.child.on('uncaughtException', (info = '') => {
      console.error('runner uncaughtException:', info.replace(/\n/g, '\n  '))
    })

    this.child.on('runner:log', (...args) => {
      console.log('runner:log', ...args)
    })
  }

  end() {
    if (this.proc.connected) this.proc.disconnect()
    this.proc.kill()
  }

  execute(str, done) {
    this.child.emit('execute', str)
    this.child.once('execute:res', done || function () {})
  }

  evaluate(fn, done, ...args) {
    // note: ipc cannot pass functions directly
    this.child.emit('evaluate', String(fn), ...args)
    this.child.once('evaluate:res', done || function () {})
  }

}
