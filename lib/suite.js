var traceback = require('traceback');

function Suite (name) {
  this.name = name;
  this.batches = [ ];
}

Suite.prototype.addBatch = function (batch) {
  this.batches.push(batch);

  return this;
};

function runBatch (batch) {
  var contexts = Object.keys(batch);

  for (var i = 0; i < contexts.length; i++) {
    runContext(batch[contexts[i]], [ ]);
  }
}

function runContext (context, previousTopics) {
  previousTopics = previousTopics || [ ];

  var keys = Object.keys(context);

  if (context.topic) {
    var ctx = {
      callback: function ( ) {
        console.log(arguments);
      }
    };

    try {
      var res = topic.apply(ctx, previousTopics);

      // topic returns a response
      if (res !== undefined) {
        // stash as an array, as we will apply it later
        previousTopics = [ res ];
      }
    } catch (err) {
      console.log(traceback()[0]);
    }
  }
}

function runContextsWithTopic (context, topic) {
  var keys = Object.keys(context).filter(function (e) {
    return e !== 'topic' ? e : null;
  });

  for (var i = 0; i < keys.length; i++) {
    var vow = context[keys[i]];

    if (typeof vow === 'function') {
      runVow(vow, topic);
    } else {
      runContext(vow, topic);
    }
  }
}

function runVow (vow, topic) {
  try {
    var res = vow.apply(null, topic);
  } catch (err) {
    console.log(traceback()[0]);
  }
}

function describe (name) {
  return new Suite(name);
}



exports.describe = describe;