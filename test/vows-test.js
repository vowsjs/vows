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

vows.describe("Vows").addVows({
    "A context": {
        topic: promiser("hello world"),

        "testing equality": function (it) {
            assert.equal(it, "hello world");
        },
        "testing match": function (it) {
            assert.match(it, /[a-z]+ [a-z]+/);
        },
        "testing length": function (it) {
            assert.length(it, 11);
        },
        "testing inclusion": function (it) {
            assert.include(it, "world");
        },
        "testing type": function (it) {
            assert.typeOf(it, 'string');
            assert.isArray([]);
            assert.isObject({});
            assert.isNumber(0);
            assert.isNaN(0/0);
        },
        "testing value": function (it) {
            assert.isFalse(false);
            assert.isTrue(true);
            assert.isZero(0);
            assert.isNotZero(1);
            assert.isNull(null);
            assert.isNotNull(0);
            assert.greater(5, 4);
            assert.lesser(4, 5);
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
    "Nested contexts with no topics": {
        topic: 45,
        "should": {
            "pass": {
                "the value down": function (topic) {
                    assert.equal(topic, 45);
                }
            }
        }
    },
    "Nested contexts with topic gaps": {
        topic: 45,
        "should": {
            "pass": {
                topic: 101,
                "the": {
                    "values": {
                        topic: function (prev, prev2) {
                            return this.context.topics.slice(0);
                        },
                        "down": function (topics) {
                            assert.length(topics, 2);
                            assert.equal(topics[0], 101);
                            assert.equal(topics[1], 45);
                        }
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
    "Non-functions as topics": {
        topic: 45,

        "should work as expected": function (topic) {
            assert.equal(topic, 45);
        }
    },
    "topics returning functions": {
        topic: function () {
            return function () { return 42 };
        },

        "should work as expected": function (topic) {
            assert.isFunction(topic);
            assert.equal(topic(), 42);
        },
        "in a sub-context": {
            "should work as expected": function (topic) {
                assert.isFunction(topic);
                assert.equal(topic(), 42);
            },
        }
    },
    "A topic emitting an error": {
        topic: function () {
            var promise = new(events.EventEmitter);
            process.nextTick(function () {
                promise.emit("error", 404);
            });
            return promise;
        },
        "shouldn't raise an exception if the test expects it": function (e, res) {
            assert.equal(e, 404);
            assert.ok(! res);
        }
    },
    "A topic not emitting an error": {
        topic: function () {
            var promise = new(events.EventEmitter);
            process.nextTick(function () {
                promise.emit("success", true);
            });
            return promise;
        },
        "should pass `null` as first argument, if the test is expecting an error": function (e, res) {
            assert.strictEqual(e, null);
            assert.equal(res, true);
        },
        "should pass the result as first argument if the test isn't expecting an error": function (res) {
            assert.equal(res, true);
        }
    },
    "a topic with callback-style async": {
        "when successful": {
            topic: function () {
                function async(callback) {
                    process.nextTick(function () {
                        callback(null, "OK");
                    });
                }
                async(this.callback);
            },
            "should work like an event-emitter": function (res) {
                assert.equal(res, "OK");
            },
            "should assign `null` to the error argument": function (e, res) {
                assert.strictEqual(e, null);
                assert.equal(res, "OK");
            }
        },
        "when unsuccessful": {
            topic: function () {
                function async(callback) {
                    process.nextTick(function () {
                        callback("ERROR");
                    });
                }
                async(this.callback);
            },
            "should work like an event-emitter": function (e, res) {
                assert.equal(e, "ERROR");
                assert.equal(res, undefined);
            }
        },
        "using this.callback synchronously": {
            topic: function () {
                this.callback(null, 'hello');
            },
            "should work the same as returning a value": function (res) {
                assert.equal(res, 'hello');
            }
        }
    }
}).addVows({
    "Sibling contexts": {
        "'A', with `this.foo = true`": {
            topic: function () {
                this.foo = true;
                return this.foo;
            },
            "should have `this.foo` set to true": function (res) {
                assert.equal(res, true);
            }
        },
        "'B', with nothing set": {
            topic: function () {
                return this.foo;
            },
            "should have `this.foo` be undefined": function (res) {
                assert.isUndefined(res);
            }
        }
    }
}).addVows({
    "A 2nd test suite": {
        topic: function () {
            var p = new(events.EventEmitter);
            setTimeout(function () {
                p.emit("success");
            }, 100);
            return p;
        },
        "should run after the first": function () {}
    }
}).addVows({
    "A 3rd test suite": {
        "should run last": function () {}
    }
}).export(module);
