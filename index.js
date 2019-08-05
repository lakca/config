/* eslint-disable func-names */
'use stirct'

const chalk = require('chalk')

module.exports = function(obj) {
  const $options = {
    print: console.log
  }
  return {
    options(options) {
      Object.assign($options, options)
    },
    key(name) {
      return createKey(name, obj, (self, newKeyName) => {
        self.done()
        return this.key(newKeyName)
      })
    }
  }
  function createKey(name, target, _key) {
    const $store = {}
    $store.val = void 0
    $store.stack = []
    $store.logger = []
    $store.cased = false
    $store.nameList = Array.isArray(name) ? name : name.split('.')
    $store.nameStr = JSON.stringify($store.nameList)
    return {
      key(name) {
        return _key(this, name)
      },
      label(str) {
        $store.nameStr = str
        return this
      },
      done() {
        const prop = $store.nameList[$store.nameList.length - 1]
        const tar = $store.nameList
          .slice(0, -1)
          .reduce((parent, key) => {
            if (!(key in parent))
              // eslint-disable-next-line no-param-reassign
              parent[key] = {}
            return parent[key]
          }, target)
        tar[prop] = $store.val
        $store.logger.forEach(msg => $options.print(msg))
        return target
      },
      default(value) {
        $store.val = value
        $store.stack = ['default']
        this.warn('use default value: <value>')
        return this
      },
      value(value) {
        if (value !== undefined) {
          $store.val = value
          // clear logger (of previous value) stack.
          $store.logger = []
          $store.stack = ['value']
        }
        return this
      },
      valueRef(fn) {
        return this.value(fn(target))
      },
      push(...value) {
        if ($store.stack[0] !== 'element')
          $store.stack.unshift('element')
        if ($store.val === undefined)
          this.value([])
        $store.val.push(...value)
        return this
      },
      case(condition) {
        if ($store.stack[0] === 'value') {
          $store.stack.unshift('case')
          $store.cased = false
          if (condition === $store.val
            || condition instanceof RegExp && condition.test($store.val)) {
            $store.cased = true
          }
        }
        return this
      },
      log(type, color, msg) {
        const isCase = $store.stack[0] === 'case'
        if (!isCase || isCase && $store.cased) {
          $store.logger.push(
            chalk[color](`[${type.toUpperCase()}] `)
            + chalk.blue($store.nameStr)
            + ' '
            + msg.replace(/<value>/g, chalk.yellow($store.val))
          )
        }
        return this
      },
      info(msg) {
        return this.log('info', 'green', msg)
      },
      deprecate(msg) {
        return this.log('deprecated', 'yellow', msg)
      },
      warn(msg) {
        return this.log('warn', 'yellow', msg)
      },
      error(msg) {
        this.log('error', 'red', msg)
        throw new Error(msg)
      }
    }
  }
}
