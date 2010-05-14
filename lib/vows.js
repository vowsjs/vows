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

    start,  // Start time
    end,    // End time
    suites; // Number of test suites added by `addVows()`

// Context stack, used in addVow() to keep track
var lastContext;

// Output buffer
var buffer;

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
        throw new(Error)("wrong argument type for addVow()");
    }

    return this.addListener("success", function () {
        var args = Array.prototype.slice.call(arguments);
        // If the callback is expecting two or more arguments,
        // pass the error as the first (null) and the result after.
        if (vow.callback.length >= 2) {
            args.unshift(null);
        }
        runTest(args);

    }).addListener("error", function (err) {
        var exception;

        if (vow.callback.length >= 2) {
            runTest([err]);
        } else {
            exception = "  * " + stylize('The promise returned an error: ' +
                                 stylize(err, 'bold'), 'red');
            errored++;
            output('- ' + stylize(vow.description, 'red'), exception + "\n");
        }
    });

    function runTest(args) {
        var title = ' - ', exception, topic, msg;

        // Run the test, and try to catch `AssertionError`s and other exceptions;
        // increment counters accordingly.
        try {
            vow.callback.apply(vow.binding || null, args);
            title += stylize(vow.description, 'green');
            honored++;
        } catch (e) {
            if (e.name && e.name.match(/AssertionError/)) {
                title += stylize(vow.description, 'yellow');
                exception = '   ~ ' + e.toString();
                broken++;
            } else {
                title += stylize(vow.description, 'red');
                msg = e.stack || e.message || e.toString() || e;
                exception = '   ! ' + stylize(msg, 'red');
                errored++;
            }
        }
        output(title, exception);
    }

    function output(title, exception) {
        if (exception || !vows.options.brief) {
            if (vow.context && lastContext !== vow.context) {
                lastContext = vow.context;
                puts(vow.context);
            }
            puts(title);
            if (exception) puts(exception);
        }
        tryFinish(vows.remaining, vow.promise);
    }
};

function Context(vow, ctx, env) {
    this.tests = vow.callback;
    this.topics = (ctx.topics || []).slice(0);
    this.env = env || {};
    this.env.context = this;
    this.name = (ctx.name ? ctx.name + ' ' : '') +
                (vow.description || '');
}

function addVows(tests) {
    var promise = new(events.EventEmitter);
    var remaining = 0;

    suites++;

    vows.promises.push(promise);

    if (typeof(tests) === 'object') {
        // Count the number of vows/promises expected to fire,
        // so we know when the tests are over.
        // We match the keys against `matcher`, to decide
        // whether or not they should be included in the test.
        (function count(tests) {
            var match = false;
            remaining++;
            Object.keys(tests).forEach(function (key) {
                if (typeof(tests[key]) === "object" && !Array.isArray(tests[key])) {
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
        var topic, vow, env;

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
                var ctxAdded = false;

                topic = ('topic' in ctx.tests) ? ctx.tests.topic
                                               : lastTopic;
                // Topic isn't a function, wrap it into one.
                if (typeof(topic) !== 'function') {
                    topic = (function (topic) {
                        return function () { return topic };
                    })(topic);
                }

                // Run the topic, passing the previous context topics
                topic = lastTopic = topic.apply(ctx.env, ctx.topics);

                // If the topic doesn't return an event emitter (such as a promise),
                // we create it ourselves, and emit the value on the next tick.
                if (! (topic instanceof vows.options.Emitter)) {
                    var emitter = new(vows.options.Emitter);

                    process.nextTick(function (val) {
                        return function () { emitter.emit("success", val) };
                    }(topic)); topic = emitter;
                }

                topic.addListener('success', function (val) {
                    // Once the topic fires, add the return value
                    // to the beginning of the topics list, so it
                    // becomes the first argument for the next topic.
                    ctx.topics.unshift(val);
                });

                // Now run the tests, or sub-contexts
                Object.keys(ctx.tests).filter(function (k) {
                    return ctx.tests[k] && k !== 'topic';
                }).forEach(function (item) {
                    // Holds the current test or context
                    vow = Object.create({
                        callback: ctx.tests[item],
                        context: ctx.name,
                        description: item,
                        binding: ctx.env,
                        promise: promise
                    });
                    env = Object.create(ctx.env);

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
                            topic.addListener("success", function (vow, ctx) {
                                return function (val) {
                                    return run(new(Context)(vow, ctx, env), lastTopic);
                                };
                            }(vow, ctx));
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

function puts() {
    var args = Array.prototype.slice.call(arguments);
    if (vows.promises[suites - 1].listeners('finish').length > 0) {
        buffer.push(args.join('\n'));
    } else {
      sys.puts.apply(null, args);
    }
}

//
// Checks if all the required tests have been run,
// and either triggers the next test suite, if any,
// or exits the process.
//
function tryFinish(remaining, promise) {
    var result, style;

    // Output results once all the vows have been checked
    if (honored + broken + errored === total && remaining === 0) {
        result = honored + " honored, " +
                 broken  + " broken, "  +
                 errored + " errored",
        style  = honored === total ? ('green')
                                   : (errored === 0 ? 'yellow' : 'red');

        // If this isn't the last test suite in the chain,
        // emit 'end', to trigger the next test suite.
        if (promise && promise.listeners('end').length > 0) {
            sys.print('\n');
            promise.emit('end', honored, broken, errored);
        } else {
            if (!vows.options.brief) {
                puts("\nVerified " + total + " vows in " +
                     (((new(Date)) - start) / 1000) + " seconds.");
                puts("\n" + stylize(result, style));
            }

            // The 'finish' event is triggered once all the tests have been run.
            // It's used by bin/vows
            vows.promises[suites - 1].emit("finish", honored, broken, errored);

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
// If not, print an error message.
//
process.addListener('exit', function () {
    if (honored + broken + errored < total) {
        sys.puts('\n* ' + stylize("An EventEmitter has failed to fire.", 'red'));
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

// Options
vows.options = {
    Emitter: events.EventEmitter,
    brief: false,
    matcher: /.*/
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

    process.nextTick(function () {
        if (!vows.options.brief) {
            puts('\n' + stylize(subject, 'underline') + '\n');
        }
    });
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

vows.tell = vows.describe;

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

// Stylize a string
function stylize(str, style) {
    var styles = {
        'bold'      : [1,  22],
        'underline' : [4,  24],
        'yellow'    : [33, 39],
        'green'     : [32, 39],
        'red'       : [31, 39],
        'grey'      : [90, 39]
    };
    return '\033[' + styles[style][0] + 'm' + str +
           '\033[' + styles[style][1] + 'm';
}

