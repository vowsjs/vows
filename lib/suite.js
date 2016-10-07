// suite.js -- a suite of batches of tests for perjury
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
const debug = require('debug')('perjury:suite');

const assert = require('./assert');
const Batch = require('./batch');

class Suite {

  constructor(description) {

    this.run = this.run.bind(this);
    this.description = description;
    assert.isString(this.description, "Suite description must be a string");

    debug(`Suite constructor with description '${this.description}'`);

    this.batches = [];
  }

  addBatch(obj) {

    assert.isObject(obj, "Argument to addBatch must be an Object");
    assert.equal(_.keys(obj).length, 1, "Argument to addBatch must have one key");

    let title = _.keys(obj)[0];

    debug(`Adding batch '${title}' to suite '${this.description}'`);

    let batch = new Batch(title, obj[title]);

    this.batches.push(batch);

    return this;
  }

  export(module) {

    assert.isObject(module, "Module is not an object");

    module.exports = this.run;

    return this;
  }

  run(callback) {

    let broken = 0,
      successes = 0,
      failures = 0;

    assert(_.isUndefined(callback) || _.isFunction(callback),
      "If defined callback must be a function");

    let runBatch = (batch, callback) => {

      assert.isObject(batch, "batch is not an object");
      assert.instanceOf(batch, Batch, "batch is not a Batch");
      debug(`Running batch '${batch.title}' from suite '${this.description}'`);
      batch.run([], (err, batchBroken, batchSuccesses, batchFailures) => {
        if (err) {
          callback(err);
        } else {

          debug(`Batch ${batch.title} complete: ${batchBroken},${batchSuccesses},${batchFailures}`);

          assert.ok(_.isFinite(batchBroken), `batchBroken must be number, is ${batchBroken}`);
          assert.ok(_.isFinite(batchSuccesses), `batchSuccesses must be number, is ${batchSuccesses}`);
          assert.ok(_.isFinite(batchFailures), `batchFailures must be number, is ${batchFailures}`);

          broken += batchBroken;
          successes += batchSuccesses;
          failures += batchFailures;

          callback(null);
        }
      });
    };

    debug(`Running ${_.size(this.batches)} batches for suite '${this.description}'`);

    console.log();
    console.log(this.description);
    console.log();

    async.eachSeries(this.batches, runBatch, function(err) {
      if (err) {
        console.error(err);
      }

      console.log();

      if (_.isFunction(callback)) {
        return callback(null, broken, successes, failures);
      }
    });

    return this;
  }
}

module.exports = Suite;
