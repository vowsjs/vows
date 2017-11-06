// test-multiple-batch.js -- Multiple calls to addBatch() with async results
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
const assert = vows.assert

const numberBatchAsync = (num) => {
  const batch = {}
  batch[`When we return ${num}`] = {
    topic () {
      this.callback(null, num)
      return undefined
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
  .describe('Multiple addBatch() calls with async results')
  .addBatch(numberBatchAsync(4))
  .addBatch(numberBatchAsync(8))
  .addBatch(numberBatchAsync(15))
  .addBatch(numberBatchAsync(16))
  .addBatch(numberBatchAsync(23))
  .addBatch(numberBatchAsync(42))
  .export(module)
