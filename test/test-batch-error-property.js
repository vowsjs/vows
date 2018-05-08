// test-batch-error-property.js -- Test using an error property on a batch

// Copyright 2018 fuzzy.ai <evan@fuzzy.ai>
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

const vows = require('../lib/index')
const assert = vows.assert

vows.describe('error property of batch')
  .addBatch({
    'When we run a batch that throws an error from the topic': {
      topic () {
        const callback = this.callback
        vows.describe('Wrapped batch')
          .addBatch({
            'When we run a batch that throws an error from the topic': {
              topic () {
                throw new Error('Topic throws an error')
              },
              error () {
                callback(null)
              },
              'and we have a test' (data) {
                callback(new Error('Test was called even though there was an error'))
              },
              'and we have a sub-batch': {
                topic () {
                  callback(new Error('Sub-batch should not be called'))
                },
                'it works' (err) {
                  assert.ifError(err)
                }
              }
            }
          })
          .run()
      },
      'it fails correctly' (err) {
        assert.ifError(err)
      }
    }
  })
  .addBatch({
    'When we run a batch that returns a value from the topic': {
      topic () {
        return 23
      },
      error () {
        assert.fail('Error handler was called even though there was no error')
      },
      'and we have a test' (data) {
        assert.isNumber(data)
        assert.equal(data, 23)
      }
    }
  })
  .addBatch({
    'When we run a batch that returns an error to the callback': {
      topic () {
        const callback = this.callback
        vows.describe('Wrapped batch')
          .addBatch({
            'When we run a batch that returns an error to the callback': {
              topic () {
                this.callback(new Error('Topic returns an error'))
              },
              error () {
                callback(null)
              },
              'and we have a test' (data) {
                callback(new Error('Test was called even though there was an error'))
              },
              'and we have a sub-batch': {
                topic () {
                  callback(new Error('Sub-batch should not be called'))
                },
                'it works' (err) {
                  assert.ifError(err)
                }
              }
            }
          })
          .run()
      },
      'it fails correctly' (err) {
        assert.ifError(err)
      }
    }
  })
  .addBatch({
    'When we run a batch that returns a value to the callback': {
      topic () {
        this.callback(null, 23)
      },
      error () {
        assert.fail('Error handler was called even though there was no error')
      },
      'and we have a test' (data) {
        assert.isNumber(data)
        assert.equal(data, 23)
      }
    }
  })
  .addBatch({
    'When we run a batch that returns a Promise that rejects': {
      topic () {
        const callback = this.callback
        vows.describe('Wrapped batch')
          .addBatch({
            'When we run a batch that returns a Promise that rejects': {
              topic () {
                return new Promise((resolve, reject) => {
                  reject(new Error('Error from the promise'))
                })
              },
              error () {
                callback(null)
              },
              'and we have a test' (data) {
                callback(new Error('Test was called even though there was an error'))
              },
              'and we have a sub-batch': {
                topic () {
                  callback(new Error('Sub-batch should not be called'))
                },
                'it works' (err) {
                  assert.ifError(err)
                }
              }
            }
          })
          .run()
      },
      'it fails correctly' (err) {
        assert.ifError(err)
      }
    }
  })
  .addBatch({
    'When we run a batch that returns a Promise that resolves': {
      topic () {
        return new Promise((resolve, reject) => {
          resolve(23)
        })
      },
      error () {
        assert.fail('Error handler was called even though there was no error')
      },
      'and we have a test' (data) {
        assert.isNumber(data)
        assert.equal(data, 23)
      }
    }
  })
  .addBatch({
    'When we run a batch  with no error() that throws from the topic': {
      topic () {
        const callback = this.callback
        vows.describe('Wrapped batch')
          .addBatch({
            'When we run a batch that throws an error from the topic': {
              topic () {
                throw new Error('Topic throws an error')
              },
              'and we have a test' (err, data) {
                assert.ok(err)
                assert.isUndefined(data)
                callback(null)
              },
              'and we have a sub-batch': {
                topic () {
                  callback(new Error('Sub-batch should not be called'))
                },
                'it works' (err) {
                  assert.ifError(err)
                }
              }
            }
          })
          .run()
      },
      'it fails correctly' (err) {
        assert.ifError(err)
      }
    }
  })
  .addBatch({
    'When we run a batch with no error() that returns a value from the topic': {
      topic () {
        return 23
      },
      'and we have a test' (err, data) {
        assert.ifError(err)
        assert.isNumber(data)
        assert.equal(data, 23)
      }
    }
  })
  .export(module)
