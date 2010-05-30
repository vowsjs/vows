
var sys = require('sys');
//
// Console reporter
//
var stream, buffer, messages = [];

this.report = function (data, s) {
    var event = data[1];

    stream = typeof(s) === 'object' ? s : process.stdout;
    buffer = [];

    switch (data[0]) {
        case 'subject':
            puts('\n' + stylize(event, 'underline') + '\n');
            sys.print(' ');
            break;
        case 'context':
            break;
        case 'vow':
            if (event.status === 'honored') {
                sys.print(stylize('.', 'green'));
            } else if (event.status === 'broken') {
                sys.print(stylize('B', 'yellow'));
                messages.push(' - '   + stylize(event.title, 'yellow'));
                messages.push('   ~ ' + event.exception);
                messages.push('');
            } else if (event.status === 'errored') {
                sys.print(stylize('E', 'red'));
                messages.push(' - ' + stylize(event.title, 'red'));
                if (event.exception.type === 'promise') {
                    messages.push('   * ' + stylize("An 'error' event was caught: " +
                                            stylize(event.exception.error, 'bold'), 'red'));
                } else {
                    messages.push('   ! ' + stylize(event.exception, 'red'));
                }
                messages.push('');
            }
            break;
        case 'end':
            sys.print(' ');
            break;
        case 'finish':
            var result = event.honored + " honored, " +
                         event.broken  + " broken, "  +
                         event.errored + " errored",
            style  = event.honored === event.total ? ('green')
                                                   : (event.errored === 0 ? 'yellow' : 'red');

            if (messages.length) {
                messages.pop(); // drop trailing blank message 
                puts('\n\n' + messages.join('\n'));
            } else {
                sys.print('\n');
            }

            if ('time' in event) {
                puts("\nVerified " + event.total + " vows in " +
                    (event.time + " seconds.\n"));
            }
            puts(stylize(result, style));
            break;
        case 'error':
            messages.push('\n * ' + stylize(event.error, 'red'));
            break;
    }
    return buffer.join('');
};

function puts(args) {
    args = Array.prototype.slice.call(arguments).map(function (a) {
        return a.replace(/`([^`]+)`/g,   function (_, capture) { return stylize(capture, 'italic') })
                .replace(/\*([^*]+)\*/g, function (_, capture) { return stylize(capture, 'bold') });
    });
    return stream ? stream.write(args.join('\n') + '\n') : buffer.push(args);
}

// Stylize a string
function stylize(str, style) {
    var styles = {
        'bold'      : [1,  22],
        'italic'    : [3,  23],
        'underline' : [4,  24],
        'yellow'    : [33, 39],
        'green'     : [32, 39],
        'red'       : [31, 39],
        'grey'      : [90, 39],
        'green-hi'  : [92, 32],
    };
    return '\033[' + styles[style][0] + 'm' + str +
           '\033[' + styles[style][1] + 'm';
}
this.stylize = stylize;
