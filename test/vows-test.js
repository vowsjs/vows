var path = require('path');

require.paths.unshift(path.join(path.dirname(__filename), '..', 'lib'));

var events = require('events'),
    assert = require('assert');
var vows = require('vows');

var promiser = function (val) {
    return function () {
        var promise = new(events.Promise);
        process.nextTick(function () { promise.emitSuccess(val) });
        return promise;
    }
};

vows.tell("Vows", {
    "a context": {
        setup: promiser("hello world"),

        "testing equality": function (it) {
            assert.equal(it, "hello world");
        },
        "testing match": function (it) {
            assert.match(it, /[a-z]+ [a-z]+/);
        },
        "testing inclusion": function (it) {
            assert.include(it, "world");
        },
        "a nested context": {
            setup: function (parent) {
                return parent;
            },
            "with equality": function (it) {
                assert.equal(it, "hello world");
            }
        }
    }
});
