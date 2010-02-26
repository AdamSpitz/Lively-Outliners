Object.subclass("AbstractSlot", {
  initialize: function(m) {
    this._mirror = m;
  },

  mirror: function() { return this._mirror; },
  holder: function() { return this._mirror; },
});

AbstractSlot.subclass("Slot", {
  initialize: function($super, n, m) {
    $super(m);
    this._name = n;
  },

  name: function() { return this._name; },

     contents: function( ) { return this._mirror.   contentsAt(this.name()   ); },
  setContents: function(m) { return this._mirror.setContentsAt(this.name(), m); },

  equals: function(s) {
    return this.name() === s.name() && this.mirror().equals(s.mirror());
  },

  toString: function() {
    return this.name() + " slot";
  },

  copyTo: function(newMir) {
    newMir.setContentsAt(this.name(), this.contents());
    return newMir.slotAt(this.name());
  },

  remove: function() {
    this.mirror().removeSlotAt(this.name());
  },

  isMethod: function() { return this.contents().isReflecteeFunction(); },

  rename: function(newName) {
    var oldName = this.name();
    if (oldName === newName) {return;}
    var contentsMir = this.contents();
    var o = this.holder().reflectee();
    if (  o.hasOwnProperty(newName)) { throw o + " already has a slot named " + newName; }
    if (! o.hasOwnProperty(oldName)) { throw o + " has no slot named "        + oldName; }
    var cs = contentsMir.creatorSlot();
    var isCreator = cs && cs.equals(this);
    var contents = o[oldName];
    delete o[oldName];
    o[newName] = contents;
    if (isCreator) {this.holder().slotAt(newName).beCreator();}
  },
  
  hasAnnotation: function() {
    return this.holder().hasAnnotation() && this.holder().annotation().slotAnnotations()[this.name()];
  },

  annotation: function() {
    var oa = this.holder().annotation();
    var sa = oa.slotAnnotations()[this.name()];
    if (sa) {return sa;}
    return oa.slotAnnotations()[this.name()] = new SlotAnnotation();
  },

  beCreator: function() {
    this.contents().setCreatorSlot(this);
  },

  module: function() {
    if (! this.hasAnnotation()) { return null; }
    return this.annotation().module;
  },

  setModule: function(m) {
    this.annotation().module = m;
  },
});

AbstractSlot.subclass("ParentSlot", {
  name: function() { return "*parent*"; },
  
     contents: function( ) { return this._mirror.parent(); },
  setContents: function(m) { return this._mirror.setParent(m); },

  isMethod: function() { return false; },
});
