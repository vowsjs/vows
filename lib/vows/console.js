var eyes = require('eyes').inspector({ stream: null });

// Stylize a string
this.stylize = function stylize(str, style) {
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
};

this.puts = function (options) {
    var stylize = exports.stylize;
    return function (args) {
        args = Array.prototype.slice.call(arguments).map(function (a) {
            return a.replace(/`([^`]+)`/g,   function (_, capture) { return stylize(capture, 'italic') })
                    .replace(/\*([^*]+)\*/g, function (_, capture) { return stylize(capture, 'bold') });
        });
        return options.stream.write(args.join('\n') + '\n');
    };
};

this.result = function (event) {
    var result = event.honored + " honored, " +
                 event.broken  + " broken, "  +
                 event.errored + " errored",
        style  = event.honored === event.total ? ('green')
                                               : (event.errored === 0 ? 'yellow' : 'red'),
        buffer = [];


    if ('time' in event) {
        buffer.push("Verified " + event.total + " vows in " +
                   (event.time.toFixed(3) + " seconds.\n"));
    }
    buffer.push(this.stylize(result, style));

    return buffer;
};

this.inspect = function inspect(val) {
    return '\033[1m' + eyes(val) + '\033[22m';
};
