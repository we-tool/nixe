
import 'should'
import { promisify } from 'bluebird'
import fs from 'fs'

const access = promisify(fs.access)


describe('electron', () => {

  it('electron should be installed', async () => {
    await access('node_modules/electron')
  })

  it('no `electron-prebuilt` should be installed', async () => {
    access('node_modules/electron-prebuilt').should.be.rejected()
  })
})
