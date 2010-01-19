//
// Eyes.js - a customizable value inspector for Node.js
//
//   usage:
//
//       var inspect = require('eyes').inspector({styles: {all: 'magenta'}});
//       inspect(something); // inspect with the settings passed to `inspector`
//
//     or
//
//       var eyes = require('eyes');
//       eyes.inspect(something); // inspect with the default settings
//
var eyes = {
    defaults: {
        styles: {                // Styles applied to stdout
            all:    'cyan',      // Overall style applied to everything 
            label:  'underline', // Inspection labels, like 'array' in `array: [1, 2, 3]`
            other:  'inverted',  // Objects which don't have a literal representation, such as functions
            key:    'bold',      // The keys in object literals, like 'a' in `{a: 1}`
            special: null,       // null, undefined...
            string:  null,
            number:  null,
            bool:    null
        },
        hideFunctions: false,
        writer: process.stdio.write,
        maxLength: 2048          // Truncate output if longer
    },

    // Return a curried inspect() function, with the `options` argument filled in.
    inspector: function (options) {
        var that = this;
        return function (obj, label, opts) {
            return that.inspect(obj, label,
                process.mixin(true, {}, options || {}, opts || {}));
        };
    },

    // If we have a `writer` defined, use it to print a styled string,
    // if not, we just return the stringified object with no styling.
    inspect: function (obj, label, options) {
        options = process.mixin(true, {}, this.defaults, options || {});
        if (options.writer) {
            return this.print(this.stringify(obj, options), label, options);
        } else {
            options.styles = {};
            return this.stringify(obj, options); 
        }
    },

    // Output using the 'writer', and an optional label
    // Loop through `str`, and truncate it after `options.maxLength` has been reached.
    // Because escape sequences are, at this point embeded within
    // the output string, we can't measure the length of the string
    // in a useful way, without separating what is an escape sequence,
    // versus a printable character (`c`). So we resort to counting the 
    // length manually.
    print: function (str, label, options) {
        for (var c = 0, i = 0; i < str.length; i++) {
            if (str.charAt(i) === '\033') { i += 4 } // `4` because '\033[25m'.length + 1 == 5
            else if (c === options.maxLength) {
               str = str.slice(0, i - 1) + '…';
               break; 
            } else { c++ }
        }
        return options.writer((label ?
            this.stylize(label, options.styles.label, options.styles) + ': ' : '') +
            this.stylize(str,   options.styles.all, options.styles) + '\033[0m' + "\n");
    },

    // Convert any object to a string, ready for output.
    // When an 'array' or an 'object' are encountered, they are
    // passed to specialized functions, which can then recursively call
    // stringify().
    stringify: function (obj, options) {
        var that = this, stylize = function (str, style) {
            return that.stylize(str, options.styles[style], options.styles)
        };

        switch (typeOf(obj)) {
            case "string":
                obj = (obj.length === 1 ? "'" + obj + "'" : '"' + obj + '"')
                      .replace(/\n/g, '\\n');
                return stylize(obj, 'string');
            case "regexp"   : return stylize('/' + obj.source + '/', 'regexp');
            case "number"   : return stylize(obj + '',    'number');
            case "function" : return options.writer ? stylize("Function",  'other') : '[Function]';
            case "null"     : return stylize("null",      'special');
            case "undefined": return stylize("undefined", 'special');
            case "boolean"  : return stylize(obj + '',    'bool');
            case "date"     : return stylize(obj.toString());
            case "array"    : return this.stringifyArray(obj,  options);
            case "object"   : return this.stringifyObject(obj, options);
        }
    },

    // Convert an array to a string, such as [1, 2, 3].
    // This function calls stringify() for each of the elements
    // in the array.
    stringifyArray: function (ary, options) {
        var out = [];

        for (var i = 0; i < ary.length; i++) {
            out.push(this.stringify(ary[i], options));
        }
        return '[' + out.join(', ') + ']';
    },

    // Convert an object to a string, such as {a: 1}.
    // This function calls stringify() for each of its values,
    // and does not output functions or prototype values.
    stringifyObject: function (obj, options) {
        var out = [];

        for (var k in obj) {
            if (obj.hasOwnProperty(k) && !(obj[k] instanceof Function && options.hideFunctions)) {
                out.push(this.stylize(k, options.styles.key, options.styles) + ': ' + 
                         this.stringify(obj[k], options));
            }
        }
        return "{" + out.join(', ') + "}";
    },

    // Apply a style to a string, eventually,
    // I'd like this to support passing multiple
    // styles.
    stylize: function (str, style, styles) {
        var codes = {
            'bold'      : [1,  22],
            'underline' : [4,  24],
            'inverse'   : [7,  27],
            'cyan'      : [36, 39],
            'magenta'   : [35, 39],
            'yellow'    : [33, 39],
            'green'     : [32, 39],
            'red'       : [31, 39]
        }, endCode;

        if (style && codes[style]) {
            endCode = (codes[style][1] === 39 && styles.all) ? codes[styles.all][0] 
                                                             : codes[style][1];
            return '\033[' + codes[style][0] + 'm' + str +
                   '\033[' + endCode + 'm';
        } else { return str }
    }
};

// CommonJS module support
process.mixin(exports, eyes);

// A better `typeof`
function typeOf(value) {
    var s = typeof(value),
        types = [Object, Array, String, RegExp, Number, Function, Boolean, Date];

    if (s === 'object' || s === 'function') {
        if (value) {
            types.forEach(function (t) {
                if (value instanceof t) { s = t.name.toLowerCase() }
            });
        } else { s = 'null' }
    }
    return s;
}

