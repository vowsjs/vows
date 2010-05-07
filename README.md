Vows
====

asynchronous testing for node.js

introduction
------------
There are two reasons why we might want asynchronous testing. The first, and obvious reason is that node.js is asynchronous, and therefore our tests need to be. The second reason is to make test suites which target I/O libraries run much faster.

_Vows_ is an experiment in making this possible, while adding a minimum of overhead.

![vows-ss](http://dl.dropbox.com/u/251849/vows-ss.gif)

synopsis
--------
    
    var vows = require('vows'),
        assert = require('assert');

    vows.tell('Deep Thought', function () {
        question('what is the answer to the universe?').addVow(function (answer) {
            assert.equals(answer, 42);
        }, 'it should know the answer to the ultimate question of life');
    });

In the example above, `question()` would be a function which returns an `EventEmitter`.
When the `"success"` event is emitted, the function passed to `addVow` is run,
and the results output to the console. 

Vows are run as soon as the promise completes, so the order in which they are run is undefined.

writing specs
-------------

    vows.tell('A Database library', {
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
    });
