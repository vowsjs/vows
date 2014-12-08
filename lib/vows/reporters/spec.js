var util = require('util');

var options = { tail: '\n' };
var console = require('../../vows/console');
var stylize = console.stylize;
var puts = console.puts(options);
var summary = {};
var currSubject;
//
// Console reporter
//

this.name = 'spec';
this.setStream = function (s) {
    options.stream = s;
};
this.report = function (data) {
    var event = data[1];

    switch (data[0]) {
        case 'subject':
            currSubject = event;
            puts('\n♢ ' + stylize(event, 'bold') + '\n');
            break;
        case 'context':
            puts(console.contextText(event));
            break;
        case 'vow':
            if (event.status === 'broken' || event.status === 'errored') {
                var context = event.context;
                if (!summary[currSubject]) {
                    summary[currSubject] = {};
                    summary[currSubject][context] = [event];
                } else if (!summary[currSubject][context]) {
                    summary[currSubject][context] = [event];
                } else {
                    summary[currSubject][context].push(event);
                }
            } else {
                puts(console.vowText(event));
            }
            break;
        case 'end':
            this.print('\n');
            break;
        case 'finish':
            Object.keys(summary).forEach(function (subject) {
                puts('\n♢ ' + stylize(subject, 'bold') + '\n');
                Object.keys(summary[subject]).forEach(function (context) {
                    puts(console.contextText(context));
                    summary[subject][context].forEach(function (event) {
                        puts(console.vowText(event));
                    });
                });
            });
            puts(console.result(event).join('\n'));
            break;
        case 'error':
            puts(console.error(event));
            break;
    }
};

this.print = function (str) {
    process.stdout.write(str);
};
