
import Nixe from '../src/Nixe'


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
        child.emit('js', 'alert(123)')
      })
    })
  })

})
