var vows = require('vows');
var assert = require('assert');

var sealed = require('./inputs/seals');
var sealed2 = require('./inputs/seals2');

vows.describe("Seals").addBatch({
  "When a Seal is created": {
    topic: function ( ) {
      this.callback(null, sealed);
    },
    "The module has a Seal": function (topic) {
      assert(topic.Seal);
    },
    "The Seal has a description": function (topic) {
      assert.equal(topic.Seal._description, "Seals");
    }
  },
  "When a second Seal is created": {
    topic: function ( ) {
      this.callback(null, sealed2);
    },
    "The module has a Seal": function (topic) {
      assert(topic.Seal);
    },
    "The Seal has a description": function (topic) {
      assert.equal(topic.Seal._description, "Seals2");
    }
  }
}).export(module);
