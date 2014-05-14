var log = require('./log');

// take the tree and build helpers for it
/*

  {
    "Module Tests": {
    "topic": function (topic) {
      this.next(null, topic);
    },
    "When a module is loaded": {
      "It should not be null": function (topic) {
        assert(topic);
      }
    }
  }


*/

function Tree (tree) {
  this._tree          = tree || { };
  this._objectKeys    = [ ];
  this._functionKeys  = [ ];
  this._currentObject = -1;
  this._currentTest   = -1;
  this._currentKey    = -1;
  this._keys          = Object.keys(tree);

  if (tree) {
    // seperate out functions from other sub-objects
    for (var i = 0; i < this._keys.length; i++) {
      if (typeof tree[this._keys[i]] === 'object') {
        this._objectKeys.push(this._keys[i]);
      } else if (typeof tree[this._keys[i]] === 'function' && this._keys[i] !== 'topic') {
        this._functionKeys.push(this._keys[i]);
      }
    }
  }
}

// returns a Tree representation if next is object, or function
Tree.prototype.nextEntry = function ( ) {
  if (this._currentKey < this._keys.length - 1) {
    this._currentKey++;
    var key = this._keys[this._currentKey];

    // skip if this is the topic
    if (key === 'topic') {
      return this.nextEntry();
    }

    if (typeof this._tree[this._keys[this._currentKey]] === 'object') {
      return new Tree(this._tree[this._keys[this._currentKey]]);
    } else if (typeof this._tree[this._keys[this._currentKey]] === 'function') {
      return this._tree[this._keys[this._currentKey]];
    }
  }
};

// returns a Tree representation of the next sub-object
Tree.prototype.nextTree = function ( ) {
  if (this._currentObject < this._objectKeys.length - 1) {
    this._currentObject++;
    return new Tree(this._tree[this._objectKeys[this._currentObject]]);
  }
};

// returns the current topic for the tree
Tree.prototype.topic = function ( ) {
  if (this.tree.topic) {
    return this.tree.topic;
  }
};

// returns the next function for the tree (sans topic)
Tree.prototype.nextFunction = function ( ) {
  if (this._currentFunction < this._functionKeys.length - 1) {
    this._currentFunction++;
    return this._tree[this._functionKeys[this._currentFunction]];
  }
};

module.exports = exports = Tree;
