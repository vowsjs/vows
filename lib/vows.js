//
// Vows.js - asynchronous event-based BDD for node.js
//
//   usage:
//
//       var vows = require('vows');
//
//       vows.describe('Deep Thought').addVows({
//           "An instance of DeepThought": {
//               topic: new DeepThought,
//
//               "should know the answer to the ultimate question of life": function (deepThought) {
//                   assert.equal (deepThought.question('what is the answer to the universe?'), 42);
//               }
//           }
//       }).run();
//
var sys = require('sys'),
    events = require('events'),
    vows = exports;

require.paths.unshift(__dirname);

// Options
vows.options = {
    Emitter: events.EventEmitter,
    reporter: require('vows/reporters/dot-matrix'),
    matcher: /.*/
};

vows.__defineGetter__('reporter', function () {
    return vows.options.reporter;
});

var stylize = require('vows/console').stylize;
var console = require('vows/console');

vows.inspect = require('vows/console').inspect;
vows.prepare = require('vows/extras').prepare;
vows.tryEnd = require('vows/suite').tryEnd;

//
// Assertion Macros & Extensions
//
require('./assert/error');
require('./assert/macros');

//
// Suite constructor
//
var Suite = require('vows/suite').Suite;

//
// This function gets added to events.EventEmitter.prototype, by default.
// It's essentially a wrapper around `addListener`, which adds all the specification
// goodness.
//
function addVow(vow) {
    var batch = vow.batch;

    batch.total ++;

    return this.addListener("success", function () {
        var args = Array.prototype.slice.call(arguments);
        // If the callback is expecting two or more arguments,
        // pass the error as the first (null) and the result after.
        if (vow.callback.length >= 2) {
            args.unshift(null);
        }
        runTest(args);
        vows.tryEnd(batch);

    }).addListener("error", function (err) {
        var exception;

        if (vow.callback.length >= 2) {
            runTest([err]);
        } else {
            exception = { type: 'promise', error: err };
            batch.errored ++;
            output('errored', exception);
        }
        vows.tryEnd(batch);
    });

    function runTest(args) {
        var exception, topic, status;

        if (vow.callback instanceof String) {
            batch.pending ++;
            return output('pending');
        }

        // Run the test, and try to catch `AssertionError`s and other exceptions;
        // increment counters accordingly.
        try {
            vow.callback.apply(vow.binding || null, args);
            output('honored', exception);
            batch.honored ++;
        } catch (e) {
            if (e.name && e.name.match(/AssertionError/)) {
                exception = e.toString();
                output('broken', exception);
                batch.broken ++;
            } else {
                exception = e.stack || e.message || e.toString() || e;
                batch.errored ++;
                output('errored', exception);
            }
        }
    }

    function output(status, exception) {
        if (vow.context && batch.lastContext !== vow.context) {
            batch.lastContext = vow.context;
            batch.suite.report(['context', vow.context]);
        }
        batch.suite.report(['vow', {
            title: vow.description,
            context: vow.context,
            status: status,
            exception: exception || null
        }]);
    }
};

//
// On exit, check that all promises have been fired.
// If not, report an error message.
//
process.addListener('exit', function () {
    var results = { honored: 0, broken: 0, errored: 0, pending: 0, total: 0 }, failure;

    vows.suites.forEach(function (s) {
        if ((s.results.total > 0) && (s.results.time === null)) {
            vows.reporter.report(['error', { error: "Asynchronous Error", suite: s }]);
            process.exit(1);
        }
        s.batches.forEach(function (b) {
            if (b.status !== 'end') {
                failure = true;
                results.errored ++;
                results.total ++;
                vows.reporter.report(['error', { error: "A callback hasn't fired", batch: b, suite: s }]);
            }
            Object.keys(results).forEach(function (k) { results[k] += b[k] });
        });
    });
    if (failure) {
        sys.puts(console.result(results));
    }
});

vows.suites = [];

//
// Create a new test suite
//
vows.describe = function (subject) {
    var suite = new(Suite)(subject);

    this.options.Emitter.prototype.addVow = addVow;
    this.suites.push(suite);

    return suite;
};
