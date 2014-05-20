var tree = require('./lib/tree'),
    log = require('./lib/log');


function Vows (description) {
  this._batches = [ ];
  this._description = description;
}


Vows.prototype.addBatch = function (batch) {
  this._batches.push(batch);

  return this;
};

Vows.prototype.export = function (module) {
  this._module = module;

  this._module.exports.Vows = this;
};

module.exports = exports = {
  describe: function (description) {
    return new Vows(description);
  }
};
