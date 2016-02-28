
import 'should'
import Nixe from '../src/Nixe'

describe('examples', function () {

  this.timeout(180000)

  let nixe

  after(() => {
    nixe.end()
  })

  it('should work #1', async () => {
    nixe = new Nixe()
    const result await nixe.ready()
      .goto('https://www.baidu.com')
      .execute('alert(123)')
      .queue(async () => 333)
      .run()
    result.should.eql(333)
  })

  it('should work #2', (done) => {
    nixe.end()
    nixe = new Nixe()
    nixe.ready()
      .goto('https://www.baidu.com')
      .evaluate(() => document.title)
      .then((title) => {
        title.should.eql('百度一下，你就知道')
        done()
      })
  })

  it('should work #3', async () => {
    nixe.end()
    nixe = new Nixe()
    const title = await nixe.ready()
      .goto('https://www.baidu.com')
      .evaluate(() => document.title)
    title.should.eql('百度一下，你就知道')
  })
})
