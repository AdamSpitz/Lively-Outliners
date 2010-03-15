lobby.transporter.module.create('outliners', function(thisModule) {


thisModule.addSlots(modules.outliners, function(add) {
    
    add.data('_directory', 'outliners');

});


thisModule.addSlots(lobby, function(add) {

  add.method('OutlinerMorph', function OutlinerMorph() { Class.initializer.apply(this, arguments); }, {category: ['outliners']});

});


thisModule.addSlots(OutlinerMorph, function(add) {

  add.data('superclass', ColumnMorph);

  add.creator('prototype', Object.create(ColumnMorph.prototype), {}, {copyDownParents: [{parent: CanHaveArrowsAttachedToIt}, {parent: CategoryMorphMixin}]});

  add.data('type', 'OutlinerMorph');

});


thisModule.addSlots(OutlinerMorph.prototype, function(add) {

  add.data('constructor', OutlinerMorph);

  add.method('initialize', function ($super, m) {
    $super();
    this._mirror = m;

    this.setPadding({top: 2, bottom: 2, left: 4, right: 4, between: 2});
    this.shape.roundEdgesBy(10);

    this._slotMorphs     = bloodyHashTable.copyRemoveAll();
    this._categoryMorphs = bloodyHashTable.copyRemoveAll();

    this.initializeCategoryUI();
    
    this._evaluatorsPanel = new ColumnMorph().beInvisible();
    this._evaluatorsPanel.horizontalLayoutMode = LayoutModes.SpaceFill;

    this.titleLabel = createLabel(function() {return m.inspect();});
    // this.titleLabel.setFontFamily('serif'); // not sure I like it
    this.titleLabel.setEmphasis({style: 'bold'});

    this._commentToggler    = Object.newChildOf(toggler, this.updateExpandedness.bind(this), this.mirror().canHaveAnnotation() ? this.createRow(this.   commentMorph()) : null);
    this._annotationToggler = Object.newChildOf(toggler, this.updateExpandedness.bind(this), this.mirror().canHaveAnnotation() ?                this.annotationMorph()  : null);

    this.commentButton   = createButton("'...'", function(evt) { this._commentToggler.toggle(evt); }.bind(this), 1);
    this.evaluatorButton = createButton("E", function(evt) { this.openEvaluator(evt); }.bind(this), 1);
    this.dismissButton   = this.createDismissButton();

    this.optionalCommentButtonMorph = createOptionalMorph(this.commentButton, function() { return this._commentToggler.isOn() || (this.mirror().comment && this.mirror().comment()); }.bind(this));

    this._headerRow = createSpaceFillingRow([this._expander, this.titleLabel, this.optionalCommentButtonMorph, createSpacer(), this.evaluatorButton, this.dismissButton],
                                            {top: 0, bottom: 0, left: 0, right: 0, between: 3});
    this._headerRow.refreshContent();

    this.optionalSlotsPanel = createOptionalMorph(this.slotsPanel(), function() {return this.expander().isExpanded();}.bind(this));
    this.setPotentialContent([this._headerRow, this._annotationToggler, this._commentToggler, this.optionalSlotsPanel, this._evaluatorsPanel]);

    this.refreshContent();

    this.startPeriodicallyUpdating();
  }, {category: ['creating']});

  add.method('mirror', function () { return this._mirror; }, {category: ['accessing']});

  add.method('outliner', function () { return this; }, {comment: 'For compatibility for CategoryMorph.', category: ['accessing']});

  add.method('category', function () { return Category.root(); }, {category: ['accessing']});

  add.method('createRow', function (m) {
    var r = createSpaceFillingRow([m], {left: 15, right: 2, top: 2, bottom: 2, between: 0});
    r.wasJustShown = function(evt) { m.requestKeyboardFocus(evt.hand); };
    return r;
  }, {category: ['creating']});

  add.method('annotationMorph', function () {
    var m = this._annotationMorph;
    if (m) { return m; }
    m = this._annotationMorph = new ColumnMorph(this).beInvisible();
    m.horizontalLayoutMode = LayoutModes.SpaceFill;

    // aaa - shouldn't really be a string; do something nicer, some way of specifying a list
    this._copyDownParentsLabel = createInputBox(this.copyDownParentsString.bind(this), this.setCopyDownParentsString.bind(this));
    m.setRows([createLabelledNode("Copy-down parents", this._copyDownParentsLabel)]);
    return m;
  }, {category: ['annotation']});

  add.method('copyDownParentsString', function () {
    return reflect(this.mirror().copyDownParents()).expressionEvaluatingToMe();
  }, {category: ['annotation']});

  add.method('setCopyDownParentsString', function (str) {
    MessageNotifierMorph.showIfErrorDuring(function() {
      this.mirror().setCopyDownParents(eval(str));
    }.bind(this), createFakeEvent());
    this.updateAppearance(); // to make the copied-down slots appear
  }, {category: ['annotation']});

  add.method('updateAppearance', function () {
    if (! this.world()) {return;}
    this.populateSlotsPanelInMeAndExistingSubcategoryMorphs();
    this.refreshContentOfMeAndSubmorphs();
  }, {category: ['updating']});

  add.method('startPeriodicallyUpdating', function () {
    this._updater = new PeriodicalExecuter(function(pe) { this.updateAppearance(); }.bind(this), 8);
  }, {category: ['updating']});

  add.method('inspect', function () {return this.mirror().inspect();}, {category: ['printing']});

  add.method('updateExpandedness', function () {
    if (! this.world()) {return;}
    this.optionalSlotsPanel.refreshContent();
    this.refreshContent();
  }, {category: ['updating']});

  add.method('expandCategory', function (c) {
    var m = c.isRoot() ? this : this.categoryMorphFor(c);
    m.expander().expand();
    m.populateSlotsPanel();
  }, {category: ['categories']});

  add.method('eachSlot', function (f) {
    this.mirror().eachFakeSlot(f);
    this.mirror().eachSlotInCategory(this.category(), f);
  }, {category: ['iterating']});

  add.method('slotMorphFor', function (s) {
    return this._slotMorphs.getOrIfAbsentPut(s.name(), function() { return new SlotMorph(s); });
  }, {category: ['slots panel']});

  add.method('existingCategoryMorphFor', function (c) {
    return this._categoryMorphs.get(c.fullName());
  }, {category: ['categories']});

  add.method('categoryMorphFor', function (c) {
    return this._categoryMorphs.getOrIfAbsentPut(c.fullName(), function() { return new CategoryMorph(this, c); }.bind(this));
  }, {category: ['categories']});

  add.method('commentMorph', function () {
    var m = this._commentMorph;
    if (m) { return m; }
    var thisOutliner = this;
    return this._commentMorph = createInputBox(function( ) { return thisOutliner.mirror().comment(); },
                                               function(c) { thisOutliner.mirror().setComment(c); });
  }, {category: ['comment']});

  add.method('openEvaluator', function (evt) {
    var e = new EvaluatorMorph(this);
    this._evaluatorsPanel.addRow(e);
    e.wasJustShown(evt);
  }, {category: ['evaluators']});

  add.method('contextMenu', function (evt) {
    var menu = new MenuMorph([], this);

    if (this.mirror().canHaveSlots()) {
      menu.addSection([["add slot",     function(evt) { this.addSlot    (evt); }.bind(this)]]);
      menu.addSection([["add category", function(evt) { this.addCategory(evt); }.bind(this)]]);
    }
    if (this.mirror().canHaveChildren()) {
      menu.addSection([["create child", function(evt) { this.createChild(evt); }.bind(this)]]);
    }
    
    if (this.mirror().canHaveAnnotation()) {
      menu.addLine();

      if (this.mirror().comment) {
        menu.addItem([this._commentToggler.isOn() ? "hide comment" : "show comment", function(evt) { this._commentToggler.toggle(evt); }.bind(this)]);
      }

      menu.addItem([this._annotationToggler.isOn() ? "hide annotation" : "show annotation", function(evt) { this._annotationToggler.toggle(evt); }.bind(this)]);

      menu.addItem(["set module...", function(evt) {
        var all = {};
        var chooseTargetModule = function(sourceModuleName, evt) {
          transporter.chooseOrCreateAModule(evt, this, "To which module?", function(targetModule, evt) {
            this.mirror().eachNormalSlot(function(slot) {
              if (! slot.isFromACopyDownParent()) {
                if (sourceModuleName === all || (!slot.module() && sourceModuleName === '-') || (slot.module() && slot.module().name() === sourceModuleName)) {
                  slot.setModule(targetModule);
                }
              }
            }.bind(this));
          }.bind(this));
        }.bind(this);
            
        var whichSlotsMenu = new MenuMorph([], this);
        whichSlotsMenu.addItem(["All", function(evt) {chooseTargetModule(all, evt);}.bind(this)]);
        whichSlotsMenu.addLine();
        this.modules().map(function(m) { return m ? m.name() : '-'; }).sort().each(function(moduleName) {
          whichSlotsMenu.addItem([moduleName, function(evt) {chooseTargetModule(moduleName, evt);}.bind(this)]);
        }.bind(this));
        whichSlotsMenu.openIn(this.world(), evt.point(), false, "Of which slots?");
      }.bind(this)]);
    }

    menu.addLine();

    menu.addItem(["well-known references", function(evt) {
      evt.hand.world().morphFor(reflect(this.mirror().wellKnownReferences())).grabMe(evt);
    }.bind(this)]);
    
    menu.addItem(["well-known children", function(evt) {
      evt.hand.world().morphFor(reflect(this.mirror().wellKnownChildren())).grabMe(evt);
    }.bind(this)]);

    menu.addLine();
    
    menu.addItem(["show inheritance hierarchy", function(evt) {
      var w = evt.hand.world();
      var parentFunction = function(o) { return o.mirror().hasParent() ? w.morphFor(o.mirror().parent()) : null; };
      var childrenFunction = function(o) { return o.mirror().wellKnownChildren().map(function(child) { return w.morphFor(reflect(child)); }); };
      w.assumePose(Object.newChildOf(poses.tree, this.mirror().inspect() + " inheritance tree", this, parentFunction, childrenFunction));
    }.bind(this)]);

    return menu;
  }, {category: ['menu']});

  add.method('createChild', function (evt) {
    var child = this.mirror().createChild();
    var childOutliner = this.world().morphFor(child);
    childOutliner.grabMe(evt);

    // might as well show the arrow from the child to the parent
    childOutliner.expander().expand();
    var parentSlotMorph = childOutliner.slotMorphFor(child.parentSlot());
    parentSlotMorph.contentsPointer().getModel().setValue(false);
  }, {category: ['creating children']});

  add.method('acceptsDropping', function (m) { // aaa - could this be generalized?
    return typeof(m.wasJustDroppedOnOutliner) === 'function';
  }, {category: ['drag and drop']});

  add.method('justReceivedDrop', function (m) {
    if (this.acceptsDropping(m)) { 
      m.wasJustDroppedOnOutliner(this);
    }
  }, {category: ['drag and drop']});

  add.method('constructUIStateMemento', function () {
    var mem = {
      isExpanded: this.expander().isExpanded(),
      isCommentOpen: this._commentToggler.isOn(),
      isAnnotationOpen: this._annotationToggler.isOn(),
      categories: [],
      slots: []
    };
    
    this._categoryMorphs.eachValue(function(cm) { mem.categories.push([cm.category(), cm.constructUIStateMemento()]); });
    this.    _slotMorphs.eachValue(function(sm) { mem.slots     .push([sm.slot(),     sm.constructUIStateMemento()]); });

    return mem;
  }, {category: ['UI state']});

  add.method('assumeUIState', function (uiState, evt) {
    evt = evt || createFakeEvent();
    this._commentToggler   .setValue( uiState.isCommentOpen,    evt );
    this._annotationToggler.setValue( uiState.isAnnotationOpen, evt );
    this.expander().setExpanded(uiState.isExpanded);
    uiState.categories.each(function(a) { this.categoryMorphFor(a[0]).assumeUIState(a[1]); }.bind(this));
    uiState.slots     .each(function(a) { this.    slotMorphFor(a[0]).assumeUIState(a[1]); }.bind(this));
  }, {category: ['UI state']});

});

thisModule.addSlots(mirror, function(add) {

  add.method('newMorph', function () {
    return new OutlinerMorph(this);
  }, {category: ['user interface']});

  add.data('isImmutableForMorphIdentity', true, {category: ['user interface']});

});


thisModule.addSlots(WorldMorph.prototype, function(add) {

  add.method('livelyOutlinersWorldMenu', function (evt) {
    var world = this;

    var menu = new MenuMorph([], this);

    menu.addItem(["create new object", function(evt) {
      this.morphFor(reflect({})).grabMe(evt);
    }]);

    menu.addItem(["get the Global object", function(evt) {
      this.morphFor(reflect(Global)).grabMe(evt);
    }]);

    transporter.addMenuItemsTo(menu, evt);

    poses.addMenuItemsTo(menu, evt);

    if (debugMode) {
      menu.addLine();

      menu.addItem(["get tests", function(evt) {
        var testCaseClasses = [mirror.Tests];
        var testCases = testCaseClasses.map(function(c) {return new c();});
        world.assumePose(world.listPoseOfMorphsFor(testCases, "test cases for the outliner stuff"));
      }]);
    }

    return menu;
  });

});


thisModule.addSlots(transporter, function(add) {

  add.method('chooseOrCreateAModule', function (evt, targetMorph, menuCaption, callback) {
    var modulesMenu = new MenuMorph([], targetMorph);
    modulesMenu.addItem(["new module...", function(evt) {
      evt.hand.world().prompt("Module name?", function(name) {
        if (name) {
          if (lobby.modules[name]) {
            throw "There is already a module named " + name;
          }
          callback(lobby.transporter.module.named(name), evt);
        }
      });
    }]);
    modulesMenu.addLine();
    lobby.transporter.module.eachModule(function(m) {
      modulesMenu.addItem([m.name(), function(evt) {
        callback(m, evt);
      }]);
    });
    modulesMenu.openIn(targetMorph.world(), evt.point(), false, menuCaption);
  }, {category: 'menu'});

});



});
