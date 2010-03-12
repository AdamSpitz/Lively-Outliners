lobby.transporter.module.create('slot_morph', function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.method('SlotMorph', function SlotMorph() { Class.initializer.apply(this, arguments); }, {category: ['outliners']});

  add.method('SlotContentsPointerArrow', function SlotContentsPointerArrow() { Class.initializer.apply(this, arguments); }, {category: ['outliners']});

});


thisModule.addSlots(SlotContentsPointerArrow, function(add) {

  add.data('superclass', ArrowMorph);

  add.creator('prototype', Object.create(ArrowMorph.prototype));

  add.data('type', SlotContentsPointerArrow);

});


thisModule.addSlots(SlotContentsPointerArrow.prototype, function(add) {

  add.data('constructor', SlotContentsPointerArrow);

  add.method('initialize', function ($super, slotMorph, fep) {
    this._slotMorph = slotMorph;
    this._fixedEndpoint = fep;
    $super();
    allArrows.push(this);
  });

  add.method('slot', function () {return this._slotMorph.slot();});

  add.method('createEndpoints', function () {
    this.endpoint1 = this._fixedEndpoint;
    this.endpoint2 = new ArrowEndpoint(this.slot(), this);

    // aaa - blecch, ugly
    var slotMorph = this._slotMorph;
    this.endpoint2.wasJustDroppedOnOutliner = function(outliner) {
      this.wasJustDroppedOn(outliner);
      slotMorph.setContents(outliner.mirror());
    };
  });

});


thisModule.addSlots(SlotMorph, function(add) {

  add.data('superclass', ColumnMorph);

  add.creator('prototype', Object.create(ColumnMorph.prototype));

  add.data('type', SlotMorph);

});


thisModule.addSlots(SlotMorph.prototype, function(add) {

  add.data('constructor', SlotMorph);

  add.method('initialize', function ($super, slot) {
    $super();
    this._slot = slot;
    this.setPadding(0);
    this.setFill(defaultFillWithColor(Color.gray));
    this.setBorderWidth(1);
    this.setBorderColor(Color.black);
    this.beUngrabbable();

    this._sourceToggler     = Object.newChildOf(toggler, this,                   this.createRow(this.    sourceMorph())       );
    this._commentToggler    = Object.newChildOf(toggler, this, slot.comment    ? this.createRow(this.   commentMorph()) : null);
    this._annotationToggler = Object.newChildOf(toggler, this, slot.annotation ? this.createRow(this.annotationMorph()) : null);

    var slotMorph = this;
    this.labelMorph = new TwoModeTextMorph(pt(5, 10).extent(pt(140, 20)), slotMorph.slot().name());
    this.labelMorph.nameOfEditCommand = "rename";
    this.labelMorph.setFill(null);
    this.labelMorph.ignoreEvents(); // so that the menu request passes through, though this breaks double-clicking-to-edit
    this.labelMorph.getSavedText = function() { return slotMorph.slot().name(); };
    this.labelMorph.setSavedText = function(newName) { slotMorph.rename(newName, createFakeEvent()); };
    this.labelMorph.refreshText();

    this.commentButton = createButton("'...'", function(evt) { this._commentToggler.toggle(evt); }.bind(this), 1);

    this.buttonChooserMorph = createEitherOrMorph(this.sourceButton(), this.contentsPointer(), function() { return this.isMethodThatShouldBeShownAsPartOfTheBox() }.bind(this));

    this.optionalCommentButtonMorph = createOptionalMorph(this.commentButton, function() { return this._commentToggler.isOn() || (this.slot().comment && this.slot().comment()); }.bind(this));

    this.signatureRowSpacer = createSpacer();
    this.signatureRow = new RowMorph().beInvisible();
    this.signatureRow.setPadding({left: 0, right: 2, top: 0, bottom: 0, between: 0});
    this.signatureRow.horizontalLayoutMode = LayoutModes.SpaceFill;
    this.signatureRow.setPotentialContent([this.labelMorph, this.optionalCommentButtonMorph, this.signatureRowSpacer, this.buttonChooserMorph]);

    this.updateAppearance();
  }, {category: ['creating']});

  add.method('isMethodThatShouldBeShownAsPartOfTheBox', function () {
    return this.slot().isSimpleMethod();
  }, {category: ['source']});

  add.method('contentsPointer', function () {
    var m = this._contentsPointer;
    if (m) { return m; }
    var slot = this.slot();
    var arrow;
    var icon = new ImageMorph(pt(10,10).extentAsRectangle(), "images/icon-data-slot.gif");
    icon.setFill(null);
    icon.beUngrabbable();
    icon.ignoreEvents();
    m = this._contentsPointer = createButton(icon, function() {
      if (arrow.noLongerNeedsToBeUpdated || ! arrow.world()) {
        var w = this.world();
        w.outlinerFor(slot.contents()).ensureIsInWorld(w, m.worldPoint(pt(150,0)), false, true, true);
        arrow.needsToBeVisible();
      } else {
        arrow.noLongerNeedsToBeVisible();
      }
    }.bind(this), 1);
    arrow = new SlotContentsPointerArrow(this, m);
    arrow.noLongerNeedsToBeUpdated = true;

    m.determineWhichMorphToAttachTo = function() {return !!this.world();};
    m.attachToTheRightPlace = function() {};
    m.noLongerNeedsToBeVisibleAsArrowEndpoint = function() {};
    m.relativeLineEndpoint = pt(5, 5);
    m.setShapeToLookLikeACircle = function() {};

    return m;
  }, {category: ['contents']});

  add.method('sourceButton', function () {
    var m = this._sourceButton;
    if (m) { return m; }
    var icon = new ImageMorph(pt(10,10).extentAsRectangle(), "images/icon-method-slot.gif");
    icon.setFill(null);
    icon.beUngrabbable();
    icon.ignoreEvents();
    m = this._sourceButton = createButton(icon, function(evt) {this._sourceToggler.toggle(evt);}.bind(this), 1);
    return m;
  }, {category: ['source']});

  add.method('createButton', function (func) {
    var m = new ButtonMorph(pt(0,0).extent(pt(10,10)));
    
    m.connectModel({model: {Value: null, getValue: function() {return this.Value;}, setValue: function(v) {this.Value = v; if (!v) {func();}}}, setValue: "setValue", getValue: "getValue"});
    return m;
  }, {category: ['creating']});

  add.method('createRow', function (m) {
    var r = createSpaceFillingRow([m], {left: 15, right: 2, top: 2, bottom: 2, between: 0});
    r.wasJustShown = function(evt) { m.requestKeyboardFocus(evt.hand); };
    return r;
  }, {category: ['creating']});

  add.method('sourceMorph', function () {
    var m = this._sourceMorph;
    if (m) { return m; }
    var thisSlotMorph = this;
    var getter = function() {
      try {
        var slot = thisSlotMorph.slot();
        return slot.contents().expressionEvaluatingToMe(slot.isFunctionBody() || slot.isCreator());
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
    m.setFontFamily('monospace');
    m.horizontalLayoutMode = LayoutModes.SpaceFill;
    return this._sourceMorph = m;
  }, {category: ['source']});

  add.method('annotationMorph', function () {
    var m = this._annotationMorph;
    if (m) { return m; }
    m = this._annotationMorph = new ColumnMorph(this).beInvisible();
    m.setPadding({left: 0, right: 0, top: 0, bottom: 0, between: 2});
    this._moduleMorph      = createInputBox(this.moduleName.bind(this), this.setModuleName.bind(this));
    this._initializerMorph = createInputBox(this.initializationExpression.bind(this), this.setInitializationExpression.bind(this));
    m.setRows([createLabelledNode("Module",        this._moduleMorph     ),
               createLabelledNode("Initialize to", this._initializerMorph)]);
    return m;
  }, {category: ['annotation']});

  add.method('commentMorph', function () {
    var m = this._commentMorph;
    if (m) { return m; }
    var thisSlotMorph = this;
    return this._commentMorph = createInputBox(function( ) { return thisSlotMorph.slot().comment(); },
                                               function(c) { thisSlotMorph.slot().setComment(c); });
  }, {category: ['comment']});

  add.method('showSource', function (evt) {
    this._sourceToggler.beOn(evt);
  }, {category: ['source']});

  add.method('rename', function (newName, evt) {
    MessageNotifierMorph.showIfErrorDuring(function() {
      this.slot().rename(newName);
      var outliner = this.outliner();
      if (outliner) {
        outliner.updateAppearance();
        var newSlot = outliner.mirror().slotAt(newName);
        var newSlotMorph = outliner.slotMorphFor(newSlot);
        this.transferUIStateTo(newSlotMorph, evt);
        newSlotMorph.sourceMorph().requestKeyboardFocus(evt.hand);
        newSlotMorph.sourceMorph().doSelectAll();
      }
    }.bind(this), evt);
  }, {category: ['renaming']});

  add.method('transferUIStateTo', function (otherSlotMorph, evt) {
    // used after renaming, since it's actually a whole nother slot and slotMorph but we want it to feel like the same one
    this._sourceToggler    .transferUIStateTo(otherSlotMorph._sourceToggler,     evt);
    this._commentToggler   .transferUIStateTo(otherSlotMorph._commentToggler,    evt);
    this._annotationToggler.transferUIStateTo(otherSlotMorph._annotationToggler, evt);
  }, {category: ['renaming']});

  add.method('slot', function () { return this._slot; }, {category: ['accessing']});

  add.method('inspect', function () { return this.slot().name(); }, {category: ['printing']});

  add.method('outliner', function () {
    return WorldMorph.current().existingOutlinerFor(this.slot().mirror());
  }, {category: ['accessing']});

  add.method('moduleName', function () {
    var module = this.slot().module();
    return module ? module.name() : "";
  }, {category: ['annotation', 'module']});

  add.method('setModuleName', function (n) {
    var module = transporter.module.existingOneNamed(n);
    if (module) { return this.slot().setModule(module); }
    this.world().confirm("The '" + n + "' module does not exist. Create it?", function(b) {
      if (b) {
        this.slot().setModule(transporter.module.named(n));
        this._moduleMorph.changed();
      }
    }.bind(this));
  }, {category: ['annotation', 'module']});

  add.method('initializationExpression', function () {
    return this.slot().initializationExpression();
  }, {category: ['annotation', 'initialization expression']});

  add.method('setInitializationExpression', function (e) {
    this.slot().setInitializationExpression(e);
  }, {category: ['annotation', 'initialization expression']});

  add.method('updateAppearance', function () {
    this.labelMorph.refreshText();
    this.refreshContentOfMeAndSubmorphs();
    this.updateFill();
  }, {category: ['updating']});

  add.method('updateFill', function () {
    var color = this.slot().isFromACopyDownParent() ? Color.red.lighter().lighter() : Color.gray;
    this.setFill(defaultFillWithColor(color));
  }, {category: ['updating']});

  add.method('potentialContent', function () {
    return [this.signatureRow, this._annotationToggler, this._commentToggler, this._sourceToggler];
  }, {category: ['updating']});

  add.method('wasJustDroppedOnOutliner', function (outliner) {
    this.slot().copyTo(outliner.mirror());
    outliner.expander().expand();
    this.remove();
    outliner.updateAppearance();
  }, {category: ['drag and drop']});

  add.method('wasJustDroppedOnCategory', function (categoryMorph) {
    var newSlot = this.slot().copyTo(categoryMorph.outliner().mirror());
    newSlot.setCategory(categoryMorph.category());
    categoryMorph.expander().expand();
    this.remove();
    categoryMorph.outliner().updateAppearance();
  }, {category: ['drag and drop']});

  add.method('wasJustDroppedOnWorld', function (world) {
    var outliner = world.outlinerFor(this.slot().mirror());
    world.addMorphAt(outliner, this.position());
    outliner.expander().expand();
    this.remove();
  }, {category: ['drag and drop']});

  add.method('setModule', function (m, evt) {
    this.slot().setModule(m);
    this.updateAppearance();
  }, {category: ['annotation', 'module']});

  add.method('setContents', function (c, evt) {
    this.slot().setContents(c);
    
    // Sometimes the text doesn't come out quite identical; this makes sure the
    // source editor doesn't stay red.
    if (this._sourceMorph) { this._sourceMorph.cancelChanges(); }

    if (c.isReflecteeFunction()) { this.beCreator(); }

    // Not sure this is really what I want, but I think I don't like it when
    // the source stays open after I edit it, at least if it's data rather than
    // a method. (The method I'm likely to be editing again. But editing the
    // source of a data slot is usually just done when initially creating the
    // slot.)
    if (! this.isMethodThatShouldBeShownAsPartOfTheBox()) { this._sourceToggler.beOff(evt); }

    this.updateAppearance();
  }, {category: ['contents']});

  add.method('beCreator', function () {
    this.slot().beCreator();
    var contentsOutliner = this.world().existingOutlinerFor(this.slot().contents());
    if (contentsOutliner) { contentsOutliner.updateAppearance(); }
    this.updateAppearance();
  }, {category: ['creator slots']});

  add.method('grabCopy', function (evt) {
    var newSlot = this.slot().copyTo(reflect({}));
    var newSlotMorph = new SlotMorph(newSlot);
    newSlotMorph.horizontalLayoutMode = LayoutModes.ShrinkWrap;
    newSlotMorph.forceLayoutRejiggering();
    evt.hand.grabMorphWithoutAskingPermission(newSlotMorph, evt);
    return newSlotMorph;
  }, {category: ['drag and drop']});

  add.method('contextMenu', function (evt) {
    var menu = new MenuMorph([], this);

    var copyDown = this.slot().copyDownParentThatIAmFrom();

    if (copyDown) {
      var copyDownParentMir = reflect(copyDown.parent);
      menu.addItem(["copied down from " + copyDownParentMir.name(), function(evt) {
        this.world().outlinerFor(copyDownParentMir).grabMe(evt);
      }.bind(this)]);
    } else {
      if (this.slot().rename) {
        this.labelMorph.addEditingMenuItemsTo(menu, evt);
      }

      menu.addItem([this._sourceToggler.isOn() ? "hide contents" : "edit contents", function(evt) {
        this._sourceToggler.toggle(evt);
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
        menu.addItem([this._commentToggler.isOn() ? "hide comment" : "edit comment", function(evt) {
          this._commentToggler.toggle(evt);
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
          transporter.chooseOrCreateAModule(evt, this, "To which module?", function(m, evt) {this.setModule(m, evt);}.bind(this));;
        }.bind(this)]);
      }

      if (this.slot().annotation) {
        menu.addItem([this._annotationToggler.isOn() ? "hide annotation" : "show annotation", function(evt) {
          this._annotationToggler.toggle(evt);
        }.bind(this)]);
      }
    }

    if (this.slot().wellKnownImplementors) {
      menu.addSection([["implementors", function(evt) {
        var slice = new SliceMorph(new ImplementorsFinder(this.slot().name()));
        slice.grabMe(evt);
        slice.redo();
      }.bind(this)]]);
    }

    return menu;
  }, {category: ['menu']});

});


});
