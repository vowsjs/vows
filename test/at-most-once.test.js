// at-most-once.test.js -- Tests for the atMostOnce utility
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
import { AtMostOnceError, atMostOnce } from '../src/at-most-once.js'

describe('atMostOnce', () => {
  test('allows single call', () => {
    let called = 0
    const fn = atMostOnce(() => {
      called++
      return 'result'
    })

    const result = fn()
    assert.equal(called, 1)
    assert.equal(result, 'result')
  })

  test('throws on second call', () => {
    const fn = atMostOnce(() => 'result')

    fn() // First call is OK
    assert.throws(() => fn(), AtMostOnceError)
  })

  test('passes arguments to wrapped function', () => {
    const fn = atMostOnce((a, b, c) => a + b + c)

    const result = fn(1, 2, 3)
    assert.equal(result, 6)
  })

  test('AtMostOnceError has correct properties', () => {
    const fn = atMostOnce(function namedFn() {})

    fn() // First call
    try {
      fn() // Second call
      assert.fail('Should have thrown')
    } catch (err) {
      assert.ok(err instanceof AtMostOnceError)
      assert.equal(err.name, 'AtMostOnceError')
      assert.equal(err.called, 2)
      assert.ok(err.message.includes('namedFn'))
    }
  })

  test('handles anonymous functions', () => {
    const fn = atMostOnce(() => {})

    fn()
    try {
      fn()
      assert.fail('Should have thrown')
    } catch (err) {
      assert.ok(err.message.includes('anonymous'))
    }
  })

  test('tracks call count correctly', () => {
    const fn = atMostOnce(() => {})

    fn()
    try {
      fn()
    } catch (err) {
      assert.equal(err.called, 2)
    }

    try {
      fn()
    } catch (err) {
      assert.equal(err.called, 3)
    }
  })
})
