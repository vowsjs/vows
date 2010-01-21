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
    var that = this;
    function parse(str) {
        return str.replace(/{actual}/g,   inspect(that.actual)).
                   replace(/{expected}/g, inspect(that.expected)).
                   replace(/{operator}/g, stylize(that.operator, 'bold'));
    }

    if (this.message) {
        return stylize(parse(this.message), 'yellow');
    } else {
        return stylize(parse(assert.messages[this.operator]), 'yellow');
    }
}

//
// This function gets added to process.Promise.prototype, by default.
// It's essentially a wrapper around `addCallback`, which adds all the specification
// goodness.
//
function addVow(/* description & callback */) {
    var desc, callback;

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
    var promise, value;
    this.options.emitter.prototype.addVow = addVow;

    if (typeof topic === 'string' && tests) sys.puts('\n' + stylize(topic, 'underline') + '\n');
    else if (topic instanceof Object) tests = topic;
    else throw "tell() takes a topic and an Object";

    start = new(Date);

    return (function run(tests, context) {
        if (typeof(tests["setup"]) === 'function') {
            promise = tests.setup(promise);
        }
        for (var item in tests) {
            value = tests[item];

            // Skip setup & prototype attributes
            if (item === 'setup' || ! tests.hasOwnProperty(item)) continue;
            
            if (typeof(value) === 'function' && value instanceof Function) {
                promise.addVow(value, context + ' ' + item);
            }
            else if (typeof(value) === 'object' && value instanceof Object) {
                run(value, item);
            }
        }
    })(tests);
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

