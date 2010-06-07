Vows
====

> Asynchronous BDD & continuous integration for node.js

introduction
------------
There are two reasons why we might want asynchronous testing. The first, and obvious reason is that node.js is asynchronous, and therefore our tests need to be. The second reason is to make test suites which target I/O libraries run much faster.

_Vows_ is an experiment in making this possible, while adding a minimum of overhead.

![vows-ss](http://files.droplr.com/files/36156834/ZfmbC.Screen%20shot%202010-05-11%20at%2020:19:25.png)

synopsis
--------

    var vows = require('vows'),
        assert = require('assert');

    vows.describe('Deep Thought').addVows({
        'An instance of DeepThought': {
            topic: new DeepThought,

            'should know the answer to the ultimate question of life': function (deepThought) {
                assert.equal (deepThought.question('what is the answer to the universe?'), 42);
            }
        }
    });

Documenation coming soon. For now, have a look at the tests in <http://github.com/cloudhead/resourcer> to
get an idea.

installation
------------

    $ npm install vows

writing specs
-------------

    vows.describe('A Database library').addVows({
        'A DB object': {
            // run this once, and execute the following tests when it completes
            topic: function () { return new(DB) },

            'set() should store a k/v pair': {
                // the inner context gets the return values of the outer contexts
                // passed as arguments. Here, `db` is new(DB).
                topic: function (db) { return db.set('pulp', 'orange') },

                // `res` is the value emitted by the above `db.set`
                'and return OK': function (res) {
                    assert.equal(res, "OK");
                },
                'and when checked for existence': {
                    // here, we need to access `db`, from the parent context.
                    // It's passed as the 2nd argument to `topic`, we discard the first,
                    // which would have been the above `res`.
                    topic: function (_, db) { return db.exists('pulp') },

                    'return true': function (re) {
                        assert.equal(re, true);
                    }
                }
            },
            'get()': {
                topic: function (db) { return db.get('dream') },
                'should return the stored value': function (res) {
                    assert.equal(res, 'catcher');
                }
            }
        }
    }).run();

assertion macros
----------------

### equality #

- assert.equal
- assert.notEqual
- assert.strictEqual
- assert.strictNotEqual

### type #

- assert.isFunction
- assert.isObject
- assert.isNaN
- assert.isString
- assert.isArray
- assert.isBoolean
- assert.isNumber
- assert.isNull
- assert.isUndefined
- assert.typeOf
- assert.instanceOf

### properties #

- assert.include
- assert.match
- assert.length
- assert.isEmpty

### exceptions #

- assert.throws
- assert.doesNotThrow
