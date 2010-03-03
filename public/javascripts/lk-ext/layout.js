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

  rejiggerTheLayout: function(availableSpace) {
    // maybe nothing to do here
  },

  hasMinimumExtentActuallyChanged: function() {
    var old_cachedMinimumExtent = this._cachedMinimumExtent;
    delete this._cachedMinimumExtent;
    this.minimumExtent();
    return ! (old_cachedMinimumExtent && old_cachedMinimumExtent.eqPt(this._cachedMinimumExtent));
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
  },

});
