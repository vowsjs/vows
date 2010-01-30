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
    "A context": {
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
        "with a nested context": {
            setup: function (parent) {
                return promiser(parent)();
            },
            "testing equality": function (it) {
                assert.equal(it, "hello world");
            }
        }
    },
    "Nested contexts": {
        setup: promiser(1),
        ".": {
            setup: function (a) {
                assert.equal(a, 1);
                return promiser(2)();
            },
            ".": {
                setup: function (b, a) {
                    assert.equal(b, 2);
                    assert.equal(a, 1);
                    return promiser(3)();
                },
                ".": {
                    setup: function (c, b, a) {
                        assert.equal(c, 3);
                        assert.equal(b, 2);
                        assert.equal(a, 1);
                        return promiser(4)();
                    },
                }
            }
        }
    }
});
