# suite.coffee -- a suite of batches of tests for perjury
#
# Copyright 2016 fuzzy.ai <evan@fuzzy.ai>
#
# Licensed under the Apache License, Version 2.0 (the "License");
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
async = require 'async'
debug = require('debug')('perjury:suite')

Batch = require './batch'

class Suite

  constructor: (@description) ->

    assert _.isString(@description), "Suite description must be a string"

    debug("Suite constructor with description '#{@description}'")

    @batches = []

  addBatch: (obj) ->

    assert _.isObject(obj), "Argument to addBatch must be an Object"
    assert.equal _.keys(obj).length, 1, "Argument to addBatch must have one key"

    title = _.keys(obj)[0]

    debug("Adding batch '#{title}' to suite '#{@description}'")

    batch = new Batch(title, obj[title])

    @batches.push batch

    @

  export: (module) ->

    assert _.isObject(module), "Module is not an object"

    module.exports = @run

    @

  run: (callback) =>

    assert !callback? or _.isFunction(callback),
      "If defined callback must be a function"

    runBatch = (batch, callback) =>

      assert _.isObject(batch) and batch instanceof Batch, "Not a batch"
      debug "Running batch '#{batch.title}' from suite '#{@description}'"
      batch.run [], callback

    debug "Running #{_.size(@batches)} batches for suite '#{@description}'"

    async.eachSeries @batches, runBatch, (err) ->
      if err
        console.error err
      if callback?
        callback null

    @

module.exports = Suite
