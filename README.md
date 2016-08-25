perjury
=======

perjury is a [vows.js](http://vowsjs.org/) work-alike library. Making false
vows is [perjury](https://en.wikipedia.org/wiki/Perjury).

The motivation is to make the internals of the test framework clearer, so when
your tests are mysteriously failing, you have some idea why.

License
-------

Copyright 2016 fuzzy.ai <legal@fuzzy.ai>

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

For `perjury`, the core concept is the test `batch`. A batch is an object that
consists of the following:

  * A `topic` function that generates values to be tested
  * One or more test functions, which accept the results of the `topic` and
    use assert macros to validate the results
  * One or more sub-batches

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
