// aaa - does LK already have a mechanism for this?

LayoutModes = {
 Rigid: {name: "rigid"},
 SpaceFill: {name: "space-fill"},
 ShrinkWrap: {name: "shrink-wrap"}
};

Morph.addMethods({
  calculateMinimumExtent: function() {
    // this.bounds(); // aaa - is this necessary?
    return this._cachedMinimumExtent = this.getExtent();
  },

  new_rejiggerTheLayout: function() {
    // maybe nothing to do here
  }

});
