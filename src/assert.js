// assert.js -- extended asserts
//
// Copyright 2016 fuzzy.ai <evan@fuzzy.ai>
//
// Licensed under the Apache License, Version 2.0 (the "License")
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

import nodeAssert from 'node:assert'
import createDebug from 'debug'

const debug = createDebug('vows:assert')

// Re-export all from node:assert
export const ok = nodeAssert.ok
export const fail = nodeAssert.fail
export const equal = nodeAssert.equal
export const notEqual = nodeAssert.notEqual
export const deepEqual = nodeAssert.deepEqual
export const notDeepEqual = nodeAssert.notDeepEqual
export const strictEqual = nodeAssert.strictEqual
export const notStrictEqual = nodeAssert.notStrictEqual
export const deepStrictEqual = nodeAssert.deepStrictEqual
export const notDeepStrictEqual = nodeAssert.notDeepStrictEqual
export const throws = nodeAssert.throws
export const doesNotThrow = nodeAssert.doesNotThrow
export const ifError = nodeAssert.ifError
export const rejects = nodeAssert.rejects
export const doesNotReject = nodeAssert.doesNotReject
export const match = nodeAssert.match
export const doesNotMatch = nodeAssert.doesNotMatch

// Default export function for plain assert() calls
export default function assert(...args) {
  debug(args)
  nodeAssert.ok(...args)
}

// Extend with extra utilities

export function epsilon(eps, actual, expected, message) {
  isNumber(eps)
  isNumber(actual)
  isNumber(expected)
  return lesser(Math.abs(actual - expected), eps, message)
}

export function matches(actual, expected, message) {
  nodeAssert.ok(expected instanceof RegExp, `${expected} must be a regular expression`)
  return nodeAssert.ok(expected.test(actual), message || `${actual} does not match ${expected}`)
}

export function isTrue(actual, message) {
  nodeAssert.ok(actual === true, message || 'Argument must be true')
}

export function isFalse(actual, message) {
  nodeAssert.ok(actual === false, message || 'Argument must be false')
}

export function isZero(actual, message) {
  nodeAssert.equal(actual, 0, message || 'Argument must be zero')
}

export function isNotZero(actual, message) {
  nodeAssert.notEqual(actual, 0, message || 'Argument must not be zero')
}

export function greater(actual, expected, message) {
  nodeAssert.ok(actual > expected, message || `${actual} is not greater than ${expected}`)
}

export function lesser(actual, expected, message) {
  nodeAssert.ok(actual < expected, message || `${actual} is not less than ${expected}`)
}

export function inDelta(actual, expected, delta, message) {
  nodeAssert.ok(
    Math.abs(actual - expected) <= delta,
    message || `${actual} is not within ${delta} of ${expected}`
  )
}

export function include(actual, expected, message) {
  nodeAssert.ok(
    actual != null && Object.hasOwn(actual, expected),
    message || `${actual} does not contain ${expected}`
  )
}

export { include as includes }

export function notInclude(actual, expected, message) {
  nodeAssert.ok(
    actual == null || !Object.hasOwn(actual, expected),
    message || `${actual} contains ${expected}`
  )
}

export { notInclude as notIncludes }

export { include as deepInclude, include as deepIncludes }

export function isEmpty(actual, message) {
  const empty =
    actual == null ||
    (Array.isArray(actual) && actual.length === 0) ||
    (typeof actual === 'object' && Object.keys(actual).length === 0) ||
    (typeof actual === 'string' && actual.length === 0)
  nodeAssert.ok(empty, message || `${actual} is not empty`)
}

export function isNotEmpty(actual, message) {
  const empty =
    actual == null ||
    (Array.isArray(actual) && actual.length === 0) ||
    (typeof actual === 'object' && Object.keys(actual).length === 0) ||
    (typeof actual === 'string' && actual.length === 0)
  nodeAssert.ok(!empty, message || `${actual} is empty`)
}

export function lengthOf(actual, expected, message) {
  nodeAssert.ok(actual !== null)
  include(actual, 'length')
  return nodeAssert.equal(
    actual.length,
    expected,
    message || `Length is ${actual.length} not ${expected}`
  )
}

export function isArray(actual, message) {
  nodeAssert.ok(Array.isArray(actual), message || 'Argument is not an array')
}

export function isObject(actual, message) {
  nodeAssert.ok(
    actual !== null && typeof actual === 'object',
    message || 'Argument must be an object'
  )
}

export function isNumber(actual, message) {
  nodeAssert.ok(
    typeof actual === 'number' && !Number.isNaN(actual),
    message || 'Argument must be a number'
  )
}

export function isBoolean(actual, message) {
  nodeAssert.ok(typeof actual === 'boolean', message || 'Argument must be a boolean')
}

export function isNaNValue(actual, message) {
  nodeAssert.ok(Number.isNaN(actual), message || 'Argument must be NaN')
}

// Alias for backward compatibility
export { isNaNValue as isNaN }

export function isNull(actual, message) {
  nodeAssert.ok(actual === null, message || 'Argument must be null')
}

export function isNotNull(actual, message) {
  nodeAssert.ok(actual !== null, message || 'Argument must not be null')
}

export function isUndefined(actual, message) {
  nodeAssert.ok(actual === undefined, message || 'Argument must be undefined')
}

export function isDefined(actual, message) {
  nodeAssert.ok(actual !== undefined, message || 'Argument must be defined')
}

export function isString(actual, message) {
  nodeAssert.ok(typeof actual === 'string', message || 'Argument must be a string')
}

export function isFunction(actual, message) {
  nodeAssert.ok(typeof actual === 'function', message || 'Argument must be a function')
}

export function typeOf(actual, expected, message) {
  nodeAssert.ok(typeof actual === expected, message || `Argument is not of type ${expected}`)
}

export function instanceOf(actual, expected, message) {
  nodeAssert.ok(actual instanceof expected, message || `Argument is not an instance of ${expected}`)
}
