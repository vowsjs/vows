var path = require('path');

require.paths.unshift(path.join(__dirname, '..', 'lib'));

var events = require('events'),
    assert = require('assert');
var vows = require('vows');

var promiser = function (val) {
    return function () {
        var promise = new(events.EventEmitter);
        process.nextTick(function () { promise.emit('success', val) });
        return promise;
    }
};

vows.describe("Vows/unit").addVows(function () {
    promiser("hello world")().addVow(function (val) {
       assert.equal(val, "hello world"); 
    }, "addVow()");     
});

