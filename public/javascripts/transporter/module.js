lobby.modules = {};

Object.subclass("Module", {
  initialize: function(n) {
    if (lobby.modules[n]) { throw "There is already a module named " + n; }
    this._name = n;
    lobby.modules[n] = this;
  },

  name: function() { return this._name; },

  toString: function() { return "the " + this.name() + " module"; },
});
