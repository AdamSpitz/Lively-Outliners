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
    return "" + this.reflectee();
  },

  eachSlot: function(f) {
    var o = this.reflectee();
    for (var name in o) {
      if (o.hasOwnProperty(name)) {
        f(this.slotAt(name));
      }
    }
  },

  slotAt: function(n) {
    return new Slot(n, this);
  },

  contentsAt: function(n) {
    return new Mirror(this.primitiveContentsAt(n));
  },

  primitiveContentsAt: function(n) {
    return this.reflectee()[n];
  },

  setContentsAt: function(n, m) {
    this.primitiveSetContentsAt(n, m.reflectee());
  },

  primitiveSetContentsAt: function(n, o) {
    return this.reflectee()[n] = o;
  },

  removeSlotAt: function(n) {
    delete this.reflectee()[n];
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

  renameSlot: function(oldName, newName) {
    var o = this.reflectee();
    if (  o.hasOwnProperty(newName)) { throw o + " already has a slot named " + newName; }
    if (! o.hasOwnProperty(oldName)) { throw o + " has no slot named "        + oldName; }
    var contents = o[oldName];
    delete o[oldName];
    o[newName] = contents;
  },
});
