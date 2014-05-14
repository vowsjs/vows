var _warnings = [ ],
    _errors   = [ ],
    _debug    = [ ],
    _info     = [ ];

var severity = [
  'ERROR',
  'WARNING',
  'DEBUG',
  'INFO'
];

var _severity = -1;

module.exports = exports = {
  "setSeverity": function (sev) {
    _severity = severity.indexOf(sev);
  },
  "warning": function ( ) {
    var args = Array.prototype.slice.call(arguments);

    _warnings.push(args);
    if (_severity !== -1 && _severity <= severity.indexOf('WARNING')) {
      var err = args.pop();
      args.unshift("WARNING");

      console.log.apply(null, args);
      console.log(err.toString());
    }
  },
  "debug": function ( ) {
    var args = Array.prototype.slice.call(arguments);

    _debug.push(args);
    if (_severity !== -1 && _severity <= severity.indexOf('DEBUG')) {
      var err = args.pop();
      args.unshift("DEBUG");

      console.log.apply(null, args);
      console.log(err.toString());
    }
  },
  "error": function ( ) {
    var args = Array.prototype.slice.call(arguments);

    _errors.push(args);
    if (_severity !== -1 && _severity <= severity.indexOf('ERROR')) {
      var err = args.pop();
      args.unshift("ERROR");

      console.log.apply(null, args);
      console.log(err.toString());
    }
  },
  "info": function ( ) {
    var args = Array.prototype.slice.call(arguments);

    _info.push(args);
    if (_severity !== -1 && _severity <= severity.indexOf('INFO')) {
      var err = args.pop();
      args.unshift("INFO");

      console.log.apply(null, args);
      console.log(err.toString());
    }
  },
  "getWarnings": function ( ) {
    return _warnings;
  },
  "getErrors": function ( ) {
    return _errors;
  },
  "getInfo": function ( ) {
    return _info;
  },
  "getDebug": function ( ) {
    return _debug;
  }
};
