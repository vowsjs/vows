// test.coffee -- A test script that uses perjury
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

const fs = require('fs');

const _ = require('lodash');
const vows = require('../lib/index');
const assert = vows.assert;

vows.describe('First test')
  .addBatch({
    'When we open a file': {
      topic() {
        fs.open("/tmp/fakefile", "w", this.callback);
        return undefined;
      },
      ['it works'](err, fd) {
        assert.ifError(err);
        return assert.isNumber(fd);
      },
      teardown(fd) {
        fs.close(fd, this.callback);
        return undefined;
      },
      'and we write to the file': {
        topic(fd) {
          fs.write(fd, "My dog has fleas\n", this.callback);
          return undefined;
        },
        ['it works'](err, written, buffer) {
          assert.ifError(err);
          assert.greater(written, 0);
          return assert.isString(buffer);
        }
      }
    }
  })
  .run();
