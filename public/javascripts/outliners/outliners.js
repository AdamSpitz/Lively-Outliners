lobby.transporter.module.create('outliners', function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.method('OutlinerMorph', function OutlinerMorph() { Class.initializer.apply(this, arguments); }, {category: ['outliners']});

});


thisModule.addSlots(OutlinerMorph, function(add) {

  add.data('superclass', ColumnMorph);

  add.creator('prototype', Object.create(ColumnMorph.prototype), {}, {copyDownParents: [{parent: CanHaveArrowsAttachedToIt}, {parent: CategoryMorphMixin}]});

  add.data('type', OutlinerMorph);

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

    this.titleLabel      = createLabel(function() {return m.inspect();});
    this.commentButton   = createButton("'...'", function(evt) { this.toggleComment(evt); }.bind(this), 1);
    this.evaluatorButton = createButton("E", function(evt) { this.openEvaluator(evt); }.bind(this), 1);
    this.dismissButton   = this.createDismissButton();

    this.createHeaderRow();

    this.replaceThingiesWith([this._headerRow, this._evaluatorsPanel]);

    this.startPeriodicallyUpdating();
  });

  add.method('mirror', function () { return this._mirror; });

  add.method('outliner', function () { return this; });

  add.method('category', function () { return Category.root(); });

  add.method('createHeaderRow', function () {
    var r = this._headerRow = new RowMorph().beInvisible(); // aaa - put underscores in front of the instvars
    this._headerRowSpacer = createSpacer();
    r.setPadding({top: 0, bottom: 0, left: 0, right: 0, between: 3});
    r.horizontalLayoutMode = LayoutModes.SpaceFill;
    r.inspect = function() {return "the header row";};
    r.refreshContent = function() { this.refreshHeaderRow(); }.bind(this);
    this.refreshHeaderRow();
    return r;
  });

  add.method('refreshHeaderRow', function () {
    var ms = [this._expander, this.titleLabel];
    if (this._shouldShowComment || (this.mirror().comment && this.mirror().comment())) { ms.push(this.commentButton); }
    ms.push(this._headerRowSpacer);
    ms.push(this.evaluatorButton);
    ms.push(this.dismissButton);
    this._headerRow.replaceThingiesWith(ms);
  });

  add.method('annotationMorph', function () {
    var m = this._annotationMorph;
    if (m) { return m; }
    m = this._annotationMorph = new ColumnMorph(this).beInvisible();
    m.horizontalLayoutMode = LayoutModes.SpaceFill;

    // aaa - shouldn't really be a string; do something nicer, some way of specifying a list
    this._copyDownParentsLabel = createInputBox(this.copyDownParentsString.bind(this), this.setCopyDownParentsString.bind(this));
    m.addRow(createLabelledNode("Copy-down parents", this._copyDownParentsLabel));
    return m;
  });

  add.method('toggleAnnotation', function (evt) {
    this._shouldShowAnnotation = !this._shouldShowAnnotation;
    this.updateExpandedness();
  });

  add.method('copyDownParentsString', function () {
    return reflect(this.mirror().copyDownParents()).expressionEvaluatingToMe();
  });

  add.method('setCopyDownParentsString', function (str) {
    MessageNotifierMorph.showIfErrorDuring(function() {
      this.mirror().setCopyDownParents(eval(str));
    }.bind(this), createFakeEvent());
    this.updateAppearance();
  });

  add.method('updateAppearance', function () {
    if (! this.world()) {return;}
    this.populateSlotsPanel();
    this._slotsPanel.submorphs.each(function(m) { m.updateAppearance(); }); // aaa is this gonna cause us to redo a lot of work?
    this.refillWithAppropriateColor();
    this.titleLabel.refreshText();
    this._modulesLabel.refreshText();
    if (this._copyDownParentsLabel) {this._copyDownParentsLabel.refreshText();}
    this._headerRow.refreshContent();
    this.minimumExtentChanged();
  });

  add.method('startPeriodicallyUpdating', function () {
    this._updater = new PeriodicalExecuter(function(pe) { this.updateAppearance(); }.bind(this), 8);
  });

  add.method('inspect', function () {return this.mirror().inspect();});

  add.method('expander', function () { return this._expander; });

  add.method('updateExpandedness', function () {
    if (! this.world()) {return;}
    var thingies = [this._headerRow];
    if (this._shouldShowAnnotation) { thingies.push(this.annotationMorph()); }
    if (this._shouldShowComment   ) { thingies.push(this.   commentMorph()); }
    if (this.expander().isExpanded()) { thingies.push(this.slotsPanel()); }
    thingies.push(this._evaluatorsPanel);
    this.replaceThingiesWith(thingies);
  });

  add.method('expandCategory', function (c) {
    var expander = c.isRoot() ? this.expander() : this.categoryMorphFor(c).expander();
    expander.expand();
  });

  add.method('eachSlot', function (f) {
    this.mirror().eachFakeSlot(f);
    this.mirror().eachSlotInCategory(this.category(), f);
  });

  add.method('slotMorphFor', function (s) {
    return this._slotMorphs.getOrIfAbsentPut(s.name(), function() { return new SlotMorph(s); });
  });

  add.method('existingCategoryMorphFor', function (c) {
    return this._categoryMorphs.get(c.fullName());
  });

  add.method('categoryMorphFor', function (c) {
    return this._categoryMorphs.getOrIfAbsentPut(c.fullName(), function() { return new CategoryMorph(this, c); }.bind(this));
  });

  add.method('commentMorph', function () {
    var m = this._commentMorph;
    if (m) { return m; }
    var thisOutliner = this;
    return this._commentMorph = createInputBox(function( ) { return thisOutliner.mirror().comment(); },
                                               function(c) { thisOutliner.mirror().setComment(c); });
  });

  add.method('toggleComment', function (evt) {
    this._shouldShowComment = !this._shouldShowComment;
    this.updateExpandedness();
    this.updateAppearance();
    if (this._shouldShowComment) { evt.hand.setKeyboardFocus(this.commentMorph()); }
  });

  add.method('openEvaluator', function (evt) {
    var e = new EvaluatorMorph(this);
    this._evaluatorsPanel.addRow(e);
    evt.hand.setKeyboardFocus(e.textMorph());
  });

  add.method('morphMenu', function (evt) {
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
        menu.addItem([this._shouldShowComment ? "hide comment" : "show comment", function(evt) { this.toggleComment(evt); }.bind(this)]);
      }

      menu.addItem([this._shouldShowAnnotation ? "hide annotation" : "show annotation", function(evt) { this.toggleAnnotation(evt); }.bind(this)]);

      menu.addItem(["set module...", function(evt) {
        var all = {};
        var chooseTargetModule = function(sourceModuleName, evt) {
          transporter.chooseOrCreateAModule(evt, this, function(targetModule, evt) {
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
        whichSlotsMenu.openIn(this.world(), evt.point());
      }.bind(this)]);
    }

    menu.addLine();

    menu.addItem(["well-known references", function(evt) {
      evt.hand.world().outlinerFor(reflect(this.mirror().wellKnownReferences())).grabMe(evt);
    }.bind(this)]);
    
    menu.addItem(["well-known children", function(evt) {
      evt.hand.world().outlinerFor(reflect(this.mirror().wellKnownChildren())).grabMe(evt);
    }.bind(this)]);

    return menu;
  });

  add.method('createChild', function (evt) {
    var child = this.mirror().createChild();
    var childOutliner = this.world().outlinerFor(child);
    childOutliner.grabMe(evt);

    // might as well show the arrow from the child to the parent
    childOutliner.expander().expand();
    var parentSlotMorph = childOutliner.slotMorphFor(child.parentSlot());
    parentSlotMorph.contentsPointer().getModel().setValue(false);
  });

  add.method('acceptsDropping', function (m) { // aaa - could this be generalized?
    return typeof(m.wasJustDroppedOnOutliner) === 'function';
  });

  add.method('justReceivedDrop', function (m) {
    if (this.acceptsDropping(m)) { 
      m.wasJustDroppedOnOutliner(this);
    }
  });

  add.method('onMouseOver', function (evt) {
      //if (evt.hand.submorphs.find(function(m) {return this.morphToGrabOrReceiveDroppingMorph(evt, m);}.bind(this))) {
    if (evt.hand.submorphs.find(function(m) {return this.acceptsDropping(m);}.bind(this))) {
      this.highlighter().setChecked(true);
    }
  });

  add.method('onMouseOut', function (evt) {
    this.highlighter().setChecked(false);
  });

});


thisModule.addSlots(WorldMorph.prototype, function(add) {

  add.method('outliners', function () {
    return this._outliners || (this._outliners = bloodyHashTable.copyRemoveAll());
  });

  add.method('existingOutlinerFor', function (mir) {
    return this.outliners().get(mir);
  });

  add.method('outlinerFor', function (mir) {
    return this.outliners().getOrIfAbsentPut(mir, function() {return new OutlinerMorph(mir);});
  });

  add.method('acceptsDropping', function (m) {
    return typeof m.wasJustDroppedOnWorld === 'function';
  });

  add.method('justReceivedDrop', function (m) {
    if (this.acceptsDropping(m)) { 
      m.wasJustDroppedOnWorld(this);
    }
  });

  add.method('livelyOutlinersWorldMenu', function(evt) {
    var menu = new MenuMorph([], this);
    menu.addItem(["create new object", function(evt) {
      this.outlinerFor(reflect({})).grabMe(evt);
    }]);

    menu.addItem(["get the Global object", function(evt) {
      this.outlinerFor(reflect(Global)).grabMe(evt);
    }]);

    menu.addLine();

    menu.addItem(["file in module...", function(evt) {
      var filenames = new FileDirectory(lobby.transporter.module.urlForModuleDirectory()).filenames().select(function(n) {return n.endsWith(".js");});
      
      var modulesMenu = new MenuMorph(filenames.map(function(n) {return [n, function(evt) {
        var moduleName = n.substring(0, n.length - 3);
        MessageNotifierMorph.showIfErrorDuring(function() { lobby.transporter.module.fileIn(moduleName); }, evt);
      }];}), this);
      
      modulesMenu.openIn(this, evt.point());
    }.bind(this)]);

    menu.addItem(["file out module...", function(evt) {
      var modulesMenu = new MenuMorph([], this);
      lobby.transporter.module.eachModule(function(m) {
        modulesMenu.addItem([m.name(), function(evt) {
          MessageNotifierMorph.showIfErrorDuring(function() { m.fileOut(); }, evt);
        }.bind(this)]);
      }.bind(this));
      modulesMenu.openIn(this, evt.point());
    }.bind(this)]);

    return menu;
  });

});


thisModule.addSlots(transporter, function(add) {

  add.method('chooseOrCreateAModule', function (evt, targetMorph, callback) {
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
    modulesMenu.openIn(targetMorph.world(), evt.point());
  });

});


});
