Morph.addMethods({
    justReceivedDrop: function(m) {
      // children can override
    },

    onMouseMove: function(evt, hasFocus) { //default behavior
        if (evt.mouseButtonPressed && this==evt.hand.mouseFocus && this.owner && this.owner.openForDragAndDrop && this.okToBeGrabbedBy(evt)) { // why does LK not by default check okToBeGrabbedBy(evt)? -- Adam
            this.moveBy(evt.mousePoint.subPt(evt.priorPoint));
        } // else this.checkForControlPointNear(evt);
        if (!evt.mouseButtonPressed) this.checkForControlPointNear(evt);
    },


    morphToGrabOrReceive: function(evt, droppingMorph, checkForDnD) {
        // If checkForDnD is false, return the morph to receive this mouse event (or null)
        // If checkForDnD is true, return the morph to grab from a mouse down event (or null)
        // If droppingMorph is not null, then check that this is a willing recipient (else null)

        if (!this.fullContainsWorldPoint(evt.mousePoint)) return null; // not contained anywhere
        // First check all the submorphs, front first
        for (var i = this.submorphs.length - 1; i >= 0; i--) {
            var hit = this.submorphs[i].morphToGrabOrReceive(evt, droppingMorph, checkForDnD);
            if (hit != null) {
                //console.log(this + ">>morphToGrabOrReceive hit");
                return hit;  // hit a submorph
            }
        }

        // Check if it's really in this morph (not just fullBounds)
        if (!this.containsWorldPoint(evt.mousePoint)) return null;

        // If no DnD check, then we have a hit (unless no handler in which case a miss)
        if (!checkForDnD) return this.mouseHandler ? this : null;

        // On drops, check that this is a willing recipient
        if (droppingMorph != null) {
            return this.acceptsDropping(droppingMorph) ? this : null;
        } else {
            // On grabs, can't pick up the world or morphs that handle mousedown
            // DI:  I think the world is adequately checked for now elsewhere
            // else return (!evt.isCommandKey() && this === this.world()) ? null : this;
            return this.okToBeGrabbedBy(evt) ? this : null; // Modified to check okToBeGrabbedBy(evt) -- Adam, August 2008
        }

    },

    beUngrabbable: function() {if (!this.old_okToBeGrabbedBy) {this.old_okToBeGrabbedBy = this.okToBeGrabbedBy; this.okToBeGrabbedBy = function(evt) {return null;};}},
    beGrabbable:   function() {if ( this.old_okToBeGrabbedBy) {this.okToBeGrabbedBy = this.old_okToBeGrabbedBy; this.old_okToBeGrabbedBy = null;}},

  setHelpText: function ( newText ) {
    this.getHelpText = function() {return newText;};
  },

  grabMe: function(evt) {
    // aaa - Can't seem to make the drop shadows come out right without messing up the way it looks when you grab something that's already in the world.
    //this.setPosition(evt.hand.position());
    evt.hand.grabMorph(this, evt);
    //this.setPosition(pt(0,0));
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

    // Copied-and-pasted the bottom half of grabMorph. Needed for TopicNames
    // and Occurrences - stuff that should be able to be explicitly grabbed,
    // but not through the default "just click to pick it up" mechanism. -- Adam
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
        if (evt.isForContextMenu()) { // Changed from a simple isCommandKey check. -- Adam, Jan. 2009
            grabbedMorph.showMorphMenu(evt);
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
    },

    shouldNotBePartOfRowOrColumn: true,
});

Event.addMethods({
  isNormalMouseButton: function() {return this.rawEvent.button == 0;},
  isRightMouseButton:  function() {return this.rawEvent.button == 2;},
  isForContextMenu:    function() {return this.isCommandKey() || this.isRightMouseButton();},
});

if (UserAgent.canExtendBrowserObjects) Object.extend(Global.document, {
    oncontextmenu: function(evt) {
      /* aaa - Was trying to get this to work after upgrading LK, but it doesn't yet. So gotta use Command-click for now. Or change grabMorph to check for the right mouse button?
      */
      evt = new Event(evt); // I think onMouseDown needs an LK-style Event. -- Adam, Dec. 2008
      if (evt.mousePoint == null) {evt.mousePoint = pt(evt.pageX, evt.pageY - 3);}
      if (evt.hand == null) {evt.hand = WorldMorph.current().firstHand();}
      WorldMorph.current().onMouseDown(evt);
      return false;  // So that the browser's context menu doesn't show up. -- Adam, Dec. 2008
    }.logErrors('Context Menu Handler')
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
          if (evt.isNormalMouseButton()) { // Added the isNormalMouseButton check, 'cause I like it better that way. -- Adam, Jan. 2009
            this.makeSelection(evt);
            return true;
          } else {
            return false;
          }
        } else if (!evt.isForContextMenu()) { // Changed from a simple isCommandKey check. -- Adam, Jan. 2009
            if (m === this.world()) {
                this.makeSelection(evt);
                return true;
            } else if (m.handlesMouseDown(evt)) return false;
        }
        evt.hand.grabMorph(m, evt);
        return true;
    },
});

SliderMorph.addMethods({

    sliderMoved: function(evt, slider) {
        if (this.isDisabled) return; // Added by Adam, August 2008

        if (!evt.mouseButtonPressed) return;

        // Compute the value from a new mouse point, and emit it
        var p = this.localize(evt.mousePoint).subPt(this.hitPoint);
        var bnds = this.shape.bounds();
        var ext = this.getSliderExtent();

        if (this.vertical()) { // more vertical...
            var elevPix = Math.max(ext*bnds.height,this.mss); // thickness of elevator in pixels
            var newValue = p.y / (bnds.height-elevPix);
        } else { // more horizontal...
            var elevPix = Math.max(ext*bnds.width,this.mss); // thickness of elevator in pixels
            var newValue = p.x / (bnds.width-elevPix);
        }

        if (isNaN(newValue)) newValue = 0;
        this.setScaledValue(this.clipValue(newValue));
        this.adjustForNewBounds();
    },

  beDisabled: function() {
    if (this.isDisabled) {return;}
    this.isDisabled = true;
    this.baseFillWhenEnabled = this.slider.getFill();
    this.slider.setFill(this.baseFillWhenDisabled != null ? this.baseFillWhenDisabled : Color.gray);
    this.adjustForNewBounds();
  },

  beEnabled: function() {
    if (!this.isDisabled) {return;}
    this.isDisabled = false;
    this.slider.setFill(this.baseFillWhenEnabled != null ? this.baseFillWhenEnabled : Color.blue);
    this.adjustForNewBounds();
  },
});

TextMorph.addMethods({
  getText: function()  {return this.textString;},
  setText: function(t) {if (this.textString != t) {this.textString = t; this.layoutChanged(); this.changed();}},

  // For compatibility with TwoModeTextMorphs.
  getSavedText: function()  {return this.getText( );},
  setSavedText: function(t) {return this.setText(t);},

  changed: function($super) {
    this.bounds(); // will force new bounds if layout changed
    $super();
    if (this.notifier != null && !this.dontNotifyUntilTheActualModelChanges) {this.notifier.notify_all_observers();} // Added by Adam, June 2008
  },

  selectAll: function() {this.isSelecting = true; return this.setSelectionRange(0, this.textString.length);},


    // Added by Adam, August 2008
    onMouseOver: function($super, evt) { this.showHelp(evt); return $super(evt); },
    onMouseOut:  function($super, evt) { this.hideHelp(   ); return $super(evt); },

    onMouseDown: function(evt) {
        this.hideHelp(); // Added by Adam, August 2008

        this.isSelecting = true;
        var charIx = this.charOfPoint(this.localize(evt.mousePoint));

        this.startSelection(charIx);
        this.requestKeyboardFocus(evt.hand);
        return true;
    },

  // Added by Adam, February 2010
  refreshText: function() {
    this.setText(this.getRefreshedText());
  },
});
