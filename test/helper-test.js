var path = require('path');

require.paths.unshift(path.join(__dirname, '..', 'lib'));
var vows = require('vows');
var assert = require('assert');
var fs = require('fs');

vows.describe("Vows helpers").addBatch({
    "The vows helper object": {
        topic: function () {
            return vows.helpers;
        },
        "is defined": function(topic) {
            assert.isObject(topic);
        },
        "when a test-helper file is present": {
            topic: function (helper) {
                var that = this;
                fs.readFile("test-helper.js", function(err,data) {
                    if (data) that.callback(null,helper);
                    else that.callback("NO FILE",null);
                });
            },
            "vows.helpers includes functions from helper files": function(err,res) {
              console.log("there");
              if (typeof res == "undefined") assert.equal(err,"NO FILE");
              else assert.equal( res.add(2,2), 4 );
            }
        }
    }
}).export(module);
