lobby.transporter.module.create('slot_morph', function(requires) {

requires('lk_ext', 'rows_and_columns');

}, function(thisModule) {


thisModule.addSlots(modules.slot_morph, function(add) {
    
    add.data('_directory', 'outliners');

});


thisModule.addSlots(lobby, function(add) {

  add.method('SlotMorph', function SlotMorph() { Class.initializer.apply(this, arguments); }, {category: ['outliners']});

});


thisModule.addSlots(SlotMorph, function(add) {

  add.data('superclass', ColumnMorph);

  add.creator('prototype', Object.create(ColumnMorph.prototype));

  add.data('type', 'SlotMorph');

});


thisModule.addSlots(SlotMorph.prototype, function(add) {

  add.data('constructor', SlotMorph);

  add.method('initialize', function ($super, slot) {
    $super();
    this._slot = slot;

    this.setPadding(0);
    this.updateFill();
    this.setBorderWidth(1);
    this.setBorderColor(Color.black);
    this.beUngrabbable();
    this.closeDnD();

    this._sourceToggler     = Object.newChildOf(toggler, this.updateAppearance.bind(this),                   this.createRow(function() {return this.    sourceMorph();}.bind(this))       );
    this._commentToggler    = Object.newChildOf(toggler, this.updateAppearance.bind(this), slot.comment    ? this.createRow(function() {return this.   commentMorph();}.bind(this)) : null);
    this._annotationToggler = Object.newChildOf(toggler, this.updateAppearance.bind(this), slot.annotation ? this.createRow(function() {return this.annotationMorph();}.bind(this)) : null);

    var slotMorph = this;
    this.labelMorph = new TwoModeTextMorph(pt(5, 10).extent(pt(140, 20)), slotMorph.slot().name());
    this.labelMorph.nameOfEditCommand = "rename";
    this.labelMorph.setFill(null);
    this.labelMorph.ignoreEvents(); // so that the menu request passes through, though this breaks double-clicking-to-edit
    this.labelMorph.getSavedText = function() { return slotMorph.slot().name(); };
    this.labelMorph.setSavedText = function(newName) { slotMorph.rename(newName, createFakeEvent()); };
    this.labelMorph.refreshText();

    this.commentButton = createButton("'...'", function(evt) { this._commentToggler.toggle(evt); }.bind(this), 1);

    this.buttonChooserMorph = createEitherOrMorph(this.sourceButton(), this.contentsPointer(), function() { return this.isMethodThatShouldBeShownAsPartOfTheBox(); }.bind(this));

    this.optionalCommentButtonMorph = createOptionalMorph(this.commentButton, function() { return this._commentToggler.isOn() || (this.slot().comment && this.slot().comment()); }.bind(this));

    var signatureRowContent = [this.labelMorph, this.optionalCommentButtonMorph, createSpacer(), this.buttonChooserMorph];
    this.signatureRow = createSpaceFillingRow(function () { return signatureRowContent; },
                                              {left: 0, right: 2, top: 0, bottom: 0, between: 0});

    this.updateAppearance();
  }, {category: ['creating']});
  
  add.data('grabsShouldFallThrough', true, {category: ['grabbing']});

  add.method('isMethodThatShouldBeShownAsPartOfTheBox', function () {
    return this.slot().isSimpleMethod();
  }, {category: ['source']});

  add.method('contentsPointer', function () {
    var m = this._contentsPointer;
    if (m) { return m; }

    var slotMorph = this;
    var slot = this.slot();
    var icon = this.createIconForButton("images/icon-data-slot.gif");

    // aaa - This is a mess. Make it make sense.
    var arrow;
    m = this._contentsPointer = createButton(icon, function() {
      if (arrow.noLongerNeedsToBeUpdated) {
        var w = this.world();
        w.morphFor(slot.contents()).ensureIsInWorld(w, m.worldPoint(pt(150,0)), false, true, true);
        arrow.needsToBeVisible();
      } else {
        arrow.noLongerNeedsToBeVisible();
      }
    }.bind(this), 1);
    beArrowEndpoint(m);

    arrow = m.arrow = new ArrowMorph(slot, m, null);
    arrow.noLongerNeedsToBeUpdated = true;

    arrow.endpoint2.wasJustDroppedOnOutliner = function(outliner) {
      this.wasJustDroppedOn(outliner);
      slotMorph.setContents(outliner.mirror());
    };

    // aaa - To do "grab pointer" properly I think I need to do a more general drag-and-drop thing. Right
    // now nothing will get called if I drop the endpoint on something invalid (like the world or some
    // other morph), so the visibility will need to be toggled an extra time to get it back to normal.
    m.addCommandsTo = function(cmdList) {
      cmdList.addItem({label: "grab pointer", go: function(evt) { arrow.needsToBeVisible(); arrow.endpoint2.grabMe(evt); } });
    };

    m.inspect = function() { return slot.name() + " contents"; };

    return m;
  }, {category: ['contents']});

  add.method('sourceButton', function () {
    var m = this._sourceButton;
    if (m) { return m; }
    var icon = this.createIconForButton("images/icon-method-slot.gif");
    m = this._sourceButton = createButton(icon, function(evt) {this._sourceToggler.toggle(evt);}.bind(this), 1);
    return m;
  }, {category: ['source']});

  add.method('createIconForButton', function (path) {
    var icon = new ImageMorph(pt(10,10).extentAsRectangle(), path);
    icon.setFill(null);
    icon.beUngrabbable();
    icon.ignoreEvents();
    icon.closeDnD();
    return icon;
  }, {category: ['creating']});

  add.method('createButton', function (func) {
    var m = new ButtonMorph(pt(0,0).extent(pt(10,10)));
    
    m.connectModel({model: {Value: null, getValue: function() {return this.Value;}, setValue: function(v) {this.Value = v; if (!v) {func();}}}, setValue: "setValue", getValue: "getValue"});
    return m;
  }, {category: ['creating']});

  add.method('createRow', function (getOrCreateContent) {
    var spacer = createSpacer();
    var r = createSpaceFillingRow(function() {return [getOrCreateContent(), spacer];}, {left: 15, right: 2, top: 2, bottom: 2, between: 0});
    r.wasJustShown = function(evt) { getOrCreateContent().requestKeyboardFocus(evt.hand); };
    return r;
  }, {category: ['creating']});

  add.method('sourceMorph', function () {
    var m = this._sourceMorph;
    if (m) { return m; }
    var thisSlotMorph = this;
    var getter = function() {
      try {
        var slot = thisSlotMorph.slot();
        var expr = slot.contents().expressionEvaluatingToMe(slot.isFunctionBody() || slot.isCreator());
        return expr;
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
    this._sourceMorph = m;
    return m;
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
    m = createInputBox(function( ) { return thisSlotMorph.slot().comment(); },
                       function(c) { thisSlotMorph.slot().setComment(c); });
    this._commentMorph = m;
    return m;
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

        // it's actually a whole nother slot and slotMorph but we want it to feel like the same one
        var newSlot = outliner.mirror().slotAt(newName);
        var newSlotMorph = outliner.slotMorphFor(newSlot);
        this.transferUIStateTo(newSlotMorph);
        newSlotMorph.sourceMorph().requestKeyboardFocus(evt.hand);
        newSlotMorph.sourceMorph().doSelectAll();
      }
    }.bind(this), evt);
  }, {category: ['renaming']});

  add.method('constructUIStateMemento', function () {
    return {
      isSourceOpen: this._sourceToggler.isOn(),
      isCommentOpen: this._commentToggler.isOn(),
      isAnnotationOpen: this._annotationToggler.isOn(),
      isArrowVisible: ! this.contentsPointer().arrow.noLongerNeedsToBeUpdated
    };
  }, {category: ['UI state']});

  add.method('assumeUIState', function (uiState, evt) {
    evt = evt || createFakeEvent();
    this._sourceToggler    .setValue( uiState.isSourceOpen,     evt );
    this._commentToggler   .setValue( uiState.isCommentOpen,    evt );
    this._annotationToggler.setValue( uiState.isAnnotationOpen, evt );
    
    var arrow = this.contentsPointer().arrow;
    if (uiState.isArrowVisible) {arrow.needsToBeVisible();} else {arrow.noLongerNeedsToBeVisible();}
  }, {category: ['UI state']});

  add.method('slot', function () { return this._slot; }, {category: ['accessing']});

  add.method('inspect', function () { return this.slot().name(); }, {category: ['printing']});

  add.method('outliner', function () {
    return WorldMorph.current().existingMorphFor(this.slot().mirror());
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

  add.method('updateAppearance', function () { // aaa get rid of me once I'm being done through refreshContentOfMeAndSubmorphs from the outliner
    this.refreshContentOfMeAndSubmorphs();
    this.updateFill();
  }, {category: ['updating']});

  add.method('updateFill', function () {
    if (this.slot().isFromACopyDownParent()) {
      this.setFill(Color.red.lighter().lighter());
      this.setFillOpacity(0.5); 
    } else {
      this.setFill(null);
    }
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
    var outliner = world.morphFor(this.slot().mirror());
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
    var contentsOutliner = this.world().existingMorphFor(this.slot().contents());
    if (contentsOutliner) { contentsOutliner.updateAppearance(); }
    this.updateAppearance();
  }, {category: ['creator slots']});

  add.method('grabCopy', function (evt) {
    var newMirror = reflect({});
    var newSlot = this.slot().copyTo(newMirror);
    var newSlotMorph = new SlotMorph(newSlot);
    newSlotMorph.horizontalLayoutMode = LayoutModes.ShrinkWrap;
    newSlotMorph.forceLayoutRejiggering();
    evt.hand.grabMorphWithoutAskingPermission(newSlotMorph, evt);
    return newSlotMorph;
  }, {category: ['drag and drop']});

  add.method('addCommandsTo', function (cmdList) {
    var copyDown = this.slot().copyDownParentThatIAmFrom();

    if (copyDown) {
      var copyDownParentMir = reflect(copyDown.parent);
      cmdList.addItem({label: "copied down from " + copyDownParentMir.name(), go: function(evt) {
        this.world().morphFor(copyDownParentMir).grabMe(evt);
      }.bind(this)});
    } else {
      if (this.slot().rename) {
        this.labelMorph.addEditingMenuItemsTo(cmdList);
      }

      cmdList.addItem({label: this._sourceToggler.isOn() ? "hide contents" : "edit contents", go: function(evt) {
        this._sourceToggler.toggle(evt);
      }.bind(this)});

      if (this.slot().copyTo) {
        cmdList.addItem({label: "copy", go: function(evt) { this.grabCopy(evt); }.bind(this)});
      }
      
      if (this.slot().remove) {
        cmdList.addItem({label: "move", go: function(evt) {
          this.grabCopy(evt);
          this.slot().remove();
          var outliner = this.outliner();
          if (outliner) { outliner.updateAppearance(); }
        }.bind(this)});
      }

      if (this.slot().comment) {
        cmdList.addItem({label: this._commentToggler.isOn() ? "hide comment" : "edit comment", go: function(evt) {
          this._commentToggler.toggle(evt);
        }.bind(this)});
      }

      if (this.slot().beCreator && this.slot().contents().canHaveCreatorSlot()) {
        var cs = this.slot().contents().creatorSlot();
        if (!cs || ! cs.equals(this.slot())) {
          cmdList.addItem({label: "be creator", go: function(evt) { this.beCreator(); }.bind(this)});
        }
      }

      if (this.slot().setModule) {
        cmdList.addItem({label: "set module...", go: function(evt) {
          transporter.chooseOrCreateAModule(evt, this, "To which module?", function(m, evt) {this.setModule(m, evt);}.bind(this));
        }.bind(this)});
      }

      if (this.slot().annotation) {
        cmdList.addItem({label: this._annotationToggler.isOn() ? "hide annotation" : "show annotation", go: function(evt) {
          this._annotationToggler.toggle(evt);
        }.bind(this)});
      }
    }

    if (this.slot().wellKnownImplementors) {
      cmdList.addSection([{label: "implementors", go: function(evt) {
        var slice = new SliceMorph(new ImplementorsFinder(this.slot().name()));
        slice.grabMe(evt);
        slice.redo();
      }.bind(this)}]);
    }
  }, {category: ['menu']});

});


});
