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

// Context stack, used in addVow() to keep track 
var lastContext;

//
// Assertion Macros
//
vows.macros = require('vows/macros');

assert.AssertionError.prototype.toString = function () {
    var that = this,
        source = this.stack.match(/([a-zA-Z0-9_-]+\.js)(:\d+):\d+/);

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
    var desc, callback, context = '', vow = {}, args = arguments;

    total++;

    if (args.length > 1) {
        // Sometimes it might be nicer to pass the proof first,
        // and the description second, so we let the user choose
        // the order.
        if (args[0] instanceof Function) {
            vow.callback = args[0], vow.description = args[1];
        } else {
            vow.callback = args[1], vow.description = args[0]; 
        }
    } else if (args[0].constructor.name === 'Vow') {
        vow = args[0];
    } else {
        throw new(Error)("wrong argument type for addVow()");
    }

    return this.addListener("success", function () {
        var title = '- ', exception, topic, msg;

        // Run the test, and try to catch `AssertionError`s and other exceptions;
        // increment counters accordingly.
        try {
            vow.callback.apply(null, arguments);
            title += stylize(vow.description, 'green');
            honored++;
        } catch (e) {
            if (e.name && e.name.match(/AssertionError/)) {
                title += stylize(vow.description, 'yellow');
                exception = '  ~ ' + e.toString() + "\n";
                broken++;
            } else {
                title += stylize(desc, 'red');
                msg = e.stack || e.message || e.toString() || e; 
                exception = '  ! ' + stylize(msg, 'red') + "\n";
                errored++;
            }
        }
        output(title, exception);
    }).addListener("error", function (err) {
        var exception = "  * " + stylize('The promise returned an error: ' +
                                 stylize(err, 'bold'), 'red');
        errored++;
        output('- ' + stylize(vow.description, 'red'), exception + "\n");
    });

    function output(title, exception) {
        if (vow.context && lastContext !== vow.context) {
            lastContext = vow.context;
            sys.puts(vow.context);
        }
        sys.puts(title);
        if (exception) sys.puts(exception);
        tryFinish(vows.remaining);
    }
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

// Run all vows/tests.
// It can take either a function as `tests`,
// or an object literal.
vows.tell = function (topic, tests) {
    this.options.Emitter.prototype.addVow = addVow;
    this.tests = tests;
    this.remaining = 0;

    function Context(vow, ctx) {
        this.tests = vow.callback;
        this.topics = (ctx.topics || []).slice(0);
        this.name = (ctx.name ? ctx.name + ' ' : '') +
                    (vow.description || '');
    }

    function Vow(callback, context, description) {
        this.callback = callback;
        this.context = context;
        this.description = description;
    }

    // We run the tests asynchronously, for added flexibility
    return process.nextTick(function () {
        var setup, vow;

        if (typeof topic === 'string' && tests) sys.puts('\n' + stylize(topic, 'underline') + '\n');
        else if (topic instanceof Object || topic instanceof Function) vows.tests = topic;
        else throw "tell() takes a topic and an Object";

        start = new(Date);

        if (typeof(vows.tests) === 'function') {
            return vows.tests.call(null);
        } else {
            // Count the number of vows/promises expected to fire,
            // so we know when the tests are over.
            (function count(tests) {
                vows.remaining++;
                Object.keys(tests).forEach(function (key) {
                    if (! (tests[key] instanceof Function)) count(tests[key]);
                });
            })(vows.tests);

            // The test runner, it calls itself recursively, passing the
            // previous context to the inner contexts. This is so the `setup`
            // functions have access to all the previous context topics in their
            // arguments list.
            // It is defined and invoked at the same time.
            // If it encouters a `setup` function, it waits for the returned
            // promise to emit (the topic), at which point it runs the functions under it,
            // passing the topic as an argument.
            (function run(ctx) {
                if (typeof(ctx.tests["setup"]) === 'function') {
                    // Run the setup, passing the previous context topics
                    setup = ctx.tests.setup.apply(this, ctx.topics);

                    // If the setup doesn't return an event emitter (such as a promise),
                    // we create it ourselves, and emit the value on the next tick.
                    if (! (setup instanceof vows.options.Emitter)) {
                        var emitter = new(vows.options.Emitter);

                        process.nextTick(function (val) {
                            return function () { emitter.emit("success", val) };
                        }(setup)); setup = emitter;
                    }
                } else { setup = null }

                // Now run the tests, or sub-contexts
                Object.keys(ctx.tests).filter(function (k) {
                    return ctx.tests[k] && k !== 'setup';
                }).forEach(function (item) {
                    // Holds the current test or context
                    vow = new(Vow)(ctx.tests[item], ctx.name, item);

                    // If we encounter a function, add it to the callbacks
                    // of the `setup` function, so it'll get called once the
                    // setup fires.
                    // If we encounter an object literal, we recurse, sending it
                    // our current context.
                    if (vow.callback instanceof Function) {
                        setup.addVow(vow);
                    } else if (typeof(vow.callback) === 'object' && ! Array.isArray(vow.callback)) {
                        // If there's a setup stage, we have to wait for it to fire,
                        // before calling the inner context. Else, just run the inner context
                        // synchronously.
                        if (setup) {
                            setup.addListener("success", function (vow, ctx) {
                                return function (val) {
                                    // Once the setup fires, add the return value
                                    // to the beginning of the topics list, so it
                                    // becomes the first argument for the next setup.
                                    ctx.topics.unshift(val);
                                    return run(new(Context)(vow, ctx));
                                };
                            }(vow, ctx));
                        } else { 
                            run(new(Context)(vow, ctx));
                        }
                    }
                });
                // Check if we're done running the tests
                tryFinish(--vows.remaining);
            // This is our initial, empty context
            })(new(Context)(new(Vow)(vows.tests, null, null), {}));
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

