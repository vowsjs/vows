// test-asynchronous-callback-arguments.js
// Tests for different kinds of callback arguments
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

vows
  .describe('Asynchronous topic callback arguments')
  .addBatch({
    'When we use the async callback with a single argument': {
      topic () {
        this.callback(null, 42)
        return undefined
      },
      'it works': (err, value) => {
        assert.ifError(err)
        assert.isNumber(value)
        assert.equal(value, 42)
      }
    }
  })
  .addBatch({
    'When we use the async callback with multiple arguments': {
      topic () {
        this.callback(null, 4, 8)
        return undefined
      },
      'it works': (err, value1, value2) => {
        assert.ifError(err)
        assert.isNumber(value1)
        assert.equal(value1, 4)
        assert.isNumber(value2)
        assert.equal(value2, 8)
      }
    }
  })
  .addBatch({
    'When we use the async callback with no arguments': {
      topic () {
        this.callback()
        return undefined
      },
      'it works': (err) => {
        assert.ifError(err)
      }
    }
  })
  .addBatch({
    'When we use the async callback without explicitly returning undefined': {
      topic () {
        this.callback(null, 23)
      },
      'it works': (err, value) => {
        assert.ifError(err)
        assert.isNumber(value)
        assert.equal(value, 23)
      }
    }
  })
  .export(module)
