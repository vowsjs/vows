
var macros = {
    equal: function (actual, expected) {
        if (actual == expected) { return true  }
        else { fail("expected {expected}, got {actual}", actual, expected) }
    },
    be: function (actual, expected) {
        if (Boolean(expected) === Boolean(actual)) {
            return true;
        } else {
            fail("expected {actual} to evaluate to {expected}", actual, expected);
        }
    },
    beTrue:  function (actual) { return be(actual, true) },
    beFalse: function (actual) { return be(actual, false) },

    match: function (actual, expected) {
        if (actual.match(expected)) {
            return true;
        } else {
            fail("expected {actual} to match {expected}", actual, expected);
        } 
    },
    include: function (actual, item) {
        if ((function (obj) {
            if (isString(obj) && obj.match(new(RegExp)(item))) { return true }
            else if (isArray(obj)) {
                for (var i = 0; i < obj.length; i++) {
                    if (obj[i] === item) return true;
                }
            } else if (isObject(actual)) {
                return obj.hasOwnProperty(item);
            }
            return false;
        })(actual)) { return true }
        else {
            fail("expected {actual} to include {expected}", actual, expected);
        }
    },
    have: function () { return this.include.apply(this, arguments) },
    beA: function (actual, type) {
        if (function (obj) {
            if (typeof(obj) === 'object') { return obj.constructor === type }
            else {
                if (typeof(type) === 'function') type = type.name.toLowerCase();
                return typeof(obj) === type;
            }
        }(actual)) { return true }
        else {
            fail("expected {actual} to be of type {expected}", actual, type);    
        }
    },
    throwAn: function (actual, expected) {
        try {
            actual.call(null);
        } catch (e) {
            if (e === expected) { return true }
        }
        fail("expected {actual} to throw a {expected}", actual, expected);
    },
    throwA: function () { return this.throwAn.apply(this, arguments) }
};

//
// CommonJS Export
//
process.mixin(exports, macros);

//
// Utility functions
//
function isArray (obj) {
    return (obj instanceof Array);
}

function isString (obj) {
    return typeof(obj) === 'string' || obj instanceof String;
}

function isObject (obj) {
    return typeof(obj) === 'object' && obj instanceof Object && !isArray(obj);
}

