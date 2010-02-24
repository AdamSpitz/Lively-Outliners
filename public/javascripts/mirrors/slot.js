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

  copyTo: function(newMir) {
    newMir.setContentsAt(this.name(), this.contents());
    return newMir.slotAt(this.name());
  },

  remove: function() {
    this.mirror().removeSlotAt(this.name());
  },
});

AbstractSlot.subclass("ParentSlot", {
  name: function() { return "*parent*"; },
  
  contents: function( ) { return this._mirror.parent(); },
});
