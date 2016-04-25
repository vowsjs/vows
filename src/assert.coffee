# assert.coffee -- extended asserts
#
# Copyright 2016 fuzzy.io <evan@fuzzy.io>
#
# Licensed under the Apache License, Version 2.0 (the "License")
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

assert = require 'assert'

_ = require 'lodash'

# Copy everything from assert module to this module

_.assign module.exports, assert

asrt = module.exports

# Extend this module with some extra utilities

module.exports.epsilon = (eps, actual, expected, message) ->
  asrt.isNumber eps
  asrt.isNumber actual
  asrt.isNumber expected
  asrt.lesser Math.abs(actual - expected), eps

module.exports.match = (actual, expected, message) ->
  assert _.isRegExp(expected), "#{expected} must be a regular expression"
  assert expected.test(actual),
    message or "#{actual} does not match #{expected}"

module.exports.matches = module.exports.match

module.exports.isTrue = (actual, message) ->
  assert actual == true, message or "Argument must be true"

module.exports.isFalse = (actual, message) ->
  assert actual == false, message or "Argument must be false"

module.exports.isZero = (actual, message) ->
  assert.equal actual, 0, message or "Argument must be zero"

module.exports.isNotZero = (actual, message) ->
  assert.notEqual actual, 0, message or "Argument must not be zero"

module.exports.greater = (actual, expected, message) ->
  assert actual > expected,
    message or "#{actual} is not greater than #{expected}"

module.exports.lesser = (actual, expected, message) ->
  assert actual < expected,
    message or "#{actual} is not less than #{expected}"

module.exports.inDelta = (actual, expected, delta, message) ->
  assert Math.abs(actual - expected) <= delta,
    message or "#{actual} is not greater than #{expected}"

module.exports.include = (actual, expected, message) ->
  assert _.hasIn(actual, expected),
    message or "#{actual} does not contain #{expected}"

module.exports.includes = module.exports.include

module.exports.notInclude = (actual, expected, message) ->
  assert !_.hasIn(actual, expected),
    message or "#{actual} contains #{expected}"

module.exports.notIncludes = module.exports.notInclude

module.exports.deepInclude = module.exports.include

module.exports.deepIncludes = module.exports.deepInclude

module.exports.isEmpty = (actual, message) ->
  assert _.isEmpty(actual), message or "#{actual} is not empty"

module.exports.isNotEmpty = (actual, message) ->
  assert !_.isEmpty(actual),  message or "#{actual} is empty"

module.exports.lengthOf = (actual, expected, message) ->
  assert actual?
  asrt.include actual, "length"
  assert.equal actual.length, expected,
    "Length is #{actual.length} not #{expected}"

module.exports.isArray = (actual, message) ->
  assert _.isArray(actual), message or "Argument is not an array"

module.exports.isObject = (actual, message) ->
  assert _.isObject(actual), message or "Argument must be an object"

module.exports.isNumber = (actual, message) ->
  assert _.isNumber(actual), message or "Argument must be a number"

module.exports.isBoolean = (actual, message) ->
  assert _.isBoolean(actual), message or "Argument must be a boolean"

module.exports.isNaN = (actual, message) ->
  assert _.isNaN(actual), message or "Argument must be NaN"

module.exports.isNull = (actual, message) ->
  assert _.isNull(actual), message or "Argument must be null"

module.exports.isNotNull = (actual, message) ->
  assert !_.isNull(actual), message or "Argument must not be null"

module.exports.isUndefined = (actual, message) ->
  assert _.isUndefined(actual), message or "Argument must be undefined"

module.exports.isDefined = (actual, message) ->
  assert !_.isUndefined(actual), message or "Argument must be defined"

module.exports.isString = (actual, message) ->
  assert _.isString(actual), message or "Argument must be a string"

module.exports.isFunction = (actual, message) ->
  assert _.isFunction(actual), message or "Argument must be a function"

module.exports.typeOf = (actual, expected, message) ->
  assert typeof(actual) == expected,
   message or "Argument is not of type #{expected}"

module.exports.instanceOf = (actual, expected, message) ->
  assert actual instanceof expected,
    message or "Argument is not an instance of #{expected}"
