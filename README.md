
Vows.js
=======

asynchronous promise-based testing for node.js

usage
-----
    
    var vows = require('vows'),
        assert = require('assert');

    vows.tell('Deep Thought', -> () {
        question('what is the answer to the universe?').addVow(-> (answer) {
            assert.equals(answer, 42);
        }, 'it should know the answer to the ultimate question of life');
    });

