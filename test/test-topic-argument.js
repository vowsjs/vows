// test-export.js -- A test script that uses perjury
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

const debug = require('debug')('perjury:test-topic-argument')

const vows = require('../lib/index')
const {assert} = vows

const js = JSON.stringify

vows
  .describe('topic argument test')
  .addBatch({
    'When we return a value from a topic synchronously': {
      topic () {
        debug(`a batch arguments: ${js(arguments)}`)
        return 'a'
      },
      'it is passed down to the tests': (err, val1) => {
        assert.ifError(err)
        assert.isString(val1)
        assert.equal(val1, 'a')
      },
      'and we add a sub-batch': {
        topic (val1) {
          debug(`a-b sub-batch arguments: ${js(arguments)}`)
          assert.isString(val1, 'First argument to a-b sub-batch is not a string')
          assert.equal(val1, 'a', "First argument to a-b sub-batch is not 'a' string")
          return 'b'
        },
        'its value is passed to tests': (err, val2) => {
          assert.ifError(err)
          assert.isString(val2)
          assert.equal(val2, 'b')
        },
        'and we add a sub-sub-batch': {
          topic (val2, val1) {
            debug(`a-b-c sub-batch arguments: ${js(arguments)}`)
            assert.isString(val1, 'Second argument to a-b-c sub-batch is not a string')
            assert.equal(val1, 'a', "Second argument to a-b-c sub-batch is not 'a' string")
            assert.isString(val2, 'Second argument to a-b-c sub-batch is not a string')
            assert.equal(val2, 'b', "Second argument to a-b-c sub-batch is not 'a' string")
            return 'c'
          },
          'its value is passed to tests': (err, val3) => {
            assert.ifError(err)
            assert.isString(val3)
            assert.equal(val3, 'c')
          }
        }
      },
      'and we add a different sub-batch': {
        topic (val1) {
          debug(`a-d sub-batch arguments: ${js(arguments)}`)
          assert.isString(val1, 'First argument to a-d sub-batch is not a string')
          assert.equal(val1, 'a', "First argument to a-d sub-batch is not 'a' string")
          return 'd'
        },
        'its value is passed to tests': (err, val4) => {
          assert.ifError(err)
          assert.isString(val4)
          assert.equal(val4, 'd')
        },
        'and we add a different sub-sub-batch': {
          topic (val4, val1) {
            debug(`a-d-e sub-batch arguments: ${js(arguments)}`)
            assert.isString(val1, 'Second argument to a-d-e sub-batch is not a string')
            assert.equal(val1, 'a', "Second argument to a-d-e sub-batch is not 'a' string")
            assert.isString(val4, 'First argument to a-d-e sub-batch is not a string')
            assert.equal(val4, 'd', "First argument to a-d-e sub-batch is not 'd'")
            return 'e'
          },
          'its value is passed to tests': (err, val5) => {
            assert.ifError(err)
            assert.isString(val5)
            assert.equal(val5, 'e')
          },
          'and we add a sub-sub-sub-batch': {
            topic (val5, val4, val1) {
              debug(`a-d-e-f sub-batch arguments: ${js(arguments)}`)
              assert.isString(val1, 'Third argument to a-d-e sub-batch is not a string')
              assert.equal(val1, 'a', "Third argument to a-d-e sub-batch is not 'a' string")
              assert.isString(val4, 'Second argument to a-d-e sub-batch is not a string')
              assert.equal(val4, 'd', "Second argument to a-d-e sub-batch is not 'd'")
              assert.isString(val5, 'First argument to a-d-e sub-batch is not a string')
              assert.equal(val5, 'e', "First argument to a-d-e sub-batch is not 'e'")
              return 'f'
            },
            'its value is passed to tests': (err, val6) => {
              assert.ifError(err)
              assert.isString(val6)
              assert.equal(val6, 'f')
            }
          }
        }
      }
    }
  })
  .export(module)
