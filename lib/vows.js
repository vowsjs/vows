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
var path = require('path');

require.paths.unshift(path.join(path.dirname(__filename), 'vendor'), 
                      path.dirname(__filename));

var sys = require('sys'),
    assert = require('assert'),
    events = require('events'),
    eyes = require('eyes').inspector({ writer: null }),
    vows = exports;

// Keeps track of the outcome of vows.
var total  = 0, honored = 0,
    broken = 0, errored = 0,
    start, end;

//
// Assertion Macros
//
vows.macros = require('vows/macros');

assert.AssertionError.prototype.toString = function () {
    var that = this,
        source = this.stack.match(/(\w+\.js)(:\d+):\d+/);

    function parse(str) {
        return str.replace(/{actual}/g,   inspect(that.actual)).
                   replace(/{expected}/g, inspect(that.expected)).
                   replace(/{operator}/g, stylize(that.operator, 'bold'));
    }

    if (this.message) {
        return stylize(parse(this.message) + " @ " +
                       stylize(source[1], 'bold') + source[2], 'yellow');
    } else {
        return stylize([
            this.expected,
            this.operator,
            this.actual
        ].join(' '), 'yellow');
    }
}

//
// This function gets added to events.Promise.prototype, by default.
// It's essentially a wrapper around `addCallback`, which adds all the specification
// goodness.
//
function addVow(/* description & callback */) {
    var desc, callback;

    total++;

    if (arguments.length > 1) {
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
    } else if (arguments[0].constructor.name === 'Vow') {
        callback = arguments[0].callback;
        desc     = arguments[0].description;
    } else {
        throw new(Error)("wrong argument type for addVow()");
    }

    return this.addCallback(function () {
        var vow = "- ", exception, topic, msg;

        // Run the test, and try to catch `AssertionError`s and other exceptions;
        // increment counters accordingly.
        try {
            callback.apply(null, arguments);
            vow += stylize(desc, 'green');
            honored++;
        } catch (e) {
            if (e.name && e.name.match(/AssertionError/)) {
                vow += stylize(desc, 'yellow');
                exception = '  ~ ' + e.toString() + "\n";
                broken++;
            } else {
                vow += stylize(desc, 'red');
                msg = e.stack || e.message || e.toString() || e; 
                exception = '  ! ' + stylize(msg, 'red') + "\n";
                errored++;
            }
        }
        sys.puts(vow);

        if (exception) sys.puts(exception);

        tryFinish(vows.remaining);
    });
};

function tryFinish(remaining) {
    // Output results once all the vows have been checked
    if (honored + broken + errored === total && remaining === 0) {
        var result = honored + " honored, " +
                     broken  + " broken, "  +
                     errored + " errored",

        style = honored === total ?
            ('green') : (errored === 0 ? 'yellow' : 'red');

        sys.puts("\nVerified " + total + " vows in " +
                (((new(Date)) - start) / 1000) + " seconds.");

        sys.puts("\n" + stylize(result, style));
    }
}

// Options
vows.options = {
    Emitter: events.Promise
};

// Run all vows/tests
vows.tell = function (topic, tests) {
    this.options.Emitter.prototype.addVow = addVow;
    this.tests = tests;
    this.remaining = 0;

    function Context(vow, topics) {
        this.tests = vow.callback;
        this.topics = topics || [];
        this.name = vow.description || null;
    }

    function Vow(callback, description) {
        this.callback = callback;
        this.description = description;
    }

    return process.nextTick(function () {
        var setup, vow;

        if (typeof topic === 'string' && tests) sys.puts('\n' + stylize(topic, 'underline') + '\n');
        else if (topic instanceof Object) tests = topic;
        else throw "tell() takes a topic and an Object";

        start = new(Date);

        if (typeof(vows.tests) === 'function') {
            return vows.tests.call(null);
        } else {
            (function count(tests) {
                vows.remaining++;
                Object.keys(tests).forEach(function (key) {
                    if (! (tests[key] instanceof Function)) count(tests[key]);
                });
            })(vows.tests);

            (function run(ctx) {
                if (typeof(ctx.tests["setup"]) === 'function') {
                    setup = ctx.tests.setup.apply(this, ctx.topics);

                    if (! (setup instanceof vows.options.Emitter)) {
                        var emitter = new(vows.options.Emitter);

                        process.nextTick(function (val) {
                            return function () { emitter.emitSuccess(val) };
                        }(setup)); setup = emitter;
                    }
                } else { setup = null }

                Object.keys(ctx.tests).filter(function (k) {
                    return ctx.tests[k] && k !== 'setup';
                }).forEach(function (item) {
                    vow = new(Vow)(ctx.tests[item], ctx.name ? ctx.name + ' ' + item : item);

                    if (vow.callback instanceof Function) {
                        setup.addVow(vow);
                    } else if (typeof(vow.callback) === 'object' && ! Array.isArray(vow.callback)) {
                        if (setup) {
                            setup.addCallback(function (vow, ctx) {
                                return function (val) {
                                    ctx.topics.unshift(val);
                                    return run(new(Context)(vow, ctx.topics));
                                };
                            }(vow, ctx));
                        } else { 
                            run(new(Context)(vow, ctx.topics));
                        }
                    }
                });
                tryFinish(--vows.remaining);
            })(new(Context)(new(Vow)(vows.tests, null), []));
        }
    });
};


// Return the `vows` object after setting some options
vows.config = function (opts) {
    process.mixin(this.options, opts);
    return this;
};

//
// Utility functions
//

function inspect(val) {
    return '\033[1m' + eyes(val) + '\033[22m';
}

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

