
import { install } from 'mocha-generators'
import Nixe from '../src/Nixe'
import assert from 'assert'

install()


describe('Nixe', function () {

  this.timeout(Infinity)

  let nixe

  it('should construct', (done) => {
    nixe = new Nixe()
    nixe.child.once('app:ready', done) //fixme
  })

  it('should open url', (done) => {
    nixe.child.on('web', (type, ...data) => { //fixme
      console.log(type, ...data)
    })

    nixe.goto('https://www.baidu.com').run()
    nixe.child.once('win:did-finish-load', done) //fixme
  })

  it('should execute', async () => {
    await nixe
      .execute('alert(123)', (errm) => {
        assert.equal(errm, null)
      })
      .run()
  })

  it('should evaluate', async () => {
    await nixe
      .evaluate((b) => {
        const a = 1 + b
        return a
      }, (errm, res) => {
        assert.equal(errm, null)
        assert.equal(res, 3)
      }, 2)
      .run()
  })

  it('should queue up', async () => {
    await nixe.goto('https://www.baidu.com')
      .execute('alert(123)', (errm) => {
        assert.equal(errm, null)
      })
      .evaluate((b) => {
        const a = 1 + b
        return a
      }, (errm, res) => {
        assert.equal(errm, null)
        assert.equal(res, 3)
      }, 2)
      .run()
  })

})
