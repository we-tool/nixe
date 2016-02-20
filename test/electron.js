
import assert from 'assert'
import fs from 'fs'


describe('electron', () => {

  it('electron-prebuilt installed', (done) => {

    fs.access('node_modules/electron-prebuilt', (err) => {
      assert.equal(err, null)
      done()
    })
  })

  it('no `electron` installed', (done) => {

    fs.access('node_modules/electron', (err) => {
      assert.notEqual(err, null)
      done()
    })
  })

})
