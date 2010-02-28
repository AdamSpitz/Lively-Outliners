// aaa - does LK already have a mechanism for this?
// aaa - Hey, look at that LayoutManager thing.

LayoutModes = {
 Rigid: {name: "rigid"},
 SpaceFill: {name: "space-fill"},
 ShrinkWrap: {name: "shrink-wrap"}
};


// aaa rename some of these methods
Morph.addMethods({
  minimumExtent: function() {
    // aaa - meh, don't bother caching yet, I'm scared that I haven't done this right
    return this._cachedMinimumExtent = this.getExtent();
  },

  new_rejiggerTheLayout: function(availableSpace) {
    // maybe nothing to do here
  },

  minimumExtentChanged: function() {
    var old_cachedMinimumExtent = this._cachedMinimumExtent;
    this._cachedMinimumExtent = null;
    this.minimumExtent();
    if (old_cachedMinimumExtent && old_cachedMinimumExtent.eqPt(this._cachedMinimumExtent)) { return; }
    var o = this.owner;
    if (!o || o instanceof WorldMorph || o instanceof HandMorph) {
      this.rejiggerTheLayoutIncludingSubmorphs();
    } else {
      o.minimumExtentChanged();
    }
  },

  rejiggerTheLayoutIncludingSubmorphs: function() {
    // console.log("Rejiggering the layout of " + this.inspect());
    this.minimumExtent();
    this.new_rejiggerTheLayout(pt(100000, 100000));
  },

});
