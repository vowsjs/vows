// test-assert-greater.js -- Test assert.greater()
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

const fs = require('fs')

const _ = require('lodash')
const debug = require('debug')('perjury:test-assert-greater')

const vows = require('../lib/index')
const assert = vows.assert

const js = JSON.stringify

const shouldSucceed = (actual, expected) => {
  const batch = {
    topic () {
      try {
        assert.greater(actual, expected)
        this.callback(null)
      } catch (err) {
        this.callback(err)
      }
    },
    'it works': (err) => {
      assert.ifError(err)
    }
  }
  return batch
}

const shouldFail = (actual, expected) => {
  const batch = {
    topic () {
      try {
        assert.greater(actual, expected)
        this.callback(new Error('Unexpected success'))
      } catch (err) {
        this.callback(null)
      }
    },
    'it works': (err) => {
      assert.ifError(err)
    }
  }
  return batch
}

vows
  .describe('assert.greater()')
  .addBatch({
    'When actual > extended': shouldSucceed(2, 1)
  })
  .addBatch({
    'When actual < extended': shouldFail(1, 2)
  })
  .addBatch({
    'When actual == extended': shouldFail(1, 1)
  })
  .export(module)
