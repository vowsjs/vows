var sys = require('sys');

var options = {};
var stylize = require('vows/console').stylize,
    puts = require('vows/console').puts(options);
//
// Console reporter
//

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
            var result = event.honored + " honored, " +
                         event.broken  + " broken, "  +
                         event.errored + " errored",
            style  = event.honored === event.total ? ('green')
                                                   : (event.errored === 0 ? 'yellow' : 'red');

            if ('time' in event) {
                puts("\nVerified " + event.total + " vows in " +
                    (event.time + " seconds.\n"));
            }
            puts(stylize(result, style));
            break;
        case 'error':
            puts('\n * ' + stylize(event.error, 'red'));
            break;
    }
};

