Object.subclass("Slot", {
  initialize: function(n, m) {
    this._name = n;
    this._mirror = m;
  },

    name: function() { return this._name;   },
  mirror: function() { return this._mirror; },
  holder: function() { return this._mirror; },

     contents: function( ) { return this._mirror.   contentsAt(this._name   ); },
  setContents: function(m) { return this._mirror.setContentsAt(this._name, m); },

  copyTo: function(newMir) {
    newMir.setContentsAt(this.name(), this.contents());
    return newMir.slotAt(this.name());
  },

  remove: function() {
    this.mirror().removeSlotAt(this._name);
  },
});
