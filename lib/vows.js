//
// Vows.js - asynchronous promise-based testing for node.js
//
//   usage:
//     
//       var vows = require('vows'),
//           assert = require('assert');
//
//       vows.tell('Deep Thought', function () {
//           question('what is the answer to the universe?').addVow(function (answer) {
//               assert.equals(answer, 42);
//           }, 'it should know the answer to the ultimate question of life');
//       });
//
require.paths.unshift('lib');

var sys = require('sys'),
    assert = require('assert'),
    inspect = require('eyes').inspector({writer: null}),
    vows = exports;

// Keeps track of the outcome of vows.
var total  = 0, honored = 0,
    broken = 0, errored = 0,
    start, end;

vows.macros = {
    equal: function (actual, expected) {
        if (actual == expected) { return true  }
        else { fail("expected {expected}, got {actual}", actual, expected) }
    },
    be: function (actual, expected) {
        if (Boolean(expected) === Boolean(actual)) {
            return true;
        } else {
            fail("expected {actual} to evaluate to {expected}", actual, expected);
        }
    },
    beTrue:  function (actual) { return be(actual, true) },
    beFalse: function (actual) { return be(actual, false) },

    match: function (actual, expected) {
        if (actual.match(expected)) {
            return true;
        } else {
            fail("expected {actual} to match {expected}", actual, expected);
        } 
    },
    include: function (actual, item) {
        if ((function (obj) {
            if (isString(obj) && obj.match(new(RegExp)(item))) { return true }
            else if (isArray(obj)) {
                for (var i = 0; i < obj.length; i++) {
                    if (obj[i] === item) return true;
                }
            } else if (isObject(actual)) {
                return obj.hasOwnProperty(item);
            }
            return false;
        })(actual)) { return true }
        else {
            fail("expected {actual} to include {expected}", actual, expected);
        }
    },
    have: function () { return this.include.apply(this, arguments) },
    beA: function (actual, type) {
        if (function (obj) {
            if (typeof(obj) === 'object') { return obj.constructor === type }
            else {
                if (typeof(type) === 'function') type = type.name.toLowerCase();
                return typeof(obj) === type;
            }
        }(actual)) { return true }
        else {
            fail("expected {actual} to be of type {expected}", actual, type);    
        }
    },
    throwAn: function (actual, expected) {
        try {
            actual.call(null);
        } catch (e) {
            if (e === expected) { return true }
        }
        fail("expected {actual} to throw a {expected}", actual, expected);
    },
    throwA: function () { return this.throwAn.apply(this, arguments) }
};

var BrokenVow = function (message) {
    return {
        name: 'BrokenVow',
        message: message
    };
};

function fail(message, actual, expected) {
    message = message.replace(/{actual}/g,   inspect(actual)).
                      replace(/{expected}/g, inspect(expected));
    throw new(BrokenVow)(message);
}

function isArray (obj) {
    return (obj instanceof Array);
}

function isString (obj) {
    return typeof(obj) === 'string' || obj instanceof String;
}

function isObject (obj) {
    return typeof(obj) === 'object' && obj instanceof Object && !isArray(obj);
}

//
// This function gets added to process.Promise.prototype, by default.
// It's essentially a wrapper around `addCallback`, which adds all the specification
// goodness.
//
function addVow(/* description & callback */) {
    var desc, callback;

    function augment(obj) {
        // Recursively call `augment()` on any Objects or Arrays,
        // wrap Functions to return augmented values,
        // reconstruct native types by calling their constructor.
        if (obj instanceof Object) {
            if (typeof(obj) === "object") {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key) && key !== 'should') obj[key] = augment(obj[key]);
                }
            } else if (obj instanceof Function) {
                obj = (function (fun) {
                    return function () {
                        return augment(fun.apply(null, arguments));
                    }; 
                })(obj);
            }
        } else {
            obj = new(obj.constructor)(obj);
        }

        obj.should = {};

        // Copy macros into `obj.should`,
        // closing on the current value of `obj`
        for (var macro in vows.macros) {
            obj.should[macro] = (function (macro) {
                return function (expected) {
                    return vows.macros[macro](obj, expected);
                };
            })(macro);
        }
        return obj;
    }

    if (arguments.length < 2) throw "A vow is comprised of a description and a proof";

    total++;

    // Sometimes it might be nicer to pass the proof first,
    // and the description second, so we let the user choose
    // the order.
    if (arguments[0] instanceof Function) {
        callback = arguments[0];
        desc     = arguments[1];
    } else {
        desc     = arguments[0];
        callback = arguments[1];
    }

    return this.addCallback(function () {
        var vow = "- ", exception, topics = [], topic;

        for (var i = 0; i < arguments.length; i++) {
            topics[i] = augment(arguments[i]);
        }

        // Run the test, and try to catch `AssertionError`s and other exceptions;
        // increment counters accordingly.
        try {
            callback.apply(null, topics.concat(augment));
            vow += stylize(desc, 'green');
            honored++;
        } catch (e) {
            if (e.name.match(/AssertionError/)) {
                vow += stylize(desc, 'yellow');
                exception = '  ~ ' + stylize("expected " +
                    stylize(sys.inspect(e.expected), 'bold') + ", got " +
                    stylize(sys.inspect(e.actual), 'bold') + "\n", 'yellow');
                broken++;
            } else if (e.name.match(/BrokenVow/)) {
                vow += stylize(desc, 'yellow');
                exception = '  ~ ' + stylize(e.message + "\n", 'yellow');
                broken++;
            } else {
                vow += stylize(desc, 'red');
                exception = '  ! ' + stylize(e.stack, 'red') + "\n";
                errored++;
            }
        }
        sys.puts(vow);

        if (exception) process.stdio.writeError(exception);

        // Output results once all the vows have been checked
        if (honored + broken + errored === total) {
            var result = honored + " honored, " +
                         broken  + " broken, "  +
                         errored + " errored",

            style = honored === total ?
                ('green') : (errored === 0 ? 'yellow' : 'red');

            sys.puts("\nVerified " + total + " vows in " +
                    (((new(Date)) - start) / 1000) + " seconds.");

            sys.puts("\n" + stylize(result, style));
        }
    });
};

// Options
vows.options = {
    emitter: process.Promise
};

// Run all vows/tests
vows.tell = function (topic, tests) {
    var promise;
    this.options.emitter.prototype.addVow = addVow;

    if (typeof topic === 'string' && tests) sys.puts('\n' + stylize(topic, 'underline') + '\n');
    else if (topic instanceof Object) tests = topic;
    else throw "tell() takes a topic and an Object";

    start = new(Date);

    for (var batch in tests) {
        if (tests.hasOwnProperty(batch)) {
            promise = tests[batch].setup(this);
            for (var item in tests[batch]) {
                if (tests[batch].hasOwnProperty(item) && item !== 'setup') {
                    promise.addVow(tests[batch][item], item);
                }
            }
        }
    }
    return;
};

// Return the `vows` object after setting some options
vows.config = function (opts) {
    process.mixin(this.options, opts);
    return this;
};

// Stylize a string
function stylize(str, style) {
    var styles = {
        'bold'      : [1,  22],
        'underline' : [4,  24],
        'yellow'    : [33, 39],
        'green'     : [32, 39],
        'red'       : [31, 39]
    };
    return '\033[' + styles[style][0] + 'm' + str +
           '\033[' + styles[style][1] + 'm';
}

