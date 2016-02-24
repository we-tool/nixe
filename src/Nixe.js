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
      console.error(e)
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

    this.child.once('app:ready', () => {
      this.appReady = true
    })

    this.tasks = []
  }

  end() {
    if (this.proc.connected) this.proc.disconnect()
    this.proc.kill()
  }

  queue(task) {
    this.tasks.push(task) // async fn
    return this
  }

  async run() {
    while (this.tasks.length) {
      const task = this.tasks.shift()
      await task()
    }
  }

  ready() {
    return this.queue(() => new Promise((res) => {
      if (this.appReady) return res()
      this.child.once('app:ready', res)
    }))
  }

  goto(url) {
    return this.queue(() => new Promise((res, rej) => {
      const done = (errc, errd) => {
        if (errc) rej(`${errc}: ${errd}`)
        else res()
        // note: parallel event listening should be removed
        this.child.removeListener('win:dom-ready', done)
        this.child.removeListener('win:did-fail-load', done)
      }
      this.child.emit('goto', url)
      this.child.once('win:dom-ready', () => done())
      this.child.once('win:did-fail-load', done)
    }))
  }

  execute(str, _done) {
    return this.queue(() => new Promise((res, rej) => {
      const done = (errm) => {
        if (_done) _done(errm)
        if (errm) rej(errm)
        else res()
      }
      this.child.emit('execute', str)
      this.child.once('execute:done', done)
    }))
  }

  evaluate(fn, _done, ...args) {
    return this.queue(() => new Promise((res, rej) => {
      const done = (errm, result) => {
        if (_done) _done(errm, result)
        if (errm) rej(errm)
        else res(result)
      }
      // note: ipc cannot pass functions directly
      this.child.emit('evaluate', String(fn), ...args)
      this.child.once('evaluate:done', done)
    }))
  }
}
