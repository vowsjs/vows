// test-callback-synchronous.js -- warn on synchronous calls to this.callback
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

const vows = require('../lib/index')
const assert = vows.assert

const Batch = require('../lib/batch')
const Report = require('../lib/report')

vows.describe('Calling this.callback() synchronously')
  .addBatch({
    'When we run a batch that calls this.callback() synchronously': {
      topic () {
        const b = new Batch('When we add two numbers', {
          topic () {
            this.callback(null, 2 + 2)
            return undefined
          },
          'it works': (err, result) => {
            assert.ifError(err)
            assert.isNumber(result)
            assert.equal(result, 4)
          }
        })

        b.run([], this.callback)
      },
      'it works': (err, report) => {
        assert.ifError(err)
        assert.instanceOf(report, Report)
      }
    }
  })
  .export(module)
