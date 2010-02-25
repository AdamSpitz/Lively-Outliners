Object.extend(Number.prototype, {
  closerToZeroBy: function(n) {
    if (this < 0) {
      return (this > -n) ? 0 : this + n;
    } else {
      return (this <  n) ? 0 : this - n;
    }
  },
});

Object.extend(Point.prototype, {
  closerToZeroBy: function(p) {
    return new Point(this.x.closerToZeroBy(p.x), this.y.closerToZeroBy(p.y));
  },

  unitVector: function() {
    var r = this.r();
    if (r == 0) {return null;}
    return this.scaleBy(1.0 / r);
  },

  scaleToLength: function(n) {
    return this.unitVector().scaleBy(n);
  },

  perpendicularVector: function() {
    return new Point(-this.y, this.x);
  },

  minMaxPt: function(pMin, pMax) {
    return new Point(Math.max(Math.min(this.x,pMin.x), pMax.x), Math.max(Math.min(this.y,pMin.y), pMax.y));
  },

  destructively_addXY: function(dx, dy) {this.x += dx; this.y += dy; return this;},
  destructively_addPt: function(p) {return this.destructively_addXY(p.x, p.y);},
  destructively_scaleBy: function(scale) {this.x *= scale; this.y *= scale; return this;},
  destructively_minPt: function(p) {this.x = Math.min(this.x,p.x); this.y = Math.min(this.y,p.y); return this;},
  destructively_maxPt: function(p) {this.x = Math.max(this.x,p.x); this.y = Math.max(this.y,p.y); return this;},
  destructively_closerToZeroBy: function(p) {this.x = this.x.closerToZeroBy(p.x); this.y = this.y.closerToZeroBy(p.y); return this;},

  // Optimization: don't create a new Point object in the process of calculating this.
  r: function() {
    var x = this.x;
    var y = this.y;
    return Math.sqrt(x*x + y*y);
  },
});

Object.extend(Rectangle.prototype, {
  area: function() {return this.width * this.height;},
});

Event.addMethods({
  preventDefault: function() {
    this.rawEvent.preventDefault();
    this.rawEvent.returnValue = false; // Added because I think it might help on Windows, though I'm really not sure. -- Adam, 2008
  },
});

Object.extend(Morph, {
  suppressAllHandlesForever: function() {
    Object.extend(Morph.prototype, {checkForControlPointNear: function(evt) {return false;}});
  },
});

Morph.addMethods({
    internalInitialize: function(rawNode, shouldAssign) {
        this.rawNode = rawNode;
        rawNode.aaa_morphThingy = this; // To get the context menu to work. I think we need to be able to get to the morph from the node. -- Adam, May 2008
        this.submorphs = [];
        this.owner = null;
        if (shouldAssign) {
            LivelyNS.setType(this.rawNode, this.getType());
            this.setId(this.newId());
        }
    },

    boundsNotIncludingStickouts: function() {
      // Copied from the regular bounds() method.
      return this.getLocalTransform().transformRectToRect(this.shape.bounds());
    },

    globalBoundsNotIncludingStickouts: function() {
      return this.getGlobalTransform().transformRectToRect(this.shape.bounds());
    },

    /* Upgrading LK. -- Dec. 2008
    setBounds: function(newRect) {
        var tl = newRect.topLeft();
        this.setPosition(tl);
        // Blecch. Let's see if this hack helps in the cases where there's no owner yet. -- Adam
        var rr = this.owner ? this.relativizeRect(newRect) : (this.origin ? newRect.translatedBy(this.origin.negated()) : newRect);
        this.shape.setBounds(rr); // FIXME some shapes don't support setFromRect

        if (this.clipPath) {
            console.log('clipped to new shape ' + this.shape);
            this.clipToShape();
        }
        this.adjustForNewBounds();
    }.wrap(Morph.onLayoutChange('shape')),
    */

    showMorphMenu: function(evt) {
      var menu = this.morphMenu(evt);
      if (menu == null) {return;} // Added by Adam, July 2008
      menu.openIn(this.world(), evt.point(), false, Object.inspect(this).truncate());
    },

    justReceivedDrop: function(m) {
      // children can override
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

  // aaa - I just use this a lot, so it's convenient to have a shortcut.
  setFillToDefaultWithColor: function(c) {
    this.setFill(new lively.paint.LinearGradient([new lively.paint.Stop(0, c),
                                                  new lively.paint.Stop(1, c.lighter())],
                                                 lively.paint.LinearGradient.SouthNorth));
  },

  setHelpText: function ( newText ) {
    this.getHelpText = function() {return newText;};
  },

  grabMe: function(evt) {
    evt.hand.grabMorph(this, evt);
  },


  // zooming around and scaling

  startZoomingOuttaHere: function() {
    if (!this.zoomerProcess) {
      // I don't like the destinationMorph. Let's just zoom them off to the top right.   var destinationMorph = this.destinationForZoomingOuttaHere();
      var zoomer = new Zoomer(this, pt(WorldMorph.current().getExtent().x + 300, -300), this.doneZoomingOuttaHere.bind(this));
      // This scaling thing isn't working nicely:   var scaler = new Scaler(this, destinationMorph.getExtent(), zoomer.estimatedNumberOfSteps(), function() {});
      this.zoomerProcess = new PeriodicalExecuter(function(pe) {
        zoomer.doOneStep(pe);
        // scaler.doOneStep(pe);
      }, 0.1);
    }
  },

  stopZoomingOuttaHere: function() {
    if (this.zoomerProcess != null) {
      this.zoomerProcess.stop();
      this.zoomerProcess = null;
    }
  },

  doneZoomingOuttaHere: function() {
    this.stopZoomingOuttaHere();
    this.remove();
  },

  smoothlyScaleBackToNormalSize: function() {
    if (Math.abs(1.0 - this.getScale()) > 0.01) {
      var scaler = new Scaler(this, this.getExtent(), 10, function() {this.setScale(1.0);}.bind(this));
      new PeriodicalExecuter(function(pe) {
        try {
          scaler.doOneStep(pe);
        } catch (e) {
          logError(e, "smoothlyScaleBackToNormalSize()");
        }
      }, 0.1);
    }
  },

});

ButtonMorph.addMethods({
  setToggle: function(b) {this.toggle = b;}, // I'm not sure why they took this method out. -- Adam, Jan. 2009
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

/* aaa Upgrading LK, and this old code doesn't work. -- Adam, Dec. 2008
if (UserAgent.canExtendBrowserObjects) Object.extend(Global.document, {
    oncontextmenu: function(evt) {
      alert("target: " + evt.target + ", target.parentNode: " + evt.target.parentNode + ", target.parentNode.aaa_morphThingy: " + evt.target.parentNode.aaa_morphThingy);
        var targetMorph = evt.target.parentNode.aaa_morphThingy; // target is probably shape (change me if pointer-events changes for shapes) // aaa_morphThingy added by Adam, not sure how the original could possibly have worked
        if ((targetMorph instanceof Morph)
          // Commented out by Adam - why was this ever in here?  && !(targetMorph instanceof WorldMorph)
           ) {
            evt.preventDefault();
            var topElement = targetMorph.canvas().parentNode;
            evt.mousePoint = pt(evt.pageX - (topElement.offsetLeft || 0),
                                evt.pageY - (topElement.offsetTop  || 0) - 3);
            // evt.mousePoint = pt(evt.clientX, evt.clientY);

            // Added by Adam
            evt = new Event(evt); // I think showMorphMenu needs an LK-style Event. -- Adam, Dec. 2008
            if (evt.hand == null) {evt.hand = WorldMorph.current().firstHand();}

            targetMorph.showMorphMenu(evt);
        } // else get the system context menu
    }.logErrors('Context Menu Handler')
});
*/

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

WorldMorph.addMethods({
  onMouseDown: function($super, evt) {
      // Added by Adam, Feb. 2008, because sometimes it's useful
      // to have no keyboard focus (so that, for example, I can
      // hit Cmd-t to open a new tab)
      evt.hand.setKeyboardFocus(null);
      return $super(evt);
  },

  prompt: function(message, callback, defaultInput) {
    // aaa: LK actually has a prompt dialog thing, except it seems (as of Feb. 2009) to be broken.
    // I doubt it's hard to fix, but for now I don't wanna get distracted by it. -- Adam
    callback.call(Global, window.prompt(message, defaultInput));
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

    /* Upgrading LK. -- Dec. 2008
    // Make balloon help work. -- Adam, August 2008
    onMouseDown: function(evt) {
        this.hideHelp(); // Added by Adam, August 2008

        this.requestKeyboardFocus(evt.hand);
        var inc = this.getSliderExtent();
        var newValue = this.getValue();

        var delta = this.localize(evt.mousePoint).subPt(this.slider.bounds().center());
        if (this.vertical() ? delta.y > 0 : delta.x > 0) newValue += inc;
        else newValue -= inc;

        if (isNaN(newValue)) newValue = 0;
        this.setScaledValue(this.clipValue(newValue));
        this.adjustForNewBounds();
    },
    */
});

TextMorph.addMethods({
    /* aaa - Commented out while upgrading LK; is it still necessary? -- Dec. 2008
    initialize: function($super, rect, textString) {
        this.textString = textString || "";
        $super(rect, "rect");
        // KP: note layoutChanged will be called on addition to the tree
        // DI: ... and yet this seems necessary!
        this.layoutChanged();
        this.rawTextNode.aaa_morphThingy = this; // Added by Adam to get context menus to work, July 2008
        return this;
    },
    */

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
});

TextMorph.subclass("TwoModeTextMorph", {
  initialize: function($super, rect, textString, modelPlugSpec) {
    $super(rect, textString);
    this.dontNotifyUntilTheActualModelChanges = true;
    this.connectModel(modelPlugSpec || {model: this, getText: "getSavedText", setText: "setSavedText"});
    this.beUnwritable();
    this.setSavedText(textString);
    return this;
  },

  getSavedText: function( )  {
    return this.savedTextString;
  },

  setSavedText: function(t)  {
    this.savedTextString = t;
    if (this.notifier != null) {this.notifier.notify_all_observers();}
  },

  setTextString: function($super, replacement, delayComposition, justMoreTyping) {
    var x = $super(replacement, delayComposition, justMoreTyping);
    var f = this.layoutUpdatingFunctionToCallAfterSettingTextString;
    if (f) {
      this.adjustForNewBounds(); // makes the focus halo look right   // aaa should probably be outside the conditional, or even in the Core code
      f();
    }
    return x;
  },

  beUnwritable: function() {
    this.acceptInput = false;
    this.setFill(this.backgroundColorWhenUnwritable || null);
    this.setWrapStyle(lively.Text.WrapStyle.Shrink);
    this.setNullSelectionAt(0);
    var w = this.world();
    if (w) {this.relinquishKeyboardFocus(w.firstHand());}
    this.changed();
    this.beUngrabbable();
    this.isInWritableMode = false;
    return this;
  },

  beWritable: function() {
    this.acceptInput = true;
    this.setFill(this.backgroundColorWhenWritable || Color.white);
    this.setWrapStyle(lively.Text.WrapStyle.Shrink);
    this.changed();
    this.beUngrabbable();
    this.isInWritableMode = true;
    return this;
  },

  onKeyDown: function($super, evt) {
    if (this.isInWritableMode && evt.getKeyCode() == Event.KEY_ESC) {
      this.cancelChanges();
      evt.stop();
      return;
    }
    $super(evt);
  },

  onKeyPress: function($super, evt) {
    if (this.isInWritableMode && evt.getKeyCode() == Event.KEY_ESC) {
      this.cancelChanges();
      evt.stop();
      return;
    }
    if (this.isInWritableMode && evt.getKeyCode() == Event.KEY_RETURN && (this.returnKeyShouldAccept() || evt.isAltDown() || evt.isCmdDown())) {
      this.acceptChanges();
      evt.stop();
      return;
    }
    return $super(evt);
  },

  changed: function($super) {
    if (this.isInWritableMode) {
      if (this.getText() == this.getSavedText()) {
        this.setBorderWidth(this.normalBorderWidth || 0);
      } else {
        this.setBorderColor(Color.red);
        this.setBorderWidth(this.borderWidthWhenModified || 2);
      }
    } else {
      this.setBorderWidth(this.normalBorderWidth || 0);
    }
    $super();
  },

  acceptChanges: function() {
    this.setSavedText(this.getText());
    this.beUnwritable();
  },

  cancelChanges: function() {
    this.setText(this.getSavedText());
    this.beUnwritable();
  },

  beWritableAndSelectAll: function(evt) {
    this.beWritable();
    this.requestKeyboardFocus(evt ? evt.hand : WorldMorph.current().firstHand());
    this.selectAll();
  },

  handlesMouseDown: function(evt) { return true; },

  onMouseDown: function($super, evt) {
    this.hideHelp();
    if (this.isInWritableMode) {
      return $super(evt);
    } else {
      return this.checkForDoubleClick(evt);
    }
  },

  canBecomeWritable: function() { return ! this.isReadOnly; },

  returnKeyShouldAccept: function() { return false; },

  onDoubleClick: function(evt) {
    if (this.canBecomeWritable()) {
      this.beWritable();
      this.onMouseDown(evt);
    }
  },

  morphMenu: function(evt) {
    var menu = new MenuMorph([], this);
    this.addEditingMenuItemsTo(menu, evt);
    this.addOtherMenuItemsTo(menu, evt);
    return menu.items.size() > 0 ? menu : null;
  },

  addEditingMenuItemsTo: function(menu, evt) {
    if (this.isInWritableMode) {
      menu.addSection([["accept    [alt+enter]", this.acceptChanges.bind(this)],
                       ["cancel    [escape]"   , this.cancelChanges.bind(this)]])
    } else if (this.canBecomeWritable()) {
      menu.addSection([[this.nameOfEditCommand || "edit", function() {this.beWritableAndSelectAll(evt);}.bind(this)]])
    }
  },

  addOtherMenuItemsTo: function(menu, evt) {
    // override in children
  },
});

TwoModeTextMorph.subclass("LinkingTextMorph", {
  initialize: function($super, rect, textString, linker) {
    $super(rect, textString);
    this.linker = linker;
    this.colorForHighlightedLinkText = Color.red;
    this.colorForUnhighlightedLinkText = Color.blue;
    this.colorForEditableText = Color.black;
    this.beUnhighlighted();
    return this;
  },

  onMouseDown: function($super, evt) {
    this.hideHelp();
    if ((! this.isInWritableMode) && evt.isNormalMouseButton()) {
      this.followLink();
      return true;
    } else {
      return $super(evt);
    }
  },

  onMouseOver: function($super, evt) { if (! this.isInWritableMode) {this.beHighlighted();}   },
  onMouseOut:  function($super, evt) { if (! this.isInWritableMode) {this.beUnhighlighted();} },

  beHighlighted: function() {
    this.setTextColor(this.colorForHighlightedLinkText);
    this.layoutChanged();
  },

  beUnhighlighted: function() {
    this.setTextColor(this.isInWritableMode ? this.colorForEditableText : this.colorForUnhighlightedLinkText);
    this.layoutChanged();
  },

  beUnwritable: function($super) {
    $super();
    this.beUnhighlighted();
  },

  beWritable: function($super) {
    $super();
    this.beUnhighlighted();
  },

  inspect: function() { return "a link"; },

  followLink: function() {return this.linker.followLink(this);},

  addOtherMenuItemsTo: function(menu, evt) {
    menu.addSection([["open link", this.followLink.bind(this)]]);
  },

  returnKeyShouldAccept: function() { return true; },
});

function createTextField(readOnly, initialText, pos, extent) {
  pos = pos || pt(5, 10);
  extent = extent || pt(50,20);
  initialText = initialText || "";
  var tf = new TextMorph(pos.extent(extent), initialText);
  tf.acceptInput = !readOnly;
  tf.closeDnD();
  tf.setBorderWidth(0);
  tf.setFill(Color.white);
  return tf;
}

function createLabel(initialText, pos, extent) {
  pos = pos || pt(5, 10);
  extent = extent || pt(50,20);
  initialText = initialText || "";
  var tf = new TextMorph(pos.extent(extent), initialText);
  tf.acceptInput = false;
  tf.closeDnD();
  tf.beLabel();
  tf.morphMenu = function(evt) {return null;};
  return tf;
}

function createLabelledNode(text, n, helpText, container) {
  var m = (container || new RowMorph()).beInvisible();
  var lbl = createLabel(text + ": ");
  m.addThingies([lbl, n]);
  m.labelMorph = lbl;
  m.labelledMorph = n;
  m.inspect = function() {return "a labelled node(" + text + ")";};
  m.helpText = helpText;
  return m;
}

function createLabelledPanel(text, helpText) {
  var controls = new ColumnMorph();
  controls.setFill(null);
  controls.beUngrabbable();
  controls.inspect = function() {return text + " panel controls";};
  return createLabelledNode(text, controls, helpText, new ColumnMorph());
}

function createButton(text, f, padding) {
  var label = createLabel(text);
  var p = (padding != null) ? padding : 5;
  var b = new ButtonMorph(pt(0,0).extent(label.bounds().extent().addXY(p * 2, p * 2)));
  b.addMorphAt(label, pt(p, p));
  b.connectModel({model: {Value: null, getValue: function() {return this.Value;}, setValue: function(v) {this.Value = v; if (!v) {f(createFakeEvent());}}}, setValue: "setValue", getValue: "getValue"});
  return b;
}

function createTextBoxWithButton(buttonText, textBoxText, f) {
  var m = new RowMorph();
  m.sPadding = 0;
  m.fPadding = 0;
  m.setFill(Color.white);
  m.textBox = createTextField(false, textBoxText || "");
  m.addThingies([m.textBox, createButton(buttonText, function() {f(m.textBox.getText());})]);
  m.inspect = function() {return "a text box with button(" + buttonText + ")";};
  return m;
}

function createCheckBoxWithImage(imageURL, size) {
  var image = new ImageMorph(size.extentAsRectangle(), imageURL);
  image.setFill(null);
  var button = new CheckBoxMorph(size, image);
  button.setFill(null);
  return button;
}

function createFakeEvent() {
  return {
    hand: WorldMorph.current().hands[0],
    isShiftDown: Functions.False,
    isForContextMenu: Functions.False,
  };
}

ButtonMorph.subclass("CheckBoxMorph", {
  initialize: function($super, extent, m) {
    if (extent == null) {extent = pt(15,15);}
    this.checkedMorph = m || this.createXShapedMorph(extent);
    this.checkedMorph.handlesMouseDown = function() { return true; };
    this.checkedMorph.relayMouseEvents(this, {onMouseDown: "onMouseDown", onMouseMove: "onMouseMove", onMouseUp: "onMouseUp"});
    $super(pt(0,0).extent(extent));
    this.setToggle(true);
    this.setFill(Color.white);
    var model = new BooleanHolder();
    this.connectModel({model: model, getValue: "isChecked", setValue: "setChecked"});
    this.notifier = model.notifier;

    this.updateView("all", null);
    return this;
  },

  createXShapedMorph: function(extent) {
    var x = createLabel("X", pt(0,0), extent);
    // aaa: No longer works now that we've upgraded LK: x.setInset(pt(4,1));
    return x;
  },

  isChecked: function() {return this.getModel().getValue();},
  setChecked: function(b) {return this.getModel().setValue(b);},

  toggleCheckBoxAppearance: function(v) {
    if (v) {
      if (this.checkedMorph.owner !== this) {
        this.addMorph(this.checkedMorph);
      }
    } else {
      if (this.checkedMorph.owner == this) {
        this.removeMorph(this.checkedMorph);
      }
    }
  },

  changeAppearanceFor: function(v) {
    this.toggleCheckBoxAppearance(v);
  },
});


Morph.subclass("RowOrColumnMorph", {
  initialize: function($super, d) {
    this.direction = d;
    this.sPadding = 10;
    this.fPadding = 10;
    this.rejiggerer = new BatcherUpper(this.rejiggerTheLayout.bind(this));
    $super(new lively.scene.Rectangle(pt(0, 0).extent(pt(10, 10))));
    return this;
  },

  rejiggerTheLayout: function() {
    if (this.rejiggerer.should_not_bother_yet()) {return;}

    this.eachThingy(function(m) {m.bounds();});

    var direction = this.direction;
    var sPadding = this.sPadding;
    var fPadding = this.fPadding;

    var maxSideways = direction.externallySpecifiedFreeSpaceSideways(this) || sPadding + sPadding;
    this.eachThingy(function(m) {
      var s = direction.sidewaysDimensionOfRect(m.bounds()) + sPadding + sPadding;
      maxSideways = (maxSideways >= s) ? maxSideways : s;
    });

    var name = this.name;
    var forward = fPadding;
    this.eachThingy(function(m) {
      var f = direction.forwardDimensionOfRect(m.bounds());
      direction.specifyFreeSpaceSideways(m, maxSideways - sPadding - sPadding);
      var p = direction.point(forward, sPadding);
      m.setPosition(p);
      if (f != 0) {forward += f + fPadding;}
    }.bind(this));

    var newExtent = direction.point(forward, maxSideways);
    var shapeBounds = this.shape.bounds();
    if (! newExtent.eqPt(shapeBounds.extent())) {
      var b = shapeBounds.topLeft().addPt(this.origin).extent(newExtent.scaleBy(this.getScale()));
      this.setBounds(b);
    }
  },

  dontBotherRejiggeringTheLayoutUntilTheEndOf: function(f) {
    this.rejiggerer.dont_bother_until_the_end_of(f);
  },

     addThingy: function(m) {this.   addMorph(m); this.rejiggerTheLayout();},
  removeThingy: function(m) {this.removeMorph(m); this.rejiggerTheLayout();},

  addThingies: function(ms) {
    this.dontBotherRejiggeringTheLayoutUntilTheEndOf(function() {
      for (var i = 0, n = ms.length; i < n; ++i) {
        this.addThingy(ms[i]);
      }
    }.bind(this));
  },

  replaceThingiesWith: function(ms) {
    this.dontBotherRejiggeringTheLayoutUntilTheEndOf(function() {
      this.removeAllThingies();
      this.addThingies(ms);
    }.bind(this));
  },

  eachThingy: function(f) {
    $A(this.submorphs).each(function(m) {
      if (! m.shouldNotBePartOfRowOrColumn) {f(m);}
    });
  },

  getThingies: function() {
    return $A(this.submorphs).reject(function(m) {return m.shouldNotBePartOfRowOrColumn;});
  },

  removeAllThingies: function() {
    return this.removeThingies(this.getThingies());
  },

  removeThingies: function(ms) {
    ms.each(function(m) {this.removeMorph(m);}.bind(this));
    this.rejiggerTheLayout();
    return ms;
  },

  beInvisible: function() {
    this.sPadding = 0;
    this.fPadding = 0;
    this.setFill(null);
    this.setBorderWidth(0);
    this.beUngrabbable();
    return this;
  },
});

RowOrColumnMorph.subclass("ColumnMorph", {
  initialize: function($super) {
    $super(VerticalDirection);
    return this;
  },
  addRow: function(m) {this.addThingy(m);},
});

RowOrColumnMorph.subclass("RowMorph", {
  initialize: function($super) {
    $super(HorizontalDirection);
    return this;
  },
  addColumn: function(m) {this.addThingy(m);},
});

var VerticalDirection = {
  externallySpecifiedFreeSpaceSideways: function(m) {return m.externallySpecifiedFreeWidth;},
  specifyFreeSpaceSideways: function(m, s) {m.externallySpecifiedFreeWidth = s;},
  forwardDimensionOfRect: function(r) {return r.height;},
  sidewaysDimensionOfRect: function(r) {return r.width;},
  forwardCoordinateOfPoint: function(p) {return p.y;},
  sidewaysCoordinateOfPoint: function(p) {return p.x;},
  rectWithSidewaysDimension: function(r, s) {return r.withWidth(s);},
  rectWithForwardDimension: function(r, f) {return r.withHeight(f);},
  positionAtForwardCoord: function(f) {return pt(0, f);},
  point: function(f, s) {return pt(s, f);},
};

var HorizontalDirection = {
  externallySpecifiedFreeSpaceSideways: function(m) {return m.externallySpecifiedFreeHeight;},
  specifyFreeSpaceSideways: function(m, s) {m.externallySpecifiedFreeHeight = s;},
  forwardDimensionOfRect: function(r) {return r.width;},
  sidewaysDimensionOfRect: function(r) {return r.height;},
  forwardCoordinateOfPoint: function(p) {return p.x;},
  sidewaysCoordinateOfPoint: function(p) {return p.y;},
  rectWithSidewaysDimension: function(r, s) {return r.withHeight(s);},
  rectWithForwardDimension: function(r, f) {return r.withWidth(f);},
  positionAtForwardCoord: function(f) {return pt(f, 0);},
  point: function(f, s) {return pt(f, s);},
};


ButtonMorph.subclass("ExpanderMorph", {
  initialize: function($super, expandee) {
    $super(pt(0, 0).extent(pt(12, 12)));
    this.setToggle(true);
    var model = new BooleanHolder(false);
    this.connectModel({model: model, getValue: "isChecked", setValue: "setChecked"});
    if (expandee) { model.notifier.add_observer(function() {this.updateExpandedness();}.bind(expandee)); }
    return this;
  },

  changeAppearanceFor: function($super, value) {
    var baseColor = Color.blue; // Not sure how the new LK style system works. -- Adam, Jan. 2009
    var vertices  = value ? [pt(0,0),pt(12,0),pt(6,12),pt(0,0)] : [pt(0,0),pt(12,6),pt(0,12),pt(0,0)];
    var direction = value ? lively.paint.LinearGradient.SouthNorth : lively.paint.LinearGradient.WestEast;
    var stops = [new lively.paint.Stop(0, baseColor          ),
                 new lively.paint.Stop(1, baseColor.lighter())];
    var gradient = new lively.paint.LinearGradient(stops, direction);
    var shape = new lively.scene.Polygon(vertices, Color.green, 1, Color.red); // I don't really understand what these colors do.
    this.setShape(shape);
    this.setFill(gradient);
    // $super(value); // Messes things up, I think. -- Adam, Jan. 2009
  },

  isExpanded: function() {return this.getModel().getValue();},
      expand: function() {if (!this.isExpanded()) {this.setModelValue("setValue", true ); this.updateView("all");}},
    collapse: function() {if ( this.isExpanded()) {this.setModelValue("setValue", false); this.updateView("all");}},

  /*
  onMouseOver: function(evt) {if (evt.hand.submorphs.size() == 0) {this.beHighlighted();}},
  onMouseOut:  function(evt) {this.beUnhighlighted();},

  beHighlighted: function() {},
  beUnhighlighted: function() {},
  */
});


Object.subclass("Zoomer", {
  initialize: function(morph, destinationPt, functionToCallWhenDone) {
    this.morph = morph;
    this.destinationPt = destinationPt;
    this.done = functionToCallWhenDone;
    this.originalPosition = morph.position();
    this.distancePerStep = 75.0;
    return this;
  },

  totalRemainingVector:   function() {return this.destinationPt.subPt(this.morph.position());},

  estimatedNumberOfSteps: function() {return Math.ceil(this.totalRemainingVector().r() / this.distancePerStep);},

  doOneStep: function(pe) {
    var totalRemainingVector = this.totalRemainingVector();
    var totalRemainingDistance = totalRemainingVector.r();
    if (totalRemainingDistance < 10) {
      pe.stop();
      this.done();
      return;
    }
    var stepVector = totalRemainingVector.scaleToLength(Math.min(totalRemainingDistance, this.distancePerStep));
    this.morph.translateBy(stepVector);
  },
});

Object.subclass("Scaler", {
  initialize: function(morph, targetSize, numberOfSteps, functionToCallWhenDone) {
    this.morph = morph;
    this.targetSize = targetSize;
    this.numberOfSteps = numberOfSteps;
    this.done = functionToCallWhenDone;
    this.scalingFactor = this.calculateScalingFactor();
    return this;
  },

  calculateScalingFactor: function() {
    var originalBounds = this.morph.bounds();
    var targetRatio = Math.min(this.targetSize.x / originalBounds.width, this.targetSize.y / originalBounds.height);
    var ratioForEachStep = Math.pow(targetRatio, 1.0 / this.numberOfSteps);
    return ratioForEachStep;
  },

  doOneStep: function(pe) {
    if (this.numberOfSteps <= 0) {
      pe.stop();
      this.done();
      return;
    }
    this.numberOfSteps -= 1;
    this.morph.scaleBy(this.scalingFactor);
  },
});


console.log('loaded morph_creation.js');
