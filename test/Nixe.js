
import { install } from 'mocha-generators'
import Nixe from '../src/Nixe'
import assert from 'assert'

install()


describe('Nixe', function () {

  this.timeout(25000)

  let nixe

  it('should construct', () => {
    nixe = new Nixe()
    nixe.child.on('web', (type, ...data) => { //fixme
      console.log(type, ...data)
    })
  })

  it('should get ready', async () => {
    await nixe.ready().run()
  })

  it('should open url', async () => {
    await nixe.goto('https://www.baidu.com').run()
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
    nixe.end()
    nixe = new Nixe()
    await nixe.ready()
      .goto('https://www.baidu.com')
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
