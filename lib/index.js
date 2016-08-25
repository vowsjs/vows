// index.coffee -- main module for perjury
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

const _ = require('lodash');
const async = require('async');
const debug = require('debug')('perjury');

const assert = require('./assert');
const Suite = require('./suite');

let describe = function(description) {
  debug(`Creating new suite with description '${description}'`);
  return new Suite(description);
};

module.exports = {
  describe,
  assert: require('./assert')
};
