var path = require('path');

require.paths.unshift(path.join(__dirname, '..', 'lib'));

var events = require('events'),
    assert = require('assert');
var vows = require('vows');

var api = vows.prepare({
    get: function (id, callback) {
        process.nextTick(function () { callback(null, id) });
    },
    version: function () { return '1.0' }
}, ['get']);

var promiser = function (val) {
    return function () {
        var promise = new(events.EventEmitter);
        process.nextTick(function () { promise.emit('success', val) });
        return promise;
    }
};

vows.describe("Vows", {
    "A context": {
        topic: promiser("hello world"),

        "testing equality": function (it) {
            assert.equal(it, "hello world");
        },
        "testing match": function (it) {
            assert.match(it, /[a-z]+ [a-z]+/);
        },
        "testing inclusion": function (it) {
            assert.include(it, "world");
        },
        "testing type": function (it) {
            assert.typeOf(it, 'string');
            assert.isArray([]);
            assert.isObject({});
        },
        "testing emptiness": function (it) {
            assert.isEmpty({});
            assert.isEmpty([]);
            assert.isEmpty("");
        },
        "with a nested context": {
            topic: function (parent) {
                this.state = 42;
                return promiser(parent)();
            },
            "testing equality": function (it) {
                assert.equal(it, "hello world");
            },
            "has access to the environment": function () {
                assert.equal(this.state, 42);
            },
            "a sub context": {
                topic: function () {
                    return this.state;
                },
                "has access to the parent environment": function (r) {
                    assert.equal(r, 42);
                    assert.equal(this.state, 42);
                },
                "has access to the parent context object": function (r) {
                    assert.ok(Array.isArray(this.context.topics));
                    assert.include(this.context.topics, "hello world");
                }
            }
        }
    },
    "Nested contexts": {
        topic: promiser(1),

        "have": {
            topic: function (a) { return promiser(2)() },

            "access": {
                topic: function (b, a) { return promiser(3)() },

                "to": {
                    topic: function (c, b, a) { return promiser([4, c, b, a])() },

                    "the parent topics": function (topics) {
                        assert.equal(topics.join(), [4, 3, 2, 1].join());
                    }
                },

                "from": {
                    topic: function (c, b, a) { return promiser([4, c, b, a])() },

                    "the parent topics": function(topics) {
                        assert.equal(topics.join(), [4, 3, 2, 1].join());
                    }
                }
            }
        }
    },
    "Non-promise return value": {
        topic: function () { return 1 },
        "should be converted to a promise": function (val) {
            assert.equal(val, 1);
        }
    },
    "A 'prepared' interface": {
        "with a wrapped function": {
            topic: function () { return api.get(42) },
            "should work as expected": function (val) {
                assert.equal(val, 42);
            }
        },
        "with a non-wrapped function": {
            topic: function () { return api.version() },
            "should work as expected": function (val) {
                assert.equal(val, '1.0');
            }
        }
    },
    "Non-functions as subjects": {
        topic: 45,

        "should work as expected": function (subject) {
            assert.equal(subject, 45);
        }
    }
});
