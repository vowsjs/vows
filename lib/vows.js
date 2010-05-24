//
// Vows.js - asynchronous event-based BDD for node.js
//
//   usage:
//
//       var vows = require('vows');
//
//       vows.describe('Deep Thought').addVows(function () {
//           question('what is the answer to the universe?').addVow(function (answer) {
//               assert.equals(answer, 42);
//           }, 'it should know the answer to the ultimate question of life');
//       });
//
var path = require('path');

require.paths.unshift(__dirname);

var sys = require('sys'),
    assert = require('assert'),
    events = require('events'),
    eyes = require('eyes').inspector({ stream: null }),
    vows = exports;

// Options
vows.options = {
    Emitter: events.EventEmitter,
    brief: false,
    json: false,
    matcher: /.*/
};

vows.__defineGetter__('reporter', function () {
    if (vows.options.json) {
        return require('vows/reporters/json');
    } else {
        return require('vows/reporters/console');
    }
});

var stylize = require('vows/reporters/console').stylize;

// Keeps track of the outcome of vows.
var total  = 0, honored = 0,
    broken = 0, errored = 0,

    start,  // Start time
    end,    // End time
    suites; // Number of test suites added by `addVows()`

// Context stack, used in addVow() to keep track
var lastContext;

// Output buffer
var buffer;

var argv = [];
//
// Parse command-line parameters
//
for (var i = 0, arg; i < process.argv.length; i++) {
    arg = process.argv[i];

    if (arg === __filename) { continue }

    if (arg[0] !== '-') {
        argv.push(arg);
    } else {
        arg = arg.match(/^--?(.*)/)[1];

        if (arg[0] === 'R') {
            vows.options.matcher = new(RegExp)(arg.slice(1));
        } else if (arg in vows.options) {
            vows.options[arg] = true;
        }
    }
}

// Get rid of process runner
// ('node' in most cases)
argv = argv.slice(1);

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
        return stylize(parse(this.message), 'yellow') +
               stylize(' // ' + source[1] + source[2], 'grey');
    } else {
        return stylize([
            this.expected,
            this.operator,
            this.actual
        ].join(' '), 'yellow');
    }
}

//
// This function gets added to events.EventEmitter.prototype, by default.
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
        if (typeof(args[0]) === "function") {
            vow.callback = args[0], vow.description = args[1];
        } else {
            vow.callback = args[1], vow.description = args[0];
        }
    } else if (args[0].callback && args[0].context) {
        vow = args[0];
    } else {
        throw new(Error)("wrong argument type for addVow().");
    }

    return this.addListener("success", function () {
        var args = Array.prototype.slice.call(arguments);
        // If the callback is expecting two or more arguments,
        // pass the error as the first (null) and the result after.
        if (vow.callback.length >= 2) {
            args.unshift(null);
        }
        runTest(args);
        tryFinish(vows.remaining, vow.promise);

    }).addListener("error", function (err) {
        var exception;

        if (vow.callback.length >= 2) {
            runTest([err]);
        } else {
            exception = { type: 'promise', error: err };
            errored++;
            output('errored', exception);
        }
        tryFinish(vows.remaining, vow.promise);
    });

    function runTest(args) {
        var exception, topic, status;

        // Run the test, and try to catch `AssertionError`s and other exceptions;
        // increment counters accordingly.
        try {
            vow.callback.apply(vow.binding || null, args);
            output('honored', exception);
            honored++;
        } catch (e) {
            if (e.name && e.name.match(/AssertionError/)) {
                exception = e.toString();
                output('broken', exception);
                broken++;
            } else {
                exception = e.stack || e.message || e.toString() || e;
                errored++;
                output('errored', exception);
            }
        }
    }

    function output(status, exception) {
        if (exception || !vows.options.brief) {
            if (vow.context && lastContext !== vow.context) {
                lastContext = vow.context;
                vows.reporter.report(['context', vow.context]);
            }
            vows.reporter.report(['vow', {
                title: vow.description,
                status: status,
                exception: exception || null
            }]);
        }
    }
};

function Context(vow, ctx, env) {
    var that = this;

    this.tests = vow.callback;
    this.topics = (ctx.topics || []).slice(0);
    this.emitter = null;
    this.env = env || {};
    this.env.context = this;
    this.env.__defineGetter__('callback', function () {
        that._callback = true;
        return function (e, res) {
            var args = Array.prototype.slice.call(arguments, 1);
            if (e) { that.emitter.emit('error', e) }
            else   { that.emitter.emit.apply(that.emitter, ['success'].concat(args)) }
        };
    });
    this.name = (ctx.name ? ctx.name + ' ' : '') +
                (vow.description || '');
}

function addVows(tests) {
    var promise = new(events.EventEmitter);
    var remaining = 0;

    suites++;

    vows.promises.push(promise);

    if (typeof(tests) === 'object') {
        if ('topic' in tests) {
            throw new(Error)("missing top-level context.");
        }
        // Count the number of vows/promises expected to fire,
        // so we know when the tests are over.
        // We match the keys against `matcher`, to decide
        // whether or not they should be included in the test.
        (function count(tests) {
            var match = false;
            remaining++;
            Object.keys(tests).filter(function (k) {
                return k !== 'topic';
            }).forEach(function (key) {
                if (typeof(tests[key]) === "object") {
                    if (! (match = count(tests[key]) ||
                           match || vows.options.matcher.test(key))) {
                        delete tests[key];
                        remaining--;
                    }
                }
            });
            return match;
        })(tests);
    }

    this.addListener("end", function (honored, broken, errored) {
        var topic;

        vows.remaining += remaining;

        if (typeof(tests) === 'function') {
            return tests.call(null);
        } else {
            // The test runner, it calls itself recursively, passing the
            // previous context to the inner contexts. This is so the `topic`
            // functions have access to all the previous context topics in their
            // arguments list.
            // It is defined and invoked at the same time.
            // If it encounters a `topic` function, it waits for the returned
            // promise to emit (the topic), at which point it runs the functions under it,
            // passing the topic as an argument.
            (function run(ctx, lastTopic) {
                var old = false;
                topic = ctx.tests.topic;

                if (typeof(topic) === 'function') {
                    // Run the topic, passing the previous context topics
                    topic = topic.apply(ctx.env, ctx.topics);
                }

                // If this context has a topic, store it in `lastTopic`,
                // if not, use the last topic, passed down by a parent
                // context.
                if (topic) {
                    lastTopic = topic;
                } else {
                    old   = true;
                    topic = lastTopic;
                }

                // If the topic doesn't return an event emitter (such as a promise),
                // we create it ourselves, and emit the value on the next tick.
                if (! (topic instanceof vows.options.Emitter)) {
                    ctx.emitter = new(vows.options.Emitter);

                    if (! ctx._callback) {
                        process.nextTick(function (val) {
                            return function () { ctx.emitter.emit("success", val) };
                        }(topic));
                    } else if (typeof(topic) !== "undefined" && !old) {
                        throw new(Error)("topic must not return anything when using `this.callback`.");
                    }
                    topic = ctx.emitter;
                }

                topic.addListener('success', function (val) {
                    // Once the topic fires, add the return value
                    // to the beginning of the topics list, so it
                    // becomes the first argument for the next topic.
                    // If we're using the parent topic, no need to
                    // prepend it to the topics list, or we'll get
                    // duplicates.
                    if (! old) ctx.topics.unshift(val);
                });

                // Now run the tests, or sub-contexts
                Object.keys(ctx.tests).filter(function (k) {
                    return ctx.tests[k] && k !== 'topic';
                }).forEach(function (item) {
                    // Create a new evaluation context,
                    // inheriting from the parent one.
                    var env = Object.create(ctx.env);

                    // Holds the current test or context
                    var vow = Object.create({
                        callback: ctx.tests[item],
                        context: ctx.name,
                        description: item,
                        binding: ctx.env,
                        promise: promise
                    });

                    // If we encounter a function, add it to the callbacks
                    // of the `topic` function, so it'll get called once the
                    // topic fires.
                    // If we encounter an object literal, we recurse, sending it
                    // our current context.
                    if (typeof(vow.callback) === 'function') {
                        topic.addVow(vow);
                    } else if (typeof(vow.callback) === 'object' && ! Array.isArray(vow.callback)) {
                        // If there's a setup stage, we have to wait for it to fire,
                        // before calling the inner context. Else, just run the inner context
                        // synchronously.
                        if (topic) {
                            topic.addListener("success", function (ctx) {
                                return function (val) {
                                    return run(new(Context)(vow, ctx, env), lastTopic);
                                };
                            }(ctx));
                        } else {
                            run(new(Context)(vow, ctx, env), lastTopic);
                        }
                    }
                });
                // Check if we're done running the tests
                tryFinish(--vows.remaining, promise);
            // This is our initial, empty context
            })(new(Context)({ callback: tests, context: null, description: null }, {}));
        }
    });
    return promise;
}

//
// Checks if all the required tests have been run,
// and either triggers the next test suite, if any,
// or exits the process.
//
function tryFinish(remaining, promise) {
    var result, style, time;

    // Output results once all the vows have been checked
    if (honored + broken + errored === total && remaining === 0) {
        // If this isn't the last test suite in the chain,
        // emit 'end', to trigger the next test suite.
        if (promise && promise.listeners('end').length > 0) {
            vows.reporter.report(['end']);
            promise.emit('end', honored, broken, errored);
        } else {
            time = (new(Date) - start) / 1000;
            // The 'finish' event is triggered once all the tests have been run.
            // It's used by bin/vows
            vows.promises[suites - 1].emit("finish", honored, broken, errored);

            vows.reporter.report([ 'finish', {
                honored: honored,
                broken: broken,
                errored: errored,
                total: total,
                time: time
            }]);

            if ((broken || errored) && buffer.length) { sys.puts(buffer.join('\n') + '\n') }
            // Don't exit until stdout is empty
            process.stdout.addListener('drain', function () {
                process.exit(broken || errored ? 1 : 0);
            });
        }
    }
}

//
// On exit, check that all promises have been fired.
// If not, report an error message.
//
process.addListener('exit', function () {
    if (honored + broken + errored < total) {
        vows.reporter.report(['error', { error: "An EventEmitter has failed to fire.", type: 'promise' }]);
    }
});

//
// Wrap a Node.js style async function into an EventEmmitter
//
vows.prepare = function (obj, targets) {
    targets.forEach(function (target) {
        if (target in obj) {
            obj[target] = (function (fun) {
                return function () {
                    var args = Array.prototype.slice.call(arguments);
                    var ee = new(events.EventEmitter);

                    args.push(function (err /* [, data] */) {
                        var args = Array.prototype.slice.call(arguments, 1);

                        if (err) { ee.emit('error', err) }
                        else     { ee.emit.apply(ee, ['success'].concat(args)) }
                    });
                    fun.apply(obj, args);

                    return ee;
                };
            })(obj[target]);
        }
    });
    return obj;
};

// Run all vows/tests.
// It can take either a function as `tests`,
// or an object literal.
vows.describe = function (subject) {
    this.options.Emitter.prototype.addVow = addVow;
    this.options.Emitter.prototype.addVows = addVows;
    this.remaining = 0;
    this.promises = [];

    // Reset values
    total  = 0, honored = 0,
    broken = 0, errored = 0;
    buffer = [], suites = 0;

    if (!vows.options.brief) {
        this.reporter.report(['subject', subject]);
    }

    return new(events.EventEmitter)().addListener('newListener', function (e, listener) {
        var that = this;
        if (e === 'end') {
            this.removeListener(e, listener);
            process.nextTick(function () {
                start = new(Date);
                listener.call(that);
            });
        }
    });
};

// Return the `vows` object after setting some options
vows.config = function (opts) {
    for (var k in opts) { this.options[k] = opts[k] }
    return this;
};

//
// Utility functions
//

function inspect(val) {
    return '\033[1m' + eyes(val) + '\033[22m';
}

