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
    },
    "should have an internal name of 'test'": function (topic) {
      assert.equal(topic.name, "test");
    },
    "with added batches": {
      topic: function (topic) {
        topic.addBatch({
          "foo": {
            topic: function ( ) {
              return "bar";
            }
          }
        });

        return topic;
      },
      "should contain a batch": function (topic) {
        assert.equal(topic.batches.length, 1);
      }
    }
  }
}).export(module);