// batch.js -- A batch of tests for perjury
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

const _ = require('lodash')
const async = require('async')
const debug = require('debug')('perjury:batch')

const assert = require('./assert')
const atMostOnce = require('./at-most-once')
const Report = require('./report')

class Batch {
  constructor (title, definition) {
    this.title = title
    assert.isString(this.title, 'Batch title must be a string')
    assert.isObject(definition, 'Batch definition must be an object')

    debug(`Batch constructor with title '${this.title}'`)
    debug(`Definition for '${this.title}' has ${_.keys(definition).length} keys`)

    this.topic = null
    this.teardown = null
    this.tests = {}
    this.batches = {}

    for (const name in definition) {
      const value = definition[name]
      assert.isString(name,
        `keys of definition must be strings, not '${name}'`)

      if (name === 'topic') {
        debug(`Adding topic to '${this.title}'`)
        assert.isFunction(value,
          `'topic' of '${this.title}' must be a function`)
        this.topic = value
      } else if (name === 'teardown') {
        debug(`Adding teardown to '${this.title}'`)
        assert.isFunction(value,
          `'teardown' of '${this.title}' must be a function`)
        this.teardown = value
      } else if (_.isFunction(value)) {
        debug(`Adding test '${name}' to '${this.title}'`)
        this.tests[name] = value
      } else if (_.isObject(value)) {
        debug(`Adding batch '${name}' to '${this.title}'`)
        this.batches[name] = new Batch(`${this.title} ${name}`, value)
      } else {
        throw new Error(`Unexpected value '${value}' for key '${name}'`)
      }
    }

    assert.isFunction(this.topic, `Batch '${this.title}' has no topic`)

    assert(_.size(this.tests) > 0 || _.size(this.batches) > 0,
      `Batch '${this.title}' has no sub-batches or tests`)

    debug(`Batch '${this.title}' has ${_.size(this.tests)} tests`)
    debug(`Batch '${this.title}' has ${_.size(this.batches)} batches`)

    if (this.teardown !== null) {
      debug(`Batch '${this.title}' has a teardown`)
    } else {
      debug(`Batch '${this.title}' has no teardown`)
    }
  }

  run (args, callback) {
    assert.isArray(args, 'Args to Batch::run() must be an array')
    assert.isFunction(callback, 'Callback for Batch::run() must be function')

    debug(`Beginning run of batch '${this.title}'`)

    this.report = new Report(this.title)

    debug('Creating callback')

    const next = this.onTopicComplete(args, callback)

    let results = null

    // It's weird to call this.callback() synchronously, but we
    // allow it. If it's called while the topic is running,
    // we just call setImmediate() to do it "later".

    let sync = null
    const title = this.title

    const thisCallback = function () {
      const args = Array.prototype.slice.call(arguments)
      if (sync) {
        debug(`this.callback called synchronously from topic '${title}'`)
        setImmediate(() => {
          debug(`this.callback of topic '${title}' activated after setImmediate()`)
          next.apply(null, args)
        })
      } else {
        debug(`this.callback called asynchronously from topic '${title}'`)
        next.apply(null, args)
      }
    }

    debug(`Beginning topic of batch '${this.title}'`)

    try {
      sync = true
      results = this.topic.apply({callback: thisCallback}, args)
      sync = false
    } catch (err) {
      sync = false
      debug(`Error running topic of batch '${this.title}'`)
      return next(err)
    }

    debug(`Completed topic of batch '${this.title}'`)

    if (_.isUndefined(results)) {
      debug(`Results of topic of batch '${this.title}' undefined; running async`)
    } else if (!_.isUndefined(Promise) && (results instanceof Promise)) {
      debug(`Results of topic of batch '${this.title}' defined and is a Promise; resolving`)
      results
        .then((realResults) => {
          next(null, realResults)
        })
        .catch((err) => {
          next(err)
        })
    } else {
      debug(`Results of topic of batch '${this.title}' defined and not a Promise; running sync`)
      next(null, results)
    }

    return undefined
  }

  onTopicComplete (args, callback) {
    return atMostOnce(function () {
      const calledWith = Array.prototype.slice.call(arguments)
      const err = calledWith[0]
      const results = calledWith.slice(1)

      debug(`Results for topic of '${this.title}': ${err}, ${results.join(', ')}`)

      this.runTests(err, results)
      this.report.successes = _.keys(this.tests).length - this.report.failures

      assert.ok(_.isFinite(this.report.failures), `failures must be a finite number, not ${this.report.failures}`)
      assert.ok(_.isFinite(this.report.successes), `successes must be a finite number, not ${this.report.successes}`)
      assert.equal(this.report.successes + this.report.failures, _.keys(this.tests).length, `failures + successes != number of tests`)

      if (err) {
        this.report.broken = 1
        debug(`Error ${err} from topic; skipping batches for '${this.title}'`)
        this.runTeardown(results, callback)
      } else if (this.report.failures > 0) {
        debug(`${this.report.failures} failures; skipping batches for '${this.title}'`)
        this.runTeardown(results, callback)
      } else {
        debug(`${this.report.failures} failures; running batches for '${this.title}'`)
        this.runSubBatches(args, results, (err) => {
          if (err) {
            debug(`runSubBatches for '${this.title}' returned error '${err}'`)

            this.runTeardown(results, callback)
          } else {
            debug(`runSubBatches for '${this.title}' complete`)

            this.runTeardown(results, callback)
          }
        })
      }

      return undefined
    }.bind(this))
  }

  runTeardown (topicResults, callback) {
    const next = this.onTeardownComplete(callback)

    if (this.teardown !== null) {
      debug(`Running teardown for '${this.title}'`)

      try {
        const tdres = this.teardown.apply({callback: next}, topicResults)
        if (_.isUndefined(tdres)) {
          return debug(`Results of teardown for '${this.title}' are undef; running async`)
        } else if (!_.isUndefined(Promise) && tdres instanceof Promise) {
          debug(`Results of teardown for '${this.title}' are defined and a Promise; resolving`)
          tdres
            .then((realTdres) => {
              next(null, realTdres)
            })
            .catch((err) => {
              next(err)
            })
        } else {
          debug(`Results of teardown for '${this.title}' are defined and not a Promise; running sync`)
          return next(null, tdres)
        }
      } catch (err) {
        debug(`Error thrown on teardown for '${this.title}': '${err}'`)
        return next(err)
      }
    } else {
      debug(`No teardown for '${this.title}'`)

      return next(null)
    }
  }

  onTeardownComplete (callback) {
    return atMostOnce(function () {
      const calledWith = Array.prototype.slice.call(arguments)
      const err = calledWith[0]
      const results = calledWith.slice(1)

      debug(`Teardown for '${this.title}' is complete`)

      if (err !== null) {
        debug(`Teardown for '${this.title}' called with err '${err}'`)
      }

      if ((results !== null) && results.length > 0) {
        debug(`Teardown for '${this.title}' called with results '${results}'`)
      }

      // Clear the report

      const report = this.report
      this.report = null

      return callback(null, report)
    }.bind(this))
  }

  runTests (err, results) {
    debug(`Running ${_.size(this.tests)} tests for batch '${this.title}'`)

    if (_.size(this.tests) > 0) {
      const args = _.concat([err], results)

      debug(`Passing args '${args.join(', ')}' to tests for batch '${this.title}'`)

      for (const name in this.tests) {
        const test = this.tests[name]
        assert.isString(name, `Name of test must be a string; '${name}'`)
        assert.isFunction(test, 'Test is not a function')

        debug(`Running test '${name}' for '${this.title}'`)

        try {
          test.apply(null, args)
          assert.ok(_.isObject(this.report))
          assert.ok(_.isObject(this.report.tests))
          this.report.tests[name] = true

          debug(`Finished running test '${name}' for '${this.title}'`)
        } catch (caught) {
          debug(`Error running test '${name}' for '${this.title}'`)

          assert.ok(_.isObject(this.report))
          assert.ok(_.isObject(this.report.tests))
          this.report.tests[name] = `${caught.name}: ${caught.message}`
          this.report.failures += 1
        }
      }
    }
  }

  runSubBatches (args, results, callback) {
    const batch = this

    assert.isArray(args, 'args for runSubBatches() must be an array')
    assert.isArray(results, 'results for runSubBatches() must be an array')
    assert.isFunction(callback, 'callback for runSubBatches() must be an array')

    debug(`Running ${_.size(this.batches)} batches for batch '${this.title}'`)

    if (_.size(this.batches) === 0) {
      return callback(null)
    } else {
      const batchArgs = _.concat(_.clone(results), args)

      debug(`Passing args '${batchArgs.join(', ')}' to batches for '${this.title}'`)

      const runBatch = (sub, callback) => {
        sub.run(batchArgs, (err, report) => {
          if (err) {
            debug(`Running sub-batch ${sub.title} resulted in an error`)
            batch.report.addSub(sub.title, report)
            callback(err)
          } else {
            debug(`Running sub-batch ${sub.title} succeeded`)
            batch.report.addSub(sub.title, report)
            callback(null)
          }
        })
      }

      return async.each(this.batches, runBatch, err => {
        if (err) {
          debug(`Running batches for '${this.title}' resulted in ${err}`)
          callback(err)
        } else {
          debug(`Running batches for '${this.title}' succeeded`)
          callback(null)
        }
      })
    }
  }
}

module.exports = Batch
