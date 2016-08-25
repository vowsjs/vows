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

// This registers a hook so that coffeescript modules can be loaded

require('coffee-script/register');

const argv = require('yargs')
  .help('h')
  .argv;

let cwd = process.cwd();

let runTests = (testFileNames) => {
  let runNext = (err) => {
    if (err) {
      console.error(err);
    }
    if (testFileNames.length > 0) {
      let testFileName = testFileNames.shift();
      let testPath = path.join(cwd, testFileName);
      let runner = require(testPath);
      runner(runNext);
    }
  };
  runNext(null);
};

runTests(argv._);
