# Vows Revitalization Project 2017  
I don't have much experience with a legacy project like this, so I'm going to use this space for now to lay out a decision making and goal setting process for this library.  

Even if I don't make the best decisions, at least my thought process will be available to anyone still looking at this repo.  

On the chopping block:  
1. What makes Vows a unique testing library?   
2. How does it compare to the competition? (Mocha/Chai, Tape, Eva)   
3. Evaluate the purpose of the existing code and dependencies  
4. Determine a code style/guideline   

Goals:  
1. Maintain legacy functionality to support users of older versions.  
> If I make changes to the core API, I must implement some graceful degradation.  


------

# vows [![Build Status](https://api.travis-ci.org/vowsjs/vows.svg)](http://travis-ci.org/vowsjs/vows)

> Asynchronous BDD & continuous integration for node.js

#### <http://vowsjs.org> #

introduction
------------
There are two reasons why we might want asynchronous testing. The first, and obvious reason is that node.js is asynchronous, and therefore our tests need to be. The second reason is to make test suites which target I/O libraries run much faster.

_Vows_ is an experiment in making this possible, while adding a minimum of overhead.

synopsis
--------

```js
var vows = require('vows'),
    assert = require('assert');

vows.describe('Deep Thought').addBatch({
    'An instance of DeepThought': {
        topic: new DeepThought,

        'should know the answer to the ultimate question of life': function (deepThought) {
            assert.equal (deepThought.question('what is the answer to the universe?'), 42);
        }
    }
});
```

coverage reporting
------------------
Code coverage reporting is available if _instrumented_ code is detected.  Currently only _instrumentation_ via [node-jscoverage](https://github.com/visionmedia/node-jscoverage) is supported.  When _instrumented_ code is detected and coverage reporting is enabled using any of the `--cover-plain`, `--cover-html`, or `--cover-json` options a code coverage map is generated.

### downloading and installing [node-jscoverage](https://github.com/visionmedia/node-jscoverage)
[node-jscoverage](https://github.com/visionmedia/node-jscoverage) is a binary package that needs to be compiled from source:

```sh
$ git clone https://github.com/visionmedia/node-jscoverage.git
$ cd node-jscoverage/
$ ./configure
checking for a BSD-compatible install... /usr/bin/install -c
checking whether build environment is sane... yes
[...]
$ make && sudo make install
```

### instrumenting with jscoverage

```sh
$ jscoverage myfile.js myfile-instrumented.js
```

installation
------------

```sh
$ npm install vows
```

documentation
-------------

Head over to <http://vowsjs.org>

run tests
-------------

```sh
$ npm test
```

authors
-------

[Alexis Sellier](https://github.com/cloudhead), [Charlie Robbins](https://github.com/indexzero), [Jerry Sievert](https://github.com/jerrysievert)

*...and many others*
