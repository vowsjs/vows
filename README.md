Vows
====

asynchronous promise-based testing for node.js

synopsis
--------
    
    var vows = require('vows'),
        assert = require('assert');

    vows.tell('Deep Thought', function () {
        question('what is the answer to the universe?').addVow(function (answer) {
            assert.equals(answer, 42);
        }, 'it should know the answer to the ultimate question of life');
    });

In the example above, `question()` would be a function which returns a _promise_.
When the `"success"` event is emitted, the function passed to `addVow` is run,
and the results output to the console. 

Vows are run as soon as the promise completes, so the order in which they are run is undefined.

