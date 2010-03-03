ColumnMorph.subclass("SlotMorph", {
  initialize: function($super, slot) {
    $super();
    this._slot = slot;
    this.setPadding(0);
    this.setFill(defaultFillWithColor(Color.gray));
    this.setBorderWidth(1);
    this.setBorderColor(Color.black);
    this.beUngrabbable();

    var slotMorph = this;
    this.labelMorph = new TwoModeTextMorph(pt(5, 10).extent(pt(140, 20)), slotMorph.slot().name());
    this.labelMorph.nameOfEditCommand = "rename";
    this.labelMorph.setFill(null);
    this.labelMorph.ignoreEvents();
    this.labelMorph.getSavedText = function() { return slotMorph.slot().name(); };
    this.labelMorph.setSavedText = function(newName) { if (newName !== this.getSavedText()) { slotMorph.rename(newName, createFakeEvent()); } };
    this.labelMorph.refreshText();

    this.commentButton = createButton("'...'", function(evt) { this.toggleComment(evt); }.bind(this), 1);
    this.signatureRowSpacer = createSpacer();
    this.signatureRow = new RowMorph().beInvisible();
    this.signatureRow.horizontalLayoutMode = LayoutModes.SpaceFill;
    this.signatureRow.inspect = function() { return "signature row"; };
    this.signatureRow.refreshContent = function() { this.populateSignatureRow(); }.bind(this);

    this.updateAppearance();
  },

  isMethodThatShouldBeShownAsPartOfTheBox: function() {
      if (this.slot().isFunctionBody()) { return true; }
      if (! this.slot().isMethod()) { return false; }
      if (Object.newChildOf(enumerator, this.slot().contents(), 'eachNormalSlot').find(function(s) { return true; })) { return false; }
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
    var thisSlotMorph = this;
    var getter = function() {
      try {
        return thisSlotMorph.slot().contents().expressionEvaluatingToMe();
      } catch (ex) {
        return "cannot display contents";
      }
    };
    var setter = function(s) {
      MessageNotifierMorph.showIfErrorDuring(function() {
        thisSlotMorph.setContents(reflect(eval("(" + s + ")")));
      }.bind(this), createFakeEvent());
    };
    return this._sourceMorph = createInputBox(getter, setter);
  },

  annotationMorph: function() {
    var m = this._annotationMorph;
    if (m) { return m; }
    m = this._annotationMorph = new ColumnMorph(this).beInvisible();
    this._moduleMorph      = createInputBox(this.moduleName.bind(this), this.setModuleName.bind(this));
    this._initializerMorph = createInputBox(this.initializationExpression.bind(this), this.setInitializationExpression.bind(this));
    m.addRow(createLabelledNode("Module",        this._moduleMorph     ));
    m.addRow(createLabelledNode("Initialize to", this._initializerMorph));
    return m;
  },

  commentMorph: function() {
    var m = this._commentMorph;
    if (m) { return m; }
    var thisSlotMorph = this;
    return this._commentMorph = createInputBox(function( ) { return thisSlotMorph.slot().comment(); },
                                               function(c) { thisSlotMorph.slot().setComment(c); });
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

  rename: function(newName, evt) {
    MessageNotifierMorph.showIfErrorDuring(function() {
      this.slot().rename(newName);
      var outliner = this.outliner();
      if (outliner) {
        outliner.updateAppearance();
        var newSlot = outliner.mirror().slotAt(newName);
        var newSlotMorph = outliner.slotMorphFor(newSlot);
        this.transferUIStateTo(newSlotMorph);
        evt.hand.setKeyboardFocus(newSlotMorph.sourceMorph());
        newSlotMorph.sourceMorph().selectAll();
      }
    }.bind(this), evt);
  },

  transferUIStateTo: function(otherSlotMorph) {
    // used after renaming, since it's actually a whole nother slot and slotMorph but we want it to feel like the same one
    otherSlotMorph._shouldShowSource     = this._shouldShowSource;
    otherSlotMorph._shouldShowComment    = this._shouldShowComment;
    otherSlotMorph._shouldShowAnnotation = this._shouldShowAnnotation;
    otherSlotMorph.updateAppearance();
  },

     slot: function() { return this._slot; },
  inspect: function() { return this.slot().name(); },

  outliner: function() {
    return WorldMorph.current().existingOutlinerFor(this.slot().mirror());
  },

  moduleName: function() {
    var module = this.slot().module();
    return module ? module.name() : "";
  },

  setModuleName: function(n) {
    var module = transporter.module.existingOneNamed(n);
    if (module) { return this.slot().setModule(module); }
    this.world().confirm("The '" + n + "' module does not exist. Create it?", function(b) {
      if (b) {
        this.slot().setModule(transporter.module.named(n));
        this._moduleMorph.changed();
      }
    }.bind(this));
  },

  initializationExpression: function() {
    return this.slot().initializationExpression();
  },

  setInitializationExpression: function(e) {
    this.slot().setInitializationExpression(e);
  },

  updateAppearance: function() {
    this.labelMorph.refreshText();
    this.signatureRow.refreshContent();
    if (this._commentMorph)    { this._commentMorph.refreshText(); }
    if (this._sourceMorph)     { this._sourceMorph .refreshText(); }
    if (this._moduleMorph)     { this._moduleMorph .refreshText(); }
    this.refreshContent();
    this.updateFill();
  },

  updateFill: function() {
    var color = this.slot().isFromACopyDownParent() ? Color.red.lighter().lighter() : Color.gray;
    this.setFill(defaultFillWithColor(color));
  },

  refreshContent: function() {
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

  wasJustDroppedOnCategory: function(categoryMorph) {
    var newSlot = this.slot().copyTo(categoryMorph.outliner().mirror());
    newSlot.setCategory(categoryMorph.category());
    categoryMorph.expander().expand();
    this.remove();
    categoryMorph.outliner().updateAppearance();
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

  grabCopy: function(evt) {
    var newSlot = this.slot().copyTo(reflect({}));
    var newSlotMorph = new SlotMorph(newSlot);
    newSlotMorph.horizontalLayoutMode = LayoutModes.ShrinkWrap;
    newSlotMorph.forceLayoutRejiggering();
    evt.hand.grabMorphWithoutAskingPermission(newSlotMorph, evt);
    return newSlotMorph;
  },

  morphMenu: function(evt) {
    var menu = new MenuMorph([], this);

    this.labelMorph.addEditingMenuItemsTo(menu, evt);

    menu.addItem([this._shouldShowSource ? "hide contents" : "edit contents", function(evt) {
      this.toggleSource();
    }.bind(this)]);

    if (this.slot().copyTo) {
      menu.addItem(["copy", function(evt) { this.grabCopy(evt); }.bind(this)]);
    }

    if (this.slot().remove) {
      menu.addItem(["move", function(evt) {
        this.grabCopy(evt);
        this.slot().remove();
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
