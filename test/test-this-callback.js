// test-this-callback.js -- Test this.callback()
//
// Copyright 2017 AJ Jordan <alex@strugee.net>
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
  .describe('this.callback()')
  .addBatch({
    'this.callback': {
      topic () {
        // We can't return this.callback directly because if it's undefined, vows thinks it's an async batch
        return {cb: this.callback}
      },
      'is a function': (err, obj) => {
        assert.ifError(err)
        assert.isObject(obj)
        const cb = obj.cb
        assert.isFunction(cb)
      },
      'in a sub-batch': {
        topic () {
          return {cb: this.callback}
        },
        'is a function': (err, obj) => {
          assert.ifError(err)
          assert.isObject(obj)
          const cb = obj.cb
          assert.isFunction(cb)
        }
      }
    }
  })
  .export(module)
