// test-multiple-batch.js -- Multiple calls to addBatch()
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

const vows = require('../lib/index')
const {assert} = vows

// benedict
const numberBatch = (num) => {
  const batch = {}
  batch[`When we return ${num}`] = {
    topic () {
      return num
    },
    'it works': (err, value) => {
      assert.ifError(err)
      assert.isNumber(value)
      assert.equal(value, num)
    }
  }
  return batch
}

vows
  .describe('Multiple addBatch() calls')
  .addBatch(numberBatch(4))
  .addBatch(numberBatch(8))
  .addBatch(numberBatch(15))
  .addBatch(numberBatch(16))
  .addBatch(numberBatch(23))
  .addBatch(numberBatch(42))
  .export(module)
