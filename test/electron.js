
import 'should'
import { promisify } from 'bluebird'
import fs from 'fs'

const access = promisify(fs.access)


describe('electron', () => {

  it('electron-prebuilt should be installed', async () => {
    await access('node_modules/electron-prebuilt')
  })

  it('no `electron` should be installed', async () => {
    access('node_modules/electron').should.be.rejected()
  })
})
