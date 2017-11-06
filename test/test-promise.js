// test-promise.js -- Test returning a promise from the topic
//
// Copyright 2017 fuzzy.ai <evan@fuzzy.ai>
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

const fs = require('fs')

const vows = require('../lib/index')
const assert = vows.assert

vows
  .describe('returning a Promise from a topic')
  .addBatch({
    'When we create a topic that returns a Promise': {
      topic () {
        return new Promise((resolve, reject) => {
          fs.open('/tmp/fakefile', 'w', (err, fd) => {
            if (err) {
              reject(err)
            } else {
              resolve(fd)
            }
          })
        })
      },
      'it works': (err, fd) => {
        assert.ifError(err)
        assert.isNumber(fd, (fd instanceof Promise) ? 'fd is a Promise' : 'fd is not a number')
      },
      'teardown': (fd) => {
        return new Promise((resolve, reject) => {
          fs.close(fd, (err) => {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          })
        })
      }
    }
  })
  .export(module)
