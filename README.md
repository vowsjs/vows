perjury
=======

perjury is a [vows.js](http://vowsjs.org/) work-alike library. Making false
vows is [perjury](https://en.wikipedia.org/wiki/Perjury).

The motivation is to make the internals of the test framework clearer, so when
your tests are mysteriously failing, you have some idea why.

License
-------

Copyright 2016, 2017 fuzzy.ai <mailto:legal@fuzzy.ai>

Copyright 2017 AJ Jordan <mailto:alex@strugee.net>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Example
-------

```javascript

// You should be able to do this

var vows = require('perjury');

// perjury does not pollute the assert module namespace by default, but
// this should give you the same behaviour

var assert = vows.assert;

// This should look a lot like your regular tests if you're already a vows
// user. If you're not, welcome!

vows
  .describe("My first vows test")
  .addBatch({
    'When we open a file': {
      topic: function() {
        fs.open("/tmp/fakefile", "w", this.callback);
      },
      'it works': function(err, fd) {
        assert.ifError(err);
        assert.isNumber(fd);        
      },
      teardown: function(fd) {
        fs.close(fd, this.callback);
      }
      'and we write to the file': {
        topic: function(fd) {
          fs.write(fd, "My dog has fleas\n", this.callback);
        },
        'it works': function(err, written, buffer) {
          assert.ifError(err);
          assert.greater(written, 0);
          assert.isString(buffer);        
        }
      }
    }
  })
  .run();

```

Introduction
------------

`perjury` is an attempt to make a version of `vows` where I know why my tests
fail. This has been surprisingly hard with vows.

Requiring
---------

You require the module like any other module. If you have a lot of code that
uses the `vows` module, you should probably be able to just require the
`perjury` module and be done with it.

Assert macros
-------------

*However*, unlike `vows`, `perjury` will not pollute the namespace of the
built-in `assert` module by default. Instead, it exports an `assert` property
with the macros you want as properties.

So, if you use the assert macros from `vows`, you should change your code that
looks like this:

```javascript
var vows = require('vows');
var assert = require('assert');
```

to this:

```javascript
var vows = require('perjury');
var assert = vows.assert;
```

Data structures
---------------

The basic way to use vows-like tests is to build really large hierarchical
objects with a particular well-defined form.

### Batch

For `perjury`, the core concept is the test `batch`. A batch is an object that
consists of the following:

  * A `topic` function that generates values to be tested
  * One or more test functions, which accept the results of the `topic` and
    use assert macros to validate the results
  * Zero or more sub-batches
  * An optional `teardown` function that cleans up any values generated by the

A batch can be either *synchronous* or *asynchronous*. For a synchronous batch,
the `topic` function just returns a value, and the test functions measure that
value:

```javascript
let batch = {
  "We get the answer":  {
    topic() {
      return 6 * 7;
    },
    "it equals 42": (err, answer) => {
      assert.ifError(err);
      assert.equal(answer, 42);
    }
  }
};
```

For an asynchronous batch, the topic returns its results through the `callback`
property of `this`. `perjury` knows that the callback will be used because the
result returned by the `topic` function is `undefined`.

```javascript
let batch = {
  "When we get the answer":  {
    topic() {
      this.callback(null, 6 * 7);
      return undefined;
    },
    "it equals 42": (err, answer) => {
      assert.ifError(err);
      assert.equal(answer, 42);
    }
  }
};
```

Alternately, a topic can return a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).
Perjury will resolve the returned Promise and call tests with the same `(err, results)`
format as with other types of call.

```javascript
let batch = {
  "When we get the answer":  {
    topic() {
      return new Promise((resolve, reject) => {
        fs.open("/tmp/testfile", "w", (err, fd) => {
          if (err) {
            reject(err);
          } else {
            resolve(fd);
          }
        })
      });
    },
    "it equals 42": (err, fd) => {
      assert.ifError(err);
      assert.isNumber(fd);
    }
  }
};
```

Note that all test functions receive at least an `err` argument, and then one or
more arguments. Synchronous batches can only have one test argument; asynchronous
batches can have a lot.

A batch can also have sub-batches. These are just properties of the batch that are
also batch objects, with their own `topic`, tests, sub-batches, `teardown`, etc.
The argument to the topic will be the results of the parent batch, in reverse
order up the hierarchy.

```javascript
let batch = {
  "When we get the answer":  {
    topic() {
      this.callback(null, 6 * 7);
      return undefined;
    },
    "it equals 42": (err, answer) => {
      assert.ifError(err);
      assert.isNumber(answer);
      assert.equal(answer, 42);
    },
    "and we ask a couple of questions": {
      topic(answer) {
        this.callback(null, "What is six times seven?", "How many roads must a person walk down?");
        return undefined;
      },
      "they look plausible": (err, question1, question2) => {
        assert.ifError(err);
        assert.isString(question1);
        assert.equal(question1[question1.length - 1], '?');
        assert.isString(question2);
        assert.equal(question2[question2.length - 1], '?');
      },
      "and we compare the answer and the question": {
        topic(question1, question2, answer) {
          this.callback(null, question1, question2, answer);
          return undefined;
        },
        "they match up well": (err, question1, question2, answer) => {
          assert.ifError(err);
          // NB: you need to implement isAnswerTo yourself
          assert(isAnswerTo(answer, question1));
          assert(isAnswerTo(answer, question2));
        }
      }
    }
  }
};
```

Note that if a batch's `topic` returns more than one value, they will be provided
*in order* for any sub-batches' `topic`, but hierarchically *in reverse order*.
This may be a little confusing.

Note also that if an error occurs, in either the topic or the tests, the
sub-batches will not be run.

The `teardown` method is called after all the tests and sub-batches have been run.
So, the order is something like this:

   - topic
   - tests
   - sub-batches (if there are no errors)
   - teardown

The `teardown` gets the non-error results of the `topic` as arguments. It's useful
for cleaning up things that the `topic` made a mess of.

```javascript

batch = {
  'When we open a file': {
    topic: function() {
      fs.open("/tmp/fakefile", "w", this.callback);
    },
    'it works': function(err, fd) {
      assert.ifError(err);
      assert.isNumber(fd);
    },
    teardown: function(fd) {
      fs.close(fd, this.callback);
    }
  }
};

```

`teardown` functions can also be synchronous or asynchronous, or they can return
a Promise. However, the results are ignored.

```javascript
let batch = {
  "When we get the answer":  {
    topic() {
      return new Promise((resolve, reject) => {
        fs.open("/tmp/testfile", "w", (err, fd) => {
          if (err) {
            reject(err);
          } else {
            resolve(fd);
          }
        })
      });
    },
    "it equals 42": (err, fd) => {
      assert.ifError(err);
      assert.isNumber(fd);
    },
    teardown(fd) {
      return new Promise((resolve, reject) => {
        if (typeof(fd) != 'number') {
          reject(new Error("File descriptor is not a number"));
        } else {
          fs.close(fd, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          })
        }
      });
    }
  }
};
```


Note that the teardown will be called regardless of whether errors happened or
not, so it's a good idea to check the arguments to make sure they're valid.

Teardowns are called as soon as the batch finishes; this is different from how
vows.js works, but it is better.

### Suite

Batches are organized into suites. You create a suite with the `describe` method
of `vows`.

```javascript
const vows = require('perjury');

let suite = vows.describe('A new suite');
```

You can then add one or more batches to the suite using the `addBatch` method.

```javascript
suite.addBatch(batch1);
suite.addBatch(batch2);
suite.addBatch(batch3);
```

Finally, you have two options to actually run the test suite. The first is the
aptly-named `run()` method, which runs all the tests and reports the results to
`stdout`. You can then run the script through node and you'll run all your
tests.

Alternately, you can use the `export()` method, passing the current `module` as
an argument. This will change the `exports` property of the `module` to be the
`run()` method of the suite. In other words, the module will now export a single
function that runs the suite.

The `perjury` command-line tool can be used to run all your test modules that
use `export()`.

```shell
./node_modules/.bin/perjury test/*.js
```

All the suite methods are [chainable](https://en.wikipedia.org/wiki/Method_chaining).
The typical way to actually use this library, then, is to require vows, use the
`describe` method to create a suite, use `addBatch` to add one or more batches,
and then use `export(module)` or more rarely `run()` to run the suite.

```javascript
const fs = require('fs');
const vows = require('perjury');
let assert = vows.assert;

vows.describe('Input/output tests')
  .addBatch({
    'When we open a file': {
      topic: function() {
        fs.open("/tmp/fakefile", "w", this.callback);
      },
      'it works': function(err, fd) {
        assert.ifError(err);
        assert.isNumber(fd);
      },
      teardown: function(fd) {
        fs.close(fd, this.callback);
      }
    }
  })
  .export(module);
```

CoffeeScript
------------

[CoffeeScript](http://coffeescript.org/) is a nice pre-processor for JavaScript.
If you write your test scripts in CoffeeScript, it's totally OK to run them with
the `perjury` command-line tool, as-is.

```shell
./node_modules/.bin/perjury test/*.js test/*.coffee
```

`perjury` uses the CoffeeScript package to load the test modules automatically.

Debugging
---------

[Test-driven development](https://en.wikipedia.org/wiki/Test-driven_development)
means roughly that write your tests *first*, then write the implementations,
then keep running the tests till they work.

Unfortunately, vows.js can be really hard to use for TDD, because it doesn't
give you a lot of information about where errors are happening. Sometimes it's
your test code; at other times it's the code you're trying to test. The
structures that vows.js and `perjury` use can be tricky to get right.

`perjury` doesn't necessarily do a fantastic job at this, but it's a little
better, and it's definitely a goal. `perjury` uses the
[debug](https://www.npmjs.com/package/debug) library to spoot out debug info to
stderr at run time. This can be very useful for looking at how the `perjury`
module is running, and figuring out where errors are happening.

To use it, define the `DEBUG` environment variable when running your tests:

```shell
DEBUG=perjury:* ./node_modules/.bin/perjury mytest.js
```

Watch this space for more help in doing TDD with perjury.

assert
------

The exposed `assert` module-ish object has a number of useful methods for doing
tests. `perjury` avoids most of the namespace pollution problems that vows.js
has, so you should feel OK using these.

The module exposes all the methods of the built-in
[assert](https://nodejs.org/api/assert.html) module. It also has the following
utility methods. Each will do a check and if the check fails, will throw a new
`AssertionError` with either the `message` argument as its message, or a
standard message for that macro.

### assert.epsilon(eps, actual, expected, message)

Checks that the number `actual` is within `eps` from `expected`.

### assert.match(actual, expected, message)

Checks that `actual` matches the regular expression `expected`. Note that
`actual` will be coerced to a string if it is not one already.

`assert.matches` is a synonym.

### assert.isTrue(actual, message)

Checks that `actual` is `true` (not just truthy; `true`).

### assert.isFalse(actual, message)

Checks that `actual` is `false` (not just falsy; `false`).

### assert.isZero(actual, message)

Checks that `actual` is 0.

### assert.isNotZero(actual, message)

Checks that `actual` is not 0.

### assert.greater(actual, expected, message)

Checks that `actual` is strictly greater than `expected`.

### assert.lesser(actual, expected, message)

Checks that `actual` is strictly lesser than `expected`.

### assert.inDelta(actual, expected, delta, message)

Checks that `actual` is less than `delta` away from `expected`. It's a lot
like `assert.epsilon()`.

### assert.include(actual, expected, message)

Checks that `actual` contains `expected`. `assert.includes` is a synonym.

### assert.notInclude(actual, expected, message)

Checks that `actual` does not contain `expected`. `assert.notIncludes` is a
synonym.

### assert.isEmpty(actual, message)

Checks that `actual` is empty (an empty array or an object with no properties).

### assert.isNotEmpty(actual, message)

Checks that `actual` is not empty.

### assert.isArray(actual, message)

Checks that `actual` is an array.

### assert.isObject(actual, message)

Checks that `actual` is an object.

### assert.isNumber(actual, message)

Checks that `actual` is a number.

### assert.isBoolean(actual, message)

Checks that `actual` is a boolean (`true` or `false`).

### assert.isNaN(actual, message)

Checks that `actual` is `NaN`.

### assert.isNull(actual, message)

Checks that `actual` is `null`.

### assert.isNotNull(actual, message)

Checks that `actual` is not `null`.

### assert.isUndefined(actual, message)

Checks that `actual` is `undefined`.

### assert.isDefined(actual, message)

Checks that `actual` is not `undefined`.

### assert.isString(actual, message)

Checks that `actual` is a string.

### assert.isFunction(actual, message)

Checks that `actual` is a function.

### assert.typeOf(actual, expected, message)

Checks that `actual` is of type `expected`.

### assert.instanceOf(actual, expected, message)

Checks that `actual` is an object and an instance of `expected`.
