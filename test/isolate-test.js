var vows = require('../lib/vows'),
    assert = require('assert'),
    path = require('path'),
    exec = require('child_process').exec;

function generateTopic(args, file) {
  return function() {
    var cmd = './bin/vows' + ' -i ' + (args || '') +
              ' ./test/fixtures/isolate/' + file,
        options = {cwd: path.resolve(__dirname + '/../')},
        callback = this.callback;

    exec(cmd, options, function(err, stdout, stderr) {
      callback(null, {
        err: err,
        stdout: stdout,
        stderr: stderr
      });
    });
  }
};

function assertExecOk(r) {
  assert.isNull(r.err);
}

function assertExecNotOk(r) {
  assert.isNotNull(r.err);
}

function parseResults(stdout) {
  return stdout.split(/\n/g).map(function(s) {
    if (!s) return;
    return JSON.parse(s);
  }).filter(function(s) {return s});
}

function assertResultTypePresent(results, type) {
  assert.ok(results.some(function(result) {
    return result[0] == type;
  }));
}

function assertResultsFinish(results, expected) {
  var finish = results[results.length - 1];
  assert.equal(finish[0], 'finish');

  finish = finish[1];

  Object.keys(expected).forEach(function(key) {
    assert.equal(finish[key], expected[key]);
  });
}

vows.describe('vows/isolate').addBatch({
  'Running vows with -i flag for test/fixtures/isolate/': {
    'passing-test.js': {
      'with default reporter': {
        topic: generateTopic(null, 'passing-test.js'),
        'should be ok': assertExecOk
      },
      'with json reporter': {
        topic: generateTopic('--json', 'passing-test.js'),
        'should be ok': assertExecOk,
        'should have correct output': function(r) {
          var results = parseResults(r.stdout)

          assertResultTypePresent(results, 'subject');
          assertResultTypePresent(results, 'end');

          assertResultsFinish(results, {
            total: 4,
            honored: 4
          });
        }
      }
    },
    'failing-test.js': {
      'with json reporter': {
        topic: generateTopic('--json', 'failing-test.js'),
        'should be not ok': assertExecNotOk,
        'should have correct output though': function(r) {
          var results = parseResults(r.stdout);

          assertResultsFinish(results, {
            total: 4,
            broken: 4
          });
        }
      }
    },
    'stderr-test.js': {
      'with json reporter': {
        topic: generateTopic('--json', 'stderr-test.js'),
        'should be ok': assertExecOk,
        'should have stderr': function(r) {
          assert.equal(r.stderr,
                       ['oh no!', 'oh no!', 'oh no!', 'oh no!', ''].join('\n'));
        },
        'should have correct output': function(r) {
          var results=  parseResults(r.stdout);

          assertResultsFinish(results, {
            total: 4,
            honored: 4
          });
        }
      }
    },
    'log-test.js': {
      'with json reporter': {
        topic: generateTopic('--json', 'log-test.js'),
        'should be ok': assertExecOk,
        'should have correct output': function(r) {
          var results=  parseResults(r.stdout);

          assertResultsFinish(results, {
            total: 4,
            honored: 4
          });
        }
      }
    },
    'all tests (*)': {
      'with json reporter': {
        topic: generateTopic('--json', '*'),
        'should be not ok': assertExecNotOk,
        'should have correct output': function(r) {
          var results=  parseResults(r.stdout);

          assertResultsFinish(results, {
            total: 16,
            broken: 4,
            honored: 12
          });
        }
      }
    }
  }
}).export(module);
