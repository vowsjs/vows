// test-topic-error.js -- A test script that uses perjury
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
    'When we create a suite that throws an error': {
      topic() {
        let suite = vows.describe('internal sub suite');
        suite.addBatch({
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
        });
        suite.addBatch({
          'When we use the async callback with an error argument': {
            topic() {
              this.callback(new Error("Oh no Mr. Bill"));
              return undefined;
            },
            'it works': (err) => {
              assert.isObject(err);
              assert.instanceOf(err, Error);
              assert.equal(err.message, "Oh no Mr. Bill");
            },
            'sub-batch is not called': {
              topic() {
                throw new Error("sub-batch shouldn't be called if parent errored");
              },
              'it is not called': (err) => {
                assert.ifError(err);
              }
            }
          }
        });
        return suite;
      },
      'it works': (err, suite) => {
        assert.ifError(err);
        assert.isObject(suite);
      },
      'and we run the suite': {
        topic(suite) {
          let callback = this.callback,
            oldWrite = process.stdout.write,
            redir = fs.createWriteStream("/dev/null", {defaultEncoding: "utf8"});
          process.stdout.write = redir.write.bind(redir);
          suite.run((err, broken, successes, failures) => {
            process.stdout.write = oldWrite;
            callback(err, broken, successes, failures);
          });
        },
        'it works': (err, broken, successes, failures) => {
          assert.ifError(err);
          assert.isNumber(broken);
          assert.isNumber(successes);
          assert.isNumber(failures);
        }
      }
    }
  })
  .export(module);
