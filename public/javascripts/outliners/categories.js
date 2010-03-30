lobby.transporter.module.create('categories', function(requires) {

requires('lk_ext', 'rows_and_columns');

}, function(thisModule) {


thisModule.addSlots(modules.categories, function(add) {
    
    add.data('_directory', 'outliners');

});


thisModule.addSlots(lobby, function(add) {

  add.method('CategoryMorph', function CategoryMorph() { Class.initializer.apply(this, arguments); }, {category: ['outliners']});

  add.method('Category', function Category() { Class.initializer.apply(this, arguments); }, {category: ['outliners']});

  add.creator('CategoryMorphMixin', {}, {category: ['outliners']});

});


thisModule.addSlots(Category, function(add) {

  add.data('superclass', Object);

  add.creator('prototype', {});

  add.data('type', 'Category');

  add.method('root', function () { return new Category([]); }, {category: ['creating']});

});


thisModule.addSlots(Category.prototype, function(add) {

  add.data('constructor', Category);

  add.method('initialize', function (parts) {
    this._parts = parts;
  }, {category: ['creating']});

  add.method('parts', function () { return this._parts; }, {category: ['accessing']});

  add.method('supercategory', function () {
    return new Category(this._parts.slice(0, this._parts.length - 1));
  }, {category: ['creating']});

  add.method('subcategory', function (subcatName) {
    return new Category(this._parts.concat([subcatName]));
  }, {category: ['creating']});

  add.method('concat', function (otherCat) {
    return new Category(this._parts.concat(otherCat.parts()));
  }, {category: ['creating']});

  add.method('withoutFirstParts', function (n) {
    return new Category(this._parts.slice(n));
  }, {category: ['creating']});

  add.method('toString', function () { return this.fullName(); }, {category: ['printing']});

  add.method('fullName', function () {
    return this._parts.join(" ");
  }, {category: ['accessing']});

  add.method('part', function (i) {
    if (this.isRoot()) { return ""; }
    return this._parts[i];
  }, {category: ['accessing']});

  add.method('lastPart', function () {
    return this.part(this._parts.length - 1);
  }, {category: ['accessing']});

  add.method('setLastPart', function (newName) {
    if (this.isRoot()) { throw "Cannot rename the root category"; }
    this._parts[this._parts.length - 1] = newName;
  }, {category: ['accessing']});

  add.method('isRoot', function () {
    return this._parts.length === 0;
  }, {category: ['testing']});

  add.method('equals', function (c) {
    if (this.parts().length !== c.parts().length) { return false; }
    return this.isEqualToOrSubcategoryOf(c);
  }, {category: ['comparing']});

  add.method('isImmediateSubcategoryOf', function (c) {
    if (this.parts().length !== c.parts().length + 1) { return false; }
    return this.isEqualToOrSubcategoryOf(c);
  }, {category: ['comparing']});

  add.method('isSubcategoryOf', function (c) {
    if (this.parts().length <= c.parts().length) { return false; }
    return this.isEqualToOrSubcategoryOf(c);
  }, {category: ['comparing']});

  add.method('isEqualToOrSubcategoryOf', function (c) {
    if (this.parts().length < c.parts().length) { return false; }
    for (var i = 0; i < c.parts().length; i += 1) {
      if (this.parts()[i] !== c.parts()[i]) { return false; }
    }
    return true;
  }, {category: ['comparing']});

  add.method('copySlots', function (sourceMir, targetMir, targetCat) {
    targetCat = targetCat || Category.root();
    var numPartsToLopOffTheBeginning = this.parts().length - 1;
    if (numPartsToLopOffTheBeginning < 0) { throw "something is wrong - can't copy the root category"; } // aaa - wait, why not?

    sourceMir.eachSlotNestedSomewhereUnderCategory(this, function(slot) {
      var newSlot = slot.copyTo(targetMir);
      var newCategory = targetCat.concat(slot.category().withoutFirstParts(numPartsToLopOffTheBeginning));
      newSlot.setCategory(newCategory);
    }.bind(this));
    return targetCat.concat(this.withoutFirstParts(numPartsToLopOffTheBeginning));
  }, {category: ['copying']});

  add.method('removeSlots', function (mir) {
    mir.eachSlotNestedSomewhereUnderCategory(this, function(slot) {
      slot.remove();
    }.bind(this));
  }, {category: ['removing']});

});


thisModule.addSlots(CategoryMorphMixin, function(add) {

  add.method('initializeCategoryUI', function () {
    this._highlighter = booleanHolder.containing(true).add_observer(function() {this.updateHighlighting();}.bind(this));
    this._highlighter.setChecked(false);

    this._expander = new ExpanderMorph(this);

    this._modulesLabel = TextMorph.createLabel(function() {return this.modulesSummaryString();}.bind(this));
    // this._modulesLabel.setFontSize(this._modulesLabel.getFontSize() - 1); // aaa - why does this create a little space at the beginning of the label?
    this._modulesLabelRow = RowMorph.createSpaceFilling([this._modulesLabel], {left: 0, right: 0, top: 0, bottom: 2, between: 0});
    this._modulesLabelRow.updateAppearance = function() {this._modulesLabel.refreshText();}.bind(this);
  }, {category: ['initializing']});

  add.method('expander', function () { return this._expander; }, {category: ['expanding and collapsing']});

  add.method('expand', function () {
    this.expander().expand();
  }, {category: ['expanding and collapsing']});

  add.method('collapse', function () {
    this.expander().collapse();
  }, {category: ['expanding and collapsing']});

  add.method('slotsPanel', function () {
    var sp = this._slotsPanel;
    if (sp) { return sp; }
    sp = this._slotsPanel = new ColumnMorph().beInvisible();
    sp.setPadding({top: 0, bottom: 0, left: 10, right: 0, between: 0});
    sp.horizontalLayoutMode = LayoutModes.SpaceFill;
    this.populateSlotsPanel();
    return sp;
  }, {category: ['slots panel']});

  add.method('populateSlotsPanel', function () {
    if (! this._slotsPanel) { return this.slotsPanel(); } // that'll end up calling back here
    
    var outliner = this.outliner();

    var sms = [];
    this.eachSlot(function(s) { sms.push(outliner.slotMorphFor(s)); });
    sms.sort(function(sm1, sm2) {
      var n1 = sm1.slot().name();
      if (n1 === '__proto__') return -1;
      var n2 = sm2.slot().name();
      if (n2 === '__proto__') return  1;
      return n1 < n2 ? -1 : n1 === n2 ? 0 : 1;
    });

    var scms = this.immediateSubcategoryMorphs();
    scms = scms.concat(this._slotsPanel.submorphs.select(function(m) {return m.isNewCategory && ! this.outliner().existingCategoryMorphFor(m.category());}.bind(this)));
    scms.sort(function(scm1, scm2) {return scm1.category().lastPart() < scm2.category().lastPart() ? -1 : 1;});
    
    var allSubmorphs = [this._modulesLabelRow];
    sms .each(function(sm ) {allSubmorphs.push(sm );});
    scms.each(function(scm) {allSubmorphs.push(scm);});
    allSubmorphs.each(function(m) { m.horizontalLayoutMode = LayoutModes.SpaceFill; });
    this._slotsPanel.setRows(allSubmorphs);
  }, {category: ['slots panel']});

  add.method('immediateSubcategoryMorphs', function () {
    var scms = [];
    this.eachImmediateSubcategoryMorph(function(scm) { scms.push(scm); });
    return scms;
  }, {category: ['slots panel']});

  add.method('eachImmediateSubcategoryMorph', function (f) {
    this.mirror().eachImmediateSubcategoryOf(this.category(), function(sc) { f(this.outliner().categoryMorphFor(sc)); }.bind(this));
  }, {category: ['slots panel']});

  add.method('populateSlotsPanelInMeAndExistingSubcategoryMorphs', function () {
    if (! this.expander().isExpanded()) { return; }
    this.populateSlotsPanel();
    this._slotsPanel.submorphs.each(function(m) { if (m.constructor === CategoryMorph) { m.populateSlotsPanelInMeAndExistingSubcategoryMorphs(); } });
  }, {category: ['updating']});

  add.method('addSlot', function (initialContents, evt) {
    var name = this.mirror().findUnusedSlotName("slot");
    this.mirror().reflectee()[name] = initialContents;
    var s = this.mirror().slotAt(name);
    s.setCategory(this.category());
    this.outliner().updateAppearance();
    this.outliner().expandCategory(this.category());
    var sm = this.outliner().slotMorphFor(s);
    sm.showSource(evt);
    sm.labelMorph.beWritableAndSelectAll();
  }, {category: ['adding']});

  add.method('addCategory', function (evt) {
    this.updateAppearance();
    this.expander().expand();
    var cm = new CategoryMorph(this.outliner(), this.category().subcategory(""));
    cm.isNewCategory = true;
    cm.horizontalLayoutMode = LayoutModes.SpaceFill;
    this.slotsPanel().addRow(cm);
    cm.titleLabel.beWritableAndSelectAll();
  }, {category: ['adding']});

  add.method('eachNormalSlotInMeAndSubcategories', function (f) {
    this.mirror().eachSlotNestedSomewhereUnderCategory(this.category(), f);
  }, {category: ['iterating']});

  add.method('modules', function () {
    var modules = [];
    this.eachNormalSlotInMeAndSubcategories(function(s) {
      if (! s.isFromACopyDownParent()) {
        var m = s.module();
        if (! modules.include(m)) { modules.push(m); }
      }
    });
    return modules;
  }, {category: ['modules']});

  add.method('modulesSummaryString', function () {
    var modules = this.modules();
    var n = modules.length;
    if (n === 0) { return "No filed-out slots"; }
    if (n >=  5) { return n + " modules"; }
    var s = stringBuffer.create(n === 1 ? "Module:  " : "Modules:  ");
    var sep = "";
    modules.map(function(m) { return m ? m.name() : '-'; }).sort().each(function(name) {
      s.append(sep).append(name);
      sep = ", ";
    });
    return s.toString();
  }, {category: ['modules']});

  add.method('updateHighlighting', function () {
    if (this.highlighter().isChecked()) {
      if (this._baseColor === undefined) {
        this._baseColor = baseColorOf(this.getFill());
        if (this._baseColor === null) {
          this.setFill(Color.white);
          this.setFillOpacity(0.7);
        } else {
          this.setFill(defaultFillWithColor(this._baseColor.lighter().lighter()));
        }
      }
    } else {
      if (this._baseColor !== undefined) {
        this.setFill(defaultFillWithColor(this._baseColor));
        delete this._baseColor;
      }
    }
  }, {category: ['highlighting']});

  add.method('highlighter', function () { return this._highlighter; }, {category: ['highlighting']});

  add.method('onMouseOver', function (evt) {
    if (evt.hand.submorphs.find(function(m) {return this.acceptsDropping(m);}.bind(this))) {
      this.highlighter().setChecked(true);
    }
  }, {category: ['highlighting']});

  add.method('onMouseOut', function (evt) {
    this.highlighter().setChecked(false);
  }, {category: ['highlighting']});

  add.method('addCategoryCommandsTo', function (cmdList) {
    if (this.mirror().canHaveSlots()) {
      cmdList.addSection([{ label: "add attribute", go: function(evt) { this.addSlot    (null,          evt); }.bind(this) },
                          { label: "add function",  go: function(evt) { this.addSlot    (function() {}, evt); }.bind(this) }]);
      cmdList.addSection([{ label: "add category",  go: function(evt) { this.addCategory(               evt); }.bind(this) }]);

      if (!this.category().isRoot()) {
        cmdList.addLine();

        cmdList.addItem({label: "copy", go: function(evt) { this.grabCopy(evt); }.bind(this)});
      
        cmdList.addItem({label: "move", go: function(evt) {
          this.grabCopy(evt);
          this.category().removeSlots(this.mirror());
          var outliner = this.outliner();
          if (outliner) { outliner.updateAppearance(); }
        }.bind(this)});
      }
    }
  }, {category: ['menu']});

});


thisModule.addSlots(CategoryMorph, function(add) {

  add.data('superclass', ColumnMorph);

  add.creator('prototype', Object.create(ColumnMorph.prototype), {}, {copyDownParents: [{parent: CategoryMorphMixin}]});

  add.data('type', 'CategoryMorph');

});

thisModule.addSlots(CategoryMorph.prototype, function(add) {

  add.data('constructor', CategoryMorph);

  add.method('initialize', function ($super, outliner, category) {
    $super();
    this._outliner = outliner;
    this._category = category;

    this.setPadding({top: 0, bottom: 0, left: 2, right: 2, between: 2});
    this.closeDnD();
    this.beUngrabbable();
    // this.ignoreEvents();  // aaa - This makes grabbing-the-outliner-through-me work, but breaks the category's menu. Can't I have both?

    this.setFill(null);

    this.initializeCategoryUI();

    var categoryMorph = this;
    this.titleLabel = new TwoModeTextMorph(pt(5, 10).extent(pt(20, 20)),
                                           category.lastPart(), 
                                           function( ) { return category.lastPart(); },
                                           function(n) { categoryMorph.rename(n, createFakeEvent()); });
    this.titleLabel.setEmphasis({style: 'italic'});
    this.titleLabel.nameOfEditCommand = "rename";
    this.titleLabel.backgroundColorWhenWritable = null;
    this.titleLabel.ignoreEvents();

    this._headerRow = RowMorph.createSpaceFilling([this._expander, this.titleLabel],
                                                  {top: 0, bottom: 0, left: 0, right: 0, between: 3});
    this.replaceThingiesWith([this._headerRow]);
  }, {category: ['creating']});

  add.method('outliner', function () { return this._outliner;          }, {category: ['accessing']});

  add.method('mirror', function () { return this._outliner.mirror(); }, {category: ['accessing']});

  add.method('category', function () { return this._category;          }, {category: ['accessing']});

  add.data('grabsShouldFallThrough', true, {category: ['grabbing']});

  add.method('updateAppearance', function () {
    if (! this.world() || ! this.expander().isExpanded()) {return;}
    this.populateSlotsPanel();
    this._slotsPanel.submorphs.each(function(m) { m.updateAppearance(); }); // aaa is this gonna cause us to redo a lot of work?
  }, {category: ['updating']});

  add.method('inspect', function () {return this._category.toString();}, {category: ['printing']});

  add.method('updateExpandedness', function () {
    if (! this.world()) {return;}
    var thingies = [this._headerRow];
    if (this.expander().isExpanded()) { thingies.push(this.slotsPanel()); }
    this.replaceThingiesWith(thingies);
  }, {category: ['updating']});

  add.method('eachSlot', function (f) {
    this.mirror().eachSlotInCategory(this.category(), f);
  }, {category: ['iterating']});

  add.method('rename', function (newName, evt) {
    this.category().setLastPart(newName);
    // aaa - if this thing has any slots already in it, gotta recategorize them
  }, {category: ['renaming']});

  add.method('acceptsDropping', function (m) { // aaa - could this be generalized?
    return typeof(m.wasJustDroppedOnCategory) === 'function';
  }, {category: ['drag and drop']});

  add.method('justReceivedDrop', function (m) {
    if (this.acceptsDropping(m)) { 
      m.wasJustDroppedOnCategory(this);
    }
  }, {category: ['drag and drop']});

  add.method('constructUIStateMemento', function () {
    return { isExpanded: this.expander().isExpanded() };
  }, {category: ['UI state']});

  add.method('assumeUIState', function (uiState, evt) {
    this.expander().setExpanded(uiState.isExpanded);
  }, {category: ['UI state']});

  add.method('addCommandsTo', function (cmdList) {
    this.addCategoryCommandsTo(cmdList);
  }, {category: ['menu']});

  add.method('grabCopy', function (evt) {
    var newMirror = reflect({});
    var newCategory = this.category().copySlots(this.mirror(), newMirror);
    var newCategoryMorph = new CategoryMorph(evt.hand.world().morphFor(newMirror), newCategory);
    newCategoryMorph.setFill(defaultFillWithColor(Color.gray));
    newCategoryMorph.horizontalLayoutMode = LayoutModes.ShrinkWrap;
    newCategoryMorph.forceLayoutRejiggering();
    evt.hand.grabMorphWithoutAskingPermission(newCategoryMorph, evt);
    return newCategoryMorph;
  }, {category: ['drag and drop']});

  add.method('wasJustDroppedOnOutliner', function (outliner) {
    var newCategory = this.category().copySlots(this.mirror(), outliner.mirror());
    outliner.expandCategory(newCategory);
    this.remove();
    outliner.updateAppearance();
  }, {category: ['drag and drop']});

  add.method('wasJustDroppedOnCategory', function (categoryMorph) {
    var newCategory = this.category().copySlots(this.mirror(), categoryMorph.outliner().mirror(), categoryMorph.category());
    categoryMorph.outliner().expandCategory(newCategory);
    this.remove();
    categoryMorph.outliner().updateAppearance();
  }, {category: ['drag and drop']});

  add.method('wasJustDroppedOnWorld', function (world) {
    var outliner = world.morphFor(this.mirror());
    world.addMorphAt(outliner, this.position());
    outliner.expandCategory(this.category());
    this.remove();
  }, {category: ['drag and drop']});

});



});
