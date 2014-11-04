
var events = require('events'),
    util = require('util');

exports.EventEmitter = function EventEmitter (options) {
  events.EventEmitter.call(this, options);
};

util.inherits(exports.EventEmitter, events.EventEmitter);