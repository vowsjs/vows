var path = require('path');

require.paths.unshift(path.join(__dirname, '..', 'lib'));

var assert = require('assert');
var vows = require('vows');

vows.describe("Vows/other").addVows({
    "Another test": {
        topic: true,
        "exists in the test/ folder!": function (topic) {
            assert.ok (topic);
        }
    }
}).export(module);
