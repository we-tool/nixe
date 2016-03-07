
import 'should'
import Nixe from '../src/Nixe'

// todo: request the self-started server
// to fix the request limit by other online sites
describe('flow', function () {

  this.timeout(1000 * 60)

  let nixe

  beforeEach(() => {
    nixe = new Nixe()
    nixe.child.on('web', (type, ...data) => { //fixme
      console.log(type, ...data)
    })
  })

  afterEach(() => {
    nixe.end()
  })

  it('should do baidu search', async () => {
    const title = await nixe.ready()
      .goto('https://www.baidu.com/')
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
