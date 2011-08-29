var path   = require('path'),
    events = require('events'),
    assert = require('assert'),
    fs     = require('fs'),
    vows   = require('../lib/vows');
    
function doSomethingAsync(callback) {
  	var err = null;
  	var testValue = 'a';

  	process.nextTick(function() {
  		  callback(err, testValue);
  	});
}

function doSomethingAsyncWithError(callback) {
  	var err = true;
  	var testValue = 'a';

  	process.nextTick(function() {
  		  callback(err, testValue);
  	});
}

var batchCount = 0;
vows.describe('vows/error').addBatch({
	'Generate success response to async function': {
    		topic: function() {
    			  doSomethingAsync(this.callback)
    		},
    		'Validate success': function(err, testValue) {
    			  assert.ok(!err);
    		},
    		'Validate testValue': function(err, testValue) {
    			  assert.equal(testValue, 'a');
    		}
  	},

  	'Generate error response to async function': {
    		topic: function() {
    			  doSomethingAsyncWithError(this.callback)
    		},
    		'Validate error': function(err, testValue) {
    			  assert.ok(err);
    		},
    		'Validate testValue': function(err, testValue) {
    			  // This assertion fails. It shouldn't.
    			  assert.equal(testValue, 'a');
    		}
  	},

   'Generate a hard error in the topic': {
       topic: function(){ ({}).unknownMethod(this.callback); },
       'should not stop vows': function(){ assert.equal(arguments.length,1); }
   },

   'In a batch': {
       'generate an exception in the first topic': {
           topic: function(){ ({}).unknownMethod(this.callback); },
           'vow': function(){ ++batchCount; }
       },
       'ensure the second topic runs': {
           topic: function(){ return {}; },
           'vow': function(){ ++batchCount; },
       }
   }
}).addBatch({
   'Next batch running sequentially': {
       topic: function(){ return batchCount; },
       'checks that the batchCount is 1': function(b){ assert.equal(b, 1); }
   }
}).addBatch({
    'Outer batch': {
        'Nested batch': {
            'Nested(2) batch: topic throws': {
                topic: function(){ ({}).unknownMethod(this.callback); },
                'vow 1': function(){},
                'vow 2': function(){},
            }
        },
        'Nested(2) batch decreases batchCount': {
            topic: function(){ batchCount--; return batchCount; },
            'vow': function(b){ assert.equal(b, 0); },
        }
    }
}).export(module);



