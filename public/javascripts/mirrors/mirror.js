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
    return this.name(); // later can add the concept of complete objects, so I can do a toString()
  },

  name: function() {
    if (this.isReflecteePrimitive()) {return "" + this.reflectee();}

    var cs = this.creatorSlot();
    if (cs) {
      var isWellKnown = cs.contents().equals(this);
      var lobbyMir = new Mirror(lobby);
      var chain = [cs];
      while (! cs.holder().equals(lobbyMir)) {
        cs = cs.holder().creatorSlot();
        chain.push(cs);
      }
      var s = new StringBuffer(isWellKnown ? "" : (/^[AEIOUaeiou]/).exec(cs.name()) ? "an " : "a ");
      for (var i = chain.length - 1; i >= 0; i -= 1) {
        s.append(chain[i].name());
        if (i > 0) {s.append(" ");}
      }
      return s.toString();
    } else {
      return "an object";
    }
  },
  
  isWellKnown: function() {
    var cs = this.creatorSlot();
    return cs ? cs.contents().equals(this) : false;
  },

  reflecteeToString: function() {
    return "" + this.reflectee();
  },

  eachSlot: function(f) {
    var o = this.reflectee();
    f(new ParentSlot(this));
    if (! this.canHaveSlots()) {return;} // aaa - should this go one line up? Do primitives have a parent? Or maybe numbers do but null doesn't or something?
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
    if (! this.canHaveSlots()) { throw this.name() + " cannot have slots"; }
    var pre = prefix || "slot";
    var i = 0;
    var name;
    do {
      i += 1;
      name = pre + i;
    } while (this.reflectee().hasOwnProperty(name));
    return name;
  },

  reflecteeHasOwnProperty: function(n) {
    if (! this.canHaveSlots()) { return false; }
    return this.reflectee().hasOwnProperty(name);
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

  source: function() {
    if (! this.isReflecteeFunction()) { throw "not a function"; }
    return this.reflectee().toString();
  },

  canHaveSlots: function() {
    return ! this.isReflecteePrimitive();
  },

  isReflecteeNull:      function() { return this.reflectee() === null;      },
  isReflecteeUndefined: function() { return this.reflectee() === undefined; },
  isReflecteeString:    function() { return typeof this.reflectee() === 'string';  },
  isReflecteeNumber:    function() { return typeof this.reflectee() === 'number';  },
  isReflecteeBoolean:   function() { return typeof this.reflectee() === 'boolean'; },
  isReflecteePrimitive: function() { return ! (this.isReflecteeObject() || this.isReflecteeFunction()); },

  isReflecteeObject: function() {
    var o = this.reflectee();
    var t = typeof o;
    return t === 'object' && o !== null;
  },

  isReflecteeFunction: function() {
    return typeof(this.reflectee()) === 'function';
  },

  canHaveCreatorSlot: function() {
    // aaa - is this right?
    return this.isReflecteeObject() || this.isReflecteeFunction();
  },
  
  creatorSlot: function() {
    return this.hasAnnotation() ? this.annotation().creatorSlot : null;
  },
  
  setCreatorSlot: function(s) {
    this.annotation().creatorSlot = s;
  },

  hasAnnotation: function() {
    return (this.isReflecteeObject() || this.isReflecteeFunction()) && this.reflectee().hasOwnProperty("__annotation__");
  },

  annotation: function() {
    if (! this.hasAnnotation()) {
      return this.reflectee().__annotation__ = new Annotation();
    }
    return this.reflectee().__annotation__;
  },
});
