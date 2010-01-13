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
var sys = require('sys'),
    assert = require('assert'),
    vows = exports;


// Keeps track of the outcome of vows.
var total  = 0, honored = 0,
    broken = 0, errored = 0,
    start, end;

//
// This function gets added to process.Promise.prototype, by default.
// It's essentially a wrapper around `addCallback`, which adds all the specification
// goodness.
//
function addVow(/* description & callback */) {
    var desc, callback;

    function augment(obj) {
        obj = new(obj.constructor)(obj);

        // Recursively augment any Objects
        if (obj instanceof Object) {
            for (key in obj) {
                if (obj.hasOwnProperty(key)) obj[key] = augment(obj[key]);
            }
        }
        for (macro in vows.macros) {
            obj.should[macro] = vows.macros[macro];
        }
        return obj;
    };

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
            callback.apply(null, topics);
            vow += stylize(desc, 'green');
            honored++;
        } catch (e) {
            if (e.name.match(/AssertionError/)) {
                vow += stylize(desc, 'yellow');
                exception = '  ~ ' + stylize("expected " + 
                    stylize(sys.inspect(e.expected), 'bold') + ", got " +
                    stylize(sys.inspect(e.actual), 'bold') + "\n", 'yellow');
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

vows.macros = {
    equal: function (expected) { assert.equal(obj, expected) },
    match: function (expected) { assert.ok(obj.match(expected)) },
    include: function (item) { assert.ok(obj.match(new(RegExp)(item))) },
    beA: function (type) {
        if (typeof(obj) === 'object') { assert.ok(obj.constructor === type) }
        else {
            if (typeof(type) === 'function') type = type.name.toLowerCase();
            assert.ok(typeof(obj) === type);
        }
    }
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

    for (batch in tests) {
        if (tests.hasOwnProperty(batch)) {
            promise = tests[batch].setup(this);
            for (item in tests[batch]) {
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

