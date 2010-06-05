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
var sys = require('sys'),
    events = require('events'),
    eyes = require('eyes').inspector({ stream: null }),
    vows = exports;

require.paths.unshift(__dirname);

// Options
vows.options = {
    Emitter: events.EventEmitter,
    brief: false,
    reporter: require('vows/reporters/dot-matrix'),
    matcher: /.*/
};

vows.__defineGetter__('reporter', function () {
    return vows.options.reporter;
});

var stylize = require('vows/console').stylize;

vows.inspect = function inspect(val) {
    return '\033[1m' + eyes(val) + '\033[22m';
};

vows.prepare = require('vows/extras').prepare;

//
// Assertion Macros & Extensions
//
require('./assert/error');
require('./assert/macros');

//
// Checks if all the tests in the batch have been run,
// and triggers the next batch (if any), by emitting the 'end' event.
//
vows.tryEnd = function (batch) {
    var result, style, time;

    if (batch.honored + batch.broken + batch.errored === batch.total &&
        batch.remaining === 0) {

        Object.keys(batch).forEach(function (k) {
            (k in batch.suite.results) && (batch.suite.results[k] += batch[k]);
        });

        vows.reporter.report(['end']);
        batch.promise.emit('end', batch.honored, batch.broken, batch.errored);
    }
}

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
        if (exception || !vows.options.brief) {
            if (vow.context && batch.lastContext !== vow.context) {
                batch.lastContext = vow.context;
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

//
// On exit, check that all promises have been fired.
// If not, report an error message.
//
process.addListener('exit', function () {
    if (vows.suites.filter(function (s) { return s.results.time === null }).length > 0) {
        vows.reporter.report(['error', { error: "An EventEmitter has failed to fire.", type: 'promise' }]);
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

// Return the `vows` object after setting some options
vows.config = function (opts) {
    for (var k in opts) { this.options[k] = opts[k] }
    return this;
};

