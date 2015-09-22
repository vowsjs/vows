var options = { tail: '\n', raw: true };
var console = require('../../vows/console');
var puts = console.puts(options);
var util = require('util'),
    fs   = require('fs')
// Console JSON reporter
//
this.name = 'json-file';
this.setStream = function (s) {
    options.stream = s;
};
var bufferReport;

function removeCircularSuite(obj, suite) {
    var result = {};

    if (typeof obj !== 'object' || obj === null) return obj;

    Object.keys(obj).forEach(function(key) {
        if (obj[key] === suite) {
            result[key] = {};
        } else {
            result[key] = removeCircularSuite(obj[key], suite || obj.suite);
        }
    });

    return result;
};

this.report = function (obj) {
    puts(JSON.stringify(removeCircularSuite(obj)));
    bufferReport += JSON.stringify(removeCircularSuite(obj))
    if(obj[0]==="finish"){
        puts("Generating report.json file ...")
        try {
            var out  = fs.openSync("report.json", "w");
            fs.writeSync(out, bufferReport);
            fs.close(out);
            puts("Generating report.json file complete")
        } catch (error) {
            global.console.error("Error: Unable to write to file report.json\n");
            return;
        }
    }
};

this.print = function (str) {};
