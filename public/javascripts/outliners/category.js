ColumnMorph.subclass("CategoryMorph", {
  initialize: function($super, outliner, category) {
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
    this.titleLabel.nameOfEditCommand = "rename";
    this.titleLabel.setFill(null);
    this.titleLabel.backgroundColorWhenWritable = null;
    this.titleLabel.ignoreEvents();

    this.titleLabel.getSavedText = function() { return category.lastPart(); };
    this.titleLabel.setSavedText = function(newName) { if (newName !== this.getSavedText()) { categoryMorph.rename(newName, createFakeEvent()); } };
    this.titleLabel.refreshText();

    this.createHeaderRow();

    this.replaceThingiesWith([this._headerRow]);
  },

  outliner: function() { return this._outliner;          },
    mirror: function() { return this._outliner.mirror(); },
  category: function() { return this._category;          },


  // header row

  createHeaderRow: function() {
    var r = this._headerRow = new RowMorph().beInvisible(); // aaa - put underscores in front of the instvars
    this._headerRowSpacer = createSpacer();
    r.setPadding({top: 0, bottom: 0, left: 0, right: 0, between: 3});
    r.horizontalLayoutMode = LayoutModes.SpaceFill;
    r.inspect = function() {return "the header row";};
    this._headerRow.replaceThingiesWith([this._expander, this.titleLabel, this._headerRowSpacer]);
    return r;
  },


  // updating    // aaa - now, can I make this happen automatically? maybe an update process?

  updateAppearance: function() {
    if (! this.world() || ! this.expander().isExpanded()) {return;}
    this.populateSlotsPanel();
    this._slotsPanel.submorphs.each(function(m) { m.updateAppearance(); }); // aaa is this gonna cause us to redo a lot of work?
    this.refillWithAppropriateColor();
    this.titleLabel.refreshText();
    this._modulesLabel.refreshText();
    this.minimumExtentChanged();
  },


  // inspecting
  inspect: function() {return "category " + this._category;},


  // expanding and collapsing

  expander: function() { return this._expander; },

  updateExpandedness: function() {
    if (! this.world()) {return;}
    var thingies = [this._headerRow];
    if (this.expander().isExpanded()) { thingies.push(this.slotsPanel()); }
    this.replaceThingiesWith(thingies);
  },


  // slots

  eachSlot: function(f) {
    this.mirror().eachSlotInCategory(this.category(), f);
  },


  // menu

  morphMenu: function(evt) {
    var menu = new MenuMorph([], this);

    if (this.mirror().canHaveSlots()) {
      menu.addSection([["add slot",     function(evt) { this.addSlot    (evt); }.bind(this)]]);
      menu.addSection([["add category", function(evt) { this.addCategory(evt); }.bind(this)]]);
    }

    return menu;
  },
 
  rename: function(newName, evt) {
    this.category().setLastPart(newName);
  },

  // mouse events

  acceptsDropping: function(m) { // aaa - could this be generalized?
    return typeof(m.wasJustDroppedOnCategory) === 'function';
  },

  justReceivedDrop: function(m) {
    if (this.acceptsDropping(m)) { 
      m.wasJustDroppedOnCategory(this);
    }
  },

  onMouseOver: function(evt) {
    if (evt.hand.submorphs.find(function(m) {return this.acceptsDropping(m);}.bind(this))) {
      this.highlighter().setChecked(true);
    }
  },

  onMouseOut: function(evt) {
    this.highlighter().setChecked(false);
  },
});



// aaa - Where should this stuff live? The problem is that I want to use naked arrays
// in the annotation, so that it's just dumb data. Maybe just create a Category
// object that's a wrapper around the array, or something. Yeah, I can always cache them
// if they turn out to take a lot of memory or something.

Object.subclass("Category", {
  initialize: function(parts) {
    this._parts = parts;
  },

  parts: function() { return this._parts; },
      
  subcategory: function(subcatName) {
    return new Category(this._parts.concat([subcatName]));
  },

  fullName: function() {
    return this._parts.join(" ");
  },

  lastPart: function() {
    if (this.isRoot()) { return ""; }
    return this._parts[this._parts.length - 1];
  },

  setLastPart: function(newName) {
    if (this.isRoot()) { throw "Cannot rename the root category"; }
    this._parts[this._parts.length - 1] = newName;
  },

  isRoot: function() {
    return this._parts.length === 0;
  },

  equals: function(c) {
    if (this.parts().length !== c.parts().length) { return false; }
    return this.isEqualToOrSubcategoryOf(c);
  },

  isImmediateSubcategoryOf: function(c) {
    if (this.parts().length !== c.parts().length + 1) { return false; }
    return this.isEqualToOrSubcategoryOf(c);
  },

  isEqualToOrSubcategoryOf: function(c) {
    if (this.parts().length < c.parts().length) { return false; }
    for (var i = 0; i < c.parts().length; i += 1) {
      if (this.parts()[i] !== c.parts()[i]) { return false; }
    }
    return true;
  },
});

Object.extend(Category, {
  root: function() { return new Category([]); },
});

CategoryMorphMixin = {
  initializeCategoryUI: function() {
    this._highlighter = booleanHolder.containing(true).add_observer(function() {this.refillWithAppropriateColor();}.bind(this));
    this._highlighter.setChecked(false);

    this._expander = new ExpanderMorph(this);

    this._modulesLabel = createLabel(function() {return this.modulesSummaryString();}.bind(this));
    this._modulesLabelRow = createLeftJustifiedRow([this._modulesLabel], {left: 0, right: 0, top: 0, bottom: 2, between: 0});
    this._modulesLabelRow.updateAppearance = function() {this._modulesLabel.refreshText();}.bind(this);
  },

  slotsPanel: function() {
    var sp = this._slotsPanel;
    if (sp) { return sp; }
    sp = this._slotsPanel = new ColumnMorph().beInvisible();
    sp.setPadding({top: 0, bottom: 0, left: 10, right: 0, between: 0});
    sp.horizontalLayoutMode = LayoutModes.SpaceFill;
    this.populateSlotsPanel();
    return sp;
  },

  populateSlotsPanel: function() {
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
  },

  immediateSubcategoryMorphs: function() {
    var scms = [];
    this.mirror().eachImmediateSubcategoryOf(this.category(), function(sc) { scms.push(this.outliner().categoryMorphFor(sc)); }.bind(this));
    return scms;
  },

  addSlot: function(evt) {
    var name = this.mirror().findUnusedSlotName("slot");
    this.mirror().reflectee()[name] = null;
    var s = this.mirror().slotAt(name);
    s.setCategory(this.category());
    this.outliner().updateAppearance();
    this.outliner().expandCategory(this.category());
    var sm = this.outliner().slotMorphFor(s);
    sm.toggleSource();
    sm.labelMorph.beWritableAndSelectAll();
  },

  addCategory: function(evt) {
    this.updateAppearance();
    this.expander().expand();
    var cm = new CategoryMorph(this.outliner(), this.category().subcategory(""));
    cm.isNewCategory = true;
    cm.horizontalLayoutMode = LayoutModes.SpaceFill;
    this.slotsPanel().addRow(cm);
    cm.titleLabel.beWritableAndSelectAll();
  },

  eachNormalSlotInMeAndSubcategories: function(f) {
    this.mirror().eachSlotNestedSomewhereUnderCategory(this.category(), f);
  },

  modules: function() {
    var modules = [];
    this.eachNormalSlotInMeAndSubcategories(function(s) {
      var m = s.module();
      if (! modules.include(m)) { modules.push(m); }
    });
    return modules;
  },

  modulesSummaryString: function() {
    var modules = this.modules();
    var prefix = modules.length === 0 ? "No slots" : modules.length === 1 ? "Module:  " : "Modules:  ";
    return prefix + modules.map(function(m) { return m ? m.name() : '-'; }).sort().join(", ");
  },


  // color

  calculateAppropriateFill: function() {
    var color = Color.neutral.gray.lighter();
    if (this.highlighter().isChecked()) {color = color.lighter().lighter();}
    return defaultFillWithColor(color);
  },

  refillWithAppropriateColor: function() {
    this.setFill(this.calculateAppropriateFill());
  },

  highlighter: function() { return this._highlighter; },
};


Object.extend(CategoryMorph.prototype, CategoryMorphMixin);
