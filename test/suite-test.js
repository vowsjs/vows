var suite  = require('../lib/suite'),
    vows   = require('vows'),
    assert = require('assert');

vows.describe("Suite").addBatch({
  "a new suite": {
    topic: function ( ) {
      return suite.describe("test");
    },
    "should be an instance of Suite": function (topic) {
      assert.isTrue(topic instanceof suite.Suite);
    }
  }
}).export(module);