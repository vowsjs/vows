# batch.coffee -- A batch of tests for perjury
#
# Copyright 2016 fuzzy.io <evan@fuzzy.io>
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
debug = require('debug')('perjury:batch')

atMostOnce = require './at-most-once'

class Batch

  constructor: (@title, definition) ->

    assert _.isString(@title), "Batch title must be a string"
    assert _.isObject(definition), "Batch definition must be an object"

    debug("Batch constructor with title '#{@title}'")
    debug("Definition for '#{@title}' has #{_.keys(definition).length} keys")

    @topic = null
    @teardown = null
    @tests = {}
    @batches = {}

    for name, value of definition

      assert _.isString(name),
        "keys of definition must be strings, not '#{name}'"

      if name == "topic"
        debug("Adding topic to '#{@title}'")
        assert _.isFunction(value), "'topic' of '#{@title}' must be a function"
        @topic = value
      else if name == "teardown"
        debug("Adding teardown to '#{@title}'")
        assert _.isFunction(value),
          "'teardown' of '#{@title}' must be a function"
        @teardown = value
      else if _.isFunction(value)
        debug("Adding test '#{name}' to '#{@title}'")
        @tests[name] = value
      else if _.isObject(value)
        debug("Adding batch '#{name}' to '#{@title}'")
        @batches[name] = new Batch "#{@title} #{name}", value
      else
        throw new Error("Unexpected value '#{value}' for key '#{key}'")

    assert _.isFunction(@topic), "Batch '#{@title}' has no topic"

    assert _.size(@tests) > 0 or _.size(@batches) > 0,
      "Batch '#{@title}' has no sub-batches or tests"

    debug "Batch '#{@title}' has #{_.size(@tests)} tests"
    debug "Batch '#{@title}' has #{_.size(@batches)} batches"

    if @teardown?
      debug "Batch '#{@title}' has a teardown"
    else
      debug "Batch '#{@title}' has no teardown"

  run: (args, callback) ->

    assert _.isArray(args), "Args to Batch::run() must be an array"
    assert _.isFunction(callback), "Callback for Batch::run() must be function"

    debug "Beginning run of batch '#{@title}'"

    @reportBegin @title

    debug "Creating callback"

    next = @onTopicComplete args, callback

    try
      debug "Beginning topic of batch '#{@title}'"
      results = @topic.apply {callback: next}, args
      debug "Completed topic of batch '#{@title}'"
      if !_.isUndefined results
        debug "Results of topic of batch '#{@title}' defined; running sync"
        next null, results
      else
        debug "Results of topic of batch '#{@title}' undefined; running async"
    catch err
      debug "Error running topic of batch '#{@title}'"
      next err

    undefined

  onTopicComplete: (args, callback) =>

    atMostOnce (err, results...) =>

      debug "Results for topic of '#{@title}': #{err}, #{results.join(', ')}"

      failures = @runTests err, results

      assert _.isFinite(failures), "#{failures} must be a finite number"

      if failures > 0
        debug "#{failures} failures; skipping batches for '#{@title}'"
        @runTeardown results, callback
      else
        debug "#{failures} failures; running batches for '#{@title}'"
        @runBatches args, results, (err) =>
          debug "Batches for '#{@title}' complete"
          if err?
            debug "runBatches for '#{@title}' returned error '#{err}'"
          @runTeardown results, callback

      undefined

  runTeardown: (topicResults, callback) ->

    next = @onTeardownComplete callback

    if @teardown?

      debug "Running teardown for '#{@title}'"

      try
        tdres = @teardown.apply {callback: next}, topicResults
        if !_.isUndefined(tdres)
          debug "Results of teardown for '#{@title}' are defined; running sync"
          next null, tdres
        else
          debug "Results of teardown for '#{@title}' are undef; running async"
      catch err
        debug "Error thrown on teardown for '#{@title}': '#{err}'"
        next err

    else

      debug "No teardown for '#{@title}'"

      next null

  onTeardownComplete: (callback) ->

    atMostOnce (err, results...) =>

      debug "Teardown for '#{@title}' is complete"

      if err?
        debug "Teardown for '#{@title}' called with err '#{err}'"

      if results? and results.length > 0
        debug "Teardown for '#{@title}' called with results '#{results}'"

      callback null

  runTests: (err, results) ->

    failures = 0

    debug "Running #{_.size(@tests)} tests for batch '#{@title}'"

    if _.size(@tests) > 0

      args = _.concat [err], results

      debug "Passing args '#{args.join(', ')}' to tests for batch '#{@title}'"

      for name, test of @tests

        assert _.isString(name), "Name of test must be a string; '#{name}'"
        assert _.isFunction(test), "Test is not a function"

        debug "Running test '#{name}' for '#{@title}'"

        try

          @reportStartTest name
          test.apply null, args
          @reportSuccess name

          debug "Finished running test '#{name}' for '#{@title}'"

        catch err
          debug "Error running test '#{name}' for '#{@title}'"
          @reportFailure name, err
          failures += 1

    failures

  runBatches: (args, results, callback) ->

    assert _.isArray(args), "args for runBatches() must be an array"
    assert _.isArray(results), "results for runBatches() must be an array"
    assert _.isFunction(callback), "callback for runBatches() must be an array"

    debug "Running #{_.size(@batches)} batches for batch '#{@title}'"

    if _.size(@batches) == 0

      callback null

    else

      batchArgs = _.concat _.clone(results), args

      debug "Passing args '#{batchArgs.join(', ')}' to batches for '#{@title}'"

      runBatch = (batch, callback) ->

        batch.run batchArgs, callback

      async.each @batches, runBatch, (err) =>

        debug "Finished running batches for '#{@title}'"

        # FIXME: do something with the error
        callback err

  reportBegin: ->
    console.log @title

  reportStartTest: (name) ->

    assert _.isString(name), "Name for reportStartTest() must be a string"

    process.stdout.write "  #{name}: "

  reportSuccess: (name) ->

    assert _.isString(name), "Name for reportSuccess() must be a string"

    process.stdout.write "OK\n"

  reportFailure: (name, err) ->

    assert _.isString(name), "Name for reportFailure() must be a string"
    assert err instanceof Error, "Error for reportFailure() must be an error"

    process.stdout.write "#{err.name}: #{err.message}"

module.exports = Batch
