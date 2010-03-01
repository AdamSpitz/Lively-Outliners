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
    this.commentButton = createButton("'...'", function(evt) { this.toggleComment(evt); }.bind(this), 1);
    this.signatureRowSpacer = createSpacer();
    this.signatureRow = new RowMorph().beInvisible();
    this.signatureRow.horizontalLayoutMode = LayoutModes.SpaceFill;
    this.signatureRow.inspect = function() { return "signature row"; };

    this.updateAppearance();
  },

  isMethodThatShouldBeShownAsPartOfTheBox: function() {
      if (! this.slot().isMethod()) { return false; }
      if (this.slot().contents().iterator('eachNonParentSlot').find(function(s) { return true; })) { return false; }
      return true;
  },

  populateSignatureRow: function() {
    var ms = [this.labelMorph];
    if (this._shouldShowComment || (this.slot().comment && this.slot().comment())) { ms.push(this.commentButton); }
    ms.push(this.signatureRowSpacer);
    var button = this.isMethodThatShouldBeShownAsPartOfTheBox() ? this.sourceButton() : this.contentsPointer();
    ms.push(button);
    this.signatureRow.replaceThingiesWith(ms);
  },

  contentsPointer: function() {
    var m = this._contentsPointer;
    if (m) { return m; }
    var slot = this.slot();
    var arrow;
    m = this._contentsPointer = createButton('D', function() {
      if (arrow.noLongerNeedsToBeUpdated || ! arrow.world()) {
        var w = this.world();
        w.outlinerFor(slot.contents()).ensureIsInWorld(w, m.worldPoint(pt(150,0)));
        arrow.needsToBeVisible();
      } else {
        arrow.noLongerNeedsToBeVisible();
      }
    }.bind(this), 2);
    arrow = new SlotContentsPointerArrow(this, m);
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
    return this._sourceButton = createButton('M', function(evt) {
      this.toggleSource();
    }.bind(this), 2);
  },

  createButton: function(func) {
    var m = new ButtonMorph(pt(0,0).extent(pt(10,10)));
    
    m.connectModel({model: {Value: null, getValue: function() {return this.Value;}, setValue: function(v) {this.Value = v; if (!v) {func();}}}, setValue: "setValue", getValue: "getValue"});
    return m;
  },

  sourceMorph: function() {
    var m = this._sourceMorph;
    if (m) { return m; }
    m = this._sourceMorph = new TextMorphRequiringExplicitAcceptance(pt(5, 10).extent(pt(140, 80)), "");
    m.nameOfEditCommand = "edit source";
    m.extraMenuItemAdders = [function(menu, evt) { this.addEditingMenuItemsTo(menu, evt); }.bind(this)];
    m.closeDnD();
    m.setFill(null);
    var thisSlotMorph = this;
    m.getSavedText = function() { return thisSlotMorph.slot().contents().expressionEvaluatingToMe(); };
    m.setSavedText = function(text) {
      if (text !== this.getSavedText()) {
        MessageNotifierMorph.showIfErrorDuring(function() {
          thisSlotMorph.setContents(reflect(eval("(" + text + ")")));
        }.bind(this), createFakeEvent());
      }
    };
    m.refreshText();
    return m;
  },

  annotationMorph: function() {
    var m = this._annotationMorph;
    if (m) { return m; }
    m = this._annotationMorph = new ColumnMorph(this).beInvisible();
    this._moduleLabel = createLabel(function() {var m = this.slot().module(); 
        console.log("aaa - moduleLabel being set to " + (m ? m.name() : ""));
        return m ? m.name() : "";}.bind(this));
    m.addRow(createLabelledNode("Module", this._moduleLabel));
    return m;
  },

  commentMorph: function() {
    var m = this._commentMorph;
    if (m) { return m; }
    m = this._commentMorph = new TextMorphRequiringExplicitAcceptance(pt(5, 10).extent(pt(140, 80)), "");
    m.nameOfEditCommand = "edit comment";
    m.extraMenuItemAdders = [function(menu, evt) { this.addEditingMenuItemsTo(menu, evt); }.bind(this)];
    m.closeDnD();
    m.setFill(null);
    var thisSlotMorph = this;
    m.getSavedText = function() { return thisSlotMorph.slot().comment(); };
    m.setSavedText = function(text) { if (text !== this.getSavedText()) { thisSlotMorph.slot().setComment(text); } };
    m.refreshText();
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

  toggleComment: function(evt) {
    this._shouldShowComment = ! this._shouldShowComment;
    this.updateAppearance();
    if (this._shouldShowComment) { evt.hand.setKeyboardFocus(this.commentMorph()); }
  },

  transferUIStateTo: function(otherSlotMorph) {
    // used after renaming, since it's actually a whole nother slot and slotMorph but we want it to feel like the same one
    otherSlotMorph._shouldShowSource     = this._shouldShowSource;
    otherSlotMorph._shouldShowAnnotation = this._shouldShowAnnotation;
    otherSlotMorph.updateAppearance();
  },

     slot: function() { return this._slot; },
  inspect: function() { return "the " + this.slot().name() + " slot morph"; },

  outliner: function() {
    return WorldMorph.current().existingOutlinerFor(this.slot().mirror());
  },

  updateAppearance: function() {
    this.labelMorph.updateAppearance();
    this.populateSignatureRow();
    if (this._commentMorph)    { this._commentMorph.refreshText(); }
    if (this._sourceMorph)     { this._sourceMorph .refreshText(); }
    if (this._moduleLabel)     { this._moduleLabel .refreshText(); }
    var rows = [this.signatureRow];
    if (this._shouldShowComment   ) { rows.push(this.   commentMorph()); }
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

  setContents: function(c, evt) {
    this.slot().setContents(c);
    if (c.isReflecteeFunction()) { this.beCreator(); }
    this.updateAppearance();
  },

  beCreator: function() {
    this.slot().beCreator();
    var contentsOutliner = this.world().existingOutlinerFor(this.slot().contents());
    if (contentsOutliner) { contentsOutliner.updateAppearance(); }
    this.updateAppearance();
  },

  morphMenu: function(evt) {
    var menu = new MenuMorph([], this);

    this.labelMorph.addEditingMenuItemsTo(menu, evt);

    menu.addItem([this._shouldShowSource ? "hide contents" : "edit contents", function(evt) {
      this.toggleSource();
    }.bind(this)]);

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
        var outliner = this.outliner();
        if (outliner) { outliner.updateAppearance(); }
      }.bind(this)]);
    }

    if (this.slot().comment) {
      menu.addItem([this._shouldShowComment ? "hide comment" : "edit comment", function(evt) {
        this.toggleComment(evt);
      }.bind(this)]);
    }

    if (this.slot().beCreator && this.slot().contents().canHaveCreatorSlot()) {
      var cs = this.slot().contents().creatorSlot();
      if (!cs || ! cs.equals(this.slot())) {
        menu.addItem(["be creator", function(evt) { this.beCreator(); }.bind(this)]);
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

    menu.addLine();
    
    if (this.slot().wellKnownImplementors) {
      menu.addItem(["implementors", function(evt) {
        var slice = new SliceMorph(new ImplementorsFinder(this.slot().name()));
        slice.grabMe(evt);
        slice.redo();
      }.bind(this)]);
    }

    return menu;
  },
});

ArrowMorph.subclass("SlotContentsPointerArrow", {
  initialize: function($super, slotMorph, fep) {
    this._slotMorph = slotMorph;
    this._fixedEndpoint = fep;
    $super();
    allArrows.push(this);
  },

  slot: function() {return this._slotMorph.slot();},

  createEndpoints: function() {
    this.endpoint1 = this._fixedEndpoint;
    this.endpoint2 = new ArrowEndpoint(this.slot(), this);

    // aaa - blecch, ugly
    var slotMorph = this._slotMorph;
    this.endpoint2.wasJustDroppedOnOutliner = function(outliner) {
      this.wasJustDroppedOn(outliner);
      slotMorph.setContents(outliner.mirror());
    };
  },
});



TwoModeTextMorph.subclass("SlotNameMorph", {
  initialize: function($super, slotMorph) {
    this._slotMorph = slotMorph;
    $super(pt(5, 10).extent(pt(140, 20)), this.slot().name());
    this.extraMenuItemAdders = [];
    this.setFill(null);
    this.updateAppearance();
    this.nameOfEditCommand = "rename";
    this.extraMenuItemAdders.push(function(menu, evt) { this.addEditingMenuItemsTo(menu, evt); }.bind(this));
  },

     slot: function() { return this._slotMorph.slot(); },
  inspect: function() { return this.slot().name(); },

  outliner: function() {
    return this._slotMorph.outliner();
  },

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

  setSavedText: function(newName) {
    if (newName !== this.getSavedText()) {
      var evt = createFakeEvent();
      MessageNotifierMorph.showIfErrorDuring(function() {
        this.slot().rename(newName);
        var outliner = this.outliner();
        if (outliner) {
          outliner.updateAppearance();
          var newSlot = outliner.mirror().slotAt(newName);
          var newSlotMorph = outliner.slotMorphFor(newSlot);
          this._slotMorph.transferUIStateTo(newSlotMorph);
          evt.hand.setKeyboardFocus(newSlotMorph.sourceMorph());
          newSlotMorph.sourceMorph().selectAll();
        }
      }.bind(this), evt);
    }
  },

  captureMouseEvent: function($super, evt, hasFocus) {
    if (evt.type == "MouseDown" && !this.isInWritableMode) {return false;}
    return $super(evt, hasFocus);
  },
});
