// suite.js -- a suite of batches of tests for vows
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

import createDebug from 'debug'
import * as assert from './assert.js'
import { Batch } from './batch.js'

const debug = createDebug('vows:suite')

export class Suite {
  constructor(description) {
    this.run = this.run.bind(this)
    this.description = description
    assert.isString(this.description, 'Suite description must be a string')

    debug(`Suite constructor with description '${this.description}'`)

    this.batches = []
  }

  addBatch(obj) {
    assert.isObject(obj, 'Argument to addBatch must be an Object')
    assert.equal(Object.keys(obj).length, 1, 'Argument to addBatch must have one key')

    const title = Object.keys(obj)[0]

    debug(`Adding batch '${title}' to suite '${this.description}'`)

    const batch = new Batch(title, obj[title])

    this.batches.push(batch)

    return this
  }

  export(module) {
    assert.isObject(module, 'Module is not an object')

    module.exports = this.run

    return this
  }

  run(callback) {
    let broken = 0
    let successes = 0
    let failures = 0

    assert.ok(
      callback === undefined || typeof callback === 'function',
      'If defined callback must be a function'
    )

    debug(`Running ${this.batches.length} batches for suite '${this.description}'`)

    console.log()
    console.log(this.description)
    console.log()

    // Run batches in series
    let index = 0
    const runNext = () => {
      if (index >= this.batches.length) {
        console.log()
        if (typeof callback === 'function') {
          return callback(null, broken, successes, failures)
        }
        return
      }

      const batch = this.batches[index]
      assert.isObject(batch, 'batch is not an object')
      assert.instanceOf(batch, Batch, 'batch is not a Batch')
      debug(`Running batch '${batch.title}' from suite '${this.description}'`)

      batch.run([], (err, report) => {
        if (err) {
          console.error(err)
        } else {
          debug(`Batch ${batch.title} complete`)

          broken += report.broken
          successes += report.successes
          failures += report.failures

          this.showReport(report)
        }

        index++
        runNext()
      })
    }

    runNext()
    return this
  }

  showReport(report) {
    console.log(report.title)
    for (const name in report.tests) {
      const value = report.tests[name]
      if (typeof value === 'string') {
        console.log(`  ${name}: ${value}`)
      } else {
        console.log(`  ${name}: OK`)
      }
    }
    for (const key in report.subs) {
      const subReport = report.subs[key]
      this.showReport(subReport)
    }
  }
}

export default Suite
