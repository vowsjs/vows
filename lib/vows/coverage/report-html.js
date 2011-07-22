var sys  = require('sys'),
    fs   = require('fs'),
    file = require('./file');

this.name = 'coverage-report-html';

this.report = function (coverageMap) {
    var out, head, foot;
    
    try {
        out  = fs.openSync("coverage.html", "w");
        head = fs.readFileSync(__dirname + "/fragments/coverage-head.html", "utf8");
        foot = fs.readFileSync(__dirname + "/fragments/coverage-foot.html", "utf8");
    } catch (error) {
        sys.print("Error: Unable to write to file coverage.html\n");
        return;
    }

    fs.writeSync(out, head);

    for (var filename in coverageMap) {
        if (coverageMap.hasOwnProperty(filename)) {
            var data = file.coverage(filename, coverageMap[filename]);
            
            fs.writeSync(out, "<h2>" + filename + "</h2>\n");
            fs.writeSync(out, '<span class="coverage">' + "[ hits: " + data.hits);
            fs.writeSync(out, ", misses: " + data.misses + ", sloc: " + data.sloc);
            fs.writeSync(out, ", coverage: " + data.coverage.toFixed(2) + "% ]" + "</span>\n");
            fs.writeSync(out, "<ol>\n");

            for (var i = 0; i < data.source.length; i++) {
                fs.writeSync(out, '  <li class="code ');
                fs.writeSync(out, (data.source[i].coverage === 0 ? 'uncovered' : 'covered'));
                fs.writeSync(out, '" coverage="' + data.source[i].coverage + '">');
                fs.writeSync(out, data.source[i].line + "</li>\n");
            }
            
            fs.writeSync(out, "</ol>\n");
        }
    }
    
    fs.writeSync(out, foot);
    fs.close(out);
};