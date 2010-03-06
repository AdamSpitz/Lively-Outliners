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
      var aaa_LK_slotNamesAttachedToMethods = ['declaredClass', 'methodName'];
      if (Object.newChildOf(enumerator, this.slot().contents(), 'eachNormalSlot').find(function(s) { return ! aaa_LK_slotNamesAttachedToMethods.include(s.name()); })) { return false; }
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

  createRow: function(m) {
    var row = new RowMorph().beInvisible();
    row.horizontalLayoutMode = LayoutModes.SpaceFill;
    row.setPadding({left: 15, right: 0, top: 0, bottom: 0, between: 0});
    row.replaceThingiesWith([m, createSpacer()]);
    return row;
  },

  sourceMorph: function() {
    var m = this._sourceMorph;
    if (m) { return m; }
    var thisSlotMorph = this;
    var getter = function() {
      try {
        return thisSlotMorph.slot().contents().expressionEvaluatingToMe(thisSlotMorph.slot().isCreator());
      } catch (ex) {
        return "cannot display contents";
      }
    };
    var setter = function(s) {
      MessageNotifierMorph.showIfErrorDuring(function() {
        thisSlotMorph.setContents(reflect(eval("(" + s + ")")));
      }.bind(this), createFakeEvent());
    };
    m = createInputBox(getter, setter);
    m.horizontalLayoutMode = LayoutModes.SpaceFill;
    return this._sourceMorph = m;
  },

  sourceRow: function() {
    return this._sourceRow || (this._sourceRow = this.createRow(this.sourceMorph()));
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

  annotationRow: function() {
    return this._annotationRow || (this._annotationRow = this.createRow(this.annotationMorph()));
  },

  commentMorph: function() {
    var m = this._commentMorph;
    if (m) { return m; }
    var thisSlotMorph = this;
    return this._commentMorph = createInputBox(function( ) { return thisSlotMorph.slot().comment(); },
                                               function(c) { thisSlotMorph.slot().setComment(c); });
  },

  commentRow: function() {
    return this._commentRow || (this._commentRow = this.createRow(this.commentMorph()));
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
    if (this._shouldShowAnnotation) { rows.push(this.annotationRow()); }
    if (this._shouldShowComment   ) { rows.push(this.   commentRow()); }
    if (this._shouldShowSource    ) { rows.push(this.    sourceRow()); }
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

    if (this.slot().rename) {
      this.labelMorph.addEditingMenuItemsTo(menu, evt);
    }

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
        chooseOrCreateAModule(evt, this, function(m, evt) {this.setModule(m, evt);}.bind(this));;
      }.bind(this)]);
    }

    if (this.slot().annotation) {
      menu.addItem([this._shouldShowAnnotation ? "hide annotation" : " show annotation", function(evt) {
        this.toggleAnnotation();
      }.bind(this)]);
    }

    if (this.slot().wellKnownImplementors) {
      menu.addSection([["implementors", function(evt) {
        var slice = new SliceMorph(new ImplementorsFinder(this.slot().name()));
        slice.grabMe(evt);
        slice.redo();
      }.bind(this)]]);
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
