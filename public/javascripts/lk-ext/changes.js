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

PasteUpMorph.addMethods({
    onMouseDown: function PasteUpMorph$onMouseDown($super, evt) {  //default behavior is to grab a submorph
        $super(evt);
        var m = this.morphToReceiveEvent(evt, null, true); // Modified to checkForDnD -- Adam, August 2008
        if (Config.usePieMenus) {
                if (m.handlesMouseDown(evt)) return false;
                m.showPieMenu(evt, m);
                return true;
        }
        if (m == null) {
          if (evt.isLeftMouseButtonDown()) { // Added the isLeftMouseButtonDown check, 'cause I like it better that way. -- Adam, Jan. 2009
            this.makeSelection(evt);
            return true;
          } else {
            return false;
          }
        } else if (!evt.isForContextMenu() && !evt.isForMorphMenu()) { // Changed from a simple isCommandKey check. -- Adam, Jan. 2009
            if (m === this.world()) {
                this.makeSelection(evt);
                return true;
            } else if (m.handlesMouseDown(evt)) return false;
        }
        evt.hand.grabMorph(m, evt);
        return true;
    },
});

Morph.addMethods({
    globalBoundsNotIncludingStickouts: function() {
      return this.getGlobalTransform().transformRectToRect(this.shape.bounds());
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

HandMorph.addMethods({
    dropMorphsOn: function(receiver) {
        if (receiver !== this.world()) this.unbundleCarriedSelection();
        if (this.logDnD) console.log("%s dropping %s on %s", this, this.topSubmorph(), receiver);
        this.carriedMorphsDo( function(m) {
            m.dropMeOnMorph(receiver);
            this.showAsUngrabbed(m);
            receiver.justReceivedDrop(m); // Added by Adam
        });
        this.removeAllMorphs(); // remove any shadows or halos
    },

    // Copied-and-pasted the bottom half of grabMorph. Needed for
    // stuff that should be able to be explicitly grabbed, but
    // not through the default "just click to pick it up" mechanism. -- Adam
    grabMorphWithoutAskingPermission: function(grabbedMorph, evt) {
        if (this.keyboardFocus && grabbedMorph !== this.keyboardFocus) {
            this.keyboardFocus.relinquishKeyboardFocus(this);
        }
        // console.log('grabbing %s', grabbedMorph);
        // Save info for cancelling grab or drop [also need indexInOwner?]
        // But for now we simply drop on world, so this isn't needed
        this.grabInfo = [grabbedMorph.owner, grabbedMorph.position()];
        if (this.logDnD) console.log('%s grabbing %s', this, grabbedMorph);
        this.addMorphAsGrabbed(grabbedMorph);
        // grabbedMorph.updateOwner();
        this.changed(); //for drop shadow
    },

    grabMorph: function(grabbedMorph, evt) {
      if (!evt) {logStack(); alert("no evt! aaa");}
        if (evt.isShiftDown() || (grabbedMorph.owner && grabbedMorph.owner.copySubmorphsOnGrab == true)) {
            if (!grabbedMorph.okToDuplicate()) return;
            grabbedMorph.copyToHand(this);
            return;
        }
        if (evt.isForMorphMenu()) {
            grabbedMorph.showMorphMenu(evt);
            return;
        }
        if (evt.isForContextMenu()) { // Changed from a simple isCommandKey check. -- Adam, Jan. 2009
            grabbedMorph.showContextMenu(evt);
            return;
        }
        // Give grabbed morph a chance to, eg, spawn a copy or other referent
        grabbedMorph = grabbedMorph.okToBeGrabbedBy(evt);
        if (!grabbedMorph) return;

        if (grabbedMorph.owner && !grabbedMorph.owner.openForDragAndDrop) return;

        if (this.keyboardFocus && grabbedMorph !== this.keyboardFocus) {
            this.keyboardFocus.relinquishKeyboardFocus(this);
        }
        // console.log('grabbing %s', grabbedMorph);
        // Save info for cancelling grab or drop [also need indexInOwner?]
        // But for now we simply drop on world, so this isn't needed
        this.grabInfo = [grabbedMorph.owner, grabbedMorph.position()];
        if (this.logDnD) console.log('%s grabbing %s', this, grabbedMorph);
        this.addMorphAsGrabbed(grabbedMorph);
        // grabbedMorph.updateOwner();
        this.changed(); //for drop shadow
    }
});

TextMorph.addMethods({
  getText: function()  {return this.textString;},
  setText: function(t) {if (this.textString != t) {this.textString = t; this.layoutChanged(); this.changed();}},

  // Just wondering whether I can set a TextMorph to be bold/italic and have it stay that way no matter what text I give it.
  setEmphasis: function(emph) {
    var txt = new lively.Text.Text(this.textString, this.textStyle);
    txt.emphasize(emph, 0, this.textString.length);
    this.textStyle = txt.style;
    this.composeAfterEdits();
  },
});
