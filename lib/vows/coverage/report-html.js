var util = require('util'),
    fs   = require('fs'),
    file = require('./file');

this.name = 'coverage-report-html';

function getCoverageClass( data ) {
  var highCoverage= (data.coverage >= 80);
  var okCoverage= (!highCoverage && data.coverage >=60);
  var coverageClass= '';
  if( highCoverage ) coverageClass= 'high';
  else if( okCoverage) coverageClass= 'medium';
  else coverageClass= 'low';
  return coverageClass;
}
this.report = function (coverageMap) {
    var out, head, foot,
        files = [], summary = {
            hits: 0,
            misses: 0,
            sloc: 0
        };
    
    try {
        out  = fs.openSync("coverage.html", "w");
        head = fs.readFileSync(__dirname + "/fragments/coverage-head.html", "utf8");
        foot = fs.readFileSync(__dirname + "/fragments/coverage-foot.html", "utf8");
    } catch (error) {
        util.print("Error: Unable to write to file coverage.html\n");
        return;
    }

    fs.writeSync(out, head);

    for (var filename in coverageMap) {
        if (coverageMap.hasOwnProperty(filename)) {
            var data = file.coverage(filename, coverageMap[filename]);
            data.filename = filename;
            files.push(data);
            summary.hits += data.hits;
            summary.misses += data.misses;
            summary.sloc += data.sloc;
        }
    }

    summary.coverage = (summary.hits / summary.sloc) * 100;

    fs.writeSync(out, '<h1 id="overview">Coverage</h1><div id="menu">');

    var summaryCoverageClass = getCoverageClass(summary);

    fs.writeSync(out, '<li><a href="#overview">overview</a></li>');
    files.forEach(function (data) {
        var coverageClass = getCoverageClass(data);
        fs.writeSync(out, '<li><span class="cov ' + coverageClass + '">' +
            data.coverage.toFixed(0) + '</span>' +
            '<a href="#' + data.filename + '"><span class="dirname">/</span>' +
            '<span class="basename">' + data.filename +
            '</a></li>');
    });

    fs.writeSync(out, '</div>');

    fs.writeSync(out, '<div class="stats '+ summaryCoverageClass+'">' +
        '<div class="hits">' + summary.hits +
        '</div><div class="misses">' + summary.misses +
        '</div><div class="sloc">' + summary.sloc +
        '</div><div class="percentage">' + summary.coverage.toFixed(0) + "%</div></div>");

    files.forEach(function (data) {
        var coverageClass = getCoverageClass(data);
        fs.writeSync(out, '<div class="file">');
        fs.writeSync(out, '<h2 id="' + data.filename + '">' + data.filename + '</h2>\n');
        fs.writeSync(out, '<div class="stats '+ coverageClass+'">' +
            '<div class="hits">' + data.hits +
            '</div><div class="misses">' + data.misses +
            '</div><div class="sloc">' + data.sloc +
            '</div><div class="percentage">' + data.coverage.toFixed(0) + "%</div></div>");

        fs.writeSync(out, '<table id="source"><thead><tr><th>Line</th><th>Hits</th><th>Source</th></tr></thead><tbody>');

        for (var i = 0, l = data.source.length; i < l; i++) {
            var line = data.source[i],
                klass = (line.coverage === 0 ? 'miss' : 'hit');

            fs.writeSync(out, '<tr class="' + klass + '"><td class="line">' + i +
                '</td><td class="hits">' + line.coverage +
                '</td><td class="source">' + line.line + '</td></tr>');
        }

        fs.writeSync(out, "</tbody></table>\n");
        fs.writeSync(out, "</div>\n");
    });

    fs.writeSync(out, foot);
    fs.close(out);
};
