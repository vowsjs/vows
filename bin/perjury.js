#!/usr/bin/env node

// perjury.js -- command-line driver for perjury test scripts
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

/* jshint esversion: 6 */

"use strict";

const path = require('path');

const _ = require('lodash');
const debug = require('debug')('perjury:command-line');

// This registers a hook so that coffeescript modules can be loaded

require('coffee-script/register');

const argv = require('yargs')
  .help('h')
  .argv;

let cwd = process.cwd();

let runTests = (testFileNames, callback) => {
  let broken = 0,
    successes = 0,
    failures = 0;

  let runNext = (filenames, callback) => {
    if (filenames.length > 0) {
      let testFileName = filenames[0];
      let testPath = path.join(cwd, testFileName);
      let runner = require(testPath);
      runner((err, suiteBroken, suiteSuccesses, suiteFailures) => {
        if (err) {
          console.error(err);
        }
        debug(`Finished suite ${testFileName}: ${suiteBroken}, ${suiteSuccesses}, ${suiteFailures}`);
        if (_.isNumber(suiteBroken)) {
          broken += suiteBroken;

        }
        if (_.isNumber(suiteSuccesses)) {
          successes += suiteSuccesses;
        }
        if (_.isNumber(suiteFailures)) {
          failures += suiteFailures;
        }
        runNext(filenames.slice(1), callback);
      });
    } else {
      callback(null);
    }
  };

  runNext(testFileNames, (err) => {
    if (err) {
      console.error(err);
    }
    debug(`Finished suites: ${broken}, ${successes}, ${failures}`);
    callback(null, broken, successes, failures);
  });
};

runTests(argv._, (err, broken, successes, failures) => {
  if (err) {
    console.error(err);
  } else {
    console.log("SUMMARY");
    console.log(`\tBroken:\t${broken}`);
    console.log(`\tSuccesses:\t${successes}`);
    console.log(`\tFailures:\t${failures}`);
    if (broken > 0 || failures > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
});
