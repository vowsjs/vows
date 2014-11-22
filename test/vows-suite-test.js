var assert = require('assert'),
    vows   = require('../lib/vows');


(function(){
	var changed = false;
	vows.describe('before suite').addBatch({
		'with beforeSuite': {
			topic: function(){
				this.callback(changed);
			},
			'should call before the batches': function(topic){
				assert.isTrue(topic);
			}
		}
	}).beforeSuite(function(){ 
			changed = true; 
			this.done();
	}).afterSuite(function(){
			changed = false;
			this.done();
	}).export(module);

	vows.describe('after suite').addBatch({
			'with afterSuite': {
				topic: function(){
					return changed;
				},
				'should call after the batches': function(topic){
					assert.isFalse(topic);
				}
			}
	}).export(module);
})();
