// suite.coffee -- a suite of batches of tests for perjury
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
    assert(_.isString(this.description), "Suite description must be a string");

    debug(`Suite constructor with description '${this.description}'`);

    this.batches = [];
  }

  addBatch(obj) {

    assert(_.isObject(obj), "Argument to addBatch must be an Object");
    assert.equal(_.keys(obj).length, 1, "Argument to addBatch must have one key");

    let title = _.keys(obj)[0];

    debug(`Adding batch '${title}' to suite '${this.description}'`);

    let batch = new Batch(title, obj[title]);

    this.batches.push(batch);

    return this;
  }

  export(module) {

    assert(_.isObject(module), "Module is not an object");

    module.exports = this.run;

    return this;
  }

  run(callback) {

    assert(_.isUndefined(callback) || _.isFunction(callback),
      "If defined callback must be a function");

    let runBatch = (batch, callback) => {

      assert(_.isObject(batch) && batch instanceof Batch, "Not a batch");
      debug(`Running batch '${batch.title}' from suite '${this.description}'`);
      return batch.run([], callback);
    };

    debug(`Running ${_.size(this.batches)} batches for suite '${this.description}'`);

    console.log(this.description);

    async.eachSeries(this.batches, runBatch, function(err) {
      if (err) {
        console.error(err);
      }
      if (_.isFunction(callback)) {
        return callback(null);
      }
    });

    return this;
  }
}

module.exports = Suite;
