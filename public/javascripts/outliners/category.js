ColumnMorph.subclass("CategoryMorph", {
  initialize: function($super, outliner, category) {
    $super();
    this._outliner = outliner;
    this._category = category;

    this.horizontalLayoutMode = LayoutModes.SpaceFill;
    this.sPadding = this.fPadding = 5;
    this.closeDnD();
    this.beUngrabbable();

    this._slotsPanel = new ColumnMorph().beInvisible();
    this._slotsPanel.horizontalLayoutMode = LayoutModes.SpaceFill;

    this._highlighter = new BooleanHolder(true).add_observer(function() {this.refillWithAppropriateColor();}.bind(this));
    this._highlighter.setChecked(false);

    this._expander = new ExpanderMorph(this);

    var categoryMorph = this;
    this.titleLabel = new TwoModeTextMorph(pt(5, 10).extent(pt(140, 20)), categoryLastPartName(category));
    this.titleLabel.nameOfEditCommand = "rename";
    this.titleLabel.setFill(null);
    this.titleLabel.morphMenu = function(evt) { return categoryMorph.morphMenu(evt); };
    this.titleLabel.getSavedText = function() { return categoryLastPartName(category); };
    this.titleLabel.setSavedText = function(newName) { if (newName !== this.getSavedText()) { categoryMorph.rename(newName, createFakeEvent()); } };
    this.titleLabel.refreshText();

    this.createHeaderRow();
    this.populateSlotsPanel();

    this.replaceThingiesWith([this._headerRow]);
  },

  outliner: function() { return this._outliner;          },
    mirror: function() { return this._outliner.mirror(); },
  category: function() { return this._category;          },


  // header row

  createHeaderRow: function() {
    var r = this._headerRow = new RowMorph().beInvisible(); // aaa - put underscores in front of the instvars
    this._headerRowSpacer = createSpacer();
    r.fPadding = 3;
    r.horizontalLayoutMode = LayoutModes.SpaceFill;
    r.inspect = function() {return "the header row";};
    this._headerRow.replaceThingiesWith([this._expander, this.titleLabel, this._headerRowSpacer]);
    return r;
  },


  // updating    // aaa - now, can I make this happen automatically? maybe an update process?

  updateAppearance: function() {
    if (! this.world()) {return;}
    this.populateSlotsPanel();
    this.immediateSubcategoryMorphs().each(function(scm) { scm.updateAppearance(); }); // aaa is this gonna cause us to redo a lot of work?
    this.refillWithAppropriateColor();
    this.titleLabel.refreshText();
    this.minimumExtentChanged();
  },


  // inspecting
  inspect: function() {return "category " + this._category + " on " + this.mirror().inspect();},


  // expanding and collapsing

  expander: function() { return this._expander; },

  updateExpandedness: function() {
    if (! this.world()) {return;}
    var thingies = [this._headerRow];
    if (this.expander().isExpanded()) { thingies.push(this._slotsPanel); }
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
    setCategoryLastPartName(this.category(), newName);
    //this.titleLabel.refreshText();
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



// aaa - Where should this stuff live?

function subcategory(cat, subcatName) {
  return cat.concat([subcatName]);
}

function categoryFullName(cat) {
  return cat.join(" ");
}

function categoryLastPartName(cat) {
  if (cat.length === 0) { return ""; }
  return cat[cat.length - 1];
}

function setCategoryLastPartName(cat, newName) {
  if (cat.length === 0) { throw "Cannot rename the root category"; }
  cat[cat.length - 1] = newName;
}

function rootCategory() {
  return [];
}

function categoriesAreEqual(c1, c2) {
  if (c1.length !== c2.length) { return false; }
  for (var i = 0; i < c1.length; i += 1) {
    if (c1[i] !== c2[i]) { return false; }
  }
  return true;
}

function isRootCategory(c) {
  return c.length === 0;
}

function isImmediateSubcategoryOf(c1, c2) {
  if (c1.length !== c2.length - 1) { return false; }
  for (var i = 0; i < c1.length; i += 1) {
    if (c1[i] !== c2[i]) { return false; }
  }
  return true;
}
