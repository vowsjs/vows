var assert = require('assert');

var messages = {
    'equal'       : "expected {expected},\n     got      {actual} ({operator})",
    'notEqual'    : "didn't expect {actual} ({operator})",
    'throws'      : "expected {expected} to be thrown",
    'doesNotThrow': "didn't expect {actual} to be thrown",
};
messages['strictEqual']    = messages['deepEqual']    = messages['equal'];
messages['notStrictEqual'] = messages['notDeepEqual'] = messages['notEqual'];

for (var key in messages) {
    assert[key] = (function (key, callback) {
        return function (actual, expected, message) {
            callback(actual, expected, message || messages[key]);
        };
    })(key, assert[key]);
}

assert.ok = (function (callback) {
    return function (actual, message) {
        callback(actual, message ||  "expected expression to evaluate to {expected}, but was {actual}");
    };
})(assert.ok);

assert.match = function (actual, expected, message) {
    if (! expected.test(actual)) {
        assert.fail(actual, expected, message || "expected {actual} to match {expected}", "match", assert.match);
    }
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

assert.isEmpty = function (actual, message) {
    if ((isObject(actual) && Object.keys(actual).length > 0) || actual.length > 0) {
        assert.fail(actual, 0, message || "expected {actual} to be empty", "length", assert.isEmpty);
    }
};

assert.length = function (actual, expected, message) {
    if (actual.length !== expected) {
        assert.fail(actual, expected, message || "expected {actual} to have {expected} elements", "length", assert.length);
    }
};

assert.isArray = function (actual, message) {
    assertTypeOf(actual, 'array', message || "expected {actual} to be an Array", assert.isArray);
};
assert.isObject = function (actual, message) {
    assertTypeOf(actual, 'object', message || "expected {actual} to be an Object", assert.isObject);
};
assert.isNumber = function (actual, message) {
    assertTypeOf(actual, 'number', message || "expected {actual} to be a Number", assert.isNumber);
};
assert.isString = function (actual, message) {
    assertTypeOf(actual, 'string', message || "expected {actual} to be a String", assert.isString);
};
assert.isFunction = function (actual, message) {
    assertTypeOf(actual, 'function', message || "expected {actual} to be a Function", assert.isFunction);
};
assert.typeOf = function (actual, expected, message) {
    assertTypeOf(actual, expected, message, assert.typeOf);
};

//
// Utility functions
//
function assertTypeOf(actual, expected, message, caller) {
    if (typeOf(actual) !== expected) {
        assert.fail(actual, expected, message || "expected {actual} to be of type {expected}", "typeOf", caller);
    }
};

function isArray (obj) {
    return Array.isArray(obj);
}

function isString (obj) {
    return typeof(obj) === 'string' || obj instanceof String;
}

function isObject (obj) {
    return typeof(obj) === 'object' && obj instanceof Object && !isArray(obj);
}

// A better `typeof`
function typeOf(value) {
    var s = typeof(value),
        types = [Object, Array, String, RegExp, Number, Function, Boolean, Date];

    if (s === 'object' || s === 'function') {
        if (value) {
            types.forEach(function (t) {
                if (value instanceof t) { s = t.name.toLowerCase() }
            });
        } else { s = 'null' }
    }
    return s;
}
