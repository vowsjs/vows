// test-assert-root.js -- Test assert()
//
// Copyright 2017 AJ Jordan <alex@strugee.net>
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

const vows = require('../lib/index');
const assert = vows.assert;

vows
  .describe('bare assert()')
  .addBatch({
    'When we assert(true)': {
      topic() {
        try {
          assert(true);
          this.callback(null);
        } catch (err) {
          this.callback(err);
        }
      },
      'it succeeds': (err) => {
        assert.ifError(err);
      }
    }
  })
  .addBatch({
    'When we assert(false)': {
      topic() {
        try {
          assert(false);
          this.callback(new Error('Unexpected success'));
        } catch (err) {
          this.callback(null);
        }
      },
      'it fails': (err) => {
        assert.ifError(err);
      }
    }
  })
  .export(module);
