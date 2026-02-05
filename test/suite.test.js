// suite.test.js -- Tests for vows Suite class
//
// Copyright 2016-2026 fuzzy.ai, vowsjs contributors
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

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import vows from '../src/index.js'

describe('vows Suite', () => {
  test('describe creates a new Suite', () => {
    const suite = vows.describe('Test Suite')
    assert.ok(suite)
    assert.equal(suite.description, 'Test Suite')
  })

  test('addBatch chains correctly', () => {
    const suite = vows.describe('Chaining Test').addBatch({
      'A topic': {
        topic: () => 42,
        'has a test': () => {}
      }
    })
    assert.equal(suite.batches.length, 1)
  })

  test('addBatch requires single key object', () => {
    const suite = vows.describe('Error Test')
    assert.throws(() => {
      suite.addBatch({})
    })
  })

  test('run executes batches with static topic', async () => {
    const results = []

    await new Promise(resolve => {
      vows
        .describe('Static Topic Test')
        .addBatch({
          'When topic returns a value': {
            topic: () => 'static value',
            'it is passed to tests': (err, value) => {
              results.push(value)
              vows.assert.ifError(err)
              vows.assert.equal(value, 'static value')
            }
          }
        })
        .run((err, broken, successes, failures) => {
          assert.ifError(err)
          assert.equal(broken, 0)
          assert.equal(successes, 1)
          assert.equal(failures, 0)
          assert.deepEqual(results, ['static value'])
          resolve()
        })
    })
  })

  test('run handles async callback topics', async () => {
    await new Promise(resolve => {
      vows
        .describe('Async Callback Test')
        .addBatch({
          'When topic uses this.callback': {
            topic() {
              setTimeout(() => {
                this.callback(null, 'async result')
              }, 10)
            },
            'it works': (err, value) => {
              vows.assert.ifError(err)
              vows.assert.equal(value, 'async result')
            }
          }
        })
        .run((err, broken, successes, failures) => {
          assert.ifError(err)
          assert.equal(broken, 0)
          assert.equal(successes, 1)
          assert.equal(failures, 0)
          resolve()
        })
    })
  })

  test('run handles Promise topics', async () => {
    await new Promise(resolve => {
      vows
        .describe('Promise Topic Test')
        .addBatch({
          'When topic returns a Promise': {
            topic: () => Promise.resolve('promise value'),
            'it resolves correctly': (err, value) => {
              vows.assert.ifError(err)
              vows.assert.equal(value, 'promise value')
            }
          }
        })
        .run((err, broken, successes, failures) => {
          assert.ifError(err)
          assert.equal(broken, 0)
          assert.equal(successes, 1)
          assert.equal(failures, 0)
          resolve()
        })
    })
  })

  test('run handles rejected Promise topics', async () => {
    await new Promise(resolve => {
      vows
        .describe('Rejected Promise Test')
        .addBatch({
          'When topic returns a rejected Promise': {
            topic: () => Promise.reject(new Error('test error')),
            'error is passed to tests': (err, _value) => {
              vows.assert.ok(err)
              vows.assert.equal(err.message, 'test error')
            }
          }
        })
        .run((err, broken, successes, failures) => {
          assert.ifError(err)
          assert.equal(broken, 1)
          assert.equal(successes, 1)
          assert.equal(failures, 0)
          resolve()
        })
    })
  })

  test('run handles test failures', async () => {
    await new Promise(resolve => {
      vows
        .describe('Failure Test')
        .addBatch({
          'When a test fails': {
            topic: () => 'value',
            'this test will fail': (_err, value) => {
              vows.assert.equal(value, 'wrong value')
            }
          }
        })
        .run((err, broken, successes, failures) => {
          assert.ifError(err)
          assert.equal(broken, 0)
          assert.equal(successes, 0)
          assert.equal(failures, 1)
          resolve()
        })
    })
  })

  test('run handles teardown', async () => {
    let teardownCalled = false

    await new Promise(resolve => {
      vows
        .describe('Teardown Test')
        .addBatch({
          'When there is a teardown': {
            topic: () => ({ resource: 'allocated' }),
            'test runs first': (err, obj) => {
              vows.assert.ifError(err)
              vows.assert.equal(obj.resource, 'allocated')
            },
            teardown: _obj => {
              teardownCalled = true
              return true // Return a value to indicate sync completion
            }
          }
        })
        .run((err, _broken, _successes, _failures) => {
          assert.ifError(err)
          assert.ok(teardownCalled, 'teardown should have been called')
          resolve()
        })
    })
  })

  test('run handles async teardown with callback', async () => {
    let teardownValue = null

    await new Promise(resolve => {
      vows
        .describe('Async Teardown Test')
        .addBatch({
          'When teardown uses callback': {
            topic: () => 'value',
            'test passes': (err, _value) => {
              vows.assert.ifError(err)
            },
            teardown(value) {
              setTimeout(() => {
                teardownValue = value
                this.callback(null)
              }, 10)
            }
          }
        })
        .run((err, _broken, _successes, _failures) => {
          assert.ifError(err)
          assert.equal(teardownValue, 'value')
          resolve()
        })
    })
  })

  test('run handles nested batches', async () => {
    const results = []

    await new Promise(resolve => {
      vows
        .describe('Nested Batch Test')
        .addBatch({
          'Parent topic': {
            topic: () => 'parent',
            'parent test': (err, value) => {
              results.push(`parent: ${value}`)
              vows.assert.ifError(err)
            },
            'Child topic': {
              topic: parentValue => `child of ${parentValue}`,
              'child test': (err, value) => {
                results.push(`child: ${value}`)
                vows.assert.ifError(err)
              }
            }
          }
        })
        .run((err, _broken, successes, _failures) => {
          assert.ifError(err)
          assert.equal(successes, 2)
          assert.ok(results.includes('parent: parent'))
          assert.ok(results.includes('child: child of parent'))
          resolve()
        })
    })
  })

  test('run handles multiple batches', async () => {
    let count = 0

    await new Promise(resolve => {
      vows
        .describe('Multiple Batch Test')
        .addBatch({
          'First batch': {
            topic: () => 1,
            'increments count': (_err, value) => {
              count += value
            }
          }
        })
        .addBatch({
          'Second batch': {
            topic: () => 2,
            'increments count': (_err, value) => {
              count += value
            }
          }
        })
        .run((err, _broken, successes, _failures) => {
          assert.ifError(err)
          assert.equal(count, 3)
          assert.equal(successes, 2)
          resolve()
        })
    })
  })

  test('run handles synchronous this.callback', async () => {
    await new Promise(resolve => {
      vows
        .describe('Sync Callback Test')
        .addBatch({
          'When this.callback is called synchronously': {
            topic() {
              this.callback(null, 'sync')
              // Intentionally no return
            },
            'it still works': (err, value) => {
              vows.assert.ifError(err)
              vows.assert.equal(value, 'sync')
            }
          }
        })
        .run((err, _broken, successes, _failures) => {
          assert.ifError(err)
          assert.equal(successes, 1)
          resolve()
        })
    })
  })
})
