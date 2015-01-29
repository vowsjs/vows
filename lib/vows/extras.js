var events = require('events');
var util = require('util');
//
// Wrap a Node.js style async function into an EventEmitter
//
this.prepare = function (obj, targets) {
    targets.forEach(function (target) {
        if (target in obj) {
            obj[target] = (function (fun) {
                return function () {
                    var args = Array.prototype.slice.call(arguments);
                    var ee = new(events.EventEmitter);

                    args.push(function (err /* [, data] */) {
                        var args = Array.prototype.slice.call(arguments, 1);

                        var event = 'success';
                        if (err instanceof Error) {
                            event = 'error';
                        }
                        ee.emit.apply(ee, [event, err].concat(args));
                    });
                    fun.apply(obj, args);

                    return ee;
                };
            })(obj[target]);
        }
    });
    return obj;
};

