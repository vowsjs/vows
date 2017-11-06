// test-at-most-once.js -- Test atMostOnce()
//
// Copyright 2017 Fuzzy.ai <evan@fuzzy.ai>
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

const vows = require('../lib/index')
const assert = vows.assert

const atMostOnce = require('../lib/at-most-once')

vows
  .describe('atMostOnce()')
  .addBatch({
    'When we call a wrapped function once': {
      topic () {
        const sqr = x => x * x
        const wsqr = atMostOnce(sqr)
        return wsqr(3)
      },
      'it works': (err, result) => {
        assert.ifError(err)
        assert.isNumber(result)
        assert.equal(result, 9)
      }
    }
  })
  .addBatch({
    'When we call a wrapped function twice': {
      topic () {
        try {
          const sqr = x => x * x
          const wsqr = atMostOnce(sqr)
          wsqr(3)
          wsqr(4)
          this.callback(new Error('No error from calling wrapped function twice'))
        } catch (err) {
          if (err.name === 'AtMostOnceError') {
            this.callback(null)
          } else {
            this.callback(err)
          }
        }
      },
      'it fails correctly': (err) => {
        assert.ifError(err)
      }
    }
  })
  .export(module)
