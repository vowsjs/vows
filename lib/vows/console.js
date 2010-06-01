
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
        return options.stream ? options.stream.write(args.join('\n') + '\n') : buffer.push(args);
    };
};
