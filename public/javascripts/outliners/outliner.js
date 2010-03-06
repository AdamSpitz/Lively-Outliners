ColumnMorph.subclass("OutlinerMorph", {
  initialize: function($super, m) {
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
  },

  mirror: function() { return this._mirror; },

  // aaa - trying to figure out how to factor this and CategoryMorph
  outliner: function() { return this; },
  category: function() { return Category.root(); },


  // header row

  createHeaderRow: function() {
    var r = this._headerRow = new RowMorph().beInvisible(); // aaa - put underscores in front of the instvars
    this._headerRowSpacer = createSpacer();
    r.setPadding({top: 0, bottom: 0, left: 0, right: 0, between: 3});
    r.horizontalLayoutMode = LayoutModes.SpaceFill;
    r.inspect = function() {return "the header row";};
    r.refreshContent = function() { this.refreshHeaderRow(); }.bind(this);
    this.refreshHeaderRow();
    return r;
  },

  refreshHeaderRow: function() {
    var ms = [this._expander, this.titleLabel];
    if (this._shouldShowComment || (this.mirror().comment && this.mirror().comment())) { ms.push(this.commentButton); }
    ms.push(this._headerRowSpacer);
    ms.push(this.evaluatorButton);
    ms.push(this.dismissButton);
    this._headerRow.replaceThingiesWith(ms);
  },


  // annotation

  annotationMorph: function() {
    var m = this._annotationMorph;
    if (m) { return m; }
    m = this._annotationMorph = new ColumnMorph(this).beInvisible();

    // aaa - shouldn't really be a string; do something nicer, some way of specifying a list
    this._copyDownParentsLabel = createInputBox(this.copyDownParentsString.bind(this), this.setCopyDownParentsString.bind(this));
    m.addRow(createLabelledNode("Copy-down parents", this._copyDownParentsLabel));
    return m;
  },

  toggleAnnotation: function(evt) {
    this._shouldShowAnnotation = !this._shouldShowAnnotation;
    this.updateExpandedness();
  },

  copyDownParentsString: function() {
    return reflect(this.mirror().copyDownParents()).expressionEvaluatingToMe();
  },

  setCopyDownParentsString: function(str) {
    MessageNotifierMorph.showIfErrorDuring(function() {
      this.mirror().setCopyDownParents(eval(str));
    }.bind(this), createFakeEvent());
    this.updateAppearance();
  },


  // updating    // aaa - now, can I make this happen automatically? maybe an update process?

  updateAppearance: function() {
    if (! this.world()) {return;}
    this.populateSlotsPanel();
    this._slotsPanel.submorphs.each(function(m) { m.updateAppearance(); }); // aaa is this gonna cause us to redo a lot of work?
    this.refillWithAppropriateColor();
    this.titleLabel.refreshText();
    this._modulesLabel.refreshText();
    if (this._copyDownParentsLabel) {this._copyDownParentsLabel.refreshText();}
    this._headerRow.refreshContent();
    this.minimumExtentChanged();
  },
  
  startPeriodicallyUpdating: function() {
    this._updater = new PeriodicalExecuter(function(pe) { this.updateAppearance(); }.bind(this), 8);
  },


  // inspecting
  inspect: function() {return this.mirror().inspect();},


  // expanding and collapsing

  expander: function() { return this._expander; },

  updateExpandedness: function() {
    if (! this.world()) {return;}
    var thingies = [this._headerRow];
    if (this._shouldShowAnnotation) { thingies.push(this.annotationMorph()); }
    if (this._shouldShowComment   ) { thingies.push(this.   commentMorph()); }
    if (this.expander().isExpanded()) { thingies.push(this.slotsPanel()); }
    thingies.push(this._evaluatorsPanel);
    this.replaceThingiesWith(thingies);
  },

  expandCategory: function(c) {
    var expander = c.isRoot() ? this.expander() : this.categoryMorphFor(c).expander();
    expander.expand();
  },


  // slots

  eachSlot: function(f) {
    this.mirror().eachFakeSlot(f);
    this.mirror().eachSlotInCategory(this.category(), f);
  },

  slotMorphFor: function(s) {
    return this._slotMorphs.getOrIfAbsentPut(s.name(), function() { return new SlotMorph(s); });
  },

  existingCategoryMorphFor: function(c) {
    return this._categoryMorphs.get(c.fullName());
  },

  categoryMorphFor: function(c) {
    return this._categoryMorphs.getOrIfAbsentPut(c.fullName(), function() { return new CategoryMorph(this, c); }.bind(this));
  },

  
  // comments
   
  commentMorph: function() {
    var m = this._commentMorph;
    if (m) { return m; }
    var thisOutliner = this;
    return this._commentMorph = createInputBox(function( ) { return thisOutliner.mirror().comment(); },
                                               function(c) { thisOutliner.mirror().setComment(c); });
  },

  toggleComment: function(evt) {
    this._shouldShowComment = !this._shouldShowComment;
    this.updateExpandedness();
    this.updateAppearance();
    if (this._shouldShowComment) { evt.hand.setKeyboardFocus(this.commentMorph()); }
  },


  // evaluators

  openEvaluator: function(evt) {
    var e = new EvaluatorMorph(this);
    this._evaluatorsPanel.addRow(e);
    evt.hand.setKeyboardFocus(e.textMorph());
  },


  // menu

  morphMenu: function(evt) {
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
          chooseOrCreateAModule(evt, this, function(targetModule, evt) {
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
  },

  createChild: function(evt) {
    var child = this.mirror().createChild();
    var childOutliner = this.world().outlinerFor(child);
    childOutliner.grabMe(evt);

    // might as well show the arrow from the child to the parent
    childOutliner.expander().expand();
    var parentSlotMorph = childOutliner.slotMorphFor(child.parentSlot());
    parentSlotMorph.contentsPointer().getModel().setValue(false);
  },


  // mouse events

  acceptsDropping: function(m) { // aaa - could this be generalized?
    return typeof(m.wasJustDroppedOnOutliner) === 'function';
  },

  justReceivedDrop: function(m) {
    if (this.acceptsDropping(m)) { 
      m.wasJustDroppedOnOutliner(this);
    }
  },

  onMouseOver: function(evt) {
      //if (evt.hand.submorphs.find(function(m) {return this.morphToGrabOrReceiveDroppingMorph(evt, m);}.bind(this))) {
    if (evt.hand.submorphs.find(function(m) {return this.acceptsDropping(m);}.bind(this))) {
      this.highlighter().setChecked(true);
    }
  },

  onMouseOut: function(evt) {
    this.highlighter().setChecked(false);
  },
});

Object.extend(OutlinerMorph.prototype, CanHaveArrowsAttachedToIt);
Object.extend(OutlinerMorph.prototype, CategoryMorphMixin);


// aaa - where should this live? Maybe on the module object, but in the outliners module?
function chooseOrCreateAModule(evt, targetMorph, callback) {
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
}
