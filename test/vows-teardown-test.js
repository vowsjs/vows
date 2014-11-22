var vows = require('../'),
    assert = require('assert');

var teardowns = []

var suite = vows.describe('test teardown callback').addBatch({
    'when we do an async operation': {
        topic: function() {
            var cb = this.callback;
            process.nextTick(function() {
                cb(null, 42);
            });
        },
        'it works': function(err, value) {
            assert.ifError(err);
            assert.equal(value, 42);
        },
        teardown: function(value) {
            var cb = this.callback;
            setTimeout(function() {
                teardowns.push('second');
                cb(null);
            }, 500);
        },
        'and we do a sub-context': {
            topic: function() {
                var cb = this.callback;
                process.nextTick(function() {
                    cb(null, 23);
                });
            },
            'it works': function(err, value) {
                assert.ifError(err);
                assert.equal(value, 23);
            },
            teardown: function(value) {
                var cb = this.callback;
                setTimeout(function() {
                    teardowns.push('first');
                    cb(null);
                }, 1000);
            }
        }
    }
}).addBatch({
    'the teardowns themselves': {
        topic: teardowns,
        'should be in the correct order': function (list) {
            assert.deepEqual(list, ['first', 'second']);
        }
    }
})

suite['export'](module);
