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

"use strict";

const _ = require('lodash');
const async = require('async');
const debug = require('debug')('perjury:batch');

const assert = require('./assert');
const atMostOnce = require('./at-most-once');

const js = JSON.stringify;

class Batch {

  constructor(title, definition) {

    this.onTopicComplete = this.onTopicComplete.bind(this);
    this.title = title;
    assert.isString(this.title, "Batch title must be a string");
    assert.isObject(definition, "Batch definition must be an object");

    debug(`Batch constructor with title '${this.title}'`);
    debug(`Definition for '${this.title}' has ${_.keys(definition).length} keys`);

    this.topic = null;
    this.teardown = null;
    this.tests = {};
    this.batches = {};

    for (let name in definition) {

      let value = definition[name];
      assert.isString(name,
        `keys of definition must be strings, not '${name}'`);

      if (name === "topic") {
        debug(`Adding topic to '${this.title}'`);
        assert.isFunction(value,
          `'topic' of '${this.title}' must be a function`);
        this.topic = value;
      } else if (name === "teardown") {
        debug(`Adding teardown to '${this.title}'`);
        assert.isFunction(value,
          `'teardown' of '${this.title}' must be a function`);
        this.teardown = value;
      } else if (_.isFunction(value)) {
        debug(`Adding test '${name}' to '${this.title}'`);
        this.tests[name] = value;
      } else if (_.isObject(value)) {
        debug(`Adding batch '${name}' to '${this.title}'`);
        this.batches[name] = new Batch(`${this.title} ${name}`, value);
      } else {
        throw new Error(`Unexpected value '${value}' for key '${key}'`);
      }
    }

    assert.isFunction(this.topic, `Batch '${this.title}' has no topic`);

    assert(_.size(this.tests) > 0 || _.size(this.batches) > 0,
      `Batch '${this.title}' has no sub-batches or tests`);

    debug(`Batch '${this.title}' has ${_.size(this.tests)} tests`);
    debug(`Batch '${this.title}' has ${_.size(this.batches)} batches`);

    if (this.teardown !== null) {
      debug(`Batch '${this.title}' has a teardown`);
    } else {
      debug(`Batch '${this.title}' has no teardown`);
    }
  }

  run(args, callback) {

    assert.isArray(args, "Args to Batch::run() must be an array");
    assert.isFunction(callback, "Callback for Batch::run() must be function");

    debug(`Beginning run of batch '${this.title}'`);

    this.reportBegin(this.title);

    debug("Creating callback");

    let next = this.onTopicComplete(args, callback);

    try {
      debug(`Beginning topic of batch '${this.title}'`);
      let results = this.topic.apply({callback: next}, args);
      debug(`Completed topic of batch '${this.title}'`);
      if (!_.isUndefined(results)) {
        debug(`Results of topic of batch '${this.title}' defined; running sync`);
        next(null, results);
      } else {
        debug(`Results of topic of batch '${this.title}' undefined; running async`);
      }
    } catch (err) {
      debug(`Error running topic of batch '${this.title}'`);
      next(err);
    }

    return undefined;
  }

  onTopicComplete(args, callback) {

    let batch = this;

    return atMostOnce((function() {

      let calledWith = Array.prototype.slice.call(arguments),
        err = calledWith[0],
        results = calledWith.slice(1);

      debug(`Results for topic of '${this.title}': ${err}, ${results.join(', ')}`);

      let failures = this.runTests(err, results);

      assert.isNumber(failures, `${failures} must be a finite number`);

      if (err) {
        debug(`Error ${err} from topic; skipping batches for '${this.title}'`);
        this.runTeardown(results, callback);
      } else if (failures > 0) {
        debug(`${failures} failures; skipping batches for '${this.title}'`);
        this.runTeardown(results, callback);
      } else {
        debug(`${failures} failures; running batches for '${this.title}'`);
        this.runBatches(args, results, err => {
          debug(`Batches for '${this.title}' complete`);
          if (err !== null) {
            debug(`runBatches for '${this.title}' returned error '${err}'`);
          }
          return this.runTeardown(results, callback);
        });
      }

      return undefined;
    }).bind(this));
  }

  runTeardown(topicResults, callback) {

    let next = this.onTeardownComplete(callback);

    if (this.teardown !== null) {

      debug(`Running teardown for '${this.title}'`);

      try {
        let tdres = this.teardown.apply({callback: next}, topicResults);
        if (!_.isUndefined(tdres)) {
          debug(`Results of teardown for '${this.title}' are defined; running sync`);
          return next(null, tdres);
        } else {
          return debug(`Results of teardown for '${this.title}' are undef; running async`);
        }
      } catch (err) {
        debug(`Error thrown on teardown for '${this.title}': '${err}'`);
        return next(err);
      }

    } else {

      debug(`No teardown for '${this.title}'`);

      return next(null);
    }
  }

  onTeardownComplete(callback) {

    return atMostOnce((function() {

      let calledWith = Array.prototype.slice.call(arguments),
        err = calledWith[0],
        results = calledWith.slice(1);

      debug(`Teardown for '${this.title}' is complete`);

      if (err !== null) {
        debug(`Teardown for '${this.title}' called with err '${err}'`);
      }

      if ((results !== null) && results.length > 0) {
        debug(`Teardown for '${this.title}' called with results '${results}'`);
      }

      return callback(null);
    }).bind(this));
  }

  runTests(err, results) {

    let failures = 0;

    debug(`Running ${_.size(this.tests)} tests for batch '${this.title}'`);

    if (_.size(this.tests) > 0) {

      let args = _.concat([err], results);

      debug(`Passing args '${args.join(', ')}' to tests for batch '${this.title}'`);

      for (let name in this.tests) {

        let test = this.tests[name];
        assert.isString(name, `Name of test must be a string; '${name}'`);
        assert.isFunction(test, "Test is not a function");

        debug(`Running test '${name}' for '${this.title}'`);

        try {

          this.reportStartTest(name);
          test.apply(null, args);
          this.reportSuccess(name);

          debug(`Finished running test '${name}' for '${this.title}'`);

        } catch (caught) {
          debug(`Error running test '${name}' for '${this.title}'`);
          this.reportFailure(name, caught);
          failures += 1;
        }
      }
    }

    return failures;
  }

  runBatches(args, results, callback) {

    assert.isArray(args, "args for runBatches() must be an array");
    assert.isArray(results, "results for runBatches() must be an array");
    assert.isFunction(callback, "callback for runBatches() must be an array");

    debug(`Running ${_.size(this.batches)} batches for batch '${this.title}'`);

    if (_.size(this.batches) === 0) {

      return callback(null);

    } else {

      let batchArgs = _.concat(_.clone(results), args);

      debug(`Passing args '${batchArgs.join(', ')}' to batches for '${this.title}'`);

      let runBatch = (batch, callback) => batch.run(batchArgs, callback);

      return async.each(this.batches, runBatch, err => {

        debug(`Finished running batches for '${this.title}'`);

        // FIXME: do something with the error
        return callback(err);
      }
      );
    }
  }

  reportBegin() {
    return console.log(`  ${this.title}`);
  }

  reportStartTest(name) {

    assert.isString(name, "Name for reportStartTest() must be a string");

    return process.stdout.write(`    ${name}: `);
  }

  reportSuccess(name) {

    assert.isString(name, "Name for reportSuccess() must be a string");

    return process.stdout.write("OK\n");
  }

  reportFailure(name, err) {

    assert.isString(name, "Name for reportFailure() must be a string");
    assert.instanceOf(err, Error, "Error for reportFailure() must be an error");

    return process.stdout.write(`${err.name}: ${err.message}\n`);
  }
}

module.exports = Batch;
