var sys = require('sys');

var options = {};
var console = require('vows/console');
var stylize = console.stylize,
    puts = console.puts(options);
//
// Console reporter
//

this.name = 'spec';
this.report = function (data, s) {
    var event = data[1];

    options.stream = typeof(s) === 'object' ? s : process.stdout;
    buffer = [];

    switch (data[0]) {
        case 'subject':
            puts('\n' + stylize(event, 'underline') + '\n');
            break;
        case 'context':
            puts(event);
            break;
        case 'vow':
            puts(' - ' + stylize(event.title, ({
                honored: 'green', broken: 'yellow', errored: 'red'
            })[event.status]));
            if (event.status === 'broken') {
                puts('   ~ ' + event.exception);
            } else if (event.status === 'errored') {
                if (event.exception.type === 'promise') {
                    puts('   * ' + stylize("An 'error' event was caught: " +
                                   stylize(event.exception.error, 'bold'), 'red'));
                } else {
                    puts('   ! ' + stylize(event.exception, 'red'));
                }
            }
            break;
        case 'end':
            sys.print('\n');
            break;
        case 'finish':
            puts(console.result(event).join('\n'));
            break;
        case 'error':
            puts('\n * ' + stylize(event.error, 'red'));
            break;
    }
};

