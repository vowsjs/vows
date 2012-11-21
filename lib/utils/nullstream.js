/*
 * nullstream.js: A simple stream to have a writestream accept all data written to  it
 * Used on windows to replace writing to /dev/null
 *
 * (C) 2012 MSOpenTech Inc.
 *
 */
var Stream = require('stream').Stream;

var NullStream = function () {
  Stream.call(this);
  this.writable = true;
};

exports.NullStream = NullStream;

// Inherit from base stream class.
require('util').inherits(NullStream, Stream);

// Extract args to `write` and emit as `data` event.
NullStream.prototype.write = function (data) {
  console.log('************' + data);
  return true;
};


// Extract args to `end` and emit as `end` event.
NullStream.prototype.end = function () {
  this.emit('end');
};