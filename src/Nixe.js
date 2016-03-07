import { spawn } from 'child_process'
import { join } from 'path'
import ipc from './ipc'

const distDir = __dirname


export default class Nixe {

  // todo: static/instance config
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
    let result // last result
    let left = this.tasks.length // tasks to run
    while (left--) {
      const task = this.tasks.shift()
      result = await task(result) // should be a promise
      // or would have
      // Unhandled rejection TypeError:
      // A value undefined was yielded that could not be treated as a promise
    }
    return result
  }

  // work as a "promise" ifself
  // make `run` optional
  async then(res, rej) {
    return new Promise((_res, _rej) => {
      this.run().then(_res, _rej)
    })
    .then(res)
    .catch(rej)
  }

  ready() {
    return this.queue(() => new Promise((res) => {
      if (this.appReady) return res()
      this.child.once('app:ready', res)
    }))
  }

  // note: if `dom-ready` is used instead of `did-finish-load`
  // extra `goto` would cause "-3" thrown
  goto(url) {
    return this.queue(() => new Promise((res, rej) => {
      const done = (errc, errd) => {
        if (errc) rej(`${errc}: ${errd}`)
        else res()
        // note: parallel event listening should be removed
        // this.child.removeListener('win:dom-ready', done)
        this.child.removeListener('win:did-finish-load', done)
        this.child.removeListener('win:did-fail-load', done)
      }
      this.child.emit('goto', url)
      // this.child.once('win:dom-ready', () => done())
      this.child.once('win:did-finish-load', () => done())
      this.child.once('win:did-fail-load', done)
    }))
  }

  wait(delay) {
    return this.queue(() => new Promise((res) => {
      setTimeout(res, delay)
    }))
  }

  execute(str) {
    return this.queue(() => new Promise((res, rej) => {
      const done = (errm, result) => {
        if (errm) rej(errm)
        else res(result)
      }
      this.child.emit('execute', str)
      this.child.once('execute:done', done)
    }))
  }

  evaluate(fn, ...args) {
    return this.queue(() => new Promise((res, rej) => {
      const done = (errm, result) => {
        if (errm) rej(errm)
        // note: NaN becomes 0 via ipc
        // null/undefined becomes null
        else res(result)
      }
      // note: ipc cannot pass functions directly
      this.child.emit('evaluate', String(fn), ...args)
      this.child.once('evaluate:done', done)
    }))
  }

  // note: dont use `Infinity`(=0) with setTimeout
  // use null for Infinity instead
  // also Infinity becomes null via ipc
  loop(fn, interval, timeout) {
    return this.queue(() => new Promise((res, rej) => {
      const done = (errm) => {
        if (errm) rej(errm)
        else res()
      }
      this.child.emit('loop', String(fn), interval, timeout)
      this.child.once('loop:done', done)
    }))
  }
}
