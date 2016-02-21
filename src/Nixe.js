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
  }

  end() {
    if (this.proc.connected) this.proc.disconnect()
    this.proc.kill()
  }

}
