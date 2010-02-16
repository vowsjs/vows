var path = require('path');

require.paths.unshift(path.join(path.dirname(__filename), '..', 'lib'));

var events = require('events'),
    assert = require('assert');
var vows = require('vows');

var promiser = function (val) {
    return function () {
        var promise = new(events.Promise);
        process.nextTick(function () { promise.emitSuccess(val) });
        return promise;
    }
};

vows.tell("Vows:unit", function () {
    promiser("hello world")().addVow(function (val) {
       assert.equal(val, "hello world"); 
    }, "addVow()");     
});

