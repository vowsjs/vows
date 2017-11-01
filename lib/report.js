// report.js -- Report of the results of a batch and its sub-batches
//
// Copyright 2017 fuzzy.ai <evan@fuzzy.ai>
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

'use strict';

class Report {
  constructor(title) {
    this.title = title
    this.broken = 0
    this.successes = 0
    this.failures = 0
    this.tests = {}
    this.subs = {}
  }
  addSub(title, report) {
    this.subs[title] = report
    this.broken += report.broken
    this.successes += report.successes
    this.failures += report.failures
  }
}

module.exports = Report
