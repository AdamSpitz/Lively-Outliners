lobby.transporter.module.create('categories', function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.method('CategoryMorph', function CategoryMorph() { Class.initializer.apply(this, arguments); }, {category: ['outliners']});

  add.method('Category', function Category() { Class.initializer.apply(this, arguments); }, {category: ['outliners']});

  add.creator('CategoryMorphMixin', {}, {category: ['outliners']});

});


thisModule.addSlots(Category, function(add) {

  add.data('superclass', Object);

  add.creator('prototype', {});

  add.data('type', Category);

  add.method('root', function () { return new Category([]); }, {category: ['creating']});

});


thisModule.addSlots(Category.prototype, function(add) {

  add.data('constructor', Category);

  add.method('initialize', function (parts) {
    this._parts = parts;
  }, {category: ['creating']});

  add.method('parts', function () { return this._parts; }, {category: ['accessing']});

  add.method('subcategory', function (subcatName) {
    return new Category(this._parts.concat([subcatName]));
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

});


thisModule.addSlots(CategoryMorphMixin, function(add) {

  add.method('initializeCategoryUI', function () {
    this._highlighter = booleanHolder.containing(true).add_observer(function() {this.refillWithAppropriateColor();}.bind(this));
    this._highlighter.setChecked(false);

    this._expander = new ExpanderMorph(this);

    this._modulesLabel = createLabel(function() {return this.modulesSummaryString();}.bind(this));
    // this._modulesLabel.setFontSize(this._modulesLabel.getFontSize() - 1); // aaa - why does this create a little space at the beginning of the label?
    this._modulesLabelRow = createLeftJustifiedRow([this._modulesLabel], {left: 0, right: 0, top: 0, bottom: 2, between: 0});
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

    var sms = [];
    this.eachSlot(function(s) { sms.push(this.outliner().slotMorphFor(s)); }.bind(this));
    sms.sort(function(sm1, sm2) {return sm1.slot().name() < sm2.slot().name() ? -1 : 1});

    var scms = this.immediateSubcategoryMorphs();
    scms = scms.concat(this._slotsPanel.submorphs.select(function(m) {return m.isNewCategory && ! this.outliner().existingCategoryMorphFor(m.category());}.bind(this)));
    scms.sort(function(scm1, scm2) {return scm1.category().lastPart() < scm2.category().lastPart() ? -1 : 1});
    
    var allSubmorphs = [this._modulesLabelRow];
    sms .each(function(sm ) {allSubmorphs.push(sm );});
    scms.each(function(scm) {allSubmorphs.push(scm);});
    allSubmorphs.each(function(m) { m.horizontalLayoutMode = LayoutModes.SpaceFill; });
    this._slotsPanel.replaceThingiesWith(allSubmorphs);
  }, {category: ['slots panel']});

  add.method('immediateSubcategoryMorphs', function () {
    var scms = [];
    this.mirror().eachImmediateSubcategoryOf(this.category(), function(sc) { scms.push(this.outliner().categoryMorphFor(sc)); }.bind(this));
    return scms;
  }, {category: ['slots panel']});

  add.method('addSlot', function (evt) {
    var name = this.mirror().findUnusedSlotName("slot");
    this.mirror().reflectee()[name] = null;
    var s = this.mirror().slotAt(name);
    s.setCategory(this.category());
    this.outliner().updateAppearance();
    this.outliner().expandCategory(this.category());
    var sm = this.outliner().slotMorphFor(s);
    sm.showSource();
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
    var prefix = n === 1 ? "Module:  " : "Modules:  ";
    return prefix + modules.map(function(m) { return m ? m.name() : '-'; }).sort().join(", ");
  }, {category: ['modules']});

  add.method('calculateAppropriateFill', function () {
    var color = Color.neutral.gray.lighter();
    if (this.highlighter().isChecked()) {color = color.lighter().lighter();}
    return defaultFillWithColor(color);
  }, {category: ['highlighting']});

  add.method('refillWithAppropriateColor', function () {
    this.setFill(this.calculateAppropriateFill());
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

});


thisModule.addSlots(CategoryMorph, function(add) {

  add.data('superclass', ColumnMorph);

  add.creator('prototype', Object.create(ColumnMorph.prototype), {}, {copyDownParents: [{parent: CategoryMorphMixin}]});

  add.data('type', CategoryMorph);

});


thisModule.addSlots(CategoryMorph.prototype, function(add) {

  add.data('constructor', CategoryMorph);

  add.method('initialize', function ($super, outliner, category) {
    $super();
    this._outliner = outliner;
    this._category = category;

    this.setPadding(2);
    this.closeDnD();
    this.beUngrabbable();
    // this.ignoreEvents();  // aaa - This makes grabbing-the-outliner-through-me work, but breaks the category's menu. Can't I have both?

    this.initializeCategoryUI();

    var categoryMorph = this;
    this.titleLabel = new TwoModeTextMorph(pt(5, 10).extent(pt(20, 20)), category.lastPart());
    this.titleLabel.setEmphasis({style: 'italic'});
    this.titleLabel.nameOfEditCommand = "rename";
    this.titleLabel.setFill(null);
    this.titleLabel.backgroundColorWhenWritable = null;
    this.titleLabel.ignoreEvents();

    this.titleLabel.getSavedText = function() { return category.lastPart(); };
    this.titleLabel.setSavedText = function(newName) { categoryMorph.rename(newName, createFakeEvent()); };
    this.titleLabel.refreshText();

    this.createHeaderRow();

    this.replaceThingiesWith([this._headerRow]);
  }, {category: ['creating']});

  add.method('outliner', function () { return this._outliner;          }, {category: ['accessing']});

  add.method('mirror', function () { return this._outliner.mirror(); }, {category: ['accessing']});

  add.method('category', function () { return this._category;          }, {category: ['accessing']});

  add.method('createHeaderRow', function () {
    var r = this._headerRow = new RowMorph().beInvisible(); // aaa - put underscores in front of the instvars
    this._headerRowSpacer = createSpacer();
    r.setPadding({top: 0, bottom: 0, left: 0, right: 0, between: 3});
    r.horizontalLayoutMode = LayoutModes.SpaceFill;
    r.inspect = function() {return "the header row";};
    this._headerRow.replaceThingiesWith([this._expander, this.titleLabel, this._headerRowSpacer]);
    return r;
  }, {category: ['creating']});

  add.method('updateAppearance', function () {
    if (! this.world() || ! this.expander().isExpanded()) {return;}
    this.populateSlotsPanel();
    this._slotsPanel.submorphs.each(function(m) { m.updateAppearance(); }); // aaa is this gonna cause us to redo a lot of work?
    this.refillWithAppropriateColor();
    this.titleLabel.refreshText();
    this._modulesLabel.refreshText();
    this.minimumExtentChanged();
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

  add.method('contextMenu', function (evt) {
    var menu = new MenuMorph([], this);

    if (this.mirror().canHaveSlots()) {
      menu.addSection([["add slot",     function(evt) { this.addSlot    (evt); }.bind(this)]]);
      menu.addSection([["add category", function(evt) { this.addCategory(evt); }.bind(this)]]);
    }

    return menu;
  }, {category: ['menu']});

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

});


});
