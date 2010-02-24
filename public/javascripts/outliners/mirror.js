Object.subclass("Mirror", {
  initialize: function(o) {
    this._reflectee = o;
  },

  reflectee: function() { return this._reflectee; },

  equals: function(m) {
    return this.reflectee() === m.reflectee();
  },

  toString: function() {
    return "a mirror"; // aaa - crap, hash tables will be linear time now; can I get an object ID somehow?
  },

  inspect: function() {
    return "a mirror on " + this.reflectee();
  },

  eachSlot: function(f) {
    var o = this.reflectee();
    for (var name in o) {
      if (o.hasOwnProperty(name)) {
        f(new Slot(name, this));
      }
    }
  },

  contentsAt: function(n) {
    return new Mirror(this.primitiveContentsAt(n));
  },

  primitiveContentsAt: function(n) {
    return this.reflectee()[n];
  },

  findUnusedSlotName: function(prefix) {
    var pre = prefix || "slot";
    var i = 0;
    var name;
    do {
      i += 1;
      name = pre + i;
    } while (this.reflectee().hasOwnProperty(name));
    return name;
  },
});
