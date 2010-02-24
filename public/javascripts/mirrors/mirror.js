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
    f(new ParentSlot(this));
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

  parent: function() {
    var o = this.reflectee();
    if (! is_proto_property_supported) {
      return new Mirror(o.__parent_slot_that_does_not_actually_mean_anything_but_is_here_for_reflective_purposes__);
    } else {
      return new Mirror(o.__proto__);
    }
  },

  canSetParent: function() { return is_proto_property_supported; },

  setParent: function(pMir) {
    if (! this.canSetParent()) { throw "Sorry, you can't change an object's parent in this browser. Try Firefox or Safari."; }
    this.reflectee().__proto__ = pMir.reflectee();
  },

  createChild: function() {
    var parent = this.reflectee();
    var ChildConstructor = is_proto_property_supported ? function() {} : function() {this.__parent_slot_that_does_not_actually_mean_anything_but_is_here_for_reflective_purposes__ = parent;};
    ChildConstructor.prototype = parent;
    var child = new ChildConstructor();
    return new Mirror(child);
  },
});
