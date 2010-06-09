var sys = require('sys');

var options = {};
var console = require('vows/console');
var stylize = console.stylize,
    puts = console.puts(options);
//
// Console reporter
//
var lastContext;

this.name = 'watch';
this.reset = function () {
    lastContext = null;
};
this.report = function (data) {
    var event = data[1];

    options.stream = process.stdout;

    switch (data[0]) {
        case 'vow':
            if (event.status !== 'honored') {
                if (lastContext !== event.context) {
                    lastContext = event.context;
                    puts(event.context);
                }
                if (event.status === 'broken') {
                    puts(' - '   + stylize(event.title, 'yellow'));
                    puts('   ~ ' + event.exception);
                } else if (event.status === 'errored') {
                    puts(' - ' + stylize(event.title, 'red'));
                    if (event.exception.type === 'promise') {
                        puts('   * ' + stylize("An 'error' event was caught: " +
                                                stylize(event.exception.error, 'bold'), 'red'));
                    } else {
                        puts('   ! ' + stylize(event.exception, 'red'));
                    }
                }
                puts('');
            }
            break;
        case 'error':
            puts('\n\n * ' + stylize(event.error, 'red'));
            break;
    }
};
this.print = function (str) {};
