ColumnMorph.subclass("OutlinerMorph", {
  initialize: function($super, m) {
    $super();
    this._mirror = m;

    this.sPadding = this.fPadding = 5;
    this.shape.roundEdgesBy(10);

    this.highlighter = new BooleanHolder(true).add_observer(function() {this.refillWithAppropriateColor();}.bind(this));
    this.beUnhighlighted();

    this.expander = new ExpanderMorph(this);

    this.titleLabel = createLabel("");
    this.titleLabel.getRefreshedText = function() {return m.inspect();};

    this.evaluatorButton = createButton("E", function(evt) {this.openEvaluator(evt);}.bind(this), 0);

    this.dismissButton = new WindowControlMorph(new Rectangle(0, 0, 22, 22), 3, Color.primary.yellow);
    this.dismissButton.relayToModel(this, {HelpText: "-DismissHelp", Trigger: "=removeFromWorld"});

    this.create_header_row();
    this.rejiggerTheLayout();
  },

  mirror: function() { return this._mirror; },

  // Optimization: create the panels lazily. Most will never be needed, and it's bad to make the user wait while we create dozens of them up front.
  // aaa: Can I create a general lazy thingamajig mechanism?
  get_slots_panel: function() { return this.slots_panel || (this.slots_panel = new ColumnMorph().beInvisible()); },

  create_header_row: function() {
    var r = this.headerRow = new RowMorph().beInvisible(); // aaa - put underscores in front of the instvars
    r.fPadding = 3;
    this.titleLabel.refreshText();
    r.replaceThingiesWith([this.expander, this.titleLabel, this.evaluatorButton, this.dismissButton]);
    this.addRow(r);
    return r;
  },


  // rejiggering the layout

  makingManyChangesDuring: function(f) {
    this.dontBotherRejiggeringTheLayoutUntilTheEndOf(f);
  },

  repositionStuff: function() { // aaa - can I have a well-known method name for this, too? and maybe find a way to generalize it, so this method can live up in RowOrColumnMorph?
    var op = this.slots_panel;
    if (op) {
      op.rejiggerTheLayout();
    }
    this.rejiggerTheLayout();
  },

  repositionStuffIncludingTheHeaderRow: function() { // aaa ditto
    var hr = this.headerRow;
    if (hr) {hr.rejiggerTheLayout();}
    this.repositionStuff();
  },


  // updating    // aaa - maybe make a standard method name ("updateAppearance" or something) for all this updating stuff

  updateEverything: function() {
    this.populateSlotsPanel();
    if (! this.world()) {return;}
    this.refillWithAppropriateColor();
    this.titleLabel.refreshText();
    this.rejiggerTheLayout();
  },


  // inspecting
  inspect: function() {return this.mirror().inspect();},


  // color

  calculateAppropriateFill: function() {
    var color = Color.neutral.gray.lighter();
    if (this.isHighlighted()) {color = color.lighter().lighter();}
    return defaultFillWithColor(color);
  },

  refillWithAppropriateColor: function() {
    this.setFill(this.calculateAppropriateFill());
  },

  beUnhighlighted: function() {        this.highlighter.setChecked(false); },
    beHighlighted: function() {        this.highlighter.setChecked(true ); },
    isHighlighted: function() { return this.highlighter. isChecked();      },



  // expanding and collapsing

  isExpanded: function() {return this.expander.isExpanded();},
      expand: function() {this.expander.expand  ();},
    collapse: function() {this.expander.collapse();},
  updateExpandedness: function() {
    if (! this.world()) {return;}
    this.dontBotherRejiggeringTheLayoutUntilTheEndOf(function() {
      var isExpanded = this.isExpanded();
      if (isExpanded && !this.wasAlreadyExpanded) {
        this.populateSlotsPanel();
        this.replaceThingiesWith([this.headerRow, this.get_slots_panel()]);
      } else if (!isExpanded && this.wasAlreadyExpanded) {
        this.replaceThingiesWith([this.headerRow]);
      }
      this.wasAlreadyExpanded = isExpanded;
      this.repositionStuff();
    }.bind(this));
  },


  // slot panels

  slotPanels: function() {
    if (! this._slotPanels) {
      this._slotPanels = new BloodyHashTable();
    }
    return this._slotPanels;
  },

  slotPanelFor: function(s) {
    return this.slotPanels().getOrIfAbsentPut(s.name(), function() {
      return new SlotMorph(s);
    }.bind(this));
  },

  populateSlotsPanel: function() {
    var op = this.get_slots_panel();
    op.dontBotherRejiggeringTheLayoutUntilTheEndOf(function() {
      var sps = [];
      this.mirror().eachSlot(function(s) { sps.push(this.slotPanelFor(s)); }.bind(this));
      sps.sort(function(sp1, sp2) {return sp1.slot().name() < sp2.slot().name() ? -1 : 1});
      op.replaceThingiesWith(sps);
      this.rejiggerTheLayout();
    }.bind(this));
  },


  // evaluators

  openEvaluator: function(evt) {
    var e = new EvaluatorMorph(this);
    this.addThingy(e);
    evt.hand.setKeyboardFocus(e.textMorph());
  },


  // adding and removing to/from the world

  ensureIsInWorld: function(p) {
    this.stopZoomingOuttaHere();
    var shallBeAdded = this.world() == null;
    if (shallBeAdded) {this.addToWorld(p);}
    return shallBeAdded;
  },

  ensureIsNotInWorld: function() {
    var shallBeRemoved = this.world() != null;
    if (shallBeRemoved) {this.removeFromWorld();}
    return shallBeRemoved;
  },

  addToWorld: function(p) {
    if (p) {
      WorldMorph.current().addMorphAt(this, p);
    } else {
      WorldMorph.current().addMorph(this);
    }
  },

  removeFromWorld: function() {
    this.startZoomingOuttaHere();
  },

  destinationForZoomingOuttaHere: function() { return WorldMorph.current().dock; },

  getDismissHelp: function() {return "Hide";}, // aaa - I don't think this works but I don't know why.


  // menu

  morphMenu: function(evt) {
    var menu = new MenuMorph([], this);
    menu.addSection([["add slot",     function(evt) { this.    addSlot(evt); }.bind(this)]]);
    menu.addSection([["create child", function(evt) { this.createChild(evt); }.bind(this)]]);
    return menu;
  },

  addSlot: function(evt) {
    var name = this.mirror().findUnusedSlotName("slot");
    this.mirror().reflectee()[name] = null;
    this.updateEverything();
    this.expand();
    this.slotPanelFor(this.mirror().slotAt(name)).labelMorph.beWritableAndSelectAll();
  },

  createChild: function(evt) {
    this.world().outlinerFor(this.mirror().createChild()).grabMe(evt);
  },


  // mouse events

  acceptsDropping: function(m) { // aaa - could this be generalized?
    return m.canBeDroppedOnOutliner;
  },

  justReceivedDrop: function(m) {
    m.wasJustDroppedOnOutliner(this);
  },

  onMouseOver: function(evt) {
    if (evt.hand.submorphs.find(function(m) {return this.morphToGrabOrReceiveDroppingMorph(evt, m);}.bind(this))) {
      this.beHighlighted();
    }
  },

  onMouseOut: function(evt) {
    this.beUnhighlighted();
  },

  handlesMouseDown: function(evt) { return true; },

  onMouseDown: function(evt) {
    if (evt.isRightMouseButton()) {
      this.showMorphMenu(evt);
      return true;
    }
    return false;
  },
});
Object.extend(OutlinerMorph.prototype, CanHaveArrowsAttachedToIt);

WorldMorph.addMethods({
  morphMenu: function(evt) {
    var menu = new MenuMorph([], this);
    menu.addItem(["create new object", function(evt) {
      this.outlinerFor(new Mirror({})).grabMe(evt);
    }]);

    if (debugMode) {
      menu.addSection([
        periodicArrowUpdatingProcess.isRunning() ? [ "stop updating arrows", function() {periodicArrowUpdatingProcess.stop();}]
                                                 : ["start updating arrows", function() {periodicArrowUpdatingProcess.ensureRunning();}],

        ["create new weirdo test object", function(evt) {
          var o = {anObject: {}, anArray: ['zero', 1, 'two'], aNull: null, fortyTwo: 42, aString: 'here is a string', aBoolean: true, aFunction: function(a, b) {argleBargle();}};
          this.outlinerFor(new Mirror(o)).grabMe(evt);
        }]
      ]);
    }

    return menu;
  },

  outliners: function() {
    if (! this._outliners) {
      this._outliners = new BloodyHashTable();
    }
    return this._outliners;
  },

  existingOutlinerFor: function(mir) {
    return this.outliners().get(mir);
  },

  outlinerFor: function(mir) {
    return this.outliners().getOrIfAbsentPut(mir, function() {return new OutlinerMorph(mir);});
  },


  // dropping stuff

  acceptsDropping: function(m) {
    return m.canBeDroppedOnWorld;
  },

  justReceivedDrop: function(m) {
    if (m.wasJustDroppedOnWorld !== undefined) { m.wasJustDroppedOnWorld(this); }
  },
});

var overlays = [];

var allArrows = [];

function eachArrowThatShouldBeUpdated(f) {
  allArrows.each(function(a) {if (!a.noLongerNeedsToBeUpdated) {f(a);}});
}

ArrowMorph.subclass("SlotContentsPointerArrow", {
  initialize: function($super, slot, fep) {
    this._slot = slot;
    this._fixedEndpoint = fep;
    $super();
    this.initializeUI();
    allArrows.push(this);
  },

  createEndpoints: function() {
    this.endpoint1 = this._fixedEndpoint;
    this.endpoint2 = new ArrowEndpoint(this._slot, this);
  },

  noLongerNeedsToBeVisible: function() {
    this.noLongerNeedsToBeUpdated = true;
    this.remove();
  },

  needsToBeVisible: function() {
    this.noLongerNeedsToBeUpdated = false;
  },

  rankAmongArrowsWithSameEndpoints: function() {return 0;},
});



TwoModeTextMorph.subclass("SlotNameMorph", {
  initialize: function($super, slot) {
    this._slot = slot;
    $super(pt(5, 10).extent(pt(140, 20)), slot.name());
    // aaa - taken out, fix it the proper way: if (this.isReadOnly) {this.ignoreEvents();}
    this.extraMenuItemAdders = [];
    this.normalBorderWidth = 1;
    this.setBorderColor(Color.black);
    this.setFill(null);
    // aaa do we need this for outliners? this._slot.notifier.add_observer(function() {this.updateAppearance();}.bind(this));
    this.updateAppearance();
    this.normalBorderWidth = 0;
    this.nameOfEditCommand = "rename";
    this.extraMenuItemAdders.push(function(menu, evt) { this.addEditingMenuItemsTo(menu, evt); }.bind(this));
  },

  slot: function() {return this._slot;},
  inspect:  function() {return this.slot().name();},

  outliner: function() {
    return WorldMorph.current().existingOutlinerFor(this.slot().mirror());
  },

  // aaa onMouseDown: function(evt) { return false; },  // don't allow selection

  canBecomeWritable: function() { return true; },

  updateAppearance: function() {
    this.updateLabel();
  },

  updateLabel: function() {
    if (! this.isInWritableMode) {
      var newText = this.slot().name();
      if (newText != this.getText()) {
        this.setText(newText);
      }
    }
  },

  morphMenu: function(evt) {
    var menu = new MenuMorph([], this);
    if (!this.isInWritableMode) { // aaa is this right for outliners?
      this.extraMenuItemAdders.each(function(mia) {mia(menu, evt);});
    }
    return menu;
  },

  returnKeyShouldAccept: function() { return true; },

  getSavedText: function() {
    return this.slot().name();
  },

  setSavedText: function(text) {
    if (text !== this.getSavedText()) {
      this.slot().holder().renameSlot(this.slot().name(), text);
      this.outliner().updateEverything();
    }
  },

  captureMouseEvent: function($super, evt, hasFocus) {
    if (evt.type == "MouseDown" && !this.isInWritableMode) {return false;}
    return $super(evt, hasFocus);
  },
});

TwoModeTextMorph.subclass("MethodSourceMorph", {
  initialize: function($super, slot) {
    this._slot = slot;
    $super(pt(5, 10).extent(pt(140, 80)), slot.contents().source());
    // aaa - taken out, fix it the proper way: if (this.isReadOnly) {this.ignoreEvents();}
    this.extraMenuItemAdders = [];
    this.normalBorderWidth = 1;
    this.setBorderColor(Color.black);
    this.closeDnD();
    this.setFill(null);
    // aaa do we need this for outliners? this.slot().notifier.add_observer(function() {this.updateAppearance();}.bind(this));
    this.updateAppearance();
    this.normalBorderWidth = 0;
    this.nameOfEditCommand = "edit source";
    this.extraMenuItemAdders.push(function(menu, evt) { this.addEditingMenuItemsTo(menu, evt); }.bind(this));
  },

  slot: function() {return this._slot;},
  inspect:  function() {return this.slot().name() + " source";},

  outliner: function() {
    return WorldMorph.current().existingOutlinerFor(this.slot().mirror());
  },

  // aaa onMouseDown: function(evt) { return false; },  // don't allow selection

  canBecomeWritable: function() { return true; },

  updateAppearance: function() {
    this.updateLabel();
  },

  updateLabel: function() {
    if (! this.isInWritableMode) {
      var newText = this.slot().contents().source();
      if (newText != this.getText()) {
        this.setText(newText);
      }
    }
  },

  morphMenu: function(evt) {
    var menu = new MenuMorph([], this);
    if (!this.isInWritableMode) { // aaa is this right for outliners?
      this.extraMenuItemAdders.each(function(mia) {mia(menu, evt);});
    }
    return menu;
  },

  returnKeyShouldAccept: function() { return false; },

  getSavedText: function() {
    return this.slot().contents().source();
  },

  setSavedText: function(text) {
    if (text !== this.getSavedText()) {
      var newContents = new Mirror(eval("(" + text + ")"));
      this.slot().setContents(newContents);
      this.outliner().updateEverything();
    }
  },

  captureMouseEvent: function($super, evt, hasFocus) {
    if (evt.type == "MouseDown" && !this.isInWritableMode) {return false;}
    return $super(evt, hasFocus);
  },
});


ColumnMorph.subclass("SlotMorph", {
  initialize: function($super, slot) {
    $super();
    this.sPadding = 3;
    this.fPadding = 3;
    this._slot = slot;
    this.setFill(defaultFillWithColor(Color.gray));
    this.setBorderWidth(1);
    this.setBorderColor(Color.black);
    this.beUngrabbable();
    this.labelMorph = new SlotNameMorph(slot);

    this.signatureRow = new RowMorph().beInvisible();

    if (slot.isMethod()) {
      this.signatureRow.addThingies([this.labelMorph, this.sourceButton()]);
    } else {
      this.signatureRow.addThingies([this.labelMorph, this.contentsPointer()]);
    }

    this.addRow(this.signatureRow);
  },

  contentsPointer: function() {
    var m = this._contentsPointer;
    if (m) { return m; }
    var slot = this.slot();
    var arrow;
    m = this._contentsPointer = this.createButton(function() {
      if (arrow.noLongerNeedsToBeUpdated) {
        WorldMorph.current().outlinerFor(slot.contents()).ensureIsInWorld(m.worldPoint(pt(150,0)));
        arrow.needsToBeVisible();
      } else {
        arrow.noLongerNeedsToBeVisible();
      }
    });
    arrow = new SlotContentsPointerArrow(slot, m);
    arrow.noLongerNeedsToBeUpdated = true;

    m.determineWhichMorphToAttachTo = function() {return true;};
    m.attachToTheRightPlace = function() {};
    m.noLongerNeedsToBeVisibleAsArrowEndpoint = function() {};
    m.relativeLineEndpoint = pt(70,10);
    m.setShapeToLookLikeACircle = function() {};

    return m;
  },

  sourceButton: function() {
    var m = this._sourceButton;
    if (m) { return m; }
    var slot = this.slot();
    m = this._sourceButton = this.createButton(function() {
      this.toggleSource();
    }.bind(this));

    return m;
  },

  createButton: function(func) {
    var m = new ButtonMorph(pt(0,0).extent(pt(10,10)));
    
    m.connectModel({model: {Value: null, getValue: function() {return this.Value;}, setValue: function(v) {this.Value = v; if (!v) {func();}}}, setValue: "setValue", getValue: "getValue"});
    return m;
  },

  sourceMorph: function() {
    var m = this._sourceMorph;
    if (m) { return m; }
    m = this._sourceMorph = new MethodSourceMorph(this.slot());
    return m;
  },

  toggleSource: function() {
    if (this.isSourceShowing()) {
      this.removeThingy(this.sourceMorph());
    } else {
      this.addThingy(this.sourceMorph());
    }
    this.owner.rejiggerTheLayout();
  },
  
  isSourceShowing: function() {
    return this._sourceMorph && this._sourceMorph.world();
  },

     slot: function() { return this._slot; },
  inspect: function() { return "a slot morph"; },

  outliner: function() {
    return WorldMorph.current().existingOutlinerFor(this.slot().mirror());
  },

  canBeDroppedOnOutliner: true,

  wasJustDroppedOnOutliner: function(outliner) {
    this.slot().copyTo(outliner.mirror());
    outliner.expand();
    this.remove();
    outliner.updateEverything();
  },

  wasJustDroppedOnWorld: function(world) {
    var outliner = world.outlinerFor(this.slot().mirror());
    world.addMorphAt(outliner, this.position());
    outliner.expand();
    this.remove();
  },

  morphMenu: function(evt) {
    var menu = new MenuMorph([], this);

    this.labelMorph.addEditingMenuItemsTo(menu, evt);

    if (this.slot().copyTo) {
      menu.addItem(["copy", function(evt) {
        var newSlot = this.slot().copyTo(new Mirror({}));
        evt.hand.grabMorphWithoutAskingPermission(new SlotMorph(newSlot), evt);
      }]);
    }

    if (this.slot().remove) {
      menu.addItem(["move", function(evt) {
        var newSlot = this.slot().copyTo(new Mirror({}));
        this.slot().remove();
        evt.hand.grabMorphWithoutAskingPermission(new SlotMorph(newSlot), evt);
        this.outliner().updateEverything();
      }]);
    }

    return menu;
  },
});
