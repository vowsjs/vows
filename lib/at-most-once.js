// at-most-once.js -- run a function at most once
//
// Copyright 2016 fuzzy.ai <evan@fuzzy.ai>
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* jshint esversion: 6 */

'use strict'

const debug = require('debug')('vows:at-most-once')

const assert = require('./assert')

class AtMostOnceError extends Error {
  constructor (name, called) {
    const message = `${name} wrapper called ${called} times!`
    super(message)
    this.message = message
    this.functionName = name
    this.called = called
    this.name = 'AtMostOnceError'
  }
}

const atMostOnce = function (fn) {
  let called = 0
  assert.isFunction(fn)
  const name = (fn.name) ? `${fn.name}()` : '<anonymous function>'
  debug(`Creating atMostOnce() wrapper for ${name}`)
  const wrapper = function () {
    const args = Array.prototype.slice.call(arguments)
    called += 1
    if (called === 1) {
      debug(`First call of atMostOnce() wrapper of ${name}`)
      return fn.apply(null, args)
    } else {
      debug(`call number ${called} of atMostOnce() wrapper of ${name}`)
      throw new AtMostOnceError(name, called)
    }
  }
  return wrapper
}

module.exports = atMostOnce
