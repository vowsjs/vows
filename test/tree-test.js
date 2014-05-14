var vows = require('vows');
var assert = require('assert');

var Tree = require('../lib/tree');

vows.describe('Trees').addBatch({
  "When passed an object": {
    topic: function ( ) {
      this.callback(null, new Tree({
        topic: function ( ) {
          return "topic";
        },
        "subtree": {
          "entry": function ( ) {
            return "entry";
          },
          topic: function ( ) {
            return "subtopic";
          }
        }
      }));
    },
    "The result should be a Tree and contain an _tree private value": function (topic) {
      assert(topic._tree);
    },
    "The first object should return a Tree": {
      topic: function (topic) {
        this.callback(null, topic.nextTree());
      },
      "Which should contain an _tree private value": function (topic) {
        assert(topic._tree);
      }
    },
    "The next Tree": {
      topic: function (topic) {
        this.callback(null, topic.nextTree());
      },
      "should be undefined": function (topic) {
        assert.equal(topic, undefined);
      }
    }
  }
}).export(module);
