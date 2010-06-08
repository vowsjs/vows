
var sys = require('sys');

var options = {};
var console = require('vows/console');
var stylize = console.stylize,
    puts = console.puts(options);
//
// Console reporter
//
var stream, messages = [];

this.name = 'dot-matrix';
this.report = function (data, s) {
    var event = data[1];

    options.stream = typeof(s) === 'object' ? s : process.stdout;

    switch (data[0]) {
        case 'subject':
            // messages.push(stylize(event, 'underline') + '\n');
            break;
        case 'context':
            break;
        case 'vow':
            if (event.status === 'honored') {
                sys.print(stylize('.', 'green'));
            } else if (event.status === 'pending') {
                sys.print(stylize('.', 'cyan'));
            } else {
                event.context && messages.push(event.context);
                if (event.status === 'broken') {
                    sys.print(stylize('B', 'yellow'));
                    messages.push(' - '   + stylize(event.title, 'yellow'));
                    messages.push('   ~ ' + event.exception);
                } else if (event.status === 'errored') {
                    sys.print(stylize('E', 'red'));
                    messages.push(' - ' + stylize(event.title, 'red'));
                    if (event.exception.type === 'promise') {
                        messages.push('   * ' + stylize("An 'error' event was caught: " +
                                                stylize(event.exception.error, 'bold'), 'red'));
                    } else {
                        messages.push('   ! ' + stylize(event.exception, 'red'));
                    }
                }
                messages.push('');
            }
            break;
        case 'end':
            sys.print(' ');
            break;
        case 'finish':
            if (messages.length) {
                puts('\n\n' + messages.join('\n'));
            } else {
                sys.print('\n');
            }
            puts(console.result(event).join('\n'));
            break;
        case 'error':
            puts('\n\n * ' + stylize(event.error, 'red'));
            break;
    }
};

this.print = function (str) {
    sys.print(str);
};
