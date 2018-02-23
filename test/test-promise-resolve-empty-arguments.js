// test-promise-resolve-empty-arguments.js -- Promise resolves with empty arguments
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

const vows = require('../lib/index')
const assert = vows.assert

vows
  .describe('A promise that resolves with no arguments')
  .addBatch({
    'When we return a value': {
      topic () {
        return 42
      },
      'it works': (err, num) => {
        assert.ifError(err)
        assert.isNumber(num)
        assert.equal(num, 42)
      },
      'and we have a promise that resolves with no arguments': {
        topic () {
          return new Promise((resolve, reject) => {
            resolve()
          })
        },
        'it works': (err, empty) => {
          assert.ifError(err)
          assert.isUndefined(empty)
        },
        'and we examine the stack in the topic of a sub-batch': {
          topic (empty, num) {
            // In the error condition num is undefined, so we go
            // async by default
            this.callback(null, num)
            return undefined
          },
          'the correct arguments are available': (err, num) => {
            assert.ifError(err)
            assert.isNumber(num)
            assert.equal(num, 42)
          }
        }
      }
    }
  })
  .export(module)
