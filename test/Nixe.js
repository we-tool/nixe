
import Nixe from '../src/Nixe'
import assert from 'assert'


describe('Nixe', function () {

  this.timeout(Infinity)

  it('constructs', (done) => {
    const nixe = new Nixe()
    const { child } = nixe

    child.on('web', (type, ...data) => {
      console.log(type, ...data)
    })

    child.once('ready', () => {
      child.emit('goto', 'https://www.baidu.com')

      child.once('win:did-finish-load', () => {
        // nixe.execute('alert(123)', (errm) => {
        //   done(errm)
        // })
        nixe.evaluate((b) => {
          const a = 1 + b
          return a
        }, (errm, res) => {
          assert.equal(errm, null)
          assert.equal(res, 3)
          done(errm)
        }, 2)
      })
    })
  })

})
