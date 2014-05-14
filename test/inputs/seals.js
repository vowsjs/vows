var seals = require('../../index');
var assert = require('assert');

seals.describe("Seals").addBatch({
  "When a Seal is created": {
    topic: function ( ) {
      this.callback(null, 1);
    },
    "1 should be returned by the topic": function (topic) {
      assert.equal(topic, 1);
    }
  }
}).export(module);
