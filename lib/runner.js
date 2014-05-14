var Tree = require('./tree');

function runBatches (batches, reporter) {
  for (var i = 0; i < batches.length; i++) {
    runBatch(batch, reporter);
  }
}

function runBatch (batch, reporter) {
  var context = {
    callback: function ( ) {
      var err = arguments.shift();
    }
  };

  var tree = new Tree(batch);

  runTree(tree, context, null, reporter);
}

function runTree (tree, context, optionalTopic, reporter) {
  var topic = batch.getTopic();

  if (topic) {
    try {
      topic.apply(context, optionalTopic);
    } catch (err) {

    }

  }

}
