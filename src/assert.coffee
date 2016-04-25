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

me = module.exports

# Copy everything from assert module to this module

_.assign me, assert

# Extend this module with some extra utilities

me.epsilon = (eps, actual, expected, message) ->
  me.isNumber eps
  me.isNumber actual
  me.isNumber expected
  me.lesser Math.abs(actual - expected), eps

me.match = (actual, expected, message) ->
  assert _.isRegExp(expected), "#{expected} must be a regular expression"
  assert expected.test(actual),
    message or "#{actual} does not match #{expected}"

me.matches = me.match

me.isTrue = (actual, message) ->
  assert actual == true, message or "Argument must be true"

me.isFalse = (actual, message) ->
  assert actual == false, message or "Argument must be false"

me.isZero = (actual, message) ->
  assert.equal actual, 0, message or "Argument must be zero"

me.isNotZero = (actual, message) ->
  assert.notEqual actual, 0, message or "Argument must not be zero"

me.greater = (actual, expected, message) ->
  assert actual > expected,
    message or "#{actual} is not greater than #{expected}"

me.lesser = (actual, expected, message) ->
  assert actual < expected,
    message or "#{actual} is not less than #{expected}"

me.inDelta = (actual, expected, delta, message) ->
  assert Math.abs(actual - expected) <= delta,
    message or "#{actual} is not greater than #{expected}"

me.include = (actual, expected, message) ->
  assert _.hasIn(actual, expected),
    message or "#{actual} does not contain #{expected}"

me.includes = me.include

me.notInclude = (actual, expected, message) ->
  assert !_.hasIn(actual, expected),
    message or "#{actual} contains #{expected}"

me.notIncludes = me.notInclude

# FIXME: figure out include/deepInclude

me.deepInclude = me.include

me.deepIncludes = me.deepInclude

me.isEmpty = (actual, message) ->
  assert _.isEmpty(actual), message or "#{actual} is not empty"

me.isNotEmpty = (actual, message) ->
  assert !_.isEmpty(actual),  message or "#{actual} is empty"

me.lengthOf = (actual, expected, message) ->
  assert actual?
  me.include actual, "length"
  assert.equal actual.length, expected,
    "Length is #{actual.length} not #{expected}"

me.isArray = (actual, message) ->
  assert _.isArray(actual), message or "Argument is not an array"

me.isObject = (actual, message) ->
  assert _.isObject(actual), message or "Argument must be an object"

me.isNumber = (actual, message) ->
  assert _.isNumber(actual), message or "Argument must be a number"

me.isBoolean = (actual, message) ->
  assert _.isBoolean(actual), message or "Argument must be a boolean"

me.isNaN = (actual, message) ->
  assert _.isNaN(actual), message or "Argument must be NaN"

me.isNull = (actual, message) ->
  assert _.isNull(actual), message or "Argument must be null"

me.isNotNull = (actual, message) ->
  assert !_.isNull(actual), message or "Argument must not be null"

me.isUndefined = (actual, message) ->
  assert _.isUndefined(actual), message or "Argument must be undefined"

me.isDefined = (actual, message) ->
  assert !_.isUndefined(actual), message or "Argument must be defined"

me.isString = (actual, message) ->
  assert _.isString(actual), message or "Argument must be a string"

me.isFunction = (actual, message) ->
  assert _.isFunction(actual), message or "Argument must be a function"

me.typeOf = (actual, expected, message) ->
  assert typeof(actual) == expected,
   message or "Argument is not of type #{expected}"

me.instanceOf = (actual, expected, message) ->
  assert actual instanceof expected,
    message or "Argument is not an instance of #{expected}"
