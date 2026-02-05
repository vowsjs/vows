// assert.test.js -- Tests for the vows assert module
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

import nodeAssert from 'node:assert/strict'
import { describe, test } from 'node:test'
import * as assert from '../src/assert.js'

describe('vows assert module', () => {
  describe('type assertions', () => {
    test('isString validates strings', () => {
      assert.isString('hello')
      nodeAssert.throws(() => assert.isString(123))
      nodeAssert.throws(() => assert.isString(null))
    })

    test('isNumber validates numbers', () => {
      assert.isNumber(42)
      assert.isNumber(3.14)
      nodeAssert.throws(() => assert.isNumber('42'))
      nodeAssert.throws(() => assert.isNumber(Number.NaN))
    })

    test('isBoolean validates booleans', () => {
      assert.isBoolean(true)
      assert.isBoolean(false)
      nodeAssert.throws(() => assert.isBoolean(1))
      nodeAssert.throws(() => assert.isBoolean('true'))
    })

    test('isArray validates arrays', () => {
      assert.isArray([])
      assert.isArray([1, 2, 3])
      nodeAssert.throws(() => assert.isArray({}))
      nodeAssert.throws(() => assert.isArray('array'))
    })

    test('isObject validates objects', () => {
      assert.isObject({})
      assert.isObject({ a: 1 })
      assert.isObject([]) // arrays are objects
      nodeAssert.throws(() => assert.isObject(null))
      nodeAssert.throws(() => assert.isObject('object'))
    })

    test('isFunction validates functions', () => {
      assert.isFunction(() => {})
      assert.isFunction(() => {})
      nodeAssert.throws(() => assert.isFunction({}))
    })

    test('isNull validates null', () => {
      assert.isNull(null)
      nodeAssert.throws(() => assert.isNull(undefined))
      nodeAssert.throws(() => assert.isNull(0))
    })

    test('isUndefined validates undefined', () => {
      assert.isUndefined(undefined)
      nodeAssert.throws(() => assert.isUndefined(null))
      nodeAssert.throws(() => assert.isUndefined(0))
    })

    test('isNaN validates NaN', () => {
      assert.isNaN(Number.NaN)
      nodeAssert.throws(() => assert.isNaN(0))
      nodeAssert.throws(() => assert.isNaN('NaN'))
    })
  })

  describe('boolean assertions', () => {
    test('isTrue validates true', () => {
      assert.isTrue(true)
      nodeAssert.throws(() => assert.isTrue(false))
      nodeAssert.throws(() => assert.isTrue(1))
    })

    test('isFalse validates false', () => {
      assert.isFalse(false)
      nodeAssert.throws(() => assert.isFalse(true))
      nodeAssert.throws(() => assert.isFalse(0))
    })
  })

  describe('numeric assertions', () => {
    test('isZero validates zero', () => {
      assert.isZero(0)
      nodeAssert.throws(() => assert.isZero(1))
      nodeAssert.throws(() => assert.isZero(-1))
    })

    test('isNotZero validates non-zero', () => {
      assert.isNotZero(1)
      assert.isNotZero(-1)
      nodeAssert.throws(() => assert.isNotZero(0))
    })

    test('greater validates greater-than', () => {
      assert.greater(5, 3)
      assert.greater(0, -1)
      nodeAssert.throws(() => assert.greater(3, 5))
      nodeAssert.throws(() => assert.greater(3, 3))
    })

    test('lesser validates less-than', () => {
      assert.lesser(3, 5)
      assert.lesser(-1, 0)
      nodeAssert.throws(() => assert.lesser(5, 3))
      nodeAssert.throws(() => assert.lesser(3, 3))
    })

    test('epsilon validates within tolerance', () => {
      assert.epsilon(0.01, 3.14, Math.PI)
      assert.epsilon(1, 100, 100.5)
      nodeAssert.throws(() => assert.epsilon(0.001, 3.14, 3.2))
    })

    test('inDelta validates within delta', () => {
      assert.inDelta(10, 11, 2)
      assert.inDelta(100, 100, 0)
      nodeAssert.throws(() => assert.inDelta(10, 20, 5))
    })
  })

  describe('collection assertions', () => {
    test('isEmpty validates empty collections', () => {
      assert.isEmpty([])
      assert.isEmpty({})
      assert.isEmpty('')
      assert.isEmpty(null)
      nodeAssert.throws(() => assert.isEmpty([1]))
      nodeAssert.throws(() => assert.isEmpty({ a: 1 }))
    })

    test('isNotEmpty validates non-empty collections', () => {
      assert.isNotEmpty([1])
      assert.isNotEmpty({ a: 1 })
      assert.isNotEmpty('hello')
      nodeAssert.throws(() => assert.isNotEmpty([]))
      nodeAssert.throws(() => assert.isNotEmpty({}))
    })

    test('lengthOf validates length', () => {
      assert.lengthOf([1, 2, 3], 3)
      assert.lengthOf('hello', 5)
      nodeAssert.throws(() => assert.lengthOf([1, 2], 3))
    })

    test('include validates property existence', () => {
      assert.include({ a: 1 }, 'a')
      assert.include([1, 2, 3], 'length')
      nodeAssert.throws(() => assert.include({ a: 1 }, 'b'))
    })

    test('notInclude validates property absence', () => {
      assert.notInclude({ a: 1 }, 'b')
      nodeAssert.throws(() => assert.notInclude({ a: 1 }, 'a'))
    })
  })

  describe('type checking', () => {
    test('typeOf validates typeof', () => {
      assert.typeOf('hello', 'string')
      assert.typeOf(42, 'number')
      assert.typeOf({}, 'object')
      nodeAssert.throws(() => assert.typeOf('hello', 'number'))
    })

    test('instanceOf validates instanceof', () => {
      assert.instanceOf(new Date(), Date)
      assert.instanceOf([], Array)
      nodeAssert.throws(() => assert.instanceOf({}, Array))
    })
  })

  describe('pattern matching', () => {
    test('matches validates regex patterns', () => {
      assert.matches('hello world', /world/)
      assert.matches('test123', /\d+/)
      nodeAssert.throws(() => assert.matches('hello', /world/))
    })
  })

  describe('null/defined assertions', () => {
    test('isNotNull validates non-null', () => {
      assert.isNotNull(0)
      assert.isNotNull('')
      assert.isNotNull(undefined)
      nodeAssert.throws(() => assert.isNotNull(null))
    })

    test('isDefined validates defined values', () => {
      assert.isDefined(null)
      assert.isDefined(0)
      assert.isDefined('')
      nodeAssert.throws(() => assert.isDefined(undefined))
    })
  })
})
