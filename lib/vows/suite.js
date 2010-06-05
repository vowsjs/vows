var events = require('events'),
    path = require('path');

require.paths.unshift(path.join(__dirname, '..'));

var vows = require('vows');
var Context = require('vows/context').Context;

this.Suite = function (subject) {
    this.subject = subject;
    this.matcher = /.*/;
    this.reporter = require('vows/reporters/dot-matrix');
    this.batches = [];
    this.reset();
};

this.Suite.prototype = new(function () {
    this.reset = function () {
        this.results = {
            honored: 0,
            broken:  0,
            errored: 0,
            total:   0,
            time:  null
        };
        this.batches.forEach(function (b) {
            b.lastContext = null;
            b.remaining = b._remaining;
            b.honored = b.broken = b.errored = b.total = 0;
        });
    };

    this.addVows = function (tests) {
        this.batches.push({
            tests: tests,
            suite:  this,
            remaining: 0,
           _remaining: 0,
            honored:   0,
            broken:    0,
            errored:   0,
            total:     0
        });
        return this;
    };

    this.parseVows = function (batch, matcher) {
        var tests = batch.tests;

        if (typeof(tests) === 'object') {
            if ('topic' in tests) {
                throw new(Error)("missing top-level context.");
            }
            // Count the number of vows/promises expected to fire,
            // so we know when the tests are over.
            // We match the keys against `matcher`, to decide
            // whether or not they should be included in the test.
            (function count(tests, _match) {
                var match = false;

                Object.keys(tests).filter(function (k) {
                    return k !== 'topic';
                }).forEach(function (key) {
                    match = _match || matcher.test(key);

                    if (typeof(tests[key]) === 'object') {
                        match = count(tests[key], match);
                    }
                });

                if (match) { batch.remaining ++ }
                else       { tests._skip = true }

                return match;
            })(tests, false);
        }
        batch._remaining = batch.remaining;
    };

    this.runVows = function (batch) {
        var topic,
            tests   = batch.tests,
            promise = batch.promise = new(events.EventEmitter);

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
                if (! (topic instanceof events.EventEmitter)) {
                    ctx.emitter = new(events.EventEmitter);

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
                        batch: batch
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
                batch.remaining --;
                exports.tryEnd(batch);
            // This is our initial, empty context
            })(new(Context)({ callback: tests, context: null, description: null }, {}));
        }
        return promise;
    };

    this.report = function () {
        return this.reporter.report.apply(this.reporter, arguments);
    };

    this.run = function (options, callback) {
        var that = this, start;

        this.matcher  = options.matcher  || this.matcher;
        this.reporter = options.reporter || this.reporter;

        this.batches.forEach(function (batch) {
            that.parseVows(batch, that.matcher);
        });

        this.reset();

        start = new(Date);

        this.report(['subject', this.subject]);

        (function run(batches) {
            var batch;

            if (batch = batches.shift()) {
                that.runVows(batch).addListener('end', function () {
                    run(batches);
                });
            } else {
                that.results.time = (new(Date) - start) / 1000;

                that.report(['finish', that.results]);

                if (callback) { callback(that.results) }

                // Don't exit until stdout is empty
                process.stdout.addListener('drain', function () {
                    process.exit(that.results.broken || that.results.errored ? 1 : 0);
                });
            }
        })(this.batches.slice(0));
    };

    this.runParallel = function () {};

    this.export = function (module) {
        if (require.main === module) {
            return this.run();
        } else {
            return module.exports.vows = this;
        }
    };
});

//
// Checks if all the tests in the batch have been run,
// and triggers the next batch (if any), by emitting the 'end' event.
//
this.tryEnd = function (batch) {
    var result, style, time;

    if (batch.honored + batch.broken + batch.errored === batch.total &&
        batch.remaining === 0) {

        Object.keys(batch).forEach(function (k) {
            (k in batch.suite.results) && (batch.suite.results[k] += batch[k]);
        });

        batch.suite.report(['end']);
        batch.promise.emit('end', batch.honored, batch.broken, batch.errored);
    }
};
