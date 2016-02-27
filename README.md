# nixe

[![Join the chat at https://gitter.im/fritx/nixe](https://badges.gitter.im/fritx/nixe.svg)](https://gitter.im/fritx/nixe?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Another high-level browser automation library.

Heavily inspired by [nightmare][1]


## Compared to Nightmare

- [x] ES2015+ Build System
- [x] Async/Await Style
- [x] Simpler Codebase
- [ ] Seamless Access to Electron Objects


## Usage

```plain
$ cd my/project
$ npm install -S electron-prebuilt
$ npm install nixe
```

```js
import Nixe from 'nixe'

new Nixe().ready()
  .goto('https://www.baidu.com')
  .execute('alert(123)')
  .queue(async () => 333)
  .run()

// `run` is optional with await/then style
new Nixe().ready()
  .goto('https://www.baidu.com')
  .evaluate(() => document.title)
  .then((title) => {})

// or async/await style
;(async () => {
  const title = await new Nixe().ready()
    .goto('https://www.baidu.com')
    .evaluate(() => document.title)
})()
```


## Dev & Test

```plain
$ npm install -g webpack mocha
$ cd nixe
$ npm install
$ npm run dev
$ npm test
```

## Chinese Mirror for Electron

```plain
ELECTRON_MIRROR=https://npm.taobao.org/mirrors/electron/
```


[1]: https://github.com/segmentio/nightmare
