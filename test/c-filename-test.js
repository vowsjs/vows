var vows = require('../lib/vows'),
    assert = require('assert');

vows.describe('vows/c-file-test').addBatch({
  'if this test runs': {
    topic: function() {
      return true;
    },

    'we are happy': function() {
      assert.ok(true);
    }
  }
}).export(module);

