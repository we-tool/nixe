
import should from 'should'
import Nixe from '../src/Nixe'

// todo: request the self-started server
// to fix the request limit by other online sites
describe('Nixe', function () {

  this.timeout(300000)

  let nixe

  after(() => {
    nixe.end()
  })

  it('should construct', () => {
    nixe = new Nixe()
    nixe.child.on('web', (type, ...data) => { //fixme
      console.log(type, ...data)
    })
  })

  it('should get ready', async () => {
    await nixe.ready()
  })

  it('should open url', async () => {
    await nixe.goto('about:blank')
  })

  // can not pass ci
  // it('should open url and capture error', async () => {
  //   let errm
  //   try {
  //     await nixe.goto('xxx-:sdf7&*F(DH')
  //   } catch (m) { errm = m }
  //   errm.should.eql('-3: ')
  // })

  it('should execute', async () => {
    const result = await nixe
      .execute('console.log(1)')
      // .execute('console.info(1)')
      .execute('console.warn(1)')
      .execute('console.error(1)')
      .execute('confirm(123)')
      .execute('prompt(123)')
      .execute('alert(123), 321')
    result.should.be.eql(321)
  })

  it('should execute and capture thrown error', async () => {
    let errm
    try {
      await nixe.execute('throw new Error(321)') // thrown error
    } catch (m) { errm = m }
    errm.should.be.match(/^Error: 321/)
  })

  it('should execute and capture syntax error', async () => {
    let errm
    try {
      await nixe.execute('alert(123') // syntax error
    } catch (m) { errm = m }
    errm.should.be.match(/^SyntaxError: missing/)
  })

  it('should evaluate', async () => {
    const result = await nixe
      .evaluate((b) => {
        const a = 1 + b
        return a
      }, 2)
    result.should.be.eql(3)
  })

  it('should queue up', async () => {
    nixe.end()
    nixe = new Nixe()
    const result = await nixe.ready()
      .goto('about:blank')
      .execute('alert(123)')
      .evaluate((b) => {
        const a = 1 + b
        return a
      }, 2)
    result.should.be.eql(3)
  })

  it('should queue promise fn', async () => {
    await nixe
      .queue(() => new Promise((res) => {
        setTimeout(res, 500)
      }))
  })

  it('should queue async fn', async () => {
    const result = await nixe
      .queue(async () => 6 / 3)
      .queue(async (x) => x + 99)
    result.should.be.eql(101)
  })

  it('should run the pre-set tasks', async () => {
    nixe.end()
    nixe = new Nixe()
    let result = 0
    await nixe.ready()
      .goto('about:blank')
      .queue(async () => {
        result = 1
        nixe.queue(async () => {
          result = 2
        })
      })
    result.should.be.eql(1)
  })

  it('should not run until await/then', async () => {
    let result = 0
    nixe.queue(async () => {
      result = 1
    })
    await new Promise((res) => {
      setTimeout(res, 500)
    })
    result.should.be.eql(0)
    await nixe.ready()
    result.should.be.eql(1)
  })

  it('should have `run` optional', async () => {
    const result = await nixe
      .execute('alert(123), 321')
      .run() // prefer no `run`
    result.should.be.eql(321)
  })

  it('should work as a "promise"', (done) => {
    nixe.execute('alert(123), 321')
      .then((result) => {
        result.should.be.eql(321)
        done()
      })
  })

  it('should work as a "promise" and chain `then`', (done) => {
    nixe.execute('alert(123), 321')
      .then((result) => result + 123)
      .then((result) => result / 2)
      .then((result) => {
        result.should.be.eql(222)
        done()
      })
  })

  it('should work as a "promise" and chain `catch`', (done) => {
    nixe.execute('alert(123), 321')
      .then((result) => result + 123)
      .then((result) => result / 2)
      .then((result) => {
        result.should.be.eql(222)
        throw new Error('foo')
      })
      .catch((err) => {
        err.message.should.eql('foo')
        done()
      })
  })

  // note: NaN becomes 0 via ipc
  // null/undefined becomes null
  it('ipc: NaN => 0, null/undefined => null', async () => {
    let result = await nixe.evaluate(() => NaN)
    result.should.be.eql(0)
    result = await nixe.evaluate(() => null)
    should(result).be.null()
    result = await nixe.evaluate(() => undefined)
    should(result).be.null()
  })

  // todo: test case for `loop`

  it('should do baidu search', async () => {
    nixe.end()
    nixe = new Nixe()
    const title = await nixe.ready()
      .goto('https://www.baidu.com')
      .evaluate(() => {
        window.kw.value = 'nixe'
        window.su.click()
      })
      // .queue(() => new Promise((res) => {
      //   setTimeout(res, 2000) // todo: wait method
      // }))
      .loop(() => {
        return !!window.content_left
      }, 500)
      .evaluate(() => document.title)
    title.should.be.eql('nixe_百度搜索')
  })
})
