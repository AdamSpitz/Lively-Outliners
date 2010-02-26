WorldMorph.addMethods({
  onMouseDown: function($super, evt) {
      // Added by Adam, Feb. 2008, because sometimes it's useful
      // to have no keyboard focus (so that, for example, I can
      // hit Cmd-t to open a new tab)
      evt.hand.setKeyboardFocus(null);
      return $super(evt);
  }
});

Object.extend(Morph, {
  suppressAllHandlesForever: function() {
    Object.extend(Morph.prototype, {checkForControlPointNear: function(evt) {return false;}});
  },
});

Morph.addMethods({
    globalBoundsNotIncludingStickouts: function() {
      return this.getGlobalTransform().transformRectToRect(this.shape.bounds());
    },

    showMorphMenu: function(evt) {
      var menu = this.morphMenu(evt);
      if (menu == null) {return;} // Added by Adam, July 2008
      menu.openIn(this.world(), evt.point(), false, Object.inspect(this).truncate());
    },

    checkForDoubleClick: function(evt) {
      var currentTime = new Date().getTime(); // Use evt.timeStamp? I just tried that and it didn't seem to work.
      if (this.timeOfMostRecentDoubleClickCheck != null && currentTime - this.timeOfMostRecentDoubleClickCheck < 400) { // aaa magic number
        this.timeOfMostRecentDoubleClickCheck = null;
        this.onDoubleClick(evt);
        return true;
      } else {
        this.timeOfMostRecentDoubleClickCheck = currentTime;
        return false;
      }
    },
});

MenuMorph.addMethods({
  addSection: function(newItems) {
    if (newItems.size() > 0) {
      if (this.items.size() > 0) {this.addLine();}
      newItems.each(function(item) {this.addItem(item);}.bind(this));
    }
  },
});
