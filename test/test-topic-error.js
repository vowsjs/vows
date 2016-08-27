// test-export.js -- A test script that uses perjury
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

const fs = require('fs');

const _ = require('lodash');

const vows = require('../lib/index');
const assert = vows.assert;

vows
  .describe('throwing an error in a topic')
  .addBatch({
    'When we throw an error in a topic': {
      topic() {
        throw new Error("Test error");
      },
      'it is passed on to tests': (err) => {
        assert.isObject(err);
        assert.instanceOf(err, Error);
        assert.equal(err.message, "Test error");
      },
      'sub batches are not run': {
        topic() {
          throw new Error("This batch should not be run");
        },
        "sub-batch tests are not run": (err) => {
          assert.ifError(err);
        }
      }
    }
  })
  .export(module);
