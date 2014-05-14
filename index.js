var tree = require('./lib/tree'),
    log = require('./lib/log');


function Vows (description) {
  this._batches = [ ];
  this._description = description;
}


Seal.prototype.addBatch = function (batch) {
  this._batches.push(batch);

  return this;
};

Seal.prototype.export = function (module) {
  this._module = module;

  this._module.exports.Seal = this;
};

module.exports = exports = {
  describe: function (description) {
    return new Seal(description);
  }
};
