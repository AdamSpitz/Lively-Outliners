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
Object.extend(CategoryMorph.prototype, CategoryMixin);



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
