// at-most-once.coffee -- run a function at most once
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

const debug = require('debug')('perjury:at-most-once');

const assert = require('./assert');

let atMostOnce = function(fn) {
  let called = false;
  return function() {
    let args = Array.prototype.slice.call(arguments);
    if (!called) {
      called = true;
      return fn.apply(null, args);
    } else {
      throw new Error("Function called more than once!");
    }
  };
};

module.exports = atMostOnce;
