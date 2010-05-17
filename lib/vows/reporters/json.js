var sys = require('sys');
//
// Console JSON reporter
//
this.report = function (obj) {
    sys.puts(JSON.stringify(obj));
};
