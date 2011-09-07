var sys  = require('sys'),
    fs   = require('fs'),
    file = require('./file');

this.name = 'coverage-report-emma';

function xmlEnc(value) {
    return !value ? value : String(value).replace(/&/g, "&amp;")
                                         .replace(/>/g, "&gt;")
                                         .replace(/</g, "&lt;")
                                         .replace(/"/g, "&quot;")
                                         .replace(/\u001b\[\d{1,2}m/g, '');
}

function tag(name, attribs, single, content) {
    var strAttr = [], t, end = '>';
    for (var attr in attribs) {
        if (attribs.hasOwnProperty(attr)) {
            strAttr.push(attr + '="' + xmlEnc(attribs[attr]) + '"');
        }
    }
    if (single) {
        end = ' />';
    }
    if (strAttr.length) {
        t = '<' + name + ' ' + strAttr.join(' ') + end;
    } else {
        t = '<' + name + end;
    }
    if (typeof content !== 'undefined') {
        return t + content + '</' + name + end;
    }
    return t;
}

function end(name) {
    return '</' + name + '>';
}

function cdata(data) {
    return '<![CDATA[' + xmlEnc(data) + ']]>';
}

/**
 * coverageMap coverage info for each file
 */
this.report = function (coverageMap) {
    var output = {
        meta: {
            "generator":        "vowsjs",
            "generated":        new Date().toString(),
            "instrumentation":  "node-jscoverage",
            "file-version":     "1.0"
        },
        files:     [ ],
        coverage:  [ ]
    };
    
    for (var filename in coverageMap) {
        if (coverageMap.hasOwnProperty(filename)) {
        	// get data for the file
            var data = file.coverage(filename, coverageMap[filename]);
            
            var coverage = {
                file:      filename,
                coverage:  data.coverage.toFixed(2),
                hits:      data.hits,
                misses:    data.misses,
                sloc:      data.sloc,
                source:    { }
            };

            for (var i = 0; i < data.source.length; i++) {
                coverage.source[i + 1] = {
                    line:     data.source[i].line,
                    coverage: data.source[i].coverage
                };
            }

            output.coverage.push(coverage);

            output.files.push(filename);
        }
    }
    var totalsloc = 0;
    var totalhits = 0;
    for ( var i = 0; i < output.coverage.length; i++) {
    	totalsloc += output.coverage[i].sloc;
    	totalhits += output.coverage[i].hits;
    }
    
    var buffer       = [];
    buffer.push(tag('report', {}, false));
    buffer.push(tag('stats', {}, false));
    buffer.push(tag('packages', { value: 1 }, false));
    buffer.push(tag('classes', { value: 1 }, false));
    buffer.push(tag('srcfiles', { value: output.files.length }, false));
    buffer.push(tag('srclines', { value: totalsloc }, false));
    buffer.push(end('stats'));
    
    buffer.push(tag('data', {}, false));
    // all
    buffer.push(tag('all', { name : 'all classes'}, false));
    buffer.push(tag('coverage', { type : 'class, %', value : '100% (1/1)'}, true) );
    buffer.push(tag('coverage', { type : 'method, %', value : '100% (1/1)'}, true) );
    buffer.push(tag('coverage', { type : 'block, %', value : '100% (1/1)'}, true) );
    buffer.push(tag('coverage', { type : 'line, %', value : (totalhits*1.0/totalsloc * 100.0).toFixed(2) + '% ('+totalhits+'/'+totalsloc+')'}, true) );

    // package
    buffer.push(tag('package', {name: '{root}'}, false));
    buffer.push(tag('coverage', { type : 'class, %', value : '100% (1/1)'}, true) );
    buffer.push(tag('coverage', { type : 'method, %', value : '100% (1/1)'}, true) );
    buffer.push(tag('coverage', { type : 'block, %', value : '100% (1/1)'}, true) );
    buffer.push(tag('coverage', { type : 'line, %', value : (totalhits*1.0/totalsloc * 100.0).toFixed(2) + '% ('+totalhits+'/'+totalsloc+')'}, true) );

    for ( var i = 0; i < output.coverage.length; i++) {
    	var sloc = output.coverage[i].sloc;
    	var hits = output.coverage[i].hits;
    	var filename = output.coverage[i].file;
    	
        buffer.push(tag('srcfile', { name : filename }, false) );
        buffer.push(tag('coverage', { type : 'class, %', value : '100% (1/1)'}, true) );
        buffer.push(tag('coverage', { type : 'method, %', value : '100% (1/1)'}, true) );
        buffer.push(tag('coverage', { type : 'block, %', value : '100% (1/1)'}, true) );
        buffer.push(tag('coverage', { type : 'line, %', value : (hits*1.0/sloc * 100.0).toFixed(2) + '% ('+hits+'/'+sloc+')'}, true) );
        buffer.push(end('srcfile'));
    }

    buffer.push(end('package'));
    
    buffer.push(end('all'));
    buffer.push(end('data'));


    buffer.push(end('report'));
    
    buffer.unshift('<!-- EMMA v2.0.4015 (stable) report, generated '+ output.meta.generated + ' by ' + output.meta.generator + ' -->');

    try {
        out  = fs.openSync("coverage.emma", "w");
        fs.writeSync(out, buffer.join('\n'));
        fs.close(out);
    } catch (error) {
        sys.print("Error: Unable to write to file coverage.emma\n");
        return;
    }
};