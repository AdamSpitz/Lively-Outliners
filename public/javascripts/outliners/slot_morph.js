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
    this.shape.roundEdgesBy(4);
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

  wasJustDroppedOnOutliner: function(outliner) {
    this.slot().copyTo(outliner.mirror());
    outliner.expander().expand();
    this.remove();
    outliner.updateEverything();
  },

  wasJustDroppedOnWorld: function(world) {
    var outliner = world.outlinerFor(this.slot().mirror());
    world.addMorphAt(outliner, this.position());
    outliner.expander().expand();
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
