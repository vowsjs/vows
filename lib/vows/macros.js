var assert = require('assert');

var messages = {
    'equal'       : "expected {expected}, got {actual} ({operator})",
    'notEqual'    : "didn't expect {actual} ({operator})",
    'throws'      : "expected {expected} to be thrown",
    'doesNotThrow': "didn't expect {actual} to be thrown",
    'ok'          : "expected expression to evaluate to {expected}, but was {actual}"
};
messages['strictEqual']    = messages['deepEqual']    = messages['equal'];
messages['notStrictEqual'] = messages['notDeepEqual'] = messages['notEqual'];

for (var key in messages) {
    assert[key] = (function (key, callback) {
        return function (actual, message) {
            callback(actual, message || messages[key]);
        };
    })(key, assert[key]);
}

assert.match = function (actual, expected, message) {
    if (! actual.match(expected)) assert.fail(actual, expected, message || "expected {actual} to match {expected}", "match", assert.match);
};
assert.matches = assert.match;

assert.include = function (actual, expected, message) {
    if ((function (obj) {
        if (isArray(obj) || isString(obj)) {
            return obj.indexOf(expected) === -1
        } else if (isObject(actual)) {
            return ! obj.hasOwnProperty(item);
        }
        return false;
    })(actual)) {
        assert.fail(actual, expected, message || "expected {actual} to include {expected}", "include", assert.include);
    }
};
assert.includes = assert.include;

// CommonJS Export
process.mixin(exports, assert);

//
// Utility functions
//
function isArray (obj) {
    return Array.isArray(obj);
}

function isString (obj) {
    return typeof(obj) === 'string' || obj instanceof String;
}

function isObject (obj) {
    return typeof(obj) === 'object' && obj instanceof Object && !isArray(obj);
}

