ColumnMorph.subclass("SlotMorph", {
  initialize: function($super, slot) {
    $super();
    this._slot = slot;
    this.sPadding = 0;
    this.fPadding = 0;
    this.horizontalLayoutMode = LayoutModes.SpaceFill;
    this.setFill(defaultFillWithColor(Color.gray));
    this.setBorderWidth(1);
    this.setBorderColor(Color.black);
    this.beUngrabbable();
    this.labelMorph = new SlotNameMorph(this);
    this.labelMorph.layoutUpdatingFunctionToCallAfterSettingTextString = function() {this.minimumExtentChanged();}.bind(this);

    this.signatureRow = new RowMorph().beInvisible();
    this.signatureRow.horizontalLayoutMode = LayoutModes.SpaceFill;

    var button = this.isMethodThatShouldBeShownAsPartOfTheBox() ? this.sourceButton() : this.contentsPointer();
    this.signatureRow.replaceThingiesWith([this.labelMorph, createSpacer(), button]);

    this.updateAppearance();
  },

  isMethodThatShouldBeShownAsPartOfTheBox: function() {
      if (! this.slot().isMethod()) { return false; }
      if (this.slot().contents().iterator('eachNonParentSlot').find(function(s) { return true; })) { return false; }
      return true;
  },

  contentsPointer: function() {
    var m = this._contentsPointer;
    if (m) { return m; }
    var slot = this.slot();
    var arrow;
    m = this._contentsPointer = createButton('D', function() {
      if (arrow.noLongerNeedsToBeUpdated) {
        var w = this.world();
        w.outlinerFor(slot.contents()).ensureIsInWorld(w, m.worldPoint(pt(150,0)));
        arrow.needsToBeVisible();
      } else {
        arrow.noLongerNeedsToBeVisible();
      }
    }.bind(this), 2);
    arrow = new SlotContentsPointerArrow(slot, m);
    arrow.noLongerNeedsToBeUpdated = true;

    m.determineWhichMorphToAttachTo = function() {return !!this.world();};
    m.attachToTheRightPlace = function() {};
    m.noLongerNeedsToBeVisibleAsArrowEndpoint = function() {};
    m.relativeLineEndpoint = pt(5, 5);
    m.setShapeToLookLikeACircle = function() {};

    return m;
  },

  sourceButton: function() {
    var m = this._sourceButton;
    if (m) { return m; }
    var slot = this.slot();
    m = this._sourceButton = createButton('M', function(evt) {
      this.toggleSource();
    }.bind(this), 2);

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
    m = this._sourceMorph = new MethodSourceMorph(this);
    m.layoutUpdatingFunctionToCallAfterSettingTextString = function() {this.minimumExtentChanged();}.bind(this);
    return m;
  },

  annotationMorph: function() {
    var m = this._annotationMorph;
    if (m) { return m; }
    m = this._annotationMorph = new SlotAnnotationMorph(this);
    return m;
  },

  toggleSource: function() {
    this._shouldShowSource = ! this._shouldShowSource;
    this.updateAppearance();
  },

  toggleAnnotation: function() {
    this._shouldShowAnnotation = ! this._shouldShowAnnotation;
    this.updateAppearance();
  },

     slot: function() { return this._slot; },
  inspect: function() { return "a slot morph"; },

  outliner: function() {
    return WorldMorph.current().existingOutlinerFor(this.slot().mirror());
  },

  updateAppearance: function() {
    this.labelMorph.updateAppearance();
    if (this._sourceMorph)     { this._sourceMorph    .updateAppearance(); }
    if (this._annotationMorph) { this._annotationMorph.updateAppearance(); }
    var rows = [this.signatureRow];
    if (this._shouldShowSource    ) { rows.push(this.    sourceMorph()); }
    if (this._shouldShowAnnotation) { rows.push(this.annotationMorph()); }
    this.replaceThingiesWith(rows);
  },

  wasJustDroppedOnOutliner: function(outliner) {
    this.slot().copyTo(outliner.mirror());
    outliner.expander().expand();
    this.remove();
    outliner.updateAppearance();
  },

  wasJustDroppedOnWorld: function(world) {
    var outliner = world.outlinerFor(this.slot().mirror());
    world.addMorphAt(outliner, this.position());
    outliner.expander().expand();
    this.remove();
  },

  setModule: function(m, evt) {
    this.slot().setModule(m);
    this.updateAppearance();
  },

  morphMenu: function(evt) {
    var menu = new MenuMorph([], this);

    this.labelMorph.addEditingMenuItemsTo(menu, evt);

    if (this.slot().copyTo) {
      menu.addItem(["copy", function(evt) {
        var newSlot = this.slot().copyTo(reflect({}));
        evt.hand.grabMorphWithoutAskingPermission(new SlotMorph(newSlot), evt);
      }.bind(this)]);
    }

    if (this.slot().remove) {
      menu.addItem(["move", function(evt) {
        var newSlot = this.slot().copyTo(reflect({}));
        this.slot().remove();
        evt.hand.grabMorphWithoutAskingPermission(new SlotMorph(newSlot), evt);
        this.outliner().updateAppearance();
      }.bind(this)]);
    }

    if (this.slot().beCreator && this.slot().contents().canHaveCreatorSlot()) {
      var cs = this.slot().contents().creatorSlot();
      if (!cs || ! cs.equals(this.slot())) {
        menu.addItem(["be creator", function(evt) {
          this.slot().beCreator();
          var contentsOutliner = this.world().existingOutlinerFor(this.slot().contents());
          if (contentsOutliner) contentsOutliner.updateAppearance();
          this.updateAppearance();
          this.outliner().updateAppearance();
        }.bind(this)]);
      }
    }

    if (this.slot().setModule) {
      menu.addItem(["set module...", function(evt) {
        var modulesMenu = new MenuMorph([], this);
        modulesMenu.addItem(["new module...", function(evt) {
          evt.hand.world().prompt("Module name?", function(name) {
            if (name) {
              if (lobby.modules[name]) {
                throw "There is already a module named " + name;
              }
              this.setModule(lobby.transporter.module.named(name), evt);
            }
          }.bind(this));
        }.bind(this)]);
        modulesMenu.addLine();
        lobby.transporter.module.eachModule(function(m) {
          modulesMenu.addItem([m.name(), function(evt) {
            this.setModule(m, evt);
          }.bind(this)]);
        }.bind(this));
        modulesMenu.openIn(this.world(), evt.point());
      }.bind(this)]);
    }

    menu.addItem([this._shouldShowAnnotation ? "hide annotation" : " show annotation", function(evt) {
      this.toggleAnnotation();
    }.bind(this)]);

    return menu;
  },
});

ArrowMorph.subclass("SlotContentsPointerArrow", {
  initialize: function($super, slot, fep) {
    this._slot = slot;
    this._fixedEndpoint = fep;
    $super();
    allArrows.push(this);
  },

  createEndpoints: function() {
    this.endpoint1 = this._fixedEndpoint;
    this.endpoint2 = new ArrowEndpoint(this._slot, this);
  },

  noLongerNeedsToBeVisible: function() {
    this.noLongerNeedsToBeUpdated = true;
    this.remove();
    this.endpoint2.remove();
  },

  needsToBeVisible: function() {
    this.noLongerNeedsToBeUpdated = false;
  },
});



TwoModeTextMorph.subclass("SlotNameMorph", {
  initialize: function($super, slotMorph) {
    this._slotMorph = slotMorph;
    $super(pt(5, 10).extent(pt(140, 20)), this.slot().name());
    this.extraMenuItemAdders = [];
    this.normalBorderWidth = 1;
    this.setBorderColor(Color.black);
    this.setFill(null);
    this.updateAppearance();
    this.normalBorderWidth = 0;
    this.nameOfEditCommand = "rename";
    this.extraMenuItemAdders.push(function(menu, evt) { this.addEditingMenuItemsTo(menu, evt); }.bind(this));
  },

     slot: function() { return this._slotMorph.slot(); },
  inspect: function() { return this.slot().name(); },

  outliner: function() {
    return this._slotMorph.outliner();
  },

  // aaa onMouseDown: function(evt) { return false; },  // don't allow selection

  canBecomeWritable: function() { return true; },

  updateAppearance: function() {
    if (! this.isInWritableMode) {
      var newText = this.slot().name();
      if (newText != this.getText()) {
        this.setText(newText);
      }
    }
  },

  morphMenu: function(evt) {
    return this._slotMorph.morphMenu(evt);
  },

  returnKeyShouldAccept: function() { return true; },

  getSavedText: function() {
    return this.slot().name();
  },

  setSavedText: function(text) {
    if (text !== this.getSavedText()) {
      this.slot().rename(text);
      this.outliner().updateAppearance();
    }
  },

  captureMouseEvent: function($super, evt, hasFocus) {
    if (evt.type == "MouseDown" && !this.isInWritableMode) {return false;}
    return $super(evt, hasFocus);
  },
});

TextMorphRequiringExplicitAcceptance.subclass("MethodSourceMorph", {
  initialize: function($super, slotMorph) {
    this._slotMorph = slotMorph;
    $super(pt(5, 10).extent(pt(140, 80)), slotMorph.slot().contents().source());
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

     slot: function() { return this._slotMorph.slot(); },
  inspect: function() { return this.slot().name() + " source"; },

  outliner: function() {
    return WorldMorph.current().existingOutlinerFor(this.slot().mirror());
  },

  // aaa onMouseDown: function(evt) { return false; },  // don't allow selection

  canBecomeWritable: function() { return true; },

  updateAppearance: function() {
    var newText = this.slot().contents().source();
    if (newText != this.getText()) {
      this.setText(newText);
    }
  },

  returnKeyShouldAccept: function() { return false; },

  getSavedText: function() {
    return this.slot().contents().source();
  },

  setSavedText: function(text) {
    if (text !== this.getSavedText()) {
      MessageNotifierMorph.showIfErrorDuring(function() {
        var newObject = eval("(" + text + ")");
        var newContents = reflect(newObject);
        this.slot().setContents(newContents);
        if (newContents.isReflecteeFunction()) { this.slot().beCreator(); }
        this.outliner().updateAppearance();
      }.bind(this), createFakeEvent());
    }
  },
});


ColumnMorph.subclass("SlotAnnotationMorph", {
  initialize: function($super, slotMorph) {
    $super();
    this._slotMorph = slotMorph;
    this.beInvisible();
    this._moduleLabel = createLabel(function() {var m = this._slotMorph.slot().module(); return m ? m.name() : "";}.bind(this));
    this.addRow(createLabelledNode("Module", this._moduleLabel));
  },

     slot: function() { return this._slotMorph.slot(); },
  inspect: function() { return this.slot().name() + " annotation"; },

  outliner: function() {
    return WorldMorph.current().existingOutlinerFor(this.slot().mirror());
  },

  updateAppearance: function() {
    this._moduleLabel.refreshText();
    this.outliner().updateAppearance();
  },
});

