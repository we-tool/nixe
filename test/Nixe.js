
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
    const result = await nixe
      // .execute('throw new Error(1)') // thrown error
      // .execute('alert(123') // syntax error
      .execute('alert(123), 321')
      .run()
    assert.equal(result, 321)
  })

  it('should evaluate', async () => {
    const result = await nixe
      .evaluate((b) => {
        const a = 1 + b
        return a
      }, 2)
      .run()
    assert.equal(result, 3)
  })

  it('should queue up', async () => {
    nixe.end()
    nixe = new Nixe()
    const result = await nixe.ready()
      .goto('https://www.baidu.com')
      .execute('alert(123)')
      .evaluate((b) => {
        const a = 1 + b
        return a
      }, 2)
      .run()
    assert.equal(result, 3)
  })

  it('should queue promise fn', async () => {
    await nixe
      .queue(() => new Promise((res) => {
        setTimeout(res, 500)
      }))
      .run()
  })

  it('should queue async fn', async () => {
    const result = await nixe
      .queue(async () => 6 / 3)
      .run()
    assert.equal(result, 2)
  })

  // note: NaN becomes 0 via ipc
  // null/undefined becomes null
  it('ipc: NaN => 0, null/undefined => null', async () => {
    let result = await nixe.evaluate(() => NaN).run()
    assert.strictEqual(result, 0)
    result = await nixe.evaluate(() => null).run()
    assert.strictEqual(result, null)
    result = await nixe.evaluate(() => undefined).run()
    assert.strictEqual(result, null)
  })

  it('should do baidu search', async () => {
    nixe.end()
    nixe = new Nixe()
    const title = await nixe.ready()
      .goto('https://www.baidu.com')
      .evaluate(() => {
        window.kw.value = 'nixe'
        window.su.click()
      })
      .queue(() => new Promise((res) => {
        setTimeout(res, 2000) // todo: wait method
      }))
      .evaluate(() => document.title)
      .run()
    assert.equal(title, 'nixe_百度搜索')
  })

})
