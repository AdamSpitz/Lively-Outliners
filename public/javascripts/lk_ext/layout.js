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
    var e = this.getExtent();
    this._cachedMinimumExtent = e;
    return e;
  },

  rejiggerTheLayout: function(availableSpace) {
    // maybe nothing to do here, or maybe resize this morph
    return this.getExtent();
  },

  hasMinimumExtentActuallyChanged: function() {
    var old_cachedMinimumExtent = this._cachedMinimumExtent;
    this._cachedMinimumExtent = null;
    var newMinimumExtent = this.minimumExtent();
    return ! (old_cachedMinimumExtent && old_cachedMinimumExtent.eqPt(newMinimumExtent));
  },

  // aaa - This method should probably be called something like minimumExtentMayHaveChanged.
  minimumExtentChanged: function() {
    if (! this.hasMinimumExtentActuallyChanged()) { return false; }
    this.forceLayoutRejiggering(true);
    return true;
  },

  forceLayoutRejiggering: function(isMinimumExtentKnownToHaveChanged) {
    this._layoutIsStillValid = false;

    var doesMyOwnerNeedToKnow = isMinimumExtentKnownToHaveChanged || this.hasMinimumExtentActuallyChanged();
    var o = this.owner;
    if (!o || o instanceof WorldMorph || o instanceof HandMorph) {
      this.rejiggerTheLayout(pt(100000, 100000));
      return;
    }
    if (doesMyOwnerNeedToKnow) { 
      var layoutRejiggeringHasBeenTriggeredHigherUp = o.minimumExtentChanged();
      if (layoutRejiggeringHasBeenTriggeredHigherUp) { return; }
    }
    if (this._spaceUsedLastTime) {
      this.rejiggerTheLayout(this._spaceUsedLastTime);
    } else {
      o.forceLayoutRejiggering();
    }
  }

});

TextMorph.addMethods({
  layoutChanged: function($super) {
    var r = $super();
    this.adjustForNewBounds();   // make the focus halo look right
    this.minimumExtentChanged(); // play nicely with my new layout system
    return r;
  }
});
