var stylize = require('../vows/console').stylize;
var inspect = require('../vows/console').inspect;
var diff = require('diff');

/**
 * Pad the given `str` to `len`.
 *
 * @param {String} str
 * @param {String} len
 * @return {String}
 * @api private
 */

function pad(str, len) {
  str = String(str);
  return Array(len - str.length + 1).join(' ') + str;
}

/**
 * Color lines for `str`, using the color `name`.
 *
 * @param {String} name
 * @param {String} str
 * @return {String}
 * @api private
 */

function styleLines(str, name) {
  return str.split('\n').map(function(str){
    return stylize(str, name);
  }).join('\n');
}

/**
 * Return a character diff for `err`.
 *
 * @param {Error} err
 * @return {String}
 * @api private
 */

function errorDiff(err, type) {
  return diff['diff' + type](err.actual, err.expected).map(function(str){
    if (/^(\n+)$/.test(str.value)) str.value = Array(++RegExp.$1.length).join('<newline>');
    if (str.added) return styleLines(str.value, 'green');
    if (str.removed) return styleLines(str.value, 'red');
    return str.value;
  }).join('');
}

require('assert').AssertionError.prototype.toString = function () {
    var that = this,
        source;

    if (this.stack) {
        source = this.stack.match(/([a-zA-Z0-9._-]+\.(?:js|coffee))(:\d+):\d+/);
    }

    function parse(str) {
        var actual = that.actual,
            expected = that.expected,
            msg, len;

        if (
            'string' === typeof actual &&
            'string' === typeof expected
        ) {
            len = Math.max(actual.length, expected.length);

            if (len < 20) msg = errorDiff(that, 'Chars');
            else msg = errorDiff(that, 'Words');

            // linenos
            var lines = msg.split('\n');
            if (lines.length > 4) {
                var width = String(lines.length).length;
                msg = lines.map(function(str, i){
                    return pad(++i, width) + ' |' + ' ' + str;
                }).join('\n');
            }

            // legend
            msg = '\n'
                + stylize('actual', 'green')
                + ' '
                + stylize('expected', 'red')
                + '\n\n'
                + msg
                + '\n';

            // indent
            msg = msg.replace(/^/gm, '      ');

            return msg;
        }

        actual = inspect(actual, {showHidden: actual instanceof Error});

        if (expected instanceof Function) {
            expected = expected.name;
        }
        else {
            expected = inspect(expected, {showHidden: actual instanceof Error});
        }

        return str.replace(/{actual}/g,   actual).
                   replace(/{operator}/g, stylize(that.operator, 'bold')).
                   replace(/{expected}/g, expected);
    }

    if (this.message) {
        var msg = stylize(parse(this.message), 'yellow');
      	if (source) {
      		  msg += stylize(' // ' + source[1] + source[2], 'grey');
      	}
        return msg;
    } else {
        return stylize([
            this.expected,
            this.operator,
            this.actual
        ].join(' '), 'yellow');
    }
};

