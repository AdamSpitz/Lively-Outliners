// aaa - does LK already have a mechanism for this?

LayoutModes = {
 Rigid: {name: "rigid"},
 SpaceFill: {name: "space-fill"},
 ShrinkWrap: {name: "shrink-wrap"}
};

Morph.addMethods({
  minimumExtent: function() {
    // this.bounds(); // aaa - is this necessary?
    // aaa - meh, don't bother caching yet, I'm scared that I haven't done this right
    return this._cachedMinimumExtent = this.getExtent();
  },

  new_rejiggerTheLayout: function() {
    // maybe nothing to do here
  },

  minimumExtentChanged: function() {
    this._cachedMinimumExtent = null;
    this.minimumExtent();
    if (this.owner) {
      if (this.owner instanceof WorldMorph) {
        this.rejiggerTheLayoutIncludingSubmorphs();
      } else {
        this.owner.minimumExtentChanged();
      }
    }
  },
});
