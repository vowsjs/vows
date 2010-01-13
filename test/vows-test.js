var vows = require('../lib/vows');

vows.tell("Vows", {
    "let's start with some basics": {
        setup: function () {
            var promise = new(process.Promise);
            setTimeout(function () { promise.emitSuccess("hello world.") }, 100);
            return promise;
        },
        "testing equality": function (it) {
            it.should.equal("hello world.");
            it.should.beA(String);
        },
        "testing match": function (it) {
            it.should.match(/[a-z]+ [a-z]+/);
        },
        "testing inclusion": function (it) {
            it.should.include("world");
        }
    },
    "and now something a little more complex": {
        setup: function () {
            var promise = new(process.Promise);
            setTimeout(function () { promise.emitSuccess({f: 1, z: 2}) }, 100);
            return promise;
        },
        "testing member equality": function (it) {
            it.should.beA(Object);
            it['f'].should.equal(1);
            it['z'].should.equal(2);
        }
    },
});
