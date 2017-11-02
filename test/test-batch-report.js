// test-batch-report.js -- Test the use of batches
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

const fs = require('fs')

const _ = require('lodash')
const vows = require('../lib/index')
const Batch = require('../lib/batch')
const Report = require('../lib/report')
const assert = vows.assert

const br = (title, broken, successes, failures, def) => {
  const bd = {}
  bd[title] = {
    topic () {
      const batch = new Batch(title, def)
      batch.run([], this.callback)
    },
    'it works': (err, report) => {
      assert.ifError(err)
    },
    'it returns a report': (err, report) => {
      assert.ifError(err)
      assert.instanceOf(report, Report)
    },
    'it has the right number of broken results': (err, report) => {
      assert.ifError(err)
      assert.isObject(report)
      assert.equal(report.broken, broken)
    },
    'it has the right number of successful results': (err, report) => {
      assert.ifError(err)
      assert.isObject(report)
      assert.equal(report.successes, successes)
    },
    'it has the right number of failure results': (err, report) => {
      assert.ifError(err)
      assert.isObject(report)
      assert.equal(report.failures, failures)
    }
  }
  return bd
}

vows.describe('batch report')
  .addBatch(br('When we run a batch with only successes', 0, 3, 0, {
    topic () {
      return 3
    },
    'it works': (err, result) => {
      assert.ifError(err)
    },
    'it is the correct value': (err, result) => {
      assert.ifError(err)
      assert.equal(result, 3)
    },
    'it is a number': (err, result) => {
      assert.ifError(err)
      assert.isNumber(result)
    }
  }
  ))
  .addBatch(br('When we run a batch with sub-batches', 0, 6, 0, {
    topic () {
      return 3
    },
    'it works': (err, result) => {
      assert.ifError(err)
    },
    'it is the correct value': (err, result) => {
      assert.ifError(err)
      assert.equal(result, 3)
    },
    'it is a number': (err, result) => {
      assert.ifError(err)
      assert.isNumber(result)
    },
    'and we run some sub-batches': {
      topic () {
        return 4
      },
      'it works': (err, results) => {
        assert.ifError(err)
      },
      'it returns a number': (err, results) => {
        assert.ifError(err)
        assert.isNumber(results)
      },
      'it has the right value': (err, results) => {
        assert.ifError(err)
        assert.equal(results, 4)
      }
    }
  }
  ))
  .addBatch(br('When we run a batch with failures', 0, 2, 2, {
    topic () {
      return 3
    },
    'it works': (err, result) => {
      assert.ifError(err)
    },
    'it is a number': (err, result) => {
      assert.ifError(err)
      assert.isNumber(result)
    },
    'it equals 4': (err, result) => {
      assert.ifError(err)
      assert.equal(result, 4)
    },
    'it is greater than 7': (err, result) => {
      assert.ifError(err)
      assert.greater(result, 7)
    }
  }
  ))
  .addBatch(br('When we run a batch with failures in the sub-batches', 0, 6, 4, {
    topic () {
      return 3
    },
    'it works': (err, result) => {
      assert.ifError(err)
    },
    'it is a number': (err, result) => {
      assert.ifError(err)
      assert.isNumber(result)
    },
    'and we run a sub-batch': {
      topic () {
        return 2
      },
      'it works': (err, result) => {
        assert.ifError(err)
      },
      'it is a number': (err, result) => {
        assert.ifError(err)
        assert.isNumber(result)
      },
      'it equals 4': (err, result) => {
        assert.ifError(err)
        assert.equal(result, 4)
      },
      'it is greater than 7': (err, result) => {
        assert.ifError(err)
        assert.greater(result, 7)
      }
    },
    'and we run another sub-batch': {
      topic () {
        return 5
      },
      'it works': (err, result) => {
        assert.ifError(err)
      },
      'it is a number': (err, result) => {
        assert.ifError(err)
        assert.isNumber(result)
      },
      'it equals 4': (err, result) => {
        assert.ifError(err)
        assert.equal(result, 4)
      },
      'it is greater than 7': (err, result) => {
        assert.ifError(err)
        assert.greater(result, 7)
      }
    }
  }
  ))
  .addBatch(br('When we run a batch with an error', 1, 2, 3, {
    topic () {
      this.callback(new Error('Sample error'), 3)
      return undefined
    },
    'it works': (err, result) => {
      assert.ifError(err)
    },
    'it is a number': (err, result) => {
      assert.isNumber(result)
    },
    'it is the right value': (err, result) => {
      assert.equal(result, 3)
    },
    'it is greater than 7': (err, result) => {
      assert.greater(result, 7)
    },
    'it is less than 0': (err, result) => {
      assert.lesser(result, 0)
    }
  }
  ))
  .addBatch(br('When we run a batch with a sub-batch with an error', 1, 3, 3, {
    topic () {
      return 4
    },
    'it works': (err, result) => {
      assert.ifError(err)
      assert.isNumber(result)
      assert.equal(result, 4)
    },
    'and we run the sub-batch': {
      topic () {
        this.callback(new Error('Sample error'), 3)
        return undefined
      },
      'it works': (err, result) => {
        assert.ifError(err)
      },
      'it is a number': (err, result) => {
        assert.isNumber(result)
      },
      'it is the right value': (err, result) => {
        assert.equal(result, 3)
      },
      'it is greater than 7': (err, result) => {
        assert.greater(result, 7)
      },
      'it is less than 0': (err, result) => {
        assert.lesser(result, 0)
      }
    }
  }
  ))
  .export(module)
